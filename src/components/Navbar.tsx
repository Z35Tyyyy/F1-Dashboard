import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CalendarClock,
  Radio,
  CloudSun,
  Trophy,
  Flag,
  Timer,
  Disc3,
} from 'lucide-react';
import type { ReactNode } from 'react';

const links: { to: string; label: string; icon: ReactNode }[] = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/schedule', label: 'Schedule', icon: <CalendarClock size={16} /> },
  { to: '/results', label: 'Results', icon: <Flag size={16} /> },
  { to: '/qualifying', label: 'Qualifying', icon: <Timer size={16} /> },
  { to: '/strategy', label: 'Strategy', icon: <Disc3 size={16} /> },
  { to: '/drivers', label: 'Drivers', icon: <Users size={16} /> },
  { to: '/standings', label: 'Standings', icon: <Trophy size={16} /> },
  { to: '/sessions', label: 'Sessions', icon: <CalendarDays size={16} /> },
  { to: '/team-radio', label: 'Radio', icon: <Radio size={16} /> },
  { to: '/weather', label: 'Weather', icon: <CloudSun size={16} /> },
];

function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.07] bg-carbon/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-2 px-4">
        <NavLink to="/" end className="mr-1 flex shrink-0 items-center gap-2">
          <span className="h-4 w-1.5 -skew-x-12 bg-accent shadow-[0_0_12px_2px_rgba(225,6,0,0.6)]" />
          <span className="text-sm font-bold uppercase tracking-wide text-white">
            F1<span className="hidden text-zinc-500 sm:inline"> Dashboard</span>
          </span>
        </NavLink>

        <div className="flex items-center gap-0.5 overflow-x-auto">
          {links.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={label}
              className={({ isActive }) =>
                `relative flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 text-sm font-semibold uppercase tracking-wide transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {icon}
                  <span className="hidden xl:inline">{label}</span>
                  {isActive && (
                    <span className="absolute inset-x-1 -bottom-[9px] h-0.5 bg-accent" aria-hidden />
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
