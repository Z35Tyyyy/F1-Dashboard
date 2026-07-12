import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { MapPin, Clock, Flag } from 'lucide-react';
import { api } from '../lib/api';
import { formatIST, formatISTTime } from '../lib/format';
import type { Session } from '../lib/types';
import { PageHeader, StateMsg } from './ui';

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 outline-none transition-colors hover:border-white/[0.16] focus:border-accent/50"
    >
      {children}
    </select>
  );
}

function Sessions() {
  const { data, isLoading, isError } = useQuery<Session[]>('sessions', () => api.getSessions());

  const sessions: Session[] = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const filteredSessions = useMemo(() => {
    return [...sessions]
      .filter(
        (s) =>
          (!selectedCountry || s.country_name === selectedCountry) &&
          (!selectedType || s.session_type === selectedType) &&
          (!selectedYear || s.year.toString() === selectedYear)
      )
      .sort((a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime())
      .slice(0, 30);
  }, [sessions, selectedCountry, selectedType, selectedYear]);

  const countryOptions = [...new Set(sessions.map((s) => s.country_name))].sort();
  const typeOptions = [...new Set(sessions.map((s) => s.session_type))].sort();
  const yearOptions = [...new Set(sessions.map((s) => s.year.toString()))].sort((a, b) => +b - +a);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Race Sessions"
        subtitle="Practice, qualifying and races — dates and times in IST. Showing the 30 most recent matches."
        right={
          !isLoading && (
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCountry} onChange={setSelectedCountry}>
                <option value="">All countries</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              <Select value={selectedType} onChange={setSelectedType}>
                <option value="">All types</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
              <Select value={selectedYear} onChange={setSelectedYear}>
                <option value="">All years</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          )
        }
      />

      {isLoading && <StateMsg>Loading sessions…</StateMsg>}
      {isError && <StateMsg kind="error">Failed to load sessions.</StateMsg>}

      <div className="space-y-2.5">
        {filteredSessions.map((s) => (
          <div
            key={s.session_key}
            className="card card-hover flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4"
          >
            <div className="flex min-w-[13rem] items-center gap-3">
              <span
                className={`grid h-9 w-9 place-items-center rounded-lg bg-white/[0.04] ${
                  s.session_type === 'Race'
                    ? 'text-accent-soft'
                    : s.session_type === 'Qualifying'
                    ? 'text-amber-400'
                    : 'text-zinc-500'
                }`}
              >
                <Flag size={16} />
              </span>
              <div>
                <div className="font-medium text-white">{s.session_name}</div>
                <div className="text-xs text-zinc-500">
                  {s.country_name} · {s.year}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-zinc-400">
              <MapPin size={14} className="text-zinc-600" />
              {s.circuit_short_name}
              {s.location && s.location !== s.circuit_short_name ? `, ${s.location}` : ''}
            </div>

            <span className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-0.5 text-xs text-zinc-400">
              {s.session_type}
            </span>

            <div className="ml-auto text-right">
              <div className="flex items-center gap-1.5 font-mono text-sm text-zinc-200">
                <Clock size={13} className="text-zinc-600" />
                {formatIST(s.date_start)}
              </div>
              <div className="mt-0.5 font-mono text-xs text-zinc-500">
                ends {formatISTTime(s.date_end)}
              </div>
            </div>
          </div>
        ))}

        {!isLoading && !isError && filteredSessions.length === 0 && (
          <StateMsg>No sessions match these filters.</StateMsg>
        )}
      </div>
    </div>
  );
}

export default Sessions;
