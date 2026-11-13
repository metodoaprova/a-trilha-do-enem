import Link from 'next/link';

export function Marca({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="marca" aria-label="A Trilha do ENEM, página inicial">
      <img src="/img/trilha-icone.svg" alt="" width={42} height={42} />
      <span>
        A TRILHA <em>do</em> <b>ENEM</b>
      </span>
    </Link>
  );
}
