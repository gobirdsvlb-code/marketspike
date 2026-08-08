import { useState } from 'react';
import { Check, X, Heart, Sparkles, Zap, Shield, Star, Coins, Package } from 'lucide-react';
import { toast } from 'sonner';
import { Layout } from '@/components/layout';
import { SpikeMascot } from '@/components/spike-mascot';
import { useGetCurrentUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    badge: null,
    highlight: false,
    cta: 'Current Plan',
    ctaDisabled: true,
    color: 'bg-card border-border',
    features: [
      { label: '5 hearts per day', included: true },
      { label: 'Access to all games', included: true },
      { label: 'Basic achievements', included: true },
      { label: 'Leaderboard', included: true },
      { label: 'Unlimited hearts', included: false },
      { label: '400 coins / day', included: false },
      { label: 'Exclusive Spike badge', included: false },
      { label: '900 coins / day + 2× XP', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Spike Pro',
    price: '$4.99',
    period: 'per month',
    badge: 'Most Popular',
    highlight: true,
    cta: 'Go Pro →',
    ctaDisabled: false,
    ctaLink: 'https://www.foundersweekends.com/api/pay?venture=646c3a71-f44e-4e0b-a3aa-d57d624c84d8&amount=499&name=Venture+1',
    color: 'bg-primary border-primary',
    features: [
      { label: '5 hearts per day', included: true },
      { label: 'Access to all games', included: true },
      { label: 'Basic achievements', included: true },
      { label: 'Leaderboard', included: true },
      { label: 'Unlimited hearts', included: true },
      { label: '400 coins / day', included: true },
      { label: 'Exclusive Spike badge', included: false },
      { label: '900 coins / day + 2× XP', included: false },
    ],
  },
  {
    id: 'elite',
    name: 'Spike Elite',
    price: '$9.99',
    period: 'per month',
    badge: 'Best Value',
    highlight: false,
    cta: 'Go Elite →',
    ctaDisabled: false,
    ctaLink: 'https://www.foundersweekends.com/api/pay?venture=646c3a71-f44e-4e0b-a3aa-d57d624c84d8&amount=999&name=Venture+1',
    color: 'bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-500 border-yellow-500',
    features: [
      { label: '5 hearts per day', included: true },
      { label: 'Access to all games', included: true },
      { label: 'Basic achievements', included: true },
      { label: 'Leaderboard', included: true },
      { label: 'Unlimited hearts', included: true },
      { label: '400 coins / day', included: true },
      { label: 'Exclusive Spike badge', included: true },
      { label: '900 coins / day + 2× XP', included: true },
    ],
  },
];

const perks = [
  {
    icon: Heart,
    title: 'Unlimited Hearts',
    description: 'Never stop playing. No more waiting for lives to refill — keep learning all day.',
    color: 'text-loss bg-loss/10',
  },
  {
    icon: Shield,
    title: 'Ad-Free',
    description: 'Zero interruptions. Pure focus on learning and levelling up Spike.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: Zap,
    title: '2× Streak XP',
    description: 'Elite members earn double XP on their daily streak bonus. Level up faster.',
    color: 'text-accent bg-accent/10',
  },
  {
    icon: Star,
    title: 'Exclusive Badge',
    description: 'Show off your Elite status with a special golden badge on the leaderboard.',
    color: 'text-yellow-500 bg-yellow-500/10',
  },
];

const coinBundles = [
  { id: 'starter', coins: 500,   price: '$0.99',  label: 'Starter',  bonus: null,          popular: false },
  { id: 'value',   coins: 2000,  price: '$2.99',  label: 'Value',    bonus: '+200 bonus',  popular: true  },
  { id: 'mega',    coins: 5500,  price: '$6.99',  label: 'Mega',     bonus: '+500 bonus',  popular: false },
  { id: 'ultra',   coins: 15000, price: '$14.99', label: 'Ultra',    bonus: '+2,000 bonus',popular: false },
];

export default function Upgrade() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { data: user } = useGetCurrentUser();
  const [buyingBundle, setBuyingBundle] = useState<string | null>(null);

  const handleBuyBundle = async (bundleId: string) => {
    if (!authUser) { toast.error("Sign in to buy coins"); return; }
    setBuyingBundle(bundleId);
    try {
      const r = await fetch('/api/coins/buy-bundle', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      const bundle = coinBundles.find(b => b.id === bundleId)!;
      toast.success(`🪙 +${bundle.coins.toLocaleString()} coins added!`);
      queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    } catch (e: any) {
      toast.error(e.message || "Purchase failed");
    } finally {
      setBuyingBundle(null);
    }
  };

  return (
    <Layout>
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
          <SpikeMascot className="w-14 h-14 text-primary" variant="excited" />
        </div>
        <h1 className="text-4xl font-black text-foreground mb-3">
          Unlock Full Power
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Upgrade your account to play without limits — unlimited hearts, daily coins, and exclusive rewards.
        </p>
      </div>

      {/* Perks row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {perks.map((perk) => (
          <div key={perk.title} className="bg-card rounded-2xl p-5 border border-border text-center">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${perk.color}`}>
              <perk.icon className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm mb-1">{perk.title}</div>
            <p className="text-xs text-muted-foreground leading-snug">{perk.description}</p>
          </div>
        ))}
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-2xl border-2 p-6 flex flex-col transition-transform hover:scale-[1.01] ${plan.color} ${
              plan.highlight ? 'text-white shadow-2xl shadow-primary/30 scale-[1.02]' : ''
            }`}
          >
            {plan.badge && (
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide shadow ${
                plan.highlight ? 'bg-accent text-black' : 'bg-yellow-400 text-black'
              }`}>
                <Sparkles className="inline w-3 h-3 mr-1" />
                {plan.badge}
              </div>
            )}
            <div className="mb-6">
              <div className={`text-sm font-bold uppercase tracking-widest mb-1 ${plan.highlight ? 'text-white/70' : 'text-muted-foreground'}`}>
                {plan.name}
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-white/60' : 'text-muted-foreground'}`}>
                  {plan.period}
                </span>
              </div>
            </div>
            <ul className="space-y-3 flex-1 mb-6">
              {plan.features.map((f) => (
                <li key={f.label} className="flex items-center gap-2.5 text-sm">
                  {f.included ? (
                    <Check className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-accent' : 'text-primary'}`} />
                  ) : (
                    <X className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-white/30' : 'text-muted-foreground/40'}`} />
                  )}
                  <span className={f.included ? '' : (plan.highlight ? 'text-white/40' : 'text-muted-foreground/50')}>
                    {f.label}
                  </span>
                </li>
              ))}
            </ul>
            <button
              disabled={plan.ctaDisabled}
              onClick={() => {
                if (plan.ctaDisabled) return;
                if ((plan as any).ctaLink) window.open((plan as any).ctaLink, '_blank', 'noopener,noreferrer');
              }}
              className={`w-full py-3 rounded-xl font-black text-sm transition-all
                ${plan.ctaDisabled
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : plan.highlight
                    ? 'bg-white text-primary hover:bg-white/90 shadow-lg hover:shadow-xl'
                    : 'bg-primary text-white hover:bg-primary/90 shadow hover:shadow-lg'
                }
              `}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* ── Coin Bundles ── */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 flex items-center justify-center">
            <Coins className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Buy Spike Coins</h2>
            <p className="text-sm text-muted-foreground">Spend coins on premium avatar colors and profile upgrades.</p>
          </div>
          {user && (
            <div className="ml-auto flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-xl px-4 py-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="font-black text-yellow-600">{(user.coins ?? 0).toLocaleString()}</span>
              <span className="text-xs text-muted-foreground font-medium">coins</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {coinBundles.map((bundle) => (
            <div
              key={bundle.id}
              className={`relative bg-card border-2 rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:scale-[1.02] ${
                bundle.popular ? 'border-yellow-400 shadow-lg shadow-yellow-400/20' : 'border-border'
              }`}
            >
              {bundle.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
                  Best Value
                </div>
              )}
              <div className="w-14 h-14 rounded-2xl bg-yellow-400/15 flex items-center justify-center mb-3">
                <Coins className="w-7 h-7 text-yellow-500" />
              </div>
              <div className="text-2xl font-black text-foreground">{bundle.coins.toLocaleString()}</div>
              <div className="text-xs font-bold text-muted-foreground mb-0.5">coins</div>
              {bundle.bonus && (
                <div className="text-xs font-black text-yellow-600 bg-yellow-400/10 px-2 py-0.5 rounded-full mb-2">
                  {bundle.bonus}
                </div>
              )}
              <div className="font-black text-lg text-foreground mt-auto mb-3">{bundle.price}</div>
              <button
                onClick={() => handleBuyBundle(bundle.id)}
                disabled={buyingBundle === bundle.id}
                className={`w-full py-2.5 rounded-xl font-black text-sm transition-all ${
                  bundle.popular
                    ? 'bg-yellow-400 text-black hover:bg-yellow-300 shadow-md'
                    : 'bg-primary text-white hover:bg-primary/90'
                } disabled:opacity-60`}
              >
                {buyingBundle === bundle.id ? '…' : `Buy ${bundle.label}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        All plans auto-renew. Cancel anytime. Questions? Contact us at support@marketspike.app
      </p>
    </Layout>
  );
}
