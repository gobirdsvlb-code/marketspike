import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { getGetCurrentUserQueryKey } from '@workspace/api-client-react';

// ── Map waypoints (% of map container) ──────────────────────────────────────
const WAYPOINTS = [
  { x: 13, y: 42 },
  { x: 32, y: 24 },
  { x: 56, y: 30 },
  { x: 77, y: 42 },
  { x: 65, y: 66 },
  { x: 36, y: 70 },
];

const DECORATIONS = [
  { id: 1,  x: 3,  y: 7,  emoji: '🌲', size: '1.9rem' },
  { id: 2,  x: 88, y: 7,  emoji: '🌲', size: '2rem'   },
  { id: 3,  x: 47, y: 6,  emoji: '🌿', size: '1.4rem' },
  { id: 4,  x: 21, y: 82, emoji: '🪨', size: '1.2rem' },
  { id: 5,  x: 73, y: 17, emoji: '🌿', size: '1.3rem' },
  { id: 6,  x: 91, y: 68, emoji: '🌲', size: '1.7rem' },
  { id: 7,  x: 6,  y: 70, emoji: '🌲', size: '1.6rem' },
  { id: 8,  x: 52, y: 84, emoji: '🪨', size: '1.1rem' },
  { id: 9,  x: 24, y: 13, emoji: '🌿', size: '1.2rem' },
  { id: 10, x: 83, y: 80, emoji: '🌿', size: '1.3rem' },
  { id: 11, x: 62, y: 11, emoji: '🌲', size: '1.5rem' },
  { id: 12, x: 10, y: 26, emoji: '🪨', size: '1rem'   },
];

// ── Types & constants ────────────────────────────────────────────────────────
type Phase = 'moving' | 'question' | 'treasure' | 'round_done';
type Tier  = 'coin' | 'gem' | 'trophy';

const TIER_EMOJI:  Record<Tier, string> = { coin: '🪙', gem: '💎', trophy: '🏆' };
const TIER_LABEL:  Record<Tier, string> = { coin: 'Gold Coin', gem: 'Gem', trophy: 'Trophy' };
const TIER_XP:     Record<Tier, number> = { coin: 75, gem: 125, trophy: 200 };
const TIER_GRAD:   Record<Tier, string> = {
  coin:   'from-yellow-500 to-amber-600',
  gem:    'from-cyan-500 to-blue-600',
  trophy: 'from-purple-500 to-pink-600',
};
const STAGE_COLOR: Record<string, string> = {
  easy:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  hard:   'bg-purple-500/20 text-purple-400 border-purple-500/30',
};
const STAGE_HINT: Record<string, string> = {
  easy:   '🪙  Correct twice → Gold Coin (75 XP)',
  medium: '💎  Correct twice → Gem (125 XP)',
  hard:   '🏆  Correct twice → Trophy (200 XP)',
};

interface Question {
  id: number; stage: string; question: string; type: string;
  options: string[] | null; correctAnswer: string; explanation: string;
}

function getTier(stages: string[]): Tier {
  if (stages.includes('hard'))   return 'trophy';
  if (stages.includes('medium')) return 'gem';
  return 'coin';
}

