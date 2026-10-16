/** IAD-MK 0.1 draft. Not a formula from the Formularios por paso workbook and not a validated test. */

export const IAD_IDS = ['E1', 'E2', 'E3', 'M1', 'M2', 'M3', 'C1', 'C2', 'C3'] as const;
export type IadId = (typeof IAD_IDS)[number];

export type IadAnswer = { value: 1 | 2 | 3 | 4 | 5 | null; unknown: boolean };

export type IadResults = {
  E: number | null;
  M: number | null;
  C: number | null;
  total: number | null;
};

const PILLARS: Array<{ key: keyof Pick<IadResults, 'E' | 'M' | 'C'>; ids: IadId[] }> = [
  { key: 'E', ids: ['E1', 'E2', 'E3'] },
  { key: 'M', ids: ['M1', 'M2', 'M3'] },
  { key: 'C', ids: ['C1', 'C2', 'C3'] },
];

export function norm(response: number): number {
  return 25 * (response - 1);
}

export function scoreIad(answers: Record<IadId, IadAnswer>): IadResults {
  const results: IadResults = { E: null, M: null, C: null, total: null };
  for (const pillar of PILLARS) {
    const values = pillar.ids.map((id) => {
      const answer = answers[id];
      if (!answer || answer.unknown || answer.value == null) return null;
      return norm(answer.value);
    });
    if (values.every((value) => value != null)) {
      results[pillar.key] = (values as number[]).reduce((acc, value) => acc + value, 0) / 3;
    }
  }
  if (results.E != null && results.M != null && results.C != null) {
    results.total = (results.E + results.M + results.C) / 3;
  }
  return results;
}

export function display(value: number | null): string {
  if (value == null) return 'pendiente';
  return String(Math.round(value * 100) / 100);
}

export type AlignmentReading = {
  status: 'none' | 'partial' | 'saved';
  total: number | null;
  pillars: { E: number | null; M: number | null; C: number | null };
  savedAt: string | null;
  methodVersion: string | null;
  coverage: { answered: number; required: 9 };
  revision: number | null;
  directionStatus: string | null;
};

function finite(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Reads the ficha already stored on a purpose revision. Does not recompute it. */
export function alignmentReading(content: unknown, revision: number | null): AlignmentReading {
  const directionStatus = content && typeof content === 'object' && typeof (content as { directionStatus?: unknown }).directionStatus === 'string'
    ? (content as { directionStatus: string }).directionStatus
    : null;
  const empty: AlignmentReading = {
    status: 'none',
    total: null,
    pillars: { E: null, M: null, C: null },
    savedAt: null,
    methodVersion: null,
    coverage: { answered: 0, required: 9 },
    revision,
    directionStatus,
  };
  if (!content || typeof content !== 'object') return empty;
  const iad = (content as { iad?: unknown }).iad;
  if (!iad || typeof iad !== 'object') return empty;
  const body = iad as {
    methodVersion?: unknown;
    savedAt?: unknown;
    answers?: Record<string, { value?: unknown; unknown?: unknown }>;
    results?: { E?: unknown; M?: unknown; C?: unknown; total?: unknown };
  };
  let answered = 0;
  for (const id of IAD_IDS) {
    const row = body.answers?.[id];
    const value = row?.value;
    const known = value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
    if (known && !row?.unknown) answered += 1;
  }
  const pillars = {
    E: finite(body.results?.E),
    M: finite(body.results?.M),
    C: finite(body.results?.C),
  };
  const total = finite(body.results?.total);
  const status: AlignmentReading['status'] = answered === 9 && total != null ? 'saved' : answered > 0 ? 'partial' : 'none';
  return {
    status,
    total: status === 'saved' ? total : null,
    pillars,
    savedAt: typeof body.savedAt === 'string' ? body.savedAt : null,
    methodVersion: typeof body.methodVersion === 'string' ? body.methodVersion : null,
    coverage: { answered, required: 9 },
    revision,
    directionStatus,
  };
}
