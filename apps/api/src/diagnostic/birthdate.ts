/** Completed years on a calendar date. Invalid or future dates return null. */
export function ageInYears(iso: string, today = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(year, month - 1, day);
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day) return null;
  const nowYear = today.getFullYear();
  const nowMonth = today.getMonth() + 1;
  const nowDay = today.getDate();
  if (year > nowYear || (year === nowYear && (month > nowMonth || (month === nowMonth && day > nowDay)))) return null;
  let age = nowYear - year;
  if (nowMonth < month || (nowMonth === month && nowDay < day)) age -= 1;
  return age;
}

export function birthdateBounds(minAge: number, maxAge: number, today = new Date()): { min: string; max: string } {
  return {
    min: shiftYears(today, -maxAge),
    max: shiftYears(today, -minAge),
  };
}

function shiftYears(from: Date, delta: number): string {
  const copy = new Date(from.getFullYear() + delta, from.getMonth(), from.getDate());
  const month = String(copy.getMonth() + 1).padStart(2, '0');
  const day = String(copy.getDate()).padStart(2, '0');
  return `${copy.getFullYear()}-${month}-${day}`;
}
