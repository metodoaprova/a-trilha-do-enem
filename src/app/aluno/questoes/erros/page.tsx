import { acessoAtual, AREAS_CURTO } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { AbasQuestoes } from '@/components/desempenho/AbasQuestoes';
import { hojeBR, pct } from '@/lib/desempenho';
import { resolverCaderno } from '../../actions';
import s from '../../aluno.module.css';
import c from './erros.module.css';

export const metadata = { title: 'Caderno de erros · A Trilha do ENEM' };

type Erro = { questao_id: string; area: string | null; disciplina: string | null; assunto: string | null; ultimo_erro: string; recuperada: boolean; depois: number };

const somaDias = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const diaBR = (ts: string) => new Date(ts).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
// domingo da semana do dia
const domingoDe = (iso: string) => somaDias(iso, -new Date(`${iso}T12:00:00Z`).getUTCDay());

function Botao({ area, disciplina, rotulo, claro = false }: { area?: string | null; disciplina?: string | null; rotulo: string; claro?: boolean }) {
  return (
    <form action={resolverCaderno}>
      {area && <input type="hidden" name="area" value={area} />}
      {disciplina && <input type="hidden" name="disciplina" value={disciplina} />}
      <button className={claro ? c.botaoClaro : 'btn btn-azul'}>{rotulo} →</button>
    </form>
  );
}

