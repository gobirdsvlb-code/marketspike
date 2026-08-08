import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'wouter';
import {
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  Gamepad2,
  GraduationCap,
  Zap,
  BarChart3,
  Users,
  Rocket,
  Shield,
  Star,
  ArrowRight,
  Presentation,
  School,
  Share2,
  Search,
} from 'lucide-react';
import { SpikeMascot } from '@/components/spike-mascot';

interface Slide { id: number; bg: string; render: () => React.ReactNode; }

const slides: Slide[] = [

  // 1 - TITLE / HOOK
  {
    id: 1,
    bg: 'from-[#0f1429] via-[#1a2245] to-[#0f1429]',
    render: () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-4">
        <SpikeMascot className="w-20 h-20 text-[#f5a623]" variant="cool" />
        <div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-2">
            MARKET <span className="text-[#f5a623]">SPIKE</span>
          </h1>
          <p className="text-lg md:text-2xl font-bold text-white/70 max-w-2xl mx-auto">
            The stock market teacher that makes kids{' '}
            <span className="text-[#f5a623] font-black">care about investing.</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-white/20 text-xs font-mono mt-1">
          <span>Investor Pitch</span><span>·</span><span>2026</span><span>·</span><span>by Vaughn Brantley</span>
        </div>
      </div>
    ),
  },

  // 2 - PROBLEM
  {
    id: 2,
    bg: 'from-[#1a0a0a] via-[#2d1010] to-[#1a0a0a]',
    render: () => (
      <div className="flex flex-col justify-center h-full px-10 md:px-20 gap-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 bg-red-500 rounded-full shrink-0" />
          <h2 className="text-4xl md:text-5xl font-black text-white">The Problem</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { stat: '93%', label: 'of U.S high-schoolers receive zero formal financial education', icon: GraduationCap },
            { stat: '72%', label: 'of Gen Z say they wish they learned investing as a kid', icon: Users },
          ].map(({ stat, label, icon: Icon }) => (
            <div key={stat} className="bg-white/5 border border-red-500/20 rounded-2xl p-10 flex flex-col gap-4 justify-center">
              <Icon className="w-8 h-8 text-red-400" />
              <div className="text-5xl font-black text-red-400">{stat}</div>
              <p className="text-white/90 font-semibold text-xl leading-snug">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-base text-white/40 font-medium">
          Existing tools are boring spreadsheets. Schools don't teach it. Kids won't read about it.
        </p>
      </div>
    ),
  },

  // 3 - SOLUTION
  {
    id: 3,
    bg: 'from-[#0a1f0f] via-[#0d2912] to-[#0a1f0f]',
    render: () => (
      <div className="flex flex-col justify-center h-full px-10 md:px-20 gap-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 bg-[#4ade80] rounded-full shrink-0" />
          <h2 className="text-4xl md:text-5xl font-black text-white">Our Solution</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-3">
            <p className="text-xl md:text-2xl font-bold text-white/90 leading-tight">
              A <span className="text-[#4ade80] font-black">gamified investing simulator</span> that
              teaches real market skills through play - not lectures.
            </p>
            <ul className="space-y-2">
              {[
                'Real stocks, real market data - zero real money at risk',
                'XP, levels, lives, streaks - dopamine loops that drive learning',
                'Bite-sized lessons tied directly to in-game rewards',
                'And social leaderboards that create healthy competition',
              ].map(item => (
                <li key={item} className="flex items-start gap-3 text-white/70 text-base font-medium">
                  <Star className="w-4 h-4 text-[#4ade80] mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    ),
  },

  // 4 - HOW IT WORKS
  {
    id: 4,
    bg: 'from-[#0a0f1f] via-[#12183a] to-[#0a0f1f]',
    render: () => (
      <div className="flex flex-col justify-center h-full px-10 md:px-20 gap-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 bg-[#818cf8] rounded-full shrink-0" />
          <h2 className="text-4xl md:text-5xl font-black text-white">How It Works</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { step: '01', title: 'Learn', desc: 'Unlock bite-sized financial lessons with interactive quizzes', icon: GraduationCap, color: 'text-[#818cf8]', border: 'border-[#818cf8]/30' },
            { step: '02', title: 'Play', desc: "Play fun games that seem like those addictive Roblox games, but secretly are teaching you lots.", icon: Gamepad2, color: 'text-[#f5a623]', border: 'border-[#f5a623]/30' },
            { step: '03', title: 'Trade', desc: 'Buy & sell real stocks with virtual cash on live market data', icon: TrendingUp, color: 'text-[#4ade80]', border: 'border-[#4ade80]/30' },
            { step: '04', title: 'Rise', desc: 'Climb leaderboards, earn achievements, level up your investor rank', icon: Rocket, color: 'text-[#f87171]', border: 'border-[#f87171]/30' },
          ].map(({ step, title, desc, icon: Icon, color, border }) => (
            <div key={step} className={`bg-white/5 border ${border} rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden`}>
              <span className={`absolute top-3 right-3 text-3xl font-black opacity-10 ${color}`}>{step}</span>
              <Icon className={`w-6 h-6 ${color}`} />
              <div>
                <div className={`text-base font-black ${color}`}>{title}</div>
                <p className="text-white/60 text-xs font-medium leading-snug mt-1">{desc}</p>
              </div>
              {title === 'Learn' && (
                <img
                  src={`${import.meta.env.BASE_URL}learn-curriculum.png`}
                  alt="Curriculum screen"
                  className="w-full rounded-lg mt-1 opacity-90"
                />
              )}
              {title === 'Play' && (
                <img
                  src={`${import.meta.env.BASE_URL}river-crossing.png`}
                  alt="River Crossing game"
                  className="w-full rounded-lg mt-1 opacity-90"
                />
              )}
              {title === 'Trade' && (
                <img
                  src={`${import.meta.env.BASE_URL}virtual-trading.png`}
                  alt="Virtual Trading screen"
                  className="w-full rounded-lg mt-1 opacity-90"
                />
              )}
              {title === 'Rise' && (
                <img
                  src={`${import.meta.env.BASE_URL}leaderboard.png`}
                  alt="Leaderboard"
                  className="w-full rounded-lg mt-1 opacity-90"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <ArrowRight className="w-4 h-4" />
          <span className="font-medium">Each action feeds back into the next - a self-reinforcing learning loop.</span>
        </div>
      </div>
    ),
  },

  // 5 - FEATURES
  {
    id: 5,
    bg: 'from-[#1a1200] via-[#2a1f00] to-[#1a1200]',
    render: () => (
      <div className="flex flex-col justify-center h-full px-10 md:px-20 gap-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 bg-[#f5a623] rounded-full shrink-0" />
          <h2 className="text-4xl md:text-5xl font-black text-white">Key Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Gamepad2, title: 'Fun Games', desc: 'Timed arcade games where kids dodge overvalued stocks and ride undervalued ones. Earns XP and drives replayability.', colorBg: 'bg-[#f5a623]/10', colorBorder: 'border-[#f5a623]/30', colorText: 'text-[#f5a623]' },
            { icon: BarChart3, title: 'Paper Trading Desk', desc: 'Full buy/sell interface with real price history charts, portfolio tracking, and P&L analytics.', colorBg: 'bg-[#4ade80]/10', colorBorder: 'border-[#4ade80]/30', colorText: 'text-[#4ade80]' },
            { icon: GraduationCap, title: 'Curriculum Engine', desc: 'Structured lessons on stocks, ETFs, risk, and diversification - each gated by XP so learning unlocks gameplay.', colorBg: 'bg-[#818cf8]/10', colorBorder: 'border-[#818cf8]/30', colorText: 'text-[#818cf8]' },
            { icon: Shield, title: 'Achievement System', desc: 'Badges, streaks, daily check-ins, and milestone rewards that keep kids returning every single day.', colorBg: 'bg-[#f87171]/10', colorBorder: 'border-[#f87171]/30', colorText: 'text-[#f87171]' },
          ].map(({ icon: Icon, title, desc, colorBg, colorBorder, colorText }) => (
            <div key={title} className={`flex gap-4 border ${colorBorder} rounded-2xl p-4 bg-white/[0.03]`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorBg}`}>
                <Icon className={`w-5 h-5 ${colorText}`} />
              </div>
              <div>
                <div className={`font-black text-base ${colorText}`}>{title}</div>
                <p className="text-white/60 text-sm font-medium leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 6 - HOW TO GROW
  {
    id: 6,
    bg: 'from-[#001a1f] via-[#002a30] to-[#001a1f]',
    render: () => (
      <div className="flex flex-col justify-center h-full px-10 md:px-20 gap-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 bg-[#22d3ee] rounded-full shrink-0" />
          <h2 className="text-4xl md:text-5xl font-black text-white">How to Grow</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: School,
              title: 'School Partnerships',
              desc: 'District-level deals give teachers a curriculum tool and us bulk accounts — one contract unlocks hundreds of active users overnight.',
              colorBg: 'bg-[#22d3ee]/10',
              colorBorder: 'border-[#22d3ee]/30',
              colorText: 'text-[#22d3ee]',
            },
            {
              icon: Share2,
              title: 'Viral Loops',
              desc: 'Share-your-portfolio cards and leaderboard bragging rights turn every user into a recruiter — growth that compounds without ad spend.',
              colorBg: 'bg-[#4ade80]/10',
              colorBorder: 'border-[#4ade80]/30',
              colorText: 'text-[#4ade80]',
            },
            {
              icon: Search,
              title: 'App Store & SEO',
              desc: '"Stock market for kids" is an under-served keyword. Optimised listings and blog content capture high-intent organic traffic at near-zero cost.',
              colorBg: 'bg-[#818cf8]/10',
              colorBorder: 'border-[#818cf8]/30',
              colorText: 'text-[#818cf8]',
            },
            {
              icon: Users,
              title: 'Creator & Influencer Channel',
              desc: 'Financial-education creators and teen-focused YouTubers already have our audience. Affiliate codes align incentives and drive measurable installs.',
              colorBg: 'bg-[#f5a623]/10',
              colorBorder: 'border-[#f5a623]/30',
              colorText: 'text-[#f5a623]',
            },
          ].map(({ icon: Icon, title, desc, colorBg, colorBorder, colorText }) => (
            <div key={title} className={`flex gap-4 border ${colorBorder} rounded-2xl p-4 bg-white/[0.03]`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorBg}`}>
                <Icon className={`w-5 h-5 ${colorText}`} />
              </div>
              <div>
                <div className={`font-black text-base ${colorText}`}>{title}</div>
                <p className="text-white/60 text-sm font-medium leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 7 - BUSINESS MODEL
  {
    id: 7,
    bg: 'from-[#0f0a1f] via-[#1a1230] to-[#0f0a1f]',
    render: () => (
      <div className="flex flex-col justify-center h-full px-10 md:px-20 gap-5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-12 bg-[#c084fc] rounded-full shrink-0" />
          <h2 className="text-4xl md:text-5xl font-black text-white">Business Model</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              tier: 'FREE',
              price: '$0 / mo',
              features: ['Core trading desk', 'Fun games', '5 lessons', 'Leaderboard'],
              borderColor: 'border-white/20',
              textColor: 'text-white',
              badge: null,
              comingSoon: false,
            },
            {
              tier: 'SPIKE PRO',
              price: '$4.99 / mo',
              features: ['Unlimited lessons', 'Advanced analytics', 'XP multiplier', 'Priority badge', 'Portfolio export'],
              borderColor: 'border-[#c084fc]/60',
              textColor: 'text-[#c084fc]',
              badge: null,
              comingSoon: false,
            },
            {
              tier: 'SCHOOLS',
              price: '$29.99 / mo',
              features: ['Class dashboard', 'Teacher controls', 'Progress reports', 'Custom curriculum', 'Bulk accounts'],
              borderColor: 'border-[#f5a623]/60',
              textColor: 'text-[#f5a623]',
              badge: null,
              comingSoon: true,
            },
            {
              tier: 'SPIKE ELITE',
              price: '$9.99 / mo',
              features: ['Everything in Pro', 'AI coaching', 'Real portfolio insights', 'Early access games', 'Elite badge'],
              borderColor: 'border-[#f87171]/60',
              textColor: 'text-[#f87171]',
              badge: null,
              comingSoon: false,
            },
          ].map(({ tier, price, features, borderColor, textColor, badge, comingSoon }) => (
            <div key={tier} className={`bg-white/5 border ${borderColor} rounded-2xl p-4 flex flex-col gap-3 relative`}>
              {badge && (
                <span className={`absolute -top-3 left-4 px-2 py-0.5 rounded-full text-[10px] font-black ${textColor} bg-[#0f1429] border ${borderColor}`}>
                  {badge}
                </span>
              )}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{tier}</div>
                  {comingSoon && (
                    <span className="text-[9px] font-black uppercase tracking-wide bg-white/10 text-white/40 px-1.5 py-0.5 rounded-full border border-white/10">
                      Soon
                    </span>
                  )}
                </div>
                <div className="text-xl font-black text-white mt-1">{price}</div>
              </div>
              <ul className="space-y-1">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-white/60 text-xs font-medium">
                    <span className={`w-1 h-1 rounded-full shrink-0 ${textColor}`} style={{ background: 'currentColor' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  // 8 - CLOSING
  {
    id: 8,
    bg: 'from-[#0f1429] via-[#1a2245] to-[#0f1429]',
    render: () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-5">
        <div className="w-16 h-16">
          <SpikeMascot className="text-[#f5a623]" variant="cool" />
        </div>
        <div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-3 leading-tight">
            Let's build the next{' '}
            <span className="text-[#f5a623]">generation</span>{' '}
            of investors.
          </h2>
          <p className="text-base text-white/50 font-medium max-w-xl mx-auto">
            Every kid who plays Market Spike today is a confident investor tomorrow.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-1">
          <div className="bg-[#f5a623]/10 border border-[#f5a623]/40 rounded-xl px-7 py-4 text-center">
            <div className="text-[#f5a623] font-black text-xs uppercase tracking-widest">Contact</div>
            <div className="text-white font-bold mt-1 text-sm">vaughnlevibrantley@gmail.com</div>
          </div>
          <div className="bg-white/5 border border-white/20 rounded-xl px-7 py-4 text-center">
            <div className="text-white/40 font-black text-xs uppercase tracking-widest">Play Live</div>
            <div className="text-white font-bold mt-1 text-sm">marketspike.app</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white/20 text-xs font-mono">
          <Zap className="w-3 h-3" />
          <span>Market Spike · Confidential · 2026</span>
        </div>
      </div>
    ),
  },
];

export default function SpeechPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);
  const total = slides.length;

  const go = useCallback((to: number) => {
    if (animating || to === current) return;
    setDirection(to > current ? 'next' : 'prev');
    setAnimating(true);
    setTimeout(() => { setCurrent(to); setAnimating(false); }, 240);
  }, [animating, current]);

  const prev = () => go(Math.max(0, current - 1));
  const next = () => go(Math.min(total - 1, current + 1));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const slide = slides[current];

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br ${slide.bg} transition-colors duration-500 flex flex-col`}>
      <div className="flex items-center justify-between px-6 py-3 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Presentation className="w-4 h-4 text-[#f5a623]" />
          <span className="font-black text-white/50 text-xs tracking-widest uppercase">Market Spike · Pitch</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-white/30 text-xs">{current + 1} / {total}</span>
          <Link href="/home" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white/70" />
          </Link>
        </div>
      </div>

      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? `translateX(${direction === 'next' ? '24px' : '-24px'})` : 'translateX(0)',
          transition: 'opacity 0.24s ease, transform 0.24s ease',
        }}
      >
        <div className="h-full">{slide.render()}</div>
      </div>

      <div className="flex items-center justify-between px-6 py-3 shrink-0 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => go(i)}
              className={`rounded-full transition-all duration-300 ${i === current ? 'w-5 h-1.5 bg-[#f5a623]' : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} disabled={current === 0}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={next} disabled={current === total - 1}
            className="w-9 h-9 rounded-full bg-[#f5a623] hover:bg-[#f5a623]/90 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
