'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Marca } from '@/components/Marca';

// Ícones de traço simples (24×24)
const ICONES: Record<string, string> = {
  inicio: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  aulas: 'M4 5h16v11H4zM8 20h8M12 16v4M10 8.5v4l3.5-2z',
  questoes: 'M5 4h14v16H5zM9 9h6M9 13h6M9 17h3',
  listas: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  simulados: 'M7 3h10v4H7zM5 7h14v14H5zM9 12l2 2 4-4',
  mini: 'M12 7v5l3 2M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z',
  habilidades: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z',
  estatisticas: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  duvidas: 'M4 5h16v11H9l-5 4zM12 8.5a1.6 1.6 0 1 1 1.6 1.6c-.9 0-1.6.6-1.6 1.4M12 13.5h.01',
  conta: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  turmas: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M14 20a6 6 0 0 1 8-5.6',
  alerta: 'M12 3l10 17H2zM12 10v4M12 17h.01',
  banco: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  sair: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  erros: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM6 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2M10 10l4 4m0-4-4 4',
  menu: 'M4 7h16M4 12h16M4 17h16',
};

export type ItemPainel = {
  href: string;
  rotulo: string;
  icone: keyof typeof ICONES;
  exato?: boolean;          // ativo só na rota exata
  tambem?: string[];        // outras rotas que acendem este item
  exceto?: string[];        // rotas que NÃO acendem este item
  contador?: number;
  padrao?: boolean;        // ativo também quando o parâmetro da busca não está na URL
};

function Icone({ nome }: { nome: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONES[nome] ?? ''} />
    </svg>
  );
}

function ativoPara(item: ItemPainel, rota: string, busca: URLSearchParams | null) {
  const [base, query] = item.href.split('?');
  if (item.exceto?.some((e) => rota.startsWith(e))) return false;
  if (item.tambem?.some((t) => rota.startsWith(t))) return true;
  const casaRota = item.exato ? rota === base : rota === base || rota.startsWith(base + '/');
  if (!casaRota) return false;
  if (!query || !busca) return !query;
  for (const [k, v] of new URLSearchParams(query)) {
    const atual = busca.get(k);
    if (atual === null ? !item.padrao : atual !== v) return false;
  }
  return true;
}

function Lista({ itens, aoNavegar, rota, busca }: { itens: ItemPainel[]; aoNavegar: () => void; rota: string; busca: URLSearchParams | null }) {
  return (
    <>
      {itens.map((i) => {
        const ativo = ativoPara(i, rota, busca);
        return (
          <Link key={i.href} href={i.href} onClick={aoNavegar} className="painel-item" aria-current={ativo ? 'page' : undefined} title={i.rotulo}>
            <Icone nome={i.icone} />
            <span className="painel-rotulo">{i.rotulo}</span>
            {!!i.contador && i.contador > 0 && <span className="bolinha" aria-label={`${i.contador} pendentes`}>{i.contador}</span>}
          </Link>
        );
      })}
    </>
  );
}

function ItensSemBusca(props: { itens: ItemPainel[]; aoNavegar: () => void }) {
  return <Lista {...props} rota={usePathname()} busca={null} />;
}

function ItensComBusca(props: { itens: ItemPainel[]; aoNavegar: () => void }) {
  const rota = usePathname();
  const busca = useSearchParams();
  return <Lista {...props} rota={rota} busca={new URLSearchParams(busca.toString())} />;
}

export type ItemConta = { href: string; rotulo: string; icone: keyof typeof ICONES };

const saudacao = (h: number) => (h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite');

// Avatar + nome no topo: ao clicar, abre o menu da conta (perfil, estatísticas, suporte, sair)
function MenuConta({ nome, itens }: { nome: string; itens: ItemConta[] }) {
  const [aberto, setAberto] = useState(false);
  const [ola, setOla] = useState('Olá');
  const caixa = useRef<HTMLDivElement>(null);
  const rota = usePathname();
  useEffect(() => setOla(saudacao(new Date().getHours())), []);
  useEffect(() => setAberto(false), [rota]);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => { if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false); };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);
  const externo = (h: string) => /^https?:\/\//.test(h);

  return (
    <div className="conta-menu" ref={caixa}>
      <button type="button" className="painel-usuario" aria-haspopup="menu" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <span className="painel-nome-caixa">
          <span className="painel-ola">{ola},</span>
          <span className="painel-nome">{nome}</span>
        </span>
        <svg className="conta-seta" width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 5.5 7 9.5l4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className="painel-avatar" aria-hidden="true">{(nome.trim()[0] || '?').toUpperCase()}</span>
      </button>
      {aberto && (
        <div className="conta-caixa" role="menu">
          <div className="conta-cabeca">
            <span className="painel-avatar" aria-hidden="true">{(nome.trim()[0] || '?').toUpperCase()}</span>
            <span><small>{ola},</small><strong>{nome}</strong></span>
          </div>
          {itens.map((i) => (
            <Link key={i.href} href={i.href} role="menuitem" className="conta-item" onClick={() => setAberto(false)}
              {...(externo(i.href) ? { target: '_blank', rel: 'noopener' } : {})}>
              <Icone nome={i.icone} /> {i.rotulo}
            </Link>
          ))}
          <form action="/sair" method="post" className="conta-sair">
            <button role="menuitem" className="conta-item"><Icone nome="sair" /> Sair</button>
          </form>
        </div>
      )}
    </div>
  );
}

