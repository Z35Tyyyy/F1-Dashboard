import { useState } from 'react';
import { useQuery } from 'react-query';
import { api } from '../lib/api';
import type {
  ConstructorStandingsList,
  DriverStandingsList,
  FormResult,
} from '../lib/types';
import { PageHeader, StateMsg } from './ui';

type Tab = 'drivers' | 'constructors';

// Colour a form chip by finishing position (non-numeric = DNF/retired).
function chipClass(pos: string): string {
  const n = Number(pos);
  if (pos === '1') return 'bg-amber-400/90 text-black';
  if (n === 2 || n === 3) return 'bg-zinc-300 text-black';
  if (!Number.isNaN(n) && n <= 10) return 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30';
  if (Number.isNaN(n)) return 'bg-red-500/25 text-red-300 border border-red-500/30';
  return 'bg-white/[0.05] text-zinc-400 border border-white/10';
}

function FormChips({ results }: { results?: FormResult[] }) {
  if (!results || results.length === 0) return <span className="text-zinc-600">—</span>;
  return (
    <div className="flex gap-1">
      {results.map((r) => (
        <span
          key={r.round}
          title={`Round ${r.round}: P${r.position}`}
          className={`inline-flex h-6 w-6 items-center justify-center rounded-md font-mono text-[11px] font-medium ${chipClass(
            r.position
          )}`}
        >
          {r.position}
        </span>
      ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? 'bg-white/[0.08] text-white' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}

const th = 'px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500';
const td = 'px-4 py-3';

function Standings() {
  const [tab, setTab] = useState<Tab>('drivers');

  const drivers = useQuery<DriverStandingsList>('driverStandings', () => api.getDriverStandings());
  const constructors = useQuery<ConstructorStandingsList>('constructorStandings', () =>
    api.getConstructorStandings()
  );
  const form = useQuery<Record<string, FormResult[]>>('driverForm', () => api.getForm(5));

  const active = tab === 'drivers' ? drivers : constructors;
  const season = active.data?.season;
  const round = active.data?.round;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Championship Standings"
        subtitle={season ? `${season} season · after round ${round}` : 'Current season'}
        right={
          <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            <TabButton active={tab === 'drivers'} onClick={() => setTab('drivers')}>
              Drivers
            </TabButton>
            <TabButton active={tab === 'constructors'} onClick={() => setTab('constructors')}>
              Constructors
            </TabButton>
          </div>
        }
      />

      {active.isLoading && <StateMsg>Loading standings…</StateMsg>}
      {active.isError && <StateMsg kind="error">Failed to load standings.</StateMsg>}

      {tab === 'drivers' && Array.isArray(drivers.data?.DriverStandings) && (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Driver</th>
                <th className={th}>Team</th>
                <th className={th}>Form (last 5)</th>
                <th className={`${th} text-right`}>Wins</th>
                <th className={`${th} text-right`}>Points</th>
              </tr>
            </thead>
            <tbody>
              {drivers.data!.DriverStandings!.map((s) => (
                <tr key={s.Driver.driverId} className="border-t border-white/[0.05] hover:bg-white/[0.02]">
                  <td className={`${td} font-mono text-zinc-500`}>{s.position}</td>
                  <td className={`${td} font-medium text-white`}>
                    {s.Driver.givenName} {s.Driver.familyName}
                    <span className="ml-2 font-mono text-xs text-zinc-600">{s.Driver.code}</span>
                  </td>
                  <td className={`${td} text-zinc-400`}>{s.Constructors[0]?.name ?? '—'}</td>
                  <td className={td}>
                    <FormChips results={form.data?.[s.Driver.driverId]} />
                  </td>
                  <td className={`${td} text-right font-mono text-zinc-400`}>{s.wins}</td>
                  <td className={`${td} text-right font-mono font-semibold text-white`}>{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'constructors' && Array.isArray(constructors.data?.ConstructorStandings) && (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07]">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className={th}>#</th>
                <th className={th}>Constructor</th>
                <th className={th}>Nationality</th>
                <th className={`${th} text-right`}>Wins</th>
                <th className={`${th} text-right`}>Points</th>
              </tr>
            </thead>
            <tbody>
              {constructors.data!.ConstructorStandings!.map((s) => (
                <tr
                  key={s.Constructor.constructorId}
                  className="border-t border-white/[0.05] hover:bg-white/[0.02]"
                >
                  <td className={`${td} font-mono text-zinc-500`}>{s.position}</td>
                  <td className={`${td} font-medium text-white`}>{s.Constructor.name}</td>
                  <td className={`${td} text-zinc-400`}>{s.Constructor.nationality}</td>
                  <td className={`${td} text-right font-mono text-zinc-400`}>{s.wins}</td>
                  <td className={`${td} text-right font-mono font-semibold text-white`}>{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Standings;
