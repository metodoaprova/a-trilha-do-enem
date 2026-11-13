import Link from 'next/link';
import { Marca } from '@/components/Marca';
import { createClient } from '@/lib/supabase/server';
import { SITE_CURSO } from '@/lib/marca';
import s from './cabecalho.module.css';

// Cabeçalho das páginas públicas da A Trilha do ENEM
export async function CabecalhoSite() {
  let logado = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    logado = !!data.user;
  } catch { /* sem conexão: mostra Entrar */ }
  return (
    <header className={s.cabecalho}>
      <div className={`cartao-gradiente ${s.barra}`}>
        <div className={`container ${s.dentro}`}>
          <Marca />
          <nav className={s.menu} aria-label="Menu principal">
            <Link href="/#como">Como funciona</Link>
            <Link href="/#planos">Planos</Link>
            <a href={SITE_CURSO} target="_blank" rel="noopener">Curso Gabarito em 15</a>
          </nav>
          <div className={s.conta}>
            {logado ? (
              <Link href="/aluno" className="btn btn-ciano">Minha área</Link>
            ) : (
              <>
                <Link href="/entrar" className={s.entrar}>Entrar</Link>
                <Link href="/entrar?modo=criar" className="btn btn-ciano">Cadastre-se grátis</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
