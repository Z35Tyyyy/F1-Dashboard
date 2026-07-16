import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import { formatRaceTime, formatLap, hdPhoto, teamLogo } from '../lib/format';
import type { Driver, DriverStats, SessionResult } from '../lib/types';
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

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="font-mono text-sm text-white">{value}</span>
    </div>
  );
}

function Results({ embedded = false }: { embedded?: boolean }) {
  const { data: results, isLoading, isError } = useQuery<SessionResult[]>('results', () =>
    api.getResults()
  );
  const { data: drivers } = useQuery<Driver[]>('drivers', () => api.getDrivers());
  const { data: driverStats } = useQuery<Record<string, DriverStats>>('driverStats', () =>
    api.getDriverStats()
  );

  const driverMap = useMemo(() => {
    const m = new Map<number, Driver>();
    if (Array.isArray(drivers)) drivers.forEach((d) => m.set(d.driver_number, d));
    return m;
  }, [drivers]);

  const winner = useMemo(
    () => (Array.isArray(results) ? results.find((r) => r.position === 1) : undefined),
    [results]
  );
  const leaderDuration = winner && typeof winner.duration === 'number' ? winner.duration : null;

  const wd = winner ? driverMap.get(winner.driver_number) : undefined;
  const wStats = winner ? driverStats?.[winner.driver_number] : undefined;
  const wColor = `#${wd?.team_colour || 'e10600'}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {!embedded && (
        <>
          <PageHeader title="Race Result" subtitle="Final classification for the latest session." />
          <SessionBanner />
        </>
      )}

      {isLoading && <StateMsg>Loading results…</StateMsg>}
      {isError && <StateMsg kind="error">Failed to load results.</StateMsg>}
      {!isLoading && !isError && Array.isArray(results) && results.length === 0 && (
        <StateMsg>No classified result for this session yet.</StateMsg>
      )}

      {Array.isArray(results) && results.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(300px,360px)_minmax(0,1fr)]">
          {/* LEFT — race winner with big photo */}
          {winner && wd && (
            <div className="card self-start overflow-hidden" style={{ borderLeft: `3px solid ${wColor}` }}>
              <div
                className="relative h-[320px] overflow-hidden"
                style={{ background: `radial-gradient(130% 85% at 50% 100%, ${wColor}55, transparent 70%)` }}
              >
                <div className="absolute left-5 top-3 font-display text-8xl font-bold leading-none text-white/10">
                  P1
                </div>
                {wd.headshot_url && (
                  <img
                    src={hdPhoto(wd.headshot_url, '6col')}
                    alt={wd.full_name}
                    className="absolute bottom-0 left-1/2 h-[320px] w-auto -translate-x-1/2 object-contain object-bottom drop-shadow-[0_12px_34px_rgba(0,0,0,0.65)]"
                  />
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent-bright">
                  <span className="f1-bar !h-4" /> Race Winner
                </div>
                <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-none tracking-wide text-white">
                  {wd.full_name}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
                  <img
                    src={teamLogo(wd.team_name)}
                    alt=""
                    className="h-4 w-auto max-w-[28px] object-contain"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  {wd.team_name}
                  <span className="font-mono text-zinc-600">#{wd.driver_number}</span>
                </div>

                <div className="mt-4">
                  <StatRow label="Race Time" value={leaderDuration != null ? formatRaceTime(leaderDuration) : '—'} />
                  <StatRow label="Laps" value={winner.number_of_laps ?? '—'} />
                  <StatRow label="Points" value={winner.points ?? '—'} />
                  <StatRow label="Fastest Lap" value={wStats?.best_lap != null ? formatLap(wStats.best_lap) : '—'} />
                  <StatRow label="Pit Stops" value={wStats?.pit_stops ?? '—'} />
                </div>
              </div>
            </div>
          )}

          {/* RIGHT — full classification */}
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
                  <tr key={`${r.driver_number}-${i}`} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
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
                    <td className={td}>
                      <span className="flex items-center gap-2 text-zinc-400">
                        {d?.team_name && (
                          <img
                            src={teamLogo(d.team_name)}
                            alt=""
                            className="h-4 w-auto max-w-[24px] object-contain"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        )}
                        {d?.team_name ?? '—'}
                      </span>
                    </td>
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
        </div>
      )}
    </div>
  );
}

export default Results;
