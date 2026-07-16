import { useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import { formatISTTime, hdPhoto, teamLogo } from '../lib/format';
import type { Driver, TeamRadioMessage } from '../lib/types';
import { PageHeader, StateMsg } from './ui';

function TeamRadio({ sessionKey, embedded = false }: { sessionKey?: number; embedded?: boolean }) {
  const [filterDriver, setFilterDriver] = useState('');

  const {
    data: radioMessages,
    isLoading,
    isError,
  } = useQuery<TeamRadioMessage[]>(
    ['teamRadio', sessionKey],
    () => api.getTeamRadio(sessionKey as number),
    { enabled: sessionKey != null }
  );

  const { data: drivers } = useQuery<Driver[]>(
    ['liveDrivers', sessionKey],
    () => api.getDrivers(sessionKey as number),
    { enabled: sessionKey != null }
  );

  const driverMap = useMemo(() => {
    const m = new Map<number, Driver>();
    if (Array.isArray(drivers)) drivers.forEach((d) => m.set(d.driver_number, d));
    return m;
  }, [drivers]);

  // Group every clip under its driver; busiest drivers first.
  const groups = useMemo(() => {
    if (!Array.isArray(radioMessages)) return [];
    const byDriver = new Map<number, TeamRadioMessage[]>();
    for (const m of radioMessages) {
      if (!byDriver.has(m.driver_number)) byDriver.set(m.driver_number, []);
      byDriver.get(m.driver_number)!.push(m);
    }
    return [...byDriver.entries()]
      .map(([num, msgs]) => ({
        num,
        msgs: msgs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      }))
      .filter((g) => !filterDriver || g.num.toString().includes(filterDriver))
      .sort((a, b) => b.msgs.length - a.msgs.length);
  }, [radioMessages, filterDriver]);

  return (
    <div className="space-y-6 animate-fade-in">
      {!embedded && (
        <PageHeader title="Team Radio" subtitle="Driver-to-pit audio for the selected session. Timestamps in IST." />
      )}

      <input
        type="text"
        value={filterDriver}
        onChange={(e) => setFilterDriver(e.target.value)}
        placeholder="Filter by driver #"
        className="w-44 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 hover:border-white/[0.2] focus:border-accent/60"
      />

      {isLoading && <StateMsg>Loading team radio…</StateMsg>}
      {isError && <StateMsg kind="error">Failed to load team radio.</StateMsg>}
      {!isLoading && !isError && groups.length === 0 && (
        <StateMsg>No team radio available for this session.</StateMsg>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => {
          const d = driverMap.get(g.num);
          const color = `#${d?.team_colour || '888888'}`;
          return (
            <div key={g.num} className="card overflow-hidden" style={{ borderLeft: `3px solid ${color}` }}>
              <div className="flex items-center gap-3 border-b border-white/[0.06] p-4">
                <img
                  src={hdPhoto(d?.headshot_url, '2col-retina')}
                  alt={d?.full_name ?? ''}
                  loading="lazy"
                  className="h-12 w-12 shrink-0 rounded-full border border-white/10 bg-white/5 object-cover"
                />
                <div className="min-w-0">
                  <div className="font-display text-base font-bold uppercase leading-none tracking-wide text-white">
                    {d?.last_name ?? `Car ${g.num}`}
                    <span className="ml-2 font-mono text-xs text-zinc-500">#{g.num}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                    {d?.team_name && (
                      <img
                        src={teamLogo(d.team_name)}
                        alt=""
                        className="h-3.5 w-auto max-w-[24px] object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    {d?.team_name ?? ''}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono text-lg font-bold text-white">{g.msgs.length}</div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-600">clips</div>
                </div>
              </div>

              <div className="max-h-60 space-y-1.5 overflow-y-auto p-3">
                {g.msgs.map((m) => (
                  <div key={m.date} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 font-mono text-[11px] text-zinc-500">
                      {formatISTTime(m.date)}
                    </span>
                    {m.recording_url ? (
                      <audio controls preload="none" className="h-8 min-w-0 flex-1">
                        <source src={m.recording_url} type="audio/mp3" />
                      </audio>
                    ) : (
                      <span className="text-xs text-zinc-600">no audio</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeamRadio;
