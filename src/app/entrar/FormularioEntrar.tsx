'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './entrar.module.css';

type ModoEntrar = 'entrar' | 'esqueci' | 'reenviar';

function traduzirErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail pelo link que enviamos antes de entrar. Não recebeu? Use "Reenviar o e-mail de confirmação" abaixo.';
  if (m.includes('already registered')) return 'Já existe uma conta com este e-mail. Entre ao lado ou crie uma nova senha.';
  if (m.includes('password should be')) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if (m.includes('invalid')) return 'Confira o e-mail digitado.';
  return `Não foi possível concluir agora. Detalhe técnico: ${msg}`;
}

// ---------- ícones dos campos ----------
const Ic = ({ d }: { d: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const ICONES = {
  email: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 1 9 7 9-7',
  senha: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm2 0V8a4 4 0 0 1 8 0v3',
  nome: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  ano: 'M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 5h16M8 3v4m8-4v4',
  resp: 'M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6l-7-3Z',
};

type PropsCampo = { id: string; rotulo: string; icone: keyof typeof ICONES; [atributo: string]: unknown };
function Campo({ id, rotulo, icone, ...props }: PropsCampo) {
  return (
    <div className={styles.campoIcone}>
      <label htmlFor={id} className={styles.oculto}>{rotulo}</label>
      <span className={styles.icone}><Ic d={ICONES[icone]} /></span>
      <input id={id} placeholder={rotulo} {...props} />
    </div>
  );
}

function Cartao({ titulo, subtitulo, children, className = '' }: { titulo: string; subtitulo: string; children: ReactNode; className?: string }) {
  return (
    <section className={`${styles.cartao} ${className}`} aria-labelledby={`t-${titulo}`}>
      <h1 id={`t-${titulo}`} className={styles.titulo}>{titulo}</h1>
      <p className={styles.subtitulo}>{subtitulo}</p>
      <hr className={styles.divisor} />
      {children}
    </section>
  );
}

function Mensagens({ erro, ok }: { erro: string; ok: string }) {
  return (
    <>
      {erro && <p role="alert" className="erro" style={{ margin: 0 }}>{erro}</p>}
      {ok && <p role="status" className="ok" style={{ margin: 0 }}>{ok}</p>}
    </>
  );
}

export function FormularioEntrar({ criarPrimeiro, esqueciInicial = false, aviso, proximo, responsavelInicial = false }: {
  criarPrimeiro: boolean; esqueciInicial?: boolean; aviso?: string; proximo?: string; responsavelInicial?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const voltarPara = (caminho: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(caminho)}`;

  // ---------- cartão "Entre" ----------
  const [modo, setModo] = useState<ModoEntrar>(esqueciInicial ? 'esqueci' : 'entrar');
  const [enviandoE, setEnviandoE] = useState(false);
  const [erroE, setErroE] = useState(
    aviso === 'link-invalido' ? 'Esse link expirou ou foi aberto em outro aparelho. Entre com e-mail e senha, ou peça um novo link.'
      : aviso === 'outro-aparelho' ? 'Sua conta foi acessada em outro aparelho e foi desconectada aqui. A conta é pessoal e fica conectada em poucos aparelhos ao mesmo tempo (veja em Minha conta). Se não foi você, troque a senha.'
      : '',
  );
  const [okE, setOkE] = useState(aviso === 'senha-alterada' ? 'Senha alterada. Entre com a nova senha.' : '');
  const trocar = (m: ModoEntrar) => { setModo(m); setErroE(''); setOkE(''); };

  async function entrar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviandoE(true); setErroE(''); setOkE('');
    const { error } = await supabase.auth.signInWithPassword({ email: String(f.get('email')).trim(), password: String(f.get('senha')) });
    setEnviandoE(false);
    if (error) return setErroE(traduzirErro(error.message));
    router.push(proximo ?? '/aluno');
    router.refresh();
  }

  async function esqueci(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviandoE(true); setErroE(''); setOkE('');
    const { error } = await supabase.auth.resetPasswordForEmail(String(f.get('email')).trim(), { redirectTo: voltarPara('/nova-senha') });
    setEnviandoE(false);
    if (error) return setErroE(traduzirErro(error.message));
    setOkE('Se houver uma conta com este e-mail, você vai receber um link para criar uma nova senha. Olhe também o spam.');
  }

  async function reenviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnviandoE(true); setErroE(''); setOkE('');
    const { error } = await supabase.auth.resend({
      type: 'signup', email: String(f.get('email')).trim(), options: { emailRedirectTo: voltarPara(proximo ?? '/aluno') },
    });
    setEnviandoE(false);
    if (error) return setErroE(traduzirErro(error.message));
    setOkE('Se a conta ainda não foi confirmada, enviamos um novo link. Olhe também o spam e a aba Promoções.');
  }

  // ---------- cartão "Cadastre-se" ----------
  const [enviandoC, setEnviandoC] = useState(false);
  const [erroC, setErroC] = useState('');
  const [okC, setOkC] = useState('');
  const [menor, setMenor] = useState(false);
  const [responsavel, setResponsavel] = useState(responsavelInicial);

  async function criar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email')).trim();
    if (email.toLowerCase() !== String(f.get('email2') ?? '').trim().toLowerCase()) {
      return setErroC('Os dois e-mails não são iguais. Confira e digite de novo.');
    }
    const ano = String(f.get('ano') ?? '').trim();
    const anoAtual = new Date().getFullYear();
    if (!responsavel && (!/^\d{4}$/.test(ano) || +ano < anoAtual - 90 || +ano > anoAtual)) {
      return setErroC('Informe o ano de nascimento com 4 dígitos, por exemplo 2009.');
    }
    // o curso não é destinado a menores de 12 anos (Termos de uso, item 4)
    if (!responsavel && anoAtual - +ano < 12) return setErroC('A Trilha do ENEM é para estudantes a partir de 12 anos.');
    // pelo ano de nascimento já dá para saber que é menor de idade: o responsável é obrigatório
    if (!responsavel && anoAtual - +ano <= 17 && !menor) {
      setMenor(true);
      return setErroC('Pelo seu ano de nascimento, você é menor de idade. Informe o e-mail do seu responsável.');
    }
    if (menor && !String(f.get('resp') ?? '').includes('@')) return setErroC('Informe o e-mail do seu responsável.');
    setEnviandoC(true); setErroC(''); setOkC('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password: String(f.get('senha')),
      options: {
        emailRedirectTo: voltarPara(proximo ?? '/aluno'),
        data: {
          nome: String(f.get('nome')).trim(),
          ano_nascimento: responsavel ? '' : ano,
          papel: responsavel ? 'responsavel' : 'aluno',
          email_responsavel: menor ? String(f.get('resp')).trim() : '',
        },
      },
    });
    setEnviandoC(false);
    if (error) return setErroC(traduzirErro(error.message));
    if (data.session) {
      router.push(proximo ?? '/aluno');
      router.refresh();
    } else {
      setOkC(`Conta criada! Enviamos um link de confirmação para ${email}. Abra o e-mail e clique no botão para entrar (olhe também o spam).`);
    }
  }

  const cartaoEntrar = (
    <Cartao
      titulo={modo === 'entrar' ? 'Entre' : modo === 'esqueci' ? 'Nova senha' : 'Reenviar confirmação'}
      subtitulo={modo === 'entrar' ? 'Já tem conta? Use seu e-mail e senha.' : modo === 'esqueci'
        ? 'Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.'
        : 'Informe o e-mail que você cadastrou. Vamos enviar de novo o link de confirmação.'}
    >
      {modo === 'entrar' && (
        <form onSubmit={entrar} className={styles.pilha}>
          <Campo id="e-email" name="email" rotulo="E-mail" icone="email" type="email" autoComplete="email" required />
          <Campo id="e-senha" name="senha" rotulo="Senha" icone="senha" type="password" autoComplete="current-password" required />
          <button type="submit" className={`btn btn-azul ${styles.botao}`} disabled={enviandoE}>{enviandoE ? 'Entrando…' : 'Entrar'}</button>
          <Mensagens erro={erroE} ok={okE} />
        </form>
      )}
      {modo === 'esqueci' && (
        <form onSubmit={esqueci} className={styles.pilha}>
          <Campo id="s-email" name="email" rotulo="E-mail" icone="email" type="email" autoComplete="email" required />
          <button type="submit" className={`btn btn-azul ${styles.botao}`} disabled={enviandoE}>{enviandoE ? 'Enviando…' : 'Enviar link'}</button>
          <Mensagens erro={erroE} ok={okE} />
          <button type="button" className={styles.link} onClick={() => trocar('entrar')}>← Voltar para entrar</button>
        </form>
      )}
      {modo === 'reenviar' && (
        <form onSubmit={reenviar} className={styles.pilha}>
          <Campo id="r-email" name="email" rotulo="E-mail" icone="email" type="email" autoComplete="email" required />
          <button type="submit" className={`btn btn-azul ${styles.botao}`} disabled={enviandoE}>{enviandoE ? 'Enviando…' : 'Reenviar o e-mail'}</button>
          <Mensagens erro={erroE} ok={okE} />
          <button type="button" className={styles.link} onClick={() => trocar('entrar')}>← Voltar para entrar</button>
        </form>
      )}
      {modo === 'entrar' && (
        <>
          <hr className={styles.divisor} />
          <div className={styles.ajuda}>
            <strong>Esqueceu sua senha?</strong>
            <span>Sem problemas, <button type="button" className={styles.link} onClick={() => trocar('esqueci')}>clique aqui</button> para criar uma nova.</span>
            <span>Não recebeu o e-mail de confirmação? <button type="button" className={styles.link} onClick={() => trocar('reenviar')}>Clique aqui</button>.</span>
            <span className={styles.nota}>Já tem conta no Gabarito em 15? É a mesma: entre com o mesmo e-mail e senha.</span>
          </div>
        </>
      )}
    </Cartao>
  );

  const cartaoCriar = (
    <Cartao titulo="Cadastre-se" subtitulo="Crie sua conta grátis e comece a trilha hoje." className={criarPrimeiro ? styles.antes : ''}>
      <form onSubmit={criar} className={styles.pilha}>
        {proximo && <p className={styles.nota} style={{ margin: 0 }}>Use o mesmo e-mail que recebeu o convite.</p>}
        <Campo id="c-nome" name="nome" rotulo={responsavel ? 'Seu nome' : 'Nome (como quer ser chamado)'} icone="nome" type="text" autoComplete="given-name" required />
        <Campo id="c-email" name="email" rotulo="E-mail" icone="email" type="email" autoComplete="email" required />
        <Campo id="c-email2" name="email2" rotulo="Confirmação do e-mail" icone="email" type="email" autoComplete="off" required
          onPaste={(e: { preventDefault: () => void }) => e.preventDefault()} />
        {!responsavel && (
          <Campo id="c-ano" name="ano" rotulo="Ano de nascimento (ex.: 2009)" icone="ano" type="text" inputMode="numeric" maxLength={4} required />
        )}
        <Campo id="c-senha" name="senha" rotulo="Senha (pelo menos 8 caracteres)" icone="senha" type="password" autoComplete="new-password" minLength={8} required />
        {!responsavel && (
          <label className={styles.check}>
            <input type="checkbox" checked={menor} onChange={(e) => setMenor(e.target.checked)} />
            <span>Tenho menos de 18 anos</span>
          </label>
        )}
        {menor && (
          <div className={styles.caixa}>
            <Campo id="c-resp" name="resp" rotulo="E-mail do responsável" icone="resp" type="email" required />
            <span className={styles.nota}>O responsável recebe um convite para acompanhar o seu progresso e autorizar a participação no ranking.</span>
          </div>
        )}
        <label className={styles.check}>
          <input type="checkbox" name="aceite" required />
          <span>Li e aceito os <a href="/termos" target="_blank">Termos de uso</a> e a <a href="/privacidade" target="_blank">Política de privacidade</a></span>
        </label>
        <button type="submit" className={`btn btn-azul ${styles.botao}`} disabled={enviandoC}>{enviandoC ? 'Criando…' : 'Criar minha conta'}</button>
        <Mensagens erro={erroC} ok={okC} />
      </form>
    </Cartao>
  );

  return (
    <>
      {cartaoEntrar}
      {cartaoCriar}
    </>
  );
}
