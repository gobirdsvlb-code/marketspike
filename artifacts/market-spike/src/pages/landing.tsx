import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useClerk, useUser } from '@clerk/react';
import { Shield, Zap, Users, Star, CheckCircle } from 'lucide-react';

const TICKER_ITEMS = [
  '📈 S&P 500: +10% avg annual return since 1957',
  '💰 Warren Buffett bought his first stock at age 11',
  '🌍 $30 TRILLION wealth transfer underway',
  '📊 Only 57% of Americans are financially literate',
  '🚀 Starting at 10 vs 30 = $1M+ difference at retirement',
  '🏆 90% of millionaires built wealth through stocks or real estate',
  '💼 Average millionaire has 7 streams of income',
];

const STEPS = [
  {
    step: '01',
    title: 'Learn',
    color: 'text-indigo-400',
    border: 'border-indigo-500/30',
    bg: 'bg-indigo-500/10',
    desc: 'Bite-sized interactive lessons covering stocks, ETFs, compound interest, diversification, and real investor strategies — no textbook jargon.',
  },
  {
    step: '02',
    title: 'Practice',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    desc: 'Apply what you learn through real-world financial challenges and scenario-based quests. Kids make decisions, see outcomes, and level up their skills — with no real-world risk.',
  },
  {
    step: '03',
    title: 'Compete',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    desc: 'A global leaderboard, XP system, and achievement badges keep kids engaged and coming back. Friendly competition builds the discipline and habits that last a lifetime.',
  },
];

const CHART_DATA = [
  { age: 10, label: '$2.8M', height: 100, color: 'from-indigo-500 to-indigo-400' },
  { age: 20, label: '$1.05M', height: 38, color: 'from-emerald-500 to-emerald-400' },
  { age: 30, label: '$390K', height: 14, color: 'from-slate-500 to-slate-400' },
];

const SOURCES = [
  { label: 'Berkshire Hathaway Annual Report', stat: 'Warren Buffett at 11' },
  { label: 'Cerulli Associates', stat: '90% millionaires — stocks/real estate' },
  { label: 'NBER Working Paper', stat: '$30T wealth transfer' },
  { label: 'IRS Tax Statistics', stat: '7 income streams' },
  { label: 'Compound Interest Analysis', stat: '10 vs 30: $1M+ difference' },
  { label: 'Fidelity Investments Study', stat: '57% financial literacy gap' },
];

const TESTIMONIALS = [
  {
    name: 'Jennifer M.',
    location: 'Austin, TX',
    stars: 5,
    quote:
      "My 13-year-old was asking me about compound interest and diversification at dinner. Three months ago he had zero interest in money. Market Spike completely changed how he thinks about his future.",
  },
  {
    name: 'David & Priya K.',
    location: 'Seattle, WA',
    stars: 5,
    quote:
      "We're both finance professionals and we struggled to make financial education engaging for our daughter. Market Spike figured it out in a week. She's hooked — and the concepts she's absorbing are real.",
  },
  {
    name: 'Coach Marcus T.',
    location: 'Chicago, IL',
    stars: 5,
    quote:
      'I run an after-school program for 50+ kids. Market Spike became our Friday reward. The leaderboard competition is fierce. These kids are building financial knowledge and habits that will last a lifetime.',
  },
];

function Ticker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="w-full overflow-hidden bg-amber-400/10 border-y border-amber-400/20 py-2.5">
      <motion.div
        className="flex gap-12 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((item, i) => (
          <span key={i} className="text-amber-300 text-sm font-semibold tracking-wide flex-shrink-0">
            {item}
            <span className="mx-6 text-amber-600">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

function Navbar({ onGetStarted }: { onGetStarted: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60 shadow-lg' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a
          href="#"
          className="flex items-center gap-2.5 no-underline"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        >
          <img src="/logo.svg" alt="Market Spike" className="w-9 h-9 rounded-xl" />
          <span className="font-black text-white text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Market Spike
          </span>
        </a>
        <button
          onClick={onGetStarted}
          className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-amber-400/25 cursor-pointer border-0"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Get Started Free
        </button>
      </div>
    </header>
  );
}

function HeroSection({ onGetStarted, onGuest }: { onGetStarted: () => void; onGuest: () => void }) {
  return (
    <section className="relative min-h-screen flex flex-col pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15),transparent_60%)]" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <svg className="absolute bottom-0 right-0 w-3/4 h-auto" viewBox="0 0 600 400" fill="none">
          <path d="M50 350 L150 200 L250 280 L350 120 L450 220 L550 80" stroke="#6366f1" strokeWidth="2" fill="none" />
          <path d="M50 380 L150 240 L250 310 L350 160 L450 260 L550 120" stroke="#f59e0b" strokeWidth="1.5" fill="none" opacity="0.5" />
        </svg>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-8"
        >
          <Zap className="w-4 h-4 text-indigo-400" />
          <span className="text-indigo-300 text-sm font-semibold">For Parents, Guardians & Educators</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black leading-[1.05] mb-6 tracking-tight text-white"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          The World's Wealthiest
          <br />
          Investors Started Young.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
            Will Yours?
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-300 text-xl md:text-2xl max-w-3xl mb-10 leading-relaxed"
        >
          Market Spike is a gamified financial education platform where kids earn XP, unlock achievements,
          and master money skills through interactive lessons and real-world challenges — all completely free.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={onGetStarted}
            className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-lg px-8 py-4 rounded-2xl transition-all shadow-2xl shadow-amber-400/30 cursor-pointer border-0"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Get Started Free
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          <button
            onClick={onGuest}
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all cursor-pointer"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Play as Guest
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-slate-400 text-sm"
        >
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Zero financial risk</span>
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
  );
}

