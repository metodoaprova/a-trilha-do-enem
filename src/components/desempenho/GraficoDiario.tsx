import type { DiaGrafico } from '@/lib/desempenho';

// Barras empilhadas por dia: acertos (verde) embaixo, erros (laranja) em cima
export function GraficoDiario({ dias }: { dias: DiaGrafico[] }) {
  const W = 640, H = 220, esq = 34, base = H - 26, topo = 12;
  const max = Math.max(1, ...dias.map((d) => d.acertos + d.erros));
  const passo = Math.max(1, Math.ceil(max / 4));
  const teto = Math.ceil(max / passo) * passo;
  const larg = (W - esq - 8) / Math.max(1, dias.length);
  const barra = Math.min(28, larg * 0.62);
  const y = (v: number) => base - ((base - topo) * v) / teto;
  const rotular = (i: number) => dias.length <= 7 || i % 5 === 0 || i === dias.length - 1;
  const fmt = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
  const linhas = Array.from({ length: Math.floor(teto / passo) + 1 }, (_, i) => i * passo);
  const total = dias.reduce((t, d) => t + d.acertos + d.erros, 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Desempenho diário: ${total} respostas nos últimos ${dias.length} dias`}>
      {linhas.map((v) => (
        <g key={v}>
          <line x1={esq} x2={W - 4} y1={y(v)} y2={y(v)} stroke="var(--linha)" />
          <text x={esq - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--suave)">{v}</text>
        </g>
      ))}
      {dias.map((d, i) => {
        const x = esq + i * larg + (larg - barra) / 2;
        const ya = y(d.acertos), ye = y(d.acertos + d.erros);
        return (
          <g key={d.dia}>
            <title>{`${fmt(d.dia)}: ${d.acertos} acertos, ${d.erros} erros`}</title>
            {d.acertos > 0 && <rect x={x} y={ya} width={barra} height={base - ya} rx="3" fill="#22c55e" />}
            {d.erros > 0 && <rect x={x} y={ye} width={barra} height={ya - ye} rx="3" fill="#fb923c" />}
            {rotular(i) && <text x={x + barra / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--suave)">{fmt(d.dia)}</text>}
          </g>
        );
      })}
    </svg>
  );
}
