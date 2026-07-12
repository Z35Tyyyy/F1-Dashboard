// All race times are shown in Indian Standard Time (UTC+5:30).
const IST = 'Asia/Kolkata';

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const timeFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: IST,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function toDate(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

/** "05 Jul 2026 · 7:30 PM IST" */
export function formatIST(iso?: string | null): string {
  const d = toDate(iso);
  if (!d) return '—';
  return `${dateFmt.format(d)} · ${timeFmt.format(d)} IST`;
}

/** "05 Jul 2026" */
export function formatISTDate(iso?: string | null): string {
  const d = toDate(iso);
  return d ? dateFmt.format(d) : '—';
}

/** "7:30 PM IST" */
export function formatISTTime(iso?: string | null): string {
  const d = toDate(iso);
  return d ? `${timeFmt.format(d)} IST` : '—';
}

/** Lap seconds -> "1:32.871" */
export function formatLap(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

/** Total seconds -> race time, e.g. 5231.335 -> "1:27:11.335". */
export function formatRaceTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3).padStart(6, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

/** Degrees -> 8-point compass label, e.g. 274 -> "W". */
export function compass(deg?: number | null): string {
  if (deg == null) return '';
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}
