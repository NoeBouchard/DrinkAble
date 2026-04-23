import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

const API_URL =
  import.meta.env.PROD
    ? '/api/shop-rating'
    : 'http://localhost:3001/api/shop-rating';

/**
 * Per-shop "Why this one?" modal — Claude's real-time take on a single shop.
 * Triggered from a ShopCard via ref.current.rate(shop).
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
        console.warn('Shop rating error:', err);
        setError(
          err.message === 'Failed to fetch'
            ? "The Advisor can't be reached. Make sure the server is running."
            : err.message || 'The Advisor is taking a moment. Try again?'
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
      className="fixed inset-0 bg-ink/50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-sage text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <p className="text-white/80 text-xs uppercase tracking-wider">Why this one?</p>
            <h2 className="text-xl font-medium truncate">{shop?.name || 'Loading…'}</h2>
            {shop?.neighborhood && (
              <p className="text-white/80 text-sm truncate">{shop.neighborhood}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-sageDeep transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-bg">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 bg-sage rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-sage rounded-full animate-bounce delay-100" />
                <div className="w-3 h-3 bg-sage rounded-full animate-bounce delay-200" />
              </div>
              <p className="text-ink font-medium">Reading {shop?.name}…</p>
              <p className="text-inkSoft text-sm mt-1">Asking the London coffee Advisor</p>
            </div>
          )}

          {error && (
            <div className="bg-white border border-sageLight rounded-lg p-5">
              <p className="font-medium text-ink mb-1">The Advisor is taking a moment.</p>
              <p className="text-inkSoft text-sm mb-4">{error}</p>
              <button
                onClick={() => shop && rate(shop)}
                className="bg-sage hover:bg-sageDeep text-white px-5 py-2 rounded-full transition-colors text-sm font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {response && (
            <div className="space-y-5">
              {/* Rating banner */}
              <div className="flex items-center justify-between gap-3 bg-white border border-sageLight rounded-xl p-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-inkSoft font-medium">
                    Real-time take
                  </p>
                  <p className="text-3xl font-medium text-ink leading-none mt-1">
                    {response.rating}
                  </p>
                </div>
                <span
                  className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                    response.openNow
                      ? 'bg-sage text-white'
                      : 'bg-sageLight text-ink'
                  }`}
                >
                  {response.openNow ? '● Open now' : '○ Closed'}
                </span>
              </div>

              {response.headline && (
                <p className="text-lg font-medium text-ink leading-snug">
                  {response.headline}
                </p>
              )}

              {response.summary && (
                <p className="text-ink leading-relaxed">{response.summary}</p>
              )}

              {response.whatToOrder && (
                <div className="bg-white border border-sageLight rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-inkSoft font-medium mb-1">
                    What to order
                  </p>
                  <p className="text-sm text-ink">{response.whatToOrder}</p>
                </div>
              )}

              {response.bestFor && (
                <div className="bg-white border border-sageLight rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-inkSoft font-medium mb-1">
                    Best for
                  </p>
                  <p className="text-sm text-ink">{response.bestFor}</p>
                </div>
              )}

              {response.insiderTip && (
                <div className="bg-sageLight border border-sage/40 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-wider text-sageDeep font-medium mb-1">
                    Insider tip
                  </p>
                  <p className="text-sm text-ink">{response.insiderTip}</p>
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
