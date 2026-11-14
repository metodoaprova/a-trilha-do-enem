import { acessoAtual } from '@/lib/acesso';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { AbasQuestoes } from '@/components/desempenho/AbasQuestoes';
import { PainelDesempenho } from '@/components/desempenho/PainelDesempenho';
import { lerDesempenho, lerPeriodo } from '@/lib/desempenho';
import s from '../../aluno.module.css';

export const metadata = { title: 'Meu desempenho · A Trilha do ENEM' };

export default async function MeuDesempenho({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const periodo = lerPeriodo((await searchParams).periodo);
  const { supabase } = await acessoAtual();
  const { d, falta } = await lerDesempenho(supabase, periodo);
  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Questões', href: '/aluno/questoes' }, { rotulo: 'Meu desempenho' }]} />
      <AbasQuestoes atual="desempenho" />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Meu desempenho</h1>
        <span className="suave">Tudo o que você respondeu no banco de questões e nas listas.</span>
      </div>
      <PainelDesempenho d={d} periodo={periodo} base="/aluno/questoes/desempenho" falta={falta} />
    </>
  );
}
