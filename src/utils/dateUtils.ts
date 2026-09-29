/**
 * Formats original date string into readable Spanish WhatsApp date separator
 * e.g. "HOY", "AYER", or "29 de septiembre de 2026"
 * Preserves the original export date values without timezone conversion shifts.
 */

const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export interface ParsedDateComponents {
  day: number;
  month: number;
  year: number;
}

export function parseDateComponents(dateStr: string): ParsedDateComponents | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  const parts = clean.split(/[/.-]/).map((p) => parseInt(p, 10));

  if (parts.length !== 3 || parts.some(isNaN)) {
    return null;
  }

  let day = parts[0];
  let month = parts[1];
  let year = parts[2];

  // If format is YYYY-MM-DD
  if (parts[0] > 1000) {
    year = parts[0];
    month = parts[1];
    day = parts[2];
  } else if (parts[2] < 100) {
    // 2-digit year (e.g. 26 -> 2026)
    year = parts[2] > 70 ? 1900 + parts[2] : 2000 + parts[2];
    // Check if month and day might be inverted (e.g. US style MM/DD/YY if month > 12)
    if (parts[0] > 12 && parts[1] <= 12) {
      day = parts[0];
      month = parts[1];
    }
  }

  return { day, month, year };
}

/**
 * Normalizes any chat date string into YYYY-MM-DD for native HTML date picker input
 */
export function normalizeDateToYMD(dateStr: string): string {
  const comp = parseDateComponents(dateStr);
  if (!comp) return '';
  const y = String(comp.year).padStart(4, '0');
  const m = String(comp.month).padStart(2, '0');
  const d = String(comp.day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats YYYY-MM-DD to friendly Spanish format e.g. "4 de septiembre de 2026"
 */
export function formatYMDToSpanish(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-').map(p => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return ymd;
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  const monthName = SPANISH_MONTHS[month - 1] || `mes ${month}`;
  return `${day} de ${monthName} de ${year}`;
}

export function formatDateSeparator(dateStr: string): string {
  if (!dateStr) return '';

  const comp = parseDateComponents(dateStr);
  if (!comp) {
    return dateStr.toUpperCase();
  }

  const { day, month, year } = comp;

  // Check today / yesterday relative to the current real date
  const now = new Date();
  const todayDay = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const todayYear = now.getFullYear();

  if (day === todayDay && month === todayMonth && year === todayYear) {
    return 'HOY';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    day === yesterday.getDate() &&
    month === yesterday.getMonth() + 1 &&
    year === yesterday.getFullYear()
  ) {
    return 'AYER';
  }

  const monthName = SPANISH_MONTHS[month - 1] || `mes ${month}`;
  return `${day} de ${monthName} de ${year}`;
}

/**
 * Given a target date in YYYY-MM-DD and a list of available YYYY-MM-DD dates in the chat,
 * returns the closest chronological date available.
 */
export function findClosestDate(targetYMD: string, availableYMDList: string[]): string | null {
  if (!targetYMD || availableYMDList.length === 0) return null;
  const targetTime = new Date(targetYMD + 'T00:00:00').getTime();
  if (isNaN(targetTime)) return null;

  let closestDate = availableYMDList[0];
  let minDiff = Infinity;

  for (const dateStr of availableYMDList) {
    const time = new Date(dateStr + 'T00:00:00').getTime();
    if (isNaN(time)) continue;
    const diff = Math.abs(targetTime - time);
    if (diff < minDiff) {
      minDiff = diff;
      closestDate = dateStr;
    }
  }

  return closestDate;
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
