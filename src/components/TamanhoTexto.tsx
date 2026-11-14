'use client';

import { useEffect, useState } from 'react';

const PASSOS = [0.88, 1, 1.12, 1.25, 1.4];

// A- / A+ : tamanho do texto das questões (fica salvo neste aparelho)
export function TamanhoTexto() {
  const [i, setI] = useState(1);
  useEffect(() => {
    try { const v = Number(localStorage.getItem('q-escala')); if (PASSOS.includes(v)) setI(PASSOS.indexOf(v)); } catch { /* sem armazenamento */ }
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty('--q-escala', String(PASSOS[i]));
    try { localStorage.setItem('q-escala', String(PASSOS[i])); } catch { /* sem armazenamento */ }
  }, [i]);
  return (
    <div className="q-tamanho" role="group" aria-label="Tamanho do texto das questões">
      <button type="button" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label="Diminuir o texto">A−</button>
      <button type="button" onClick={() => setI((x) => Math.min(PASSOS.length - 1, x + 1))} disabled={i === PASSOS.length - 1} aria-label="Aumentar o texto">A+</button>
    </div>
  );
}
