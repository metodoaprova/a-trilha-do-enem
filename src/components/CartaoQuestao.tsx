import Link from 'next/link';
import { NIVEIS, ORIGENS } from '@/lib/assuntos';
import { AREAS_CURTO, IDIOMAS } from '@/lib/acesso';
import type { QuestaoCompleta } from '@/lib/questao';
import { TextoRico } from '@/components/TextoRico';
import { ImagemQuestao } from '@/components/ImagemQuestao';
import { ResponderQuestao, type Alternativa } from '@/app/aluno/questoes/[id]/ResponderQuestao';

const APLIC: Record<string, string> = { REG: '', PPL: 'PPL', REA: 'Reaplicação', DIG: 'Digital', D4: 'Reaplicação' };

export function origemQuestao(q: Pick<QuestaoCompleta, 'origem' | 'ano' | 'aplicacao' | 'numero_prova'>) {
  if (q.origem !== 'enem') return ORIGENS[q.origem] ?? q.origem;
  const apl = q.aplicacao ? APLIC[q.aplicacao] ?? q.aplicacao : '';
  return `ENEM ${q.ano ?? ''}${apl ? ` ${apl}` : ''}${q.numero_prova ? ` · Questão ${q.numero_prova}` : ''}`;
}

// Uma questão completa, no formato do caderno: cabeçalho, texto (ou recorte da prova), alternativas e correção
export function CartaoQuestao({ q, numero, total, id, lista }: { q: QuestaoCompleta; numero?: number; total?: number; id?: string; lista?: string | null }) {
  const emTexto = q.formato !== 'imagem' || !q.imagem;
  const alternativas: Alternativa[] = (['A', 'B', 'C', 'D', 'E'] as const).map((L) => ({
    letra: L,
    texto: emTexto ? q[`alt_${L.toLowerCase()}` as 'alt_a'] ?? '' : '',
  }));
  const area = q.area && q.area !== 'matematica' ? AREAS_CURTO[q.area] : null;
  const meta = [area, q.disciplina, q.idioma ? IDIOMAS[q.idioma] : null, q.habilidade, q.assunto, q.nivel ? NIVEIS[q.nivel] : null].filter(Boolean).join(' · ');

  return (
    <article className="q-cartao" id={id}>
      <header className="q-cabeca">
        <div style={{ minWidth: 0 }}>
          {numero && total ? <span className="q-num">Questão {numero} de {total}</span> : null}
          <span className="q-origem">{origemQuestao(q)}</span>
          {meta && <span className="q-meta">{meta}</span>}
        </div>
        <div className="q-acoes">
          {emTexto && q.imagem && (
            <a href={q.imagem} target="_blank" rel="noopener" className="q-acao" title="Ver esta questão como aparece no caderno do ENEM">Ver na prova</a>
          )}
          <Link href={`/aluno/duvidas?ctx=${encodeURIComponent(`Banco · ${q.codigo}`)}`} className="q-acao">Perguntar ao professor</Link>
        </div>
      </header>
      <div className="q-corpo">
        {emTexto ? (
          <TextoRico texto={q.enunciado} figuras={q.figuras} />
        ) : (
          <div className="q-imagem-prova">
            <ImagemQuestao src={q.imagem!} alt={`Questão ${q.codigo}, como aparece no caderno da prova`} />
            <span className="suave" style={{ fontSize: 12.5, display: 'block', marginTop: 6 }}>Toque na imagem para ampliar.</span>
          </div>
        )}
        <ResponderQuestao key={`${q.id}-${lista ?? ''}`} questaoId={q.id} alternativas={alternativas} inicial={q.resolucao} figuras={q.figuras}
          taxa={{ respondidas: q.respondidas, acertadas: q.acertadas }} lista={lista} historico={q.historico} />
      </div>
    </article>
  );
}
