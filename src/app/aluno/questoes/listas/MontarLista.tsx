'use client';

import { useMemo, useState } from 'react';
import { Formulario } from '@/components/Formulario';
import { NIVEIS, ORIGENS } from '@/lib/assuntos';
import { criarLista } from '../../actions';
import s from '../../aluno.module.css';

const AREAS: Record<string, string> = { linguagens: 'Linguagens', humanas: 'Ciências Humanas', natureza: 'Ciências da Natureza', matematica: 'Matemática' };
const IDIOMAS: Record<string, string> = { ingles: 'Inglês', espanhol: 'Espanhol' };

// Uma linha por combinação de características, com quantas questões publicadas existem nela
export type Grupo = {
  area?: string | null; disciplina?: string | null; idioma?: string | null;
  modulo: number | null; assunto: string | null; habilidade: string | null; nivel: string | null; origem: string | null; feita: boolean; n: number;
};
type Chave = 'ar' | 'd' | 'i' | 'm' | 'a' | 'h' | 'n' | 'o';
const CHAVES: Chave[] = ['ar', 'd', 'i', 'm', 'a', 'h', 'n', 'o'];
type Filtros = Record<Chave, string> & { novas: boolean };

const valor = (g: Grupo, k: Chave): string => {
  switch (k) {
    case 'ar': return g.area ?? 'matematica';
    case 'd': return g.disciplina ?? '';
    case 'i': return g.idioma ?? '';
    case 'm': return g.modulo == null ? '' : String(g.modulo);
    case 'a': return g.assunto ?? '';
    case 'h': return g.habilidade ?? '';
    case 'n': return g.nivel ?? '';
    default: return g.origem ?? '';
  }
};
// a questão passa no filtro? (no idioma, as questões sem idioma valem para os dois)
const passa = (g: Grupo, k: Chave, v: string) => !v || (k === 'i' ? !g.idioma || g.idioma === v : valor(g, k) === v);

// conta as questões que passam em todos os filtros, menos o ignorado (para o número ao lado de cada opção)
function contar(grupos: Grupo[], f: Filtros, ignorar?: Chave) {
  let n = 0;
  for (const g of grupos) {
    if (f.novas && g.feita) continue;
    if (CHAVES.some((k) => k !== ignorar && !passa(g, k, f[k]))) continue;
    n += g.n;
  }
  return n;
}

