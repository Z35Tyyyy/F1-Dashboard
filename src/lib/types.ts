// Shared response types for the OpenF1 endpoints this app consumes.
// See https://openf1.org/docs/ for the full field list.

export interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  first_name: string;
  last_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string;
  country_code: string | null;
  session_key: number;
  meeting_key: number;
}

export interface Session {
  session_key: number;
  session_name: string;
  session_type: string;
  circuit_short_name: string;
  country_name: string;
  country_code: string;
  location: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  year: number;
}

export interface SessionContext extends Session {
  meeting_key: number;
  meeting_name: string | null;
}

export interface Weather {
  air_temperature: number;
  track_temperature: number;
  wind_speed: number;
  wind_direction: number;
  humidity: number;
  pressure: number;
  rainfall: number;
  date: string;
  session_key: number;
}

// NOTE: OpenF1 does not provide a radio transcript — only an audio recording.
export interface TeamRadioMessage {
  date: string;
  driver_number: number;
  recording_url: string;
  session_key: number;
  meeting_key: number;
}

export interface CarData {
  date: string;
  speed: number;
  rpm: number;
  n_gear: number;
  throttle: number;
  brake: number;
  drs: number | null;
  driver_number: number;
  session_key: number;
}

export interface DriverStats {
  driver_number: number;
  best_lap: number | null;
  pit_stops: number;
  position: number | null;
}

export interface RaceControlMessage {
  date: string;
  category: string;
  flag: string | null;
  scope: string | null;
  sector: number | null;
  driver_number: number | null;
  lap_number: number | null;
  message: string;
  session_key: number;
}

// --- Jolpica (Ergast-compatible) standings ---

export interface ErgastDriver {
  driverId: string;
  code?: string;
  permanentNumber?: string;
  givenName: string;
  familyName: string;
  nationality: string;
}

export interface ErgastConstructor {
  constructorId: string;
  name: string;
  nationality: string;
}

export interface DriverStanding {
  position: string;
  points: string;
  wins: string;
  Driver: ErgastDriver;
  Constructors: ErgastConstructor[];
}

export interface ConstructorStanding {
  position: string;
  points: string;
  wins: string;
  Constructor: ErgastConstructor;
}

export interface DriverStandingsList {
  season?: string;
  round?: string;
  DriverStandings?: DriverStanding[];
}

export interface ConstructorStandingsList {
  season?: string;
  round?: string;
  ConstructorStandings?: ConstructorStanding[];
}

export interface FormResult {
  round: number;
  position: string; // finishing position, or a status code like "R" (retired)
}

export interface SessionResult {
  position: number | null;
  driver_number: number;
  number_of_laps: number | null;
  points: number | null;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
  duration: number | number[] | null;
  gap_to_leader: number | string | null;
}

export interface TrackPoint {
  x: number;
  y: number;
}

export interface TrackLaps {
  outline: TrackPoint[];
  laps: { lap: number; points: TrackPoint[] }[];
}

export interface Stint {
  stint_number: number;
  driver_number: number;
  lap_start: number;
  lap_end: number;
  compound: string; // SOFT | MEDIUM | HARD | INTERMEDIATE | WET
  tyre_age_at_start: number;
}

export interface ScheduleRace {
  round: string;
  raceName: string;
  date: string;
  time?: string;
  Circuit: {
    circuitName: string;
    Location: { locality: string; country: string; lat: string; long: string };
  };
  Qualifying?: { date: string; time?: string };
  Sprint?: { date: string; time?: string } | null;
}

export interface QualifyingResult {
  position: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface QualifyingRace {
  raceName?: string;
  round?: string;
  QualifyingResults?: QualifyingResult[];
}
