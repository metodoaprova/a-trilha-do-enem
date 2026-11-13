import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { COOKIE_APARELHO, COOKIE_CONFERIDO } from '@/lib/supabase/aparelho';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const [, aparelho] = (request.cookies.get(COOKIE_APARELHO)?.value ?? '').split('.');
  if (aparelho) await supabase.rpc('remover_aparelho', { p_id: aparelho }).then(() => null, () => null);
  await supabase.auth.signOut();
  const f = await request.formData().catch(() => null);
  const proximo = String(f?.get('proximo') ?? '');
  const destino = /^\/convite\/[0-9a-f-]{36}$/i.test(proximo) ? proximo : '/';
  const resposta = NextResponse.redirect(new URL(destino, request.url), { status: 303 });
  resposta.cookies.delete(COOKIE_APARELHO);
  resposta.cookies.delete(COOKIE_CONFERIDO);
  return resposta;
}
