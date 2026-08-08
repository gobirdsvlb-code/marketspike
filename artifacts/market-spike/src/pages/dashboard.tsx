import React from 'react';
import { 
  useGetPortfolioSummary, 
  useGetActivityFeed, 
  useGetMarketMovers,
  useGetCurrentUser,
  useGetHoldings
} from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { AnimatedNumber } from '@/components/animated-number';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Award, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetPortfolioSummary({ query: { queryKey: ['/api/portfolio/summary'] } });
  const { data: activities, isLoading: loadingActivity } = useGetActivityFeed({ query: { queryKey: ['/api/activity'] } });
  const { data: movers, isLoading: loadingMovers } = useGetMarketMovers({ query: { queryKey: ['/api/market/movers'] } });
  const { data: user } = useGetCurrentUser({ query: { queryKey: ['/api/users/me'] } });

  const isPositive = summary ? summary.totalGainLoss >= 0 : true;

  if (loadingSummary) return <Layout><div className="flex h-64 items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div></Layout>;

  return (
    <Layout>
      <div className="space-y-6">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground font-medium">Welcome back, {user?.username}!</p>
          </div>
          <Link href="/market" className="hidden sm:flex bg-primary text-white px-6 py-3 rounded-xl font-bold shadow hover:-translate-y-1 transition-transform items-center gap-2">
            Trade Now <ArrowRight className="w-4 h-4" />
          </Link>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`md:col-span-2 p-8 rounded-3xl text-white relative overflow-hidden ${isPositive ? 'bg-gradient-to-br from-primary to-indigo-600' : 'bg-gradient-to-br from-destructive to-rose-700'}`}
          >
            <div className="relative z-10">
              <h2 className="font-bold opacity-80 mb-1 uppercase tracking-wider text-sm">Portfolio Value</h2>
              <div className="text-5xl md:text-7xl font-black font-mono mb-4">
                <AnimatedNumber value={summary?.totalValue || 0} format="currency" />
              </div>
              <div className="flex gap-4">
                <div className="bg-black/20 rounded-lg px-4 py-2 backdrop-blur-md">
                  <div className="text-xs opacity-80 font-bold uppercase mb-1">Total Return</div>
                  <div className={`font-mono font-bold text-lg flex items-center gap-1 ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <AnimatedNumber value={summary?.totalGainLoss || 0} format="currency" />
                    <span className="text-sm opacity-80 ml-1">
                      (<AnimatedNumber value={summary?.totalGainLossPercent || 0} format="percent" decimals={2} />)
                    </span>
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg px-4 py-2 backdrop-blur-md">
                  <div className="text-xs opacity-80 font-bold uppercase mb-1">Cash Balance</div>
                  <div className="font-mono font-bold text-lg">
                    <AnimatedNumber value={summary?.cashBalance || 0} format="currency" />
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative background shape */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card border-2 border-border rounded-3xl p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold uppercase tracking-wider text-sm text-muted-foreground">Daily Change</h2>
                {(summary?.dailyChange || 0) >= 0 ? 
                  <span className="bg-gain/20 text-gain px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><TrendingUp className="w-3 h-3" /> UP</span> : 
                  <span className="bg-loss/20 text-loss px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><TrendingDown className="w-3 h-3" /> DOWN</span>
                }
              </div>
              <div className={`text-4xl font-black font-mono ${(summary?.dailyChange || 0) >= 0 ? 'text-gain' : 'text-loss'}`}>
                {(summary?.dailyChange || 0) >= 0 ? '+' : ''}
                <AnimatedNumber value={summary?.dailyChange || 0} format="currency" />
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <h3 className="font-bold text-sm">Market Movers</h3>
              <div className="grid grid-cols-2 gap-2">
                {movers?.gainers.slice(0, 1).map(stock => (
                  <Link key={stock.symbol} href={`/market/${stock.symbol}`} className="bg-gain/10 border border-gain/20 rounded-xl p-3 hover:bg-gain/20 transition-colors">
                    <div className="font-bold text-sm">{stock.symbol}</div>
                    <div className="text-gain font-mono text-xs font-bold">+{stock.changePercent.toFixed(2)}%</div>
                  </Link>
                ))}
                {movers?.losers.slice(0, 1).map(stock => (
                  <Link key={stock.symbol} href={`/market/${stock.symbol}`} className="bg-loss/10 border border-loss/20 rounded-xl p-3 hover:bg-loss/20 transition-colors">
                    <div className="font-bold text-sm">{stock.symbol}</div>
                    <div className="text-loss font-mono text-xs font-bold">{stock.changePercent.toFixed(2)}%</div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <div className="md:col-span-2 bg-card border-2 border-border rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="text-primary w-5 h-5" /> Recent Activity
              </h2>
            </div>
            
            {loadingActivity ? (
              <div className="space-y-4 animate-pulse">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {activities?.slice(0, 5).map((activity) => {
                  let Icon = Activity;
                  let colorClass = "bg-primary/10 text-primary";
                  if (activity.type === 'trade') { Icon = TrendingUp; colorClass = "bg-secondary/10 text-secondary"; }
                  if (activity.type === 'achievement') { Icon = Award; colorClass = "bg-accent/20 text-amber-600"; }
                  if (activity.type === 'lesson') { Icon = BookOpen; colorClass = "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"; }
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold">{activity.title}</div>
                        <div className="text-sm text-muted-foreground truncate">{activity.description}</div>
                      </div>
                      <div className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  );
                })}
                {(!activities || activities.length === 0) && (
                  <div className="text-center py-10 text-muted-foreground">
                    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-bold">No activity yet</p>
                    <p className="text-sm">Make a trade or complete a lesson to get started!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions / Next Lesson */}
          <div className="space-y-6">
            <Link href="/market" className="block bg-secondary text-secondary-foreground p-6 rounded-3xl hover:scale-[1.02] transition-transform shadow-lg relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-500" />
              <TrendingUp className="w-8 h-8 mb-4 relative z-10" />
              <h3 className="text-2xl font-black relative z-10">Trade Stocks</h3>
              <p className="opacity-80 font-medium relative z-10">Explore the market and build your portfolio.</p>
            </Link>

            <Link href="/learn" className="block bg-card border-2 border-border p-6 rounded-3xl hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg mb-1">Keep Learning</h3>
              <p className="text-sm text-muted-foreground mb-4">Complete your next lesson to earn XP and level up faster.</p>
              <div className="text-primary font-bold text-sm flex items-center gap-1">
                Go to Lessons <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
