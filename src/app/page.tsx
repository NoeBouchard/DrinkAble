export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-white dark:bg-zinc-950">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥤</span>
          <span className="text-xl font-bold text-zinc-900 dark:text-white">
            DrinkAble
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#features"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex flex-col flex-1">
        <section className="flex flex-col items-center justify-center gap-6 px-6 py-24 text-center">
          <span className="text-6xl">🥤</span>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Your personal drink tracker &amp; discovery app
          </h1>
          <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
            Log drinks you love, discover new favourites, and stay on top of
            your hydration — all in one place.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="#"
              className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors"
            >
              Start tracking for free
            </a>
            <a
              href="#features"
              className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-800 transition-colors"
            >
              Learn more
            </a>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="grid grid-cols-1 gap-8 px-6 py-20 sm:grid-cols-3 max-w-4xl mx-auto w-full"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">📝</span>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Log your drinks
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Keep a running diary of everything you drink — from your morning
              coffee to your evening cocktail.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">🔍</span>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Discover new favourites
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Browse a curated catalogue of drinks and get personalised
              recommendations based on your taste.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">💧</span>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Stay hydrated
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Set daily hydration goals and get gentle reminders to keep
              yourself refreshed throughout the day.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-6 text-center text-sm text-zinc-500 dark:text-zinc-500">
        © {new Date().getFullYear()} DrinkAble. All rights reserved.
      </footer>
    </div>
  );
}
