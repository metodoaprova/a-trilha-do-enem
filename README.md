# A Trilha do ENEM · banco de questões

Site só de questões do ENEM, com a identidade visual do Gabarito em 15.

- **Mesmo banco de dados do Gabarito em 15** (Supabase): as questões são importadas, revisadas e publicadas no painel do professor de www.gabaritoem15.com.br.
- **Mesmas contas:** o aluno entra com o mesmo e-mail e senha nos dois sites. Plano grátis (limite por dia) e banco completo valem nos dois.
- **Pagamento:** o produto "Banco de questões completo" da Kiwify já libera o acesso (o webhook fica no site do Gabarito em 15).
- **Sem segredos:** este site usa só as chaves públicas do Supabase. Professor e responsável são levados ao site do Gabarito em 15.

## Páginas
- `/` vitrine · `/entrar` entrar e cadastro · `/termos`, `/privacidade`
- `/aluno` início do banco · `/aluno/questoes` filtros e questões · `/aluno/questoes/listas` listas sob medida · `/imprimir/lista/[id]` lista em duas colunas · `/aluno/planos` · `/aluno/conta`

## Variáveis de ambiente (Vercel)
| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | a mesma do Gabarito em 15 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a mesma do Gabarito em 15 |
| `NEXT_PUBLIC_SITE_URL` | o endereço deste site (ex.: https://www.atrilhadoenem.com.br) |
| `NEXT_PUBLIC_WHATSAPP_URL` | https://wa.me/5584991037180 |
| `RESEND_API_KEY`, `EMAIL_REMETENTE` | opcionais (convite do responsável por e-mail); secretas |

No Supabase (Authentication → URL Configuration → Redirect URLs), inclua `https://SEU-DOMINIO/**` e o endereço `.vercel.app` deste projeto.
