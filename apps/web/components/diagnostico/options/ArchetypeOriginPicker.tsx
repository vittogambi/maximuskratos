'use client';

import { AppIcon } from '@/components/app-icon';
import { ArchetypePortrait } from '@/components/archetype/ArchetypePortrait';
import {
  ARCHETYPES,
  ARCHETYPE_SLUGS,
  type ArchetypeSlug,
} from '@/lib/archetypes';

export function archetypeSlugFromStored(value: string): ArchetypeSlug | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (ARCHETYPE_SLUGS.includes(trimmed as ArchetypeSlug)) return trimmed as ArchetypeSlug;
  const byLabel = ARCHETYPE_SLUGS.find((slug) => ARCHETYPES[slug].label === trimmed);
  return byLabel ?? null;
}

export function ArchetypeOriginPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (slug: ArchetypeSlug) => void;
}) {
  const selected = archetypeSlugFromStored(value);
  const display = selected ?? ARCHETYPE_SLUGS[0];
  const archetype = ARCHETYPES[display];

  return (
    <div className="dk-archetype-origin">
      <p className="dk-archetype-origin__intro">Elige el arquetipo que mejor te describa. Puedes revisar equilibrio y sombra antes de continuar.</p>

      <div className="dk-archetype-origin__tabs" role="tablist" aria-label="Arquetipos">
        {ARCHETYPE_SLUGS.map((slug) => {
          const meta = ARCHETYPES[slug];
          const isSelected = slug === selected;
          return (
            <button
              key={slug}
              type="button"
              role="tab"
              id={`dk-archetype-tab-${slug}`}
              aria-selected={isSelected}
              aria-controls="dk-archetype-origin-panel"
              className={`dk-archetype-origin__tab${isSelected ? ' dk-archetype-origin__tab--active' : ''}`}
              onClick={() => onChange(slug)}
            >
              <ArchetypePortrait slug={slug} size="sm" className="dk-archetype-origin__thumb" />
              <span className="dk-archetype-origin__tab-copy">
                <span className="dk-archetype-origin__tab-label">{meta.label}</span>
                <span className="dk-archetype-origin__tab-tagline">{meta.tagline}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="dk-archetype-origin-panel"
        role="tabpanel"
        aria-labelledby={`dk-archetype-tab-${display}`}
        className="dk-archetype-origin__panel"
      >
        <div className="dk-archetype-origin__lead">
          <ArchetypePortrait slug={display} size="md" className="dk-archetype-origin__hero" priority />
          <div className="dk-archetype-origin__lead-copy">
            <h3 className="dk-archetype-origin__name">{archetype.label}</h3>
            <p className="dk-archetype-origin__function">{archetype.tagline}</p>
            <p className="dk-archetype-origin__desc">{archetype.description}</p>
          </div>
        </div>

        <div className="dk-archetype-origin__modules">
          <article className="dk-archetype-origin__module dk-archetype-origin__module--balance">
            <span className="dk-archetype-origin__module-icon" aria-hidden>
              <AppIcon name="circle-check" size={14} />
            </span>
            <span className="dk-archetype-origin__kicker">En equilibrio</span>
            <p>{archetype.balanced}</p>
          </article>
          {archetype.shadowPoles.map((pole) => (
            <article key={pole.label} className="dk-archetype-origin__module dk-archetype-origin__module--shadow">
              <span className="dk-archetype-origin__module-icon" aria-hidden>
                <AppIcon name="shadow" size={14} />
              </span>
              <span className="dk-archetype-origin__kicker">Sombra · {pole.label}</span>
              <p>{pole.description}</p>
            </article>
          ))}
        </div>

        {!selected ? (
          <p className="dk-archetype-origin__hint">Toca un arquetipo para confirmar tu elección y continuar.</p>
        ) : (
          <p className="dk-archetype-origin__choice">
            <span className="dk-archetype-origin__choice-label">Tu elección</span>
            <span className="dk-archetype-origin__choice-value">{ARCHETYPES[selected].label}</span>
          </p>
        )}
      </div>
    </div>
  );
}
