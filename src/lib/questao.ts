import type { SupabaseClient } from '@supabase/supabase-js';

export type ResolucaoQuestao = { resposta: string; comentario: string | null; video_url: string | null; minha_letra: string; acertou: boolean };
export type QuestaoCompleta = {
  id: string; codigo: string; origem: string; ano: number | null; aplicacao: string | null; numero_prova: number | null;
  enunciado: string; formato: string; alt_a: string; alt_b: string; alt_c: string; alt_d: string; alt_e: string;
  habilidade: string | null; assunto: string | null; nivel: string | null; respondidas: number; acertadas: number;
  area?: string; disciplina?: string | null; idioma?: string | null;
  imagem: string | null;      // recorte original da prova (link temporário)
  figuras: string[];          // figuras do texto (links temporários)
  resolucao: ResolucaoQuestao | null;   // só dentro de uma lista: a resposta que o aluno deu nela
  historico: Historico;                 // quantas vezes o aluno já fez a questão (banco e listas)
};
export type Historico = { vezes: number; acertos: number; ultima: boolean | null };
const SEM_HISTORICO: Historico = { vezes: 0, acertos: 0, ultima: null };

type Tentativa = { questao_id: string; acertou: boolean; lista_id?: string | null; respondida_em?: string };

// Todas as tentativas do aluno (mais recente primeiro). Antes da atualização 0010, usa só a primeira resposta.
export async function minhasTentativas(supabase: SupabaseClient, alunoId: string, ids?: string[]): Promise<Tentativa[]> {
  let q = supabase.from('tentativas_questoes').select('questao_id, acertou, lista_id, respondida_em').eq('aluno_id', alunoId)
    .order('respondida_em', { ascending: false }).limit(5000);
  if (ids) q = q.in('questao_id', ids);
  const { data, error } = await q;
  if (!error) return (data ?? []) as Tentativa[];
  let r = supabase.from('respostas_questoes').select('questao_id, acertou').eq('aluno_id', alunoId);
  if (ids) r = r.in('questao_id', ids);
  const { data: velhas } = await r;
  return ((velhas ?? []) as Tentativa[]).map((t) => ({ ...t, lista_id: null }));
}

export function historicoPorQuestao(tentativas: Tentativa[]): Map<string, Historico> {
  const m = new Map<string, Historico>();
  for (const t of tentativas) {   // já vem da mais recente para a mais antiga
    const h = m.get(t.questao_id) ?? { vezes: 0, acertos: 0, ultima: t.acertou };
    h.vezes += 1; if (t.acertou) h.acertos += 1;
    m.set(t.questao_id, h);
  }
  return m;
}

// Respostas dadas dentro de cada lista (questão → acertou). Antes da 0010, usa a primeira resposta do aluno.
export async function respostasDasListas(supabase: SupabaseClient, alunoId: string, listas: { id: string; questoes: string[] }[]) {
  const out = new Map<string, Map<string, boolean>>(listas.map((l) => [l.id, new Map()]));
  if (!listas.length) return out;
  const { data, error } = await supabase.from('tentativas_questoes').select('lista_id, questao_id, acertou')
    .eq('aluno_id', alunoId).in('lista_id', listas.map((l) => l.id));
  if (!error) {
    ((data ?? []) as { lista_id: string; questao_id: string; acertou: boolean }[]).forEach((t) => out.get(t.lista_id)?.set(t.questao_id, t.acertou));
    return out;
  }
  const { data: velhas } = await supabase.from('respostas_questoes').select('questao_id, acertou').eq('aluno_id', alunoId);
  const primeira = new Map(((velhas ?? []) as { questao_id: string; acertou: boolean }[]).map((r) => [r.questao_id, r.acertou]));
  listas.forEach((l) => l.questoes.forEach((q) => { if (primeira.has(q)) out.get(l.id)!.set(q, primeira.get(q)!); }));
  return out;
}

const CAMPOS = 'id, codigo, origem, ano, aplicacao, numero_prova, enunciado, formato, imagem_path, alt_a, alt_b, alt_c, alt_d, alt_e, habilidade, assunto, nivel, respondidas, acertadas';

