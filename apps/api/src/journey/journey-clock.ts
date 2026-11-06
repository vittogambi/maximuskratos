import { ForbiddenException, Injectable } from '@nestjs/common';

/** Civil date in America/Santiago. Tests replace this provider. JWT and sessions keep the system clock. */
@Injectable()
export class JourneyClock {
  today(): string {
    // Unset in production. The HTTP suite sets it so a rebooted app keeps the same civil day.
    if (process.env.MK_CLOCK_DAY) return process.env.MK_CLOCK_DAY;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  /** Instant for journey timestamps such as activation. Follows MK_CLOCK_DAY so simulated weeks stay coherent. */
  now(): Date {
    if (process.env.MK_CLOCK_DAY) return new Date(`${process.env.MK_CLOCK_DAY}T12:00:00.000Z`);
    return new Date();
  }
}

/** Test doubles may only provide today(). Their instant is noon UTC of that civil day. */
export function journeyNow(clock: { today(): string; now?: () => Date }): Date {
  return typeof clock.now === 'function' ? clock.now() : new Date(`${clock.today()}T12:00:00.000Z`);
}

let raceEntered = 0;
let raceRelease: (() => void) | undefined;

/** Test-only. Production leaves MK_WEEK_HOOK unset. */
export function resetWeekHookForTests(): void {
  raceEntered = 0;
  raceRelease = undefined;
}

/** No-op unless MK_WEEK_HOOK is set by the HTTP suite. */
@Injectable()
export class WeekApplyHook {
  async beforeActionWrite(): Promise<void> {
    if (process.env.MK_WEEK_HOOK !== 'race') return;
    raceEntered += 1;
    if (raceEntered === 1) {
      await new Promise<void>((resolve) => { raceRelease = resolve; });
      return;
    }
    raceRelease?.();
  }

  async afterActionWrite(): Promise<void> {
    if (process.env.MK_WEEK_HOOK === 'throw') throw new ForbiddenException('corte');
  }
}
