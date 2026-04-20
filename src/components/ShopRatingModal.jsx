import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

const API_URL =
  import.meta.env.PROD
    ? '/api/shop-rating'
    : 'http://localhost:3001/api/shop-rating';

/**
 * Modal that shows Claude's real-time rating of a single coffee shop.
 * Parent triggers it via `ref.current.rate(shop)`.
 */
export const ShopRatingModal = forwardRef(function ShopRatingModal(
  { userLocation },
  ref
) {
  const [isOpen, setIsOpen] = useState(false);
  const [shop, setShop] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  const rate = useCallback(
    async (targetShop) => {
      setShop(targetShop);
      setIsOpen(true);
      setIsLoading(true);
      setError(null);
      setResponse(null);

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shop: targetShop,
            userLat: userLocation?.lat,
            userLng: userLocation?.lng,
            timeOfDay: new Date().toISOString(),
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server error (${res.status})`);
        }

        const data = await res.json();
        setResponse(data);
      } catch (err) {
        console.error('Shop rating error:', err);
        setError(
          err.message === 'Failed to fetch'
            ? 'Cannot reach the rating server. Make sure to run: npm run server'
            : err.message || 'Failed to get shop rating. Please try again.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [userLocation]
  );

  useImperativeHandle(ref, () => ({ rate }), [rate]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-coffee-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <p className="text-coffee-200 text-xs uppercase tracking-wide">Shop Rating</p>
            <h2 className="text-xl font-bold truncate">{shop?.name || 'Loading…'}</h2>
            {shop?.neighborhood && (
              <p className="text-coffee-200 text-sm truncate">{shop.neighborhood}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-coffee-800 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 bg-coffee-700 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-coffee-700 rounded-full animate-bounce delay-100" />
                <div className="w-3 h-3 bg-coffee-700 rounded-full animate-bounce delay-200" />
              </div>
              <p className="text-gray-600 font-medium">Rating {shop?.name}…</p>
              <p className="text-gray-400 text-sm mt-1">Asking our London coffee expert</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <p className="font-semibold text-red-800 mb-1">Couldn't fetch the rating</p>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <button
                onClick={() => shop && rate(shop)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {response && (
            <div className="space-y-5">
              {/* Rating banner */}
              <div className="flex items-center justify-between gap-3 bg-coffee-50 border border-coffee-100 rounded-lg p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-coffee-700 font-semibold">
                    Real-time rating
                  </p>
                  <p className="text-3xl font-bold text-coffee-800 leading-none mt-1">
                    {response.rating}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                      response.openNow
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {response.openNow ? '● Open now' : '○ Closed'}
                  </span>
                </div>
              </div>

              {/* Headline */}
              {response.headline && (
                <p className="text-lg font-semibold text-gray-900 leading-snug">
                  {response.headline}
                </p>
              )}

              {/* Summary */}
              {response.summary && (
                <p className="text-gray-700 leading-relaxed">{response.summary}</p>
              )}

              {/* What to order */}
              {response.whatToOrder && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    What to order
                  </p>
                  <p className="text-sm text-gray-800">{response.whatToOrder}</p>
                </div>
              )}

              {/* Best for */}
              {response.bestFor && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    Best for
                  </p>
                  <p className="text-sm text-gray-800">{response.bestFor}</p>
                </div>
              )}

              {/* Insider tip */}
              {response.insiderTip && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold mb-1">
                    Insider tip
                  </p>
                  <p className="text-sm text-amber-900">{response.insiderTip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ShopRatingModal;
