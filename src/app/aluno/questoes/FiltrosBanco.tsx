'use client';

import { useState } from 'react';
import { NIVEIS, ORIGENS } from '@/lib/assuntos';
import s from '../aluno.module.css';

const AREAS: Record<string, string> = { linguagens: 'Linguagens', humanas: 'Ciências Humanas', natureza: 'Ciências da Natureza', matematica: 'Matemática' };
const IDIOMAS: Record<string, string> = { ingles: 'Inglês', espanhol: 'Espanhol' };

export type GrupoFiltro = {
  area?: string | null; disciplina?: string | null; idioma?: string | null;
  assunto: string | null; habilidade?: string | null; nivel?: string | null; origem?: string | null; n?: number;
};
type F = { ar: string; d: string; i: string; h: string; a: string; n: string; o: string; s: string };

const area = (g: GrupoFiltro) => g.area ?? 'matematica';
const ordemH = (x: string) => parseInt(x.slice(1), 10) || 0;

// Filtros do banco: as opções (disciplina, língua, habilidade e assunto) dependem da área escolhida
// e são atualizadas na hora; trocar a área limpa o que dependia da área anterior.
export function FiltrosBanco({ grupos, inicial, pp }: { grupos: GrupoFiltro[]; inicial: Partial<F>; pp?: string }) {
  const [f, setF] = useState<F>({ ar: '', d: '', i: '', h: '', a: '', n: '', o: '', s: '', ...Object.fromEntries(Object.entries(inicial).filter(([, v]) => v)) });
  const muda = (k: keyof F) => (e: { target: { value: string } }) => {
    const v = e.target.value;
    setF((x) => {
      if (k === 'ar') return { ...x, ar: v, d: '', i: '', h: '', a: '' };
      if (k === 'd') return { ...x, d: v, h: '', a: '' };
      return { ...x, [k]: v };
    });
  };

  const daArea = grupos.filter((g) => !f.ar || area(g) === f.ar);
  const daDisciplina = daArea.filter((g) => !f.d || g.disciplina === f.d);
  const unicos = (xs: (string | null | undefined)[]) => Array.from(new Set(xs.filter((x): x is string => !!x)));
  const areasComQuestoes = new Set(grupos.map(area));
  const disciplinas = unicos(daArea.map((g) => g.disciplina)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const temIdioma = daArea.some((g) => g.idioma);
  const habilidades = unicos(daDisciplina.map((g) => g.habilidade)).sort((a, b) => ordemH(a) - ordemH(b));
  const assuntos = unicos(daDisciplina.filter((g) => !f.h || g.habilidade === f.h).map((g) => g.assunto)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  // se a opção escolhida não existe mais na lista (por exemplo, depois de trocar a habilidade), ela é mantida visível
  const comAtual = (lista: string[], atual: string) => (atual && !lista.includes(atual) ? [atual, ...lista] : lista);

  return (
    <form method="get" className={s.filtrosAluno} aria-label="Filtros">
      {pp && <input type="hidden" name="pp" value={pp} />}
      <div className="campo">
        <label htmlFor="far">Área</label>
        <select id="far" name="ar" value={f.ar} onChange={muda('ar')}>
          <option value="">Todas</option>
          {Object.entries(AREAS).map(([k, v]) => <option key={k} value={k} disabled={!areasComQuestoes.has(k) && f.ar !== k}>{v}</option>)}
        </select>
      </div>
      {disciplinas.length > 1 && (
        <div className="campo">
          <label htmlFor="fd">Disciplina</label>
          <select id="fd" name="d" value={f.d} onChange={muda('d')}>
            <option value="">Todas</option>
            {disciplinas.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      )}
      {temIdioma && (
        <div className="campo">
          <label htmlFor="fi">Língua estrangeira</label>
          <select id="fi" name="i" value={f.i} onChange={muda('i')}>
            <option value="">Inglês e espanhol</option>
            {Object.entries(IDIOMAS).map(([k, v]) => <option key={k} value={k}>Só {v.toLowerCase()}</option>)}
          </select>
        </div>
      )}
      <div className="campo">
        <label htmlFor="fh">Habilidade</label>
        <select id="fh" name="h" value={f.h} onChange={muda('h')}>
          <option value="">Todas</option>
          {comAtual(habilidades, f.h).map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="fa">Assunto</label>
        <select id="fa" name="a" value={f.a} onChange={muda('a')}>
          <option value="">Todos</option>
          {comAtual(assuntos, f.a).map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="fn">Dificuldade</label>
        <select id="fn" name="n" value={f.n} onChange={muda('n')}>
          <option value="">Todas</option>
          {Object.entries(NIVEIS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="fo">Origem</label>
        <select id="fo" name="o" value={f.o} onChange={muda('o')}>
          <option value="">Todas</option>
          {Object.entries(ORIGENS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="campo">
        <label htmlFor="fs">Situação</label>
        <select id="fs" name="s" value={f.s} onChange={muda('s')}>
          <option value="">Todas</option>
          <option value="nao_feitas">Ainda não fiz</option>
          <option value="erradas">Errei</option>
          <option value="acertadas">Acertei</option>
        </select>
      </div>
      <div className="linha-flex" style={{ gap: 8, alignSelf: 'end' }}>
        <button className="btn btn-azul">Filtrar</button>
        <a href="/aluno/questoes" className="btn btn-linha">Limpar</a>
      </div>
    </form>
  );
}
