import Link from 'next/link';
import { CabecalhoSite } from '@/components/cabecalho/CabecalhoSite';
import { createClient } from '@/lib/supabase/server';
import { SITE_CURSO } from '@/lib/marca';
import styles from './vitrine.module.css';

export const dynamic = 'force-dynamic';

type Produto = { slug: string; venda_aberta: boolean; checkout_url: string | null; tipo?: string };

async function carregarProdutos(): Promise<Produto[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from('produtos').select('*');
    return data ?? [];
  } catch {
    return [];
  }
}

const RECURSOS = [
  { n: '4', t: 'áreas do ENEM', d: 'Linguagens, Humanas, Natureza e Matemática, com inglês e espanhol.' },
  { n: 'Aa', t: 'Em texto, como na prova', d: 'Questões digitadas, com figuras e gráficos no lugar certo e o botão "Ver na prova".' },
  { n: '✓', t: 'Resolução comentada', d: 'Gabarito oficial e a explicação passo a passo, com o erro que mais derruba.' },
  { n: '45', t: 'Listas sob medida', d: 'Escolha área, assunto, habilidade e dificuldade. Imprima em duas colunas, no padrão da prova.' },
];

const PASSOS = [
  { t: 'Crie sua conta grátis', d: 'Só nome, e-mail e ano de nascimento. Em um minuto você já está respondendo.' },
  { t: 'Escolha o seu caminho', d: 'Filtre pela área que mais pesa para você, pelo assunto que trava ou pela habilidade da matriz.' },
  { t: 'Responda e aprenda com o erro', d: 'Veja na hora o gabarito, a resolução e quanto você e os outros alunos acertam em cada questão.' },
];

export default async function Vitrine() {
  const produtos = await carregarProdutos();
  const banco = produtos.find((p) => p.tipo === 'banco' && p.venda_aberta && p.checkout_url);

  return (
    <>
      <CabecalhoSite />
      <div className="container" style={{ paddingTop: 28 }}>
        <main className={styles.pagina}>
          <section className={`cartao-gradiente ${styles.hero}`} aria-labelledby="titulo">
            <div className={styles.heroTexto}>
              <span className="rotulo" style={{ color: 'var(--ciano)' }}>BANCO DE QUESTÕES DO ENEM</span>
              <h1 id="titulo" className="display">Siga a trilha: questão por questão até a sua nota.</h1>
              <p>Questões oficiais do ENEM das 4 áreas, em texto, com gabarito e resolução comentada. Monte listas do seu jeito e veja a sua evolução em cada questão.</p>
              <div className="linha-flex" style={{ gap: 12 }}>
                <Link href="/entrar?modo=criar" className="btn btn-ciano btn-grande">Começar grátis</Link>
                <Link href="/#planos" className="btn btn-linha btn-grande">Ver os planos</Link>
              </div>
              <small style={{ opacity: 0.8 }}>Grátis: 10 questões por dia, sem cartão de crédito.</small>
            </div>
            <div className={styles.heroQuestao} aria-hidden="true">
              <div className={styles.qDemo}>
                <div className={styles.qDemoTopo}><b>QUESTÃO 148</b><span>ENEM · Matemática · H19 · Fácil</span></div>
                <p>Uma chapa de 1 mm de espessura é dobrada ao meio sucessivas vezes. Qual é a espessura, em milímetro, após a 6ª dobra?</p>
                <ul>
                  <li>A 12</li><li>B 32</li><li className={styles.certa}>C 64 <em>✓ Correta</em></li><li>D 128</li><li>E 256</li>
                </ul>
                <div className={styles.qDemoRes}><b>Resolução comentada</b> A cada dobra a espessura dobra: 2 × 2 × 2 × 2 × 2 × 2 = 64. Erro comum: somar 2 a cada dobra.</div>
                <div className={styles.qDemoEst}>72% dos alunos acertam · 1ª tentativa sua</div>
              </div>
            </div>
          </section>

          <section aria-label="O que tem na A Trilha do ENEM" className={styles.recursos}>
            {RECURSOS.map((r) => (
              <div key={r.t} className={`cartao ${styles.recurso}`}>
                <span className={styles.recursoN}>{r.n}</span>
                <strong>{r.t}</strong>
                <p>{r.d}</p>
              </div>
            ))}
          </section>

          <section id="como" aria-labelledby="como-t" className={styles.secao}>
            <span className="rotulo">COMO FUNCIONA</span>
            <h2 id="como-t" className="display">Três passos, todos os dias</h2>
            <ol className={styles.passos}>
              {PASSOS.map((p, i) => (
                <li key={p.t} className="cartao">
                  <span className={styles.passoN}>{i + 1}</span>
                  <strong>{p.t}</strong>
                  <p>{p.d}</p>
                </li>
              ))}
            </ol>
          </section>

          <section id="planos" aria-labelledby="planos-t" className={styles.secao}>
            <span className="rotulo">PLANOS</span>
            <h2 id="planos-t" className="display">Comece grátis. Desbloqueie quando quiser.</h2>
            <div className={styles.planos}>
              <div className={`cartao ${styles.plano}`}>
                <h3 className="display">Grátis</h3>
                <ul>
                  <li>10 questões por dia, com gabarito e resolução</li>
                  <li>Listas sob medida de até 10 questões</li>
                  <li>Histórico do que você já fez</li>
                </ul>
                <Link href="/entrar?modo=criar" className="btn btn-linha">Criar conta grátis</Link>
              </div>
              <div className={`cartao ${styles.plano} ${styles.planoDestaque}`}>
                <span className={styles.selo}>MAIS COMPLETO</span>
                <h3 className="display">Banco completo</h3>
                <ul>
                  <li>Questões sem limite por dia</li>
                  <li>Listas sob medida de até 45 questões</li>
                  <li>Listas para imprimir em duas colunas, no padrão da prova</li>
                  <li>Acesso sem prazo de término</li>
                </ul>
                {banco ? <a href={banco.checkout_url!} className="btn btn-azul" target="_blank" rel="noopener">Desbloquear o banco completo</a>
                  : <span className="suave">Em breve.</span>}
              </div>
              <div className={`cartao ${styles.plano}`}>
                <h3 className="display">Curso Gabarito em 15</h3>
                <ul>
                  <li>Matemática do ENEM em 15 minutos por dia</li>
                  <li>Aulas, minissimulados e simulados</li>
                  <li>Banco completo incluído, com a mesma conta</li>
                </ul>
                <a href={SITE_CURSO} className="btn btn-linha" target="_blank" rel="noopener">Conhecer o curso</a>
              </div>
            </div>
            <p className="suave" style={{ margin: 0, fontSize: 14 }}>Já comprou o banco completo ou o curso? Entre com o mesmo e-mail da compra: o acesso aparece sozinho.</p>
          </section>
        </main>

        <footer className={styles.rodape}>
          <img src="/img/trilha-horizontal.svg" alt="A Trilha do ENEM · banco de questões" width={240} height={135} />
          <span>A Trilha do ENEM faz parte do <a href={SITE_CURSO} target="_blank" rel="noopener">Gabarito em 15</a> e usa a mesma conta.</span>
          <span className="linha-flex" style={{ gap: 16 }}>
            <Link href="/termos">Termos de uso</Link>
            <Link href="/privacidade">Privacidade</Link>
          </span>
          <small style={{ opacity: 0.75, fontSize: 13, textAlign: 'center' }}>
            ANA LUIZA BRITO E SILVA · CNPJ 65.772.062/0001-67 · projetoenemem15@gmail.com
          </small>
        </footer>
      </div>
    </>
  );
}
