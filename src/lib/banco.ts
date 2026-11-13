import type { SupabaseClient } from '@supabase/supabase-js';
import { minhasTentativas } from '@/lib/questao';

export type FiltroBanco = { ar?: string; d?: string; i?: string; h?: string; a?: string; n?: string; o?: string; s?: string; m?: string };
export type QuestaoLista = { id: string; codigo: string; origem: string; ano: number | null; habilidade: string | null; assunto: string | null; nivel: string | null; area?: string; disciplina?: string | null; idioma?: string | null };
export type MinhaResposta = { questao_id: string; acertou: boolean };

// Questões publicadas que batem com os filtros e o resultado da última tentativa do aluno em cada uma
export async function buscarQuestoes(supabase: SupabaseClient, alunoId: string, f: FiltroBanco) {
  const montar = (campos: string, comArea: boolean) => {
    let q = supabase.from('questoes').select(campos).order('codigo').limit(5000);
    if (comArea && f.ar) q = q.eq('area', f.ar);
    if (comArea && f.d) q = q.eq('disciplina', f.d);
    if (comArea && f.i) q = q.or(`idioma.is.null,idioma.eq.${f.i === 'espanhol' ? 'espanhol' : 'ingles'}`);
    if (f.h) q = q.eq('habilidade', f.h);
    if (f.a) q = q.eq('assunto', f.a);
    if (f.n) q = q.eq('nivel', f.n);
    if (f.o) q = q.eq('origem', f.o);
    if (f.m && /^\d{1,2}$/.test(f.m)) q = q.eq('modulo', parseInt(f.m, 10));
    return q;
  };
  const base = 'id, codigo, origem, ano, habilidade, assunto, nivel';
  const [res, tentativas] = await Promise.all([montar(`${base}, area, disciplina, idioma`, true), minhasTentativas(supabase, alunoId)]);
  // antes da atualização 0011 do banco não existem as colunas de área
  const { data } = res.error ? await montar(base, false) : res;
  const minhas = new Map<string, MinhaResposta>();
  tentativas.forEach((t) => { if (!minhas.has(t.questao_id)) minhas.set(t.questao_id, { questao_id: t.questao_id, acertou: t.acertou }); });
  let lista = (data ?? []) as unknown as QuestaoLista[];
  if (f.s === 'nao_feitas') lista = lista.filter((x) => !minhas.has(x.id));
  if (f.s === 'erradas') lista = lista.filter((x) => minhas.get(x.id)?.acertou === false);
  if (f.s === 'acertadas') lista = lista.filter((x) => minhas.get(x.id)?.acertou === true);
  return { lista, minhas };
}

export function filtroDaUrl(sp: Record<string, string | undefined>): FiltroBanco {
  const limpo = (v?: string) => (v && v.length <= 80 ? v : undefined);
  return { ar: limpo(sp.ar), d: limpo(sp.d), i: limpo(sp.i), h: limpo(sp.h), a: limpo(sp.a), n: limpo(sp.n), o: limpo(sp.o), s: limpo(sp.s), m: limpo(sp.m) };
}

export function urlFiltro(f: FiltroBanco, extra: Record<string, string> = {}) {
  const p = new URLSearchParams();
  Object.entries({ ...f, ...extra }).forEach(([k, v]) => { if (v) p.set(k, v); });
  const t = p.toString();
  return t ? `?${t}` : '';
}
