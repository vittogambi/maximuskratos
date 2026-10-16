import type { Prisma, PrismaClient } from '@prisma/client';

type Row = { slug: string; formCode: string; value: number | null; skipped: boolean; text: string | null };

const AUDIT_SLUGS = ['e-aud-s1', 'e-aud-s2', 'e-aud-s3', 'e-aud-s4', 'e-aud-s5'];

function band115(total: number): string | null {
  if (total <= 0) return null;
  if (total < 46) return 'CRÍTICO';
  if (total < 69) return 'INESTABLE';
  if (total < 92) return 'SÓLIDO';
  if (total <= 115) return 'DOMINANTE';
  return null;
}

function band60(total: number, cuts: [number, number], labels: [string, string, string]): string | null {
  if (total <= 0) return null;
  if (total <= cuts[0]) return labels[0];
  if (total <= cuts[1]) return labels[1];
  if (total <= 60) return labels[2];
  return null;
}

function sum(rows: Row[], slugs: string[]): number {
  return rows
    .filter((r) => slugs.includes(r.slug) && r.value != null && !r.skipped)
    .reduce((acc, r) => acc + (r.value ?? 0), 0);
}

export type SectionLine = { label: string; detail: string };

const FINANCE_BLOCKS = [
  'Suficiencia y flujo de caja',
  'Hábitos de ahorro y respaldo',
  'Hábitos de inversión y multiplicación',
  'Gestión de deudas y techo de valor',
];

const RELATION_BLOCKS = [
  'Relación de pareja',
  'Relaciones familiares',
  'Relaciones sociales',
  'Relaciones laborales',
];

/** Section sum bands from F-RAD-002 and F-RAD-003. Three items, maximum 15. */
export function bandOf15(sum: number): string {
  if (sum <= 0) return 'Sin desarrollo';
  if (sum <= 7) return 'Reestructuración';
  if (sum <= 11) return 'Calibración';
  return 'Fluido';
}

function blockLines(names: string[], values: Array<number | null>): SectionLine[] {
  const lines: SectionLine[] = [];
  for (let i = 0; i < names.length; i++) {
    const chunk = values.slice(i * 3, i * 3 + 3);
    if (chunk.length < 3 || chunk.some((value) => value == null)) continue;
    const sum = chunk.reduce<number>((acc, value) => acc + (value ?? 0), 0);
    lines.push({ label: names[i], detail: `${bandOf15(sum)}, con ${sum} de 15.` });
  }
  return lines;
}

/** What the sheet shows at the end of a section: the sum, and the band when the formula names one. */
export function moduleReading(slug: string, values: Array<number | null>): SectionLine[] {
  if (slug === 'f-rad-003') return blockLines(FINANCE_BLOCKS, values);
  if (slug === 'f-rad-002') return blockLines(RELATION_BLOCKS, values);
  const auditMax: Record<string, number> = {
    'e-aud-s1': 25,
    'e-aud-s2': 25,
    'e-aud-s3': 25,
    'e-aud-s4': 20,
    'e-aud-s5': 20,
    'e-aud-s6': 50,
  };
  const max = auditMax[slug];
  if (!max) return [];
  const nums = values.filter((value): value is number => value != null);
  if (nums.length !== (slug === 'e-aud-s4' || slug === 'e-aud-s5' ? 4 : slug === 'e-aud-s6' ? 10 : 5)) {
    return [];
  }
  const sum = nums.reduce((acc, value) => acc + value, 0);
  return [{ label: 'Suma', detail: `${sum} de ${max}` }];
}

/** F-RAD-001 sleep. The list and the formula agree on under 6 hours. The observation inverted the sign. */
export function sleepReading(hours: number | null): SectionLine | null {
  if (hours == null || !Number.isFinite(hours)) return null;
  return {
    label: 'Sueño',
    detail: hours < 6 ? `${hours} horas, por debajo de 6` : `${hours} horas`,
  };
}

function alerts(rows: Row[], slugs: string[], maxAlert: number): string[] {
  return rows
    .filter((r) => slugs.includes(r.slug) && r.value != null && r.value <= maxAlert)
    .map((r) => r.slug);
}

/** Rules copied from the Excel cells named in the master prompt. Section 6 is excluded from 115. */
export function scoreFormularios(rows: Row[]) {
  const audit = sum(rows, AUDIT_SLUGS);
  const relRows = rows.filter((r) => r.slug === 'f-rad-002');
  const relAnswered = relRows.filter((r) => r.value != null && !r.skipped);
  const rel = relAnswered.reduce((acc, r) => acc + (r.value ?? 0), 0);
  const relationReady = relAnswered.length >= 12 && !relRows.some((r) => r.skipped);
  const finRows = rows.filter((r) => r.slug === 'f-rad-003' && r.value != null && !r.skipped);
  const fin = finRows.reduce((acc, r) => acc + (r.value ?? 0), 0);
  const financeReady = finRows.length >= 12;
  return {
    auditTotal: audit,
    auditMax: 115,
    auditBand: band115(audit),
    auditAlerts: alerts(rows, ['e-aud-s1', 'e-aud-s2'], 1).length + alerts(rows, ['e-aud-s3', 'e-aud-s4', 'e-aud-s5'], 2).length,
    relationTotal: relAnswered.length ? rel : null,
    relationBand: relationReady ? band60(rel, [28, 48], ['DETRIMENTO', 'ALERTA', 'PROPULSOR']) : null,
    relationBandPending: !relationReady,
    financeTotal: finRows.length ? fin : null,
    financeBand: financeReady ? band60(fin, [24, 44], ['CRÍTICO', 'ALERTA', 'ÓPTIMO']) : null,
    pillarsPending: true,
  };
}

export async function persistExcelScore(prisma: PrismaClient | Prisma.TransactionClient, sessionId: string): Promise<void> {
  const session = await prisma.diagnosticSession.findUnique({
    where: { id: sessionId },
    include: {
      version: true,
      responses: { include: { question: { include: { module: true } }, selectedOptions: true } },
    },
  });
  if (!session || session.version.definitionRef !== 'formularios-x-paso') return;

  const rows: Row[] = session.responses.map((response) => {
    const numeric = response.selectedOptions
      .map((opt) => Number(opt.value))
      .find((n) => Number.isFinite(n));
    return {
      slug: response.question.module.slug,
      formCode: response.question.module.dimensionKey,
      value: numeric ?? null,
      skipped: response.skipped,
      text: response.freeText,
    };
  });
  const payload = scoreFormularios(rows);
  await prisma.diagnosticFormResult.upsert({
    where: { sessionId_formCode: { sessionId, formCode: 'formularios-x-paso' } },
    update: { payload },
    create: { sessionId, formCode: 'formularios-x-paso', payload },
  });
  await prisma.masterProfile.updateMany({
    where: { sessionId },
    data: { indices: payload },
  });
}
