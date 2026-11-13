'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function quem() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, id: user?.id ?? null };
}

// O aluno marca a aula como concluída; o dia conta como dia de estudo
export async function concluirAula(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  const aula = String(f.get('aula_id') ?? '');
  const minutos = parseInt(String(f.get('minutos') ?? '15'), 10) || 15;
  const { error } = await supabase.from('progresso_aulas').insert({ aluno_id: id, aula_id: aula });
  if (!error) await supabase.rpc('registrar_estudo', { p_minutos: minutos });
  revalidatePath('/aluno', 'layout');
}

export async function desmarcarAula(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  await supabase.from('progresso_aulas').delete().eq('aluno_id', id).eq('aula_id', String(f.get('aula_id') ?? ''));
  revalidatePath('/aluno', 'layout');
}

export async function trocarTrilha(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  const trilha = String(f.get('trilha') ?? '');
  if (!id || (trilha !== 'gabaritar' && trilha !== 'ir_bem')) return;
  await supabase.from('perfis').update({ trilha }).eq('id', id);
  revalidatePath('/aluno', 'layout');
}

// ---------- Dúvidas (só o professor vê) ----------
export type ResAluno = { ok?: string; erro?: string };

export async function enviarDuvida(_: ResAluno, f: FormData): Promise<ResAluno> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const aula = String(f.get('aula_id') ?? '');
  const { error } = await supabase.rpc('enviar_duvida', {
    p_aula: aula || null,
    p_texto: String(f.get('texto') ?? ''),
    p_contexto: String(f.get('contexto') ?? '') || null,
  });
  if (error) return { erro: error.message };
  revalidatePath('/aluno/duvidas');
  return { ok: 'Dúvida enviada ao professor. A resposta aparece em "Minhas dúvidas".' };
}

export async function avaliarResposta(_: ResAluno, f: FormData): Promise<ResAluno> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const entendeu = f.get('entendeu') === 'sim';
  const { error } = await supabase.rpc('avaliar_resposta', {
    p_duvida: String(f.get('duvida_id') ?? ''),
    p_entendeu: entendeu,
    p_texto: String(f.get('texto') ?? '') || null,
  });
  if (error) return { erro: error.message };
  revalidatePath('/aluno', 'layout');
  return { ok: entendeu ? 'Que bom! Dúvida marcada como sanada.' : 'Avisamos o professor que a resposta ainda não ficou clara.' };
}

// ---------- Banco de questões ----------
export type Correcao = { acertou: boolean; resposta: string; comentario: string | null; video_url: string | null; primeira: boolean; vezes?: number; acertos?: number };

export async function responderQuestao(questao: string, letra: string, lista?: string | null): Promise<{ erro?: string; correcao?: Correcao }> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  let { data, error } = await supabase.rpc('responder_questao', { p_questao: questao, p_letra: letra, p_lista: lista ?? null });
  // antes da atualização 0010 a função só tinha dois parâmetros
  if (error && (error.code === 'PGRST202' || /p_lista/.test(error.message))) {
    ({ data, error } = await supabase.rpc('responder_questao', { p_questao: questao, p_letra: letra }));
  }
  if (error) return { erro: error.message };
  const correcao = ((data ?? []) as Correcao[])[0];
  revalidatePath('/aluno/questoes', 'layout');
  return { correcao };
}

export async function alternarRanking(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  await supabase.from('perfis').update({ participa_ranking: f.get('participar') === 'sim' }).eq('id', id);
  revalidatePath('/aluno', 'layout');
}

// ---------- Listas sob medida ----------
export async function criarLista(_: ResAluno, f: FormData): Promise<ResAluno> {
  const { supabase, id } = await quem();
  if (!id) return { erro: 'Faça login de novo.' };
  const v = (k: string) => String(f.get(k) ?? '').trim() || null;
  const modulo = v('m');
  const base = {
    p_qtd: parseInt(v('qtd') ?? '10', 10) || 10,
    p_habilidade: v('h'), p_assunto: v('a'), p_modulo: modulo ? parseInt(modulo, 10) : null,
    p_nivel: v('n'), p_origem: v('o'), p_somente_novas: f.get('novas') === 'on',
  };
  let { data, error } = await supabase.rpc('gerar_lista', { ...base, p_area: v('area'), p_disciplina: v('d'), p_idioma: v('i') });
  // antes da atualização 0011 do banco a função não tinha área, disciplina nem idioma
  if (error && (error.code === 'PGRST202' || /p_area/.test(error.message))) ({ data, error } = await supabase.rpc('gerar_lista', base));
  if (error || !data) return { erro: error?.message ?? 'Não foi possível montar a lista.' };
  revalidatePath('/aluno/questoes', 'layout');
  redirect(`/aluno/questoes/lista/${data}`);
}

export async function apagarLista(f: FormData): Promise<void> {
  const { supabase, id } = await quem();
  if (!id) return;
  await supabase.from('listas_questoes').delete().eq('id', String(f.get('id') ?? '')).eq('aluno_id', id);
  revalidatePath('/aluno/questoes', 'layout');
}
