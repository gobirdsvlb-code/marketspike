import React, { useState } from 'react';
import { useListStocks } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { Link } from 'wouter';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Market() {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState<string>('');
  
  const { data: stocks, isLoading } = useListStocks(
    { search: search || undefined, sector: sector || undefined },
    { query: { queryKey: ['/api/market/stocks', { search, sector }] } }
  );

  const sectors = ["Technology", "Healthcare", "Finance", "Consumer", "Energy", "Communication", "Real Estate"];

  return (
    <Layout>
      <div className="space-y-6">
        <header>
          <h1 className="text-4xl font-black tracking-tight mb-2">Market</h1>
          <p className="text-muted-foreground font-medium">Discover and trade stocks in real-time.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input 
              type="search" 
              placeholder="Search symbols or companies..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-border bg-card text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => setSector('')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition-colors ${!sector ? 'bg-primary text-white' : 'bg-card border border-border text-foreground hover:bg-muted'}`}
            >
              All
            </button>
            {sectors.map(s => (
              <button 
                key={s}
                onClick={() => setSector(s)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition-colors ${sector === s ? 'bg-primary text-white' : 'bg-card border border-border text-foreground hover:bg-muted'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-muted rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks?.map((stock, i) => {
              const isPositive = stock.change >= 0;
              return (
                <Link key={stock.symbol} href={`/market/${stock.symbol}`}>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card border-2 border-border rounded-2xl p-5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        {stock.logoUrl ? (
                          <img src={stock.logoUrl} alt={stock.symbol} className="w-10 h-10 rounded-lg object-contain bg-white" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                            {stock.symbol.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-black text-lg leading-none">{stock.symbol}</div>
                          <div className="text-sm text-muted-foreground truncate w-32">{stock.name}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground uppercase">
                        {stock.sector}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end mt-6">
                      <div>
                        <div className="text-sm text-muted-foreground font-bold mb-1">PRICE</div>
                        <div className="font-mono text-2xl font-black">${stock.price.toFixed(2)}</div>
                      </div>
                      <div className={`text-right ${isPositive ? 'text-gain' : 'text-loss'}`}>
                        <div className="font-bold flex items-center justify-end gap-1 mb-1">
                          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </div>
                        <div className="font-mono text-sm opacity-80 font-bold">
                          {isPositive ? '+' : ''}${stock.change.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
            
            {stocks?.length === 0 && (
              <div className="col-span-full text-center py-20 bg-card border border-dashed rounded-3xl">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold">No stocks found</h3>
                <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
