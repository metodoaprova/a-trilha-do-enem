import { PaginaTexto } from '@/components/PaginaTexto';
import { SITE_CURSO } from '@/lib/marca';
import { TERMOS_HTML } from '@/lib/textosLegais';

export const metadata = { title: 'Termos de uso · A Trilha do ENEM' };

// o texto vem do Gabarito em 15 (conteudo-legal/ daquele repositório)
export default function Termos() {
  return (
    <PaginaTexto titulo="Termos de uso">
      <p className="cartao" style={{ margin: 0, padding: '14px 18px', fontSize: 15 }}>
        A Trilha do ENEM é o banco de questões do <a href={SITE_CURSO}>Gabarito em 15</a>: usa a mesma conta, o mesmo cadastro e a mesma empresa responsável. Por isso, valem para ela os mesmos {'Termos de uso'}, abaixo.
      </p>
      <div className="texto-legal" dangerouslySetInnerHTML={{ __html: TERMOS_HTML }} />
    </PaginaTexto>
  );
}
