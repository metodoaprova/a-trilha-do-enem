import type { Metadata, Viewport } from 'next';
import { Montserrat, Figtree, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});
const figtree = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'A Trilha do ENEM · banco de questões do ENEM',
  description: 'Questões oficiais do ENEM das 4 áreas, em texto, com gabarito, resolução comentada e listas sob medida.',
  icons: { icon: '/img/trilha-icone.svg' },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${figtree.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
