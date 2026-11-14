import type { SupabaseClient } from '@supabase/supabase-js';

export type Periodo = 'hoje' | '7' | '30' | 'geral';
export const PERIODOS: { id: Periodo; rotulo: string; dias: number | null }[] = [
  { id: 'hoje', rotulo: 'Hoje', dias: 0 },
  { id: '7', rotulo: '7 dias', dias: 7 },
  { id: '30', rotulo: '30 dias', dias: 30 },
  { id: 'geral', rotulo: 'Geral', dias: null },
];
export const lerPeriodo = (v?: string): Periodo => (PERIODOS.some((p) => p.id === v) ? (v as Periodo) : 'geral');

export type DiaGrafico = { dia: string; acertos: number; erros: number };
export type LinhaArea = { area: string | null; disciplina: string | null; acertos: number; erros: number };
export type LinhaAssunto = LinhaArea & { assunto: string | null };
export type Desempenho = {
  resolvidas: number; acertos: number; erros: number;
  diario: DiaGrafico[]; por_area: LinhaArea[]; por_assunto: LinhaAssunto[]; dias: string[]; ultima: string | null;
};

const VAZIO: Desempenho = { resolvidas: 0, acertos: 0, erros: 0, diario: [], por_area: [], por_assunto: [], dias: [], ultima: null };

export async function lerDesempenho(supabase: SupabaseClient, periodo: Periodo): Promise<{ d: Desempenho; falta: boolean }> {
  const dias = PERIODOS.find((p) => p.id === periodo)?.dias ?? null;
  const { data, error } = await supabase.rpc('meu_desempenho', { p_dias: dias });
  if (error || !data) return { d: VAZIO, falta: !!error };
  return { d: { ...VAZIO, ...(data as Desempenho) }, falta: false };
}

// "hoje" no horário de Brasília, como AAAA-MM-DD
export function hojeBR(agora = new Date()): string {
  return agora.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}
const somaDias = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export type DiaSemana = { dia: string; sigla: string; estudou: boolean; hoje: boolean; futuro: boolean };

// sequência de dias seguidos, recorde, dias ativos nos últimos 30 e a semana (domingo a sábado)
export function sequencias(dias: string[], hoje = hojeBR()) {
  const set = new Set(dias);
  let atual = 0;
  let cursor = set.has(hoje) ? hoje : somaDias(hoje, -1); // quem ainda não estudou hoje não perde a sequência de ontem
  while (set.has(cursor)) { atual += 1; cursor = somaDias(cursor, -1); }

  const ordenados = [...set].sort();
  let recorde = 0, corrida = 0, anterior = '';
  for (const d of ordenados) {
    corrida = anterior && somaDias(anterior, 1) === d ? corrida + 1 : 1;
    recorde = Math.max(recorde, corrida);
    anterior = d;
  }
  const limite30 = somaDias(hoje, -29);
  const ativos30 = ordenados.filter((d) => d >= limite30 && d <= hoje).length;

  const diaSemana = new Date(`${hoje}T12:00:00Z`).getUTCDay(); // 0 = domingo
  const domingo = somaDias(hoje, -diaSemana);
  const SIGLAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  const semana: DiaSemana[] = SIGLAS.map((sigla, i) => {
    const dia = somaDias(domingo, i);
    return { dia, sigla, estudou: set.has(dia), hoje: dia === hoje, futuro: dia > hoje };
  });
  return { atual, recorde: Math.max(recorde, atual), ativos30, semana };
}

export const pct = (a: number, total: number) => (total ? Math.round((100 * a) / total) : 0);
