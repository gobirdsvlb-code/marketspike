import { Link } from 'wouter';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function UpgradeBanner() {
  const { user } = useAuth();
  // Don't show if already premium (future-proof hook point)
  if ((user as any)?.isPremium) return null;

  return (
    <Link href="/upgrade">
      <div className="mt-8 flex items-center gap-3 bg-accent/10 border-2 border-accent/30 rounded-2xl px-5 py-3.5 hover:bg-accent/20 hover:border-accent/50 transition-all cursor-pointer group">
        <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm text-foreground group-hover:text-accent transition-colors">
            Upgrade to Pro
          </div>
          <div className="text-xs text-muted-foreground font-medium leading-tight">
            Unlimited lives · 2× XP · exclusive badges
          </div>
        </div>
        <span className="text-xs font-black text-accent shrink-0">See plans →</span>
      </div>
    </Link>
  );
}
