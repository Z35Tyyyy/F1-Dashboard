import { NavLink } from 'react-router-dom';
import { LayoutGrid, CalendarClock, Flag, Trophy, Users, Radio } from 'lucide-react';
import type { ReactNode } from 'react';
import F1Logo from './F1Logo';

const links: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/', label: 'Home', icon: <LayoutGrid size={16} /> },
  { to: '/schedule', label: 'Schedule', icon: <CalendarClock size={16} /> },
  { to: '/results', label: 'Results', icon: <Flag size={16} /> },
  { to: '/standings', label: 'Standings', icon: <Trophy size={16} /> },
  { to: '/drivers', label: 'Drivers', icon: <Users size={16} /> },
  { to: '/live', label: 'Live', icon: <Radio size={16} /> },
];

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-carbon/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <NavLink to="/" end className="flex shrink-0 items-center gap-2.5">
          <F1Logo className="h-5 w-auto" />
          <span className="hidden font-display text-lg font-bold uppercase tracking-wider text-white sm:inline">
            Dashboard
          </span>
        </NavLink>

        <div className="ml-2 flex items-center gap-0.5 overflow-x-auto">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={label}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2 font-display text-sm font-semibold uppercase tracking-wide transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {icon}
                  <span className="hidden md:inline">{label}</span>
                  {isActive && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 bg-accent" aria-hidden />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
