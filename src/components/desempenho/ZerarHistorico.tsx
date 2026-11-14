'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zerarHistorico } from '@/app/aluno/actions';
import s from './desempenho.module.css';

// Apaga as respostas do aluno (com confirmação). As de hoje ficam, por causa do limite diário.
export function ZerarHistorico() {
  const [aberto, setAberto] = useState(false);
  const [certo, setCerto] = useState(false);
  const [msg, setMsg] = useState('');
  const [pendente, iniciar] = useTransition();
  const router = useRouter();

  if (!aberto) return (
    <>
      <button type="button" className={s.zerar} onClick={() => { setAberto(true); setMsg(''); }}>Zerar histórico de questões</button>
      {msg && <span role="status" className="suave">{msg}</span>}
    </>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ margin: 0 }}>
        Isso apaga as suas respostas, o seu desempenho e o caderno de erros, e as questões voltam a aparecer como &quot;não resolvidas&quot;.
        As respostas de hoje continuam (elas contam no limite do dia). <b>Não dá para desfazer.</b>
      </p>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontWeight: 600, cursor: 'pointer' }}>
        <input type="checkbox" checked={certo} onChange={(e) => setCerto(e.target.checked)} style={{ width: 20, height: 20 }} />
        Quero apagar o meu histórico de questões
      </label>
      <div className="linha-flex" style={{ gap: 8 }}>
        <button type="button" className={s.zerar} disabled={!certo || pendente}
          onClick={() => iniciar(async () => { const r = await zerarHistorico(); setMsg(r.erro ?? r.ok ?? ''); if (r.ok) { setAberto(false); setCerto(false); router.refresh(); } })}>
          {pendente ? 'Apagando…' : 'Apagar agora'}
        </button>
        <button type="button" className="btn btn-linha" onClick={() => { setAberto(false); setCerto(false); }}>Cancelar</button>
      </div>
      {msg && <span role="status" className="suave">{msg}</span>}
    </div>
  );
}
