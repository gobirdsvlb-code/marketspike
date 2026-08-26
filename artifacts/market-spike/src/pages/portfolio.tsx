import React from 'react';
import { useGetHoldings, useGetPortfolioSummary } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { Link } from 'wouter';
import { AnimatedNumber } from '@/components/animated-number';
import { TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Portfolio() {
  const { data: holdings, isLoading } = useGetHoldings({ query: { queryKey: ['/api/portfolio/holdings'] } });
  const { data: summary } = useGetPortfolioSummary({ query: { queryKey: ['/api/portfolio/summary'] } });

  const hasHoldings = holdings && holdings.length > 0;

  return (
    <Layout>
      <div className="space-y-6">
        <header className="mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-2">Portfolio</h1>
          <p className="text-muted-foreground font-medium">Manage your investments and track your performance.</p>
        </header>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-card border-2 border-border p-5 rounded-2xl">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Value</div>
              <div className="font-mono text-2xl font-black">${summary.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
            <div className="bg-card border-2 border-border p-5 rounded-2xl">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Total Return</div>
              <div className={`font-mono text-2xl font-black ${summary.totalGainLoss >= 0 ? 'text-gain' : 'text-loss'}`}>
                {summary.totalGainLoss >= 0 ? '+' : ''}${summary.totalGainLoss.toLocaleString(undefined, {minimumFractionDigits: 2})}
              </div>
            </div>
            <div className="bg-card border-2 border-border p-5 rounded-2xl">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Return %</div>
              <div className={`font-mono text-2xl font-black ${summary.totalGainLossPercent >= 0 ? 'text-gain' : 'text-loss'}`}>
                {summary.totalGainLossPercent >= 0 ? '+' : ''}{summary.totalGainLossPercent.toFixed(2)}%
              </div>
            </div>
            <div className="bg-card border-2 border-border p-5 rounded-2xl">
              <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Cash Available</div>
              <div className="font-mono text-2xl font-black">${summary.cashBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-muted rounded-xl"></div>
            {[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl"></div>)}
          </div>
        ) : hasHoldings ? (
          <div className="bg-card border-2 border-border rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/50 border-b-2 border-border text-xs uppercase font-bold text-muted-foreground">
                  <tr>
                    <th className="p-4 pl-6">Asset</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4 text-right">Holdings</th>
                    <th className="p-4 text-right">Avg Cost</th>
                    <th className="p-4 text-right">Total Return</th>
                    <th className="p-4 text-right pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {holdings.map((h, i) => {
                    const isPositive = h.gainLoss >= 0;
                    return (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={h.id} 
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            {h.logoUrl ? (
                              <img src={h.logoUrl} className="w-10 h-10 rounded-lg bg-white object-contain border border-border" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                                {h.symbol.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="font-black text-lg">{h.symbol}</div>
                              <div className="text-sm text-muted-foreground">{h.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono font-bold">${h.currentPrice.toFixed(2)}</td>
                        <td className="p-4 text-right">
                          <div className="font-mono font-bold text-lg">{h.quantity}</div>
                          <div className="text-sm text-muted-foreground font-mono">${h.currentValue.toFixed(2)}</div>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-muted-foreground">${h.avgBuyPrice.toFixed(2)}</td>
                        <td className={`p-4 text-right ${isPositive ? 'text-gain' : 'text-loss'}`}>
                          <div className="font-mono font-bold text-lg">
                            {isPositive ? '+' : ''}${h.gainLoss.toFixed(2)}
                          </div>
                          <div className="font-mono text-sm flex items-center justify-end gap-1">
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {h.gainLossPercent.toFixed(2)}%
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <Link href={`/market/${h.symbol}`} className="inline-block bg-secondary/10 hover:bg-secondary/20 text-secondary px-4 py-2 rounded-xl font-bold transition-colors">
                            Trade
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-card border-2 border-dashed border-border rounded-3xl p-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-2xl font-black mb-2">Your portfolio is empty</h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-md mx-auto">
              You haven't bought any stocks yet. Head over to the market to make your first trade and start building your wealth!
            </p>
            <Link href="/market" className="inline-flex bg-primary text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:-translate-y-1 transition-transform">
              Explore the Market
            </Link>
          </div>
        )}
        <UpgradeBanner />
      </div>
    </Layout>
  );
}
