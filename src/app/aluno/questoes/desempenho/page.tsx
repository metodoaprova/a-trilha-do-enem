import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { AbasQuestoes } from '@/components/desempenho/AbasQuestoes';
import { PainelDesempenho } from '@/components/desempenho/PainelDesempenho';
import { lerDesempenho, lerPeriodo } from '@/lib/desempenho';
import Link from 'next/link';
import dz from '@/components/desempenho/desempenho.module.css';

export const metadata = { title: 'Banco de questões · A Trilha do ENEM' };

export default async function MeuDesempenho({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const periodo = lerPeriodo((await searchParams).periodo);
  const { supabase, perfil, acesso } = await acessoAtual();
  const { d, falta } = await lerDesempenho(supabase, periodo);
  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões' }]} />
      <AbasQuestoes atual="desempenho" />
      <PainelDesempenho d={d} periodo={periodo} base="/aluno/questoes/desempenho" falta={falta}
        saudacao={
          <section className={`cartao-gradiente ${dz.ola}`} aria-labelledby="ola">
            <span className={dz.selo}>{acesso.completo ? 'Banco completo' : 'Plano grátis'}</span>
            <h1 id="ola" className="display">Olá, {(perfil.nome || 'estudante').split(' ')[0]}!</h1>
            <p>Acompanhe o seu desempenho no banco de questões e alcance as suas metas de estudo.</p>
            <div className="linha-flex" style={{ gap: 10 }}>
              <Link href="/aluno/questoes" className="btn btn-ciano">Resolver questões</Link>
              <Link href="/aluno/questoes/listas" className="btn btn-linha">Montar uma lista</Link>
            </div>
          </section>
        } />
    </>
  );
}
