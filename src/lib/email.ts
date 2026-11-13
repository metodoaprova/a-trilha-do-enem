import { headers } from 'next/headers';

// Envio de e-mails pelo Resend. Enquanto RESEND_API_KEY e EMAIL_REMETENTE não estiverem
// cadastrados na Vercel, nada é enviado e a função devolve false (o site mostra o link para copiar).
export async function enviarEmail({ para, assunto, html, texto }: { para: string; assunto: string; html: string; texto: string }): Promise<boolean> {
  const chave = process.env.RESEND_API_KEY;
  const de = process.env.EMAIL_REMETENTE;
  if (!chave || !de) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: de, to: [para], subject: assunto, html, text: texto }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

// Endereço do site a partir da própria requisição (funciona no vercel.app e no domínio próprio)
export async function enderecoDoSite(): Promise<string> {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (host) return `${h.get('x-forwarded-proto') ?? 'https'}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL ?? '';
}

const escapar = (t: string) => t.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

export function emailConvite(nomeAluno: string, link: string) {
  const nome = escapar(nomeAluno || 'Um aluno');
  return {
    assunto: `${nomeAluno || 'Um aluno'} convidou você para acompanhar os estudos no Gabarito em 15`,
    texto: `${nomeAluno || 'Um aluno'} indicou você como responsável no curso Gabarito em 15 · Matemática para o ENEM.\n\nPara acompanhar o progresso e autorizar (ou não) a participação no ranking da turma, abra o link:\n${link}\n\nSe você não conhece este aluno, ignore este e-mail.`,
    html: `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#03102e">
<p><strong>${nome}</strong> indicou você como responsável no curso <strong>Gabarito em 15 · Matemática para o ENEM</strong>.</p>
<p>Com a sua conta de responsável você acompanha o progresso e decide se ${nome} pode participar do ranking da turma.</p>
<p><a href="${link}" style="display:inline-block;background:#1f6bff;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:bold">Aceitar o convite</a></p>
<p style="color:#555;font-size:14px">Se você não conhece este aluno, ignore este e-mail.</p></div>`,
  };
}
