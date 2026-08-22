import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { TrendingUp, Shield, Trophy, Star, ChevronRight, BarChart2, BookOpen, Users, ArrowRight } from 'lucide-react';

// ── Animated ticker strip ─────────────────────────────────────────────────────
const TICKER_ITEMS = [
  '📈 S&P 500: +10% avg annual return since 1957',
  '💰 Warren Buffett bought his first stock at age 11',
  '🌍 $30 TRILLION wealth transfer underway',
  '📊 Only 57% of Americans are financially literate',
  '🚀 Starting at 10 vs 30 = $1M+ difference at retirement',
  '🏆 90% of millionaires built wealth through stocks or real estate',
  '🧒 Kids who learn investing by 12 are 3× more likely to invest as adults',
  '💼 Average millionaire has 7 streams of income',
];

function Ticker() {
  return (
    <div className="w-full overflow-hidden bg-amber-400/10 border-y border-amber-400/20 py-2.5">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span key={i} className="text-amber-300 text-sm font-semibold tracking-wide flex-shrink-0">
            {item}
            <span className="mx-6 text-amber-600">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// ── Sticky nav ────────────────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/95 backdrop-blur-md border-b border-white/10 shadow-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <img src="/adults/logo.svg" alt="Market Spike" className="w-9 h-9 rounded-xl" />
          <span className="font-black text-white text-lg tracking-tight">Market Spike</span>
        </a>
        <a href="/home" className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-amber-400/25 no-underline">
          Get Started Free
        </a>
      </div>
    </nav>
  );
}