export default async function CadernoDeErros({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const { supabase, acesso } = await acessoAtual();
  const { data, error } = await supabase.rpc('caderno_erros');
  const erros = (data ?? []) as Erro[];
  const pendentes = erros.filter((e) => !e.recuperada);
  const revisadas = erros.filter((e) => e.depois > 0).length;
  const recuperadas = erros.filter((e) => e.recuperada).length;

  const hoje = hojeBR();
  const domingo = domingoDe(hoje);
  const daSemana = erros.filter((e) => diaBR(e.ultimo_erro) >= domingo);

  // por área e disciplina
  const grupos = new Map<string, { area: string; disciplina: string | null; total: number; pendentes: number }>();
  for (const e of erros) {
    const area = e.area ?? 'matematica';
    const k = `${area}|${e.disciplina ?? ''}`;
    const g = grupos.get(k) ?? { area, disciplina: e.disciplina, total: 0, pendentes: 0 };
    g.total += 1; if (!e.recuperada) g.pendentes += 1;
    grupos.set(k, g);
  }
  const lista = [...grupos.values()].sort((a, b) => b.pendentes - a.pendentes || b.total - a.total);

  // histórico por semana (até 8 semanas)
  const semanas = new Map<string, { erros: number; recuperadas: number }>();
  for (const e of erros) {
    const dom = domingoDe(diaBR(e.ultimo_erro));
    if (dom === domingo) continue;
    const w = semanas.get(dom) ?? { erros: 0, recuperadas: 0 };
    w.erros += 1; if (e.recuperada) w.recuperadas += 1;
    semanas.set(dom, w);
  }
  const historico = [...semanas.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 8);
  const p = pct(recuperadas, erros.length);

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões', href: '/aluno/questoes/desempenho' }, { rotulo: 'Caderno de erros' }]} />
      <AbasQuestoes atual="erros" />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Caderno de erros</h1>
        <span className="suave">Revise os seus erros por área e disciplina e fortaleça os pontos que mais precisam de atenção.</span>
      </div>
      {error && <p className="erro" style={{ margin: 0 }}>Falta rodar a atualização 0014 do banco no Supabase.</p>}
      {erro && <p className="erro" role="alert" style={{ margin: 0 }}>{erro}</p>}

      <section className={`cartao-gradiente ${c.hero}`} aria-labelledby="pend">
        <div className={c.heroTopo}>
          <div style={{ minWidth: 0 }}>
            <span className={c.selo}><i aria-hidden="true" /> {pendentes.length ? 'Caderno em preenchimento' : 'Caderno em dia'}</span>
            <h2 id="pend" className="display">{pendentes.length} {pendentes.length === 1 ? 'questão para revisar' : 'questões para revisar'}</h2>
            <p>
              {daSemana.length
                ? `${daSemana.length} ${daSemana.length === 1 ? 'erro registrado' : 'erros registrados'} nesta semana (${ddmm(domingo)} a ${ddmm(somaDias(domingo, 6))}). Revise quando quiser.`
                : 'Nenhum erro novo nesta semana. Quando errar uma questão, ela aparece aqui para você revisar.'}
            </p>
          </div>
          <span className={c.anel} style={{ ['--p' as string]: p }}><b>{p}%</b><small>recuperado</small></span>
        </div>
        <div className={c.contas}>
          <span><b>{pendentes.length}</b><small>{pendentes.length === 1 ? 'Pendente' : 'Pendentes'}</small></span>
          <span><b>{revisadas}</b><small>Revisadas</small></span>
          <span><b>{recuperadas}</b><small>Recuperadas</small></span>
        </div>
        {pendentes.length > 0 && <Botao rotulo={`Resolver ${Math.min(pendentes.length, acesso.completo ? 45 : acesso.listaMax)} agora`} claro />}
        {!acesso.completo && pendentes.length > acesso.listaMax && (
          <span style={{ fontSize: 13.5, opacity: 0.85 }}>No plano grátis, cada revisão tem até {acesso.listaMax} questões. Monte outra quando terminar.</span>
        )}
      </section>

      <section className={s.grupo} aria-labelledby="disc">
        <h2 id="disc" className="display">Escolha uma área</h2>
        <span className="suave" style={{ marginTop: -6 }}>Você pode revisar no seu ritmo e retomar de onde parou.</span>
        {lista.length === 0 ? (
          <p className="suave" style={{ margin: 0 }}>Ainda não há erros registrados. Resolva questões e os erros aparecem aqui.</p>
        ) : (
          <div className={c.grade}>
            {lista.map((g, i) => (
              <article key={`${g.area}-${g.disciplina}`} className={c.disc}>
                <div className={c.discTopo}>
                  <div style={{ minWidth: 0 }}>
                    {i === 0 && g.pendentes > 0 && <span className={c.comece}>Comece por aqui</span>}
                    <h3 className="display">{g.disciplina ?? AREAS_CURTO[g.area] ?? g.area}</h3>
                    <span>{g.disciplina ? `${AREAS_CURTO[g.area] ?? g.area} · ` : ''}{g.total - g.pendentes} de {g.total} recuperadas</span>
                  </div>
                  <span className={c.pend}><b>{g.pendentes}</b>{g.pendentes === 1 ? 'pendente' : 'pendentes'}</span>
                </div>
                <span className={c.barra}><span style={{ width: `${pct(g.total - g.pendentes, g.total)}%` }} /></span>
                {g.pendentes > 0
                  ? <Botao area={g.area} disciplina={g.disciplina} rotulo={`Resolver ${g.pendentes} ${g.pendentes === 1 ? 'questão' : 'questões'}`} claro />
                  : <span className={c.feito}>✓ Tudo recuperado</span>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={s.grupo} aria-labelledby="hist">
        <h2 id="hist" className="display">Histórico semanal</h2>
        {historico.length === 0 ? (
          <p className={c.vazio}>Você ainda não tem semanas anteriores com erros registrados. No fim desta semana, ela aparece aqui.</p>
        ) : (
          <div className={c.semanas}>
            {historico.map(([dom, w]) => (
              <div key={dom} className="cartao">
                <strong>Semana de {ddmm(dom)} a {ddmm(somaDias(dom, 6))}</strong>
                <span className="suave">{w.erros} {w.erros === 1 ? 'erro' : 'erros'} · {w.recuperadas} {w.recuperadas === 1 ? 'recuperada' : 'recuperadas'}</span>
                <span className={c.barra}><span style={{ width: `${pct(w.recuperadas, w.erros)}%` }} /></span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
