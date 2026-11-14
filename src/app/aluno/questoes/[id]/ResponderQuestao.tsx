'use client';

import { useState, useTransition } from 'react';
import { estatisticaQuestao, responderQuestao, type Correcao, type EstatQuestao } from '../../actions';
import { TextoAlternativa, TextoRico } from '@/components/TextoRico';

export type Alternativa = { letra: string; texto: string };
type Inicial = { resposta: string; comentario: string | null; video_url: string | null; minha_letra: string; acertou: boolean } | null;

type Historico = { vezes: number; acertos: number; ultima: boolean | null };

const ordinal = (n: number) => `${n}ª`;

function textoHistorico(h: Historico) {
  if (h.vezes === 1) return `Você já fez esta questão uma vez e ${h.ultima ? 'acertou' : 'errou'}.`;
  return `Você já fez esta questão ${h.vezes} vezes: acertou ${h.acertos} de ${h.vezes}. Na última, ${h.ultima ? 'acertou' : 'errou'}.`;
}

export function ResponderQuestao({ questaoId, alternativas, inicial, figuras = [], taxa, lista = null, historico }: {
  questaoId: string; alternativas: Alternativa[]; inicial: Inicial; figuras?: string[]; taxa?: { respondidas: number; acertadas: number };
  lista?: string | null; historico?: Historico;
}) {
  const [escolha, setEscolha] = useState<string>(inicial?.minha_letra ?? '');
  const [riscadas, setRiscadas] = useState<Set<string>>(new Set());
  const [correcao, setCorrecao] = useState<Correcao | null>(
    inicial ? { acertou: inicial.acertou, resposta: inicial.resposta, comentario: inicial.comentario, video_url: inicial.video_url, primeira: true, vezes: historico?.vezes || undefined, acertos: historico?.acertos } : null,
  );
  const [refazendo, setRefazendo] = useState(false);
  const [agora, setAgora] = useState(false);   // true quando a correção veio de uma resposta dada agora
  const [aba, setAba] = useState<'gabarito' | 'estat'>('gabarito');
  const [estat, setEstat] = useState<EstatQuestao | null>(null);
  const [erroEstat, setErroEstat] = useState('');
  const [erro, setErro] = useState('');
  const [pendente, iniciar] = useTransition();
  const c = refazendo ? null : correcao;
  const soLetras = alternativas.every((a) => !a.texto.trim());

  function responder() {
    if (!escolha) return setErro('Escolha uma alternativa.');
    setErro('');
    iniciar(async () => {
      // dentro da lista vale a primeira resposta; "tentar de novo" vira treino
      const r = await responderQuestao(questaoId, escolha, refazendo || correcao ? null : lista);
      if (r.erro) return setErro(r.erro);
      if (r.correcao) { setCorrecao(r.correcao); setAgora(true); setRefazendo(false); setAba('gabarito'); setEstat(null); }
    });
  }

  async function abrirEstat() {
    setAba('estat');
    if (estat) return;
    setErroEstat('');
    const r = await estatisticaQuestao(questaoId);
    if (r.erro) setErroEstat(r.erro); else if (r.estat) setEstat(r.estat);
  }

  function riscar(letra: string) {
    setRiscadas((r) => { const n = new Set(r); if (n.has(letra)) n.delete(letra); else n.add(letra); return n; });
  }

  const pct = taxa && taxa.respondidas >= 5 ? Math.round((100 * taxa.acertadas) / taxa.respondidas) : null;
  const h = historico ?? { vezes: 0, acertos: 0, ultima: null };

  return (
    <div className="q-resposta">
      {!c && h.vezes > 0 && (
        <div className="q-historico" data-ultima={h.ultima ? 'certa' : 'errada'}>
          <span className="q-historico-icone" aria-hidden="true">{h.ultima ? '✓' : '✕'}</span>
          <span>{textoHistorico(h)}</span>
        </div>
      )}
      {soLetras ? (
        <div className="q-marcar">
          <span className="q-marcar-titulo">{c ? 'Sua resposta' : 'Marque a alternativa'}</span>
          <div role="radiogroup" aria-label="Alternativas" className="q-marcar-letras">
            {alternativas.map((a) => {
              const marcada = escolha === a.letra;
              const estado = c ? (a.letra === c.resposta ? 'certa' : marcada ? 'errada' : '') : marcada ? 'marcada' : '';
              const riscada = riscadas.has(a.letra);
              return (
                <div key={a.letra} className="q-marcar-item">
                  <button type="button" role="radio" aria-checked={marcada} aria-label={`Alternativa ${a.letra}`} disabled={!!c}
                    className="q-marcar-letra" data-estado={estado} data-riscada={riscada ? 'sim' : undefined}
                    onClick={() => setEscolha(a.letra)}>{a.letra}</button>
                  {!c && (
                    <button type="button" className="q-marcar-riscar" onClick={() => riscar(a.letra)}
                      aria-label={`${riscada ? 'Desfazer o risco da' : 'Riscar a'} alternativa ${a.letra}`}>
                      {riscada ? 'desfazer' : 'riscar'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
      <div role="radiogroup" aria-label="Alternativas" className="q-alts">
        {alternativas.map((a) => {
          const marcada = escolha === a.letra;
          const estado = c
            ? a.letra === c.resposta ? 'certa' : marcada ? 'errada' : ''
            : marcada ? 'marcada' : '';
          return (
            <div key={a.letra} className="q-alt" data-estado={estado} data-riscada={riscadas.has(a.letra) ? 'sim' : undefined}>
              <button type="button" role="radio" aria-checked={marcada} disabled={!!c} onClick={() => setEscolha(a.letra)} className="q-alt-botao">
                <b className="q-letra">{a.letra}</b>
                <span className="q-alt-texto"><TextoAlternativa texto={a.texto} figuras={figuras} /></span>
              </button>
              {!c && (
                <button type="button" className="q-riscar" onClick={() => riscar(a.letra)} title={riscadas.has(a.letra) ? 'Desfazer o risco' : 'Riscar esta alternativa'}
                  aria-label={`${riscadas.has(a.letra) ? 'Desfazer o risco da' : 'Riscar a'} alternativa ${a.letra}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
      )}

      {!c ? (
        <div className="linha-flex">
          <button className="q-resolver" onClick={responder} disabled={pendente}>{pendente ? 'Corrigindo…' : 'Resolver questão'}</button>
          {erro && <span role="alert" className="erro">{erro}{/grátis/.test(erro) && <> <a href="/aluno/planos" style={{ fontWeight: 700 }}>Ver planos</a></>}</span>}
        </div>
      ) : (
        <section aria-live="polite" className="q-resultado" data-acertou={c.acertou ? 'sim' : 'nao'}>
          <div className="q-resultado-topo">
            <strong>{c.acertou ? `Você acertou! Resposta: ${c.resposta}` : `Você errou. Resposta certa: ${c.resposta}`}</strong>
            {pct !== null && !c.vezes && <span className="suave" style={{ fontSize: 14 }}>{pct}% dos alunos acertaram</span>}
          </div>
          {c.vezes ? (
            <div className="q-miniestat" aria-label="Seu histórico nesta questão">
              {agora ? <span><b>{ordinal(c.vezes)}</b> tentativa</span> : <span><b>{c.vezes}</b> {c.vezes === 1 ? 'tentativa' : 'tentativas'}</span>}
              <span><b>{c.acertos ?? 0} de {c.vezes}</b> acertos seus</span>
              {pct !== null && <span><b>{pct}%</b> dos alunos acertam</span>}
            </div>
          ) : null}
          <div className="q-abas" role="tablist" aria-label="Depois de responder">
            <button type="button" role="tab" aria-selected={aba === 'gabarito'} onClick={() => setAba('gabarito')}>Gabarito comentado</button>
            <button type="button" role="tab" aria-selected={aba === 'estat'} onClick={abrirEstat}>Estatísticas</button>
          </div>
          {aba === 'gabarito' ? (
            c.comentario ? (
              <div className="q-resolucao-texto" role="tabpanel">
                <p className="q-gabarito-linha">✓ A alternativa <b>{c.resposta}</b> está correta.</p>
                <TextoRico texto={c.comentario} />
              </div>
            ) : (
              <span className="suave" style={{ fontSize: 14 }} role="tabpanel">A resolução comentada desta questão será publicada em breve. Gabarito: <b>{c.resposta}</b>.</span>
            )
          ) : (
            <div className="q-estat" role="tabpanel">
              {erroEstat ? <span className="suave">{erroEstat}</span> : !estat ? <span className="suave">Carregando…</span> : (
                <>
                  <div className="q-estat-topo">
                    <span className="q-anel" style={{ ['--p' as string]: `${estat.total ? Math.round((100 * estat.acertos) / estat.total) : 0}` }}>
                      <b>{estat.total ? Math.round((100 * estat.acertos) / estat.total) : 0}%</b><small>acertos</small>
                    </span>
                    <div>
                      <strong>Desempenho da questão</strong>
                      <span className="suave">{estat.total} {estat.total === 1 ? 'resposta enviada' : 'respostas enviadas'} pelos alunos</span>
                      <div className="q-estat-caixas">
                        <span><small>Acertos</small><b>{estat.acertos}</b></span>
                        <span><small>Erros</small><b>{estat.total - estat.acertos}</b></span>
                      </div>
                    </div>
                  </div>
                  <strong style={{ fontSize: 15 }}>Alternativas marcadas</strong>
                  <span className="suave" style={{ fontSize: 13 }}>Cada tentativa conta como uma marcação.</span>
                  <div className="q-estat-barras">
                    {['A', 'B', 'C', 'D', 'E'].map((L) => {
                      const n = estat.letras[L] ?? 0;
                      const p = estat.total ? Math.round((100 * n) / estat.total) : 0;
                      return (
                        <div key={L} className="q-estat-barra" data-certa={L === c.resposta || undefined}>
                          <b>{L}</b><em>{L === c.resposta ? 'Gabarito' : ''}</em>
                          <span className="q-estat-trilho"><span style={{ width: `${p}%` }} /></span>
                          <span className="q-estat-n">{n} · {p}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="linha-flex">
            {c.video_url && <a href={c.video_url} target="_blank" rel="noopener" className="btn btn-linha">Resolução em vídeo</a>}
            <button className="btn btn-linha" onClick={() => { setRefazendo(true); setEscolha(''); setRiscadas(new Set()); }}>Tentar de novo</button>
          </div>
        </section>
      )}
    </div>
  );
}
