import { CabecalhoSite } from '@/components/cabecalho/CabecalhoSite';

export function PaginaTexto({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <>
    <CabecalhoSite />
    <div className="container" style={{ maxWidth: 820 }}>
      <main style={{ paddingBlock: '32px 64px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h1 className="display" style={{ margin: 0, fontSize: 'clamp(28px, 3.4vw, 40px)' }}>{titulo}</h1>
        {children}
      </main>
    </div>
    </>
  );
}
