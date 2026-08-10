'use client';

import { useState } from 'react';
import { DeviceShowcase, type DeviceShowcaseFocus } from '@/components/device-showcase';
import { ScrollReveal } from '@/components/motion/scroll-reveal';
import { SectionIntro } from '@/components/pages/section-intro';
import { LANDING_INSIDE_MK_INTRO, LANDING_INSIDE_MK_STAGES } from '@/lib/landing-copy';

/** Recorrido dentro de la plataforma: etapas + DeviceShowcase sincronizado. */
export function LandingInsideMk() {
  const [focus, setFocus] = useState<DeviceShowcaseFocus>(LANDING_INSIDE_MK_STAGES[0].focus);
  const [activeId, setActiveId] = useState(LANDING_INSIDE_MK_STAGES[0].id);

  return (
    <section
      id="dentro-de-mk"
      className="ag-section-inner ag-landing-inside-mk"
      aria-labelledby="dentro-mk-heading"
    >
      <div className="ag-container">
        <SectionIntro
          eyebrow={LANDING_INSIDE_MK_INTRO.eyebrow}
          title={LANDING_INSIDE_MK_INTRO.title}
          headingId="dentro-mk-heading"
        />

        <div className="ag-inside-mk">
          <ScrollReveal className="ag-inside-mk__stages" density="default">
            <ol className="ag-inside-mk__list">
              {LANDING_INSIDE_MK_STAGES.map((stage, index) => {
                const isActive = activeId === stage.id;
                return (
                  <li key={stage.id}>
                    <button
                      type="button"
                      className={`ag-inside-mk__stage${isActive ? ' is-active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => {
                        setActiveId(stage.id);
                        setFocus(stage.focus);
                      }}
                      onFocus={() => {
                        setActiveId(stage.id);
                        setFocus(stage.focus);
                      }}
                    >
                      <span className="ag-inside-mk__num hud-text" aria-hidden>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="ag-inside-mk__stage-copy">
                        <span className="ag-inside-mk__stage-title font-headline-sm">{stage.title}</span>
                        <span className="ag-inside-mk__stage-body font-body-md">{stage.body}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </ScrollReveal>

          <ScrollReveal className="ag-inside-mk__showcase" density="default">
            <DeviceShowcase focus={focus} layout="experience" swapShots />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
