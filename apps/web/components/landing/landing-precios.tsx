import { PreciosOffer } from '@/components/precios/precios-offer';
import { SectionIntro } from '@/components/pages/section-intro';
import { LANDING_PRECIOS_INTRO } from '@/lib/landing-copy';

/** Bloque home: planes de acceso anticipado (ancla #precios). */
export function LandingPrecios() {
  return (
    <section
      id="precios"
      className="ag-section-inner ag-landing-precios"
      aria-labelledby="landing-precios-heading"
    >
      <div className="ag-container ag-container--narrow">
        <SectionIntro
          eyebrow={LANDING_PRECIOS_INTRO.eyebrow}
          title={LANDING_PRECIOS_INTRO.title}
          lead={LANDING_PRECIOS_INTRO.lead}
          headingId="landing-precios-heading"
        />
        <PreciosOffer compact />
      </div>
    </section>
  );
}