async function links(supabase: SupabaseClient, caminhos: string[]): Promise<Map<string, string>> {
  const unicos = Array.from(new Set(caminhos.filter(Boolean)));
  if (!unicos.length) return new Map();
  const { data } = await supabase.storage.from('materiais').createSignedUrls(unicos, 3600);
  const itens = (data ?? []) as { path: string | null; signedUrl: string }[];
  return new Map(itens.filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
}

// Carrega as questões (na ordem dos ids) com figuras e o histórico do aluno.
// No banco livre a questão sempre volta em branco; numa lista, volta com a resposta dada nela.
export async function carregarQuestoes(supabase: SupabaseClient, alunoId: string, ids: string[], listaId?: string | null): Promise<QuestaoCompleta[]> {
  if (!ids.length) return [];
  // a coluna "figuras" vem da atualização 0007; sem ela, segue sem figuras
  // colunas novas entram aos poucos (0007: figuras; 0011: área); sem elas, segue com o que existir
  let res: { data: unknown; error: unknown } = await supabase.from('questoes').select(`${CAMPOS}, figuras, area, disciplina, idioma`).in('id', ids);
  if (res.error) res = await supabase.from('questoes').select(`${CAMPOS}, figuras`).in('id', ids);
  if (res.error) res = await supabase.from('questoes').select(CAMPOS).in('id', ids);
  type Linha = Omit<QuestaoCompleta, 'imagem' | 'figuras' | 'resolucao' | 'historico'> & { imagem_path: string | null; figuras?: string[] | null };
  const linhas = (res.data ?? []) as unknown as Linha[];

  const [mapa, tentativas, resolucoes] = await Promise.all([
    links(supabase, linhas.flatMap((l) => [l.imagem_path ?? '', ...(l.figuras ?? [])])),
    minhasTentativas(supabase, alunoId, ids),
    listaId ? resolucoesDaLista(supabase, listaId, alunoId, ids) : Promise.resolve(new Map<string, ResolucaoQuestao>()),
  ]);
  const historicos = historicoPorQuestao(tentativas);

  const porId = new Map(linhas.map((l) => {
    const { imagem_path, figuras, ...resto } = l;
    return [l.id, {
      ...resto,
      imagem: imagem_path ? mapa.get(imagem_path) ?? null : null,
      figuras: (figuras ?? []).map((f) => mapa.get(f) ?? ''),
      resolucao: resolucoes.get(l.id) ?? null,
      historico: historicos.get(l.id) ?? SEM_HISTORICO,
    } satisfies QuestaoCompleta];
  }));
  return ids.map((id) => porId.get(id)).filter((q): q is QuestaoCompleta => !!q);
}

async function resolucoesDaLista(supabase: SupabaseClient, listaId: string, alunoId: string, ids: string[]): Promise<Map<string, ResolucaoQuestao>> {
  const { data, error } = await supabase.rpc('ver_resolucoes_lista', { p_lista: listaId });
  if (!error) return new Map(((data ?? []) as (ResolucaoQuestao & { questao_id: string })[]).map((r) => [r.questao_id, r]));
  // antes da atualização 0010: a primeira resposta do aluno vale para a lista
  const { data: resp } = await supabase.from('respostas_questoes').select('questao_id').eq('aluno_id', alunoId).in('questao_id', ids);
  const pares = await Promise.all(((resp ?? []) as { questao_id: string }[]).map(async (r) => {
    const { data: d } = await supabase.rpc('ver_resolucao_questao', { p_questao: r.questao_id });
    return [r.questao_id, ((d ?? []) as ResolucaoQuestao[])[0]] as const;
  }));
  return new Map(pares.filter(([, v]) => !!v) as [string, ResolucaoQuestao][]);
}

export const POR_PAGINA_OPCOES = [1, 5, 10] as const;
export function porPagina(valor: string | undefined, cookie: string | undefined): number {
  const n = parseInt(valor ?? cookie ?? '', 10);
  return (POR_PAGINA_OPCOES as readonly number[]).includes(n) ? n : 1;
}
