import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import { hdPhoto, teamLogo } from '../lib/format';
import type { Driver, DriverStandingsList } from '../lib/types';
import { PageHeader, StateMsg } from './ui';

// Jolpica nationality string -> ISO 3166 alpha-2 (for real flag images; emoji
// flags don't render on Windows). Covers the 2026 grid's nationalities.
const ISO2: Record<string, string> = {
  British: 'gb',
  Dutch: 'nl',
  Monegasque: 'mc',
  Spanish: 'es',
  Mexican: 'mx',
  Australian: 'au',
  French: 'fr',
  German: 'de',
  Italian: 'it',
  Finnish: 'fi',
  Canadian: 'ca',
  Japanese: 'jp',
  Thai: 'th',
  American: 'us',
  'New Zealander': 'nz',
  Danish: 'dk',
  Chinese: 'cn',
  Brazilian: 'br',
  Argentine: 'ar',
  Argentinian: 'ar',
  Belgian: 'be',
  Swiss: 'ch',
  Austrian: 'at',
};

function Drivers() {
  const { data: drivers, isLoading, isError } = useQuery<Driver[]>('drivers', () => api.getDrivers());
  const standings = useQuery<DriverStandingsList>('driverStandings', () => api.getDriverStandings());

  // acronym -> championship position + nationality, from Jolpica standings.
  const meta = useMemo(() => {
    const m = new Map<string, { pos: number; nat: string }>();
    standings.data?.DriverStandings?.forEach((s) =>
      m.set(s.Driver.code ?? '', { pos: Number(s.position), nat: s.Driver.nationality })
    );
    return m;
  }, [standings.data]);

  // Group by team; order teams by their best driver, drivers within team by position.
  const ordered = useMemo(() => {
    if (!Array.isArray(drivers)) return [];
    const teams = new Map<string, Driver[]>();
    for (const d of drivers) {
      if (!teams.has(d.team_name)) teams.set(d.team_name, []);
      teams.get(d.team_name)!.push(d);
    }
    const pos = (d: Driver) => meta.get(d.name_acronym)?.pos ?? 99;
    return [...teams.values()]
      .map((ds) => ds.sort((a, b) => pos(a) - pos(b)))
      .sort((a, b) => Math.min(...a.map(pos)) - Math.min(...b.map(pos)))
      .flat();
  }, [drivers, meta]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="F1 Drivers" subtitle="The 2026 grid, ordered by team." />

      {isError && <StateMsg kind="error">Failed to load drivers.</StateMsg>}
      {isLoading && <StateMsg>Loading drivers…</StateMsg>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((d) => {
          const color = `#${d.team_colour || '9ca3af'}`;
          const iso = ISO2[meta.get(d.name_acronym)?.nat ?? ''];
          return (
            <article
              key={`${d.session_key}-${d.driver_number}`}
              className="card card-hover group relative h-[188px] overflow-hidden"
              style={{ borderBottom: `3px solid ${color}` }}
            >
              {/* team-colour wash */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.1] transition-opacity group-hover:opacity-20"
                style={{ background: `linear-gradient(115deg, ${color}, transparent 62%)` }}
              />
              {/* big number watermark */}
              <div className="pointer-events-none absolute -right-1 top-1 select-none font-display text-[6.5rem] font-bold leading-none text-white/[0.06]">
                {d.driver_number}
              </div>

              {/* headshot (HD transform) */}
              {d.headshot_url && (
                <img
                  src={hdPhoto(d.headshot_url)}
                  alt={d.full_name}
                  loading="lazy"
                  className="absolute bottom-0 right-2 h-[168px] w-auto object-contain object-bottom drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-105"
                />
              )}

              <div className="relative flex h-full flex-col justify-between p-4">
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-4xl font-bold leading-none" style={{ color }}>
                    {String(d.driver_number).padStart(2, '0')}
                  </span>
                  {iso && (
                    <img
                      src={`https://flagcdn.com/w40/${iso}.png`}
                      alt=""
                      className="h-3.5 w-auto rounded-[2px] ring-1 ring-white/15"
                    />
                  )}
                </div>

                <div>
                  <div className="font-sans text-sm font-medium text-zinc-400">{d.first_name}</div>
                  <div className="font-display text-3xl font-bold uppercase leading-none tracking-wide text-white">
                    {d.last_name}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    <img
                      src={teamLogo(d.team_name)}
                      alt=""
                      className="h-4 w-auto max-w-[28px] object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    {d.team_name}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default Drivers;
