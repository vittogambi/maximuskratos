/**
 * Internal launch switch only — never surface "fase" language in UI.
 * `true` = site + founder accounts (product not fully open yet).
 * `false` = full product (diagnostic + apps) is open to users.
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
