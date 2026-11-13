import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { acessoAtual } from '@/lib/acesso';
import { carregarQuestoes } from '@/lib/questao';
import { origemQuestao } from '@/components/CartaoQuestao';
import { TextoRico, TextoAlternativa } from '@/components/TextoRico';
import { NIVEIS } from '@/lib/assuntos';
import { BarraImpressao } from '../../BarraImpressao';
import s from '../../imprimir.module.css';

export const metadata = { title: 'Lista para imprimir · A Trilha do ENEM' };

const dd = (n: number) => String(n).padStart(2, '0');

export default async function ImprimirLista({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, perfil, acesso } = await acessoAtual();
  if (!acesso.completo) redirect('/aluno/planos');
  const { data } = await supabase.from('listas_questoes').select('id, titulo, questoes, criada_em').eq('id', id).eq('aluno_id', perfil.id).maybeSingle();
  const lista = data as { id: string; titulo: string; questoes: string[]; criada_em: string } | null;
  if (!lista) notFound();

  const questoes = await carregarQuestoes(supabase, perfil.id, lista.questoes);
  const h = await headers();
  const site = h.get('host') ?? 'gabarito-em-15.vercel.app';
  const linkOnline = `${site}/aluno/questoes/lista/${lista.id}`;
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  return (
    <div className={s.pagina}>
      <style>{`
        @page { size: A4; margin: 12mm 12mm 15mm;
          @bottom-left { content: "A Trilha do ENEM · banco de questões do ENEM"; font: 600 8pt Arial, sans-serif; color: #5b6784; }
          @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 600 8pt Arial, sans-serif; color: #5b6784; } }
        html, body { background: #e9edf5; }
        @media print { html, body { background: #fff; } }
      `}</style>
      <BarraImpressao voltar={`/aluno/questoes/lista/${lista.id}`} />

      <main className={s.folha}>
        <header className={s.capa}>
          <img src="/img/trilha-horizontal.svg" alt="A Trilha do ENEM · banco de questões" className={s.logo} />
          <div className={s.capaTexto}>
            <span className={s.kicker}>Lista sob medida</span>
            <h1 className={s.titulo}>{lista.titulo}</h1>
            <div className={s.chips}>
              <span>{hoje}</span>
              <span>A Trilha do ENEM</span>
            </div>
          </div>
        </header>

        <section className={s.identificacao}>
          <div><span>Aluno</span><b>{perfil.nome}</b></div>
          <div><span>Início</span><b>____:____</b></div>
          <div><span>Fim</span><b>____:____</b></div>
          <div><span>Acertos</span><b>_____ / {questoes.length}</b></div>
        </section>

        <section className={s.instrucoes}>
          <b>Como usar esta lista</b>
          <ol>
            <li>Resolva as questões no papel, com calma, como na prova.</li>
            <li>Marque suas respostas no cartão-resposta da última página.</li>
            <li>Lance as respostas na lista on-line para ver a correção e a resolução comentada: <span className={s.link}>{linkOnline}</span></li>
          </ol>
        </section>

        <div className={s.colunas}>
          {questoes.map((q, i) => {
            const meta = [origemQuestao(q), q.habilidade, q.nivel ? NIVEIS[q.nivel] : null].filter(Boolean).join(' · ');
            const emTexto = q.formato !== 'imagem' || !q.imagem;
            return (
              <article key={q.id} className={s.questao} data-questao>
                <div className={s.qCabeca}>
                  <span className={s.qNumero}>Questão {dd(i + 1)}</span>
                  <span className={s.qMeta}>{meta}</span>
                </div>
                {emTexto ? (
                  <div className={s.qTexto}>
                    <TextoRico texto={q.enunciado} figuras={q.figuras} />
                    <ol className={s.qAlts}>
                      {(['A', 'B', 'C', 'D', 'E'] as const).map((L) => (
                        <li key={L}><b>{L}</b> <TextoAlternativa texto={q[`alt_${L.toLowerCase()}` as 'alt_a'] ?? ''} figuras={q.figuras} /></li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <img src={q.imagem!} alt={`Questão ${i + 1}`} className={s.qImagem} />
                )}
              </article>
            );
          })}
        </div>

        <section className={s.cartao}>
          <div className={s.cartaoTopo}>
            <img src="/img/trilha-icone.svg" alt="" className={s.cartaoIcone} />
            <div>
              <span className={s.kickerEscuro}>Cartão-resposta</span>
              <h2>{lista.titulo}</h2>
            </div>
          </div>
          <div className={s.cartaoAluno}>Aluno: <b>{perfil.nome}</b><span>Data: ____/____/______</span></div>
          <div className={s.grade}>
            {questoes.map((q, i) => (
              <div key={q.id} className={s.linhaCartao}>
                <span className={s.numCartao}>{dd(i + 1)}</span>
                {['A', 'B', 'C', 'D', 'E'].map((L) => <span key={L} className={s.bolha}>{L}</span>)}
              </div>
            ))}
          </div>
          <p className={s.cartaoNota}>
            Preencha uma alternativa por questão. Depois, lance as respostas em <b>{linkOnline}</b> para ver a correção comentada.
          </p>
        </section>
      </main>
    </div>
  );
}
