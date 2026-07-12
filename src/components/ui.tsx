import type { ReactNode } from 'react';

/** Page title + subtitle, with an optional right-aligned slot (e.g. a filter). */
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
          <h1 className="text-2xl font-bold uppercase tracking-tight text-white sm:text-[2rem] sm:leading-none">
            {title}
          </h1>
        </div>
        {subtitle && <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

/** Centered status line for loading / error / empty states. */
export function StateMsg({
  kind = 'muted',
  children,
}: {
  kind?: 'muted' | 'error';
  children: ReactNode;
}) {
  return (
    <div
      className={`py-16 text-center text-sm ${kind === 'error' ? 'text-red-400' : 'text-zinc-500'}`}
    >
      {children}
    </div>
  );
}

/** A small labelled metric with an optional icon. */
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
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-500">
        {icon}
        {label}
      </div>
      <div className={`mt-1 font-mono text-lg ${accent ? 'text-accent-soft' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
