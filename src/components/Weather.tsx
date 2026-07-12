import { useQuery } from 'react-query';
import { Droplets, Wind, Thermometer, Umbrella, Gauge, Navigation } from 'lucide-react';
import { api } from '../lib/api';
import { formatISTTime, compass } from '../lib/format';
import type { Weather as WeatherSample } from '../lib/types';
import { PageHeader, StateMsg } from './ui';
import SessionBanner from './SessionBanner';

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

function Weather() {
  const { data: weather, isLoading, isError } = useQuery<WeatherSample[]>(
    'weather',
    () => api.getWeather(),
    { staleTime: 5 * 60 * 1000 }
  );

  // Show the most recent samples first (weather is one reading per minute).
  const samples = Array.isArray(weather)
    ? [...weather].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  const latest = samples[0];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Track Weather"
        subtitle="Live trackside conditions for the session below — readings shown in IST."
      />
      <SessionBanner />

      {isLoading && <StateMsg>Loading weather…</StateMsg>}
      {isError && <StateMsg kind="error">Failed to load weather data.</StateMsg>}
      {!isLoading && !isError && samples.length === 0 && (
        <StateMsg>No weather data for this session.</StateMsg>
      )}

      {latest && (
        <>
          {/* Headline current conditions */}
          <div className="card p-6">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium text-zinc-400">Current conditions</h2>
              <span className="font-mono text-xs text-zinc-500">
                as of {formatISTTime(latest.date)}
              </span>
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

          {/* Recent timeline */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-zinc-400">
              Recent readings <span className="text-zinc-600">(newest first, IST)</span>
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.02] text-left text-[11px] uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Time</th>
                    <th className="px-4 py-2.5 text-right font-medium">Air °C</th>
                    <th className="px-4 py-2.5 text-right font-medium">Track °C</th>
                    <th className="px-4 py-2.5 text-right font-medium">Wind</th>
                    <th className="px-4 py-2.5 text-right font-medium">Humidity</th>
                    <th className="px-4 py-2.5 text-right font-medium">Rain</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-zinc-300">
                  {samples.slice(0, 30).map((s, i) => (
                    <tr key={`${s.date}-${i}`} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                      <td className="px-4 py-2 text-zinc-400">{formatISTTime(s.date)}</td>
                      <td className="px-4 py-2 text-right">{s.air_temperature ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{s.track_temperature ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{s.wind_speed ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{s.humidity ?? '—'}%</td>
                      <td className="px-4 py-2 text-right">{s.rainfall ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Weather;