function HowItWorks() {
  return (
    <section className="relative py-24 px-6 bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl md:text-5xl font-black mb-4 text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            How{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              Market Spike
            </span>{' '}
            Works
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Three steps from financial novice to confident young investor.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className={`relative rounded-2xl border p-8 flex flex-col gap-4 overflow-hidden ${s.bg} ${s.border}`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-4xl font-black leading-none ${s.color}`} style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {s.step}
                </span>
              </div>
              <h3
                className={`text-2xl font-black ${s.color}`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {s.title}
              </h3>
              <p className="text-slate-300 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CompoundChart() {
  return (
    <section className="relative py-24 px-6 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <h2
            className="text-4xl md:text-5xl font-black mb-4 text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Why Starting{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
              Early Matters
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Time is the most powerful variable in wealth-building. The earlier your child starts, the steeper the advantage.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12"
        >
          {/* Chart */}
          <div className="flex justify-center gap-8 mb-2">
            {CHART_DATA.map((d) => (
              <div key={d.age} className="w-20 text-center text-white font-black text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {d.label}
              </div>
            ))}
          </div>
          <div className="flex items-end justify-center gap-8 h-48">
            {CHART_DATA.map((d, i) => (
              <div key={d.age} className="w-20 bg-slate-800 rounded-t-xl overflow-hidden" style={{ height: '100%' }}>
                <motion.div
                  className={`w-full rounded-t-xl bg-gradient-to-t ${d.color}`}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${d.height}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, delay: i * 0.15, ease: 'easeOut' }}
                  style={{ marginTop: 'auto' }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-3">
            {CHART_DATA.map((d) => (
              <div key={d.age} className="w-20 text-center">
                <div className="text-white font-black text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Age {d.age}
                </div>
                <div className="text-slate-400 text-xs">Starts investing</div>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Assumes 10% annual return (S&P 500 historical average). For illustrative purposes only.
          </p>
        </motion.div>

        {/* Sources ticker */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
          {SOURCES.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3"
            >
              <p className="text-slate-300 text-xs font-semibold">{s.stat}</p>
              <p className="text-slate-600 text-xs mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="relative py-24 px-6 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <h2
            className="text-4xl md:text-5xl font-black mb-4 text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Why Parents{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              Love It
            </span>
          </h2>
          <p className="text-slate-400 text-lg">Real results from families who gave their kids the edge.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
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
              <p className="text-slate-200 leading-relaxed italic flex-1">"{t.quote}"</p>
              <div>
                <p className="text-white font-black text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {t.name}
                </p>
                <p className="text-slate-500 text-sm">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.2),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-3xl mx-auto text-center"
      >
        <div className="text-6xl mb-6">🐂</div>
        <h2
          className="text-4xl md:text-6xl font-black mb-6 leading-tight text-white"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Give Your Child the
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
            Financial Edge
          </span>
        </h2>
        <p className="text-slate-300 text-xl mb-10 leading-relaxed">
          The best time to plant a tree was 20 years ago. The second best time is today.
          Start your child's financial education — completely free.
        </p>

        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xl px-10 py-5 rounded-2xl transition-all shadow-2xl shadow-amber-400/30 cursor-pointer border-0"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Create Free Account
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Free forever</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Start in 60 seconds</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Market Spike" className="w-8 h-8 rounded-lg" />
          <span className="font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Market Spike
          </span>
        </div>
        <p className="text-slate-500 text-xs">
          © {new Date().getFullYear()} Market Spike. Learn. Level Up. Win.
        </p>
        <p className="text-slate-600 text-sm">
          <a href="/sign-in" className="text-slate-500 hover:text-white transition-colors">
            Sign In
          </a>
        </p>
      </div>
    </footer>
  );
}

export default function Landing() {
  const [, navigate] = useLocation();
  const { openSignIn } = useClerk();
  const { isSignedIn } = useUser();

  const handleGetStarted = () => {
    if (isSignedIn) {
      navigate('/home');
    } else {
      openSignIn({ redirectUrl: window.location.origin + (import.meta.env.BASE_URL || '/') + 'home' });
    }
  };

  const handleGuest = () => {
    localStorage.setItem('spike_guest_mode', 'true');
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar onGetStarted={handleGetStarted} />
      <Ticker />
      <HeroSection onGetStarted={handleGetStarted} onGuest={handleGuest} />
      <HowItWorks />
      <CompoundChart />
      <Testimonials />
      <CTASection onGetStarted={handleGetStarted} />
      <Footer />
    </div>
  );
}
