'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { emailConvite, enviarEmail } from '@/lib/email';
import { SITE_CURSO } from '@/lib/marca';

export type ResConta = { ok?: string; erro?: string; link?: string };

const txt = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

// ---------- Convite para o responsável ----------
export async function enviarConvite(email: string): Promise<ResConta> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: 'Faça login de novo.' };

  const { data: token, error } = await supabase.rpc('criar_convite', { p_email: email });
  if (error || !token) return { erro: error?.message ?? 'Não foi possível criar o convite.' };

  const { data: perfil } = await supabase.from('perfis').select('nome').eq('id', user.id).single();
  const link = `${SITE_CURSO}/convite/${token}`; // o convite é aceito no site do Gabarito em 15 (mesma conta)
  const msg = emailConvite(String(perfil?.nome ?? ''), link);
  const foi = await enviarEmail({ para: email, assunto: msg.assunto, html: msg.html, texto: msg.texto });

  revalidatePath('/aluno', 'layout');
  return {
    ok: foi ? `Convite enviado para ${email}.` : 'Convite criado. Envie o link abaixo para o seu responsável.',
    link,
  };
}

export async function convidarResponsavel(_: ResConta, f: FormData): Promise<ResConta> {
  const email = txt(f, 'email');
  if (!email.includes('@')) return { erro: 'Informe o e-mail do responsável.' };
  return enviarConvite(email);
}

// O responsável aceita o convite pela página /convite/[token]
export async function aceitarConvite(f: FormData): Promise<void> {
  const token = txt(f, 'token');
  const supabase = await createClient();
  const { error } = await supabase.rpc('aceitar_convite', { p_token: token });
  if (error) redirect(`/convite/${token}?erro=${encodeURIComponent(error.message)}`);
  revalidatePath('/responsavel');
  redirect('/responsavel?aceito=1');
}

// ---------- Apelido e ranking ----------
const APELIDO = /^[\p{L}\p{N}_.-]{3,20}$/u;

export async function participarRanking(_: ResConta, f: FormData): Promise<ResConta> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { erro: 'Faça login de novo.' };
  const apelido = txt(f, 'apelido');
  const participar = f.get('participar') !== 'nao';

  const mudanca: Record<string, unknown> = { participa_ranking: participar };
  if (apelido) {
    if (!APELIDO.test(apelido)) return { erro: 'O apelido precisa ter de 3 a 20 letras ou números, sem espaços.' };
    mudanca.apelido = apelido;
  }
  const { error } = await supabase.from('perfis').update(mudanca).eq('id', user.id);
  if (error) {
    if (error.code === '23505') return { erro: 'Esse apelido já está em uso. Escolha outro.' };
    return { erro: 'Não foi possível salvar: ' + error.message };
  }
  revalidatePath('/aluno', 'layout');
  return { ok: participar ? 'Pronto, você está no ranking.' : 'Você saiu do ranking.' };
}

// ---------- Excluir a própria conta ----------
export async function excluirConta(_: ResConta, f: FormData): Promise<ResConta> {
  if (txt(f, 'confirmacao').toUpperCase() !== 'EXCLUIR') return { erro: 'Digite EXCLUIR para confirmar.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { erro: 'Faça login de novo.' };

  // confirma que é a própria pessoa
  const { error: errSenha } = await supabase.auth.signInWithPassword({ email: user.email, password: String(f.get('senha') ?? '') });
  if (errSenha) return { erro: 'Senha incorreta.' };

  const { error } = await supabase.rpc('excluir_minha_conta');
  if (error) return { erro: error.message };

  try { await supabase.auth.signOut(); } catch { /* a conta já não existe */ }
  const jar = await cookies();
  jar.getAll().filter((c) => c.name.startsWith('sb-')).forEach((c) => jar.delete(c.name));
  redirect('/conta-excluida');
}

// ---------- Responsável ajusta as autorizações ----------
export async function ajustarAutorizacoes(_: ResConta, f: FormData): Promise<ResConta> {
  const limite = txt(f, 'limite');
  const supabase = await createClient();
  const { error } = await supabase.rpc('responsavel_ajustar', {
    p_aluno: txt(f, 'aluno_id'),
    p_ranking: f.get('ranking') === 'on',
    p_avisos: f.get('avisos') === 'on',
    p_limite: limite ? parseInt(limite, 10) : null,
  });
  if (error) return { erro: error.message };
  revalidatePath('/responsavel');
  return { ok: 'Autorizações salvas.' };
}

// ---------- Aparelhos conectados ----------
export async function desconectarAparelho(_: ResConta, f: FormData): Promise<ResConta> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('remover_aparelho', { p_id: txt(f, 'id') });
  if (error) return { erro: 'Não foi possível desconectar agora.' };
  revalidatePath('/aluno/conta');
  return { ok: 'Aparelho desconectado.' };
}
