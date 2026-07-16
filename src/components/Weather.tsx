import { lazy, Suspense, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Droplets, Wind, Thermometer, Umbrella, Gauge, Navigation } from 'lucide-react';
import { api } from '../lib/api';
import { formatISTTime, compass } from '../lib/format';
import type { Weather as WeatherSample } from '../lib/types';
import { PageHeader, StateMsg } from './ui';
import SessionBanner from './SessionBanner';

const WeatherCharts = lazy(() => import('./WeatherCharts'));

function Metric({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null | undefined;
  unit: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] ${tone}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
        <div className="font-mono text-sm text-zinc-100">
          {value ?? '—'}
          <span className="text-zinc-500"> {unit}</span>
        </div>
      </div>
    </div>
  );
}

function Weather({ sessionKey, embedded = false }: { sessionKey?: number; embedded?: boolean }) {
  const { data: weather, isLoading, isError } = useQuery<WeatherSample[]>(
    ['weather', sessionKey ?? 'latest'],
    () => api.getWeather(sessionKey),
    { staleTime: 5 * 60 * 1000 }
  );

  // Chronological for the charts; the newest sample drives "current conditions".
  const series = useMemo(
    () =>
      Array.isArray(weather)
        ? [...weather].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : [],
    [weather]
  );
  const latest = series[series.length - 1];

  const chartData = useMemo(
    () =>
      series.map((s) => ({
        time: formatISTTime(s.date),
        air: s.air_temperature ?? null,
        track: s.track_temperature ?? null,
        humidity: s.humidity ?? null,
        wind: s.wind_speed ?? null,
        pressure: s.pressure ?? null,
      })),
    [series]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {!embedded && (
        <>
          <PageHeader
            title="Track Weather"
            subtitle="Trackside conditions across the session — readings in IST."
          />
          <SessionBanner sessionKey={sessionKey} />
        </>
      )}

      {isLoading && <StateMsg>Loading weather…</StateMsg>}
      {isError && <StateMsg kind="error">Failed to load weather data.</StateMsg>}
      {!isLoading && !isError && series.length === 0 && (
        <StateMsg>No weather data for this session.</StateMsg>
      )}

      {latest && (
        <>
          <div className="card p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-zinc-300">
                Current conditions
              </h2>
              <span className="font-mono text-xs text-zinc-500">as of {formatISTTime(latest.date)}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              <Metric icon={<Thermometer size={17} />} label="Air" value={latest.air_temperature} unit="°C" tone="text-amber-400" />
              <Metric icon={<Thermometer size={17} />} label="Track" value={latest.track_temperature} unit="°C" tone="text-orange-400" />
              <Metric icon={<Wind size={17} />} label="Wind" value={latest.wind_speed} unit="km/h" tone="text-emerald-400" />
              <Metric icon={<Droplets size={17} />} label="Humidity" value={latest.humidity} unit="%" tone="text-sky-400" />
              <Metric icon={<Gauge size={17} />} label="Pressure" value={latest.pressure} unit="hPa" tone="text-violet-400" />
              <Metric icon={<Umbrella size={17} />} label="Rainfall" value={latest.rainfall} unit="mm" tone="text-blue-400" />
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
              <Navigation size={13} />
              Wind direction {latest.wind_direction ?? '—'}°
              {latest.wind_direction != null && ` (${compass(latest.wind_direction)})`}
            </div>
          </div>

          {chartData.length > 1 && (
            <Suspense fallback={<StateMsg>Rendering charts…</StateMsg>}>
              <WeatherCharts data={chartData} />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}

export default Weather;
