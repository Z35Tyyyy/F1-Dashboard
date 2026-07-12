import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { MapPin, Flag, CalendarClock } from 'lucide-react';
import { api } from '../lib/api';
import { formatIST, formatISTDate } from '../lib/format';
import type { ScheduleRace } from '../lib/types';
import { PageHeader, StateMsg } from './ui';

function raceStart(r: ScheduleRace): Date {
  return new Date(`${r.date}T${r.time || '00:00:00Z'}`);
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-3xl font-bold tabular-nums text-white sm:text-4xl">
        {String(value).padStart(2, '0')}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-widest text-zinc-500">{label}</div>
    </div>
  );
}

function Schedule() {
  const { data: races, isLoading, isError } = useQuery<ScheduleRace[]>('schedule', () =>
    api.getSchedule()
  );

  // Live clock for the countdown.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const nextRace = useMemo(
    () =>
      Array.isArray(races)
        ? races.find((r) => raceStart(r).getTime() > now)
        : undefined,
    [races, now]
  );

  const remaining = nextRace ? raceStart(nextRace).getTime() - now : 0;
  const d = Math.max(0, Math.floor(remaining / 86400000));
  const h = Math.max(0, Math.floor((remaining % 86400000) / 3600000));
  const m = Math.max(0, Math.floor((remaining % 3600000) / 60000));
  const s = Math.max(0, Math.floor((remaining % 60000) / 1000));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Race Calendar" subtitle="The full season — every round, with times in IST." />

      {isLoading && <StateMsg>Loading calendar…</StateMsg>}
      {isError && <StateMsg kind="error">Failed to load calendar.</StateMsg>}

      {/* Next race hero */}
      {nextRace && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-6 p-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-accent-soft">
                <span className="f1-bar !h-4" /> Next Race · Round {nextRace.round}
              </div>
              <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight text-white">
                {nextRace.raceName}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                <MapPin size={14} className="text-zinc-600" />
                {nextRace.Circuit.circuitName}, {nextRace.Circuit.Location.country}
              </p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-sm text-zinc-300">
                <CalendarClock size={14} className="text-zinc-600" />
                {formatIST(raceStart(nextRace).toISOString())}
              </p>
            </div>
            <div className="flex gap-4 sm:gap-6">
              <CountdownUnit value={d} label="Days" />
              <CountdownUnit value={h} label="Hrs" />
              <CountdownUnit value={m} label="Min" />
              <CountdownUnit value={s} label="Sec" />
            </div>
          </div>
        </div>
      )}

      {/* Full calendar */}
      <div className="space-y-2.5">
        {Array.isArray(races) &&
          races.map((r) => {
            const done = raceStart(r).getTime() < now;
            const isNext = nextRace?.round === r.round;
            return (
              <div
                key={r.round}
                className={`card card-hover flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 ${
                  done ? 'opacity-55' : ''
                }`}
              >
                <span className="w-8 shrink-0 font-mono text-sm text-zinc-500">R{r.round}</span>
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] ${
                    isNext ? 'text-accent-soft' : 'text-zinc-500'
                  }`}
                >
                  <Flag size={16} />
                </span>
                <div className="min-w-[12rem]">
                  <div className="font-medium text-white">{r.raceName}</div>
                  <div className="text-xs text-zinc-500">
                    {r.Circuit.Location.locality}, {r.Circuit.Location.country}
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="font-mono text-sm text-zinc-200">{formatIST(raceStart(r).toISOString())}</div>
                  {r.Qualifying && (
                    <div className="mt-0.5 font-mono text-xs text-zinc-500">
                      Quali {formatISTDate(`${r.Qualifying.date}T${r.Qualifying.time || '00:00:00Z'}`)}
                    </div>
                  )}
                </div>
                {isNext && (
                  <span className="rounded bg-accent px-2 py-0.5 text-xs font-semibold uppercase text-white">
                    Next
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default Schedule;
