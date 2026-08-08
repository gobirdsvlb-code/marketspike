import React, { useState } from 'react';
import { Layout } from '@/components/layout';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import {
  useListStocks,
  useGetStock,
  useExecuteTrade,
  useGetCurrentUser,
  useGetHoldings,
} from '@workspace/api-client-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from 'recharts';
import {
  Search, TrendingUp, TrendingDown, AlertCircle, Trophy,
  BarChart3, RefreshCw, History, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

type TradeHistory = {
  id: number;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total: number;
  executedAt: string;
};

type LeaderboardEntry = {
  rank: number;
  userId: number;
  username: string;
  avatarColor: string;
  avatarUrl?: string;
  cash: number;
  holdingsValue: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
};

export default function Trade() {
  const [search, setSearch] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mobileListOpen, setMobileListOpen] = useState(true);

  const queryClient = useQueryClient();

  const { data: stocks, isLoading: stocksLoading } = useListStocks(
    {},
    { query: { queryKey: ['/api/market/stocks', ''], refetchInterval: 60_000 } }
  );

  const { data: stock } = useGetStock(
    selectedSymbol!,
    { query: { enabled: !!selectedSymbol, queryKey: ['/api/market/stocks', selectedSymbol], refetchInterval: 60_000 } }
  );

  const { data: user } = useGetCurrentUser({ query: { queryKey: ['/api/users/me'] } });
  const { data: holdings } = useGetHoldings({ query: { queryKey: ['/api/portfolio/holdings'] } });

  const { data: leaderboard, isLoading: lbLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['/api/portfolio/leaderboard'],
    queryFn: () => fetch('/api/portfolio/leaderboard', { credentials: 'include' }).then(r => r.json()),
    refetchInterval: 60_000,
  });

  const { data: tradeHistory } = useQuery<TradeHistory[]>({
    queryKey: ['/api/portfolio/trades'],
    queryFn: () => fetch('/api/portfolio/trades', { credentials: 'include' }).then(r => r.json()),
  });

  const executeTrade = useExecuteTrade();

  const filteredStocks = stocks?.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  }) ?? [];

  const holding = holdings?.find(h => h.symbol === selectedSymbol);
  const numQty = Math.max(0, parseInt(quantity) || 0);
  const totalCost = stock ? numQty * stock.price : 0;
  const userBalance = user?.balance ?? 0;
  const canBuy = totalCost > 0 && totalCost <= userBalance;
  const canSell = !!(holding && numQty > 0 && numQty <= holding.quantity);
  const isPositive = stock ? stock.change >= 0 : true;

  const chartData = stock?.priceHistory?.map(p => ({
    label: new Date(p.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    price: p.price,
  })) ?? [];

  const holdingsValue = holdings?.reduce((s, h) => s + h.currentValue, 0) ?? 0;
  const totalPortfolio = userBalance + holdingsValue;

  function selectStock(symbol: string) {
    setSelectedSymbol(symbol);
    setErrorMsg('');
    setQuantity('1');
    setMobileListOpen(false); // collapse list after picking on mobile
  }

  async function handleTrade(e: React.FormEvent) {
    e.preventDefault();
    if (!stock || numQty <= 0) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await executeTrade.mutateAsync({
        data: { stockId: stock.id, type: tradeType, quantity: numQty },
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/holdings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/portfolio/trades'] });
      toast(`${tradeType === 'buy' ? '🟢 Bought' : '🔴 Sold'} ${numQty} × ${stock.symbol}`, {
        description: `$${totalCost.toFixed(2)} ${tradeType === 'buy' ? 'spent' : 'received'} · +10 XP`,
      });
      setQuantity('1');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Trade failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Shared sub-components ─────────────────────────────────────────────

  const StockRow = ({ s }: { s: typeof filteredStocks[0] }) => {
    const pos = s.change >= 0;
    const isSelected = s.symbol === selectedSymbol;
    return (
      <button
        key={s.symbol}
        onClick={() => selectStock(s.symbol)}
        className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/60 transition-colors border-b border-border/40 ${
          isSelected ? 'bg-primary/10 border-l-[3px] border-l-primary' : ''
        }`}
      >
        <div>
          <div className={`font-black text-xs ${isSelected ? 'text-primary' : ''}`}>{s.symbol}</div>
          <div className="text-[10px] text-muted-foreground truncate w-28">{s.name}</div>
        </div>
        <div className="text-right">
          <div className="font-mono font-bold text-xs">${s.price.toFixed(2)}</div>
          <div className={`text-[10px] font-bold ${pos ? 'text-gain' : 'text-loss'}`}>
            {pos ? '+' : ''}{s.changePercent.toFixed(2)}%
          </div>
        </div>
      </button>
    );
  };

  const TradePanel = () => (
    <>
      {/* Stock price header */}
      <div className="bg-card border-2 border-border rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {stock!.logoUrl ? (
            <img src={stock!.logoUrl} className="w-9 h-9 rounded-lg bg-white object-contain border border-border flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-base flex-shrink-0">
              {stock!.symbol.charAt(0)}
            </div>
          )}
          <div>
            <div className="font-black text-lg leading-none">{stock!.symbol}</div>
            <div className="text-xs text-muted-foreground font-medium">{stock!.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-black">${stock!.price.toFixed(2)}</div>
          <div className={`text-xs font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-gain' : 'text-loss'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{stock!.changePercent.toFixed(2)}% today
          </div>
        </div>
      </div>

      {/* Price chart */}
      <div className="bg-card border-2 border-border rounded-2xl p-4 h-48 md:h-auto md:flex-1 md:min-h-0">
        {chartData.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `$${v}`}
                width={55}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 8px 20px -4px rgba(0,0,0,0.15)', fontSize: 12, fontWeight: 700 }}
                formatter={(v: number) => [`$${v.toFixed(2)}`, 'Price']}
                labelStyle={{ color: 'var(--muted-foreground)', marginBottom: 4 }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositive ? 'hsl(var(--gain))' : 'hsl(var(--loss))'}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'white' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm font-bold gap-2">
            <BarChart3 className="w-10 h-10 opacity-30" />
            <span>Chart data builds up over time</span>
          </div>
        )}
      </div>

      {/* Trade form */}
      <div className="bg-card border-2 border-border rounded-2xl p-4">
        <form onSubmit={handleTrade}>
          <div className="flex bg-muted p-1 rounded-xl mb-3 gap-1">
            <button type="button" onClick={() => setTradeType('buy')}
              className={`flex-1 py-2 rounded-lg font-black text-sm transition-all ${tradeType === 'buy' ? 'bg-gain text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              Buy
            </button>
            <button type="button" onClick={() => setTradeType('sell')}
              className={`flex-1 py-2 rounded-lg font-black text-sm transition-all ${tradeType === 'sell' ? 'bg-loss text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              Sell
            </button>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Shares</label>
              <input
                type="number" min="1" step="1" value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="w-full bg-background border-2 border-border rounded-xl px-3 py-2 font-mono font-black text-lg focus:outline-none focus:border-primary transition-colors text-center"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-muted-foreground mb-1 block uppercase">Total</label>
              <div className="w-full bg-muted rounded-xl px-3 py-2 font-mono font-black text-lg text-center">
                ${totalCost.toFixed(2)}
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || numQty <= 0 || (tradeType === 'buy' ? !canBuy : !canSell)}
              className={`px-5 py-2 rounded-xl font-black text-sm transition-all h-[46px] min-w-[80px] ${
                isSubmitting ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                  : tradeType === 'buy'
                  ? canBuy ? 'bg-gain text-white hover:opacity-90 shadow' : 'bg-muted text-muted-foreground cursor-not-allowed'
                  : canSell ? 'bg-loss text-white hover:opacity-90 shadow' : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isSubmitting ? '…' : tradeType === 'buy' ? 'Buy' : 'Sell'}
            </button>
          </div>

          {errorMsg && (
            <div className="mt-2 text-xs text-destructive flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{errorMsg}
            </div>
          )}
          <div className="mt-2 text-xs text-muted-foreground font-bold text-right">
            Cash: <span className="font-mono text-foreground">${userBalance.toFixed(2)}</span>
            {holding && <> · Own: <span className="font-mono text-foreground">{holding.quantity} sh</span></>}
          </div>
        </form>
      </div>
    </>
  );

  const PortfolioSummary = ({ compact = false }: { compact?: boolean }) => (
    <div className="bg-card border-2 border-border rounded-2xl p-4">
      <div className="text-[10px] font-black uppercase text-muted-foreground mb-3">My Portfolio</div>
      {compact ? (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Cash', val: `$${userBalance.toFixed(0)}` },
            { label: 'Stocks', val: `$${holdingsValue.toFixed(0)}` },
            { label: 'Total', val: `$${totalPortfolio.toFixed(0)}` },
          ].map(({ label, val }) => (
            <div key={label} className="bg-muted/40 rounded-xl p-2">
              <div className="text-[10px] text-muted-foreground font-bold">{label}</div>
              <div className="font-mono font-black text-sm">{val}</div>
            </div>
          ))}
          <div className={`col-span-3 text-xs font-bold text-center pt-1 ${totalPortfolio >= 10000 ? 'text-gain' : 'text-loss'}`}>
            Return: {totalPortfolio >= 10000 ? '+' : ''}${(totalPortfolio - 10000).toFixed(2)} ({totalPortfolio >= 10000 ? '+' : ''}{((totalPortfolio / 10000 - 1) * 100).toFixed(2)}%)
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-bold">Cash</span>
            <span className="font-mono font-black text-xs">${userBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground font-bold">Stocks</span>
            <span className="font-mono font-black text-xs">${holdingsValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-xs font-black">Total</span>
            <span className="font-mono font-black text-sm">${totalPortfolio.toFixed(2)}</span>
          </div>
          <div className={`flex justify-between items-center text-xs font-bold ${totalPortfolio >= 10000 ? 'text-gain' : 'text-loss'}`}>
            <span>Return</span>
            <span className="font-mono">{totalPortfolio >= 10000 ? '+' : ''}${(totalPortfolio - 10000).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col gap-5">

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Virtual Trading</h1>
            <p className="text-muted-foreground font-medium text-sm">Trade with real market prices. Starting balance: $10,000.</p>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-muted-foreground uppercase mb-1">My Portfolio</div>
            <div className="font-mono text-2xl font-black">${totalPortfolio.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <div className={`text-sm font-bold flex items-center justify-end gap-1 ${totalPortfolio >= 10000 ? 'text-gain' : 'text-loss'}`}>
              {totalPortfolio >= 10000 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {totalPortfolio >= 10000 ? '+' : ''}${(totalPortfolio - 10000).toFixed(2)} from start
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            MOBILE LAYOUT (hidden on md+)
        ══════════════════════════════════════════ */}
        <div className="flex flex-col gap-4 md:hidden">

          {/* Portfolio summary — compact */}
          <PortfolioSummary compact />

          {/* Search + collapsible stock list */}
          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-border flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search stocks…"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setMobileListOpen(true); }}
                  className="w-full pl-8 pr-2 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>
              <button
                onClick={() => setMobileListOpen(o => !o)}
                className="p-2 rounded-lg bg-muted text-muted-foreground shrink-0"
              >
                {mobileListOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {selectedSymbol && !mobileListOpen && (
              <button
                onClick={() => setMobileListOpen(true)}
                className="w-full px-4 py-2.5 text-left flex items-center justify-between bg-primary/5 border-b border-border"
              >
                <span className="font-black text-sm text-primary">{selectedSymbol} selected</span>
                <span className="text-xs text-muted-foreground font-bold">Change →</span>
              </button>
            )}

            {mobileListOpen && (
              <div className="max-h-52 overflow-y-auto">
                <div className="text-[10px] font-black uppercase text-muted-foreground px-3 py-1.5 border-b border-border bg-muted/40 grid grid-cols-2">
                  <span>Symbol</span>
                  <span className="text-right">Price / Chg</span>
                </div>
                {stocksLoading && (
                  <div className="p-3 space-y-2">
                    {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}
                  </div>
                )}
                {filteredStocks.map(s => <StockRow key={s.symbol} s={s} />)}
                {filteredStocks.length === 0 && !stocksLoading && (
                  <div className="p-4 text-center text-xs text-muted-foreground font-bold">No stocks found</div>
                )}
              </div>
            )}
          </div>

          {/* Trade panel (only when stock selected) */}
          {stock ? (
            <TradePanel />
          ) : (
            <div className="bg-card border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-8">
              <BarChart3 className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <h2 className="text-base font-black mb-1">Pick a stock above</h2>
              <p className="text-muted-foreground font-medium text-sm">Search or scroll to select a ticker, then trade here.</p>
            </div>
          )}

          {/* Holdings */}
          {holdings && holdings.length > 0 && (
            <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
              <div className="text-[10px] font-black uppercase text-muted-foreground px-4 py-2.5 border-b border-border">
                My Holdings ({holdings.length})
              </div>
              {holdings.map(h => (
                <button
                  key={h.id}
                  onClick={() => selectStock(h.symbol)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/60 transition-colors border-b border-border/40 ${h.symbol === selectedSymbol ? 'bg-primary/10' : ''}`}
                >
                  <div>
                    <div className="font-black text-sm">{h.symbol}</div>
                    <div className="text-xs text-muted-foreground font-mono">{h.quantity} shares</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-sm">${h.currentValue.toFixed(0)}</div>
                    <div className={`text-xs font-bold ${h.gainLoss >= 0 ? 'text-gain' : 'text-loss'}`}>
                      {h.gainLoss >= 0 ? '+' : ''}{h.gainLossPercent.toFixed(1)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════
            DESKTOP LAYOUT (hidden below md)
        ══════════════════════════════════════════ */}
        <div className="hidden md:flex gap-4" style={{ height: 'calc(100vh - 340px)', minHeight: 480 }}>

          {/* LEFT: stock list sidebar */}
          <div className="w-56 flex-shrink-0 bg-card border-2 border-border rounded-2xl flex flex-col overflow-hidden">
            <div className="p-2.5 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search stocks…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                />
              </div>
            </div>
            <div className="text-[10px] font-black uppercase text-muted-foreground px-3 py-1.5 border-b border-border bg-muted/40 grid grid-cols-2">
              <span>Symbol</span>
              <span className="text-right">Price / Chg</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {stocksLoading && (
                <div className="p-3 space-y-2">
                  {[...Array(8)].map((_, i) => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}
                </div>
              )}
              {filteredStocks.map(s => <StockRow key={s.symbol} s={s} />)}
              {filteredStocks.length === 0 && !stocksLoading && (
                <div className="p-4 text-center text-xs text-muted-foreground font-bold">No stocks found</div>
              )}
            </div>
          </div>

          {/* CENTER: chart + trade form */}
          <div className="flex-1 flex flex-col gap-3 min-w-0">
            {stock ? <TradePanel /> : (
              <div className="flex-1 bg-card border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-center p-8">
                <BarChart3 className="w-14 h-14 text-muted-foreground/20 mb-4" />
                <h2 className="text-lg font-black mb-1">Pick a stock to trade</h2>
                <p className="text-muted-foreground font-medium text-sm max-w-xs">
                  Select any ticker from the list on the left to view live prices, chart history, and place a trade.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: portfolio panel */}
          <div className="w-52 flex-shrink-0 flex flex-col gap-3">
            <PortfolioSummary />

            {holding && (
              <div className="bg-card border-2 border-border rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase text-muted-foreground mb-3">{holding.symbol} Position</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-bold">Shares</span>
                    <span className="font-mono font-black">{holding.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-bold">Avg cost</span>
                    <span className="font-mono font-black">${holding.avgBuyPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-bold">Value</span>
                    <span className="font-mono font-black">${holding.currentValue.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between pt-1.5 border-t border-border font-black ${holding.gainLoss >= 0 ? 'text-gain' : 'text-loss'}`}>
                    <span>P&L</span>
                    <span className="font-mono">{holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {holdings && holdings.length > 0 && (
              <div className="bg-card border-2 border-border rounded-2xl flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="text-[10px] font-black uppercase text-muted-foreground px-4 py-2 border-b border-border">
                  Holdings ({holdings.length})
                </div>
                <div className="overflow-y-auto flex-1">
                  {holdings.map(h => (
                    <button
                      key={h.id}
                      onClick={() => selectStock(h.symbol)}
                      className={`w-full flex items-center justify-between px-4 py-2 text-left hover:bg-muted/60 transition-colors border-b border-border/40 text-xs ${h.symbol === selectedSymbol ? 'bg-primary/10' : ''}`}
                    >
                      <div>
                        <div className="font-black">{h.symbol}</div>
                        <div className="text-muted-foreground font-mono">{h.quantity} sh</div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black">${h.currentValue.toFixed(0)}</div>
                        <div className={`font-bold ${h.gainLoss >= 0 ? 'text-gain' : 'text-loss'}`}>
                          {h.gainLoss >= 0 ? '+' : ''}{h.gainLossPercent.toFixed(1)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(!holdings || holdings.length === 0) && (
              <div className="bg-card border-2 border-dashed border-border rounded-2xl p-4 text-center flex-1 flex flex-col items-center justify-center">
                <p className="text-xs text-muted-foreground font-bold">No holdings yet</p>
                <p className="text-[10px] text-muted-foreground mt-1">Buy your first stock!</p>
              </div>
            )}
          </div>
        </div>

        {/* ── TRADING LEADERBOARD (shared) ── */}
        <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent flex-shrink-0" />
            <h2 className="font-black text-base">Traders Leaderboard</h2>
            <span className="text-xs text-muted-foreground font-bold ml-auto flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Live · 60s
            </span>
          </div>

          {lbLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-muted/40 border-b border-border text-[10px] font-black text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Trader</th>
                    <th className="px-4 py-3 text-right">Portfolio</th>
                    <th className="px-4 py-3 text-right">Return</th>
                    <th className="px-4 py-3 text-right">Cash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaderboard.map(entry => {
                    const isMe = entry.userId === user?.id;
                    const isGain = entry.gainLoss >= 0;
                    const rankEmoji = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null;
                    return (
                      <tr key={entry.userId} className={`transition-colors ${isMe ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                        <td className="px-4 py-3 font-black text-sm">
                          {rankEmoji ?? <span className="text-muted-foreground">#{entry.rank}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[11px] text-white uppercase flex-shrink-0"
                              style={{ backgroundColor: entry.avatarColor }}>
                              {entry.username.substring(0, 2)}
                            </div>
                            <span className={`font-bold ${isMe ? 'text-primary' : ''}`}>
                              {entry.username}{isMe && <span className="ml-1 text-xs text-muted-foreground font-medium">(you)</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-black">
                          ${entry.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${isGain ? 'text-gain' : 'text-loss'}`}>
                          <div>{isGain ? '+' : ''}${entry.gainLoss.toFixed(2)}</div>
                          <div className="text-xs opacity-80">{isGain ? '+' : ''}{entry.gainLossPercent.toFixed(2)}%</div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-muted-foreground text-xs">
                          ${entry.cash.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Trophy className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">No traders yet — make your first trade to appear here!</p>
            </div>
          )}
        </div>

        {/* ── RECENT TRADES (shared) ── */}
        <div className="bg-card border-2 border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <History className="w-5 h-5 text-primary flex-shrink-0" />
            <h2 className="font-black text-base">My Recent Trades</h2>
          </div>

          {!Array.isArray(tradeHistory) || tradeHistory.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-muted-foreground">No trades yet — buy your first stock to see history here!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-muted/40 border-b border-border text-[10px] font-black text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-center">Action</th>
                    <th className="px-4 py-3 text-right">Shares</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tradeHistory.map(t => (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-black text-sm">{t.symbol}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[100px]">{t.name}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide ${t.type === 'buy' ? 'bg-gain/15 text-gain' : 'bg-loss/15 text-loss'}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black">{t.quantity.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-muted-foreground">${t.price.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-black ${t.type === 'buy' ? 'text-loss' : 'text-gain'}`}>
                        {t.type === 'buy' ? '-' : '+'}${t.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground font-bold">
                        {new Date(t.executedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        <div className="text-[10px] opacity-70">{new Date(t.executedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <UpgradeBanner />
      </div>
    </Layout>
  );
}
