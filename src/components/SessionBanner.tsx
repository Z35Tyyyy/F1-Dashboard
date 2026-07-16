import { useQuery } from 'react-query';
import { MapPin, CalendarClock } from 'lucide-react';
import { api } from '../lib/api';
import { formatIST } from '../lib/format';
import type { SessionContext } from '../lib/types';
import { CountryFlag } from './ui';

// Descriptive context strip: which race + session we're looking at, where, and when (IST).
// Pass a sessionKey to describe a specific session; omit for the latest one.
export default function SessionBanner({ sessionKey }: { sessionKey?: number }) {
  const { data, isLoading } = useQuery<SessionContext>(
    ['sessionContext', sessionKey ?? 'latest'],
    () => api.getSessionContext(sessionKey),
    { staleTime: 5 * 60 * 1000 }
  );

  if (isLoading) {
    return <div className="card h-[74px] animate-pulse bg-white/[0.03]" />;
  }
  if (!data || !data.session_key) return null;

  const race = data.meeting_name || `${data.country_name} Grand Prix`;

  return (
    <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
      <div className="flex items-center gap-3">
        <CountryFlag country={data.country_name} className="h-8" width="w320" />
        <div>
          <div className="text-base font-semibold text-white leading-tight">{race}</div>
          <div className="text-xs text-zinc-500">
            {data.session_name}
            {data.year ? ` · ${data.year} season` : ''}
          </div>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <MapPin size={14} className="text-zinc-600" />
          {data.circuit_short_name}, {data.country_name}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock size={14} className="text-zinc-600" />
          <span className="font-mono text-zinc-300">{formatIST(data.date_start)}</span>
        </span>
      </div>
    </div>
  );
}
