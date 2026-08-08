import React from 'react';
import { useGetLeaderboard, useGetCurrentUser } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { motion } from 'framer-motion';
import { Crown, Zap } from 'lucide-react';

const MEDAL = ['🥇', '🥈', '🥉'];
const PODIUM_HEIGHTS = ['h-28', 'h-20', 'h-16'];
const PODIUM_COLORS = [
  'bg-legendary border-legendary/60 text-black shadow-[0_0_24px_rgba(251,191,36,0.45)]',
  'bg-slate-300 border-slate-400 text-slate-800',
  'bg-amber-700/80 border-amber-800 text-amber-100',
];

function Avatar({ username, avatarColor, size = 'md' }: { username: string; avatarColor?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'md' ? 'w-10 h-10 text-base' : 'w-8 h-8 text-xs';
  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-black border-2 border-white/30 shadow-inner text-white`}
      style={{ backgroundColor: avatarColor ?? '#6366f1' }}
    >
      {username.substring(0, 2).toUpperCase()}
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak === 0) {
    return <span className="text-xs text-muted-foreground font-bold">— day streak</span>;
  }
  return (
    <span className="text-xs font-bold flex items-center gap-0.5 text-orange-500">
      🔥 {streak} day{streak !== 1 ? 's' : ''}
    </span>
  );
}

export default function Leaderboard() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 }, { query: { queryKey: ['/api/leaderboard', { limit: 50 }] } });
  const { data: user } = useGetCurrentUser({ query: { queryKey: ['/api/users/me'] } });

  const top3 = leaderboard?.slice(0, 3) ?? [];
  const rest = leaderboard?.slice(3) ?? [];

  // Re-order podium: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumRanks = [2, 1, 3];

  return (
    <Layout>
      <div className="space-y-8 pb-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-1 flex items-center gap-3">
              <Crown className="w-9 h-9 text-legendary" /> Leaderboard
            </h1>
            <p className="text-muted-foreground font-medium">Top investors on Market Spike</p>
          </div>
          {user && leaderboard && (
            <div className="hidden md:flex flex-col items-end">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Your rank</div>
              <div className="text-3xl font-black text-primary">
                #{leaderboard.find(e => e.userId === user.id)?.rank ?? '—'}
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-muted rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* ── Podium (top 3) ── */}
            {top3.length > 0 && (
              <div className="bg-gradient-to-b from-primary/10 to-card border-2 border-border rounded-3xl p-6 md:p-8">
                <div className="flex items-end justify-center gap-4 md:gap-8 mb-2">
                  {podiumOrder.map((entry, pi) => {
                    if (!entry) return null;
                    const rank = podiumRanks[pi];
                    const rankIdx = rank - 1;
                    const isMe = user?.id === entry.userId;
                    const isFirst = rank === 1;

                    return (
                      <motion.div
                        key={entry.userId}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: rankIdx * 0.12, type: 'spring', stiffness: 250, damping: 20 }}
                        className="flex flex-col items-center gap-2"
                      >
                        {/* Crown on #1 */}
                        {isFirst && (
                          <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                            className="text-3xl select-none"
                          >
                            👑
                          </motion.div>
                        )}

                        {/* Avatar */}
                        <div className={`relative ${isFirst ? 'scale-110' : ''}`}>
                          <Avatar username={entry.username} avatarColor={entry.avatarColor} size={isFirst ? 'lg' : 'md'} />
                          {isMe && (
                            <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[8px] px-1.5 py-0.5 rounded-full font-black">YOU</div>
                          )}
                        </div>

                        {/* Name + XP + Streak */}
                        <div className="text-center">
                          <div className={`font-black ${isFirst ? 'text-base' : 'text-sm'} max-w-[80px] truncate`}>{entry.username}</div>
                          <div className="text-xs text-muted-foreground font-mono font-bold flex items-center gap-0.5 justify-center">
                            <Zap className="w-3 h-3 text-accent" />{entry.xp.toLocaleString()}
                          </div>
                          <div className="text-xs text-orange-500 font-bold mt-0.5">
                            {(entry.streak ?? 0) > 0 ? `🔥 ${entry.streak}d` : ''}
                          </div>
                        </div>

                        {/* Podium block */}
                        <div className={`w-20 md:w-24 ${PODIUM_HEIGHTS[rankIdx]} rounded-t-2xl border-2 ${PODIUM_COLORS[rankIdx]} flex items-center justify-center`}>
                          <span className="text-3xl select-none">{MEDAL[rankIdx]}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Rest of leaderboard ── */}
            {rest.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">Rankings</h2>
                {rest.map((entry, i) => {
                  const isMe = user?.id === entry.userId;
                  const maxXp = Math.max(...(leaderboard?.map(e => e.xp) ?? [1]));
                  const xpPct = maxXp > 0 ? (entry.xp / maxXp) * 100 : 0;

                  return (
                    <motion.div
                      key={entry.userId}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-colors ${
                        isMe
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:bg-muted/30'
                      }`}
                    >
                      {/* Rank */}
                      <div className="w-8 text-center font-black text-lg text-muted-foreground shrink-0">
                        {entry.rank}
                      </div>

                      {/* Avatar */}
                      <Avatar username={entry.username} avatarColor={entry.avatarColor} size="sm" />

                      {/* Name + XP bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-sm truncate">{entry.username}</span>
                          {isMe && <span className="bg-primary text-white text-[9px] px-1.5 py-0.5 rounded-full font-black shrink-0">YOU</span>}
                          <span className="text-xs text-muted-foreground font-bold ml-auto shrink-0">Lv {entry.level}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: `${xpPct}%` }} />
                        </div>
                      </div>

                      {/* XP + Streak */}
                      <div className="text-right shrink-0">
                        <div className="font-black text-sm flex items-center gap-1 justify-end">
                          <Zap className="w-3.5 h-3.5 text-accent" />
                          {entry.xp.toLocaleString()}
                        </div>
                        <StreakBadge streak={entry.streak ?? 0} />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {!leaderboard?.length && (
              <div className="text-center py-16 text-muted-foreground">
                <Crown className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg">No rankings yet</p>
                <p className="text-sm mt-1">Be the first to play and claim the top spot!</p>
              </div>
            )}
          </>
        )}
        <UpgradeBanner />
      </div>
    </Layout>
  );
}
