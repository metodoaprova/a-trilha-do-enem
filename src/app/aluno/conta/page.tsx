import Link from 'next/link';
import { exigirLogin } from '@/lib/sessao';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { Formulario } from '@/components/Formulario';
import { convidarResponsavel, desconectarAparelho, excluirConta, participarRanking } from '@/app/conta/actions';
import { cookies } from 'next/headers';
import { COOKIE_APARELHO } from '@/lib/supabase/aparelho';
import s from '../aluno.module.css';

export const metadata = { title: 'Minha conta · A Trilha do ENEM' };

type Convite = { email: string; token: string; aceito_em: string | null; criado_em: string };
type Vinculo = { autoriza_ranking: boolean; responsavel: { nome: string } | null };

export default async function MinhaConta() {
  const { supabase, user, perfil } = await exigirLogin();
  const [{ data: convitesRaw }, { data: vinculosRaw }, { data: matsRaw }, { data: aparelhosRaw }, { data: limiteRaw }] = await Promise.all([
    supabase.from('convites_responsavel').select('email, token, aceito_em, criado_em').eq('aluno_id', perfil.id).order('criado_em', { ascending: false }),
    supabase.from('vinculos_responsavel').select('autoriza_ranking, responsavel:perfis!vinculos_responsavel_responsavel_id_fkey(nome)').eq('aluno_id', perfil.id),
    supabase.from('matriculas').select('status, criado_em, produto:produtos(nome, acesso_ate)').eq('aluno_id', perfil.id).order('criado_em', { ascending: false }),
    supabase.from('aparelhos').select('id, descricao, cidade, uf, ultimo_uso').order('ultimo_uso', { ascending: false }),
    supabase.from('configuracoes').select('valor').eq('chave', 'limite_aparelhos').maybeSingle(),
  ]);
  const aparelhos = (aparelhosRaw ?? []) as { id: string; descricao: string | null; cidade: string | null; uf: string | null; ultimo_uso: string }[];
  const limiteAparelhos = Number(limiteRaw?.valor ?? 2) || 2;
  const [, esteAparelho] = ((await cookies()).get(COOKIE_APARELHO)?.value ?? '').split('.');
  const convites = (convitesRaw ?? []) as Convite[];
  const pendente = convites.find((c) => !c.aceito_em);
  const vinculos = (vinculosRaw ?? []) as unknown as Vinculo[];
  const matriculas = (matsRaw ?? []) as unknown as { status: string; criado_em: string; produto: { nome: string; acesso_ate: string | null } | null }[];
  const anoAtual = new Date().getFullYear();
  const menor = !!perfil.ano_nascimento && perfil.ano_nascimento > anoAtual - 18;
  const data = (d: string) => new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('pt-BR');

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Minha conta' }]} />
      <h1 className={`display ${s.titulo}`}>Minha conta</h1>

      <section className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 8 }} aria-labelledby="dados">
        <h2 id="dados" className="display" style={{ margin: 0, fontSize: 19 }}>Seus dados</h2>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>Guardamos só o necessário para o curso funcionar.</p>
        <dl style={{ margin: 0, display: 'grid', gridTemplateColumns: 'max-content minmax(0, 1fr)', gap: '6px 18px' }}>
          <dt className="suave">Nome</dt><dd style={{ margin: 0 }}>{perfil.nome || '–'}</dd>
          <dt className="suave">E-mail</dt><dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{user.email}</dd>
          <dt className="suave">Ano de nascimento</dt><dd style={{ margin: 0 }}>{perfil.ano_nascimento ?? '–'}</dd>
          <dt className="suave">Apelido no ranking</dt><dd style={{ margin: 0 }}>{perfil.apelido ?? 'nenhum'}</dd>
        </dl>
        {matriculas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
            <span className={s.rotuloPeq}>Seus acessos</span>
            {matriculas.map((m, i) => (
              <span key={i}>
                {m.produto?.nome ?? 'Curso'} · {m.status === 'ativa' ? (m.produto?.acesso_ate ? `ativo até ${data(m.produto.acesso_ate)}` : 'ativo') : m.status === 'reembolsada' ? 'reembolsado' : 'encerrado'}
              </span>
            ))}
          </div>
        )}
        <p className="suave" style={{ margin: '6px 0 0', fontSize: 14 }}>
          Para corrigir nome ou ano de nascimento, fale com a equipe do curso. Veja também a <Link href="/privacidade">Política de privacidade</Link>.
        </p>
      </section>

      <section className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="aparelhos">
        <h2 id="aparelhos" className="display" style={{ margin: 0, fontSize: 19 }}>Aparelhos conectados</h2>
        <p className="suave" style={{ margin: 0, fontSize: 14 }}>
          A conta é pessoal e fica conectada em até {limiteAparelhos} aparelhos ao mesmo tempo. Ao entrar em mais um, o usado há mais tempo é desconectado.
        </p>
        {aparelhos.length === 0 && <p className="suave" style={{ margin: 0 }}>Nenhum aparelho registrado.</p>}
        {aparelhos.map((a) => (
          <div key={a.id} className="linha-flex" style={{ justifyContent: 'space-between', gap: 10, borderTop: '1px solid var(--linha)', paddingTop: 10 }}>
            <div>
              <strong>{a.descricao || 'Aparelho'}</strong>{a.id === esteAparelho && <span className="suave"> · este aparelho</span>}
              <div className="suave" style={{ fontSize: 14 }}>
                {[a.cidade && `${a.cidade}${a.uf ? `/${a.uf}` : ''}`, `último uso em ${new Date(a.ultimo_uso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`].filter(Boolean).join(' · ')}
              </div>
            </div>
            {a.id !== esteAparelho && (
              <Formulario acao={desconectarAparelho} botao="Desconectar" classeBotao="btn btn-linha" pendenteTexto="Desconectando…">
                <input type="hidden" name="id" value={a.id} />
              </Formulario>
            )}
          </div>
        ))}
        <p className="suave" style={{ margin: 0, fontSize: 13 }}>Não reconhece algum aparelho? Desconecte e troque a sua senha.</p>
      </section>

      <section className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }} aria-labelledby="apel">
        <h2 id="apel" className="display" style={{ margin: 0, fontSize: 19 }}>Apelido no ranking</h2>
        <Formulario acao={participarRanking} botao="Salvar apelido">
          <input type="hidden" name="participar" value={perfil.participa_ranking ? 'sim' : 'nao'} />
          <div className="campo" style={{ maxWidth: 320 }}>
            <label htmlFor="apelido">Apelido</label>
            <input id="apelido" name="apelido" type="text" required minLength={3} maxLength={20} defaultValue={perfil.apelido ?? ''} placeholder="Ex.: mat_no_foco" />
            <span className="suave" style={{ fontSize: 13 }}>É o único nome que aparece para os colegas. Não use o seu nome completo.</span>
          </div>
        </Formulario>
      </section>

      <section className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }} aria-labelledby="resp">
        <h2 id="resp" className="display" style={{ margin: 0, fontSize: 19 }}>Responsável</h2>
        {vinculos.length > 0 ? (
          vinculos.map((v, i) => (
            <p key={i} style={{ margin: 0 }}>
              <strong>{v.responsavel?.nome || 'Seu responsável'}</strong> acompanha os seus estudos.{' '}
              {menor && (v.autoriza_ranking ? 'Participação no ranking autorizada.' : 'A participação no ranking ainda não foi autorizada.')}
            </p>
          ))
        ) : (
          <p className="suave" style={{ margin: 0 }}>
            {menor
              ? 'Como você é menor de idade, convide o seu responsável. Ele acompanha o seu progresso e decide sobre a participação no ranking.'
              : 'Se quiser, você pode convidar um responsável para acompanhar o seu progresso.'}
          </p>
        )}
        {pendente && (
          <p className="suave" style={{ margin: 0, fontSize: 14 }}>
            Convite aguardando aceite: {pendente.email} (criado em {data(pendente.criado_em)}).
          </p>
        )}
        <Formulario acao={convidarResponsavel} botao={pendente ? 'Enviar o convite de novo' : 'Convidar responsável'}>
          <div className="campo" style={{ maxWidth: 420 }}>
            <label htmlFor="emailresp">E-mail do responsável</label>
            <input id="emailresp" name="email" type="email" required defaultValue={pendente?.email ?? ''} placeholder="responsavel@exemplo.com" />
          </div>
        </Formulario>
        <span className="suave" style={{ fontSize: 13 }}>Você recebe um link para enviar ao responsável. Ele cria a conta de responsável com esse mesmo e-mail e aceita.</span>
      </section>

      <section className="cartao" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12, borderColor: 'var(--erro-fundo)' }} aria-labelledby="excluir">
        <h2 id="excluir" className="display" style={{ margin: 0, fontSize: 19 }}>Excluir minha conta</h2>
        <p style={{ margin: 0, color: 'var(--texto-2)', maxWidth: '70ch' }}>
          Apaga o seu cadastro, o seu progresso, as suas dúvidas e o vínculo com o responsável. Não dá para desfazer.
          O acesso ao curso termina na hora. Se você comprou há menos de 7 dias e quer o reembolso, peça na Kiwify antes de excluir.
        </p>
        <details>
          <summary className="btn btn-linha" style={{ listStyle: 'none', borderColor: 'var(--erro)', color: 'var(--erro)' }}>Quero excluir minha conta</summary>
          <div style={{ paddingTop: 12, maxWidth: 420 }}>
            <Formulario acao={excluirConta} botao="Excluir definitivamente" classeBotao="btn btn-perigo" pendenteTexto="Excluindo…">
              <div className="campo">
                <label htmlFor="conf">Digite EXCLUIR para confirmar</label>
                <input id="conf" name="confirmacao" type="text" required autoComplete="off" />
              </div>
              <div className="campo">
                <label htmlFor="senhaexc">Sua senha</label>
                <input id="senhaexc" name="senha" type="password" required autoComplete="current-password" />
              </div>
            </Formulario>
          </div>
        </details>
      </section>
    </>
  );
}
