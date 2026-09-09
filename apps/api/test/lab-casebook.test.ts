import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AB_PAIRS,
  CASEBOOK_FAMILIES,
  CASEBOOK_META,
  criterionIdForFamilyCase,
  familiesForKey,
  participantSummaryLeaks,
  questionForFamilyCase,
} from '../src/lab/lab-casebook';

const CASEBOOK_DIR = resolve(__dirname, '../../../packages/matrix-engine/test/cases/rafa-casebook');

describe('PHASE 1 casebook blindness', () => {
  it('every participant summary is free of methodological leaks', () => {
    for (const meta of CASEBOOK_META) {
      const leaks = participantSummaryLeaks(meta.story);
      expect(leaks, meta.key).toEqual([]);
    }
  });

  it('hides facilitator intent from the pre-reveal story', () => {
    for (const meta of CASEBOOK_META) {
      expect(meta.story.toLowerCase()).not.toContain('qué tensiona');
      expect(meta.story.toLowerCase()).not.toContain('comportamiento esperado');
      expect(meta.story.toLowerCase()).not.toContain('contrafactual');
      expect(meta.facilitator_note.length).toBeGreaterThan(20);
    }
  });

  it('gives every fixture a short testIntent', () => {
    for (const meta of CASEBOOK_META) {
      expect(meta.testIntent.trim().length, meta.key).toBeGreaterThan(8);
      expect(meta.testIntent.toLowerCase(), meta.key).not.toContain('rafa');
    }
  });

  it('keeps A/B stories different and leak-free', () => {
    for (const [a, b] of AB_PAIRS) {
      const left = CASEBOOK_META.find((item) => item.key === a);
      const right = CASEBOOK_META.find((item) => item.key === b);
      expect(left?.story, a).not.toBe(right?.story);
      expect(left?.testIntent, a).toBe(right?.testIntent);
      expect(participantSummaryLeaks(left?.story ?? ''), a).toEqual([]);
      expect(participantSummaryLeaks(right?.story ?? ''), b).toEqual([]);
    }
  });

  it('does not mention weekly order filler', () => {
    for (const meta of CASEBOOK_META) {
      expect(meta.story.toLowerCase(), meta.key).not.toContain('orden en la semana');
    }
  });

  it('does not use the same health checklist in every story', () => {
    for (const meta of CASEBOOK_META) {
      expect(meta.story.toLowerCase(), meta.key).not.toContain('no reporta');
      expect(meta.story.toLowerCase(), meta.key).not.toContain('no escribió nada en propósito');
      expect(meta.story.toLowerCase(), meta.key).not.toContain('no hay alarmas');
      expect(meta.story.toLowerCase(), meta.key).not.toContain('en salud');
    }
  });

  it('does not mention propósito in the person story', () => {
    for (const meta of CASEBOOK_META) {
      expect(meta.story.toLowerCase(), meta.key).not.toContain('propósito');
    }
  });

  it('does not start more than two consecutive stories with name plus contestó', () => {
    const stale = CASEBOOK_META.map((meta) =>
      new RegExp(`^${meta.name}\\s+(contestó|respondió|completó)`, 'i').test(meta.story),
    );
    for (let index = 0; index < stale.length - 2; index += 1) {
      expect(stale[index] && stale[index + 1] && stale[index + 2], CASEBOOK_META[index].key).toBe(false);
    }
  });

  it('snapshots the stories and test intents', () => {
    const stories = Object.fromEntries(
      CASEBOOK_META.map((item) => [item.key, { story: item.story, testIntent: item.testIntent }]),
    );
    expect(stories).toMatchSnapshot();
  });

  it('matches purpose_answered to P-PRO keys in fixtures', () => {
    for (const meta of CASEBOOK_META) {
      const json = JSON.parse(readFileSync(resolve(CASEBOOK_DIR, meta.file), 'utf8')) as {
        responses: Record<string, unknown>;
      };
      const count = Object.keys(json.responses).filter((key) => key.startsWith('P-PRO-')).length;
      expect(meta.purpose_answered, meta.key).toBe(count > 0);
    }
  });

  it('documents D-CUE-07 exclusion in R03 facilitator note', () => {
    const r03 = CASEBOOK_META.find((item) => item.key === 'R03');
    expect(r03?.facilitator_note).toContain('D-CUE-07');
    expect(r03?.facilitator_note).toContain('no lo convierte a puntaje');
  });

  it('lets a case belong to more than one methodological test', () => {
    const duplicated = CASEBOOK_FAMILIES.flatMap((item) => item.keys).filter(
      (key, index, all) => all.indexOf(key) !== index,
    );
    expect(duplicated.length).toBeGreaterThan(0);
    const key = [...new Set(duplicated)][0]!;
    expect(familiesForKey(key).length).toBeGreaterThan(1);
  });

  it('maps every family to existing casebook keys', () => {
    expect(CASEBOOK_FAMILIES.filter((item) => item.review_surface === 'matrix')).toHaveLength(12);
    expect(CASEBOOK_FAMILIES.filter((item) => item.review_surface === 'frontier')).toHaveLength(1);
    const keys = new Set(CASEBOOK_META.map((item) => item.key));
    for (const family of CASEBOOK_FAMILIES) {
      expect(family.keys.length).toBeGreaterThan(0);
      for (const key of family.keys) {
        expect(keys.has(key), key).toBe(true);
      }
    }
  });

  it('covers clean priority without recycling R04', () => {
    const family = CASEBOOK_FAMILIES.find((item) => item.id === 'one_low');
    expect(family?.keys).toEqual(['R02', 'R16', 'R17', 'R03']);
    expect(family?.keys).not.toContain('R04');
  });

  it('covers a support-only tie inside the same family', () => {
    const family = CASEBOOK_FAMILIES.find((item) => item.id === 'tie');
    expect(family?.keys).toContain('R18');
    expect(family?.keys).toContain('R01');
  });

  it('keeps distinct questions for critical-unclassified and high-cap variants', () => {
    const critical = CASEBOOK_FAMILIES.find((item) => item.id === 'safety_critical');
    const finance = CASEBOOK_FAMILIES.find((item) => item.id === 'safety_high_unclassified');
    expect(questionForFamilyCase(critical!, 'R11')).toBe(critical?.question);
    expect(questionForFamilyCase(critical!, 'R11B')).toContain('lleve el ámbito a Contención');
    expect(criterionIdForFamilyCase(critical!, 'R11')).toBe('safety_critical');
    expect(criterionIdForFamilyCase(critical!, 'R11B')).toBe('safety_critical:R11B');
    expect(questionForFamilyCase(finance!, 'R12B')).toContain('limite el estado máximo');
    expect(criterionIdForFamilyCase(finance!, 'R12B')).toBe('safety_high_unclassified:R12B');
    expect(criterionIdForFamilyCase(finance!, 'R12')).toBe('safety_high_unclassified');
  });

  it('does not treat F18 as a composition verdict', () => {
    const family = CASEBOOK_FAMILIES.find((item) => item.id === 'same_headline');
    expect(family?.keys).toEqual(['R13A', 'R13B']);
    expect(family?.keys.join(' ')).not.toMatch(/F18|R04/);
  });
});
