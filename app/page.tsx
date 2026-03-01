import Link from 'next/link';
import { PLAN_DETAILS, type PlanTier } from '@/lib/billing';

/* ─── Inline SVG Icon Components ─────────────────────────────────────── */

function IconCourse() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function IconCommunity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

function IconCoaching() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 16.5v-2.25m-18 0 3-3m0 0 3 3m-3-3v12M21 16.5l-3-3m0 0-3 3m3-3v12M12 3v9m0 0-3-3m3 3 3-3" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

function IconPayments() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline-block ml-1">
      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
    </svg>
  );
}

/* ─── Page Component ─────────────────────────────────────────────────── */

export default function Home() {
  const plans = Object.entries(PLAN_DETAILS) as [PlanTier, typeof PLAN_DETAILS[PlanTier]][];

  return (
    <>
      {/* ── NAV ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[#0D9488]">Kobiza</Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/explore" className="hover:text-gray-900 transition-colors">Explore</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:inline-block">
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-[#0D9488] text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-white overflow-hidden">
        {/* Radial teal glow */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(13,148,136,0.08)_0%,transparent_70%)]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <p className="text-sm font-semibold text-[#0D9488] tracking-wide uppercase mb-4">
                For creators who teach
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
                The <span className="text-[#0D9488]">simplest</span> way to teach, coach, and build community
              </h1>
              <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
                Courses with built-in accountability. Community that keeps learners engaged. Coaching that scales your expertise. One platform, no duct tape.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/signup"
                  className="bg-[#F59E0B] text-white font-bold px-8 py-3.5 rounded-xl text-sm hover:bg-amber-500 transition-colors text-center shadow-lg shadow-amber-500/20"
                >
                  Start creating — it&apos;s free
                </Link>
                <Link
                  href="/explore"
                  className="bg-gray-100 text-gray-700 font-semibold px-8 py-3.5 rounded-xl text-sm hover:bg-gray-200 transition-colors text-center"
                >
                  Explore creators <IconArrowRight />
                </Link>
              </div>
            </div>

            {/* CSS Dashboard Mockup */}
            <div className="hidden lg:block">
              <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl shadow-gray-900/20">
                <div className="flex gap-3">
                  {/* Sidebar */}
                  <div className="w-40 bg-gray-800 rounded-xl p-3 space-y-2">
                    <div className="h-6 w-20 bg-[#0D9488] rounded-md" />
                    <div className="h-3 w-28 bg-gray-700 rounded" />
                    <div className="h-3 w-24 bg-gray-700 rounded" />
                    <div className="h-3 w-20 bg-gray-700 rounded" />
                    <div className="h-3 w-26 bg-gray-700 rounded" />
                    <div className="h-3 w-22 bg-gray-700 rounded" />
                  </div>
                  {/* Main area */}
                  <div className="flex-1 space-y-3">
                    {/* Stat row */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="h-2 w-12 bg-gray-600 rounded mb-2" />
                        <div className="h-5 w-16 bg-[#0D9488] rounded-md" />
                      </div>
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="h-2 w-10 bg-gray-600 rounded mb-2" />
                        <div className="h-5 w-14 bg-[#F59E0B] rounded-md" />
                      </div>
                      <div className="bg-gray-800 rounded-xl p-3">
                        <div className="h-2 w-14 bg-gray-600 rounded mb-2" />
                        <div className="h-5 w-12 bg-[#38BDF8] rounded-md" />
                      </div>
                    </div>
                    {/* Chart placeholder */}
                    <div className="bg-gray-800 rounded-xl p-4">
                      <div className="h-2 w-20 bg-gray-600 rounded mb-3" />
                      <div className="flex items-end gap-1 h-20">
                        {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95].map((h, i) => (
                          <div key={i} className="flex-1 bg-[#0D9488]/60 rounded-t" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    </div>
                    {/* List rows */}
                    <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                      {[1, 2, 3].map((r) => (
                        <div key={r} className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-700 rounded-full" />
                          <div className="h-2 flex-1 bg-gray-700 rounded" />
                          <div className="h-4 w-10 bg-[#0D9488]/40 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────── */}
      <section className="bg-[#F3F4F6] py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '3', label: 'Payment providers', sub: 'Stripe + Paystack + Flutterwave' },
              { value: '2', label: 'Accountability tracks', sub: 'Self-paced & structured' },
              { value: '<5min', label: 'Setup time', sub: 'First course live today' },
              { value: '0%', label: 'Revenue share on Free', sub: 'We only take a platform fee' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-5 text-center shadow-sm">
                <div className="text-3xl font-bold text-[#0D9488] mb-1">{stat.value}</div>
                <div className="text-sm font-semibold text-gray-900 mb-0.5">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              One platform. Zero compromises.
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Everything you need to create, sell, and scale your knowledge business — without stitching five tools together.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <IconCourse />,
                title: 'Courses',
                desc: 'Dual-track courses with self-paced and structured options. Module-by-module delivery with built-in progress tracking.',
              },
              {
                icon: <IconCommunity />,
                title: 'Community',
                desc: 'Discussion spaces, member profiles, and engagement tools. Keep your learners connected and coming back.',
              },
              {
                icon: <IconCoaching />,
                title: 'Coaching',
                desc: 'One-on-one and group coaching sessions with scheduling, calendar sync, and automated reminders.',
              },
              {
                icon: <IconDownload />,
                title: 'Digital Downloads',
                desc: 'Sell ebooks, templates, worksheets, and any digital file. Instant delivery after purchase.',
              },
              {
                icon: <IconAI />,
                title: 'AI-Powered',
                desc: 'AI helps you create course outlines, write copy, and generate content. Build 10x faster with native AI tools.',
              },
              {
                icon: <IconPayments />,
                title: 'Global Payments',
                desc: 'Accept payments via Stripe worldwide, plus Paystack and Flutterwave for African markets. No more lost sales.',
              },
            ].map((feature) => (
              <div key={feature.title} className="border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all">
                <div className="text-[#0D9488] mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACCOUNTABILITY ────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-[#1F2937]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <p className="text-sm font-semibold text-[#0D9488] tracking-wide uppercase mb-4">
                What makes Kobiza different
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
                Accountability changes everything
              </h2>
              <p className="text-gray-400 leading-relaxed mb-4">
                The average online course completion rate is just 5-15%. The reason? Learners are left alone with no structure and no stakes.
              </p>
              <p className="text-gray-400 leading-relaxed mb-6">
                Kobiza lets creators offer a <span className="text-white font-medium">structured accountability track</span> alongside the standard self-paced option. Deadlines, check-ins, and community support turn passive viewers into active learners who actually finish.
              </p>
              <ul className="space-y-3">
                {[
                  'Learners choose their own track at enrollment',
                  'Structured track includes deadlines and check-ins',
                  'Creators can charge a premium for accountability',
                  'Completion rates jump from 10% to 70%+',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                    <IconCheck />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CSS flow diagram */}
            <div className="hidden lg:block">
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#0D9488] text-white text-sm font-bold flex items-center justify-center">1</div>
                    <span className="text-white font-semibold text-sm">Student enrolls</span>
                  </div>
                  <p className="text-gray-400 text-xs ml-11">Chooses self-paced or structured track</p>
                </div>
                {/* Connector */}
                <div className="flex justify-center"><div className="w-px h-6 border-l-2 border-dashed border-gray-600" /></div>
                {/* Step 2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                    <div className="text-xs text-gray-400 mb-1">Self-paced</div>
                    <div className="text-white text-sm font-semibold">Learn at your speed</div>
                    <div className="mt-2 h-1.5 bg-gray-700 rounded-full"><div className="h-full w-1/4 bg-gray-500 rounded-full" /></div>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-4 border border-[#0D9488]/50">
                    <div className="text-xs text-[#0D9488] mb-1">Structured</div>
                    <div className="text-white text-sm font-semibold">Deadlines + check-ins</div>
                    <div className="mt-2 h-1.5 bg-gray-700 rounded-full"><div className="h-full w-3/4 bg-[#0D9488] rounded-full" /></div>
                  </div>
                </div>
                {/* Connector */}
                <div className="flex justify-center"><div className="w-px h-6 border-l-2 border-dashed border-gray-600" /></div>
                {/* Step 3 */}
                <div className="bg-gray-800 rounded-xl p-5 border border-[#F59E0B]/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-white text-sm font-bold flex items-center justify-center">3</div>
                    <span className="text-white font-semibold text-sm">Course completed</span>
                  </div>
                  <div className="flex gap-6 ml-11 text-xs">
                    <div>
                      <div className="text-gray-400">Self-paced</div>
                      <div className="text-gray-300 font-semibold">~10% finish</div>
                    </div>
                    <div>
                      <div className="text-[#0D9488]">Structured</div>
                      <div className="text-[#0D9488] font-semibold">~70% finish</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Live in minutes, not months
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Go from idea to accepting payments in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-0 items-start">
            {[
              {
                step: '1',
                title: 'Create your community',
                desc: 'Sign up, name your space, and customize your brand. It takes less than two minutes.',
              },
              {
                step: '2',
                title: 'Add your content',
                desc: 'Upload courses, schedule coaching, or list digital downloads. AI helps you build faster.',
              },
              {
                step: '3',
                title: 'Start earning',
                desc: 'Connect your payment provider, set your price, and share your link. Get paid instantly.',
              },
            ].map((item, idx) => (
              <div key={item.step} className="relative text-center px-6 py-4">
                {/* Dashed connector (not on last) */}
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+40px)] w-[calc(100%-80px)] border-t-2 border-dashed border-gray-200" />
                )}
                <div className="w-14 h-14 rounded-full bg-[#0D9488]/10 text-[#0D9488] text-xl font-bold flex items-center justify-center mx-auto mb-4 relative z-10">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 bg-[#F3F4F6]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple pricing. Start free.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              No hidden fees. Upgrade when you&apos;re ready. Downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map(([tier, plan]) => {
              const isPopular = plan.highlight;
              const isPro = tier === 'PRO';

              return (
                <div
                  key={tier}
                  className={`rounded-2xl p-6 flex flex-col ${
                    isPro
                      ? 'bg-[#1F2937] text-white'
                      : isPopular
                        ? 'bg-white ring-2 ring-[#0D9488] shadow-lg'
                        : 'bg-white shadow-sm'
                  }`}
                >
                  {isPopular && (
                    <span className="inline-block self-start text-xs font-semibold bg-[#0D9488] text-white px-3 py-1 rounded-full mb-3">
                      Most Popular
                    </span>
                  )}
                  <h3 className={`text-lg font-bold mb-1 ${isPro ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-4">
                    <span className={`text-3xl font-bold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price.split('/')[0]}
                    </span>
                    <span className={`text-sm ${isPro ? 'text-gray-400' : 'text-gray-500'}`}>
                      /month
                    </span>
                  </div>
                  <p className={`text-sm mb-5 ${isPro ? 'text-gray-400' : 'text-gray-500'}`}>
                    {plan.fee} platform fee
                  </p>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {tier === 'FREE' && (
                      <>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>1 community</span></li>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Unlimited courses</span></li>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Community features</span></li>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Digital downloads</span></li>
                      </>
                    )}
                    {tier === 'STARTER' && (
                      <>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Up to 3 communities</span></li>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Everything in Free</span></li>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Coaching sessions</span></li>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Lower platform fees</span></li>
                      </>
                    )}
                    {tier === 'PRO' && (
                      <>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Unlimited communities</span></li>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Everything in Starter</span></li>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>AI content tools</span></li>
                        <li className="flex items-start gap-2 text-sm"><IconCheck /><span>Lowest platform fees</span></li>
                      </>
                    )}
                  </ul>
                  <Link
                    href="/signup"
                    className={`block text-center text-sm font-semibold py-3 rounded-xl transition-colors ${
                      isPro
                        ? 'bg-white text-gray-900 hover:bg-gray-100'
                        : isPopular
                          ? 'bg-[#0D9488] text-white hover:bg-teal-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tier === 'FREE' ? 'Get started free' : `Start with ${plan.name}`}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PAYMENTS ──────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Accept payments from anywhere
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Reach customers worldwide with Stripe, or serve African markets natively with Paystack and Flutterwave. Your students pay the way they prefer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Stripe */}
            <div className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#635BFF]/10 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#635BFF]" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Stripe</h3>
              <p className="text-sm text-gray-500">
                Cards, Apple Pay, Google Pay, and 100+ payment methods. Available in 46+ countries with instant payouts.
              </p>
            </div>
            {/* Paystack & Flutterwave */}
            <div className="border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center mb-4">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#0D9488]" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A8.966 8.966 0 0 1 3 12c0-1.264.26-2.467.732-3.558" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Paystack & Flutterwave</h3>
              <p className="text-sm text-gray-500">
                Mobile money, bank transfers, and local cards across Africa. Reach the markets that other platforms miss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-[#0D9488] to-[#0F766E]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your knowledge deserves a platform
          </h2>
          <p className="text-teal-100 text-lg mb-8 max-w-xl mx-auto">
            Join creators who are building thriving education businesses. Start for free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="bg-[#F59E0B] text-white font-bold px-10 py-4 rounded-xl text-sm hover:bg-amber-500 transition-colors shadow-lg shadow-black/10"
            >
              Start creating — it&apos;s free
            </Link>
            <Link
              href="/explore"
              className="bg-white/10 text-white font-semibold px-10 py-4 rounded-xl text-sm hover:bg-white/20 transition-colors backdrop-blur-sm"
            >
              Explore creators <IconArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="bg-[#1F2937] py-14">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-xl font-bold text-[#0D9488]">Kobiza</Link>
              <p className="text-sm text-gray-400 mt-2 max-w-xs">
                The simplest way to teach, coach, and build community. Made for creators everywhere.
              </p>
            </div>
            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/explore" className="hover:text-white transition-colors">Explore</Link></li>
              </ul>
            </div>
            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Kobiza. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
