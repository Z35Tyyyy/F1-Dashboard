import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import { Activity, Flag, Timer, Users, Thermometer, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';
import { formatISTTime, formatLap } from '../lib/format';
import type { CarData, Driver, DriverStats, RaceControlMessage, Weather } from '../lib/types';
import { PageHeader, StateMsg, Stat } from './ui';
import SessionBanner from './SessionBanner';

const TelemetryChart = lazy(() => import('./TelemetryChart'));

// Dot colour for a race-control flag/category.
function flagColor(msg: RaceControlMessage): string {
  const flag = (msg.flag || '').toUpperCase();
  if (flag.includes('GREEN') || flag === 'CLEAR') return 'bg-emerald-400';
  if (flag.includes('YELLOW')) return 'bg-amber-400';
  if (flag === 'RED') return 'bg-red-500';
  if (flag === 'BLUE') return 'bg-sky-400';
  if (flag === 'CHEQUERED') return 'bg-zinc-100';
  if (msg.category === 'SafetyCar') return 'bg-orange-400';
  return 'bg-zinc-500';
}

function Dashboard() {
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);

  const { data: drivers } = useQuery<Driver[]>('drivers', () => api.getDrivers());

  useEffect(() => {
    if (selectedDriver == null && Array.isArray(drivers) && drivers.length > 0) {
      setSelectedDriver(drivers[0].driver_number);
    }
  }, [drivers, selectedDriver]);

  const {
    data: carData,
    isLoading: loadingTelemetry,
    isError: telemetryError,
  } = useQuery<CarData[]>(
    ['carData', selectedDriver],
    () => api.getCarData(undefined, selectedDriver as number),
    { enabled: selectedDriver != null }
  );

  const telemetry = useMemo(() => {
    if (!Array.isArray(carData)) return [];
    return carData.map((d) => ({
      time: formatISTTime(d.date),
      speed: d.speed,
      rpm: d.rpm,
    }));
  }, [carData]);

  const { data: raceControl, isLoading: loadingRC, isError: rcError } = useQuery<
    RaceControlMessage[]
  >('raceControl', () => api.getRaceControl(), { staleTime: 60 * 1000 });

  const { data: driverStats } = useQuery<Record<string, DriverStats>>('driverStats', () =>
    api.getDriverStats()
  );
  const { data: weather } = useQuery<Weather[]>('weather', () => api.getWeather());

  // Session-wide highlights for the pulse strip.
  const fastest = useMemo(() => {
    if (!driverStats) return null;
    let best: DriverStats | null = null;
    for (const s of Object.values(driverStats)) {
      if (s.best_lap != null && (best == null || s.best_lap < best.best_lap!)) best = s;
    }
    if (!best) return null;
    const drv = Array.isArray(drivers)
      ? drivers.find((d) => d.driver_number === best!.driver_number)
      : undefined;
    return { lap: best.best_lap!, who: drv?.name_acronym ?? `#${best.driver_number}` };
  }, [driverStats, drivers]);

  const latestWeather = useMemo(
    () =>
      Array.isArray(weather)
        ? [...weather].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        : undefined,
    [weather]
  );

  const recentMessages = useMemo(() => {
    if (!Array.isArray(raceControl)) return [];
    return [...raceControl]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [raceControl]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Live Race Dashboard" subtitle="Telemetry and race control for the latest session." />
      <SessionBanner />

      {/* Session pulse */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Fastest lap"
          icon={<Timer size={13} />}
          accent
          value={
            fastest ? (
              <span>
                {formatLap(fastest.lap)}{' '}
                <span className="text-xs text-zinc-500">{fastest.who}</span>
              </span>
            ) : (
              '—'
            )
          }
        />
        <Stat
          label="Cars"
          icon={<Users size={13} />}
          value={Array.isArray(drivers) ? drivers.length : '—'}
        />
        <Stat
          label="Race control"
          icon={<MessageSquare size={13} />}
          value={Array.isArray(raceControl) ? `${raceControl.length} msgs` : '—'}
        />
        <Stat
          label="Track temp"
          icon={<Thermometer size={13} />}
          value={latestWeather ? `${latestWeather.track_temperature}°C` : '—'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Telemetry */}
        <div className="card min-w-0 p-5 lg:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-accent-soft" />
              <div>
                <h2 className="text-sm font-medium text-white">Car Telemetry</h2>
                <p className="text-xs text-zinc-500">Speed &amp; RPM, thinned to ~200 samples</p>
              </div>
            </div>
            <select
              value={selectedDriver ?? ''}
              onChange={(e) => setSelectedDriver(Number(e.target.value))}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-xs text-zinc-200 outline-none hover:border-white/[0.16] focus:border-accent/50"
            >
              {Array.isArray(drivers) &&
                drivers.map((d) => (
                  <option key={d.driver_number} value={d.driver_number}>
                    #{d.driver_number} {d.name_acronym}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-4 h-[300px] w-full">
            {loadingTelemetry && <StateMsg>Loading telemetry…</StateMsg>}
            {telemetryError && <StateMsg kind="error">Failed to load telemetry.</StateMsg>}
            {!loadingTelemetry && !telemetryError && telemetry.length === 0 && (
              <StateMsg>No telemetry for this driver.</StateMsg>
            )}
            {telemetry.length > 0 && (
              <Suspense fallback={<StateMsg>Rendering chart…</StateMsg>}>
                <TelemetryChart data={telemetry} />
              </Suspense>
            )}
          </div>
        </div>

        {/* Race control */}
        <div className="card min-w-0 p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-accent-soft" />
            <div>
              <h2 className="text-sm font-medium text-white">Race Control</h2>
              <p className="text-xs text-zinc-500">Flags &amp; messages · IST</p>
            </div>
          </div>

          <div className="mt-4 max-h-[300px] space-y-3 overflow-y-auto pr-1">
            {loadingRC && <StateMsg>Loading race control…</StateMsg>}
            {rcError && <StateMsg kind="error">Failed to load race control.</StateMsg>}
            {!loadingRC && !rcError && recentMessages.length === 0 && (
              <StateMsg>No race control messages.</StateMsg>
            )}
            {recentMessages.map((msg, i) => (
              <div key={`${msg.date}-${i}`} className="flex gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${flagColor(msg)}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-300">
                      {msg.flag ? `${msg.flag} flag` : msg.category === 'Other' ? 'Note' : msg.category}
                      {msg.driver_number ? ` · Car ${msg.driver_number}` : ''}
                    </span>
                    <span className="font-mono text-[11px] text-zinc-600">
                      {formatISTTime(msg.date)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
