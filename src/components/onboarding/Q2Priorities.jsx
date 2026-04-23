import { useState } from 'react';

const PRIORITY_OPTIONS = [
  'Discovering new independents',
  'Certified specialty-grade',
  'Roaster-owned',
  'Recognized globally (top 100)',
  'Great vibe to work in',
  'Quick in-and-out',
];

export function Q2Priorities({ initial = [], onContinue, onSkip }) {
  const [selected, setSelected] = useState(new Set(initial));

  const toggle = (priority) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(priority)) next.delete(priority);
      else next.add(priority);
      return next;
    });
  };

  const handleContinue = () => {
    onContinue(Array.from(selected));
  };

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col px-6 py-10 sm:py-16 animate-screen-in">
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col">
        <p className="text-xs font-medium text-inkSoft uppercase tracking-wider">Step 2 of 3</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
          What matters most when you pick a coffee shop?
        </h1>
        <p className="mt-3 text-inkSoft text-base">
          Optional. Helps the Advisor weight shops that fit how you choose.
        </p>

        <div className="mt-8 flex flex-wrap gap-2.5">
          {PRIORITY_OPTIONS.map((priority) => {
            const isSelected = selected.has(priority);
            return (
              <button
                key={priority}
                type="button"
                onClick={() => toggle(priority)}
                aria-pressed={isSelected}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-sage text-white'
                    : 'bg-sageLight text-ink hover:bg-sageLight/70'
                }`}
              >
                {priority}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-12 flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto sm:px-12 py-3.5 rounded-full font-medium text-base transition-colors bg-sage hover:bg-sageDeep text-white"
          >
            Continue
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-inkSoft hover:text-ink underline underline-offset-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

export default Q2Priorities;
