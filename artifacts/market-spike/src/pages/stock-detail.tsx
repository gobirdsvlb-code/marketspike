import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { 
  useGetStock, 
  useExecuteTrade, 
  useGetCurrentUser,
  useGetHoldings
} from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, AlertCircle, Briefcase } from 'lucide-react';
import { useToast } from '@/components/ui/toast'; // assume standard UI toast or just simple alert
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';

// Simple toast implementation fallback since we don't have the full shadcn toast context here
const showToast = (title: string, desc: string) => {
  // In a real app we'd use the toaster, but for now we just rely on UI state
};

export default function StockDetail() {
  const { symbol } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<string>('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { data: stock, isLoading } = useGetStock(symbol!, { 
    query: { enabled: !!symbol, queryKey: ['/api/market/stocks', symbol] } 
  });
  
  const { data: user } = useGetCurrentUser({ query: { queryKey: ['/api/users/me'] } });
  const { data: holdings } = useGetHoldings({ query: { queryKey: ['/api/portfolio/holdings'] } });
  const executeTrade = useExecuteTrade();

  const holding = holdings?.find(h => h.symbol === symbol);
  const isPositive = stock ? stock.change >= 0 : true;
  const numQuantity = parseInt(quantity) || 0;
  const totalCost = stock ? numQuantity * stock.price : 0;
  
  const canBuy = user && totalCost <= user.balance && numQuantity > 0;
  const canSell = holding && numQuantity <= holding.quantity && numQuantity > 0;
  
  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stock || !user) return;
    
    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      await executeTrade.mutateAsync({
        data: {
          stockId: stock.id,
          type: tradeType,
          quantity: numQuantity
        }
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/holdings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/summary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity'] });
      
      setLocation('/portfolio');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Trade failed');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <Layout><div className="animate-pulse h-96 bg-muted rounded-3xl"></div></Layout>;
  if (!stock) return <Layout><div>Stock not found</div></Layout>;

  // Prepare chart data
  const chartData = stock.priceHistory?.map(p => ({
    time: new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: p.price
  })) || [];

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/market" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Market
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-card border-2 border-border rounded-3xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
              <div className="flex items-center gap-4">
                {stock.logoUrl ? (
                  <img src={stock.logoUrl} alt={stock.symbol} className="w-16 h-16 rounded-xl object-contain bg-white border border-border" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-3xl border border-primary/20">
                    {stock.symbol.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-4xl font-black tracking-tight leading-none">{stock.symbol}</h1>
                  <p className="text-muted-foreground font-bold text-lg">{stock.name}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-5xl font-mono font-black mb-2">${stock.price.toFixed(2)}</div>
                <div className={`flex items-center md:justify-end gap-2 text-lg font-bold ${isPositive ? 'text-gain' : 'text-loss'}`}>
                  {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}% (${stock.change.toFixed(2)})
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-72 w-full mb-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontWeight: 'bold', fontFamily: 'monospace' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                      labelStyle={{ color: 'var(--muted-foreground)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={isPositive ? 'hsl(var(--gain))' : 'hsl(var(--loss))'} 
                      strokeWidth={4} 
                      dot={false}
                      activeDot={{ r: 8, fill: isPositive ? 'hsl(var(--gain))' : 'hsl(var(--loss))', stroke: 'white', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/30 rounded-2xl border border-dashed">
                  No chart data available
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-border">
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Sector</div>
                <div className="font-bold">{stock.sector}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Market Cap</div>
                <div className="font-bold font-mono">{stock.marketCap || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-muted-foreground uppercase mb-1">Open Price</div>
                <div className="font-bold font-mono">${(stock.price - stock.change).toFixed(2)}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-card border-2 border-border rounded-3xl p-6 md:p-8">
            <h3 className="text-xl font-bold mb-4">About {stock.name}</h3>
            <p className="text-muted-foreground leading-relaxed font-medium">
              {stock.description}
            </p>
          </div>
        </div>

        {/* Sidebar / Trading Form */}
        <div className="space-y-6">
          <div className="bg-card border-2 border-border rounded-3xl p-6 shadow-xl sticky top-24">
            <div className="flex bg-muted p-1 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setTradeType('buy')}
                className={`flex-1 py-3 text-center rounded-lg font-bold text-sm transition-all ${tradeType === 'buy' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setTradeType('sell')}
                className={`flex-1 py-3 text-center rounded-lg font-bold text-sm transition-all ${tradeType === 'sell' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Sell
              </button>
            </div>

            <form onSubmit={handleTrade}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-muted-foreground mb-2">Quantity (Shares)</label>
                <input 
                  type="number" 
                  min="1" 
                  step="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-2xl font-mono font-black focus:outline-none focus:border-primary transition-colors text-center"
                />
              </div>

              <div className="space-y-3 mb-6 bg-muted/50 p-4 rounded-xl">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-muted-foreground">Market Price</span>
                  <span className="font-mono">${stock.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-black border-t border-border pt-3">
                  <span>Estimated Cost</span>
                  <span className="font-mono">${totalCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Validation Feedback */}
              {tradeType === 'buy' && !canBuy && numQuantity > 0 && (
                <div className="mb-4 text-destructive flex items-start gap-2 bg-destructive/10 p-3 rounded-lg text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  Not enough buying power. You have ${user?.balance.toFixed(2)} available.
                </div>
              )}

              {tradeType === 'sell' && !canSell && numQuantity > 0 && (
                <div className="mb-4 text-destructive flex items-start gap-2 bg-destructive/10 p-3 rounded-lg text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  You don't own enough shares. You own {holding?.quantity || 0} shares.
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 text-destructive flex items-start gap-2 bg-destructive/10 p-3 rounded-lg text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (tradeType === 'buy' ? !canBuy : !canSell) || numQuantity <= 0}
                className={`w-full py-4 rounded-xl font-black text-lg transition-all ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' :
                  tradeType === 'buy' 
                    ? canBuy ? 'bg-primary text-white hover:bg-primary/90 shadow-[0_4px_0_hsl(var(--primary-border))] active:translate-y-1 active:shadow-none' : 'bg-muted text-muted-foreground cursor-not-allowed'
                    : canSell ? 'bg-secondary text-white hover:bg-secondary/90 shadow-[0_4px_0_hsl(var(--secondary-border))] active:translate-y-1 active:shadow-none' : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${stock.symbol}`}
              </button>
            </form>

            <div className="mt-6 text-center text-sm font-bold text-muted-foreground">
              Buying Power: <span className="font-mono text-foreground">${user?.balance.toFixed(2)}</span>
            </div>
          </div>

          {holding && (
            <div className="bg-card border-2 border-border rounded-3xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Your Position
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold text-sm">Shares</span>
                  <span className="font-mono font-bold text-lg">{holding.quantity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold text-sm">Avg Cost</span>
                  <span className="font-mono font-bold">${holding.avgBuyPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-bold text-sm">Market Value</span>
                  <span className="font-mono font-bold text-lg">${holding.currentValue.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground font-bold text-sm">Total Return</span>
                  <div className={`font-mono font-black ${holding.gainLoss >= 0 ? 'text-gain' : 'text-loss'}`}>
                    {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toFixed(2)} ({holding.gainLossPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
