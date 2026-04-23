/**
 * Drinkable brand mark — Mark01 (half-full glass).
 * Glass outline in ink, lower half filled with sage.
 *
 * <Logo size={n} />        → mark only
 * <LogoLockup size={n} />  → mark + "drinkable" wordmark
 *
 * `size` is the mark side length in px. The wordmark in the lockup
 * scales proportionally (~0.42x of mark height).
 */

const STROKE = 'var(--ink, #2d3a33)';
const FILL = 'var(--sage, #86a192)';

export function Logo({ size = 56, className = '', title = 'Drinkable' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      <path
        d="M14 10 L42 10 L38 46 Q38 50 34 50 L22 50 Q18 50 18 46 Z"
        stroke={STROKE}
        strokeWidth="2.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M16.5 28 L39.5 28 L37.6 46 Q37.6 49.2 34.4 49.2 L21.6 49.2 Q18.4 49.2 18.4 46 Z"
        fill={FILL}
      />
    </svg>
  );
}

export function LogoLockup({ size = 32, className = '' }) {
  // Wordmark height tracks mark height; tracking -1 → -2 per brand spec.
  const wordSize = Math.round(size * 0.62);
  const tracking = size >= 64 ? -2 : -1;
  const gap = Math.max(8, Math.round(size * 0.18));

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap }}
      aria-label="Drinkable"
    >
      <Logo size={size} title="" />
      <span
        style={{
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          fontWeight: 500,
          fontSize: wordSize,
          letterSpacing: `${tracking}px`,
          lineHeight: 1,
          color: 'var(--ink, #2d3a33)',
        }}
      >
        drinkable
      </span>
    </div>
  );
}

export default Logo;
