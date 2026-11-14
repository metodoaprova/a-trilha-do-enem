'use client';

import { useState, useTransition } from 'react';
import { avisarErroQuestao } from '@/app/aluno/actions';

const MOTIVOS: [string, string][] = [
  ['gabarito', 'O gabarito parece errado'], ['enunciado', 'Erro no texto da questão'], ['figura', 'Figura faltando ou errada'],
  ['resolucao', 'Erro na resolução comentada'], ['outro', 'Outro problema'],
];

// "Avisar erro": o aluno conta o que está errado na questão e o professor recebe no painel
export function AvisarErro({ questaoId }: { questaoId: string }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState('gabarito');
  const [texto, setTexto] = useState('');
  const [msg, setMsg] = useState<{ ok?: string; erro?: string }>({});
  const [pendente, iniciar] = useTransition();

  if (msg.ok) return <span className="q-aviso-ok" role="status">{msg.ok}</span>;
  return (
    <div className="q-aviso">
      <button type="button" className="q-acao q-acao-aviso" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 21V4m0 0h11l-2 4 2 4H5" /></svg>
        Avisar erro
      </button>
      {aberto && (
        <div className="q-aviso-caixa">
          <label className="campo">
            <span style={{ fontWeight: 600, fontSize: 14 }}>O que está errado?</span>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {MOTIVOS.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
            </select>
          </label>
          <label className="campo">
            <span style={{ fontWeight: 600, fontSize: 14 }}>Conte em poucas palavras (opcional)</span>
            <textarea rows={3} maxLength={1000} value={texto} onChange={(e) => setTexto(e.target.value)} />
          </label>
          <div className="linha-flex" style={{ gap: 8 }}>
            <button type="button" className="btn btn-azul" disabled={pendente}
              onClick={() => iniciar(async () => setMsg(await avisarErroQuestao(questaoId, motivo, texto)))}>{pendente ? 'Enviando…' : 'Enviar aviso'}</button>
            <button type="button" className="btn btn-linha" onClick={() => setAberto(false)}>Cancelar</button>
          </div>
          {msg.erro && <span className="erro" role="alert">{msg.erro}</span>}
        </div>
      )}
    </div>
  );
}
