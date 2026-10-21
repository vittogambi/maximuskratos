import type { PrismaClient } from '@prisma/client';
import type { ActionScheduleRow } from './action-schedule';

export async function loadActionSchedules(db: Pick<PrismaClient, 'actionSchedule'>, actionIds: string[]): Promise<ActionScheduleRow[]> {
  if (!actionIds.length) return [];
  const rows = await db.actionSchedule.findMany({
    where: { actionId: { in: actionIds } },
    orderBy: { effectiveFrom: 'asc' },
  });
  return rows.map((row) => ({
    actionId: row.actionId,
    effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10),
    effectiveTo: row.effectiveTo ? row.effectiveTo.toISOString().slice(0, 10) : null,
    kind: row.kind as ActionScheduleRow['kind'],
    weekday: row.weekday,
    intervalDays: row.intervalDays,
    anchorDay: row.anchorDay ? row.anchorDay.toISOString().slice(0, 10) : null,
    occasionsPerWeek: row.occasionsPerWeek,
    source: row.source as ActionScheduleRow['source'],
  }));
}

export async function appendScheduleVersion(
  db: Pick<PrismaClient, 'actionSchedule'>,
  input: {
    actionId: string;
    effectiveFrom: string;
    kind: ActionScheduleRow['kind'];
    weekday: number | null;
    intervalDays: number | null;
    occasionsPerWeek: number | null;
    source: ActionScheduleRow['source'];
    commandKey?: string;
  },
) {
  const prior = await db.actionSchedule.findMany({ where: { actionId: input.actionId }, orderBy: { effectiveFrom: 'desc' } });
  const effectiveToPrevious = prior.find((row) => row.effectiveTo == null && row.effectiveFrom.toISOString().slice(0, 10) < input.effectiveFrom);
  if (effectiveToPrevious) {
    const end = new Date(`${input.effectiveFrom}T12:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() - 1);
    await db.actionSchedule.update({
      where: { id: effectiveToPrevious.id },
      data: { effectiveTo: end },
    });
  }
  return db.actionSchedule.create({
    data: {
      actionId: input.actionId,
      effectiveFrom: new Date(`${input.effectiveFrom}T12:00:00.000Z`),
      kind: input.kind,
      weekday: input.weekday,
      intervalDays: input.intervalDays,
      occasionsPerWeek: input.occasionsPerWeek,
      source: input.source,
      commandKey: input.commandKey ?? null,
    },
  });
}
