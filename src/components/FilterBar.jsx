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

/**
 * Sticky filter bar with brew method, open now, and price range controls
 *
 * Props:
 * - filters: { brewMethods: [], openNow: boolean, priceRange: [] }
 * - onFiltersChange: function(newFilters)
 */
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
    <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm p-3 sm:p-4">
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto sm:flex-wrap scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
        {/* Brew Method Selector */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowBrewDropdown(!showBrewDropdown)}
            className="text-sm font-medium px-3 py-2 rounded border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
          >
            ☕ Brew Methods {filters.brewMethods.length > 0 && `(${filters.brewMethods.length})`}
          </button>
          {showBrewDropdown && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-30 min-w-56">
              {BREW_METHODS.map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={filters.brewMethods.includes(method)}
                    onChange={() => handleBrewMethodToggle(method)}
                    className="w-4 h-4"
                  />
                  <span className="capitalize">{method}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Open Now Toggle */}
        <button
          onClick={handleOpenNowToggle}
          className={`text-sm font-medium px-3 py-2 rounded transition-colors shrink-0 whitespace-nowrap ${
            filters.openNow
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'border border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          🕐 Open Now
        </button>

        {/* Price Range Selector */}
        <div className="flex gap-1 border border-gray-300 rounded shrink-0">
          {PRICE_RANGES.map((price) => (
            <button
              key={price}
              onClick={() => handlePriceRangeToggle(price)}
              className={`text-sm font-medium px-3 py-2 transition-colors ${
                filters.priceRange.includes(price)
                  ? 'bg-coffee-700 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {price}
            </button>
          ))}
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <button
            onClick={() =>
              onFiltersChange({
                brewMethods: [],
                openNow: false,
                priceRange: [],
              })
            }
            className="text-sm text-gray-600 hover:text-gray-900 font-medium shrink-0 whitespace-nowrap ml-auto"
          >
            ✕ Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
