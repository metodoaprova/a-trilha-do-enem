import Link from 'next/link';
import s from './desempenho.module.css';

const ABAS = [
  { href: '/aluno/questoes', rotulo: 'Resolver questões', chave: 'resolver' },
  { href: '/aluno/questoes/desempenho', rotulo: 'Meu desempenho', chave: 'desempenho' },
  { href: '/aluno/questoes/erros', rotulo: 'Caderno de erros', chave: 'erros' },
  { href: '/aluno/questoes/listas', rotulo: 'Listas sob medida', chave: 'listas' },
] as const;

export type AbaQuestoes = (typeof ABAS)[number]['chave'];

// Abas da área de questões (Resolver · Meu desempenho · Caderno de erros · Listas)
export function AbasQuestoes({ atual, ocultar = [] }: { atual: AbaQuestoes; ocultar?: AbaQuestoes[] }) {
  return (
    <nav className={s.abas} aria-label="Questões">
      {ABAS.filter((a) => !ocultar.includes(a.chave)).map((a) => (
        <Link key={a.chave} href={a.href} className={s.aba} aria-current={a.chave === atual ? 'page' : undefined}>{a.rotulo}</Link>
      ))}
    </nav>
  );
}
