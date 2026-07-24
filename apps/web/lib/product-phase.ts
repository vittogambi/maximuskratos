/**
 * Internal launch switch only — never surface "fase" language in UI.
 * `true` = site + founder accounts (product not fully open yet).
 * `false` = full product (diagnostic + apps) is open to users.
 */
export const EARLY_ACCESS_MODE = true;

export function isEarlyAccessMode(): boolean {
  return EARLY_ACCESS_MODE;
}

/** @deprecated Use isEarlyAccessMode */
export function isFounderAccessPhase(): boolean {
  return isEarlyAccessMode();
}

export function isFullProductOpen(): boolean {
  return !EARLY_ACCESS_MODE;
}

/** @deprecated Use isFullProductOpen */
export function isDiagnosticOpen(): boolean {
  return isFullProductOpen();
}
