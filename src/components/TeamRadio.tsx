import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { Radio } from 'lucide-react';
import { api } from '../lib/api';
import { formatISTDate, formatISTTime } from '../lib/format';
import type { Session, TeamRadioMessage } from '../lib/types';
import { PageHeader, StateMsg } from './ui';
import SessionBanner from './SessionBanner';

function TeamRadio() {
  const [selectedSessionKey, setSelectedSessionKey] = useState<number | null>(null);
  const [filterDriver, setFilterDriver] = useState('');

  const { data: sessions, isLoading: loadingSessions } = useQuery<Session[]>('sessions', () =>
    api.getSessions()
  );

  const recentSessions = useMemo(
    () =>
      Array.isArray(sessions)
        ? [...sessions].sort(
            (a, b) => new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
          )
        : [],
    [sessions]
  );

  const {
    data: radioMessages,
    isLoading: loadingRadio,
    isError: radioError,
  } = useQuery<TeamRadioMessage[]>(
    ['teamRadio', selectedSessionKey],
    () => api.getTeamRadio(selectedSessionKey as number),
    { enabled: !!selectedSessionKey }
  );

  const messages = useMemo(() => {
    // OpenF1 team_radio only carries date, driver_number, recording_url (no transcript).
    return Array.isArray(radioMessages)
      ? [...radioMessages]
          .filter((m) => !filterDriver || m.driver_number.toString().includes(filterDriver))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [];
  }, [radioMessages, filterDriver]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Team Radio"
        subtitle="Driver-to-pit audio for a chosen session. Timestamps in IST."
      />

      {/* Session picker */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="min-w-[16rem] rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 outline-none transition-colors hover:border-white/[0.16] focus:border-accent/50"
          onChange={(e) => setSelectedSessionKey(Number(e.target.value))}
          defaultValue=""
          disabled={loadingSessions}
        >
          <option value="" disabled>
            {loadingSessions ? 'Loading sessions…' : 'Choose a session'}
          </option>
          {recentSessions.map((s) => (
            <option key={s.session_key} value={s.session_key}>
              {s.country_name} · {s.session_name} — {formatISTDate(s.date_start)}
            </option>
          ))}
        </select>

        {selectedSessionKey && (
          <input
            type="text"
            value={filterDriver}
            onChange={(e) => setFilterDriver(e.target.value)}
            placeholder="Filter by driver #"
            className="w-40 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-600 hover:border-white/[0.16] focus:border-accent/50"
          />
        )}
      </div>

      {selectedSessionKey && <SessionBanner sessionKey={selectedSessionKey} />}

      {!selectedSessionKey && <StateMsg>Pick a session to hear its team radio.</StateMsg>}

      {selectedSessionKey && loadingRadio && <StateMsg>Loading team radio…</StateMsg>}
      {selectedSessionKey && radioError && <StateMsg kind="error">Failed to load team radio.</StateMsg>}
      {selectedSessionKey && !loadingRadio && !radioError && messages.length === 0 && (
        <StateMsg>No team radio available for this session.</StateMsg>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2">
        {messages.map((m) => (
          <div
            key={`${m.driver_number}-${m.date}`}
            className="card card-hover flex items-center gap-4 px-4 py-3"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/12 font-mono text-sm font-semibold text-accent-soft">
              {m.driver_number}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                <Radio size={13} className="text-zinc-600" />
                Driver #{m.driver_number}
              </div>
              <div className="font-mono text-xs text-zinc-500">{formatISTTime(m.date)}</div>
            </div>
            {m.recording_url && (
              <audio controls preload="none" className="h-8 w-44 max-w-[45%]">
                <source src={m.recording_url} type="audio/mp3" />
              </audio>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamRadio;
