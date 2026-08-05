import { SectionIntro } from '@/components/pages/section-intro';
import {
  LANDING_PRODUCT_STATUS_AVAILABLE,
  LANDING_PRODUCT_STATUS_INTRO,
  LANDING_PRODUCT_STATUS_UPCOMING,
} from '@/lib/landing-copy';

const GROUPS: ReadonlyArray<{
  id: string;
  label: string;
  mark: string;
  tone: 'live' | 'next';
  items: ReadonlyArray<string>;
}> = [
  {
    id: 'disponible',
    label: 'DISPONIBLE HOY',
    mark: 'Disponible',
    tone: 'live',
    items: LANDING_PRODUCT_STATUS_AVAILABLE,
  },
  {
    id: 'desarrollo',
    label: 'EN DESARROLLO',
    mark: 'En desarrollo',
    tone: 'next',
    items: LANDING_PRODUCT_STATUS_UPCOMING,
  },
];

/** Bloque 6: qué está disponible hoy y qué llega con el lanzamiento, sin letra chica. */
export function LandingProductStatus() {
  return (
    <section className="ag-section-inner ag-sistema-status" aria-labelledby="estado-heading">
      <div className="ag-container ag-container--narrow">
        <SectionIntro
          eyebrow={LANDING_PRODUCT_STATUS_INTRO.eyebrow}
          title={LANDING_PRODUCT_STATUS_INTRO.title}
          lead={LANDING_PRODUCT_STATUS_INTRO.lead}
          headingId="estado-heading"
        />

        <div className="ag-sistema-status__stream">
          {GROUPS.map((group) => (
            <div key={group.id} className="ag-sistema-status__group">
              <p
                className={`hud-text ag-sistema-status__group-label${
                  group.tone === 'live' ? ' text-action-red' : ''
                }`}
              >
                {group.label}
              </p>
              <ul className="ag-sistema-status__list">
                {group.items.map((item) => (
                  <li key={item} className="ag-sistema-status__row">
                    <span className="ag-sistema-status__name font-headline-sm">{item}</span>
                    <span
                      className={`ag-sistema-status__mark font-label-lg${
                        group.tone === 'live' ? ' is-live' : ' is-next'
                      }`}
                    >
                      {group.mark}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
