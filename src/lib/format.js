const NBSP = '\u2009';

export const int = (n) => (n === null || n === undefined ? '—' : Math.round(n).toLocaleString('en-US'));

export const dec = (n, p = 1) =>
  n === null || n === undefined ? '—' : n.toLocaleString('en-US', { minimumFractionDigits: p, maximumFractionDigits: p });

/** 16207051 -> "16.2M". Used where axis space is tight. */
export function compact(n) {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(abs >= 1e4 ? 0 : 1)}k`;
  return String(Math.round(n));
}

export function usd(n) {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e12) return `US$${(n / 1e12).toFixed(abs >= 1e13 ? 0 : 1)}${NBSP}tn`;
  if (abs >= 1e9) return `US$${(n / 1e9).toFixed(abs >= 1e10 ? 0 : 1)}${NBSP}bn`;
  if (abs >= 1e6) return `US$${(n / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}${NBSP}m`;
  if (abs >= 1e3) return `US$${(n / 1e3).toFixed(0)}k`;
  return `US$${Math.round(n)}`;
}

export const pct = (frac, p = 1) => `${(frac * 100).toFixed(p)}%`;

/** Modified Mercalli intensity as a Roman numeral. */
export function roman(value) {
  const n = Math.max(1, Math.min(12, Math.round(value)));
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n - 1];
}

/** Standard USGS ShakeMap intensity palette, indexed by MMI. */
const MMI_COLORS = [
  [1, '#ffffff'],
  [2, '#bfccff'],
  [3, '#a0e6ff'],
  [4, '#80ffff'],
  [5, '#7aff93'],
  [6, '#ffff00'],
  [7, '#ffc800'],
  [8, '#ff9100'],
  [9, '#ff0000'],
  [10, '#c80000'],
];

export function mmiColor(value) {
  if (value === null || value === undefined) return '#5a6b7d';
  const v = Math.max(1, Math.min(10, value));
  let lo = MMI_COLORS[0];
  for (const stop of MMI_COLORS) if (stop[0] <= v) lo = stop;
  return lo[1];
}

export const MMI_LABELS = {
  1: 'Not felt',
  2: 'Weak',
  3: 'Weak',
  4: 'Light',
  5: 'Moderate',
  6: 'Strong',
  7: 'Very strong',
  8: 'Severe',
  9: 'Violent',
  10: 'Extreme',
};

export const MMI_SCALE = MMI_COLORS;

/** PAGER / ground-failure alert level colours. */
export function alertColor(level) {
  return { green: '#3ddc97', yellow: '#ffd23f', orange: '#ff8a3d', red: '#ff5252' }[level] || '#62778d';
}

const COT_OFFSET_MS = -5 * 3600 * 1000;

/** Colombia has no DST, so a fixed UTC-5 shift is exact. */
export function cot(ms, withDate = true) {
  const d = new Date(ms + COT_OFFSET_MS);
  const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  if (!withDate) return `${time} COT`;
  const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${d.getUTCDate()} ${month}, ${time} COT`;
}

export function utc(ms) {
  const d = new Date(ms);
  return `${d.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

/** "3 d 4 h" — elapsed time since the origin, for the mainshock-relative axis. */
export function elapsed(ms) {
  if (ms < 0) return '—';
  const h = ms / 3600000;
  if (h < 1) return `+${Math.round(ms / 60000)} min`;
  if (h < 48) return `+${h.toFixed(1)} h`;
  return `+${(h / 24).toFixed(1)} d`;
}

export function dayLabel(iso) {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}`;
}

/** Accent-insensitive key so 'Valle Del Cauca' matches 'Valle del Cauca'. */
export const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
