import Link from 'next/link';
import { AREAS_CURTO } from '@/lib/acesso';
import { PERIODOS, pct, sequencias, type Desempenho, type Periodo } from '@/lib/desempenho';
import { GraficoDiario } from './GraficoDiario';
import { ZerarHistorico } from './ZerarHistorico';
import { PainelArea } from './PainelArea';
import { Ic } from './Icones';
import s from './desempenho.module.css';

const ICONE_PERIODO: Record<Periodo, string> = { hoje: 'hoje', '7': 'cal', '30': 'barras', geral: 'pizza' };

function quando(iso: string | null) {
  if (!iso) return '–';
  return new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// Painel "Meu desempenho" nas questões: período, números, sequência de estudos, gráfico diário e desempenho por área
export function PainelDesempenho({ d, periodo, base, falta = false, saudacao, zerar = true }: {
  d: Desempenho; periodo: Periodo; base: string; falta?: boolean; saudacao?: React.ReactNode; zerar?: boolean;
}) {
  const seq = sequencias(d.dias);
  const taxa = pct(d.acertos, d.resolvidas);
  const rotuloPeriodo = PERIODOS.find((p) => p.id === periodo)?.rotulo.toLowerCase();

  return (
    <>
      {saudacao}
      {falta && <p className="erro" style={{ margin: 0 }}>Falta rodar a atualização 0014 do banco no Supabase para mostrar o desempenho.</p>}

      <nav className={s.periodos} aria-label="Período">
        {PERIODOS.map((p) => (
          <Link key={p.id} href={`${base}${base.includes('?') ? '&' : '?'}periodo=${p.id}`} className={s.periodo} aria-current={p.id === periodo ? 'true' : undefined} scroll={false}>
            <Ic nome={ICONE_PERIODO[p.id]} tam={18} /> {p.rotulo}
          </Link>
        ))}
      </nav>

      <section className={s.numeros} aria-label={`Seus números (${rotuloPeriodo})`}>
        {[
          { r: 'Resolvidas', v: d.resolvidas, c: s.azul, i: 'doc' },
          { r: 'Acertos', v: d.acertos, c: s.verde, i: 'certo' },
          { r: 'Erros', v: d.erros, c: s.laranja, i: 'erro' },
          { r: 'Taxa de acerto', v: `${taxa}%`, c: s.roxo, i: 'sobe' },
        ].map((n) => (
          <div key={n.r} className={`cartao ${s.numero}`}>
            <span className={`${s.numeroIcone} ${n.c}`}><Ic nome={n.i} /></span>
            <div><small>{n.r}</small><b>{n.v}</b></div>
          </div>
        ))}
      </section>

      <div className={s.duas}>
        <section className={`cartao ${s.seq}`} aria-labelledby="seq-t">
          <div className={s.seqTopo}>
            <span className={s.seqN}>{seq.atual}</span>
            <div>
              <strong id="seq-t">{seq.atual === 1 ? 'dia seguido de estudos' : 'dias seguidos de estudos'}</strong>
              <span>{seq.atual ? 'Cada dia com pelo menos uma questão conta.' : 'Resolva uma questão hoje e comece a sua sequência.'}</span>
            </div>
          </div>
          <div className={s.ativos}>
            <Ic nome="cal" tam={18} /> {seq.ativos30} dias ativos / 30
            <span className={s.barra}><span style={{ width: `${pct(seq.ativos30, 30)}%` }} /></span>
          </div>
          <span className={s.rotuloPeq}>Sua semana</span>
          <div className={s.semana}>
            {seq.semana.map((dia) => (
              <span key={dia.dia} className={s.dia} data-estudou={dia.estudou || undefined} data-hoje={dia.hoje || undefined} data-futuro={dia.futuro || undefined}
                title={dia.estudou ? 'Estudou' : dia.hoje ? 'Hoje' : dia.futuro ? '' : 'Sem questões'}>
                {dia.sigla}
                <i aria-hidden="true">{dia.estudou ? '✓' : dia.hoje ? '•' : '·'}</i>
              </span>
            ))}
          </div>
          <div className={s.mini}>
            <div className={s.miniItem}><span className={`${s.numeroIcone} ${s.verde}`}><Ic nome="chama" tam={20} /></span><div><small>Sequência atual</small><b>{seq.atual} {seq.atual === 1 ? 'dia' : 'dias'}</b></div></div>
            <div className={s.miniItem}><span className={`${s.numeroIcone} ${s.laranja}`}><Ic nome="estrela" tam={20} /></span><div><small>Seu recorde</small><b>{seq.recorde} {seq.recorde === 1 ? 'dia' : 'dias'}</b></div></div>
            <div className={s.miniItem}><span className={`${s.numeroIcone} ${s.azul}`}><Ic nome="relogio" tam={20} /></span><div><small>Última atividade</small><b style={{ fontSize: 15 }}>{quando(d.ultima)}</b></div></div>
          </div>
          <Link href="/aluno/questoes" className="btn btn-azul btn-grande" style={{ justifyContent: 'center' }}>Resolver questões</Link>
        </section>

        <section className={`cartao ${s.grafico}`} aria-labelledby="graf-t">
          <h2 id="graf-t" className="display">Desempenho diário</h2>
          <div className={s.legenda}>
            <span><i style={{ background: '#22c55e' }} /> Acertos</span>
            <span><i style={{ background: '#fb923c' }} /> Erros</span>
            <span className="suave">últimos {d.diario.length || 7} dias</span>
          </div>
          <GraficoDiario dias={d.diario} />
        </section>
      </div>

      <section className={`cartao ${s.tabela}`} aria-labelledby="area-t">
        <h2 id="area-t" className="display">Por área e disciplina <span className="suave" style={{ fontSize: 14, fontWeight: 600 }}>· {rotuloPeriodo}</span></h2>
        <div className={s.linhas} role="table" aria-label="Acertos e erros por área">
          <div className={`${s.linha} ${s.linhaCab}`} role="row"><span>Área · disciplina</span><span>Acertos</span><span>Erros</span><span className={s.taxa}>Taxa</span></div>
          {d.por_area.length === 0 && <p className={s.vazio}>Nenhuma questão respondida neste período.</p>}
          {d.por_area.map((l) => {
            const area = l.area ?? 'matematica';
            const href = `/aluno/questoes?ar=${area}${l.disciplina ? `&d=${encodeURIComponent(l.disciplina)}` : ''}`;
            const t = pct(l.acertos, l.acertos + l.erros);
            return (
              <Link key={`${area}-${l.disciplina}`} href={href} className={s.linha} role="row">
                <span><b>{AREAS_CURTO[area] ?? area}</b>{l.disciplina ? <span className="suave"> · {l.disciplina}</span> : null}</span>
                <b className={s.ok}>{l.acertos}</b>
                <b className={s.ruim}>{l.erros}</b>
                <span className={s.taxa}><span className={s.barra}><span style={{ width: `${t}%` }} /></span>{t}%</span>
              </Link>
            );
          })}
        </div>
      </section>

      <PainelArea linhas={d.por_assunto ?? []} periodo={rotuloPeriodo ?? ''} />

      {zerar && (
        <section className={`cartao ${s.zona}`} aria-labelledby="zerar-t">
          <h2 id="zerar-t" className="display" style={{ fontSize: 17 }}>Começar do zero</h2>
          <span className="suave" style={{ fontSize: 14 }}>Quer refazer as questões como se fosse a primeira vez? Você pode apagar o seu histórico.</span>
          <ZerarHistorico />
        </section>
      )}
    </>
  );
}
