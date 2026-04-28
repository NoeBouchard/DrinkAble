/**
 * TopNav — two-button primary navigation that lives in the top bar of
 * AdvisorHome and Layout (Browse). Visible only post-onboarding.
 *
 *   <TopNav active="home" onNavigate={(t) => ...} />
 *
 * Active button: sage-filled. Inactive: outlined sageLight, hovers to fill.
 * Both buttons fire onNavigate('home' | 'map') — parent decides whether to
 * no-op when already on that view.
 */

function HomeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function NavButton({ label, active, icon, onClick }) {
  const base =
    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px]';
  const stateClasses = active
    ? 'bg-sage text-white hover:bg-sageDeep'
    : 'border border-sageLight text-ink hover:bg-sageLight';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`${base} ${stateClasses}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function TopNav({ active, onNavigate }) {
  const go = (target) => {
    if (typeof onNavigate === 'function') onNavigate(target);
  };
  return (
    <nav className="flex items-center gap-2" aria-label="Primary">
      <NavButton
        label="Home"
        active={active === 'home'}
        icon={<HomeIcon />}
        onClick={() => go('home')}
      />
      <NavButton
        label="Map"
        active={active === 'map'}
        icon={<MapIcon />}
        onClick={() => go('map')}
      />
    </nav>
  );
}

export default TopNav;
