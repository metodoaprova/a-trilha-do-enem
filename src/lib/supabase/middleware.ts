import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_APARELHO, COOKIE_CONFERIDO, conferirAparelho, rotaComLimite } from './aparelho';

const AREAS_LOGADAS = ['/aluno', '/boas-vindas', '/professor', '/responsavel'];

// Renova a sessão a cada visita e protege as áreas que exigem login
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  let destino: string | null = null;

  // conta pessoal: limite de aparelhos conectados ao mesmo tempo (só nas áreas do aluno)
  if (user && rotaComLimite(path)) {
    const situacao = await conferirAparelho(supabase, request, response, user.id);
    if (situacao === 'desconectado') {
      await supabase.auth.signOut({ scope: 'local' });
      if (path.startsWith('/api/')) {
        const negado = NextResponse.json({ erro: 'Sua conta foi acessada em outro aparelho. Entre de novo.' }, { status: 401 });
        response.cookies.getAll().forEach((c) => negado.cookies.set(c));
        negado.cookies.delete(COOKIE_APARELHO);
        negado.cookies.delete(COOKIE_CONFERIDO);
        return negado;
      }
      const url = request.nextUrl.clone();
      url.pathname = '/entrar';
      url.search = '?aviso=outro-aparelho';
      const redirect = NextResponse.redirect(url);
      response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
      redirect.cookies.delete(COOKIE_APARELHO);
      redirect.cookies.delete(COOKIE_CONFERIDO);
      return redirect;
    }
  }

  if (!user && AREAS_LOGADAS.some((p) => path === p || path.startsWith(p + '/'))) {
    destino = '/entrar';
  } else if (user && (path === '/' || path === '/entrar')) {
    // quem já está logado cai direto na própria área (ou volta para o convite que estava abrindo)
    const proximo = request.nextUrl.searchParams.get('proximo') ?? '';
    destino = path === '/entrar' && /^\/convite\/[0-9a-f-]{36}$/i.test(proximo) ? proximo : '/aluno';
  }

  if (destino) {
    const url = request.nextUrl.clone();
    url.pathname = destino;
    url.search = '';
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }

  return response;
}
