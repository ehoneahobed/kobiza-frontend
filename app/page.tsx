import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1F2937] flex flex-col">
      {/* Nav */}
      <header className="px-8 py-5 flex items-center justify-between">
        <span className="text-2xl font-bold text-[#0D9488]">Kobiza</span>
        <div className="flex items-center gap-3">
          <Link href="/explore" className="text-sm text-white/60 hover:text-white transition-colors">
            Explore
          </Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-[#0D9488] text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-20">
        <div className="inline-flex items-center gap-2 bg-[#0D9488]/20 text-[#0D9488] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <span>✦</span>
          <span>Africa-first. Globally-built.</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-5 max-w-2xl leading-tight tracking-tight">
          Build your creator business with{' '}
          <span className="text-[#0D9488]">accountability</span>
        </h1>

        <p className="text-lg text-white/60 max-w-xl mx-auto mb-10">
          Courses, communities, coaching &amp; downloadables — all in one place.
          The only platform where learners choose a real accountability track.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="bg-[#F59E0B] text-white font-bold px-8 py-3.5 rounded-xl text-sm hover:bg-amber-500 transition-colors"
          >
            Start creating — it's free
          </Link>
          <Link
            href="/explore"
            className="bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl text-sm hover:bg-white/20 transition-colors"
          >
            Explore creators →
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center mt-10">
          {[
            '⚡ Accountability Coaching',
            '🌍 Paystack & Flutterwave',
            '🎓 Dual-track Courses',
            '👥 Community Hub',
            '📥 Downloadables',
            '📅 Coaching Sessions',
          ].map((f) => (
            <span key={f} className="text-xs bg-white/10 text-white/60 px-3 py-1.5 rounded-full">
              {f}
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