export type ItemBarra = { href: string; rotulo: string; icone: keyof typeof ICONES; destaque?: boolean; exato?: boolean; exceto?: string[] };

// Barra de navegação no pé da tela (só no celular): atalhos + "Menu" (abre o menu lateral) + perfil
function BarraCelular({ itens, nome, perfil, abrirMenu, menuAberto }: { itens: ItemBarra[]; nome: string; perfil: string; abrirMenu: () => void; menuAberto: boolean }) {
  const rota = usePathname();
  const ativo = (i: ItemBarra) => (i.exato ? rota === i.href : (rota === i.href || rota.startsWith(i.href + '/')) && !(i.exceto ?? []).some((e) => rota.startsWith(e)));
  return (
    <nav className="barra-celular" aria-label="Atalhos">
      {itens.map((i) => (
        <Link key={i.href} href={i.href} className={`barra-item${i.destaque ? ' barra-destaque' : ''}`} aria-current={ativo(i) ? 'page' : undefined}>
          <Icone nome={i.icone} /><span>{i.rotulo}</span>
        </Link>
      ))}
      <button type="button" className="barra-item" aria-controls="menu-lateral" aria-expanded={menuAberto} onClick={abrirMenu}>
        <Icone nome="menu" /><span>Menu</span>
      </button>
      <Link href={perfil} className="barra-item" aria-current={rota === perfil ? 'page' : undefined}>
        <span className="barra-avatar" aria-hidden="true">{(nome.trim()[0] || '?').toUpperCase()}</span><span>{nome.split(' ')[0] || 'Perfil'}</span>
      </Link>
    </nav>
  );
}

export function Painel({ itens, rodape, inicio, nome, menuConta = [], selo, barra, perfil = '/aluno/conta', children }: {
  itens: ItemPainel[]; rodape?: ItemPainel[]; inicio: string; nome: string; menuConta?: ItemConta[]; selo?: string;
  barra?: ItemBarra[]; perfil?: string; children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const rota = usePathname();
  useEffect(() => setAberto(false), [rota]);
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberto(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [aberto]);
  const fechar = () => setAberto(false);

  return (
    <div className="painel" data-aberto={aberto ? 'sim' : 'nao'} data-barra={barra?.length ? 'sim' : undefined}>
      <aside className="painel-lateral" id="menu-lateral" aria-label="Menu principal">
        <div className="painel-marca">
          <Marca href={inicio} />
          {selo && <span className="painel-selo">{selo}</span>}
        </div>
        <nav className="painel-nav">
          <Suspense fallback={<ItensSemBusca itens={itens} aoNavegar={fechar} />}>
            <ItensComBusca itens={itens} aoNavegar={fechar} />
          </Suspense>
        </nav>
        <div className="painel-rodape">
          {rodape && (
            <Suspense fallback={<ItensSemBusca itens={rodape} aoNavegar={fechar} />}>
              <ItensComBusca itens={rodape} aoNavegar={fechar} />
            </Suspense>
          )}
          <form action="/sair" method="post">
            <button className="painel-item painel-sair"><Icone nome="sair" /><span className="painel-rotulo">Sair</span></button>
          </form>
        </div>
      </aside>
      <button className="painel-fundo" aria-label="Fechar menu" tabIndex={aberto ? 0 : -1} onClick={fechar} />

      <div className="painel-corpo">
        <header className="painel-topo">
          <button className="painel-hamburguer" aria-label="Abrir menu" aria-controls="menu-lateral" aria-expanded={aberto} onClick={() => setAberto(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <span className="painel-topo-marca"><Marca href={inicio} /></span>
          <MenuConta nome={nome} itens={menuConta} />
        </header>
        <main className="painel-conteudo">{children}</main>
      </div>
      {barra?.length ? <BarraCelular itens={barra} nome={nome} perfil={perfil} abrirMenu={() => setAberto(true)} menuAberto={aberto} /> : null}
    </div>
  );
}
