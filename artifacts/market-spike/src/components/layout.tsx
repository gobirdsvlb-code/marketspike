import React from 'react';
import { Link, useLocation } from 'wouter';
import { useGetCurrentUser } from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { SpikeMascot } from './spike-mascot';
import { 
  GraduationCap, 
  Trophy, 
  Crown,
  Users,
  UserCircle,
  Waves,
  Menu,
  X,
  Zap,
  Heart,
  Home,
  Sparkles,
  Presentation,
  LogIn,
  BookOpen,
  Wrench,
  Coins,
  BarChart3,
} from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { data: user } = useGetCurrentUser({ query: { queryKey: ['/api/users/me'] } });
  const { user: authUser, openAuthModal } = useAuth();
  const [pendingFriendCount, setPendingFriendCount] = React.useState(0);

  // Poll for pending friend requests every 30s when logged in
  React.useEffect(() => {
    if (!authUser) { setPendingFriendCount(0); return; }
    const fetch_ = () =>
      fetch('/api/friends/pending-count', { credentials: 'include' })
        .then(r => r.ok ? r.json() : { count: 0 })
        .then((d: { count: number }) => setPendingFriendCount(d.count))
        .catch(() => {});
    fetch_();
    const id = setInterval(fetch_, 30_000);
    return () => clearInterval(id);
  }, [authUser?.id]);

  const navItems = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/play', label: 'Play', icon: Waves },
    { href: '/trade', label: 'Trade', icon: BarChart3 },
    { href: '/learn', label: 'Learn', icon: GraduationCap },
    { href: '/achievements', label: 'Achievements', icon: Trophy },
    { href: '/leaderboard', label: 'Leaderboard', icon: Crown },
    { href: '/friends', label: 'Friends', icon: Users },
    { href: '/profile', label: 'Profile', icon: UserCircle },
  ];

  const upgradeItem = { href: '/upgrade', label: 'Upgrade', icon: Sparkles };


  // Progressive level curve: level N → N+1 costs 200 + (N-1)*100 XP
  function xpForLevel(level: number): number {
    if (level <= 1) return 0;
    const n = level - 1;
    return 200 * n + 50 * n * (n - 1);
  }
  function xpNeededThisLevel(level: number): number {
    return 200 + (level - 1) * 100;
  }
  const userLevel = user?.level ?? 1;
  const userXp = user?.xp ?? 0;
  const levelStartXp = xpForLevel(userLevel);
  const xpThisLevel = xpNeededThisLevel(userLevel);
  const currentLevelXp = Math.max(0, userXp - levelStartXp);
  const progressPercent = Math.min((currentLevelXp / xpThisLevel) * 100, 100);

  // Bottom nav items for mobile (most important pages)
  const bottomNavItems = [
    { href: '/home',         label: 'Home',    icon: Home },
    { href: '/play',         label: 'Play',    icon: Waves },
    { href: '/trade',        label: 'Trade',   icon: BarChart3 },
    { href: '/learn',        label: 'Learn',   icon: GraduationCap },
    { href: '/leaderboard',  label: 'Ranks',   icon: Crown },
    { href: '/friends',      label: 'Friends', icon: Users },
    { href: '/profile',      label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-background">
      {/* Mobile Header — 2× size bar, no hamburger */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b z-50 sticky top-0">
        <Link href="/home" className="flex items-center gap-2 font-black text-base text-primary">
          <div className="w-10 h-10 shrink-0"><SpikeMascot className="text-primary" variant="happy" /></div>
          MARKET SPIKE
        </Link>
        <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
          {user && (
            <span className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-accent" />
              Lv {user.level}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Heart key={i} className={`w-4 h-4 ${i < (user?.lives ?? 5) ? 'fill-loss text-loss' : 'text-muted-foreground/30'}`} />
            ))}
          </span>
        </div>
      </header>

      {/* Sidebar — desktop only */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 z-40
        -translate-x-full md:translate-x-0
      `}>
        <div className="p-6 hidden md:flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <SpikeMascot className="w-10 h-10 text-white" variant="cool" />
            <span className="font-black text-2xl tracking-tight">MARKET<br/>SPIKE</span>
          </div>
          {authUser ? (
            /* Coin balance pill for logged-in users */
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-400/15 w-fit">
              <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span className="text-xs font-black text-yellow-300">
                {(user?.coins ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-white/50 font-medium">coins</span>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/60 hover:text-white hover:bg-white/10 transition-all w-fit"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              Sign In
            </button>
          )}
        </div>

        {/* User HUD */}
        {user && (
          <div className="px-6 py-4 max-[375px]:px-3 max-[375px]:py-2 mx-4 mb-6 max-[375px]:mb-3 bg-white/10 rounded-xl glass-card text-white">
            <div className="flex items-center gap-3 mb-3 max-[375px]:mb-2">
              <div
                className="w-12 h-12 max-[375px]:w-9 max-[375px]:h-9 rounded-full flex items-center justify-center font-bold text-xl max-[375px]:text-base uppercase border-2 border-white/20 shadow-lg overflow-hidden shrink-0"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.avatarUrl?.startsWith('data:') || user.avatarUrl?.startsWith('http')
                  ? <img src={user.avatarUrl} className="w-full h-full object-cover" />
                  : user.avatarUrl && user.avatarUrl.length <= 8
                    ? <span className="text-2xl max-[375px]:text-lg leading-none">{user.avatarUrl}</span>
                    : <span className="text-primary-foreground">{user.username.substring(0,2)}</span>
                }
              </div>
              <div>
                <div className="font-bold max-[375px]:text-sm">{user.username}</div>
                <div className="text-sm max-[375px]:text-xs font-mono text-white/80 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent" /> 
                  Level {user.level}
                </div>
              </div>
            </div>
            
            {/* XP Bar */}
            <div className="mt-2 max-[375px]:mt-1">
              <div className="flex justify-between text-xs font-mono mb-1 font-bold">
                <span>{currentLevelXp} XP</span>
                <span className="text-white/60">{xpThisLevel} XP</span>
              </div>
              <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            
            <div className="mt-4 max-[375px]:mt-2 pt-3 max-[375px]:pt-2 border-t border-white/10 flex justify-between items-center font-mono">
              <span className="text-white/60 text-xs uppercase">Lives</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Heart 
                    key={i}
                    className={`w-4 h-4 max-[375px]:w-3 max-[375px]:h-3 ${i < user.lives ? 'fill-loss text-loss' : 'text-white/20'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            const isFriends = item.href === '/friends';
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 min-h-[44px] flex items-center gap-3 px-4 rounded-xl font-bold transition-all
                  ${isActive
                    ? 'bg-white text-sidebar font-black shadow-lg scale-[1.02]'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <div className="relative shrink-0">
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  {isFriends && pendingFriendCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                      {pendingFriendCount > 9 ? '9+' : pendingFriendCount}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Upgrade CTA — pinned above the bottom */}
        <div className="px-4 pb-2 pt-2 space-y-2">
          {(() => {
            const isActive = location === upgradeItem.href;
            return (
              <Link
                href={upgradeItem.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-black transition-all
                  ${isActive
                    ? 'bg-white text-sidebar shadow-lg scale-[1.02]'
                    : 'bg-accent/20 text-accent border border-accent/40 hover:bg-accent/30 hover:text-accent'
                  }
                `}
              >
                <upgradeItem.icon className="w-5 h-5" />
                {upgradeItem.label}
              </Link>
            );
          })()}

          {/* Speech tab — only visible to authorized email */}
          {user?.email === 'vaughnlevibrantley@gmail.com' && (() => {
            const isActive = location === '/speech';
            return (
              <Link
                href="/speech"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-black transition-all
                  ${isActive
                    ? 'bg-white text-sidebar shadow-lg scale-[1.02]'
                    : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/70'
                  }
                `}
              >
                <Presentation className="w-5 h-5" />
                Speech
              </Link>
            );
          })()}
        </div>

        <div className="pb-4" />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        {/* extra bottom padding on mobile so content clears the bottom nav */}
        <div className="p-4 pb-24 md:pb-8 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t flex items-stretch">
        {bottomNavItems.map((item) => {
          const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
          const isFriends = item.href === '/friends';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
                ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {isFriends && pendingFriendCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5 leading-none">
                    {pendingFriendCount > 9 ? '9+' : pendingFriendCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : ''}`}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
