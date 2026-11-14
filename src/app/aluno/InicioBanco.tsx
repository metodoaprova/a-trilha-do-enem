import Link from 'next/link';
import { SITE_CURSO } from '@/lib/marca';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Perfil } from '@/lib/sessao';
import type { Acesso } from '@/lib/acesso';
import { CartaoCapa } from '@/components/CartaoCapa';
import { PainelDesempenho } from '@/components/desempenho/PainelDesempenho';
import { lerDesempenho, lerPeriodo } from '@/lib/desempenho';
import d from '@/components/desempenho/desempenho.module.css';
import s from './aluno.module.css';

type Grupo = { area: string | null; n: number; feita: boolean };

const AREAS_CARTAO = [
  { area: 'linguagens', titulo: 'Linguagens', texto: 'Português, literatura, inglês, espanhol, artes e educação física.', competencia: 5, icone: 'livro' },
  { area: 'humanas', titulo: 'Ciências Humanas', texto: 'História, geografia, filosofia e sociologia.', competencia: 6, icone: 'globo' },
  { area: 'natureza', titulo: 'Ciências da Natureza', texto: 'Física, química e biologia.', competencia: 3, icone: 'atomo' },
  { area: 'matematica', titulo: 'Matemática', texto: 'Todas as questões de Matemática do ENEM, com resolução comentada.', competencia: 1, icone: 'numeros' },
];

// Início de quem usa só o banco de questões (plano grátis ou banco completo)
export async function InicioBanco({ supabase, perfil, acesso, periodo: periodoUrl }: { supabase: SupabaseClient; perfil: Perfil; acesso: Acesso; periodo?: string }) {
  const periodo = lerPeriodo(periodoUrl);
  const [{ data }, { d: desemp, falta }] = await Promise.all([supabase.rpc('contagem_banco'), lerDesempenho(supabase, periodo)]);
  const grupos = ((data ?? []) as Grupo[]);
  const porArea = new Map<string, { total: number; feitas: number }>();
  grupos.forEach((g) => {
    const k = g.area ?? 'matematica';
    const v = porArea.get(k) ?? { total: 0, feitas: 0 };
    v.total += g.n; if (g.feita) v.feitas += g.n;
    porArea.set(k, v);
  });
  const restantes = Math.max(0, acesso.limiteDia - acesso.usadasHoje);
  const pct = acesso.limiteDia ? Math.round((100 * Math.min(acesso.usadasHoje, acesso.limiteDia)) / acesso.limiteDia) : 0;

  return (
    <>
      <section className={`cartao-gradiente ${d.ola}`} aria-labelledby="ola">
        <span className={d.selo}>{acesso.completo ? 'Banco completo' : 'Plano grátis'}</span>
        <h1 id="ola" className="display">Olá, {(perfil.nome || 'estudante').split(' ')[0]}!</h1>
        <p>Acompanhe o seu progresso e alcance as suas metas de estudo.</p>
      </section>
      {!acesso.completo && (
        <section className="cartao" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }} aria-labelledby="hoje">
          <div className="linha-flex" style={{ justifyContent: 'space-between' }}>
            <h2 id="hoje" className="display" style={{ margin: 0, fontSize: 19 }}>Suas questões grátis de hoje</h2>
            <b className="display" style={{ fontSize: 22, color: 'var(--azul)' }}>{acesso.usadasHoje} de {acesso.limiteDia}</b>
          </div>
          <span className="cc-progresso" role="img" aria-label={`${acesso.usadasHoje} de ${acesso.limiteDia} questões usadas hoje`}>
            <span style={{ width: `${pct}%` }} />
          </span>
          <p className="suave" style={{ margin: 0, fontSize: 14 }}>
            {restantes > 0
              ? `Você ainda pode responder ${restantes} ${restantes === 1 ? 'questão' : 'questões'} hoje, com gabarito e resolução comentada. Amanhã o contador recomeça.`
              : 'Você usou todas as questões grátis de hoje. Amanhã o contador recomeça, ou desbloqueie o banco completo para continuar agora.'}
          </p>
          <div className="linha-flex" style={{ gap: 8 }}>
            <Link href="/aluno/planos" className="btn btn-azul">Conhecer o banco completo</Link>
          </div>
        </section>
      )}

      <PainelDesempenho d={desemp} periodo={periodo} base="/aluno" falta={falta} zerar={false} />

      <section className={s.grupo} aria-labelledby="areas">
        <h2 id="areas" className="display">Escolha a área</h2>
        <div className="cc-grade">
          {AREAS_CARTAO.map((a) => {
            const v = porArea.get(a.area) ?? { total: 0, feitas: 0 };
            return (
              <CartaoCapa key={a.area} href={v.total ? `/aluno/questoes?ar=${a.area}` : undefined} tipo="habilidade" competencia={a.competencia}
                icone={a.icone} rotulo="Questões do ENEM" destaque={v.total ? String(v.total) : undefined} titulo={a.titulo} texto={a.texto}
                selo={v.total ? undefined : 'Em breve'}
                rodape={v.total
                  ? <><Link href={`/aluno/questoes?ar=${a.area}`} className="btn btn-azul">Resolver</Link><span className="cc-info">{v.feitas} de {v.total} feitas</span></>
                  : <span className="cc-info">As questões desta área estão sendo preparadas.</span>} />
            );
          })}
        </div>
      </section>

      <section className={s.grupo} aria-labelledby="mais">
        <h2 id="mais" className="display">Treine do seu jeito</h2>
        <div className="cc-grade">
          <CartaoCapa href="/aluno/questoes/listas" tipo="lista" rotulo="Lista sob medida" titulo="Monte uma lista"
            texto={`Escolha área, assunto e dificuldade${acesso.completo ? '' : `. No plano grátis, listas de até ${acesso.listaMax} questões`}.`}
            rodape={<Link href="/aluno/questoes/listas" className="btn btn-azul">Montar lista</Link>} />
          <CartaoCapa href={SITE_CURSO} tipo="trilha" icone="relogio" rotulo="Curso de Matemática" titulo="Gabarito em 15"
            texto="Matemática do ENEM em 15 minutos por dia, com aulas, simulados e o banco completo incluído. Mesma conta."
            rodape={<a href={SITE_CURSO} className="btn btn-linha" target="_blank" rel="noopener">Conhecer o curso</a>} />
        </div>
      </section>
    </>
  );
}
