// Single source of truth for talking to the backend proxy (api/main.py),
// which in turn forwards to OpenF1. Override the base URL with VITE_API_BASE.
import type {
  CarData,
  ConstructorStandingsList,
  Driver,
  DriverStandingsList,
  DriverStats,
  FormResult,
  QualifyingRace,
  RaceControlMessage,
  ScheduleRace,
  Session,
  SessionContext,
  SessionResult,
  Stint,
  TeamRadioMessage,
  TrackLaps,
  TrackPoint,
  Weather,
} from './types';

export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:8000';

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API request failed: ${res.status} ${res.statusText} (${path})`);
  }
  const data = await res.json();
  if (data && typeof data === 'object' && 'detail' in data) {
    // FastAPI/OpenF1 error payloads come back as { detail: ... } with a 200 in
    // some edge cases; treat them as errors so callers never .map() over them.
    throw new Error(String((data as { detail: unknown }).detail));
  }
  return data as T;
}

const withSession = (sessionKey?: number) =>
  sessionKey != null ? `?session_key=${sessionKey}` : '';

export const api = {
  getDrivers: (sessionKey?: number) =>
    getJSON<Driver[]>(`/drivers${withSession(sessionKey)}`),
  getSessions: () => getJSON<Session[]>('/sessions'),
  getSessionContext: (sessionKey?: number) =>
    getJSON<SessionContext>(`/session-context${withSession(sessionKey)}`),
  getWeather: (sessionKey?: number) =>
    getJSON<Weather[]>(`/weather${withSession(sessionKey)}`),
  getTeamRadio: (sessionKey: number) =>
    getJSON<TeamRadioMessage[]>(`/team-radio?session_key=${sessionKey}`),
  getCarData: (sessionKey?: number, driverNumber?: number) => {
    const params = new URLSearchParams();
    if (sessionKey != null) params.set('session_key', String(sessionKey));
    if (driverNumber != null) params.set('driver_number', String(driverNumber));
    const qs = params.toString();
    return getJSON<CarData[]>(`/car-data${qs ? `?${qs}` : ''}`);
  },
  getRaceControl: (sessionKey?: number) =>
    getJSON<RaceControlMessage[]>(`/race-control${withSession(sessionKey)}`),
  getDriverStats: (sessionKey?: number) =>
    getJSON<Record<string, DriverStats>>(`/driver-stats${withSession(sessionKey)}`),
  getDriverStandings: () => getJSON<DriverStandingsList>('/standings/drivers'),
  getConstructorStandings: () =>
    getJSON<ConstructorStandingsList>('/standings/constructors'),
  getForm: (rounds?: number) =>
    getJSON<Record<string, FormResult[]>>(
      `/standings/form${rounds != null ? `?rounds=${rounds}` : ''}`
    ),
  getResults: (sessionKey?: number) =>
    getJSON<SessionResult[]>(`/results${withSession(sessionKey)}`),
  getStints: (sessionKey?: number) => getJSON<Stint[]>(`/stints${withSession(sessionKey)}`),
  getSchedule: () => getJSON<ScheduleRace[]>('/schedule'),
  getQualifying: () => getJSON<QualifyingRace>('/qualifying'),
  getTrackMap: (driverNumber?: number, sessionKey?: number) => {
    const params = new URLSearchParams();
    if (driverNumber != null) params.set('driver_number', String(driverNumber));
    if (sessionKey != null) params.set('session_key', String(sessionKey));
    const qs = params.toString();
    return getJSON<TrackPoint[]>(`/track-map${qs ? `?${qs}` : ''}`);
  },
  getTrackLaps: (driverNumber?: number, sessionKey?: number) => {
    const params = new URLSearchParams();
    if (driverNumber != null) params.set('driver_number', String(driverNumber));
    if (sessionKey != null) params.set('session_key', String(sessionKey));
    const qs = params.toString();
    return getJSON<TrackLaps>(`/track-laps${qs ? `?${qs}` : ''}`);
  },
};

