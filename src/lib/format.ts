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

// Team name -> F1 media logo slug (white logos). Covers both OpenF1 and
// Jolpica/Ergast naming variants.
const TEAM_SLUG: Record<string, string> = {
  Mercedes: 'mercedes',
  Ferrari: 'ferrari',
  McLaren: 'mclaren',
  'Red Bull Racing': 'redbullracing',
  'Red Bull': 'redbullracing',
  Williams: 'williams',
  'Aston Martin': 'astonmartin',
  Alpine: 'alpine',
  'Alpine F1 Team': 'alpine',
  'Haas F1 Team': 'haas',
  Haas: 'haas',
  'Racing Bulls': 'racingbulls',
  'RB F1 Team': 'racingbulls',
  Audi: 'audi',
  'Kick Sauber': 'audi',
  Sauber: 'audi',
  Cadillac: 'cadillac',
  'Cadillac F1 Team': 'cadillac',
};

// Country name (Ergast + OpenF1 variants) -> ISO 3166 alpha-2, for flag images.
const COUNTRY_ISO2: Record<string, string> = {
  Australia: 'au',
  Austria: 'at',
  Azerbaijan: 'az',
  Bahrain: 'bh',
  Belgium: 'be',
  Brazil: 'br',
  Canada: 'ca',
  China: 'cn',
  France: 'fr',
  Germany: 'de',
  'Great Britain': 'gb',
  Hungary: 'hu',
  Italy: 'it',
  Japan: 'jp',
  Mexico: 'mx',
  Monaco: 'mc',
  Netherlands: 'nl',
  Portugal: 'pt',
  Qatar: 'qa',
  'Saudi Arabia': 'sa',
  Singapore: 'sg',
  Spain: 'es',
  UAE: 'ae',
  'United Arab Emirates': 'ae',
  UK: 'gb',
  'United Kingdom': 'gb',
  USA: 'us',
  'United States': 'us',
};

/** flagcdn flag image URL for a country name; undefined if unknown. */
export function countryFlag(name?: string | null, width = 'w80'): string | undefined {
  if (!name) return undefined;
  const iso = COUNTRY_ISO2[name];
  return iso ? `https://flagcdn.com/${width}/${iso}.png` : undefined;
}

/** White team logo URL from F1's media CDN, or undefined if the team is unknown. */
export function teamLogo(teamName?: string | null): string | undefined {
  if (!teamName) return undefined;
  const slug = TEAM_SLUG[teamName] ?? teamName.toLowerCase().replace(/[^a-z]/g, '');
  return `https://media.formula1.com/image/upload/c_fit,h_64/q_auto/v1740000000/common/f1/2026/${slug}/2026${slug}logowhite.webp`;
}

const SLUG_COLOR: Record<string, string> = {
  mercedes: '#27f4d2',
  ferrari: '#e8002d',
  mclaren: '#ff8000',
  redbullracing: '#3671c6',
  williams: '#64c4ff',
  astonmartin: '#229971',
  alpine: '#0093cc',
  racingbulls: '#6692ff',
  haas: '#b6babd',
  audi: '#00594f',
  cadillac: '#c89b4e',
};

/** Representative team colour (hex) for a team name, falling back to F1 red. */
export function teamColor(teamName?: string | null): string {
  if (!teamName) return '#e10600';
  const slug = TEAM_SLUG[teamName] ?? teamName.toLowerCase().replace(/[^a-z]/g, '');
  return SLUG_COLOR[slug] ?? '#e10600';
}

/** Upgrade an F1 media headshot from the tiny 1col transform to a crisp one. */
export function hdPhoto(url?: string | null, size = '4col-retina'): string | undefined {
  if (!url) return undefined;
  return url.replace('.transform/1col/', `.transform/${size}/`);
}

/** Degrees -> 8-point compass label, e.g. 274 -> "W". */
export function compass(deg?: number | null): string {
  if (deg == null) return '';
  return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round(deg / 45) % 8];
}
