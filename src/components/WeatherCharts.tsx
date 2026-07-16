import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface WxPoint {
  time: string;
  air: number | null;
  track: number | null;
  humidity: number | null;
  wind: number | null;
  pressure: number | null;
}

const tip = {
  backgroundColor: '#0f0f12',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  fontFamily: 'JetBrains Mono',
  fontSize: '12px',
};
const legend = { fontFamily: 'Saira, sans-serif', fontSize: '12px' };
const axisTick = (fill: string) => ({ fontSize: 11, fontFamily: 'JetBrains Mono', fill });

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-white">
        {title}
      </h3>
      <div className="h-[240px] w-full">{children}</div>
    </div>
  );
}

// Time-series view of a session's weather so trends (heating track, gusts,
// humidity swings) can be read at a glance.
export default function WeatherCharts({ data }: { data: WxPoint[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel title="Track & Air Temperature (°C)">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="time" stroke="#52525b" tick={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
            <YAxis stroke="#52525b" tick={axisTick('#71717a')} axisLine={false} tickLine={false} width={34} />
            <Tooltip contentStyle={tip} labelStyle={{ color: '#a1a1aa' }} />
            <Legend wrapperStyle={legend} />
            <Line type="monotone" dataKey="track" name="Track" stroke="#fb923c" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="air" name="Air" stroke="#fbbf24" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Humidity & Wind">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="time" stroke="#52525b" tick={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
            <YAxis yAxisId="h" stroke="#38bdf8" tick={axisTick('#38bdf8')} axisLine={false} tickLine={false} width={34} />
            <YAxis yAxisId="w" orientation="right" stroke="#34d399" tick={axisTick('#34d399')} axisLine={false} tickLine={false} width={34} />
            <Tooltip contentStyle={tip} labelStyle={{ color: '#a1a1aa' }} />
            <Legend wrapperStyle={legend} />
            <Line yAxisId="h" type="monotone" dataKey="humidity" name="Humidity %" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line yAxisId="w" type="monotone" dataKey="wind" name="Wind km/h" stroke="#34d399" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
