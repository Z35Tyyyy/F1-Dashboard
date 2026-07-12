import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import { formatRaceTime } from '../lib/format';
import type { Driver, SessionResult } from '../lib/types';
import { PageHeader, StateMsg } from './ui';
import SessionBanner from './SessionBanner';

const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500';
const td = 'px-4 py-3';

function gapText(r: SessionResult, leaderDuration: number | null): string {
  if (r.dsq) return 'DSQ';
  if (r.dns) return 'DNS';
  if (r.dnf) return 'DNF';
  if (r.position === 1) return leaderDuration != null ? formatRaceTime(leaderDuration) : '—';
  if (typeof r.gap_to_leader === 'string') return r.gap_to_leader; // e.g. "+1 LAP"
  if (typeof r.gap_to_leader === 'number') return `+${r.gap_to_leader.toFixed(3)}`;
  return '—';
}

function Results() {
  const { data: results, isLoading, isError } = useQuery<SessionResult[]>('results', () =>
    api.getResults()
  );
  const { data: drivers } = useQuery<Driver[]>('drivers', () => api.getDrivers());

  const driverMap = useMemo(() => {
    const m = new Map<number, Driver>();
    if (Array.isArray(drivers)) drivers.forEach((d) => m.set(d.driver_number, d));
    return m;
  }, [drivers]);

  const leaderDuration = useMemo(() => {
    const p1 = Array.isArray(results) ? results.find((r) => r.position === 1) : undefined;
    return p1 && typeof p1.duration === 'number' ? p1.duration : null;
  }, [results]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Race Result" subtitle="Final classification for the latest session." />
      <SessionBanner />

      {isLoading && <StateMsg>Loading results…</StateMsg>}
      {isError && <StateMsg kind="error">Failed to load results.</StateMsg>}
      {!isLoading && !isError && Array.isArray(results) && results.length === 0 && (
        <StateMsg>No classified result for this session yet.</StateMsg>
      )}

      {Array.isArray(results) && results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className={th}>Pos</th>
                <th className={th}>Driver</th>
                <th className={th}>Team</th>
                <th className={`${th} text-right`}>Laps</th>
                <th className={`${th} text-right`}>Gap / Time</th>
                <th className={`${th} text-right`}>Pts</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const d = driverMap.get(r.driver_number);
                const color = `#${d?.team_colour || '9ca3af'}`;
                const classified = r.position != null && !r.dnf && !r.dsq && !r.dns;
                return (
                  <tr
                    key={`${r.driver_number}-${i}`}
                    className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                  >
                    <td className={`${td} font-mono font-semibold ${classified ? 'text-white' : 'text-zinc-600'}`}>
                      {r.position ?? 'NC'}
                    </td>
                    <td className={td}>
                      <span className="inline-flex items-center gap-2 font-medium text-white">
                        <span className="h-3 w-1 -skew-x-12" style={{ backgroundColor: color }} />
                        {d ? d.full_name : `#${r.driver_number}`}
                        <span className="font-mono text-xs text-zinc-600">{d?.name_acronym}</span>
                      </span>
                    </td>
                    <td className={`${td} text-zinc-400`}>{d?.team_name ?? '—'}</td>
                    <td className={`${td} text-right font-mono text-zinc-400`}>{r.number_of_laps ?? '—'}</td>
                    <td
                      className={`${td} text-right font-mono ${
                        r.dnf || r.dsq || r.dns ? 'text-accent-soft' : 'text-zinc-300'
                      }`}
                    >
                      {gapText(r, leaderDuration)}
                    </td>
                    <td className={`${td} text-right font-mono font-semibold text-white`}>
                      {r.points ? r.points : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Results;
