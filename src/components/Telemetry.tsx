import { lazy, Suspense, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Activity, Flag } from 'lucide-react';
import { api } from '../lib/api';
import { formatISTTime } from '../lib/format';
import type { CarData, RaceControlMessage } from '../lib/types';
import { StateMsg } from './ui';

const TelemetryChart = lazy(() => import('./TelemetryChart'));

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

export default function Telemetry({
  sessionKey,
  driverNumber,
}: {
  sessionKey?: number;
  driverNumber?: number;
}) {
  const {
    data: carData,
    isLoading: loadingTelemetry,
    isError: telemetryError,
  } = useQuery<CarData[]>(
    ['carData', sessionKey, driverNumber],
    () => api.getCarData(sessionKey, driverNumber),
    { enabled: driverNumber != null }
  );

  const telemetry = useMemo(() => {
    if (!Array.isArray(carData)) return [];
    return carData.map((d) => ({ time: formatISTTime(d.date), speed: d.speed, rpm: d.rpm }));
  }, [carData]);

  const { data: raceControl, isLoading: loadingRC, isError: rcError } = useQuery<
    RaceControlMessage[]
  >(['raceControl', sessionKey], () => api.getRaceControl(sessionKey), { staleTime: 60 * 1000 });

  const recentMessages = useMemo(() => {
    if (!Array.isArray(raceControl)) return [];
    return [...raceControl]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
  }, [raceControl]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="card min-w-0 p-5 lg:col-span-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-accent-bright" />
          <div>
            <h2 className="font-display text-base font-semibold uppercase tracking-wide text-white">
              Car Telemetry
            </h2>
            <p className="text-xs text-zinc-500">Speed &amp; RPM, thinned to ~200 samples</p>
          </div>
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

      <div className="card min-w-0 p-5 lg:col-span-2">
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-accent-bright" />
          <div>
            <h2 className="font-display text-base font-semibold uppercase tracking-wide text-white">
              Race Control
            </h2>
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
                  <span className="text-xs font-semibold text-zinc-300">
                    {msg.flag ? `${msg.flag} flag` : msg.category === 'Other' ? 'Note' : msg.category}
                    {msg.driver_number ? ` · Car ${msg.driver_number}` : ''}
                  </span>
                  <span className="font-mono text-[11px] text-zinc-600">{formatISTTime(msg.date)}</span>
                </div>
                <p className="text-sm text-zinc-400">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
