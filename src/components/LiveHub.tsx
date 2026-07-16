import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Activity, MapPin, Radio as RadioIcon, CloudSun } from 'lucide-react';
import { api } from '../lib/api';
import { formatIST } from '../lib/format';
import type { Driver, Session, SessionContext } from '../lib/types';
import { PageHeader, Tabs, CountryFlag } from './ui';
import Telemetry from './Telemetry';
import TrackMap from './TrackMap';
import TeamRadio from './TeamRadio';
import Weather from './Weather';

type Tab = 'telemetry' | 'map' | 'radio' | 'weather';

const selectCls =
  'rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1.5 font-mono text-xs text-zinc-200 outline-none hover:border-white/[0.2] focus:border-accent/60';

export default function LiveHub() {
  const [tab, setTab] = useState<Tab>('telemetry');
  const [session, setSession] = useState<number | null>(null);
  const [driver, setDriver] = useState<number | null>(null);

  // One shared GP picker — completed races only (future ones have no telemetry).
  const { data: sessions } = useQuery<Session[]>('sessions', () => api.getSessions());
  const gpOptions = useMemo(() => {
    const now = Date.now();
    return Array.isArray(sessions)
      ? [...sessions]
          .filter((s) => s.session_type === 'Race' && new Date(s.date_start).getTime() <= now)
          .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())
      : [];
  }, [sessions]);
  useEffect(() => {
    if (session == null && gpOptions.length) setSession(gpOptions[0].session_key);
  }, [gpOptions, session]);

  // Drivers for the chosen GP; reset to the first when the roster changes.
  const { data: drivers } = useQuery<Driver[]>(
    ['liveDrivers', session],
    () => api.getDrivers(session as number),
    { enabled: session != null }
  );
  useEffect(() => {
    if (Array.isArray(drivers) && drivers.length) setDriver(drivers[0].driver_number);
  }, [drivers]);

  const { data: ctx } = useQuery<SessionContext>(
    ['sessionContext', session],
    () => api.getSessionContext(session as number),
    { enabled: session != null, staleTime: 5 * 60 * 1000 }
  );

  const selected = gpOptions.find((s) => s.session_key === session);
  const raceName = ctx?.meeting_name || (selected ? `${selected.country_name} Grand Prix` : '—');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Live"
        subtitle="Pick a Grand Prix and driver — telemetry, track map, radio and weather all follow it."
      />

      {/* Single selection card driving every tab */}
      <div className="card flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <CountryFlag country={selected?.country_name} className="h-9" width="w320" />
          <div>
            <div className="font-display text-lg font-bold uppercase leading-none tracking-wide text-white">
              {raceName}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {selected ? `${selected.circuit_short_name}, ${selected.country_name}` : ''}
              {selected ? ` · ${formatIST(selected.date_start)}` : ''}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            GP
            <select value={session ?? ''} onChange={(e) => setSession(Number(e.target.value))} className={selectCls}>
              {gpOptions.map((s) => (
                <option key={s.session_key} value={s.session_key}>
                  {s.circuit_short_name} {s.year}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Driver
            <select value={driver ?? ''} onChange={(e) => setDriver(Number(e.target.value))} className={selectCls}>
              {Array.isArray(drivers) &&
                drivers.map((d) => (
                  <option key={d.driver_number} value={d.driver_number}>
                    #{d.driver_number} {d.name_acronym}
                  </option>
                ))}
            </select>
          </label>
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'telemetry', label: 'Telemetry', icon: <Activity size={15} /> },
          { id: 'map', label: 'Track Map', icon: <MapPin size={15} /> },
          { id: 'radio', label: 'Radio', icon: <RadioIcon size={15} /> },
          { id: 'weather', label: 'Weather', icon: <CloudSun size={15} /> },
        ]}
      />

      <div className="pt-1">
        {tab === 'telemetry' && <Telemetry sessionKey={session ?? undefined} driverNumber={driver ?? undefined} />}
        {tab === 'map' && <TrackMap sessionKey={session ?? undefined} driverNumber={driver ?? undefined} />}
        {tab === 'radio' && <TeamRadio sessionKey={session ?? undefined} embedded />}
        {tab === 'weather' && <Weather sessionKey={session ?? undefined} embedded />}
      </div>
    </div>
  );
}
