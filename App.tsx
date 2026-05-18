
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchHighGrowthStocks, fetchStockByTicker } from './services/geminiService';
import { Stock, AppTab } from './types';
import { StockCard } from './components/StockCard';

const App: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [savedSymbols, setSavedSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchingTicker, setSearchingTicker] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const sortStocks = (data: Stock[]) => {
    return [...data].sort((a, b) => {
      // Priority 1: AI Recommendation
      if (a.isAIRecommendation && !b.isAIRecommendation) return -1;
      if (!a.isAIRecommendation && b.isAIRecommendation) return 1;
      
      // Priority 2: Technical Synergy (Bullish EMA + Coiling ATR)
      const aPerfect = a.emaStackStatus === 'Bullish' && a.atrCoilStatus === 'Coiling';
      const bPerfect = b.emaStackStatus === 'Bullish' && b.atrCoilStatus === 'Coiling';
      if (aPerfect && !bPerfect) return -1;
      if (!aPerfect && bPerfect) return 1;

      // Priority 3: EMA Stack Status (Bullish first)
      if (a.emaStackStatus === 'Bullish' && b.emaStackStatus !== 'Bullish') return -1;
      if (a.emaStackStatus !== 'Bullish' && b.emaStackStatus === 'Bullish') return 1;

      // Priority 4: ATR status (Coiling)
      if (a.atrCoilStatus === 'Coiling' && b.atrCoilStatus !== 'Coiling') return -1;
      if (a.atrCoilStatus !== 'Coiling' && b.atrCoilStatus === 'Coiling') return 1;

      // Priority 5: Upside
      return b.upside - a.upside;
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHighGrowthStocks();
      const filtered = data.filter(s => s.upside >= 100);
      setStocks(sortStocks(filtered));
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error(err);
      setError('חלה שגיאה בחיבור למנוע החיפוש. ייתכן עומס זמני בשרתי Google. אנא נסו לרענן שוב בעוד מספר שניות.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchingTicker) return;

    setSearchingTicker(true);
    const ticker = searchQuery.trim().toUpperCase();
    
    if (stocks.some(s => s.symbol === ticker)) {
      setSearchQuery('');
      setSearchingTicker(false);
      return;
    }

    try {
      const newStock = await fetchStockByTicker(ticker);
      if (newStock) {
        if (newStock.upside < 100) {
          if (!confirm(`${ticker} מציגה פוטנציאל של ${newStock.upside}% (נמוך מהיעד של 100%). האם להוסיף אותה בכל זאת?`)) {
            setSearchQuery('');
            setSearchingTicker(false);
            return;
          }
        }
        setStocks(prev => sortStocks([...prev, newStock]));
        setSearchQuery('');
      } else {
        alert(`לא נמצאו נתונים עבור ${ticker}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingTicker(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('saved_stocks');
    if (saved) {
      setSavedSymbols(JSON.parse(saved));
    }
    loadData();
  }, [loadData]);

  const toggleSave = (symbol: string) => {
    const newSaved = savedSymbols.includes(symbol)
      ? savedSymbols.filter(s => s !== symbol)
      : [...savedSymbols, symbol];
    
    setSavedSymbols(newSaved);
    localStorage.setItem('saved_stocks', JSON.stringify(newSaved));
  };

  const filteredStocks = activeTab === AppTab.DASHBOARD 
    ? stocks 
    : stocks.filter(s => savedSymbols.includes(s.symbol));

  const groupedStocks = useMemo(() => {
    const groups: Record<string, Stock[]> = {};
    filteredStocks.forEach(stock => {
      if (!groups[stock.sector]) {
        groups[stock.sector] = [];
      }
      groups[stock.sector].push(stock);
    });
    return groups;
  }, [filteredStocks]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-32 overflow-x-hidden antialiased selection:bg-emerald-500 selection:text-slate-950">
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-3xl border-b border-slate-800/60 px-4 py-5 sm:px-10 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="bg-emerald-500 p-3.5 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all hover:scale-110 hover:rotate-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-br from-white via-emerald-300 to-emerald-500 bg-clip-text text-transparent tracking-tighter leading-none mb-1.5">StockVision 2X</h1>
              <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em] opacity-80">Institutional Breakout Intelligence</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <form onSubmit={handleAddTicker} className="relative w-full sm:w-96 group">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש מניה (NVDA, MSTR...)"
                className="w-full bg-slate-950 border-2 border-slate-800/80 rounded-[1.5rem] py-4 pr-14 pl-6 text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-700 font-bold shadow-lg text-right"
              />
              <button type="submit" className="absolute right-5 top-4 text-slate-600 hover:text-emerald-400 transition-all transform active:scale-90">
                {searchingTicker ? (
                  <div className="h-6 w-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </button>
            </form>

            <button 
              onClick={loadData}
              disabled={loading}
              className="group flex items-center gap-4 px-10 py-4 bg-slate-800 hover:bg-slate-700 text-xs font-black rounded-2xl transition-all border border-slate-700 disabled:opacity-50 whitespace-nowrap uppercase tracking-[0.2em] shadow-xl active:scale-95"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin text-emerald-500' : 'group-hover:rotate-180 transition-transform duration-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {loading ? 'מנתח שוק...' : 'רענון דשבורד'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 sm:px-12 mt-16">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
          <div className="flex gap-4 p-2.5 bg-slate-900/50 rounded-[2rem] border border-slate-800/80 w-full lg:w-fit backdrop-blur-xl shadow-inner">
            <button 
              onClick={() => setActiveTab(AppTab.DASHBOARD)}
              className={`flex-1 sm:flex-none px-12 py-4.5 rounded-[1.25rem] font-black text-xs transition-all uppercase tracking-[0.25em] ${activeTab === AppTab.DASHBOARD ? 'bg-emerald-500 text-slate-950 shadow-2xl shadow-emerald-500/30 scale-105' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
            >
              דשבורד כללי
            </button>
            <button 
              onClick={() => setActiveTab(AppTab.SAVED)}
              className={`flex-1 sm:flex-none px-12 py-4.5 rounded-[1.25rem] font-black text-xs transition-all flex items-center justify-center gap-4 uppercase tracking-[0.25em] ${activeTab === AppTab.SAVED ? 'bg-amber-500 text-slate-950 shadow-2xl shadow-amber-500/30 scale-105' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
            >
              מניות שמורות
              {savedSymbols.length > 0 && <span className="bg-slate-950/60 text-[11px] px-3 py-1 rounded-xl text-slate-400 font-black shadow-lg">{savedSymbols.length}</span>}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-8 text-[11px] font-black uppercase text-slate-600 tracking-[0.3em]">
            <div className="flex items-center gap-4 px-6 py-3 bg-emerald-500/5 border-2 border-emerald-500/10 rounded-2xl text-emerald-400 shadow-sm backdrop-blur-md">
               <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
               סינון 2X פעיל
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-6 sm:px-12 mt-24">
        {loading && stocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[600px] gap-16">
            <div className="relative">
               <div className="w-48 h-48 border-[20px] border-emerald-500/5 border-t-emerald-500 rounded-full animate-spin shadow-2xl"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-emerald-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
               </div>
            </div>
            <div className="text-center">
              <h2 className="text-5xl font-black text-white mb-8 uppercase tracking-tighter">סורק הזדמנויות פריצה...</h2>
              <p className="text-slate-500 max-w-xl mx-auto font-black uppercase text-base tracking-[0.25em] leading-relaxed opacity-70">מנתח יעדי אנליסטים וסימני פריצה טכניים.</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/5 border-2 border-red-500/10 rounded-[4rem] p-24 text-center max-w-4xl mx-auto mt-24 shadow-2xl backdrop-blur-2xl">
            <div className="w-28 h-28 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-12 border-2 border-red-500/20 shadow-inner">
               <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 className="text-5xl font-black text-white mb-8 uppercase tracking-tighter">שגיאה בטעינה</h3>
            <p className="text-slate-400 mb-16 font-black text-base tracking-[0.25em] uppercase leading-relaxed max-w-lg mx-auto">{error}</p>
            <button onClick={loadData} className="px-20 py-6 bg-red-500 text-slate-950 font-black rounded-3xl transition-all shadow-[0_0_50px_rgba(239,68,68,0.3)] uppercase tracking-[0.3em] hover:scale-105 hover:bg-red-400 active:scale-95">נסה שוב</button>
          </div>
        ) : Object.keys(groupedStocks).length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] border-4 border-dashed border-slate-900 rounded-[6rem] mt-16 p-32 bg-slate-900/10 transition-all">
            <h3 className="text-5xl font-black text-slate-800 uppercase tracking-tighter mb-8">אין מניות להצגה</h3>
            <p className="text-slate-500 font-black text-base uppercase tracking-[0.3em] max-w-md text-center opacity-60">הסינון המחמיר של 100% אפסייד לא מצא מניות התואמות את הקריטריונים כרגע.</p>
          </div>
        ) : (
          <div className="space-y-40">
            {(Object.entries(groupedStocks) as [string, Stock[]][]).map(([sector, sectorStocks]) => (
              <section key={sector} className="animate-in fade-in slide-in-from-bottom-16 duration-1000">
                <div className="flex items-center gap-12 mb-16 px-8">
                  <h2 className="text-4xl font-black text-white uppercase tracking-[0.4em] leading-none">{sector}</h2>
                  <div className="h-1.5 bg-gradient-to-r from-slate-900 via-slate-800 to-transparent flex-grow rounded-full shadow-inner opacity-40"></div>
                  <span className="text-sm font-black bg-slate-900/80 border-2 border-slate-800/80 px-8 py-3 rounded-3xl text-slate-500 uppercase tracking-[0.3em] shadow-xl backdrop-blur-md">{sectorStocks.length} מניות</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-12">
                  {sectorStocks.map((stock) => (
                    <StockCard 
                      key={stock.symbol} 
                      stock={stock} 
                      onToggleSave={toggleSave}
                      isSaved={savedSymbols.includes(stock.symbol)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="mt-64 border-t-2 border-slate-900/40 pt-32 pb-48 px-12 text-center bg-slate-950/80 backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-30"></div>
        <div className="max-w-[1600px] mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-20 lg:gap-32 mb-32">
            <div className="space-y-6 group">
              <p className="text-emerald-500 font-black text-7xl tracking-tighter transition-transform group-hover:scale-110">{stocks.length}</p>
              <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] opacity-60">הזדמנויות</p>
            </div>
            <div className="space-y-6 group">
              <p className="text-blue-500 font-black text-7xl tracking-tighter transition-transform group-hover:scale-110">{stocks.filter(s => s.isAIRecommendation).length}</p>
              <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.4em] opacity-60">המלצות AI</p>
            </div>
          </div>
          <div className="max-w-6xl mx-auto border-t-2 border-slate-900/60 pt-24">
            <p className="text-slate-600 text-xs leading-[3] uppercase font-black tracking-[0.3em] opacity-50 max-w-4xl mx-auto">
              מערכת StockVision Pro משתמשת בבינה מלאכותית לניתוח נתוני שוק. המידע מבוסס על יעדי אנליסטים ממוצעים.
              המסחר במניות כרוך בסיכון גבוה, ואין לראות במידע זה ייעוץ פיננסי.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
