import React from 'react';
import { Layout } from '@/components/layout';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import {
  useGetCurrentUser, useListAchievements, useGetMyAchievements,
  useGetLeaderboard, useGetRiverCrossing, getGetRiverCrossingQueryKey,
} from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { Zap, Heart, Flame, Star, BookOpen, Trophy, BarChart2, Users, ChevronRight, Coins } from 'lucide-react';

// ── Animated water wave ───────────────────────────────────────────────────────
function WaterWave() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden pointer-events-none">
      <motion.svg
        viewBox="0 0 1200 64"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-0 w-[200%] h-full"
        animate={{ x: [0, '-50%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        preserveAspectRatio="none"
      >
        <path
          d="M0 32 C150 10 300 54 450 32 C600 10 750 54 900 32 C1050 10 1200 54 1350 32 C1500 10 1650 54 1800 32 C1950 10 2100 54 2250 32 C2400 10 2400 64 2400 64 L0 64 Z"
          fill="rgba(0,0,0,0.18)"
        />
      </motion.svg>
      <motion.svg
        viewBox="0 0 1200 64"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute bottom-0 w-[200%] h-full"
        animate={{ x: ['-50%', 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        preserveAspectRatio="none"
      >
        <path
          d="M0 40 C200 18 400 60 600 40 C800 18 1000 60 1200 40 C1400 18 1600 60 1800 40 C2000 18 2200 60 2400 40 L2400 64 L0 64 Z"
          fill="rgba(0,0,0,0.12)"
        />
      </motion.svg>
    </div>
  );
}

const DIFF_EMOJI: Record<string, string> = { easy: '🌱', medium: '🔥', hard: '⚡' };
const DIFF_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const DIFF_MULTIPLIER: Record<string, string> = { easy: '1×', medium: '1.5×', hard: '2×' };

export default function Home() {
  const { data: user } = useGetCurrentUser({ query: { queryKey: ['/api/users/me'] } });
  const { data: allAchievements } = useListAchievements({ query: { queryKey: ['/api/achievements'] } });
  const { data: myAchievements } = useGetMyAchievements({ query: { queryKey: ['/api/achievements/me'] } });
  const { data: leaderboard } = useGetLeaderboard({ limit: 50 }, { query: { queryKey: ['/api/leaderboard', { limit: 50 }] } });
  const { data: river } = useGetRiverCrossing({ query: { queryKey: getGetRiverCrossingQueryKey(), staleTime: 60_000 } });

  // XP progress
  function xpForLevel(level: number): number {
    if (level <= 1) return 0;
    const n = level - 1;
    return 200 * n + 50 * n * (n - 1);
  }
  function xpNeededThisLevel(level: number): number { return 200 + (level - 1) * 100; }
  const level = user?.level ?? 1;
  const xp = user?.xp ?? 0;
  const levelStartXp = xpForLevel(level);
  const xpThisLevel = xpNeededThisLevel(level);
  const currentLevelXp = Math.max(0, xp - levelStartXp);
  const xpProgress = Math.min((currentLevelXp / xpThisLevel) * 100, 100);
  const xpToNext = xpThisLevel - currentLevelXp;

  const myRank = leaderboard?.find(e => e.userId === user?.id)?.rank;
  const achCount = myAchievements?.length ?? 0;
  const achTotal = allAchievements?.length ?? 0;

  const avatarBg = user?.avatarColor ?? '#6366f1';
  const avatarInitials = user?.username?.substring(0, 2).toUpperCase() ?? '??';

  const difficulty = (river as any)?.difficulty ?? 'easy';
  const runsUntilChange = (river as any)?.runsUntilChange;
  const nextDifficulty = (river as any)?.nextDifficulty;

  return (
    <Layout>
      <div className="space-y-5 pb-8">

        {/* ═══════════════════════════════════════════════════════════
            RIVER CROSSING HERO — the unmistakable primary action
        ═══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Pulsing ring behind the card to draw the eye */}
          <motion.div
            className="absolute inset-0 rounded-3xl"
            animate={{ boxShadow: ['0 0 0 0px rgba(34,197,94,0.4)', '0 0 0 8px rgba(34,197,94,0)'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
          />

          <Link href="/play?autostart=1">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="relative rounded-3xl overflow-hidden cursor-pointer select-none"
              style={{ background: 'linear-gradient(160deg, #15803d 0%, #16a34a 40%, #166534 100%)' }}
            >
              {/* Subtle texture circles */}
              <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/5" />
              <div className="absolute top-4 left-1/2 w-32 h-32 rounded-full bg-white/4" />

              {/* User strip at top */}
              <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm border-2 border-white/30"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {avatarInitials}
                  </div>
                  <div>
                    <div className="text-green-200/70 text-[10px] font-bold uppercase tracking-widest leading-none">Welcome back</div>
                    <div className="text-white font-black text-sm leading-tight">{user?.username ?? '...'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-black/20 rounded-full px-3 py-1">
                    <Heart className="w-3.5 h-3.5 text-red-300" />
                    <span className="text-white font-black text-sm">{user?.lives ?? 5}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-black/20 rounded-full px-3 py-1">
                    <Flame className="w-3.5 h-3.5 text-orange-300" />
                    <span className="text-white font-black text-sm">{user?.streak ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Centre content */}
              <div className="relative z-10 flex flex-col items-center text-center px-6 pt-4 pb-8">
                {/* Bull */}
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="text-7xl mb-4 drop-shadow-2xl"
                >
                  🐂
                </motion.div>

                {/* Title */}
                <div className="text-white font-black text-4xl tracking-tight mb-1">River Crossing</div>
                <div className="text-green-200 text-sm font-medium mb-5">
                  Answer questions · Cross the river · Earn XP
                </div>

                {/* Difficulty badge row */}
                <div className="flex items-center gap-2 mb-6 flex-wrap justify-center">
                  <span className="inline-flex items-center gap-1.5 bg-black/25 border border-white/15 rounded-full px-3 py-1 text-white text-xs font-black uppercase tracking-wide">
                    {DIFF_EMOJI[difficulty]} {DIFF_LABEL[difficulty]}
                  </span>
                  <span className="inline-flex items-center gap-1 bg-yellow-400/20 border border-yellow-400/30 rounded-full px-3 py-1 text-yellow-200 text-xs font-black uppercase tracking-wide">
                    <Zap className="w-3 h-3" /> {DIFF_MULTIPLIER[difficulty]} XP
                  </span>
                  {runsUntilChange != null && runsUntilChange > 0 && nextDifficulty && (
                    <span className="text-green-300/70 text-xs font-medium">
                      {runsUntilChange} run{runsUntilChange !== 1 ? 's' : ''} until {DIFF_LABEL[nextDifficulty]}
                    </span>
                  )}
                </div>

                {/* Primary CTA button */}
                <div className="relative">
                  {/* Pulse ring on button */}
                  <motion.div
                    className="absolute -inset-2 rounded-3xl bg-white/25"
                    animate={{ scale: [1, 1.15], opacity: [0.45, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <div className="relative flex items-center gap-3 bg-white text-green-800 font-black text-lg uppercase tracking-widest px-10 py-4 rounded-2xl shadow-xl shadow-black/30">
                    Start Crossing
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* XP progress bar pinned to bottom of card */}
              <div className="relative z-10 px-5 pb-5">
                <div className="flex justify-between text-[10px] font-bold text-green-200/70 mb-1.5 uppercase tracking-widest">
                  <span>Level {level}</span>
                  <span>{xpToNext} XP to Level {level + 1}</span>
                </div>
                <div className="h-2 w-full bg-black/25 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/90 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
                  />
                </div>
              </div>

              <WaterWave />
            </motion.div>
          </Link>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            COMPACT STAT STRIP — horizontal, secondary
        ═══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-5 gap-2"
        >
          {[
            { icon: <Zap className="w-4 h-4" />, label: 'XP', value: (xp).toLocaleString(), color: 'text-accent' },
            { icon: <Coins className="w-4 h-4" />, label: 'Coins', value: (user?.coins ?? 0).toLocaleString(), color: 'text-yellow-500' },
            { icon: <Flame className="w-4 h-4" />, label: 'Streak', value: `${user?.streak ?? 0}d`, color: 'text-orange-500' },
            { icon: <Heart className="w-4 h-4" />, label: 'Lives', value: `${user?.lives ?? 5}/5`, color: 'text-loss' },
            { icon: <Star className="w-4 h-4" />, label: 'Rank', value: myRank ? `#${myRank}` : '—', color: 'text-legendary' },
          ].map(({ icon, label, value, color }) => (
            <div key={label} className="bg-card border-2 border-border rounded-2xl p-3 flex flex-col items-center gap-1">
              <div className={`${color}`}>{icon}</div>
              <div className="font-black text-base leading-none">{value}</div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════
            SECONDARY ACTIONS — clearly below the fold, supporting cast
        ═══════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Also available</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                href: '/learn',
                icon: <BookOpen className="w-6 h-6" />,
                label: 'Learn',
                sub: 'Bite-sized lessons',
                iconBg: 'bg-primary/10 text-primary',
                border: 'hover:border-primary',
                stat: achTotal > 0 ? `${achCount}/${achTotal} done` : null,
              },
              {
                href: '/trade',
                icon: <BarChart2 className="w-6 h-6" />,
                label: 'Trade',
                sub: 'Virtual market',
                iconBg: 'bg-gain/10 text-gain',
                border: 'hover:border-gain',
                stat: null,
              },
              {
                href: '/leaderboard',
                icon: <Trophy className="w-6 h-6" />,
                label: 'Ranks',
                sub: myRank ? `You're #${myRank}` : 'Global board',
                iconBg: 'bg-legendary/10 text-legendary',
                border: 'hover:border-legendary',
                stat: null,
              },
            ].map(({ href, icon, label, sub, iconBg, border, stat }) => (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`bg-card border-2 border-border ${border} rounded-2xl p-4 cursor-pointer transition-colors flex flex-col items-center gap-2 text-center`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
                    {icon}
                  </div>
                  <div>
                    <div className="font-black text-sm">{label}</div>
                    <div className="text-muted-foreground text-[11px] font-medium leading-tight">{stat ?? sub}</div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <UpgradeBanner />
      </div>
    </Layout>
  );
}
