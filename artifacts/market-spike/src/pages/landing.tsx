import { useState } from 'react';
import { useLocation } from 'wouter';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useClerk, useUser } from '@clerk/react';
import {
  BookOpen,
  Check,
  Coins,
  Crown,
  Flame,
  Heart,
  Lock,
  Star,
  TrendingUp,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { SpikeMascot } from '@/components/spike-mascot';

const spring = { type: 'spring', stiffness: 380, damping: 18 } as const;

const reveal = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { type: 'spring', stiffness: 160, damping: 20 },
} as const;

type Go = { start: () => void; guest: () => void; signIn: () => void };

/* ------------------------------------------------------------------ */
/* Nav                                                                  */
/* ------------------------------------------------------------------ */

function Nav({ go }: { go: Go }) {
  return (
    <header className="sticky top-0 z-50 bg-background border-b-2 border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 no-underline">
          <img src="/logo.svg" alt="" className="w-9 h-9 rounded-xl" />
          <span className="font-display font-bold text-2xl text-primary tracking-tight">market spike</span>
        </a>
        <div className="flex items-center gap-3">
          <button onClick={go.signIn} className="btn-3d is-outline px-4 py-2 text-xs hidden sm:inline-flex [--lift:3px]">
            I already have an account
          </button>
          <button onClick={go.start} className="btn-3d px-5 py-2.5 text-xs [--lift:3px]">
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

function Sticker({
  className,
  delay,
  children,
}: {
  className: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className={`absolute card-3d !rounded-2xl px-3.5 py-2 flex items-center gap-2 font-extrabold text-sm ${className}`}
      initial={{ scale: 0, rotate: -12 }}
      animate={{ scale: 1, rotate: 0, y: [0, -8, 0] }}
      transition={{
        scale: { ...spring, delay: 0.5 + delay },
        rotate: { ...spring, delay: 0.5 + delay },
        y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay },
      }}
    >
      {children}
    </motion.div>
  );
}

function Hero({ go }: { go: Go }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-16 md:pt-20 md:pb-28 grid md:grid-cols-2 gap-10 md:gap-6 items-center">
      <div className="relative mx-auto w-full max-w-[420px] aspect-square order-1">
        <div className="absolute inset-[6%] rounded-full bg-tint" />
        <motion.div
          className="absolute inset-[14%]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
          transition={{
            scale: spring,
            opacity: { duration: 0.2 },
            y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 },
          }}
        >
          <SpikeMascot variant="happy" />
        </motion.div>
        <Sticker className="top-[8%] left-[0%]" delay={0}>
          <Zap className="w-4 h-4 text-accent fill-accent" /> +50 XP
        </Sticker>
        <Sticker className="top-[34%] right-[-2%]" delay={0.4}>
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" /> 7 day streak
        </Sticker>
        <Sticker className="bottom-[10%] left-[2%]" delay={0.8}>
          <Coins className="w-4 h-4 text-accent" /> 1,250
        </Sticker>
        <Sticker className="bottom-[16%] right-[4%]" delay={1.2}>
          <TrendingUp className="w-4 h-4 text-gain" /> <span className="text-gain">+4.2%</span>
        </Sticker>
      </div>

      <div className="text-center md:text-left order-2">
        <motion.h1
          {...reveal}
          className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] text-foreground"
        >
          The free, fun way to learn how money works
        </motion.h1>
        <motion.p
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.08 }}
          className="mt-5 text-lg text-muted-foreground font-medium max-w-md mx-auto md:mx-0"
        >
          Five-minute lessons, a practice market with pretend cash, and a leaderboard to race your friends.
          Ages 8 and up.
        </motion.p>
        <motion.div
          {...reveal}
          transition={{ ...reveal.transition, delay: 0.16 }}
          className="mt-8 flex flex-col gap-4 w-full max-w-xs mx-auto md:mx-0"
        >
          <button onClick={go.start} className="btn-3d py-4 text-base">
            Get started
          </button>
          <button onClick={go.guest} className="btn-3d is-outline py-4 text-base">
            Play as guest
          </button>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Try a lesson: the page's one big idea                                */
/* ------------------------------------------------------------------ */

