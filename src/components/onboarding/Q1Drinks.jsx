import { useState } from 'react';

const DRINK_OPTIONS = [
  'V60',
  'Filter',
  'Espresso',
  'Flat white',
  'Cortado',
  'Latte',
  'Cappuccino',
  'Matcha',
  'Tea',
  'Other',
];

export function Q1Drinks({ initial = [], onContinue }) {
  const [selected, setSelected] = useState(new Set(initial));

  const toggle = (drink) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(drink)) next.delete(drink);
      else next.add(drink);
      return next;
    });
  };

  const canContinue = selected.size >= 1;

  return (
    <div className="min-h-screen w-full bg-bg flex flex-col px-6 py-10 sm:py-16 overflow-y-auto animate-screen-in">
      <div className="max-w-xl w-full mx-auto flex-1 flex flex-col">
        <p className="text-xs font-medium text-inkSoft uppercase tracking-wider">Step 1 of 3</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-medium text-ink leading-tight tracking-tight">
          What do you usually drink?
        </h1>
        <p className="mt-3 text-inkSoft text-base">
          Pick everything you reach for. The Advisor uses this to weight what it suggests.
        </p>

        <div className="mt-8 flex flex-wrap gap-2.5">
          {DRINK_OPTIONS.map((drink) => {
            const isSelected = selected.has(drink);
            return (
              <button
                key={drink}
                type="button"
                onClick={() => toggle(drink)}
                aria-pressed={isSelected}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-sage text-white'
                    : 'bg-sageLight text-ink hover:bg-sageLight/70'
                }`}
              >
                {drink}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-12">
          <button
            type="button"
            onClick={() => canContinue && onContinue(Array.from(selected))}
            disabled={!canContinue}
            className={`w-full sm:w-auto sm:px-12 py-3.5 rounded-full font-medium text-base transition-all ${
              canContinue
                ? 'bg-sage hover:bg-sageDeep text-white'
                : 'bg-sageLight text-inkSoft cursor-not-allowed'
            }`}
          >
            Continue
          </button>
          {!canContinue && (
            <p className="mt-3 text-xs text-inkSoft">Pick at least one to continue.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Q1Drinks;
