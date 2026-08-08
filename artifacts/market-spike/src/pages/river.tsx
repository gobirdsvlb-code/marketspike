import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetRiverCrossing, useUseLife, useGetCurrentUser, getGetCurrentUserQueryKey, getGetRiverCrossingQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Heart, CheckCircle2, X, Timer, Pause, Play, Gamepad2, Target, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useSearch } from 'wouter';

// ── Persistent game stats stored in localStorage ──
const STATS_KEY = 'spike_game_stats';
type GameStats = { gamesPlayed: number; totalCorrect: number; totalQuestions: number; totalTimeSec: number; bestAccuracy: number };
function loadStats(): GameStats {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}'); } catch { return {} as GameStats; }
}
function saveStats(s: GameStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(s));
}
function fmtTime(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const TIMER_DURATION = 20;

// All stones same size and same colour — clean uniform look
const STONE_W = 96;
const STONE_H = 60;

// Single stone colour palette (dark wet river rock, same for all)
const STONE_BG_IDLE     = 'radial-gradient(ellipse at 28% 26%, rgba(255,255,255,0.20) 0%, transparent 40%), radial-gradient(ellipse at 65% 68%, rgba(0,0,0,0.40) 0%, transparent 52%), radial-gradient(ellipse at 50% 50%, #6b6258 0%, #38322c 100%)';
const STONE_BG_CURRENT  = 'radial-gradient(ellipse at 28% 26%, rgba(255,255,255,0.22) 0%, transparent 40%), radial-gradient(ellipse at 65% 68%, rgba(0,0,0,0.40) 0%, transparent 52%), radial-gradient(ellipse at 50% 50%, #7a6e62 0%, #42382e 100%)';
const STONE_BG_DONE     = 'radial-gradient(ellipse at 28% 26%, rgba(255,255,255,0.18) 0%, transparent 40%), radial-gradient(ellipse at 65% 68%, rgba(0,0,0,0.30) 0%, transparent 52%), linear-gradient(150deg, #4ade80 0%, #16a34a 60%, #14532d 100%)';
const STONE_BG_WRONG    = 'radial-gradient(ellipse at 28% 26%, rgba(255,255,255,0.22) 0%, transparent 40%), radial-gradient(ellipse at 65% 68%, rgba(0,0,0,0.45) 0%, transparent 52%), radial-gradient(ellipse at 50% 50%, #ef4444 0%, #991b1b 100%)';

// Per-stone gentle bob — same amplitude, slight phase shift
const FLOAT_PARAMS = [
  { bobY: -5, bobRot: 0.8,  dur: 2.6 },
  { bobY: -5, bobRot: -0.8, dur: 2.9 },
  { bobY: -5, bobRot: 0.8,  dur: 2.4 },
  { bobY: -5, bobRot: -0.8, dur: 3.0 },
  { bobY: -5, bobRot: 0.8,  dur: 2.7 },
  { bobY: -5, bobRot: -0.8, dur: 2.5 },
  { bobY: -5, bobRot: 0.8,  dur: 2.8 },
  { bobY: -5, bobRot: -0.8, dur: 2.6 },
];

// River crossing levels — 6 levels, each giving more XP
const RIVER_LEVELS = [
  { label: 'Level 1', multiplier: 1.0,  color: 'text-sky-400',    border: 'border-sky-400/60',    bg: 'bg-sky-400/10' },
  { label: 'Level 2', multiplier: 1.25, color: 'text-green-400',  border: 'border-green-400/60',  bg: 'bg-green-400/10' },
  { label: 'Level 3', multiplier: 1.5,  color: 'text-yellow-400', border: 'border-yellow-400/60', bg: 'bg-yellow-400/10' },
  { label: 'Level 4', multiplier: 2.0,  color: 'text-orange-400', border: 'border-orange-400/60', bg: 'bg-orange-400/10' },
  { label: 'Level 5', multiplier: 2.5,  color: 'text-red-400',    border: 'border-red-400/60',    bg: 'bg-red-400/10' },
  { label: 'Level 6', multiplier: 3.0,  color: 'text-epic',       border: 'border-epic/60',       bg: 'bg-epic/10' },
];
const LEVEL_KEY = 'spike_river_level';

// Straight horizontal line across the river centre
const getStonePosition = (index: number, total: number) => {
  const x = 8 + (index * (84 / Math.max(1, total - 1)));
  return { left: `${x}%`, top: '50%' };
};

export default function River() {
  const queryClient = useQueryClient();
  const { data: crossing, isLoading } = useGetRiverCrossing();
  const { data: user } = useGetCurrentUser();
  const useLife = useUseLife();
  const search = useSearch();

  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'answer_shown' | 'completed'>('idle');
  const [currentQuestionIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isWrong, setIsWrong] = useState(false);
  const [earnedData, setEarnedData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION);
  const [isDrifting, setIsDrifting] = useState(false);

  const [wrongIndices, setWrongIndices] = useState<Set<number>>(new Set());
  const isHandlingTimeout = useRef(false);
  const sessionStartRef = useRef<number | null>(null);
  const [stats, setStats] = useState<GameStats>(() => ({ gamesPlayed: 0, totalCorrect: 0, totalQuestions: 0, totalTimeSec: 0, bestAccuracy: 0, ...loadStats() }));

  const [riverLevel, setRiverLevel] = useState<number>(() => {
    try { return Math.min(6, Math.max(1, parseInt(localStorage.getItem(LEVEL_KEY) || '1'))); }
    catch { return 1; }
  });

  const totalQuestions = crossing?.questions?.length || 8;
  const lives = crossing?.lives ?? user?.lives ?? 5;
  const difficulty: 'easy' | 'medium' | 'hard' = crossing?.difficulty ?? 'easy';
  const runsUntilChange: number = crossing?.runsUntilChange ?? 2;
  const nextDifficulty: string = crossing?.nextDifficulty ?? 'medium';
  const currentQuestion = crossing?.questions?.[currentQuestionIdx];
  const isPlaying = gameState === 'playing' || gameState === 'answer_shown' || gameState === 'paused';

  const DIFF_STYLES = {
    easy:   { label: 'Easy',   color: 'bg-gain/20 text-gain border-gain/40',     icon: '🌱' },
    medium: { label: 'Medium', color: 'bg-accent/20 text-accent border-accent/40', icon: '🔥' },
    hard:   { label: 'Hard',   color: 'bg-loss/20 text-loss border-loss/40',      icon: '⚡' },
  };

  const handleStart = () => {
    sessionStartRef.current = Date.now();
    setGameState('playing');
    setCurrentIdx(0);
    setCorrectAnswers(0);
    setEarnedData(null);
    setIsDrifting(false);
    setIsWrong(false);
    setSelectedAnswer(null);
  };

  // Auto-start when arriving from home page with ?autostart=1
  const autostarted = useRef(false);
  useEffect(() => {
    if (autostarted.current) return;
    const params = new URLSearchParams(search);
    if (params.get('autostart') === '1' && !isLoading && crossing?.questions?.length) {
      autostarted.current = true;
      handleStart();
    }
  }, [search, isLoading, crossing]);

  // Reset timer on new question
  useEffect(() => {
    if (gameState === 'playing') {
      setTimeLeft(TIMER_DURATION);
      setIsDrifting(false);
    }
  }, [currentQuestionIdx, gameState === 'playing' ? 'playing' : 'other']);

  // Countdown tick
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) { handleTimeout(); return; }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, gameState]);

  const handleTimeout = () => {
    if (gameState !== 'playing') return;
    if (isHandlingTimeout.current) return;
    isHandlingTimeout.current = true;
    setIsDrifting(true);
    setIsWrong(true);
    setWrongIndices(prev => new Set(prev).add(currentQuestionIdx));
    setGameState('answer_shown');
    useLife.mutate(undefined, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRiverCrossingQueryKey() });
        if (data.outOfLives) {
          toast.error('Out of lives! Come back tomorrow.');
          setTimeout(() => { setIsDrifting(false); setGameState('idle'); }, 1500);
        }
      }
    });
  };

  const handleRestart = () => {
    isHandlingTimeout.current = false;
    setGameState('idle');
    setCurrentIdx(0);
    setCorrectAnswers(0);
    setEarnedData(null);
    setIsDrifting(false);
    setIsWrong(false);
    setSelectedAnswer(null);
    setWrongIndices(new Set());
    queryClient.invalidateQueries({ queryKey: getGetRiverCrossingQueryKey() });
  };

  const handleAnswer = (answer: string) => {
    if (gameState !== 'playing') return;
    if (!currentQuestion) return;
    setSelectedAnswer(answer);
    const correct = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
      setIsWrong(false);
    } else {
      setIsWrong(true);
      setWrongIndices(prev => new Set(prev).add(currentQuestionIdx));
      useLife.mutate(undefined, {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetRiverCrossingQueryKey() });
          if (data.outOfLives) {
            toast.error('Out of lives! Come back tomorrow.');
            setGameState('idle');
          }
        }
      });
    }
    setGameState('answer_shown');
  };

  const handleContinue = async () => {
    isHandlingTimeout.current = false;
    setIsDrifting(false);
    if (currentQuestionIdx < totalQuestions - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
      setGameState('playing');
    } else {
      setGameState('completed');
      try {
        const finalCorrect = correctAnswers + (isWrong ? 0 : 1);
        const result = await fetch('/api/game/river/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ questionsAnswered: totalQuestions, correctAnswers: finalCorrect, riverLevel }),
        }).then(r => r.json());
        setEarnedData(result);
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRiverCrossingQueryKey() });

        // Persist game stats locally
        const elapsed = sessionStartRef.current ? Math.round((Date.now() - sessionStartRef.current) / 1000) : 0;
        const accuracy = totalQuestions > 0 ? Math.round((finalCorrect / totalQuestions) * 100) : 0;
        setStats(prev => {
          const next: GameStats = {
            gamesPlayed: (prev.gamesPlayed || 0) + 1,
            totalCorrect: (prev.totalCorrect || 0) + finalCorrect,
            totalQuestions: (prev.totalQuestions || 0) + totalQuestions,
            totalTimeSec: (prev.totalTimeSec || 0) + elapsed,
            bestAccuracy: Math.max(prev.bestAccuracy || 0, accuracy),
          };
          saveStats(next);
          return next;
        });
      } catch {
        toast.error('Failed to complete crossing');
      }
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // Idle screen — show big start button (or out-of-lives message)
  if (gameState === 'idle') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center gap-8 py-12">
          {lives === 0 ? (
            /* Out of lives */
            <div className="text-center">
              <div className="text-6xl mb-4">💔</div>
              <h2 className="text-3xl font-black text-loss uppercase tracking-tight mb-2">Out of Lives!</h2>
              <p className="text-muted-foreground font-medium">Your lives reset tomorrow. Come back then!</p>
            </div>
          ) : (
            <>
              {/* Two game buttons side by side — each ~1/3 of screen width */}
              <div className="flex flex-col sm:flex-row gap-5 w-full" style={{ maxWidth: 900 }}>
                {/* River Crossing */}
                <motion.button
                  onClick={handleStart}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex flex-col items-center justify-center gap-4 rounded-3xl border-4 border-green-400 bg-green-500 hover:bg-green-400 hover:scale-[1.03] text-white font-black shadow-2xl shadow-green-900/40 transition-[colors,transform] p-8"
                  style={{ minHeight: '40vh' }}
                >
                  <motion.span
                    className="text-7xl select-none"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    🐂
                  </motion.span>
                  <span className="text-3xl uppercase tracking-widest">Play</span>
                  <span className="text-base font-bold opacity-70 uppercase tracking-wider">River Crossing</span>

                  {/* Difficulty badge */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white/20 border border-white/30 rounded-full px-3 py-1 text-sm font-black uppercase tracking-widest flex items-center gap-1.5">
                      {DIFF_STYLES[difficulty].icon} {DIFF_STYLES[difficulty].label}
                    </span>
                  </div>

                  {/* Progress towards next difficulty */}
                  <div className="text-xs font-bold opacity-50 text-center">
                    {runsUntilChange === 1
                      ? `Next run → ${nextDifficulty} questions!`
                      : `${runsUntilChange} more run${runsUntilChange !== 1 ? 's' : ''} until ${nextDifficulty}`}
                  </div>

                  <div className="flex items-center gap-1.5 mt-1 text-sm font-bold opacity-60">
                    {[...Array(lives)].map((_, i) => (
                      <Heart key={i} className="w-4 h-4 fill-white text-white" />
                    ))}
                    <span className="ml-1">{lives} {lives === 1 ? 'life' : 'lives'} left</span>
                  </div>
                </motion.button>

                {/* XP Hunt */}
                <Link href="/xp-hunt" className="flex-1">
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-col items-center justify-center gap-4 rounded-3xl border-4 border-yellow-400 bg-yellow-500 hover:bg-yellow-400 text-white font-black shadow-2xl shadow-yellow-900/40 transition-colors p-8 cursor-pointer w-full"
                    style={{ minHeight: '40vh' }}
                  >
                    <motion.span
                      className="text-7xl select-none"
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      ⚡
                    </motion.span>
                    <span className="text-3xl uppercase tracking-widest">Play</span>
                    <span className="text-base font-bold opacity-70 uppercase tracking-wider">XP Hunt</span>
                  </motion.div>
                </Link>
              </div>

              {/* ── Your Game Stats ── */}
              <div className="w-full" style={{ maxWidth: 900 }}>
                <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3 text-center">Your Stats</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    {
                      icon: <Gamepad2 className="w-5 h-5" />,
                      label: 'Games Played',
                      value: stats.gamesPlayed || 0,
                      color: 'bg-primary/10 text-primary',
                    },
                    {
                      icon: <Target className="w-5 h-5" />,
                      label: 'Accuracy',
                      value: stats.totalQuestions
                        ? `${Math.round((stats.totalCorrect / stats.totalQuestions) * 100)}%`
                        : '—',
                      color: 'bg-gain/10 text-gain',
                    },
                    {
                      icon: <Clock className="w-5 h-5" />,
                      label: 'Time Played',
                      value: stats.totalTimeSec ? fmtTime(stats.totalTimeSec) : '—',
                      color: 'bg-accent/10 text-accent',
                    },
                    {
                      icon: <Zap className="w-5 h-5" />,
                      label: 'Total XP',
                      value: user ? user.xp.toLocaleString() : '—',
                      color: 'bg-legendary/10 text-legendary',
                    },
                  ].map(stat => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-card border-2 border-border rounded-2xl p-4 flex items-center gap-3"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground leading-none mb-1">{stat.label}</div>
                        <div className="text-xl font-black leading-none">{stat.value}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Layout>
    );
  }

  const timerPct = (timeLeft / TIMER_DURATION) * 100;
  const timerColor = timeLeft > 10 ? '#22c55e' : timeLeft > 5 ? '#f97316' : '#ef4444';

  return (
    <Layout>
      <div className="flex flex-col w-full h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] rounded-[2rem] overflow-hidden border-4 border-border bg-background">

        {/* ── RIVER SCENE ── */}
        <RiverScene
          crossing={crossing}
          currentQuestionIdx={currentQuestionIdx}
          gameState={gameState}
          isDrifting={isDrifting}
          lives={lives}
          isWrong={isWrong}
          wrongIndices={wrongIndices}
        />

        {/* Completion overlay */}
        <AnimatePresence>
          {gameState === 'completed' && (
            <motion.div
              className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-6"
              style={{ position: 'fixed' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <div className="bg-card border-4 border-epic rounded-3xl p-8 text-center max-w-md w-full shadow-2xl shadow-epic/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-epic/5" />
                <div className="relative z-10 space-y-4">
                  <div className="text-6xl select-none">🏆</div>
                  <h2 className="text-3xl font-black uppercase tracking-tight">Crossing Complete!</h2>

                  {/* Current level badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 font-black text-sm uppercase tracking-widest ${RIVER_LEVELS[riverLevel - 1].bg} ${RIVER_LEVELS[riverLevel - 1].border} ${RIVER_LEVELS[riverLevel - 1].color}`}>
                    {'⭐'.repeat(riverLevel)} {RIVER_LEVELS[riverLevel - 1].label}
                    <span className="opacity-60">· {RIVER_LEVELS[riverLevel - 1].multiplier}× XP</span>
                  </div>

                  {earnedData ? (
                    <div className="bg-background border-2 border-border rounded-2xl p-5 space-y-3">
                      <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">Rewards</div>
                      <div className="text-4xl font-black text-accent">+{earnedData.xpEarned} XP</div>
                      {earnedData.leveledUp && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                          className="inline-block bg-epic/20 text-epic px-4 py-1.5 rounded-full font-black uppercase text-sm border-2 border-epic/30"
                        >
                          Level Up: {earnedData.newLevel}!
                        </motion.div>
                      )}
                      {earnedData.difficulty_up && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                          className="flex items-center justify-center gap-2 bg-accent/10 border-2 border-accent/30 rounded-xl px-4 py-2"
                        >
                          <span className="text-lg">🎉</span>
                          <span className="font-black text-sm text-accent uppercase tracking-wide">
                            Difficulty up → {earnedData.nextDifficulty}!
                          </span>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center py-2">
                      <div className="w-7 h-7 border-4 border-epic/30 border-t-epic rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Level progression buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={handleRestart}
                      className="py-3 bg-muted hover:bg-muted/80 text-foreground font-black uppercase tracking-widest rounded-xl transition-colors active:scale-95 text-sm border-2 border-border"
                    >
                      Same Level
                    </button>
                    {riverLevel < 6 ? (
                      <button
                        onClick={() => {
                          const next = riverLevel + 1;
                          setRiverLevel(next);
                          try { localStorage.setItem(LEVEL_KEY, String(next)); } catch {}
                          handleRestart();
                        }}
                        className={`py-3 font-black uppercase tracking-widest rounded-xl transition-colors active:scale-95 text-sm border-2 text-white ${RIVER_LEVELS[riverLevel].bg} ${RIVER_LEVELS[riverLevel].border} bg-gradient-to-br from-epic to-accent hover:opacity-90`}
                      >
                        Go to {RIVER_LEVELS[riverLevel].label}! ⭐
                      </button>
                    ) : (
                      <div className={`py-3 font-black uppercase tracking-widest rounded-xl text-sm border-2 flex items-center justify-center gap-1 ${RIVER_LEVELS[5].bg} ${RIVER_LEVELS[5].border} ${RIVER_LEVELS[5].color}`}>
                        Max Level! 🔥
                      </div>
                    )}
                  </div>
                  {riverLevel > 1 && (
                    <button
                      onClick={() => {
                        const prev = riverLevel - 1;
                        setRiverLevel(prev);
                        try { localStorage.setItem(LEVEL_KEY, String(prev)); } catch {}
                        handleRestart();
                      }}
                      className="w-full py-2 text-xs text-muted-foreground hover:text-foreground font-bold uppercase tracking-widest transition-colors"
                    >
                      ↓ Drop to {RIVER_LEVELS[riverLevel - 2].label}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── QUESTION PANEL ── */}
        <AnimatePresence>
          {isPlaying && currentQuestion && (
            <motion.div
              key="question-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="shrink-0 bg-card border-t-4 border-primary overflow-hidden"
            >
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-muted">
                <motion.div className="h-full bg-primary" animate={{ width: `${(currentQuestionIdx / totalQuestions) * 100}%` }} transition={{ duration: 0.4 }} />
              </div>

              <div className="p-4 md:p-5">
                {/* Header row: step + timer + pause */}
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-black text-primary uppercase tracking-widest">
                    Stone {currentQuestionIdx + 1} of {totalQuestions}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Countdown timer — only while actively playing */}
                    {gameState === 'playing' && (
                      <div className="flex items-center gap-2">
                        <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full transition-colors duration-500"
                            style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
                          />
                        </div>
                        <motion.div
                          className="text-sm font-black tabular-nums w-6 text-right"
                          style={{ color: timerColor }}
                          animate={timeLeft <= 5 ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 0.5, repeat: timeLeft <= 5 ? Infinity : 0 }}
                        >
                          {timeLeft}
                        </motion.div>
                        <Timer className="w-4 h-4" style={{ color: timerColor }} />
                      </div>
                    )}

                    {/* Timeout label */}
                    {gameState === 'answer_shown' && isDrifting && (
                      <div className="text-xs font-black text-loss uppercase tracking-wider flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" /> Time's up!
                      </div>
                    )}

                    {/* Pause / Resume button */}
                    {(gameState === 'playing' || gameState === 'paused') && (
                      <button
                        onClick={() => setGameState(s => s === 'paused' ? 'playing' : 'paused')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-bold text-xs uppercase tracking-wide transition-all active:scale-95 border-2 border-border"
                      >
                        {gameState === 'paused'
                          ? <><Play className="w-3.5 h-3.5" /> Resume</>
                          : <><Pause className="w-3.5 h-3.5" /> Pause</>
                        }
                      </button>
                    )}
                  </div>
                </div>

                {/* Paused overlay */}
                <AnimatePresence>
                  {gameState === 'paused' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="flex flex-col items-center justify-center py-8 gap-4"
                    >
                      <div className="text-5xl select-none">⏸️</div>
                      <h3 className="text-xl font-black uppercase tracking-widest text-muted-foreground">Paused</h3>
                      <button
                        onClick={() => setGameState('playing')}
                        className="px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl text-base transition-transform active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" /> Resume
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Question + answers — hidden while paused */}
                {gameState !== 'paused' && (
                  <>
                    <h2 className="text-lg md:text-xl font-black mb-4 text-foreground leading-snug">
                      {currentQuestion.question}
                    </h2>

                    <div className="grid gap-2 grid-cols-2">
                      {(currentQuestion.type === 'multiple_choice' ? currentQuestion.options : ['True', 'False'])?.map((opt, i) => {
                        const isSelected = selectedAnswer === opt;
                        const isCorrectOpt = opt.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
                        const showAnswer = gameState === 'answer_shown';

                        let btnClass = 'bg-background border-2 border-border text-foreground hover:border-primary hover:bg-primary/5';
                        let animProps: any = {};

                        if (showAnswer) {
                          if (isCorrectOpt) btnClass = 'bg-gain/10 border-gain text-gain ring-2 ring-gain/20';
                          else if (isSelected) { btnClass = 'bg-loss/10 border-loss text-loss ring-2 ring-loss/20'; animProps = { x: [-4, 4, -4, 4, 0], transition: { duration: 0.35 } }; }
                          else btnClass = 'bg-muted/30 border-transparent opacity-40';
                        } else if (isSelected) {
                          btnClass = 'bg-primary/10 border-primary text-primary';
                        }

                        return (
                          <motion.button
                            key={i}
                            disabled={showAnswer}
                            animate={animProps}
                            onClick={() => handleAnswer(opt)}
                            className={`p-3 md:p-4 rounded-xl text-left text-sm md:text-base font-bold transition-all duration-150 ${btnClass} ${showAnswer ? 'cursor-default' : 'cursor-pointer active:scale-95'}`}
                          >
                            {opt}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Feedback row */}
                    <AnimatePresence>
                      {gameState === 'answer_shown' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t-2 border-border flex items-start justify-between gap-4"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${!isWrong ? 'bg-gain text-white' : 'bg-loss text-white'}`}>
                              {!isWrong ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <span className={`text-sm font-black ${!isWrong ? 'text-gain' : 'text-loss'}`}>
                                {!isWrong ? 'Safe Step! ' : isDrifting ? 'Stone drifted away! ' : 'Slipped! '}
                              </span>
                              <span className="text-sm text-foreground font-medium">{currentQuestion.explanation}</span>
                            </div>
                          </div>
                          <button
                            onClick={handleContinue}
                            className={`shrink-0 px-5 py-2.5 rounded-xl font-black uppercase tracking-wider text-white text-sm transition-transform active:scale-95 shadow-md ${!isWrong ? 'bg-gain hover:bg-gain/90' : 'bg-loss hover:bg-loss/90'}`}
                          >
                            Continue →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          @keyframes waterFlow {
            from { background-position: 0 0; }
            to   { background-position: 200px 0; }
          }
        `}</style>
      </div>
    </Layout>
  );
}

// ── River scene extracted as a pure presentational component ──
function RiverScene({ crossing, currentQuestionIdx, gameState, isDrifting, lives, isWrong, wrongIndices }: {
  crossing: any;
  currentQuestionIdx: number;
  gameState: string;
  isDrifting: boolean;
  lives: number;
  isWrong: boolean;
  wrongIndices: Set<number>;
}) {
  const totalQuestions = crossing?.questions?.length || 8;

  // Responsive stone sizing — scale with container width
  const [stoneW, setStoneW] = useState(96);
  const [stoneH, setStoneH] = useState(60);
  const riverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = riverRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const scale = Math.min(1, Math.max(0.38, w / 900));
      setStoneW(Math.round(96 * scale));
      setStoneH(Math.round(60 * scale));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden flex"
      style={{ background: 'linear-gradient(180deg, #0d1117 0%, #0a1628 40%, #0d1f35 60%, #0d1117 100%)' }}
    >
      {/* Water ripples — tinted dark teal */}
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(56,189,248,0.12) 40px, rgba(56,189,248,0.12) 41px)', animation: 'waterFlow 3s linear infinite' }} />
      <div className="absolute inset-0 opacity-15"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 70px, rgba(56,189,248,0.18) 70px, rgba(56,189,248,0.18) 72px)', animation: 'waterFlow 5s linear infinite reverse' }} />

      {/* Lives — top-right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-background/85 backdrop-blur-md px-3 py-2 rounded-2xl border-2 border-border shadow-lg">
        <span className="text-xs font-black uppercase text-muted-foreground mr-1">Lives</span>
        {[...Array(5)].map((_, i) => (
          <motion.div key={i} initial={false} animate={{ scale: i < lives ? 1 : 0.75, opacity: i < lives ? 1 : 0.3 }}>
            <Heart className={`w-5 h-5 ${i < lives ? 'fill-loss text-loss' : 'text-muted-foreground'}`} />
          </motion.div>
        ))}
      </div>

      {/* Left bank */}
      <div className="w-[10%] h-full border-r-4 border-green-700/40 relative shrink-0"
        style={{ background: 'linear-gradient(90deg, #16a34a 60%, #15803d)' }}>
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/25 to-transparent" />
        <div className="absolute inset-2 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #166534 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
        {/* Bull on left bank when idle / no game active */}
        {(gameState === 'idle') && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
            style={{ fontSize: '2.8rem', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.6))', transform: 'translate(-50%, -50%) scaleX(-1)' }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            🐂
          </motion.div>
        )}
      </div>

      {/* Stepping stones */}
      <div ref={riverRef} className="flex-1 relative">
        {crossing?.questions?.map((_: any, idx: number) => {
          const pos = getStonePosition(idx, totalQuestions);
          const fp = FLOAT_PARAMS[idx % FLOAT_PARAMS.length];

          let state = 'idle';
          if (idx < currentQuestionIdx) state = 'completed';
          if (idx === currentQuestionIdx && gameState !== 'idle') state = 'current';

          const wasMissed = wrongIndices.has(idx); // answered wrong or timed out
          const driftingThis = isDrifting && state === 'current';

          const floatAnimate = {
            y: [0, fp.bobY, 0],
            rotate: [0, fp.bobRot, 0],
            ...(state === 'current' && !driftingThis ? { scale: [1, 1.03, 1] } : {}),
          };
          const driftAnimate = { x: 180, y: 90, opacity: 0, rotate: 35, scale: 0.6 };

          // Show red stone when this is the current stone and the answer was wrong (or timeout),
          // OR when this is a past stone that was missed.
          const showWrong = (state === 'current' && isWrong && gameState === 'answer_shown') || (state === 'completed' && wasMissed);
          const rockBg = showWrong
            ? STONE_BG_WRONG
            : state === 'completed'
              ? STONE_BG_DONE
              : state === 'current'
                ? STONE_BG_CURRENT
                : STONE_BG_IDLE;
          const rockShadow = showWrong
            ? '0 8px 28px rgba(239,68,68,0.65), 0 4px 12px rgba(0,0,0,0.6), 0 14px 6px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)'
            : state === 'completed'
              ? '0 8px 20px rgba(34,197,94,0.45), 0 3px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)'
              : state === 'current'
                ? '0 8px 28px rgba(99,102,241,0.55), 0 4px 12px rgba(0,0,0,0.6), 0 14px 6px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18)'
                : '0 6px 16px rgba(0,0,0,0.55), 0 10px 5px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12)';

          return (
            <motion.div
              key={idx}
              className="absolute rounded-[50%] -translate-x-1/2 -translate-y-1/2 cursor-default select-none"
              style={{
                left: pos.left,
                top: pos.top,
                width: stoneW,
                height: stoneH,
                zIndex: state === 'current' ? 20 : 10,
                background: rockBg,
                boxShadow: rockShadow,
                border: showWrong
                  ? '2.5px solid rgba(239,68,68,0.9)'
                  : state === 'current'
                    ? '2.5px solid hsl(var(--primary))'
                    : state === 'completed'
                      ? '2px solid rgba(74,222,128,0.6)'
                      : '1.5px solid rgba(255,255,255,0.10)',
              }}
              animate={driftingThis ? driftAnimate : floatAnimate}
              transition={driftingThis
                ? { duration: 0.75, ease: 'easeIn' }
                : { duration: fp.dur, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.2 }
              }
            >
              {/* Wet sheen catch-light */}
              <div className="absolute pointer-events-none" style={{
                top: '10%', left: '14%', width: '44%', height: '30%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(255,255,255,0.30) 0%, transparent 100%)',
                transform: 'rotate(-18deg)',
              }} />

              {/* Dark shadow patch lower-right */}
              <div className="absolute pointer-events-none" style={{
                bottom: '10%', right: '12%', width: '38%', height: '26%',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.32) 0%, transparent 100%)',
              }} />

              {/* SVG crack lines */}
              {state !== 'completed' && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18]" viewBox="0 0 100 60" preserveAspectRatio="none">
                  <path d={`M${30 + (idx * 7) % 20} ${15 + (idx * 3) % 10} Q50 ${30 + (idx * 4) % 12} ${70 + (idx * 5) % 15} ${40 + (idx * 2) % 10}`}
                    stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  <path d={`M${20 + (idx * 9) % 15} ${38 + (idx * 2) % 8} Q${42 + (idx * 3) % 10} ${26 + (idx * 5) % 10} ${62 + (idx * 7) % 20} ${44 + (idx * 3) % 8}`}
                    stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" fill="none" strokeLinecap="round"/>
                </svg>
              )}

              {/* Pulse ring — active stone */}
              {state === 'current' && !driftingThis && (
                <motion.div
                  className="absolute rounded-[50%] pointer-events-none"
                  style={{ inset: -6, border: '2px solid hsl(var(--primary) / 0.5)' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Checkmark / X on completed stone */}
              {state === 'completed' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-base font-black drop-shadow">{wasMissed ? '✗' : '✓'}</span>
                </div>
              )}

              {/* 🐂 Bull — on active stone, facing right toward the finish */}
              {state === 'current' && !driftingThis && (
                <motion.div
                  key={`bull-${idx}`}
                  className="absolute left-1/2 -translate-x-1/2 select-none z-30"
                  style={{ bottom: '92%', fontSize: '2.8rem', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.75))', transform: 'translateX(-50%) scaleX(-1)' }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: [0, -6, 0] }}
                  transition={{
                    opacity: { duration: 0.2 },
                    y: { duration: 1.3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 },
                  }}
                >
                  🐂
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Right bank */}
      <div className="w-[10%] h-full border-l-4 border-green-700/40 relative shrink-0"
        style={{ background: 'linear-gradient(270deg, #16a34a 60%, #15803d)' }}>
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/25 to-transparent" />
        <div className="absolute inset-2 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #166534 1px, transparent 1px)', backgroundSize: '8px 8px' }} />
        {/* Goal */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <motion.div
            className="w-14 h-14 rounded-full bg-yellow-400/25 border-4 border-yellow-400/60 flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-2xl">🏁</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
