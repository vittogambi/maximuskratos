import type { DiagnosticState } from '@/lib/api';

export type PlayerBackTarget =
  | { kind: 'intro'; moduleSlug: string }
  | { kind: 'question'; questionId: string };

/**
 * Reverse of the player: intro, then its questions, then the next intro.
 * From an intro, Anterior is the last question of the previous section.
 * From the first question, Anterior is this section's intro.
 */
export function playerBackTarget(input: {
  screen: 'intro' | 'question' | 'other';
  moduleSlug: string | null;
  isFirstInModule: boolean;
  previousQuestionId: string | null;
}): PlayerBackTarget | null {
  if (input.screen === 'intro') {
    return input.previousQuestionId
      ? { kind: 'question', questionId: input.previousQuestionId }
      : null;
  }
  if (input.screen !== 'question') return null;
  if (input.isFirstInModule && input.moduleSlug) {
    return { kind: 'intro', moduleSlug: input.moduleSlug };
  }
  if (input.previousQuestionId) {
    return { kind: 'question', questionId: input.previousQuestionId };
  }
  return null;
}

type HeldNav = { state: DiagnosticState; skipIntro: boolean; at: number };

/** Survives a remount of the player so the live refetch cannot erase Anterior. */
let heldNav: HeldNav | null = null;
let navEpoch = 0;

export function playerNavEpoch(): number {
  return navEpoch;
}

export function rememberPlayerNav(state: DiagnosticState, skipIntro: boolean) {
  navEpoch += 1;
  heldNav = { state, skipIntro, at: Date.now() };
  const snapshot = heldNav;
  setTimeout(() => {
    if (heldNav === snapshot) heldNav = null;
  }, 4000);
}

export function consumePlayerNav(): HeldNav | null {
  const held = heldNav;
  if (!held || Date.now() - held.at > 4000) {
    heldNav = null;
    return null;
  }
  heldNav = null;
  return held;
}
