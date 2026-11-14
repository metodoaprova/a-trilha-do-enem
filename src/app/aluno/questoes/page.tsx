import Link from 'next/link';
import { cookies } from 'next/headers';
import { acessoAtual, AREAS } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { buscarQuestoes, filtroDaUrl, urlFiltro } from '@/lib/banco';
import { carregarQuestoes, porPagina as lerPorPagina } from '@/lib/questao';
import { Caderno } from '@/components/Caderno';
import { FiltrosBanco, type GrupoFiltro } from './FiltrosBanco';
import { AbasQuestoes } from '@/components/desempenho/AbasQuestoes';
import { TamanhoTexto } from '@/components/TamanhoTexto';
import s from '../aluno.module.css';

export const metadata = { title: 'Questões · A Trilha do ENEM' };

export default async function BancoQuestoes({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const filtro = filtroDaUrl(sp);
  const pp = lerPorPagina(sp.pp, (await cookies()).get('gq_pp')?.value);
  const { supabase, perfil, acesso } = await acessoAtual();

  const [{ lista, minhas }, grupos] = await Promise.all([buscarQuestoes(supabase, perfil.id, filtro), gruposDoBanco(supabase)]);
  const total = lista.length;
  const paginas = Math.max(1, Math.ceil(total / pp));
  const pagina = Math.min(paginas, Math.max(1, parseInt(sp.p ?? '1', 10) || 1));
  const ids = lista.slice((pagina - 1) * pp, pagina * pp).map((q) => q.id);
  const questoes = await carregarQuestoes(supabase, perfil.id, ids);
  const feitas = Array.from(minhas.values());
  const acertos = feitas.filter((r) => r.acertou).length;
  const filtrosAtivos = [filtro.ar, filtro.d, filtro.i, filtro.h, filtro.a, filtro.n, filtro.o, filtro.s].filter(Boolean).length;
  const base = `/aluno/questoes${urlFiltro(filtro)}`;

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões', href: '/aluno/questoes/desempenho' }, { rotulo: 'Resolver questões' }]} />
      <AbasQuestoes atual="resolver" />
      <div className="linha-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className={s.cabeca}>
          <h1 className={`display ${s.titulo}`}>{filtro.ar && AREAS[filtro.ar] ? `Questões de ${AREAS[filtro.ar]}` : 'Questões do ENEM'}</h1>
          <span className="suave">
            {feitas.length} resolvidas · {feitas.length ? `${Math.round((100 * acertos) / feitas.length)}% de acertos` : 'nenhuma ainda'}
          </span>
        </div>
      </div>

      {!acesso.completo && (
        <div className="q-plano" role="status">
          <span><b>Plano grátis:</b> {acesso.usadasHoje} de {acesso.limiteDia} questões respondidas hoje.</span>
          <Link href="/aluno/planos">Responder sem limite</Link>
        </div>
      )}

      <div className="q-layout">
        <aside className="q-lado">
          <details className="q-filtros" open>
            <summary>
              <span>Filtrar questões</span>
              {filtrosAtivos > 0 && <span className="q-filtros-n">{filtrosAtivos} {filtrosAtivos === 1 ? 'filtro ativo' : 'filtros ativos'}</span>}
            </summary>
            <FiltrosBanco grupos={grupos} inicial={{ ar: filtro.ar, d: filtro.d, i: filtro.i, h: filtro.h, a: filtro.a, n: filtro.n, o: filtro.o, s: filtro.s }} pp={sp.pp ? String(pp) : undefined} />
          </details>
        </aside>
        <div className="q-principal">
          <div className="q-exibindo">
            <span>Exibindo <b>{total}</b> {total === 1 ? 'questão' : 'questões'} no total.</span>
            <TamanhoTexto />
          </div>
          {total === 0 ? (
            <p className="suave" style={{ margin: 0 }}>Nenhuma questão com esses filtros ainda.</p>
          ) : (
            <Caderno questoes={questoes} total={total} pagina={pagina} porPagina={pp} base={base} />
          )}
        </div>
      </div>
    </>
  );
}

type GrupoBanco = GrupoFiltro;

// combinações que existem no banco (para montar os filtros). Antes da atualização 0011, sem área.
async function gruposDoBanco(supabase: Awaited<ReturnType<typeof acessoAtual>>['supabase']): Promise<GrupoBanco[]> {
  const { data, error } = await supabase.rpc('contagem_banco');
  if (!error) return (data ?? []) as GrupoBanco[];
  const { data: qs } = await supabase.from('questoes').select('assunto, habilidade, nivel, origem').limit(5000);
  return (qs ?? []) as GrupoBanco[];
}
