import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { MapPin, Play, Pause } from 'lucide-react';
import { api } from '../lib/api';
import type { TrackLaps, TrackPoint } from '../lib/types';
import { StateMsg } from './ui';

const PAD = 40;

export default function TrackMap({
  sessionKey,
  driverNumber,
}: {
  sessionKey?: number;
  driverNumber?: number;
}) {
  const [lapIdx, setLapIdx] = useState(0);
  const [playing, setPlaying] = useState(true);

  const { data, isLoading, isError } = useQuery<TrackLaps>(
    ['trackLaps', sessionKey, driverNumber],
    () => api.getTrackLaps(driverNumber, sessionKey),
    { enabled: driverNumber != null, staleTime: 10 * 60 * 1000 }
  );

  const laps = useMemo(() => data?.laps ?? [], [data]);
  useEffect(() => setLapIdx(0), [sessionKey, driverNumber]);

  // Shared projection from all points so the marker never leaves the frame.
  const geom = useMemo(() => {
    const all: TrackPoint[] = [];
    data?.outline?.forEach((p) => all.push(p));
    data?.laps?.forEach((l) => l.points.forEach((p) => all.push(p)));
    if (all.length < 10) return null;
    const xs = all.map((p) => p.x);
    const ys = all.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const s = 1000 / Math.max(w, h);
    const project = (x: number, y: number): [number, number] => [(x - minX) * s, (maxY - y) * s];
    const outline = (data?.outline ?? [])
      .map((p) => project(p.x, p.y).map((n) => n.toFixed(1)).join(','))
      .join(' ');
    return { project, outline, vbW: w * s + PAD * 2, vbH: h * s + PAD * 2 };
  }, [data]);

  const markerRef = useRef<SVGCircleElement>(null);
  const trailRef = useRef<SVGPolylineElement>(null);
  const progRef = useRef(0);
  const rafRef = useRef(0);
  useEffect(() => void (progRef.current = 0), [lapIdx]);

  useEffect(() => {
    const cur = laps[lapIdx];
    if (!geom || !cur || cur.points.length < 2 || !playing) return;
    const proj = cur.points.map((p) => geom.project(p.x, p.y));
    const speed = proj.length / 5; // ~5s per lap
    let last = performance.now();
    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      progRef.current += speed * dt;
      if (progRef.current >= proj.length - 1) {
        setLapIdx((i) => (laps.length ? (i + 1) % laps.length : 0));
        return;
      }
      const i = Math.floor(progRef.current);
      const f = progRef.current - i;
      const [ax, ay] = proj[i];
      const [bx, by] = proj[Math.min(i + 1, proj.length - 1)];
      const x = ax + (bx - ax) * f;
      const y = ay + (by - ay) * f;
      markerRef.current?.setAttribute('cx', String(x));
      markerRef.current?.setAttribute('cy', String(y));
      trailRef.current?.setAttribute(
        'points',
        proj.slice(0, i + 1).map((p) => p.join(',')).join(' ') + ` ${x},${y}`
      );
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [geom, lapIdx, playing, laps]);

  const currentLapNo = laps[lapIdx]?.lap;

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <MapPin size={16} className="text-accent-bright" />
        <div>
          <h2 className="font-display text-base font-semibold uppercase tracking-wide text-white">
            Track Map
          </h2>
          <p className="text-xs text-zinc-500">Lap-by-lap replay traced from GPS telemetry</p>
        </div>
      </div>

      <div className="mt-4 min-h-[400px]">
        {isLoading && <StateMsg>Loading laps…</StateMsg>}
        {isError && <StateMsg kind="error">Failed to load track data.</StateMsg>}
        {!isLoading && !isError && (!geom || laps.length === 0) && (
          <StateMsg>No GPS lap data for this driver.</StateMsg>
        )}
        {geom && laps.length > 0 && (
          <>
            <svg
              viewBox={`${-PAD} ${-PAD} ${geom.vbW} ${geom.vbH}`}
              className="mx-auto h-[440px] w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <polyline points={geom.outline} fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" />
              <polyline ref={trailRef} points="" fill="none" stroke="#e10600" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
              <circle ref={markerRef} r="11" fill="#e10600" stroke="#fff" strokeWidth="3" />
            </svg>

            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => setPlaying((p) => !p)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-white hover:border-white/[0.2]"
                title={playing ? 'Pause' : 'Play'}
              >
                {playing ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <span className="w-24 shrink-0 font-mono text-sm text-zinc-300">
                Lap {currentLapNo ?? '—'}
                <span className="text-zinc-600"> / {laps.length}</span>
              </span>
              <input
                type="range"
                min={0}
                max={Math.max(0, laps.length - 1)}
                value={lapIdx}
                onChange={(e) => setLapIdx(Number(e.target.value))}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-accent"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