function randomTreasurePos(avoidX: number, avoidY: number) {
  let x: number, y: number;
  let tries = 0;
  do {
    x = 15 + Math.random() * 65;
    y = 18 + Math.random() * 55;
    tries++;
  } while (tries < 20 && Math.abs(x - avoidX) < 22 && Math.abs(y - avoidY) < 22);
  return { x, y };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function XpHunt() {
  const queryClient = useQueryClient();

  const [questions, setQuestions]       = useState<Question[]>([]);
  const [qIdx, setQIdx]                 = useState(0);
  const [isLoading, setIsLoading]       = useState(true);

  const [phase, setPhase]               = useState<Phase>('moving');
  const [wpIdx, setWpIdx]               = useState(0);
  const [spikeTarget, setSpikeTarget]   = useState(WAYPOINTS[0]);
  const [facingRight, setFacingRight]   = useState(true);

  const [correctCount, setCorrectCount]     = useState(0);
  const [stagesAnswered, setStagesAnswered] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isWrong, setIsWrong]               = useState(false);
  const [showFeedback, setShowFeedback]     = useState(false);

  const [treasurePos, setTreasurePos]   = useState<{ x: number; y: number } | null>(null);
  const [treasureTier, setTreasureTier] = useState<Tier>('coin');
  const [earnedXP, setEarnedXP]         = useState(0);
  const [sessionXP, setSessionXP]       = useState(0);
  const [leveledUp, setLeveledUp]       = useState(false);

  // Refs so onAnimationComplete always reads fresh state
  const phaseRef          = useRef(phase);
  const stagesRef         = useRef(stagesAnswered);
  const wpIdxRef          = useRef(wpIdx);
  const treasurePosRef    = useRef(treasurePos);
  const treasureTierRef   = useRef(treasureTier);
  useEffect(() => { phaseRef.current        = phase;          }, [phase]);
  useEffect(() => { stagesRef.current       = stagesAnswered; }, [stagesAnswered]);
  useEffect(() => { wpIdxRef.current        = wpIdx;          }, [wpIdx]);
  useEffect(() => { treasurePosRef.current  = treasurePos;    }, [treasurePos]);
  useEffect(() => { treasureTierRef.current = treasureTier;   }, [treasureTier]);

  // Animation generation counter — prevents stale onAnimationComplete callbacks
  // from firing when Framer Motion re-emits after a phase/state re-render.
  const animGenRef = useRef(0);
  const expectedGenRef = useRef(0);

  // Load questions once
  useEffect(() => {
    fetch('/api/game/xp-hunt', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setQuestions(data.questions ?? []); setIsLoading(false); })
      .catch(() => { toast.error('Failed to load XP Hunt'); setIsLoading(false); });
  }, []);

  // ── Advance to next waypoint ──
  const advanceWaypoint = (fromWpIdx: number) => {
    const next = (fromWpIdx + 1) % WAYPOINTS.length;
    const cur  = WAYPOINTS[fromWpIdx];
    const nxt  = WAYPOINTS[next];
    setFacingRight(nxt.x >= cur.x);
    setSpikeTarget(nxt);
    setWpIdx(next);
    setPhase('moving');
    // Stamp a new generation so stale onAnimationComplete callbacks are ignored
    const gen = ++animGenRef.current;
    expectedGenRef.current = gen;
  };

  // ── Send Spike toward treasure ──
  const sendToTreasure = (pos: { x: number; y: number }, cur: { x: number; y: number }) => {
    setSpikeTarget(pos);
    setFacingRight(pos.x >= cur.x);
    setPhase('treasure');
    const gen = ++animGenRef.current;
    expectedGenRef.current = gen;
  };

  // ── Called when Spike finishes moving ──
  const handleSpikeArrived = () => {
    // Ignore callbacks from old animations (Framer Motion can re-emit on re-render)
    if (animGenRef.current !== expectedGenRef.current) return;
    const p = phaseRef.current;
    if (p === 'moving') {
      setTimeout(() => setPhase('question'), 350);
    } else if (p === 'treasure') {
      doCollect();
    }
  };

  // ── Collect treasure ──
  const doCollect = async () => {
    const tier = treasureTierRef.current;
    setPhase('round_done');
    setEarnedXP(TIER_XP[tier]);
    try {
      const result = await fetch('/api/game/xp-hunt/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      }).then(r => r.json());
      setEarnedXP(result.xpEarned ?? TIER_XP[tier]);
      setSessionXP(prev => prev + (result.xpEarned ?? TIER_XP[tier]));
      setLeveledUp(!!result.leveledUp);
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    } catch {
      toast.error('Failed to save XP');
    }
    // Reset after 2.6 s and start next loop
    setTimeout(() => {
      const cur = wpIdxRef.current;
      setCorrectCount(0);
      setStagesAnswered([]);
      setTreasurePos(null);
      setEarnedXP(0);
      setLeveledUp(false);
      advanceWaypoint(cur);
    }, 2600);
  };

  // ── Handle answer ──
  const handleAnswer = (answer: string) => {
    if (phase !== 'question') return;
    const q = questions[qIdx];
    if (!q) return;

    setSelectedAnswer(answer);
    const correct = answer.toLowerCase() === q.correctAnswer.toLowerCase();
    setIsWrong(!correct);
    setShowFeedback(true);

    const nextQIdx = (qIdx + 1) % Math.max(1, questions.length);

    if (correct) {
      const newCount  = correctCount + 1;
      const newStages = [...stagesAnswered, q.stage];
      setCorrectCount(newCount);
      setStagesAnswered(newStages);

      if (newCount >= 2) {
        // Spawn treasure and send Spike to it
        const cur = WAYPOINTS[wpIdxRef.current];
        const pos = randomTreasurePos(cur.x, cur.y);
        const tier = getTier(newStages);
        setTreasurePos(pos);
        setTreasureTier(tier);
        stagesRef.current = newStages;
        treasurePosRef.current = pos;
        treasureTierRef.current = tier;

        setTimeout(() => {
          setShowFeedback(false);
          setSelectedAnswer(null);
          setQIdx(nextQIdx);
          sendToTreasure(pos, cur);
        }, 1300);
      } else {
        setTimeout(() => {
          setShowFeedback(false);
          setSelectedAnswer(null);
          setQIdx(nextQIdx);
          advanceWaypoint(wpIdxRef.current);
        }, 1300);
      }
    } else {
      // Wrong — keep going
      setTimeout(() => {
        setShowFeedback(false);
        setSelectedAnswer(null);
        setQIdx(nextQIdx);
        advanceWaypoint(wpIdxRef.current);
      }, 1300);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-14 h-14 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const currentQ = questions[qIdx];
  const qOptions = currentQ
    ? (currentQ.type === 'multiple_choice' ? currentQ.options : ['True', 'False'])
    : [];

  return (
    <Layout>
      <div className="flex flex-col w-full h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] rounded-[2rem] overflow-hidden border-4 border-yellow-500/40 bg-background">

        {/* ── MAP ── */}
        <div className="relative flex-1 min-h-0 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #14532d 0%, #166534 50%, #15803d 100%)' }}>

          {/* Grass dot texture */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: 'radial-gradient(circle, #4ade80 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          {/* Dashed path connecting waypoints */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18]">
            {WAYPOINTS.map((wp, i) => {
              const next = WAYPOINTS[(i + 1) % WAYPOINTS.length];
              return <line key={i} x1={`${wp.x}%`} y1={`${wp.y}%`} x2={`${next.x}%`} y2={`${next.y}%`}
                stroke="#86efac" strokeWidth="1.5" strokeDasharray="7 7" />;
            })}
          </svg>

          {/* Waypoint dots */}
          {WAYPOINTS.map((wp, i) => (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${wp.x}%`, top: `${wp.y}%` }}>
              <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors duration-300
                ${i === wpIdx ? 'bg-yellow-400 border-yellow-200 shadow-[0_0_6px_rgba(250,204,21,0.8)]' : 'bg-white/10 border-white/20'}`} />
            </div>
          ))}

          {/* Decorations */}
          {DECORATIONS.map(d => (
            <div key={d.id} className="absolute pointer-events-none select-none -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${d.x}%`, top: `${d.y}%`, fontSize: d.size }}>
              {d.emoji}
            </div>
          ))}

          {/* Treasure */}
          <AnimatePresence>
            {treasurePos && phase !== 'round_done' && (
              <motion.div key="treasure"
                initial={{ scale: 0, opacity: 0, y: -16 }}
                animate={{ scale: 1, opacity: 1, y: [0, -7, 0] }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 16,
                  y: { duration: 1.1, repeat: Infinity, ease: 'easeInOut', delay: 0.3 } }}
                className="absolute z-20 pointer-events-none select-none -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${treasurePos.x}%`, top: `${treasurePos.y}%`,
                  fontSize: '2.4rem', filter: 'drop-shadow(0 0 14px gold)' }}>
                {TIER_EMOJI[treasureTier]}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Spike */}
          <motion.div
            className="absolute z-30 pointer-events-none select-none -translate-x-1/2 -translate-y-1/2"
            style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.85))' }}
            animate={{ left: `${spikeTarget.x}%`, top: `${spikeTarget.y}%` }}
            transition={{ duration: phase === 'treasure' ? 0.9 : 1.5, ease: 'easeInOut' }}
            onAnimationComplete={handleSpikeArrived}
          >
            <motion.span
              style={{ display: 'inline-block', fontSize: '2.6rem',
                transform: `scaleX(${facingRight ? 1 : -1})` }}
              animate={(phase === 'moving' || phase === 'treasure') ? { y: [0, -5, 0] } : {}}
              transition={{ duration: 0.38, repeat: Infinity, ease: 'easeInOut' }}
            >
              🐂
            </motion.span>
          </motion.div>

          {/* Top HUD */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="font-black text-sm text-yellow-400">{sessionXP} XP</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-1.5">
              <span className="text-sm font-black">{correctCount}/2</span>
              <span className="text-[11px] text-white/50 font-bold">correct</span>
            </div>
          </div>

          {/* Round-done XP popup */}
          <AnimatePresence>
            {phase === 'round_done' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md"
              >
                <div className={`bg-gradient-to-br ${TIER_GRAD[treasureTier]} p-1 rounded-3xl shadow-2xl`}>
                  <div className="bg-[#0d1117] rounded-[calc(1.5rem-4px)] px-10 py-8 text-center min-w-[220px]">
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}
                      transition={{ type: 'spring', stiffness: 280, damping: 14 }}
                      className="text-6xl mb-3 select-none"
                    >
                      {TIER_EMOJI[treasureTier]}
                    </motion.div>
                    <div className="text-xl font-black text-white mb-1">{TIER_LABEL[treasureTier]} Found!</div>
                    <div className="text-4xl font-black text-yellow-400 mt-2">+{earnedXP} XP</div>
                    {leveledUp && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}
                        className="mt-3 bg-purple-500/20 text-purple-300 px-4 py-1 rounded-full font-black text-sm border border-purple-500/30 inline-block">
                        Level Up! 🎉
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── QUESTION PANEL ── */}
        <AnimatePresence>
          {phase === 'question' && currentQ && (
            <motion.div key="qpanel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="shrink-0 bg-card border-t-4 border-yellow-500 overflow-hidden"
            >
              {/* Progress bar (correctCount / 2) */}
              <div className="h-1.5 w-full bg-muted">
                <motion.div className="h-full bg-yellow-500 rounded-full"
                  animate={{ width: `${(correctCount / 2) * 100}%` }}
                  transition={{ duration: 0.4 }} />
              </div>

              <div className="p-4 md:p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide border ${STAGE_COLOR[currentQ.stage] ?? STAGE_COLOR.easy}`}>
                      {currentQ.stage}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium hidden sm:block">
                      {STAGE_HINT[currentQ.stage] ?? STAGE_HINT.easy}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-lg">
                    {[0, 1].map(i => (
                      <span key={i}>{i < correctCount ? '⭐' : '☆'}</span>
                    ))}
                  </div>
                </div>

                {/* Question */}
                <h2 className="text-lg md:text-xl font-black mb-4 leading-snug">{currentQ.question}</h2>

                {/* Options */}
                <div className="grid gap-2 grid-cols-2">
                  {qOptions?.map((opt, i) => {
                    const isSelected   = selectedAnswer === opt;
                    const isCorrectOpt = opt.toLowerCase() === currentQ.correctAnswer.toLowerCase();
                    const show         = showFeedback;
                    let cls = 'bg-background border-2 border-border hover:border-yellow-500 hover:bg-yellow-500/5 text-foreground';
                    let anim: any = {};
                    if (show) {
                      if (isCorrectOpt) cls = 'bg-gain/10 border-gain text-gain ring-2 ring-gain/20';
                      else if (isSelected) {
                        cls = 'bg-loss/10 border-loss text-loss ring-2 ring-loss/20';
                        anim = { x: [-4, 4, -4, 4, 0], transition: { duration: 0.35 } };
                      } else cls = 'bg-muted/30 border-transparent opacity-40';
                    } else if (isSelected) {
                      cls = 'bg-yellow-500/10 border-yellow-500 text-yellow-500';
                    }
                    return (
                      <motion.button key={i} disabled={show} animate={anim}
                        onClick={() => handleAnswer(opt)}
                        className={`p-3 md:p-4 rounded-xl text-left text-sm md:text-base font-bold transition-all duration-150 ${cls} ${show ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {showFeedback && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t-2 border-border flex items-center gap-3">
                      <div className={`p-1.5 rounded-full shrink-0 ${!isWrong ? 'bg-gain text-white' : 'bg-loss text-white'}`}>
                        {!isWrong ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </div>
                      <p className="text-sm font-medium flex-1 min-w-0">
                        <span className={`font-black mr-1 ${!isWrong ? 'text-gain' : 'text-loss'}`}>
                          {!isWrong
                            ? (correctCount >= 2 ? 'Treasure spotted! 🗺️' : `${correctCount}/2 — keep going!`)
                            : 'Not quite! '}
                        </span>
                        {currentQ.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <UpgradeBanner />
      </div>
    </Layout>
  );
}
