import type { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Limite de aparelhos conectados (conta pessoal). Cada navegador recebe um cookie com o número do aparelho;
// a cada minuto o site confere se esse aparelho ainda vale. Se a conta entrou em aparelhos demais,
// o usado há mais tempo deixa de valer e a pessoa é desconectada nele.

export const COOKIE_APARELHO = 'g15_ap';
export const COOKIE_CONFERIDO = 'g15_ap_ok';
const ROTAS = ['/aluno', '/boas-vindas', '/imprimir', '/api/pdf'];

export const rotaComLimite = (path: string) => ROTAS.some((p) => path === p || path.startsWith(p + '/'));

function descrever(ua: string): string {
  const nav = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung Internet'
    : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
  const so = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /CrOS/.test(ua) ? 'Chromebook' : /Linux/.test(ua) ? 'Linux' : 'outro sistema';
  return `${nav} no ${so}`;
}

function local(request: NextRequest) {
  let cidade = '';
  try { cidade = decodeURIComponent(request.headers.get('x-vercel-ip-city') ?? ''); } catch { /* cabeçalho inválido */ }
  const pais = request.headers.get('x-vercel-ip-country') ?? '';
  const uf = pais && pais !== 'BR' ? pais : request.headers.get('x-vercel-ip-country-region') ?? '';
  return { cidade, uf };
}

const OPCOES = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/' };

// devolve 'ok' ou 'desconectado' (este aparelho foi desconectado: a sessão deve ser encerrada)
export async function conferirAparelho(supabase: SupabaseClient, request: NextRequest, response: NextResponse, userId: string): Promise<'ok' | 'desconectado'> {
  const valor = request.cookies.get(COOKIE_APARELHO)?.value ?? '';
  const [dono, id] = valor.split('.');
  if (valor && request.cookies.get(COOKIE_CONFERIDO)?.value === valor && dono === userId) return 'ok';
  const { cidade, uf } = local(request);

  if (dono === userId && id) {
    const { data, error } = await supabase.rpc('conferir_aparelho', { p_id: id, p_cidade: cidade, p_uf: uf });
    if (error) return 'ok'; // antes da atualização 0013 (ou falha no banco): não bloqueia ninguém
    if (data === false) {
      response.cookies.delete(COOKIE_APARELHO);
      response.cookies.delete(COOKIE_CONFERIDO);
      return 'desconectado';
    }
    response.cookies.set(COOKIE_CONFERIDO, valor, { ...OPCOES, maxAge: 60 });
    return 'ok';
  }

  // aparelho novo para esta conta (ou outra pessoa entrou neste navegador)
  const { data, error } = await supabase.rpc('registrar_aparelho', {
    p_descricao: descrever(request.headers.get('user-agent') ?? ''), p_cidade: cidade, p_uf: uf,
  });
  if (error || !data) return 'ok';
  const novo = `${userId}.${data}`;
  response.cookies.set(COOKIE_APARELHO, novo, { ...OPCOES, maxAge: 60 * 60 * 24 * 400 });
  response.cookies.set(COOKIE_CONFERIDO, novo, { ...OPCOES, maxAge: 60 });
  return 'ok';
}
