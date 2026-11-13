import { acessoAtual } from '@/lib/acesso';
import { InicioBanco } from './InicioBanco';

export const metadata = { title: 'Meu painel · A Trilha do ENEM' };

// A Trilha do ENEM é só o banco de questões: o início é sempre o do banco
export default async function PainelAluno() {
  const { supabase, perfil, acesso } = await acessoAtual();
  return <InicioBanco supabase={supabase} perfil={perfil} acesso={acesso} />;
}
