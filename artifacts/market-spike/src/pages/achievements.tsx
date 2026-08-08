import React from 'react';
import { useListAchievements, useGetMyAchievements } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { motion } from 'framer-motion';
import {
  Lock, Zap,
  TrendingUp, BookOpen, Briefcase, GraduationCap, Activity, Cpu,
  Star, DollarSign, Trophy, Shield, Flame, Award, type LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp, BookOpen, Briefcase, GraduationCap, Activity, Cpu,
  Star, DollarSign, Trophy, Shield, Flame,
};

function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Award;
  return <Icon className={className ?? 'w-8 h-8'} />;
}

const RARITY_STYLES: Record<string, {
  card: string; icon: string; badge: string; glow: string; label: string;
}> = {
  legendary: {
    card: 'border-legendary/60 bg-gradient-to-br from-legendary/20 via-amber-50/50 to-card dark:via-amber-950/20',
    icon: 'bg-legendary/20 text-legendary',
    badge: 'bg-legendary text-black',
    glow: 'shadow-[0_0_24px_rgba(251,191,36,0.35)]',
    label: '⭐ Legendary',
  },
  epic: {
    card: 'border-epic/50 bg-gradient-to-br from-epic/20 via-purple-50/50 to-card dark:via-purple-950/20',
    icon: 'bg-epic/20 text-epic',
    badge: 'bg-epic text-white',
    glow: 'shadow-[0_0_18px_rgba(192,132,252,0.25)]',
    label: '💜 Epic',
  },
  rare: {
    card: 'border-primary/40 bg-gradient-to-br from-primary/15 via-blue-50/50 to-card dark:via-blue-950/20',
    icon: 'bg-primary/20 text-primary',
    badge: 'bg-primary text-white',
    glow: '',
    label: '🔷 Rare',
  },
  common: {
    card: 'border-border bg-card',
    icon: 'bg-muted text-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
    glow: '',
    label: 'Common',
  },
};

export default function Achievements() {
  const { data: allAchievements, isLoading: loadingAll } = useListAchievements({ query: { queryKey: ['/api/achievements'] } });
  const { data: myAchievements, isLoading: loadingMy } = useGetMyAchievements({ query: { queryKey: ['/api/achievements/me'] } });

  const earnedIds = new Set(myAchievements?.map(a => a.achievement.id) ?? []);
  const earned = allAchievements?.filter(a => earnedIds.has(a.id)) ?? [];
  const locked = allAchievements?.filter(a => !earnedIds.has(a.id)) ?? [];

  const achProgress = allAchievements?.length
    ? Math.round((earned.length / allAchievements.length) * 100)
    : 0;

  return (
    <Layout>
      <div className="space-y-8 pb-8">

        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-legendary/20 via-epic/10 to-primary/10 border-2 border-legendary/30 rounded-3xl p-6 md:p-8">
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-legendary/10" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-legendary/20 text-legendary flex items-center justify-center shrink-0 shadow-inner">
              <Trophy className="w-10 h-10" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-black tracking-tight mb-1">Trophy Room</h1>
              <p className="text-muted-foreground font-medium mb-3">
                {earned.length} of {allAchievements?.length ?? 0} trophies unlocked — {achProgress}% complete
              </p>
              <div className="max-w-md">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-legendary via-amber-400 to-yellow-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${achProgress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        {(loadingAll || loadingMy) && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => <div key={i} className="h-52 bg-muted rounded-3xl" />)}
          </div>
        )}

        {/* ── Earned trophies ── */}
        {earned.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-gain" />
              Unlocked ({earned.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earned.map((achievement, i) => {
                const styles = RARITY_STYLES[achievement.rarity] ?? RARITY_STYLES.common;
                const myAch = myAchievements?.find(a => a.achievement.id === achievement.id);
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
                    className={`relative rounded-3xl border-2 p-5 flex flex-col items-center text-center ${styles.card} ${styles.glow}`}
                  >
                    {/* Rarity badge */}
                    <div className={`absolute -top-px left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-0.5 rounded-b-xl uppercase tracking-wider ${styles.badge}`}>
                      {achievement.rarity}
                    </div>

                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 mt-4 shadow-inner ${styles.icon}`}>
                      <AchievementIcon name={achievement.icon} className="w-8 h-8" />
                    </div>

                    <h3 className="font-black text-base leading-tight mb-1 break-words w-full">{achievement.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium flex-1 mb-3 break-words w-full leading-snug">
                      {achievement.description}
                    </p>

                    <div className="w-full flex items-center justify-between text-xs font-bold border-t border-border/40 pt-2.5 mt-auto">
                      <span className="flex items-center gap-1 text-accent">
                        <Zap className="w-3 h-3" /> +{achievement.xpReward} XP
                      </span>
                      {myAch && (
                        <span className="text-muted-foreground font-mono">
                          {new Date(myAch.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Locked trophies ── */}
        {locked.length > 0 && (
          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-muted-foreground/50" />
              Locked ({locked.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {locked.map((achievement, i) => {
                const styles = RARITY_STYLES[achievement.rarity] ?? RARITY_STYLES.common;
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="relative rounded-3xl border-2 border-border bg-card/50 p-5 flex flex-col items-center text-center opacity-55 grayscale-[0.6]"
                  >
                    <Lock className="absolute top-3.5 right-3.5 w-4 h-4 text-muted-foreground" />

                    <div className={`absolute -top-px left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-0.5 rounded-b-xl uppercase tracking-wider ${styles.badge} opacity-70`}>
                      {achievement.rarity}
                    </div>

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 mt-4 bg-muted text-muted-foreground`}>
                      <AchievementIcon name={achievement.icon} className="w-8 h-8" />
                    </div>

                    <h3 className="font-black text-base leading-tight mb-1 break-words w-full">{achievement.name}</h3>
                    <p className="text-xs text-muted-foreground font-medium flex-1 mb-3 break-words w-full leading-snug">
                      {achievement.description}
                    </p>

                    <div className="w-full flex items-center justify-between text-xs font-bold border-t border-border/40 pt-2.5 mt-auto">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Zap className="w-3 h-3" /> {achievement.xpReward} XP
                      </span>
                      <span className="text-muted-foreground">Locked</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {!loadingAll && !loadingMy && (allAchievements?.length ?? 0) === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg">No trophies yet</p>
            <p className="text-sm mt-1">Play the river crossing game to start earning!</p>
          </div>
        )}
        <UpgradeBanner />
      </div>
    </Layout>
  );
}