export function MontarLista({ grupos, inicial, maxQtd = 45 }: {
  grupos: Grupo[]; nomesModulos?: Record<number, string>; inicial: { ar?: string; m?: string; h?: string; a?: string }; maxQtd?: number;
}) {
  const [f, setF] = useState<Filtros>({ ar: inicial.ar ?? (inicial.h ? 'matematica' : ''), d: '', i: '', m: '', a: inicial.a ?? '', h: inicial.h ?? '', n: '', o: '', novas: false });
  const opcoesQtd = [5, 10, 15, 20, 30, 45].filter((n) => n <= maxQtd);
  const [qtd, setQtd] = useState(Math.min(10, maxQtd));
  // trocar a área limpa os filtros que dependem dela
  const muda = (k: Chave) => (e: { target: { value: string } }) =>
    setF((x) => (k === 'ar' ? { ...x, ar: e.target.value, d: '', i: '', m: '', a: '', h: '' } : k === 'd' ? { ...x, d: e.target.value, a: '', h: '' } : { ...x, [k]: e.target.value }));

  const total = useMemo(() => grupos.reduce((t, g) => t + g.n, 0), [grupos]);
  const filtradas = contar(grupos, f);
  const nuncaFeitas = contar(grupos, { ...f, novas: true });
  const ativos = CHAVES.filter((k) => f[k]).length + (f.novas ? 1 : 0);

  // opções de cada filtro, com a contagem considerando os outros filtros já escolhidos
  const opcoes = (k: Chave) => {
    const conta = new Map<string, number>();
    for (const g of grupos) {
      const v = valor(g, k);
      if (!v) continue;
      if (f.novas && g.feita) continue;
      if (CHAVES.some((c) => c !== k && !passa(g, c, f[c]))) continue;
      conta.set(v, (conta.get(v) ?? 0) + g.n);
    }
    return conta;
  };
  const cAr = opcoes('ar'), cD = opcoes('d'), cI = opcoes('i'), cA = opcoes('a'), cH = opcoes('h'), cN = opcoes('n'), cO = opcoes('o');
  const daArea = grupos.filter((g) => passa(g, 'ar', f.ar));
  const unicos = (xs: (string | null | undefined)[]) => Array.from(new Set(xs.filter((x): x is string => !!x))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const disciplinas = unicos(daArea.map((g) => g.disciplina));
  const daDisciplina = daArea.filter((g) => passa(g, 'd', f.d));
  const assuntos = unicos(daDisciplina.filter((g) => passa(g, 'h', f.h)).map((g) => g.assunto));
  const habilidades = Array.from(new Set(daDisciplina.map((g) => g.habilidade).filter((h): h is string => !!h))).sort((a, b) => (parseInt(a.slice(1), 10) || 0) - (parseInt(b.slice(1), 10) || 0));
  const temIdioma = daArea.some((g) => g.idioma);
  const rot = (texto: string, n: number | undefined) => `${texto} (${n ?? 0})`;
  const vaiTer = Math.min(qtd, filtradas);
  const pct = total ? Math.max(filtradas ? 2 : 0, Math.round((100 * filtradas) / total)) : 0;

  return (
    <Formulario acao={criarLista} botao={filtradas ? `Montar a lista com ${vaiTer} ${vaiTer === 1 ? 'questão' : 'questões'}` : 'Montar a lista'}
      classeBotao="btn btn-ciano" pendenteTexto="Montando…">
      <div className="ml-contador" role="status" aria-live="polite">
        <div className="ml-numeros">
          <b className="display">{filtradas}</b>
          <span>{ativos ? <>questões com {ativos === 1 ? 'esse filtro' : 'esses filtros'}<br />de {total} no banco</> : <>questões no banco</>}</span>
        </div>
        <span className="ml-barra"><span style={{ width: `${pct}%` }} /></span>
        <span className="ml-nota">
          {filtradas === 0
            ? 'Nenhuma questão com esses filtros. Tire algum filtro para continuar.'
            : filtradas < qtd
              ? `Só há ${filtradas} ${filtradas === 1 ? 'questão' : 'questões'} com esses filtros: a lista terá ${filtradas}.`
              : `Sua lista terá ${qtd} questões, sorteadas entre essas ${filtradas}. ${f.novas ? '' : `${nuncaFeitas} você ainda não fez, e elas vêm primeiro.`}`}
        </span>
      </div>

      <div className={s.filtrosAluno}>
        <div className="campo">
          <label htmlFor="lar">Área</label>
          <select id="lar" name="area" value={f.ar} onChange={muda('ar')}>
            <option value="">Todas</option>
            {Object.entries(AREAS).map(([k, v]) => <option key={k} value={k} disabled={!cAr.get(k) && f.ar !== k}>{rot(v, cAr.get(k))}</option>)}
          </select>
        </div>
        {disciplinas.length > 0 && (
          <div className="campo">
            <label htmlFor="ld">Disciplina</label>
            <select id="ld" name="d" value={f.d} onChange={muda('d')}>
              <option value="">Qualquer</option>
              {disciplinas.map((d) => <option key={d} value={d} disabled={!cD.get(d) && f.d !== d}>{rot(d, cD.get(d))}</option>)}
            </select>
          </div>
        )}
        {temIdioma && (
          <div className="campo">
            <label htmlFor="li">Língua estrangeira</label>
            <select id="li" name="i" value={f.i} onChange={muda('i')}>
              <option value="">Inglês e espanhol</option>
              {Object.entries(IDIOMAS).map(([k, v]) => <option key={k} value={k}>{rot(`Só ${v.toLowerCase()}`, cI.get(k))}</option>)}
            </select>
          </div>
        )}
        <div className="campo">
          <label htmlFor="la">Assunto</label>
          <select id="la" name="a" value={f.a} onChange={muda('a')}>
            <option value="">Qualquer</option>
            {assuntos.map((a) => <option key={a} value={a} disabled={!cA.get(a) && f.a !== a}>{rot(a, cA.get(a))}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="lh">Habilidade</label>
          <select id="lh" name="h" value={f.h} onChange={muda('h')}>
            <option value="">Qualquer</option>
            {habilidades.map((h) => <option key={h} value={h} disabled={!cH.get(h) && f.h !== h}>{rot(h, cH.get(h))}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="ln">Dificuldade</label>
          <select id="ln" name="n" value={f.n} onChange={muda('n')}>
            <option value="">Misturada</option>
            {Object.entries(NIVEIS).map(([k, v]) => <option key={k} value={k} disabled={!cN.get(k) && f.n !== k}>{rot(v, cN.get(k))}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="lo">Origem</label>
          <select id="lo" name="o" value={f.o} onChange={muda('o')}>
            <option value="">Qualquer</option>
            {Object.entries(ORIGENS).map(([k, v]) => <option key={k} value={k} disabled={!cO.get(k) && f.o !== k}>{rot(v, cO.get(k))}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="lq">Quantidade</label>
          <select id="lq" name="qtd" value={qtd} onChange={(e) => setQtd(parseInt(e.target.value, 10))}>
            {opcoesQtd.map((n) => <option key={n} value={n}>{n} questões</option>)}
          </select>
        </div>
      </div>
      {maxQtd < 45 && (
        <span className="suave" style={{ fontSize: 13.5 }}>No plano grátis, as listas têm até {maxQtd} questões. <a href="/aluno/planos">Listas maiores no banco completo</a>.</span>
      )}
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', fontWeight: 600 }}>
        <input type="checkbox" name="novas" checked={f.novas} onChange={(e) => setF((x) => ({ ...x, novas: e.target.checked }))}
          style={{ width: 22, height: 22, accentColor: 'var(--ciano)' }} />
        Só questões que eu nunca fiz ({nuncaFeitas})
      </label>
    </Formulario>
  );
}
