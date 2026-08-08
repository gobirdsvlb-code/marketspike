import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Link, useParams } from 'wouter';
import { Zap, Flame, Trophy, Calendar, Loader2 } from 'lucide-react';
import { UpgradeBanner } from '@/components/UpgradeBanner';

interface PublicUser {
  id: number;
  username: string;
  avatarUrl: string | null;
  avatarColor: string;
  bio: string;
  xp: number;
  level: number;
  streak: number;
  createdAt: string;
}

interface UserEntry {
  id: number;
  username: string;
  avatarUrl: string | null;
  avatarColor: string;
  xp: number;
  level: number;
  streak: number;
}

export default function UserProfile() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username ?? '');
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [others, setOthers] = useState<UserEntry[]>([]);

  useEffect(() => {
    if (!username) return;
    setIsLoading(true);
    setNotFound(false);
    fetch(`/api/users/profile/${encodeURIComponent(username)}`, { credentials: 'include' })
      .then(async r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then(data => { if (data) setProfile(data); })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [username]);

  // Load other players (excluding the current profile)
  useEffect(() => {
    fetch('/api/users/list', { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((all: UserEntry[]) => {
        const filtered = all.filter(u => u.username.toLowerCase() !== username.toLowerCase());
        // shuffle and take 6
        const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, 6);
        setOthers(shuffled);
      })
      .catch(() => {});
  }, [username]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (notFound || !profile) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="text-6xl mb-4">🐂</div>
          <h2 className="text-2xl font-black mb-2">User Not Found</h2>
          <p className="text-muted-foreground">No one by that username exists on Market Spike.</p>
        </div>
      </Layout>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const stats = [
    { icon: <Zap className="w-5 h-5 text-accent" />, label: 'Level', value: profile.level },
    { icon: <Trophy className="w-5 h-5 text-yellow-500" />, label: 'XP', value: profile.xp.toLocaleString() },
    { icon: <Flame className="w-5 h-5 text-orange-500" />, label: 'Streak', value: `${profile.streak}d` },
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        {/* Profile card */}
        <div className="bg-card border-2 border-border rounded-3xl p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black text-white shrink-0 shadow-lg"
            style={{ backgroundColor: profile.avatarColor }}
          >
            {profile.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl font-black tracking-tight">{profile.username}</h1>
            {profile.bio && (
              <p className="text-muted-foreground mt-2 font-medium">{profile.bio}</p>
            )}
            <div className="flex items-center gap-1.5 mt-3 text-sm text-muted-foreground justify-center sm:justify-start">
              <Calendar className="w-4 h-4" />
              Member since {memberSince}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card border-2 border-border rounded-2xl p-4 text-center">
              <div className="flex justify-center mb-2">{s.icon}</div>
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* More Players */}
        {others.length > 0 && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-3">More Players</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {others.map(u => (
                <Link key={u.id} href={`/users/${encodeURIComponent(u.username)}`}>
                  <div className="bg-card border-2 border-border rounded-2xl p-3 flex items-center gap-3 hover:border-primary/40 transition-colors cursor-pointer">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                      style={{ backgroundColor: u.avatarColor }}
                    >
                      {u.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">{u.username}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3 text-accent" /> Lv {u.level}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <UpgradeBanner />
      </div>
    </Layout>
  );
}
