import { LogoLockup } from '../Logo';

export function SplashScreen({ onContinue }) {
  return (
    <div className="min-h-screen w-full bg-bg flex flex-col items-center justify-center px-6 py-12 overflow-y-auto animate-screen-in">
      <div className="flex flex-col items-center text-center max-w-md">
        <LogoLockup size={96} />

        <h1
          className="mt-10 text-4xl sm:text-5xl font-medium text-ink tracking-tight"
          style={{ letterSpacing: '-1.5px' }}
        >
          Drinkable
        </h1>

        <p className="mt-4 text-base sm:text-lg text-inkSoft leading-relaxed">
          Personalized, conversational coffee recommendation from a knowledgeable expert.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="mt-10 bg-sage hover:bg-sageDeep text-white font-medium px-8 py-3.5 rounded-full transition-colors text-base shadow-sm"
        >
          Get started
        </button>
      </div>
    </div>
  );
}

export default SplashScreen;
