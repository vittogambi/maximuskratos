'use client';

import type { AnswerOptionDto } from '@/lib/api';
import { ArchetypePortrait } from '@/components/archetype/ArchetypePortrait';
import { ARCHETYPE_SLUGS, ARCHETYPES, type ArchetypeMeta } from '@/lib/archetypes';

const BY_LABEL = new Map<string, ArchetypeMeta>(
  ARCHETYPE_SLUGS.map((slug) => [ARCHETYPES[slug].label, ARCHETYPES[slug]]),
);

export function isArchetypeChoice(options: AnswerOptionDto[]): boolean {
  return options.length > 0 && options.every((option) => BY_LABEL.has(option.textEs));
}

export function ArchetypeChoices({
  options,
  selected,
  onSelect,
}: {
  options: AnswerOptionDto[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="dk-archetype-list" role="listbox" aria-label="Arquetipos">
      {options.map((option) => {
        const meta = BY_LABEL.get(option.textEs);
        if (!meta) return null;
        const isSelected = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={`dk-choice-option dk-archetype-card${isSelected ? ' dk-choice-option--selected' : ''}`}
            onClick={() => onSelect(option.id)}
          >
            <ArchetypePortrait slug={meta.slug} size="sm" />
            <span className="dk-archetype-card__body">
              <span className="dk-archetype-card__name">{meta.label}</span>
              <span className="dk-archetype-card__tagline">{meta.tagline}</span>
              <span className="dk-archetype-card__strength">{meta.balanced}</span>
              <span className="dk-archetype-card__shadow">
                Sombra: {meta.shadowPoles[0].label}, {meta.shadowPoles[1].label}. {meta.shadow.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
