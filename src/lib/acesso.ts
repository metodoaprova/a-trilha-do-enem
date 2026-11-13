import { cache } from 'react';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { exigirLogin } from '@/lib/sessao';

// O que a pessoa pode usar:
// • curso    = matrícula ativa no Gabarito em 15 (aulas, simulados, habilidades, dúvidas…)
// • completo = banco de questões sem limite (quem tem o curso ou comprou o banco completo)
// • grátis   = conta sem matrícula: banco com limite de questões por dia
export type Acesso = { curso: boolean; completo: boolean; usadasHoje: number; limiteDia: number; listaMax: number };

export async function lerAcesso(supabase: SupabaseClient): Promise<Acesso> {
  const [{ data: curso }, { data: sit, error }] = await Promise.all([
    supabase.rpc('tem_matricula_ativa'),
    supabase.rpc('banco_situacao'),
  ]);
  const temCurso = curso === true;
  const s = ((sit ?? []) as { completo: boolean; usadas_hoje: number; limite_dia: number; lista_max: number }[])[0];
  // antes da atualização 0011 do banco: tudo como antes (só quem tem o curso usa o banco)
  if (error || !s) return { curso: temCurso, completo: temCurso, usadasHoje: 0, limiteDia: 0, listaMax: 45 };
  return { curso: temCurso, completo: s.completo || temCurso, usadasHoje: s.usadas_hoje, limiteDia: s.limite_dia, listaMax: s.completo || temCurso ? 45 : s.lista_max };
}

export const acessoAtual = cache(async () => {
  const sessao = await exigirLogin();
  return { ...sessao, acesso: await lerAcesso(sessao.supabase) };
});

// páginas do curso: quem não tem o curso volta para o início
export async function exigirCurso() {
  const s = await acessoAtual();
  if (!s.acesso.curso && s.perfil.papel !== 'professor') redirect('/aluno');
  return s;
}

export const AREAS: Record<string, string> = { linguagens: 'Linguagens', humanas: 'Ciências Humanas', natureza: 'Ciências da Natureza', matematica: 'Matemática' };
export const AREAS_CURTO: Record<string, string> = { linguagens: 'Linguagens', humanas: 'Humanas', natureza: 'Natureza', matematica: 'Matemática' };
export const IDIOMAS: Record<string, string> = { ingles: 'Inglês', espanhol: 'Espanhol' };
