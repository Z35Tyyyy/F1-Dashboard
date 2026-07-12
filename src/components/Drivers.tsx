import { useQuery } from 'react-query';
import { Timer, Wrench, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { formatLap } from '../lib/format';
import type { Driver, DriverStats } from '../lib/types';
import { PageHeader, StateMsg } from './ui';
import SessionBanner from './SessionBanner';

function Drivers() {
  const { data: drivers, isLoading, isError } = useQuery<Driver[]>('drivers', () =>
    api.getDrivers()
  );
  const { data: driverStats } = useQuery<Record<string, DriverStats>>('driverStats', () =>
    api.getDriverStats()
  );

  const ordered = Array.isArray(drivers)
    ? [...drivers].sort((a, b) => {
        const pa = driverStats?.[a.driver_number]?.position ?? 99;
        const pb = driverStats?.[b.driver_number]?.position ?? 99;
        return pa - pb || a.driver_number - b.driver_number;
      })
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Drivers" subtitle="Grid for the latest session, with each driver's session stats." />
      <SessionBanner />

      {isError && <StateMsg kind="error">Failed to load drivers.</StateMsg>}
      {isLoading && <StateMsg>Loading drivers…</StateMsg>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((driver) => {
          const stats = driverStats?.[driver.driver_number];
          const color = `#${driver.team_colour || '9ca3af'}`;
          return (
            <div
              key={`${driver.session_key}-${driver.driver_number}`}
              className="card card-hover relative overflow-hidden p-5"
            >
              {/* team-colour spine */}
              <span
                className="absolute left-0 top-0 h-full w-1"
                style={{ backgroundColor: color }}
              />
              <div className="flex items-center gap-4">
                <img
                  src={driver.headshot_url}
                  alt={driver.full_name}
                  loading="lazy"
                  className="h-14 w-14 rounded-full border border-white/10 object-cover bg-white/5"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-white">{driver.full_name}</h2>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-sm">
                    <span className="font-mono text-zinc-500">#{driver.driver_number}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="inline-flex items-center gap-1.5 text-zinc-400">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                      {driver.team_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5">
                  <Trophy size={14} className="mx-auto text-amber-400" />
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">Pos</div>
                  <div className="font-mono text-base text-white">{stats?.position ?? '—'}</div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5">
                  <Timer size={14} className="mx-auto text-emerald-400" />
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">Best lap</div>
                  <div className="font-mono text-sm text-white">
                    {stats?.best_lap != null ? formatLap(stats.best_lap) : '—'}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5">
                  <Wrench size={14} className="mx-auto text-sky-400" />
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">Pits</div>
                  <div className="font-mono text-base text-white">{stats?.pit_stops ?? 0}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Drivers;
