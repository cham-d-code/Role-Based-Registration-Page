export const SRI_LANKA_TZ = 'Asia/Colombo';

// Sri Lankan public / government holidays (YYYY-MM-DD).
// Poya days and some religious holidays vary; this list uses published dates.
export const SRI_LANKA_HOLIDAYS: Record<number, string[]> = {
  2024: [
    '2024-01-01', '2024-01-15', '2024-01-25',
    '2024-02-04', '2024-02-23',
    '2024-03-08', '2024-03-24', '2024-03-29',
    '2024-04-11', '2024-04-12', '2024-04-13', '2024-04-15', '2024-04-23',
    '2024-05-01', '2024-05-23', '2024-05-24',
    '2024-06-17', '2024-06-21',
    '2024-07-20',
    '2024-08-19',
    '2024-09-16', '2024-09-17',
    '2024-10-17',
    '2024-11-15',
    '2024-12-14', '2024-12-25',
  ],
  2025: [
    '2025-01-01', '2025-01-13', '2025-01-14',
    '2025-02-04', '2025-02-12', '2025-02-26',
    '2025-03-13', '2025-03-31',
    '2025-04-12', '2025-04-13', '2025-04-14', '2025-04-18',
    '2025-05-01', '2025-05-11', '2025-05-12',
    '2025-06-07', '2025-06-10',
    '2025-07-09',
    '2025-08-08',
    '2025-09-05', '2025-09-07',
    '2025-10-06',
    '2025-11-04',
    '2025-12-04', '2025-12-25',
  ],
  2026: [
    '2026-01-01', '2026-01-02', '2026-01-14',
    '2026-02-01', '2026-02-04', '2026-02-17',
    '2026-03-03', '2026-03-21',
    '2026-04-01', '2026-04-03', '2026-04-13', '2026-04-14',
    '2026-05-01', '2026-05-28', '2026-05-30',
    '2026-06-29',
    '2026-07-28',
    '2026-08-26', '2026-08-27',
    '2026-09-25',
    '2026-10-25',
    '2026-11-23',
    '2026-12-22', '2026-12-25',
  ],
  2027: [
    '2027-01-01', '2027-01-14',
    '2027-02-04',
    '2027-05-01',
    '2027-12-25',
  ],
};

export function isHoliday(date: Date): boolean {
  const y = date.getFullYear();
  const list = SRI_LANKA_HOLIDAYS[y] || [];
  const iso = `${y}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return list.includes(iso);
}

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
}

export function isWorkingDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

export interface PeriodRange {
  start: Date; // inclusive
  end: Date;   // exclusive
  label: string;
  month: number; // 0-based of start
  year: number;  // of start
}

/**
 * Salary / attendance period = 10th of selected month to 10th of next month.
 * `end` is exclusive — period covers [start, end).
 */
export function getPeriodRange(year: number, month: number): PeriodRange {
  const start = new Date(year, month, 10);
  const end = new Date(year, month + 1, 10);
  return {
    start,
    end,
    label: `${formatDateShort(start)} → ${formatDateShort(end)}`,
    month,
    year,
  };
}

export function getPeriodLabel(p: PeriodRange): string {
  return p.label;
}

export function computeWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endT = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  while (cursor.getTime() < endT) {
    if (isWorkingDay(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
}
