import { redirect } from 'next/navigation';
import { areaDe } from '@/lib/sessao';
import { acessoAtual } from '@/lib/acesso';
import { Painel, type ItemBarra, type ItemConta, type ItemPainel } from '@/components/Painel';
import { SITE_CURSO } from '@/lib/marca';

const ITENS: ItemPainel[] = [
  { href: '/aluno', rotulo: 'Início', icone: 'inicio', exato: true },
  { href: '/aluno/questoes', rotulo: 'Questões', icone: 'questoes', exceto: ['/aluno/questoes/listas', '/aluno/questoes/lista', '/aluno/questoes/erros'] },
  { href: '/aluno/questoes/erros', rotulo: 'Caderno de erros', icone: 'erros' },
  { href: '/aluno/questoes/listas', rotulo: 'Listas sob medida', icone: 'listas', tambem: ['/aluno/questoes/lista'] },
  { href: '/aluno/planos', rotulo: 'Planos', icone: 'banco' },
];
const RODAPE: ItemPainel[] = [{ href: '/aluno/conta', rotulo: 'Minha conta', icone: 'conta' }];
const BARRA: ItemBarra[] = [
  { href: '/aluno', rotulo: 'Início', icone: 'inicio', exato: true },
  { href: '/aluno/questoes/erros', rotulo: 'Erros', icone: 'erros' },
  { href: '/aluno/questoes', rotulo: 'Questões', icone: 'questoes', destaque: true, exceto: ['/aluno/questoes/erros'] },
];
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/5584991037180';
const CONTA: ItemConta[] = [
  { href: '/aluno/conta', rotulo: 'Meu perfil', icone: 'conta' },
  { href: '/aluno/planos', rotulo: 'Meu plano', icone: 'banco' },
  { href: WHATSAPP, rotulo: 'Suporte pelo WhatsApp', icone: 'duvidas' },
];

export default async function LayoutAluno({ children }: { children: React.ReactNode }) {
  const { perfil, acesso } = await acessoAtual();
  // professor e responsável usam o site do Gabarito em 15 (mesma conta)
  if (perfil.papel !== 'aluno') redirect(`${SITE_CURSO}${areaDe(perfil)}`);
  return (
    <Painel itens={ITENS} rodape={RODAPE} selo={acesso.completo ? 'Banco completo' : 'Plano grátis'} inicio="/aluno" nome={perfil.nome || 'Aluno'} menuConta={CONTA} barra={BARRA}>
      {children}
    </Painel>
  );
}