const QUESTIONS = [
  {
    q: 'What does owning a share of a company mean?',
    options: ['You lent the company money', 'You own a small piece of it', 'You now work there'],
    answer: 1,
    why: 'A share is a slice of ownership. If the company grows, your slice is worth more.',
  },
  {
    q: 'An index fund holds…',
    options: ['One very risky stock', 'Only savings accounts', 'Hundreds of stocks at once'],
    answer: 2,
    why: 'Spreading money across many companies means one bad apple cannot sink you.',
  },
  {
    q: 'Why does starting early help your savings?',
    options: ['Growth has more time to stack up', 'Banks pay kids extra', 'Stocks never go down'],
    answer: 0,
    why: 'Growth earns growth. The longer money sits, the faster the pile gets bigger.',
  },
];

function TryLesson({ go }: { go: Go }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [xp, setXp] = useState(0);
  const done = i >= QUESTIONS.length;
  const q = QUESTIONS[Math.min(i, QUESTIONS.length - 1)];
  const correct = checked && picked === q.answer;

  const check = () => {
    if (picked === null) return;
    setChecked(true);
    if (picked === q.answer) setXp((x) => x + 10);
    else setHearts((h) => Math.max(0, h - 1));
  };
  const next = () => {
    setI((n) => n + 1);
    setPicked(null);
    setChecked(false);
  };
  const restart = () => {
    setI(0);
    setPicked(null);
    setChecked(false);
    setHearts(3);
    setXp(0);
  };

  return (
    <section className="bg-tint border-y-2 border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-5 gap-10 items-center">
        <motion.div {...reveal} className="md:col-span-2 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-bold text-primary">try a lesson</h2>
          <p className="mt-4 text-lg text-muted-foreground font-medium">
            This is how every lesson works: one question, one tap, instant feedback. No sign-up needed.
          </p>
        </motion.div>

        <motion.div {...reveal} className="md:col-span-3">
          <div className="card-3d overflow-hidden">
            {/* top bar */}
            <div className="flex items-center gap-4 px-5 pt-5">
              <div className="flex-1 h-4 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gain"
                  animate={{ width: `${(Math.min(i + (checked ? 1 : 0), QUESTIONS.length) / QUESTIONS.length) * 100}%` }}
                  transition={spring}
                />
              </div>
              <div className="flex items-center gap-1 font-extrabold text-loss">
                <Heart className="w-6 h-6 fill-loss" />
                {hearts}
              </div>
            </div>

            <div className="relative min-h-[430px] flex flex-col">
              <AnimatePresence mode="wait" initial={false}>
                {!done ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.18 }}
                    className="px-5 pt-8 pb-4 flex-1"
                  >
                    <h3 className="text-2xl font-bold text-foreground">{q.q}</h3>
                    <div className="mt-6 flex flex-col gap-3">
                      {q.options.map((o, idx) => {
                        const sel = picked === idx;
                        const showRight = checked && idx === q.answer;
                        const showWrong = checked && sel && idx !== q.answer;
                        return (
                          <motion.button
                            key={o}
                            whileTap={checked ? undefined : { scale: 0.98 }}
                            animate={showWrong ? { x: [0, -8, 8, -6, 6, 0] } : showRight ? { scale: [1, 1.04, 1] } : {}}
                            transition={{ duration: 0.35 }}
                            disabled={checked}
                            onClick={() => setPicked(idx)}
                            className={[
                              'text-left rounded-2xl border-2 px-4 py-3.5 font-bold text-base flex items-center gap-3 transition-colors',
                              'shadow-[0_3px_0_var(--c)]',
                              showRight
                                ? 'bg-gain/10 border-gain text-gain [--c:var(--under-success)]'
                                : showWrong
                                  ? 'bg-loss/10 border-loss text-loss [--c:var(--under-danger)]'
                                  : sel
                                    ? 'bg-primary/10 border-primary text-primary [--c:var(--under-primary)]'
                                    : 'bg-card border-border text-foreground [--c:hsl(var(--border))] hover:bg-muted',
                            ].join(' ')}
                          >
                            <span
                              className={`w-7 h-7 shrink-0 rounded-lg border-2 grid place-items-center text-xs font-extrabold ${
                                sel || showRight || showWrong ? 'border-current' : 'border-border text-muted-foreground'
                              }`}
                            >
                              {idx + 1}
                            </span>
                            {o}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={spring}
                    className="px-5 py-8 flex-1 flex flex-col items-center justify-center text-center gap-4"
                  >
                    <div className="w-40 h-40">
                      <SpikeMascot variant={hearts > 0 ? 'cool' : 'sad'} />
                    </div>
                    <h3 className="text-3xl font-bold text-foreground">{xp >= 20 ? 'Lesson complete!' : 'Nice try!'}</h3>
                    <div className="flex gap-3">
                      <div className="card-3d !rounded-xl px-4 py-2 font-extrabold text-accent flex items-center gap-1.5">
                        <Zap className="w-5 h-5 fill-accent" /> {xp} XP
                      </div>
                      <div className="card-3d !rounded-xl px-4 py-2 font-extrabold text-loss flex items-center gap-1.5">
                        <Heart className="w-5 h-5 fill-loss" /> {hearts} left
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* footer / feedback bar */}
              <div
                className={`border-t-2 px-5 py-5 transition-colors ${
                  !checked
                    ? 'border-border bg-card'
                    : correct
                      ? 'border-transparent bg-gain/15'
                      : 'border-transparent bg-loss/15'
                }`}
              >
                {done ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={go.start} className="btn-3d is-success flex-1 py-3.5">
                      Save my XP
                    </button>
                    <button onClick={restart} className="btn-3d is-outline flex-1 py-3.5">
                      Try again
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {checked ? (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={spring}
                        className={`flex items-start gap-3 ${correct ? 'text-gain' : 'text-loss'}`}
                      >
                        <span className="w-9 h-9 shrink-0 rounded-full bg-white grid place-items-center">
                          {correct ? <Check className="w-5 h-5" strokeWidth={3.5} /> : <X className="w-5 h-5" strokeWidth={3.5} />}
                        </span>
                        <div>
                          <p className="font-extrabold text-lg leading-tight">{correct ? 'Nailed it!' : 'Not quite'}</p>
                          <p className="text-sm font-semibold leading-snug">{q.why}</p>
                        </div>
                      </motion.div>
                    ) : (
                      <span className="text-sm font-semibold text-muted-foreground hidden sm:block">
                        Question {i + 1} of {QUESTIONS.length}
                      </span>
                    )}
                    <button
                      onClick={checked ? next : check}
                      disabled={picked === null}
                      className={`btn-3d shrink-0 w-full sm:w-auto px-8 py-3.5 ${checked ? (correct ? 'is-success' : 'is-danger') : ''} ${checked ? '' : 'ml-auto'}`}
                    >
                      {checked ? 'Continue' : 'Check'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Feature rows: alternating, one color per row                         */
/* ------------------------------------------------------------------ */

function LessonPath() {
  const nodes = [
    { x: 50, state: 'done' },
    { x: 68, state: 'done' },
    { x: 50, state: 'now' },
    { x: 30, state: 'locked' },
    { x: 50, state: 'locked' },
  ] as const;
  return (
    <div className="card-3d p-6 mx-auto w-full max-w-sm">
      <div className="rounded-2xl bg-primary text-primary-foreground px-4 py-3 shadow-[0_4px_0_var(--under-primary)]">
        <p className="text-xs font-extrabold uppercase tracking-wider opacity-80">Unit 1</p>
        <p className="font-bold text-lg">Stocks, the basics</p>
      </div>
      <div className="relative mt-6 h-[340px]">
        {nodes.map((n, idx) => (
          <motion.div
            key={idx}
            className="absolute -translate-x-1/2"
            style={{ left: `${n.x}%`, top: idx * 74 }}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: idx * 0.09 }}
          >
            {n.state === 'now' && (
              <motion.span
                className="absolute -top-9 left-1/2 -translate-x-1/2 bg-card border-2 border-border rounded-xl px-2.5 py-1 text-xs font-extrabold uppercase text-primary whitespace-nowrap"
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              >
                Start
              </motion.span>
            )}
            <div
              className={`w-16 h-14 rounded-[50%] grid place-items-center ${
                n.state === 'done'
                  ? 'bg-accent shadow-[0_6px_0_var(--under-accent)] text-accent-foreground'
                  : n.state === 'now'
                    ? 'bg-primary shadow-[0_6px_0_var(--under-primary)] text-white'
                    : 'bg-muted shadow-[0_6px_0_var(--under-neutral)] text-muted-foreground'
              }`}
            >
              {n.state === 'done' ? (
                <Check className="w-7 h-7" strokeWidth={4} />
              ) : n.state === 'now' ? (
                <Star className="w-7 h-7 fill-white" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TradeCard() {
  const rows = [
    { sym: 'AAPL', name: 'Apple', px: '$231.40', ch: '+1.8%', up: true },
    { sym: 'TSLA', name: 'Tesla', px: '$248.10', ch: '-2.3%', up: false },
    { sym: 'VOO', name: 'S&P 500 fund', px: '$512.77', ch: '+0.6%', up: true },
  ];
  return (
    <div className="card-3d p-5 mx-auto w-full max-w-sm">
      <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">Pretend cash</p>
      <p className="text-4xl font-bold font-display text-foreground mt-1">$10,000.00</p>
      <div className="mt-5 flex flex-col gap-3">
        {rows.map((r, i) => (
          <motion.div
            key={r.sym}
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: i * 0.1 }}
            className="flex items-center gap-3 rounded-2xl border-2 border-border px-3 py-3"
          >
            <div className="w-11 h-11 rounded-xl bg-tint grid place-items-center font-extrabold text-xs text-primary">
              {r.sym}
            </div>
            <div className="flex-1">
              <p className="font-bold leading-tight">{r.name}</p>
              <p className="text-xs font-semibold text-muted-foreground">{r.px}</p>
            </div>
            <span className={`font-extrabold ${r.up ? 'text-gain' : 'text-loss'}`}>{r.ch}</span>
          </motion.div>
        ))}
      </div>
      <button className="btn-3d is-secondary w-full mt-5 py-3.5" tabIndex={-1} aria-hidden>
        Buy
      </button>
    </div>
  );
}

function BoardCard() {
  const rows = [
    { n: 'Maya', xp: 4820, c: 'bg-accent' },
    { n: 'Jordan', xp: 4310, c: 'bg-secondary' },
    { n: 'You', xp: 3975, c: 'bg-primary', me: true },
    { n: 'Sam', xp: 3490, c: 'bg-loss' },
  ];
  return (
    <div className="card-3d p-5 mx-auto w-full max-w-sm">
      <div className="flex items-center gap-2 text-accent">
        <Crown className="w-6 h-6 fill-accent" />
        <p className="font-bold font-display text-lg text-foreground">This week</p>
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        {rows.map((r, i) => (
          <motion.div
            key={r.n}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...spring, delay: i * 0.1 }}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 border-2 ${
              r.me ? 'border-primary bg-primary/10' : 'border-transparent'
            }`}
          >
            <span className="w-6 text-center font-extrabold text-muted-foreground">{i + 1}</span>
            <span className={`w-10 h-10 rounded-full ${r.c} grid place-items-center font-extrabold text-white`}>
              {r.n[0]}
            </span>
            <span className="flex-1 font-bold">{r.n}</span>
            <span className="font-extrabold text-muted-foreground">{r.xp.toLocaleString()} XP</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function FeatureRow({
  title,
  color,
  body,
  visual,
  flip,
}: {
  title: string;
  color: string;
  body: string;
  visual: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-16 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
      <motion.div {...reveal} className={flip ? 'md:order-2' : ''}>
        {visual}
      </motion.div>
      <motion.div
        {...reveal}
        transition={{ ...reveal.transition, delay: 0.08 }}
        className={`text-center md:text-left ${flip ? 'md:order-1' : ''}`}
      >
        <h2 className={`text-4xl md:text-5xl font-bold ${color}`}>{title}</h2>
        <p className="mt-4 text-lg text-muted-foreground font-medium max-w-md mx-auto md:mx-0">{body}</p>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Game modes                                                           */
/* ------------------------------------------------------------------ */

const MODES = [
  {
    icon: Waves,
    name: 'River Crossing',
    body: 'Answer to hop across the stones. Miss one and you lose a heart.',
    fg: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: TrendingUp,
    name: 'Virtual Trading',
    body: 'Buy and sell real stocks at real prices, with pretend money.',
    fg: 'text-[#00867f]',
    bg: 'bg-secondary/10',
  },
  {
    icon: BookOpen,
    name: 'Learn Path',
    body: 'Short lessons from "what is a stock" to building a portfolio.',
    fg: 'text-accent',
    bg: 'bg-accent/15',
  },
  {
    icon: Crown,
    name: 'Leaderboards',
    body: 'Earn XP every day and climb past your friends.',
    fg: 'text-loss',
    bg: 'bg-loss/10',
  },
];

function Modes() {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
      <motion.h2 {...reveal} className="text-4xl md:text-5xl font-bold text-center text-foreground">
        four ways to play
      </motion.h2>
      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {MODES.map((m, i) => (
          <motion.div
            key={m.name}
            {...reveal}
            transition={{ ...reveal.transition, delay: i * 0.07 }}
            whileHover={{ y: -4 }}
            className="card-3d is-pressable p-6 flex flex-col gap-3"
          >
            <div className={`w-14 h-14 rounded-2xl grid place-items-center ${m.bg} ${m.fg}`}>
              <m.icon className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold">{m.name}</h3>
            <p className="text-muted-foreground font-medium leading-snug">{m.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Closing block                                                        */
/* ------------------------------------------------------------------ */

function Closer({ go }: { go: Go }) {
  return (
    <section className="relative bg-primary text-primary-foreground mt-8">
      <svg
        className="absolute left-0 right-0 -top-[1px] w-full h-12 md:h-20 text-background"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0 0H1440V30C1320 70 1200 70 1080 40C960 10 840 10 720 40C600 70 480 70 360 40C240 10 120 10 0 40Z" fill="currentColor" />
      </svg>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-20 md:pt-40 md:pb-28 text-center flex flex-col items-center">
        <motion.div
          {...reveal}
          className="w-48 h-48 rounded-full bg-white p-5"
          whileHover={{ rotate: [0, -6, 6, 0], transition: { duration: 0.5 } }}
        >
          <SpikeMascot variant="excited" />
        </motion.div>
        <motion.h2 {...reveal} className="mt-6 text-4xl md:text-6xl font-bold text-white">
          learn it. play it. own it.
        </motion.h2>
        <motion.div {...reveal} className="mt-10 w-full max-w-xs">
          <button onClick={go.start} className="btn-3d is-white w-full py-4 text-base">
            Get started
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground/80 border-t-2 border-white/15">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-semibold">
        <div className="flex items-center gap-2.5 text-white">
          <img src="/logo.svg" alt="" className="w-7 h-7 rounded-lg" />
          <span className="font-display font-bold text-lg">market spike</span>
        </div>
        <p>© {new Date().getFullYear()} Market Spike. Practice money only. Nothing here is financial advice.</p>
        <a href="/sign-in" className="text-white hover:underline">
          Sign in
        </a>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */

export default function Landing() {
  const [, navigate] = useLocation();
  const { openSignIn } = useClerk();
  const { isSignedIn } = useUser();

  const redirectUrl = window.location.origin + (import.meta.env.BASE_URL || '/') + 'home';
  const go: Go = {
    start: () => (isSignedIn ? navigate('/home') : openSignIn({ redirectUrl })),
    signIn: () => (isSignedIn ? navigate('/home') : openSignIn({ redirectUrl })),
    guest: () => {
      localStorage.setItem('spike_guest_mode', 'true');
      navigate('/home');
    },
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-background text-foreground">
        <Nav go={go} />
        <Hero go={go} />
        <TryLesson go={go} />
        <FeatureRow
          title="lessons that stick"
          color="text-primary"
          body="Each lesson takes about five minutes. Finish one, earn XP, unlock the next. It feels like a game because it is one."
          visual={<LessonPath />}
        />
        <FeatureRow
          title="practice with pretend cash"
          color="text-[#00867f]"
          body="Trade real stocks at real prices without risking a cent. Make mistakes here so they are cheap later."
          visual={<TradeCard />}
          flip
        />
        <FeatureRow
          title="race your friends"
          color="text-[#b97d00]"
          body="Every lesson and every good call earns XP. Keep a streak going and see who tops the board this week."
          visual={<BoardCard />}
        />
        <Modes />
        <Closer go={go} />
        <Footer />
      </div>
    </MotionConfig>
  );
}
