import { useState, useEffect, useCallback } from 'react';

const API_URL =
  import.meta.env.PROD
    ? '/api/advisor'
    : 'http://localhost:3001/api/advisor';

export function CoffeeAdvisor({ userLocation, topShops }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, handleClose]);

  const handleAsk = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setCopied(false);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLat: userLocation.lat,
          userLng: userLocation.lng,
          timeOfDay: new Date().toISOString(),
          nearbyShops: topShops,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error('Advisor error:', err);
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot reach the advisor server. Make sure to run: npm run server'
          : err.message || 'Failed to get recommendations. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response?.recommendations) return;
    const text = response.recommendations
      .map((r, i) => `${i + 1}. ${r.shopName} (${r.neighborhood})\n${r.reasoning}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // FAB button
  if (!isOpen) {
    return (
      <button
        onClick={handleAsk}
        className="fixed bottom-6 right-6 z-40 bg-coffee-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-coffee-800 hover:shadow-xl hover:scale-105 transition-all"
        title="Ask the Coffee Advisor"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-coffee-700 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold">Coffee Advisor</h2>
            <p className="text-coffee-200 text-sm">Powered by Claude AI</p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-coffee-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex gap-2 mb-4">
                <div className="w-3 h-3 bg-coffee-700 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-coffee-700 rounded-full animate-bounce delay-100" />
                <div className="w-3 h-3 bg-coffee-700 rounded-full animate-bounce delay-200" />
              </div>
              <p className="text-gray-600 font-medium">Finding your perfect cup...</p>
              <p className="text-gray-400 text-sm mt-1">Asking our London coffee expert</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-5">
              <p className="font-semibold text-red-800 mb-1">Couldn't reach the advisor</p>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <button
                onClick={handleAsk}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="space-y-5">
              {/* Advice intro */}
              <p className="text-gray-800 leading-relaxed">{response.advice}</p>

              {/* Divider */}
              <div className="border-t border-gray-200" />

              {/* Recommendations */}
              {response.recommendations?.map((rec, idx) => (
                <div
                  key={rec.shopId || idx}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="shrink-0 w-7 h-7 bg-coffee-700 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{rec.shopName}</h4>
                      <p className="text-xs text-gray-500">{rec.neighborhood}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed ml-10">
                    {rec.reasoning}
                  </p>
                </div>
              ))}

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="w-full bg-coffee-700 text-white py-2.5 rounded-lg hover:bg-coffee-800 transition-colors font-medium text-sm"
              >
                {copied ? 'Copied!' : 'Copy Recommendations'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoffeeAdvisor;
