import Link from 'next/link';
import { acessoAtual } from '@/lib/acesso';
import { AbasQuestoes } from '@/components/desempenho/AbasQuestoes';
import { Caminho, PAINEL_ALUNO } from '@/components/Caminho';
import { respostasDasListas } from '@/lib/questao';
import { apagarLista } from '../../actions';
import { MontarLista, type Grupo } from './MontarLista';
import { CartaoCapa, BarraProgresso } from '@/components/CartaoCapa';
import { iconePorTitulo } from '@/components/Capa';
import s from '../../aluno.module.css';

export const metadata = { title: 'Listas sob medida · A Trilha do ENEM' };

type Lista = { id: string; titulo: string; questoes: string[]; criada_em: string };

export default async function Listas({ searchParams }: { searchParams: Promise<{ ar?: string; m?: string; h?: string; a?: string }> }) {
  const pre = await searchParams;
  const { supabase, perfil, acesso } = await acessoAtual();
  const [{ data: listasRaw }, grupos, { data: nomesMods }] = await Promise.all([
    supabase.from('listas_questoes').select('id, titulo, questoes, criada_em').eq('aluno_id', perfil.id).order('criada_em', { ascending: false }).limit(30),
    gruposDoBanco(supabase, perfil.id),
    supabase.from('modulos').select('numero, titulo'),
  ]);
  const listas = (listasRaw ?? []) as Lista[];
  const respostasPorLista = await respostasDasListas(supabase, perfil.id, listas);
  const nomesModulos = Object.fromEntries(((nomesMods ?? []) as { numero: number; titulo: string }[]).map((m) => [m.numero, m.titulo]));

  return (
    <>
      <Caminho passos={[PAINEL_ALUNO, { rotulo: 'Banco de questões', href: '/aluno/questoes' }, { rotulo: 'Listas sob medida' }]} />
      <AbasQuestoes atual="listas" />
      <div className={s.cabeca}>
        <h1 className={`display ${s.titulo}`}>Listas sob medida</h1>
        <p className="suave" style={{ margin: 0, maxWidth: '64ch' }}>
          Escolha a área, o que quer treinar e quantas questões. A lista prioriza as questões que você ainda não fez e fica salva aqui para continuar depois.
        </p>
      </div>

      <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, borderColor: 'var(--ciano)' }} aria-labelledby="nova">
        <h2 id="nova" className="display" style={{ margin: 0, fontSize: 19 }}>Montar uma lista</h2>
        <MontarLista grupos={grupos} nomesModulos={nomesModulos} inicial={{ ar: pre.ar, m: pre.m, h: pre.h, a: pre.a }} maxQtd={acesso.listaMax} />
      </section>

      <section className={s.grupo} aria-labelledby="minhas">
        <h2 id="minhas" className="display">Minhas listas</h2>
        {listas.length === 0 && <p className="suave" style={{ margin: 0 }}>Você ainda não montou nenhuma lista.</p>}
        <div className="cc-grade">
          {listas.map((l) => {
            const respostas = respostasPorLista.get(l.id) ?? new Map<string, boolean>();
            const feitas = l.questoes.filter((q) => respostas.has(q)).length;
            const acertos = l.questoes.filter((q) => respostas.get(q) === true).length;
            const pronta = feitas === l.questoes.length;
            const href = `/aluno/questoes/lista/${l.id}`;
            return (
              <CartaoCapa key={l.id} href={href} tipo="lista" compacto rotulo="Lista sob medida" destaque={String(l.questoes.length)}
                icone={iconePorTitulo(l.titulo)} titulo={l.titulo}
                selo={pronta ? `${acertos}/${l.questoes.length} acertos` : feitas ? 'Em andamento' : 'Nova'}
                texto={`${pronta ? 'Concluída' : `${feitas} de ${l.questoes.length} feitas`} · criada em ${new Date(l.criada_em).toLocaleDateString('pt-BR')}`}
                rodape={<>
                  <Link href={href} className="btn btn-azul">{pronta ? 'Ver resultado' : feitas ? 'Continuar' : 'Começar'}</Link>
                  {acesso.completo && <a href={`/imprimir/lista/${l.id}`} target="_blank" rel="noopener" className="btn btn-linha">Imprimir</a>}
                  <form action={apagarLista}>
                    <input type="hidden" name="id" value={l.id} />
                    <button className="btn btn-linha" aria-label={`Apagar a lista ${l.titulo}`}>Apagar</button>
                  </form>
                </>}>
                <BarraProgresso pct={Math.round((100 * feitas) / l.questoes.length)} rotulo={`${feitas} de ${l.questoes.length} feitas`} />
              </CartaoCapa>
            );
          })}
        </div>
      </section>
    </>
  );
}

// Quantas questões existem em cada combinação de filtros (para o contador do "Montar uma lista")
async function gruposDoBanco(supabase: Awaited<ReturnType<typeof acessoAtual>>['supabase'], alunoId: string): Promise<Grupo[]> {
  const { data, error } = await supabase.rpc('contagem_banco');
  if (!error) return (data ?? []) as Grupo[];
  // antes da atualização 0010: conta a partir das próprias questões
  const [{ data: qs }, { data: resp }] = await Promise.all([
    supabase.from('questoes').select('id, modulo, assunto, habilidade, nivel, origem').limit(5000),
    supabase.from('respostas_questoes').select('questao_id').eq('aluno_id', alunoId),
  ]);
  const feitas = new Set(((resp ?? []) as { questao_id: string }[]).map((r) => r.questao_id));
  return ((qs ?? []) as (Omit<Grupo, 'feita' | 'n'> & { id: string })[]).map(({ id, ...g }) => ({ ...g, feita: feitas.has(id), n: 1 }));
}
