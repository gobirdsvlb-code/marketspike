import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Link } from 'wouter';
import { Search, Zap } from 'lucide-react';
import { UpgradeBanner } from '@/components/UpgradeBanner';

interface UserEntry {
  id: number;
  username: string;
  avatarUrl: string | null;
  avatarColor: string;
  xp: number;
  level: number;
  streak: number;
}

export default function UsersDirectory() {
  const [users, setUsers] = useState<UserEntry[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/users/list${query ? `?q=${encodeURIComponent(query)}` : ''}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setIsLoading(false));
  }, [query]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6 pb-16">
        <header>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic text-foreground">
            Users
          </h1>
          <p className="text-muted-foreground font-medium text-lg mt-1">
            Find other traders on Market Spike.
          </p>
        </header>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by username…"
            className="w-full bg-card border-2 border-border rounded-xl pl-12 pr-4 py-4 font-bold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg"
          />
        </div>

        {/* User list */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-card border-2 border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground font-medium">
            No users found.
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <Link key={u.id} href={`/users/${encodeURIComponent(u.username)}`}>
                <div className="bg-card border-2 border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/50 transition-colors cursor-pointer">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white shrink-0"
                    style={{ backgroundColor: u.avatarColor }}
                  >
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg truncate">{u.username}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-accent" /> Lv {u.level}
                      </span>
                      <span>·</span>
                      <span>{u.xp.toLocaleString()} XP</span>
                      {u.streak > 0 && (
                        <>
                          <span>·</span>
                          <span>🔥 {u.streak}d</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-muted-foreground text-sm font-medium shrink-0">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        <UpgradeBanner />
      </div>
    </Layout>
  );
}
