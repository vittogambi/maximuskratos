import type { WeekDecision, WeekRevision } from '../apply-week';
import type { ReviewCode, Template } from './engine';

export type MemberReviewChoice = 'KEEP' | 'REDUCE' | 'MODIFY' | 'SUBSTITUTE' | 'NO_RECORDS';

export function choicesForReview(code: ReviewCode): MemberReviewChoice[] {
  if (code === 'NO_RECORDS') return ['NO_RECORDS', 'KEEP'];
  if (code === 'KEEP') return ['KEEP', 'REDUCE'];
  if (code === 'LIGHTER_OK') return ['KEEP', 'REDUCE'];
  if (code === 'CHECK' || code === 'EXPLORE') return ['MODIFY', 'SUBSTITUTE', 'REDUCE', 'KEEP'];
  return ['KEEP'];
}

export function defaultRevisionForSubstitute(template: Template, alternateTemplateId: string | null): WeekRevision | null {
  if (!alternateTemplateId || alternateTemplateId === template.id) return null;
  return { title: undefined, doneWhen: undefined };
}

export function weekDecisionFromChoice(
  choice: MemberReviewChoice,
  input: {
    code: ReviewCode;
    load: { occasionsPerWeek: number | null; minutesPerOccasion: number } | null;
    template: Template;
    revision?: WeekRevision;
    alternateAction?: { title: string; doneWhen: string } | null;
  },
): { decision: WeekDecision; revision: WeekRevision } {
  if (choice === 'NO_RECORDS') return { decision: 'KEEP', revision: {} };
  if (choice === 'KEEP') return { decision: 'KEEP', revision: {} };
  if (choice === 'REDUCE') {
    const occasions = input.load?.occasionsPerWeek;
    const nextOccasions = occasions != null && occasions > 1 ? occasions - 1 : occasions;
    return {
      decision: 'REDUCE',
      revision: {
        occasionsPerWeek: nextOccasions,
        minutesPerOccasion: input.load?.minutesPerOccasion ?? null,
      },
    };
  }
  if (choice === 'SUBSTITUTE' && input.alternateAction) {
    return {
      decision: 'SUBSTITUTE',
      revision: { title: input.alternateAction.title, doneWhen: input.alternateAction.doneWhen },
    };
  }
  const revision = input.revision ?? {};
  if (choice === 'MODIFY' || choice === 'SUBSTITUTE') {
    if (!revision.title?.trim() && !revision.doneWhen?.trim()) {
      throw new Error('MODIFY_REQUIRES_CHANGE');
    }
    return { decision: choice === 'SUBSTITUTE' ? 'SUBSTITUTE' : 'MODIFY', revision };
  }
  throw new Error('INVALID_REVIEW_CHOICE');
}
