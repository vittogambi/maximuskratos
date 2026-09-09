/** Strings that must not appear in primary Lab UI. Allowed only inside TechnicalDisclosure. */
export const LAB_PRIMARY_BANNED = [
  'REQUIRES HUMAN AUTHORING',
  'source_mapping',
  'item_trace',
  'domain_formula',
  'changeset',
  'candidate',
  'replay',
  'attribution',
  'UNCLEAR',
  'NEW_IN_V2',
  'INSUFFICIENT_COVERAGE',
] as const;
