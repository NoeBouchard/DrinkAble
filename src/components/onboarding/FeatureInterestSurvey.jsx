import { useState } from 'react';
import { storage } from '../../utils/storage';
import { track, Events } from '../../utils/telemetry';

const FEATURE_OPTIONS = [
  'Chat with a community of coffee lovers',
  'Track the shops I\u2019ve tried',
  'Buy beans from roasters I\u2019ll like',
];

export function FeatureInterestSurvey({ onClose }) {
  const [selected, setSelected] = useState(new Set());
  const [email, setEmail] = useState('');

  const toggle = (feature) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(feature)) next.delete(feature);
      else next.add(feature);
      return next;
    });
  };

  const handleSubmit = () => {
    const selections = Array.from(selected);
    storage.setFeatureInterest(selections);
    storage.setTesterEmail(email.trim());
    track(Events.FEATURE_INTEREST_SUBMITTED, {
      selections,
      hasEmail: Boolean(email.trim()),
    });
    onClose();
  };

  const handleSkip = () => {
    track(Events.FEATURE_INTEREST_SKIPPED);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleSkip();
      }}
      role="dialog"
      aria-labelledby="feature-survey-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 sm:p-7 animate-slide-up">
        <h2 id="feature-survey-title" className="text-xl sm:text-2xl font-medium text-ink leading-tight">
          Quick question — help us figure out what to build next.
        </h2>
        <p className="mt-2 text-sm text-inkSoft">Would any of these be useful to you?</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((feat) => {
            const isSelected = selected.has(feat);
            return (
              <button
                key={feat}
                type="button"
                onClick={() => toggle(feat)}
                aria-pressed={isSelected}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors text-left ${
                  isSelected
                    ? 'bg-sage text-white'
                    : 'bg-sageLight text-ink hover:bg-sageLight/70'
                }`}
              >
                {feat}
              </button>
            );
          })}
        </div>

        <label className="block mt-6 text-sm text-inkSoft">
          Leave your email if you want updates when these launch
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="mt-2 w-full rounded-lg border border-sageLight bg-bg px-3 py-2.5 text-ink placeholder-inkSoft/60 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/30"
          />
        </label>

        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-sage hover:bg-sageDeep text-white font-medium px-6 py-2.5 rounded-full transition-colors text-sm"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-inkSoft hover:text-ink underline underline-offset-2"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeatureInterestSurvey;
