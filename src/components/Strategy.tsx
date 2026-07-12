import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import type { Driver, SessionResult, Stint } from '../lib/types';
import { PageHeader, StateMsg } from './ui';
import SessionBanner from './SessionBanner';

// Pirelli compound colours.
const COMPOUND: Record<string, { bg: string; text: string; label: string }> = {
  SOFT: { bg: '#e10600', text: '#fff', label: 'S' },
  MEDIUM: { bg: '#f5c518', text: '#15151e', label: 'M' },
  HARD: { bg: '#e5e7eb', text: '#15151e', label: 'H' },
  INTERMEDIATE: { bg: '#43b02a', text: '#fff', label: 'I' },
  WET: { bg: '#2f7fd1', text: '#fff', label: 'W' },
};
const fallback = { bg: '#52525b', text: '#fff', label: '?' };

function Strategy() {
  const { data: stints, isLoading, isError } = useQuery<Stint[]>('stints', () => api.getStints());
  const { data: drivers } = useQuery<Driver[]>('drivers', () => api.getDrivers());
  const { data: results } = useQuery<SessionResult[]>('results', () => api.getResults());

  const driverMap = useMemo(() => {
    const m = new Map<number, Driver>();
    if (Array.isArray(drivers)) drivers.forEach((d) => m.set(d.driver_number, d));
    return m;
  }, [drivers]);

  const posMap = useMemo(() => {
    const m = new Map<number, number>();
    if (Array.isArray(results))
      results.forEach((r) => r.position != null && m.set(r.driver_number, r.position));
    return m;
  }, [results]);

  const rows = useMemo(() => {
    if (!Array.isArray(stints)) return [];
    const byDriver = new Map<number, Stint[]>();
    let maxLap = 1;
    for (const s of stints) {
      if (!byDriver.has(s.driver_number)) byDriver.set(s.driver_number, []);
      byDriver.get(s.driver_number)!.push(s);
      maxLap = Math.max(maxLap, s.lap_end);
    }
    const list = [...byDriver.entries()].map(([driver_number, ss]) => ({
      driver_number,
      stints: ss.sort((a, b) => a.stint_number - b.stint_number),
    }));
    list.sort(
      (a, b) => (posMap.get(a.driver_number) ?? 99) - (posMap.get(b.driver_number) ?? 99) ||
        a.driver_number - b.driver_number
    );
    return { list, maxLap };
  }, [stints, posMap]) as { list: { driver_number: number; stints: Stint[] }[]; maxLap: number };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Tyre Strategy"
        subtitle="Stint-by-stint tyre compounds for every driver in the latest session."
      />
      <SessionBanner />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-400">
        {Object.entries(COMPOUND).map(([name, c]) => (
          <span key={name} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: c.bg }} />
            {name[0] + name.slice(1).toLowerCase()}
          </span>
        ))}
      </div>

      {isLoading && <StateMsg>Loading strategy…</StateMsg>}
      {isError && <StateMsg kind="error">Failed to load strategy.</StateMsg>}
      {!isLoading && !isError && Array.isArray(stints) && stints.length === 0 && (
        <StateMsg>No stint data for this session.</StateMsg>
      )}

      {rows.list && rows.list.length > 0 && (
        <div className="card divide-y divide-white/[0.05] overflow-hidden">
          {rows.list.map(({ driver_number, stints: ss }) => {
            const d = driverMap.get(driver_number);
            return (
              <div key={driver_number} className="flex items-center gap-3 px-4 py-2.5">
                <span
                  className="h-4 w-1 -skew-x-12 shrink-0"
                  style={{ backgroundColor: `#${d?.team_colour || '9ca3af'}` }}
                />
                <span className="w-14 shrink-0 font-mono text-sm text-zinc-200">
                  {d?.name_acronym ?? `#${driver_number}`}
                </span>
                <div className="flex h-6 flex-1 overflow-hidden rounded bg-white/[0.03]">
                  {ss.map((s) => {
                    const c = COMPOUND[s.compound] ?? fallback;
                    const laps = Math.max(1, s.lap_end - s.lap_start + 1);
                    return (
                      <div
                        key={s.stint_number}
                        style={{ width: `${(laps / rows.maxLap) * 100}%`, backgroundColor: c.bg, color: c.text }}
                        title={`${s.compound} · laps ${s.lap_start}-${s.lap_end} (${laps})`}
                        className="flex items-center justify-center overflow-hidden text-[11px] font-bold"
                      >
                        {laps >= 4 ? `${c.label}·${laps}` : c.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Strategy;
