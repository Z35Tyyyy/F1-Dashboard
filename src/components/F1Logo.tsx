// A recognizable recreation of the Formula 1 mark: a forward-leaning red "F1"
// with three speed lines. Hand-built SVG (not the trademarked asset file).
export default function F1Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 56" className={className} role="img" aria-label="F1">
      <g fill="#e10600" transform="skewX(-14)">
        {/* F — vertical stem + two arms */}
        <rect x="26" y="6" width="15" height="44" rx="1.5" />
        <rect x="26" y="6" width="46" height="12" rx="1.5" />
        <rect x="26" y="24" width="34" height="11" rx="1.5" />
        {/* 1 — thick stem with a top flag */}
        <rect x="92" y="6" width="16" height="44" rx="1.5" />
        <path d="M92 6 L84 18 L92 18 Z" />
      </g>
      {/* speed lines trailing right */}
      <g fill="#e10600">
        <rect x="150" y="12" width="44" height="8" rx="4" />
        <rect x="138" y="24" width="56" height="8" rx="4" />
        <rect x="150" y="36" width="44" height="8" rx="4" />
      </g>
    </svg>
  );
}
