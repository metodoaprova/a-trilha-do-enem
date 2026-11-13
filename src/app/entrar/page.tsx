import { CabecalhoSite } from '@/components/cabecalho/CabecalhoSite';
import { FormularioEntrar } from './FormularioEntrar';
import styles from './entrar.module.css';

export const metadata = { title: 'Entrar ou criar conta · A Trilha do ENEM' };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ modo?: string; aviso?: string; proximo?: string; responsavel?: string }> }) {
  const { modo, aviso, proximo, responsavel } = await searchParams;
  const destino = proximo && /^\/convite\/[0-9a-f-]{36}$/i.test(proximo) ? proximo : undefined;
  return (
    <div className={styles.pagina}>
      <CabecalhoSite />
      <main className={`container ${styles.duas}`}>
        <FormularioEntrar
          criarPrimeiro={modo === 'criar' || !!destino || responsavel === '1'}
          esqueciInicial={modo === 'esqueci'}
          aviso={aviso}
          proximo={destino}
          responsavelInicial={responsavel === '1'}
        />
      </main>
    </div>
  );
}