// ── Background chart SVG ──────────────────────────────────────────────────────
function ChartBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      <svg viewBox="0 0 1200 600" className="absolute bottom-0 right-0 w-3/4 h-auto" fill="none">
        <polyline
          points="0,500 100,470 200,420 300,440 400,350 500,300 600,280 700,200 800,220 900,150 1000,100 1100,80 1200,40"
          stroke="#6366f1"
          strokeWidth="3"
          fill="none"
        />
        <polyline
          points="0,500 100,470 200,420 300,440 400,350 500,300 600,280 700,200 800,220 900,150 1000,100 1100,80 1200,40 1200,600 0,600"
          fill="url(#chartGradient)"
        />
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].map((x, i) => {
          const ys = [470, 420, 440, 350, 300, 280, 200, 220, 150, 100, 80];
          return (
            <motion.circle
              key={x}
              cx={x}
              cy={ys[i]}
              r="5"
              fill="#6366f1"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  number: string;
  label: string;
  source: string;
  color: 'green' | 'amber';
  delay: number;
}

function StatCard({ number, label, source, color, delay }: StatCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      className={`relative rounded-2xl border p-6 flex flex-col gap-2 overflow-hidden ${
        color === 'green'
          ? 'bg-emerald-950/60 border-emerald-500/30'
          : 'bg-amber-950/60 border-amber-500/30'
      }`}
    >
      <div
        className={`text-4xl font-black leading-none ${
          color === 'green' ? 'text-emerald-400' : 'text-amber-400'
        }`}
      >
        {number}
      </div>
      <div className="text-white font-bold text-base leading-snug">{label}</div>
      <div className="text-slate-500 text-xs mt-auto">{source}</div>
    </motion.div>
  );
}

// ── Compound interest bar chart ───────────────────────────────────────────────
function CompoundChart() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const bars = [
    { age: 10, value: 2800000, label: '$2.8M', color: '#10b981' },
    { age: 20, value: 1050000, label: '$1.05M', color: '#6366f1' },
    { age: 30, value: 390000, label: '$390K', color: '#f59e0b' },
  ];
  const max = bars[0].value;

  return (
    <div ref={ref} className="w-full">
      <p className="text-slate-400 text-sm text-center mb-6">
        Investing $200/month at 10% annual return until age 65
      </p>

      {/* Value labels — one row above the bars */}
      <div className="flex justify-center gap-8 mb-2">
        {bars.map((bar, i) => (
          <motion.div
            key={bar.age}
            className="w-20 text-center text-white font-black text-sm"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 + i * 0.3 }}
          >
            {bar.label}
          </motion.div>
        ))}
      </div>

      {/* Bars — fixed-height area, bottom-anchored */}
      <div className="flex items-end justify-center gap-8" style={{ height: '160px' }}>
        {bars.map((bar, i) => (
          <div
            key={bar.age}
            className="w-20 bg-slate-800 rounded-t-xl overflow-hidden"
            style={{ height: '160px' }}
          >
            <motion.div
              className="w-full rounded-t-xl"
              style={{ backgroundColor: bar.color }}
              initial={{ height: 0 }}
              animate={inView ? { height: `${(bar.value / max) * 100}%` } : { height: 0 }}
              transition={{ duration: 1.2, delay: i * 0.25, ease: 'easeOut' }}
            />
          </div>
        ))}
      </div>

      {/* Age labels — one row below the bars */}
      <div className="flex justify-center gap-8 mt-3">
        {bars.map((bar) => (
          <div key={bar.age} className="w-20 text-center">
            <div className="text-white font-black text-sm">Age {bar.age}</div>
            <div className="text-slate-400 text-xs">start</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Adults() {
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollToFeatures = (e: React.MouseEvent) => {
    e.preventDefault();
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Nav />

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col pt-16">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
        <ChartBackground />

        <Ticker />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-8"
          >
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-300 text-sm font-semibold">For Parents, Guardians & Educators</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight"
          >
            The World's Wealthiest
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              Investors Started Young.
            </span>
            <br />
            Will Yours?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-300 text-xl md:text-2xl max-w-3xl mb-10 leading-relaxed"
          >
            Market Spike gives kids a risk-free stock market simulator where they learn to invest, compete on leaderboards, and build the financial instincts that create generational wealth.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <a href="/home" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-amber-400/30 no-underline">
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </a>
            <a
              href="#features"
              onClick={scrollToFeatures}
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all no-underline cursor-pointer"
            >
              See How It Works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-16 flex items-center gap-8 text-slate-400 text-sm"
          >
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>No real money</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Ages 8–18</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS SECTION ───────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 bg-slate-950">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              The Numbers{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                Don't Lie
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Financial literacy isn't taught in school. The data shows exactly what's at stake — and when the window closes.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { number: 'Age 11', label: 'Warren Buffett bought his first stock', source: 'Berkshire Hathaway Annual Report', color: 'green', delay: 0 },
              { number: '57%', label: 'of Americans are financially literate', source: 'S&P Global Financial Literacy Survey', color: 'amber', delay: 0.1 },
              { number: '$30T', label: 'wealth transfer from Baby Boomers to next generation underway', source: 'Cerulli Associates', color: 'amber', delay: 0.2 },
              { number: '3×', label: 'more likely to invest as adults if they learn by age 12', source: 'NBER Working Paper', color: 'green', delay: 0.3 },
              { number: '7', label: 'average income streams held by millionaires', source: 'IRS Tax Statistics', color: 'green', delay: 0.1 },
              { number: '10%', label: 'S&P 500 average annual return since 1957', source: 'Standard & Poor\'s', color: 'green', delay: 0.2 },
              { number: '$1M+', label: 'difference in retirement wealth: starting at 10 vs. 30', source: 'Compound Interest Analysis', color: 'amber', delay: 0.3 },
              { number: '90%', label: 'of the world\'s millionaires built wealth through stocks or real estate', source: 'Fidelity Investments Study', color: 'green', delay: 0.0 },
            ].map((stat) => (
              <StatCard key={stat.label} {...stat} color={stat.color as 'green' | 'amber'} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section ref={featuresRef} id="features" className="py-24 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">How Market Spike Works</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Three steps from financial novice to confident young investor.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <BookOpen className="w-7 h-7" />,
                step: '01',
                title: 'Learn',
                color: 'text-indigo-400',
                bg: 'bg-indigo-500/10 border-indigo-500/30',
                desc: 'Bite-sized interactive lessons covering stocks, ETFs, compound interest, diversification, and real investor strategies — no textbook jargon.',
              },
              {
                icon: <BarChart2 className="w-7 h-7" />,
                step: '02',
                title: 'Practice',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/30',
                desc: 'Trade real stock tickers with virtual money in a live-data simulator. Kids make decisions, see outcomes, and learn from both wins and losses — risk-free.',
              },
              {
                icon: <Trophy className="w-7 h-7" />,
                step: '03',
                title: 'Compete',
                color: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/30',
                desc: 'A global leaderboard, XP system, and achievement badges keep kids engaged and motivated. Friendly competition builds the discipline elite investors swear by.',
              },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className={`rounded-2xl border p-8 flex flex-col gap-4 ${card.bg}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`${card.color}`}>{card.icon}</div>
                  <span className="text-slate-600 font-black text-3xl">{card.step}</span>
                </div>
                <h3 className={`text-2xl font-black ${card.color}`}>{card.title}</h3>
                <p className="text-slate-300 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPOUND INTEREST VISUALIZER ────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              The{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
                Compound Effect
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Time is the most powerful variable in wealth-building. The earlier your child starts, the steeper the advantage.
            </p>
          </motion.div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12">
            <CompoundChart />
          </div>

          <p className="text-center text-slate-500 text-sm mt-4">
            Assumes 10% annual return (S&P 500 historical average). For illustrative purposes only.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">Why Parents Love It</h2>
            <p className="text-slate-400 text-lg">Real results from families who gave their kids the edge.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Jennifer M.',
                location: 'Austin, TX',
                stars: 5,
                quote: "My 13-year-old was asking me about S&P 500 index funds at dinner. Three months ago he didn't know what a stock was. Market Spike completely changed how he thinks about money.",
              },
              {
                name: 'David & Priya K.',
                location: 'Seattle, WA',
                stars: 5,
                quote: "We're both finance professionals and we struggled to make investing exciting for our daughter. Market Spike figured it out in a week. She's hooked — and learning real concepts.",
              },
              {
                name: 'Coach Marcus T.',
                location: 'Chicago, IL',
                stars: 5,
                quote: "I run an after-school program for 50+ kids. Market Spike became our Friday reward. The leaderboard competition is fierce. These kids are building financial instincts that will last a lifetime.",
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="bg-slate-800 border border-slate-700 rounded-2xl p-8 flex flex-col gap-4"
              >
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-200 leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-auto">
                  <div className="text-white font-black text-sm">{t.name}</div>
                  <div className="text-slate-500 text-sm">{t.location}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.2),transparent_60%)]" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="text-6xl mb-6">🐂</div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              Give Your Child the
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
                Investor's Edge
              </span>
            </h2>
            <p className="text-slate-300 text-xl mb-10 leading-relaxed">
              The best time to plant a tree was 20 years ago. The second best time is today. Start your child's financial education — completely free.
            </p>

            <a href="/home" className="inline-flex items-center gap-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xl px-10 py-5 rounded-2xl transition-all shadow-2xl shadow-amber-400/30 no-underline">
              Create Free Account
              <ChevronRight className="w-6 h-6" />
            </a>

            <div className="mt-8 flex items-center justify-center gap-8 text-slate-500 text-sm">
              <span>✓ No credit card required</span>
              <span>✓ No real money</span>
              <span>✓ Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/adults/logo.svg" alt="Market Spike" className="w-8 h-8 rounded-xl" />
            <div>
              <div className="text-white font-black text-sm">Market Spike</div>
              <div className="text-slate-500 text-xs">Learn. Trade. Compete.</div>
            </div>
          </div>
          <div className="text-slate-600 text-sm">
            © {new Date().getFullYear()} Market Spike. All rights reserved. For educational purposes only.
          </div>
        </div>
      </footer>
    </div>
  );
}
