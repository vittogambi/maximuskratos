import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { SectionIntro } from '@/components/pages/section-intro';
import { LANDING_DIFFERENTIATION, LANDING_DIFFERENTIATION_TABLE } from '@/lib/landing-copy';

/** Bloque 3: dónde encaja MK frente a un curso, una mentoría o un tracker de hábitos. */
export function LandingDifferentiation() {
  return (
    <section className="ag-section-inner ag-landing-diff" aria-labelledby="diferenciacion-heading">
      <div className="ag-container ag-container--narrow">
        <SectionIntro
          eyebrow={LANDING_DIFFERENTIATION.eyebrow}
          title={LANDING_DIFFERENTIATION.title}
          lead={LANDING_DIFFERENTIATION.body}
          headingId="diferenciacion-heading"
        />

        <ScrollReveal className="ag-diff-table-wrap" density="default">
          <table className="ag-diff-table">
            <thead>
              <tr>
                <th scope="col">Modelo</th>
                <th scope="col">Qué entrega</th>
              </tr>
            </thead>
            <tbody>
              {LANDING_DIFFERENTIATION_TABLE.map((row) => (
                <tr key={row.model} className={row.isMk ? 'is-mk' : undefined}>
                  <th scope="row">{row.model}</th>
                  <td>{row.delivers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollReveal>
      </div>
    </section>
  );
}
