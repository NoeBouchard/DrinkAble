import { useState } from 'react';

/**
 * Coffee Advisor Component - AI-powered recommendations
 * TODO (Session 3): Integrate with Claude API via Express proxy
 *
 * Props:
 * - userLocation: { lat, lng }
 * - topShops: array of 10 nearest shops
 * - onClose: function
 */
export function CoffeeAdvisor({ userLocation, topShops, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);

    // TODO (Session 3): Uncomment and implement the Claude API call
    // try {
    //   const res = await fetch('/api/advisor', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       userLat: userLocation.lat,
    //       userLng: userLocation.lng,
    //       timeOfDay: new Date().toISOString(),
    //       nearbyShops: topShops,
    //     }),
    //   });
    //   const data = await res.json();
    //   setResponse(data);
    // } catch (err) {
    //   setError('Failed to reach the Coffee Advisor. Please try again.');
    // }

    // Placeholder response for UI testing
    setResponse({
      advice:
        'You are in a great location! You have several excellent specialty coffee shops within walking distance. Here are my top three recommendations based on your location and preferences.',
      recommendations: [
        {
          shopId: 'prufrock-coffee',
          shopName: 'Prufrock Coffee',
          neighborhood: 'Clerkenwell',
          reasoning:
            'Just 0.4km away. Their seasonal single-origin pour-overs are exceptional. Ask the baristas about this months Ethiopian selection.',
        },
        {
          shopId: 'climpson-sons',
          shopName: 'Climpson & Sons',
          neighborhood: 'Hackney',
          reasoning:
            'Excellent siphon program and beautiful Broadway Market location. Perfect for a leisurely coffee experience.',
        },
        {
          shopId: 'workshop-coffee-clerkenwell',
          shopName: 'Workshop Coffee',
          neighborhood: 'Clerkenwell',
          reasoning:
            'Known for exceptional barista training. Great for learning about specialty coffee preparation techniques.',
        },
      ],
    });

    setIsLoading(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setResponse(null);
    setError(null);
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 bg-coffee-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-coffee-800 hover:shadow-xl transition-all font-bold text-xl"
        title="Ask the Coffee Advisor"
      >
        ✨
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-coffee-700 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Coffee Advisor</h2>
          <button
            onClick={handleClose}
            className="text-white hover:bg-coffee-800 rounded p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-3 h-3 bg-coffee-700 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-coffee-700 rounded-full animate-bounce delay-100" />
                <div className="w-3 h-3 bg-coffee-700 rounded-full animate-bounce delay-200" />
              </div>
              <p className="text-center text-gray-600 font-medium">Finding your perfect cup...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
              <p className="font-medium mb-2">⚠️ Oops!</p>
              <p>{error}</p>
              <button
                onClick={handleOpen}
                className="mt-3 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {response && (
            <div className="space-y-6">
              {/* Main Advice */}
              <p className="text-lg text-gray-800 leading-relaxed">{response.advice}</p>

              {/* Recommendations */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900">My Top 3 Picks:</h3>

                {response.recommendations &&
                  response.recommendations.map((rec, idx) => (
                    <div
                      key={rec.shopId}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3 mb-2">
                        <div className="flex-shrink-0 w-8 h-8 bg-coffee-700 text-white rounded-full flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900">{rec.shopName}</h4>
                          <p className="text-sm text-gray-600">{rec.neighborhood}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 leading-relaxed ml-11">{rec.reasoning}</p>
                    </div>
                  ))}
              </div>

              {/* Copy Button */}
              <button
                onClick={() => {
                  const text = response.recommendations
                    .map(
                      (r) =>
                        `${r.shopName} (${r.neighborhood})\n${r.reasoning}\n\n`
                    )
                    .join('');
                  navigator.clipboard.writeText(text);
                  alert('Recommendations copied to clipboard!');
                }}
                className="w-full bg-coffee-700 text-white py-2 rounded hover:bg-coffee-800 transition-colors font-medium"
              >
                📋 Copy Recommendations
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoffeeAdvisor;
