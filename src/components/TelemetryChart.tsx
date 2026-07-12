import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface TelemetryPoint {
  time: string;
  speed: number;
  rpm: number;
}

// Isolated so recharts lands in its own lazily-loaded chunk instead of the
// Dashboard route chunk.
export default function TelemetryChart({ data }: { data: TelemetryPoint[] }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="time" stroke="#52525b" tick={false} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} />
        {/* Speed and RPM live on very different scales, so give each its own axis
            and colour the ticks to match its line. */}
        <YAxis
          yAxisId="speed"
          stroke="#ff2b20"
          tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#ff2b20' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <YAxis
          yAxisId="rpm"
          orientation="right"
          stroke="#38bdf8"
          tick={{ fontSize: 11, fontFamily: 'JetBrains Mono', fill: '#38bdf8' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0f0f12',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontFamily: 'JetBrains Mono',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#a1a1aa' }}
        />
        <Legend wrapperStyle={{ fontFamily: 'Titillium Web, sans-serif', fontSize: '12px' }} />
        <Line yAxisId="speed" type="monotone" dataKey="speed" stroke="#ff2b20" strokeWidth={2} dot={false} isAnimationActive={false} name="Speed (km/h)" />
        <Line yAxisId="rpm" type="monotone" dataKey="rpm" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} name="RPM" />
      </LineChart>
    </ResponsiveContainer>
  );
}
