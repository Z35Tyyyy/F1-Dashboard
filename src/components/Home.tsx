import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { MapPin, CalendarClock, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { formatIST, hdPhoto, teamLogo, teamColor } from '../lib/format';
import { CountryFlag } from './ui';
import type {
  Driver,
  DriverStandingsList,
  ConstructorStandingsList,
  ScheduleRace,
  SessionResult,
} from '../lib/types';

function raceStart(r: ScheduleRace): Date {
  return new Date(`${r.date}T${r.time || '00:00:00Z'}`);
}

function Unit({ v, label }: { v: number; label: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-3xl font-bold tabular-nums text-white sm:text-5xl">
        {String(v).padStart(2, '0')}
      </div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function SectionHead({ title, to, cta }: { title: string; to?: string; cta?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="flex items-center gap-3 font-display text-xl font-bold uppercase tracking-wide text-white">
        <span className="f1-bar !h-5" />
        {title}
      </h2>
      {to && (
        <Link to={to} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-accent-bright hover:text-white">
          {cta} <ChevronRight size={13} />
        </Link>
      )}
    </div>
  );
}

const MEDAL = ['#f5c518', '#c9ccd1', '#cd7f32'];

function Bar({
  pos,
  label,
  logo,
  points,
  color,
  max,
}: {
  pos: string;
  label: string;
  logo?: string;
  points: string;
  color: string;
  max: number;
}) {
  const pct = max > 0 ? (Number(points) / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-5 shrink-0 font-mono text-sm text-zinc-500">{pos}</span>
      {logo && (
        <img src={logo} alt="" className="h-4 w-6 shrink-0 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
      )}
      <span className="w-24 shrink-0 truncate text-sm text-zinc-200 sm:w-32">{label}</span>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-9 shrink-0 text-right font-mono text-sm font-semibold text-white">{points}</span>
    </div>
  );
}

export default function Home() {
  const { data: races } = useQuery<ScheduleRace[]>('schedule', () => api.getSchedule());
  const { data: results } = useQuery<SessionResult[]>('results', () => api.getResults());
  const { data: drivers } = useQuery<Driver[]>('drivers', () => api.getDrivers());
  const dstand = useQuery<DriverStandingsList>('driverStandings', () => api.getDriverStandings());
  const cstand = useQuery<ConstructorStandingsList>('constructorStandings', () =>
    api.getConstructorStandings()
  );

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(
    () => (Array.isArray(races) ? races.find((r) => raceStart(r).getTime() > now) : undefined),
    [races, now]
  );
  const rem = next ? raceStart(next).getTime() - now : 0;
  const dd = Math.max(0, Math.floor(rem / 86400000));
  const hh = Math.max(0, Math.floor((rem % 86400000) / 3600000));
  const mm = Math.max(0, Math.floor((rem % 3600000) / 60000));
  const ss = Math.max(0, Math.floor((rem % 60000) / 1000));

  const hasGP = next ? /grand prix/i.test(next.raceName) : false;
  const lead = next ? (hasGP ? next.raceName.replace(/grand prix/i, '').trim() : next.raceName) : '';

  const driverMap = useMemo(() => {
    const m = new Map<number, Driver>();
    if (Array.isArray(drivers)) drivers.forEach((d) => m.set(d.driver_number, d));
    return m;
  }, [drivers]);

  const podium = useMemo(
    () =>
      Array.isArray(results)
        ? results
            .filter((r) => r.position != null && r.position <= 3)
            .sort((a, b) => a.position! - b.position!)
        : [],
    [results]
  );
  // Staggered order: P2, P1, P3.
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);

  const topDrivers = dstand.data?.DriverStandings?.slice(0, 8) ?? [];
  const topTeams = cstand.data?.ConstructorStandings ?? [];
  const maxD = Number(topDrivers[0]?.points ?? 0);
  const maxT = Number(topTeams[0]?.points ?? 0);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Cinematic next-race hero */}
      {next && (
        <section className="card relative overflow-hidden bg-red-sheen shadow-glow">
          <div className="pointer-events-none absolute -right-4 -top-16 select-none font-display text-[16rem] font-bold leading-none text-white/[0.03]">
            {next.round}
          </div>
          <div className="relative flex flex-col gap-8 p-7 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-4">
                <CountryFlag country={next.Circuit.Location.country} className="h-14" width="w320" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-accent-bright">
                  Next Race · Round {next.round}
                </span>
              </div>
              <h1 className="mt-5 font-display text-5xl font-bold uppercase leading-[0.88] tracking-wide text-white sm:text-7xl">
                {lead}
                {hasGP && (
                  <>
                    <br />
                    <span className="text-4xl text-zinc-500 sm:text-6xl">Grand Prix</span>
                  </>
                )}
              </h1>
              <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-zinc-600" />
                  {next.Circuit.circuitName}, {next.Circuit.Location.country}
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono text-zinc-300">
                  <CalendarClock size={14} className="text-zinc-600" />
                  {formatIST(raceStart(next).toISOString())}
                </span>
              </p>
            </div>
            <div className="flex gap-5 sm:gap-8">
              <Unit v={dd} label="Days" />
              <Unit v={hh} label="Hrs" />
              <Unit v={mm} label="Min" />
              <Unit v={ss} label="Sec" />
            </div>
          </div>
        </section>
      )}

      {/* Last race podium — staggered */}
      {podiumOrder.length === 3 && (
        <section>
          <SectionHead title="Last Race Podium" to="/results" cta="Full result" />
          <div className="grid grid-cols-3 items-end gap-3 sm:gap-4">
            {podiumOrder.map((r) => {
              const d = driverMap.get(r.driver_number);
              const p = r.position ?? 1;
              const isP1 = p === 1;
              const color = `#${d?.team_colour || '888'}`;
              return (
                <div
                  key={r.driver_number}
                  className={`card relative overflow-hidden text-center ${isP1 ? '' : 'mt-6 sm:mt-10'}`}
                  style={{ borderTop: `3px solid ${MEDAL[p - 1]}` }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.08]"
                    style={{ background: `radial-gradient(120% 80% at 50% 100%, ${color}, transparent 70%)` }}
                  />
                  <div className="relative pt-4">
                    <div className="font-display text-4xl font-bold leading-none sm:text-5xl" style={{ color: MEDAL[p - 1] }}>
                      P{p}
                    </div>
                    {d?.headshot_url && (
                      <img
                        src={hdPhoto(d.headshot_url, '4col-retina')}
                        alt={d.full_name}
                        loading="lazy"
                        className={`mx-auto object-contain ${isP1 ? 'h-32 sm:h-44' : 'h-24 sm:h-32'}`}
                      />
                    )}
                    <div className="px-3 pb-4">
                      <div className="truncate font-display text-lg font-bold uppercase text-white sm:text-xl">
                        {d?.last_name ?? `#${r.driver_number}`}
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
                        {d?.team_name && (
                          <img src={teamLogo(d.team_name)} alt="" className="h-3.5 w-auto max-w-[20px] object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        )}
                        <span className="truncate">{d?.team_name}</span>
                      </div>
                      <div className="mt-1 font-mono text-sm font-semibold text-white">{r.points ?? 0} pts</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Championship — points bars */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <SectionHead title="Drivers' Championship" to="/standings" cta="All" />
          <div className="card p-5">
            {topDrivers.map((s) => (
              <Bar
                key={s.Driver.driverId}
                pos={s.position}
                label={`${s.Driver.familyName}`}
                points={s.points}
                color={teamColor(s.Constructors[0]?.name)}
                max={maxD}
              />
            ))}
          </div>
        </section>
        <section>
          <SectionHead title="Constructors' Championship" to="/standings" cta="All" />
          <div className="card p-5">
            {topTeams.map((s) => (
              <Bar
                key={s.Constructor.constructorId}
                pos={s.position}
                label={s.Constructor.name}
                logo={teamLogo(s.Constructor.name)}
                points={s.points}
                color={teamColor(s.Constructor.name)}
                max={maxT}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
