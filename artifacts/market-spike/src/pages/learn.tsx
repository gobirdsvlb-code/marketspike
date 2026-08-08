import React, { useState, useEffect } from 'react';
import { useGetCurriculum, useCompleteLesson, useGetLessonQuestions, getGetCurriculumQueryKey } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, Clock, Zap, Play, Lock, TrendingUp, Layers, Star, Trophy, ArrowRight, X, Award, Coins } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const interval = 16;
    const steps = duration / interval;
    const increment = value / steps;
    
    if (value === 0) {
      setCount(0);
      return;
    }

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <>{count}</>;
}

// Strip "Correct!" / "Right!" prefixes that read oddly as teaching content
function cleanExplanation(text: string): string {
  return text.replace(/^(Correct!|Right!|That's right!|Yes!)\s*/i, '');
}

function QuizOverlay({ lesson, onClose, onComplete }: { lesson: any, onClose: () => void, onComplete: () => void }) {
  const { data: rawQuestions, isLoading } = useGetLessonQuestions(lesson.id, {
    query: { enabled: !!lesson.id }
  });

  useEffect(() => {
    fetch(`/api/learn/lessons/${lesson.id}/start`, { method: 'POST', credentials: 'include' })
      .catch(() => {});
  }, [lesson.id]);

  // ── Quizlet Learn state ───────────────────────────────────────────────
  // queue  = cards still to master (wrong answers cycle back to the end)
  // mastered = cards answered correctly at least once this session
  const STORAGE_KEY = `spike_lesson_${lesson.id}_mastered`;

  const [queue, setQueue] = useState<any[]>([]);
  const [mastered, setMastered] = useState<any[]>([]);
  const [initialized, setInitialized] = useState(false);

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalWrong, setTotalWrong]   = useState(0);

  // Seed the queue once questions arrive, restoring any saved mid-session progress
  useEffect(() => {
    if (rawQuestions && rawQuestions.length > 0 && !initialized) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const savedIds: number[] = saved ? JSON.parse(saved) : [];
        const masteredSet = new Set(savedIds);
        const alreadyMastered = rawQuestions.filter(q => masteredSet.has(q.id));
        const remaining = rawQuestions.filter(q => !masteredSet.has(q.id));
        setMastered(alreadyMastered);
        setQueue(remaining);
      } catch {
        setQueue([...rawQuestions]);
      }
      setInitialized(true);
    }
  }, [rawQuestions, initialized]);

  if (isLoading || !initialized) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center"
      >
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-black text-primary uppercase tracking-widest animate-pulse">Loading Lesson…</h2>
      </motion.div>
    );
  }

  if (!rawQuestions || rawQuestions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 text-center"
      >
        <h2 className="text-2xl font-black text-foreground mb-4">No content found</h2>
        <button onClick={onClose} className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold">Close</button>
      </motion.div>
    );
  }

  const total = rawQuestions.length;
  const masteredCount = mastered.length;
  const progressPct = total > 0 ? (masteredCount / total) * 100 : 0;

  // All done — trigger completion
  if (initialized && queue.length === 0 && masteredCount === total) {
    // Rendered inline below as "round complete" — handled via state
  }

  const currentQuestion = queue[0] ?? null;
  const displayOptions = currentQuestion
    ? (currentQuestion.type === 'multiple_choice' ? (currentQuestion.options || []) : ['True', 'False'])
    : [];

  const isCorrect = isChecked && selectedAnswer !== null &&
    selectedAnswer.toLowerCase() === currentQuestion?.correctAnswer?.toLowerCase();

  const handleOptionClick = (option: string) => {
    if (isChecked || !currentQuestion) return;
    setSelectedAnswer(option);
    setIsChecked(true);
    setTotalAnswered(n => n + 1);
    const correct = option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    if (!correct) setTotalWrong(n => n + 1);
  };

  const handleContinue = () => {
    if (!currentQuestion) return;
    const correct = selectedAnswer?.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    if (correct) {
      // Move card to mastered, remove from queue front
      const newMastered = [...mastered, currentQuestion];
      setMastered(newMastered);
      setQueue(q => q.slice(1));
      // Persist mastered IDs so progress survives a close/reopen
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMastered.map(q => q.id)));
      } catch {}
    } else {
      // Cycle card to the end of the queue
      setQueue(q => [...q.slice(1), currentQuestion]);
    }

    setSelectedAnswer(null);
    setIsChecked(false);
  };

  // ── All mastered → fire completion ───────────────────────────────────
  const allDone = initialized && queue.length === 0 && masteredCount === total;
  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
      >
        {/* Confetti-style banner */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 6, -6, 0] }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="w-32 h-32 rounded-full bg-gain/10 border-4 border-gain flex items-center justify-center mb-8 shadow-xl shadow-gain/20"
        >
          <CheckCircle2 className="w-16 h-16 text-gain" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-center"
        >
          Round Complete!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-muted-foreground text-lg font-medium mb-10 text-center"
        >
          You mastered all {total} cards in this lesson.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-4 w-full max-w-sm mb-10"
        >
          <div className="bg-gain/10 border-2 border-gain/30 rounded-2xl p-5 text-center">
            <div className="text-3xl font-black text-gain">{total - totalWrong}</div>
            <div className="text-xs font-black uppercase tracking-widest text-gain/80 mt-1">Correct</div>
          </div>
          <div className="bg-loss/10 border-2 border-loss/30 rounded-2xl p-5 text-center">
            <div className="text-3xl font-black text-loss">{totalWrong}</div>
            <div className="text-xs font-black uppercase tracking-widest text-loss/80 mt-1">Incorrect</div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => {
            // Clear saved progress — lesson is fully done
            try { localStorage.removeItem(STORAGE_KEY); } catch {}
            onComplete();
          }}
          className="px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-white bg-gain hover:bg-gain/90 shadow-lg shadow-gain/20 transition-transform active:scale-95 text-lg"
        >
          Finish Lesson →
        </motion.button>
      </motion.div>
    );
  }

  // ── Normal study screen ───────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* ── Header ── */}
      <header className="flex items-center gap-3 md:gap-4 p-4 md:p-6 max-w-4xl mx-auto w-full">
        <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors shrink-0">
          <X className="w-6 h-6" />
        </button>

        {/* Progress bar */}
        <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden border border-border">
          <motion.div
            className="h-full bg-gain rounded-full"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Mastered count */}
        <span className="text-xs font-black text-muted-foreground tabular-nums shrink-0 whitespace-nowrap">
          {masteredCount} / {total} mastered
        </span>
      </header>

      {/* ── Main — question + options ── */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-center max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {currentQuestion && (
            <motion.div
              key={currentQuestion.id + '-' + masteredCount}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22 }}
              className="w-full pb-6"
            >
              {/* Still-learning pill when card is cycling back */}
              {!isChecked && queue.length > total - masteredCount && (
                <div className="inline-flex items-center gap-1.5 bg-loss/10 text-loss border border-loss/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-5">
                  <ArrowRight className="w-3 h-3" /> Still learning — try again
                </div>
              )}

              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-8 md:mb-10 leading-tight tracking-tight text-foreground">
                {currentQuestion.question}
              </h2>

              <div className={`grid gap-3 md:gap-4 ${currentQuestion.type === 'multiple_choice' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-md'}`}>
                {displayOptions.map((option: string, i: number) => {
                  const isThisSelected = selectedAnswer === option;
                  const isThisCorrect  = option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

                  let cls = "bg-card border-2 border-border text-foreground";
                  let anim: any = {};

                  if (isChecked) {
                    if (isThisSelected && isThisCorrect) {
                      cls = "bg-gain/10 border-gain text-gain ring-2 ring-gain/20 shadow-md shadow-gain/10";
                      anim = { scale: [1, 1.04, 1], transition: { duration: 0.35, type: "spring" } };
                    } else if (isThisSelected && !isThisCorrect) {
                      cls = "bg-loss/10 border-loss text-loss ring-2 ring-loss/20";
                      anim = { x: [-6, 6, -4, 4, 0], transition: { duration: 0.35 } };
                    } else if (isThisCorrect) {
                      cls = "bg-gain/10 border-gain text-gain";
                    } else {
                      cls = "bg-muted/30 border-transparent opacity-40";
                    }
                  }

                  return (
                    <motion.button
                      key={i}
                      disabled={isChecked}
                      onClick={() => handleOptionClick(option)}
                      animate={anim}
                      whileHover={!isChecked ? { scale: 1.02 } : {}}
                      whileTap={!isChecked ? { scale: 0.97 } : {}}
                      className={`p-5 md:p-6 rounded-2xl text-left text-lg md:text-xl font-bold transition-colors duration-150 ${cls} ${!isChecked ? 'hover:border-primary hover:bg-primary/5 cursor-pointer' : 'cursor-default'}`}
                    >
                      {option}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer — feedback + continue ── */}
      <div className={`border-t-2 transition-colors duration-300 ${
        !isChecked ? 'border-border bg-background'
          : isCorrect ? 'bg-gain/10 border-gain/30'
          : 'bg-loss/10 border-loss/30'
      }`}>
        <div className="max-w-4xl mx-auto p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 min-h-[90px]">

          {/* Before answering — queue status hint */}
          {!isChecked && (
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-bold">
              <span className="bg-muted px-3 py-1 rounded-full">{queue.length} left in round</span>
              {masteredCount > 0 && <span className="bg-gain/10 text-gain px-3 py-1 rounded-full">{masteredCount} mastered</span>}
            </div>
          )}

          {/* After answering — explanation */}
          {isChecked && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 flex-1"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.6 }}
                className={`mt-0.5 p-1.5 rounded-full shrink-0 ${isCorrect ? 'bg-gain text-white' : 'bg-loss text-white'}`}
              >
                {isCorrect ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <X className="w-5 h-5 md:w-6 md:h-6" />}
              </motion.div>
              <div>
                <div className={`font-black text-base md:text-lg mb-1 ${isCorrect ? 'text-gain' : 'text-loss'}`}>
                  {isCorrect ? 'Correct!' : `Answer: ${currentQuestion?.correctAnswer}`}
                </div>
                <p className="text-foreground/80 font-medium text-sm md:text-base leading-relaxed max-w-xl">
                  {cleanExplanation(currentQuestion?.explanation ?? '')}
                </p>
              </div>
            </motion.div>
          )}

          {/* Continue button — always right-aligned */}
          <div className="w-full md:w-auto flex justify-end shrink-0">
            {isChecked ? (
              <button
                onClick={handleContinue}
                className={`w-full md:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest text-white transition-transform active:scale-95 text-base md:text-lg shadow-lg
                  ${isCorrect ? 'bg-gain hover:bg-gain/90 shadow-gain/20' : 'bg-loss hover:bg-loss/90 shadow-loss/20'}`}
              >
                {isCorrect ? 'Continue' : 'Got it — keep going'}
              </button>
            ) : (
              <button disabled className="w-full md:w-auto px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black uppercase tracking-widest bg-muted text-muted-foreground cursor-not-allowed text-base md:text-lg opacity-40">
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Learn() {
  const { data: curriculum, isLoading, isError } = useGetCurriculum({
    query: {
      queryKey: getGetCurriculumQueryKey(),
      staleTime: 0,
      refetchOnMount: 'always',
      retry: 1,
    },
  });
  const completeLesson = useCompleteLesson();
  const queryClient = useQueryClient();
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [lessonState, setLessonState] = useState<'reading' | 'quiz' | 'completing' | 'completed' | 'idle'>('idle');
  const [earnedData, setEarnedData] = useState<any>(null);

  // Totals
  const totalLessons = curriculum?.reduce((acc, stage) => acc + stage.levels.reduce((sum, level) => sum + level.totalLessons, 0), 0) || 27;
  const completedLessons = curriculum?.reduce((acc, stage) => acc + stage.levels.reduce((sum, level) => sum + level.completedLessons, 0), 0) || 0;
  const totalXp = curriculum?.reduce((acc, stage) => acc + stage.levels.reduce((sum, level) => sum + level.lessons.filter(l => l.completed).reduce((xp, l) => xp + l.xpReward, 0), 0), 0) || 0;

  // Find highest stage that is unlocked but not fully complete
  const currentStageIndex = curriculum?.findIndex(s => s.isUnlocked && s.levels.some(l => l.completedLessons < l.totalLessons));
  const activeStageIdx = currentStageIndex === -1 && curriculum?.length ? curriculum.length - 1 : currentStageIndex;

  const handleStartLesson = (lesson: any) => {
    setActiveLesson(lesson);
    setLessonState('quiz');
  };

  const handleQuizComplete = () => {
    setLessonState('completing');
    completeLesson.mutate({ lessonId: activeLesson.id }, {
      onSuccess: (data) => {
        setEarnedData(data);
        setLessonState('completed');
        
        queryClient.invalidateQueries({ queryKey: getGetCurriculumQueryKey() });
        queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
        queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      },
      onError: () => {
        setLessonState('idle');
        setActiveLesson(null);
        toast.error("Failed to complete lesson");
      }
    });
  };

  const closeLesson = () => {
    setActiveLesson(null);
    setLessonState('idle');
    setEarnedData(null);
  };

  const getStageColor = (stageStage: string) => {
    if (stageStage === 'easy') return { border: 'border-gain/50', bg: 'bg-gain/5', text: 'text-gain', solid: 'bg-gain', glow: 'shadow-lg shadow-gain/20' };
    if (stageStage === 'medium') return { border: 'border-accent/50', bg: 'bg-accent/5', text: 'text-accent', solid: 'bg-accent', glow: 'shadow-lg shadow-accent/20' };
    if (stageStage === 'hard') return { border: 'border-loss/50', bg: 'bg-loss/5', text: 'text-loss', solid: 'bg-loss', glow: 'shadow-lg shadow-loss/20' };
    return { border: 'border-primary/50', bg: 'bg-primary/5', text: 'text-primary', solid: 'bg-primary', glow: 'shadow-lg shadow-primary/20' };
  };

  const getCategoryIcon = (category: string, className: string) => {
    if (category === 'equities') return <TrendingUp className={className} />;
    if (category === 'etfs') return <Layers className={className} />;
    if (category === 'key_terms') return <BookOpen className={className} />;
    return <BookOpen className={className} />;
  };

  return (
    <Layout>
      <div className="space-y-10 pb-16">
        {/* Page Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-card border-2 border-border p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-full pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 uppercase italic text-foreground flex items-center gap-3">
              Mission Select
            </h1>
            <p className="text-muted-foreground font-medium text-lg max-w-lg">
              Complete stages. Master the market. Earn XP and level up your financial knowledge.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 relative z-10">
            <div className="bg-background border-2 border-border rounded-2xl p-4 flex-1 min-w-[160px] shadow-sm">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1">Total Progress</div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-foreground">{completedLessons}</span>
                <span className="text-lg font-bold text-muted-foreground">/ {totalLessons}</span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${totalLessons ? (completedLessons/totalLessons)*100 : 0}%` }} />
              </div>
            </div>
            
            <div className="bg-background border-2 border-border rounded-2xl p-4 flex-1 min-w-[160px] shadow-sm">
              <div className="text-xs font-black text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Zap className="w-4 h-4 text-accent" /> XP Earned
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-accent">{totalXp}</span>
                <span className="text-lg font-bold text-muted-foreground">XP</span>
              </div>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="space-y-12 animate-pulse">
            {[1,2,3].map(i => (
              <div key={i} className="h-[400px] bg-muted/50 rounded-[2rem] border-2 border-border" />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-card border-2 border-border rounded-3xl p-12 text-center flex flex-col items-center gap-4">
            <BookOpen className="w-16 h-16 text-muted-foreground opacity-30" />
            <h3 className="text-2xl font-black">Sign in to unlock lessons</h3>
            <p className="text-muted-foreground font-medium max-w-md">
              Create a free account to track your progress, earn XP, and complete all 27 lessons.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {curriculum?.map((stage, index) => {
              const colors = getStageColor(stage.stage);
              const isCurrent = index === activeStageIdx;
              const isCompleted = stage.levels.every(l => l.completedLessons === l.totalLessons);

              return (
                <section key={stage.stageNumber} className="relative">
                  {/* Stage Header */}
                  <div className="flex items-center gap-4 mb-6 px-2">
                    <div className={`px-5 py-2.5 rounded-xl font-black uppercase tracking-wider text-lg border-2 flex items-center gap-3 transition-shadow duration-500
                      ${stage.isUnlocked 
                        ? `bg-background ${colors.border} ${colors.text} ${isCurrent ? colors.glow : ''}` 
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'}`}
                    >
                      {!stage.isUnlocked && <Lock className="w-5 h-5" />}
                      Stage {stage.stageNumber}: {stage.stageLabel}
                    </div>
                    <div className="flex-1 h-0.5 bg-border rounded-full opacity-60" />
                    {isCompleted && (
                      <div className={`hidden sm:flex items-center gap-2 px-4 py-2 bg-epic/10 border-2 border-epic/30 text-epic rounded-xl font-bold uppercase text-sm`}>
                        <Star className="w-4 h-4 fill-epic" /> Stage Cleared
                      </div>
                    )}
                  </div>

                  {/* Stage Content */}
                  <div className={`relative rounded-[2rem] border-4 p-6 md:p-8 transition-all duration-700
                    ${stage.isUnlocked ? `${colors.bg} ${colors.border} ${isCurrent ? colors.glow : ''}` : 'bg-muted/40 border-muted opacity-90'}`}
                  >
                    {!stage.isUnlocked && (
                      <div className="absolute inset-0 z-20 backdrop-blur-[3px] bg-background/50 rounded-[1.8rem] flex flex-col items-center justify-center p-4">
                        <div className="bg-card border-2 border-border p-8 rounded-3xl flex flex-col items-center max-w-md text-center shadow-xl">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-5 border-2 border-border shadow-inner">
                            <Lock className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Stage Locked</h3>
                          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                            Complete all lessons in Stage {stage.stageNumber - 1} to unlock this sector.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                      {stage.levels.map((level) => {
                        const levelCompleted = level.completedLessons === level.totalLessons && level.totalLessons > 0;
                        
                        return (
                          <div key={level.levelNumber} className={`bg-card border-2 rounded-2xl flex flex-col overflow-hidden transition-all duration-300 relative
                            ${!level.isUnlocked ? 'opacity-80 border-border' : levelCompleted ? 'border-epic/50 shadow-md shadow-epic/5 hover:-translate-y-1' : `border-border hover:${colors.border} hover:shadow-md hover:-translate-y-1`}`}
                          >
                            {!level.isUnlocked && stage.isUnlocked && (
                              <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-not-allowed">
                                <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center border-2 border-border shadow-sm">
                                  <Lock className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div className="mt-3 font-bold text-sm text-muted-foreground uppercase tracking-wider bg-background px-3 py-1 rounded-full border border-border">Locked</div>
                              </div>
                            )}

                            {/* Level Card Header */}
                            <div className={`p-5 border-b-2 flex items-start gap-4
                              ${levelCompleted ? 'bg-epic/5 border-epic/20' : 'bg-muted/30 border-border'}`}
                            >
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-sm
                                ${levelCompleted ? 'bg-epic/10 border-epic/30 text-epic' : `bg-background ${colors.border} ${colors.text}`}`}
                              >
                                {getCategoryIcon(level.category, "w-7 h-7")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-1">Level {level.levelNumber}</div>
                                <h4 className="font-black text-lg text-foreground truncate">{level.categoryLabel}</h4>
                                <div className="flex items-center gap-3 mt-3">
                                  <div className="flex-1 h-2.5 bg-background border border-border rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-1000 ${levelCompleted ? 'bg-epic' : colors.solid}`} 
                                      style={{ width: `${level.totalLessons ? (level.completedLessons / level.totalLessons) * 100 : 0}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-black text-muted-foreground whitespace-nowrap">
                                    {level.completedLessons}/{level.totalLessons}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Lessons List */}
                            <div className="p-3 flex-1 flex flex-col gap-2">
                              {level.lessons.map((lesson, lessonIdx) => (
                                <button
                                  key={lesson.id}
                                  onClick={() => stage.isUnlocked && level.isUnlocked && !lesson.completed && handleStartLesson(lesson)}
                                  disabled={!stage.isUnlocked || !level.isUnlocked || lesson.completed}
                                  className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center gap-3 group
                                    ${lesson.completed
                                      ? 'bg-muted/50 border-transparent cursor-default'
                                      : lesson.started
                                      ? `bg-accent/5 border-accent/40 hover:${colors.border} hover:shadow-sm cursor-pointer`
                                      : `bg-background border-border hover:${colors.border} hover:shadow-sm cursor-pointer`}`}
                                >
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors
                                    ${lesson.completed
                                      ? 'bg-gain text-background border-gain'
                                      : lesson.started
                                      ? 'bg-accent/20 border-accent text-accent'
                                      : 'bg-muted border-muted-foreground/30 text-muted-foreground group-hover:border-current group-hover:text-foreground'}`}
                                  >
                                    {lesson.completed ? <CheckCircle2 className="w-5 h-5" /> : lesson.started ? <Play className="w-4 h-4 ml-0.5" /> : <span className="font-black text-sm">{lessonIdx + 1}</span>}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-bold truncate ${lesson.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
                                      {lesson.title}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs font-bold text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" /> {lesson.durationMinutes}m
                                      </span>
                                      <span className="flex items-center gap-1 text-accent">
                                        <Zap className="w-3.5 h-3.5 fill-accent/20" /> {lesson.xpReward} XP
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {!lesson.completed && (
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white transition-transform scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 ${colors.solid}`}>
                                      <Play className="w-4 h-4 ml-0.5" />
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                            
                            {levelCompleted && (
                              <div className="px-3 pb-3">
                                <div className="p-2.5 bg-epic/10 text-epic text-xs font-black uppercase tracking-widest rounded-xl text-center flex items-center justify-center gap-2 border border-epic/20">
                                  <Trophy className="w-4 h-4" /> Level Mastered
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Quiz Overlay */}
      <AnimatePresence>
        {activeLesson && lessonState === 'quiz' && (
          <QuizOverlay 
            lesson={activeLesson}
            onClose={closeLesson}
            onComplete={handleQuizComplete}
          />
        )}
      </AnimatePresence>

      {/* Completion Modals */}
      <AnimatePresence>
        {activeLesson && (lessonState === 'completing' || lessonState === 'completed') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-background/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`bg-card border-4 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]`}
              style={{ borderColor: lessonState === 'completed' ? 'hsl(var(--epic))' : 'hsl(var(--primary))' }}
            >
              {/* Top Banner */}
              <div className={`p-6 text-white ${lessonState === 'completed' ? 'bg-epic' : 'bg-primary'} transition-colors duration-500 relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <div className="uppercase font-black text-xs tracking-widest opacity-80 mb-2 flex items-center gap-2">
                      {lessonState === 'completed' ? (
                         <><Star className="w-3 h-3 fill-current" /> Mission Accomplished</>
                      ) : (
                         <><BookOpen className="w-3 h-3" /> Completing Lesson...</>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight">{activeLesson.title}</h2>
                  </div>
                  {lessonState !== 'completing' && (
                    <button onClick={closeLesson} className="p-2 hover:bg-black/20 rounded-full transition-colors shrink-0">
                      <X className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6 md:p-10 flex-1 overflow-y-auto">
                {lessonState === 'completing' && (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-6" />
                    <h3 className="text-2xl font-black uppercase text-primary tracking-widest animate-pulse">Calculating XP...</h3>
                  </div>
                )}

                {lessonState === 'completed' && earnedData && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center py-6"
                  >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                      transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                      className="w-28 h-28 bg-epic/10 border-4 border-epic text-epic rounded-full flex items-center justify-center mb-6 shadow-xl shadow-epic/20"
                    >
                      <Award className="w-14 h-14" />
                    </motion.div>
                    
                    <h3 className="text-4xl font-black mb-3 text-foreground tracking-tight">Lesson Complete!</h3>
                    <p className="text-muted-foreground font-medium text-lg mb-10">You've successfully mastered this material.</p>
                    
                    <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-accent/10 border-2 border-accent/30 p-5 rounded-3xl flex flex-col items-center relative overflow-hidden"
                      >
                        <div className="text-accent font-black text-4xl mb-2 flex items-center gap-1 relative z-10">
                          +<AnimatedCounter value={earnedData.xpEarned} /> <Zap className="w-8 h-8 fill-accent/20" />
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest text-accent relative z-10">XP Earned</div>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="bg-yellow-400/10 border-2 border-yellow-400/30 p-5 rounded-3xl flex flex-col items-center relative overflow-hidden"
                      >
                        <div className="text-yellow-500 font-black text-4xl mb-2 flex items-center gap-1 relative z-10">
                          +<AnimatedCounter value={earnedData.coinsEarned ?? 0} /> <Coins className="w-7 h-7" />
                        </div>
                        <div className="text-xs font-black uppercase tracking-widest text-yellow-600 relative z-10">Coins</div>
                      </motion.div>
                      
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="bg-primary/10 border-2 border-primary/30 p-5 rounded-3xl flex flex-col items-center relative overflow-hidden"
                      >
                        <div className="text-primary font-black text-4xl mb-2 relative z-10">
                          Lvl {earnedData.newLevel}
                        </div>
                        <div className="text-xs font-black uppercase tracking-widests text-primary relative z-10">Level</div>
                      </motion.div>
                    </div>
                    
                    {earnedData.leveledUp && (
                      <motion.div 
                        initial={{ y: 20, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6, type: "spring" }}
                        className="mt-8 bg-epic text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-epic/30"
                      >
                        <Trophy className="w-6 h-6" />
                        Level Up Reached!
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Bottom Actions */}
              {lessonState === 'completed' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="p-6 bg-muted/30 border-t-2 border-border flex justify-end"
                >
                  <button 
                    onClick={closeLesson}
                    className="bg-epic hover:bg-epic/90 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-md hover:shadow-lg hover:shadow-epic/20"
                  >
                    Finish <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
