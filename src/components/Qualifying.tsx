import { useQuery } from 'react-query';
import { api } from '../lib/api';
import type { QualifyingRace } from '../lib/types';
import { PageHeader, StateMsg } from './ui';

const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500';
const td = 'px-4 py-3';

function Qualifying({ embedded = false }: { embedded?: boolean }) {
  const { data, isLoading, isError } = useQuery<QualifyingRace>('qualifying', () =>
    api.getQualifying()
  );

  const rows = data?.QualifyingResults ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {!embedded && (
        <PageHeader
          title="Qualifying"
          subtitle={
            data?.raceName
              ? `${data.raceName}${data.round ? ` · round ${data.round}` : ''} — Q1 / Q2 / Q3`
              : 'Latest weekend — Q1 / Q2 / Q3'
          }
        />
      )}

      {isLoading && <StateMsg>Loading qualifying…</StateMsg>}
      {isError && <StateMsg kind="error">Failed to load qualifying.</StateMsg>}
      {!isLoading && !isError && rows.length === 0 && (
        <StateMsg>No qualifying data available.</StateMsg>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-white/[0.08]">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02]">
              <tr>
                <th className={th}>Pos</th>
                <th className={th}>Driver</th>
                <th className={th}>Team</th>
                <th className={`${th} text-right`}>Q1</th>
                <th className={`${th} text-right`}>Q2</th>
                <th className={`${th} text-right`}>Q3</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const pole = r.position === '1';
                return (
                  <tr
                    key={r.Driver.driverId}
                    className={`border-t border-white/[0.05] hover:bg-white/[0.02] ${
                      pole ? 'bg-accent/[0.06]' : ''
                    }`}
                  >
                    <td className={`${td} font-mono font-semibold ${pole ? 'text-accent-soft' : 'text-white'}`}>
                      {r.position}
                    </td>
                    <td className={`${td} font-medium text-white`}>
                      {r.Driver.givenName} {r.Driver.familyName}
                      <span className="ml-2 font-mono text-xs text-zinc-600">{r.Driver.code}</span>
                    </td>
                    <td className={`${td} text-zinc-400`}>{r.Constructor.name}</td>
                    <td className={`${td} text-right font-mono text-zinc-400`}>{r.Q1 || '—'}</td>
                    <td className={`${td} text-right font-mono text-zinc-400`}>{r.Q2 || '—'}</td>
                    <td className={`${td} text-right font-mono ${pole ? 'font-semibold text-accent-soft' : 'text-white'}`}>
                      {r.Q3 || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Qualifying;
