import type { ReactNode } from 'react';
import { countryFlag } from '../lib/format';

/** A country flag chip with a subtle 3D lift (ring + shadow). */
export function CountryFlag({
  country,
  className = 'h-5',
  width = 'w80',
}: {
  country?: string | null;
  className?: string;
  width?: string;
}) {
  const src = countryFlag(country, width);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={country ?? ''}
      loading="lazy"
      className={`w-auto rounded-[3px] object-cover shadow-[0_2px_7px_rgba(0,0,0,0.55)] ring-1 ring-white/20 ${className}`}
      onError={(e) => (e.currentTarget.style.display = 'none')}
    />
  );
}

/** Page title + subtitle, with an optional right-aligned slot. */
export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <span className="f1-bar" aria-hidden />
          <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-white sm:text-4xl">
            {title}
          </h1>
        </div>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function StateMsg({
  kind = 'muted',
  children,
}: {
  kind?: 'muted' | 'error';
  children: ReactNode;
}) {
  return (
    <div className={`py-16 text-center text-sm ${kind === 'error' ? 'text-red-400' : 'text-zinc-500'}`}>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="card px-4 py-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {icon}
        {label}
      </div>
      <div className={`mt-1 font-mono text-lg ${accent ? 'text-accent-bright' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

export interface TabDef<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

/** Underlined tab strip used by the Results and Live hubs. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-white/10">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`relative flex items-center gap-2 whitespace-nowrap px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
            active === t.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {t.icon}
          {t.label}
          {active === t.id && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" aria-hidden />
          )}
        </button>
      ))}
    </div>
  );
}
