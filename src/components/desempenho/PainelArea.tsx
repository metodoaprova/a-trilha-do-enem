'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { LinhaAssunto } from '@/lib/desempenho';
import s from './desempenho.module.css';

const AREAS: Record<string, string> = { linguagens: 'Linguagens', humanas: 'Ciências Humanas', natureza: 'Ciências da Natureza', matematica: 'Matemática' };
const pct = (a: number, t: number) => (t ? Math.round((100 * a) / t) : 0);

// "Painel por área": escolha a área e veja os assuntos em que você mais acerta e mais erra
export function PainelArea({ linhas, periodo }: { linhas: LinhaAssunto[]; periodo: string }) {
  const totais = useMemo(() => {
    const m = new Map<string, number>();
    linhas.forEach((l) => m.set(l.area ?? 'matematica', (m.get(l.area ?? 'matematica') ?? 0) + l.acertos + l.erros));
    return m;
  }, [linhas]);
  const maisFeita = [...totais.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const [area, setArea] = useState(maisFeita);
  const daArea = linhas
    .filter((l) => (l.area ?? 'matematica') === area)
    .map((l) => ({ ...l, total: l.acertos + l.erros, taxa: pct(l.acertos, l.acertos + l.erros) }))
    .sort((a, b) => a.taxa - b.taxa || b.total - a.total);

  return (
    <section className={`cartao ${s.tabela}`} aria-labelledby="painel-area">
      <div className={s.areaTopo}>
        <div>
          <h2 id="painel-area" className="display">Painel por área</h2>
          <span className="suave" style={{ fontSize: 14.5 }}>Escolha uma área para ver os seus resultados em cada assunto · {periodo}.</span>
        </div>
        <div className="campo" style={{ minWidth: 240 }}>
          <label htmlFor="pa-area" className={s.oculto}>Área</label>
          <select id="pa-area" value={area} onChange={(e) => setArea(e.target.value)}>
            <option value="">Selecione uma área</option>
            {Object.entries(AREAS).map(([k, v]) => <option key={k} value={k}>{v}{totais.get(k) ? ` (${totais.get(k)})` : ''}</option>)}
          </select>
        </div>
      </div>
      {!area ? (
        <p className={s.vazio}>Selecione uma área no seletor acima para liberar esta visão.</p>
      ) : daArea.length === 0 ? (
        <p className={s.vazio}>Você ainda não respondeu questões de {AREAS[area]} neste período. <Link href={`/aluno/questoes?ar=${area}`}>Resolver agora</Link></p>
      ) : (
        <div className={s.linhas} role="table" aria-label={`Resultados por assunto em ${AREAS[area]}`}>
          <div className={`${s.linha} ${s.linhaCab}`} role="row"><span>Assunto</span><span>Acertos</span><span>Erros</span><span className={s.taxa}>Taxa</span></div>
          {daArea.map((l) => (
            <Link key={`${l.disciplina}-${l.assunto}`} role="row" className={s.linha}
              href={`/aluno/questoes?ar=${area}${l.disciplina ? `&d=${encodeURIComponent(l.disciplina)}` : ''}${l.assunto ? `&a=${encodeURIComponent(l.assunto)}` : ''}`}>
              <span><b>{l.assunto || 'Sem assunto'}</b>{l.disciplina ? <span className="suave"> · {l.disciplina}</span> : null}</span>
              <b className={s.ok}>{l.acertos}</b>
              <b className={s.ruim}>{l.erros}</b>
              <span className={s.taxa}><span className={s.barra}><span style={{ width: `${l.taxa}%` }} /></span>{l.taxa}%</span>
            </Link>
          ))}
          <p className="suave" style={{ margin: '6px 0 0', fontSize: 13.5 }}>Os assuntos com a menor taxa de acerto aparecem primeiro. Clique para treinar.</p>
        </div>
      )}
    </section>
  );
}
