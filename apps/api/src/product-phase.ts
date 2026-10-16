/**
 * Internal launch switch only — never surface "fase" language in UI.
 * `true` = public site stays in early access copy.
 * Authenticated accounts still enter the questionnaire. `false` = that public copy also opens.
 *
 * Keep in sync with apps/web/lib/product-phase.ts. Flip both in the same commit.
 */
export const EARLY_ACCESS_MODE = true;

export function isEarlyAccessMode(): boolean {
  return EARLY_ACCESS_MODE;
}

export function isFullProductOpen(): boolean {
  return !EARLY_ACCESS_MODE;
}
