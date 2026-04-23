import { useState } from 'react';

const BREW_METHODS = [
  'espresso',
  'v60',
  'aeropress',
  'chemex',
  'siphon',
  'batch-brew',
  'cold-brew',
  'pour-over',
];

const PRICE_RANGES = ['$', '$$', '$$$'];

export function FilterBar({ filters, onFiltersChange }) {
  const [showBrewDropdown, setShowBrewDropdown] = useState(false);

  const handleBrewMethodToggle = (method) => {
    const updated = filters.brewMethods.includes(method)
      ? filters.brewMethods.filter((m) => m !== method)
      : [...filters.brewMethods, method];
    onFiltersChange({ ...filters, brewMethods: updated });
  };

  const handleOpenNowToggle = () => {
    onFiltersChange({ ...filters, openNow: !filters.openNow });
  };

  const handlePriceRangeToggle = (price) => {
    const updated = filters.priceRange.includes(price)
      ? filters.priceRange.filter((p) => p !== price)
      : [...filters.priceRange, price];
    onFiltersChange({ ...filters, priceRange: updated });
  };

  const hasActiveFilters =
    filters.brewMethods.length > 0 || filters.openNow || filters.priceRange.length > 0;

  return (
    <div className="sticky top-0 z-20 bg-white border-b border-sageLight p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto sm:flex-wrap scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        {/* Brew Method */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowBrewDropdown(!showBrewDropdown)}
            className="text-sm font-medium px-3 py-2 rounded-full border border-sageLight bg-bg hover:border-sage hover:bg-sageLight/50 text-ink transition-colors"
          >
            ☕ Brew {filters.brewMethods.length > 0 && `(${filters.brewMethods.length})`}
          </button>
          {showBrewDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-sageLight rounded-xl shadow-lg p-2 z-30 min-w-56">
              {BREW_METHODS.map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-2 p-2 hover:bg-sageLight/40 rounded-lg cursor-pointer text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={filters.brewMethods.includes(method)}
                    onChange={() => handleBrewMethodToggle(method)}
                    className="w-4 h-4 accent-sage"
                  />
                  <span className="capitalize">{method}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Open Now */}
        <button
          onClick={handleOpenNowToggle}
          className={`text-sm font-medium px-3 py-2 rounded-full transition-colors shrink-0 whitespace-nowrap border ${
            filters.openNow
              ? 'bg-sage text-white border-sage'
              : 'bg-bg border-sageLight hover:border-sage hover:bg-sageLight/50 text-ink'
          }`}
        >
          🕐 Open now
        </button>

        {/* Price Range */}
        <div className="flex gap-1 border border-sageLight rounded-full overflow-hidden shrink-0 bg-bg">
          {PRICE_RANGES.map((price) => (
            <button
              key={price}
              onClick={() => handlePriceRangeToggle(price)}
              className={`text-sm font-medium px-3 py-2 transition-colors ${
                filters.priceRange.includes(price)
                  ? 'bg-sage text-white'
                  : 'text-ink hover:bg-sageLight/60'
              }`}
            >
              {price}
            </button>
          ))}
        </div>

        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({
                brewMethods: [],
                openNow: false,
                priceRange: [],
              })
            }
            className="text-sm text-inkSoft hover:text-ink font-medium shrink-0 whitespace-nowrap ml-auto"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
