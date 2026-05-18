
import React from 'react';
import { Stock } from '../types';

interface StockCardProps {
  stock: Stock;
  onToggleSave: (symbol: string) => void;
  isSaved: boolean;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onToggleSave, isSaved }) => {
  const generateSparkline = (data: number[]) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data, stock.vwapLower || stock.vwap * 0.95);
    const max = Math.max(...data, stock.vwapUpper || stock.vwap * 1.05);
    const range = max - min || 1;
    const width = 200;
    const height = 60;
    
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    const vwapY = height - ((stock.vwap - min) / range) * height;
    const upperY = height - (((stock.vwapUpper || stock.vwap * 1.02) - min) / range) * height;
    const lowerY = height - (((stock.vwapLower || stock.vwap * 0.98) - min) / range) * height;

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible preserve-3d">
        <line x1="0" y1={upperY} x2={width} y2={upperY} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2" opacity="0.3" />
        <line x1="0" y1={vwapY} x2={width} y2={vwapY} stroke="#f59e0b" strokeWidth="1" strokeDasharray="4" opacity="0.6" />
        <line x1="0" y1={lowerY} x2={width} y2={lowerY} stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2" opacity="0.3" />
        <polyline
          fill="none"
          stroke={stock.isAIRecommendation ? "#10b981" : "#60a5fa"}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
          className="drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
        />
      </svg>
    );
  };

  const getScoreColor = (score: number, inverse = false) => {
    if (inverse) {
      if (score >= 7) return 'bg-red-500';
      if (score >= 4) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      if (score >= 7) return 'bg-green-500';
      if (score >= 4) return 'bg-blue-500';
      return 'bg-slate-600';
    }
  };

  return (
    <div className={`relative flex flex-col h-full rounded-[2.5rem] p-6 sm:p-8 transition-all duration-500 shadow-2xl border-2 overflow-hidden ${
      stock.isAIRecommendation 
      ? 'bg-slate-900 border-emerald-500/80 shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30' 
      : 'bg-slate-900 border-slate-800/80 hover:border-slate-600'
    } group hover:-translate-y-2`}>
      
      {stock.isAIRecommendation && (
        <div className="absolute top-0 right-0">
          <div className="bg-emerald-500 text-slate-950 text-[11px] font-black px-8 py-2 rounded-bl-3xl uppercase tracking-widest shadow-lg z-10 animate-pulse">
            AI TOP PICK
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex flex-col gap-1.5">
            <h3 className="text-3xl font-black text-white group-hover:text-emerald-400 transition-colors flex items-center gap-3 flex-wrap">
              {stock.symbol}
              <span className="text-[11px] px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-emerald-400 font-black tracking-widest uppercase shadow-sm">
                {stock.marketCap}
              </span>
            </h3>
            <p className="text-slate-500 text-xs font-black truncate uppercase tracking-widest">{stock.name}</p>
          </div>
        </div>
        <button 
          onClick={() => onToggleSave(stock.symbol)}
          className={`p-3.5 rounded-2xl transition-all ${isSaved ? 'text-yellow-400 bg-yellow-400/10 shadow-inner ring-1 ring-yellow-400/30' : 'text-slate-600 hover:text-white bg-slate-800'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      </div>

      <div className="mb-8 py-6 bg-slate-950/70 rounded-[2rem] px-4 shadow-inner border border-slate-800/30">
        <div className="flex justify-between items-end mb-4 px-2">
          <span className="text-[11px] text-slate-500 font-black uppercase tracking-widest">10-Day Trend + Triple VWAP</span>
          <span className="text-[11px] text-amber-500 font-black bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">V: ${stock.vwap.toFixed(2)}</span>
        </div>
        {generateSparkline(stock.priceHistory)}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-8">
        <div className="bg-slate-800/50 p-5 rounded-3xl border border-slate-800/50 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 mb-1.5 font-black uppercase tracking-widest">Current</p>
          <p className="text-2xl font-black text-white">${stock.price.toFixed(2)}</p>
        </div>
        <div className="bg-emerald-500/5 p-5 rounded-3xl border border-emerald-500/20 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] text-emerald-500 mb-1.5 font-black uppercase tracking-widest">Target</p>
          <p className="text-2xl font-black text-emerald-400">${stock.targetPrice.toFixed(2)}</p>
        </div>
      </div>

      <div className={`p-5 rounded-3xl mb-8 flex flex-col gap-3 ${
        stock.isAIRecommendation ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-slate-950 border border-slate-800/50 shadow-inner'
      }`}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Growth Potential</span>
          <span className={`text-3xl font-black ${stock.isAIRecommendation ? 'text-emerald-400' : 'text-blue-400'}`}>
            +{stock.upside}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${stock.isAIRecommendation ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-blue-500'}`} 
            style={{ width: `${Math.min(stock.upside / 3, 100)}%` }}
          ></div>
        </div>
      </div>

      {stock.isAIRecommendation && stock.recommendationReason && (
        <div className="mb-8 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] relative">
          <div className="absolute -top-3 left-6 bg-emerald-500 text-slate-950 text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest">
            AI Reasoning
          </div>
          <p className="text-[12px] text-emerald-300 font-bold leading-relaxed">
            {stock.recommendationReason}
          </p>
        </div>
      )}

      <div className="space-y-5 mb-10 flex-grow">
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between text-[11px] font-black text-slate-500 px-1 uppercase tracking-widest">
            <span>Risk Index</span>
            <span className="text-slate-300">{stock.riskScore}/10</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-1 border border-slate-800/50">
            <div className={`h-full rounded-full transition-all duration-700 ${getScoreColor(stock.riskScore, true)}`} style={{ width: `${stock.riskScore * 10}%` }}></div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between text-[11px] font-black text-slate-500 px-1 uppercase tracking-widest">
            <span>Reward Index</span>
            <span className="text-slate-300">{stock.rewardScore}/10</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-1 border border-slate-800/50">
            <div className={`h-full rounded-full transition-all duration-700 ${getScoreColor(stock.rewardScore)}`} style={{ width: `${stock.rewardScore * 10}%` }}></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors group/stat">
            <p className="text-[10px] text-slate-600 font-black uppercase mb-1.5 tracking-widest">Earnings</p>
            <p className="text-sm text-amber-400 font-black group-hover/stat:text-amber-300 transition-colors">{stock.nextEarningsDate}</p>
          </div>
          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors group/stat">
            <p className="text-[10px] text-slate-600 font-black uppercase mb-1.5 tracking-widest">Momentum</p>
            <p className={`text-sm font-black transition-colors ${stock.rsi > 70 ? 'text-red-400 group-hover/stat:text-red-300' : stock.rsi < 40 ? 'text-emerald-400 group-hover/stat:text-emerald-300' : 'text-blue-400 group-hover/stat:text-blue-300'}`}>
              RSI: {stock.rsi.toFixed(1)}
            </p>
          </div>
          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors group/stat">
            <p className="text-[10px] text-slate-600 font-black uppercase mb-1.5 tracking-widest">Trend Stack</p>
            <p className={`text-sm font-black transition-colors ${
              stock.emaStackStatus === 'Bullish' ? 'text-emerald-400' : 
              stock.emaStackStatus === 'Bearish' ? 'text-red-400' : 
              'text-slate-400'
            }`}>
              EMA: {stock.emaStackStatus}
            </p>
          </div>
          <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-colors group/stat">
            <p className="text-[10px] text-slate-600 font-black uppercase mb-1.5 tracking-widest">Volatility</p>
            <p className={`text-sm font-black transition-colors ${
              stock.atrCoilStatus === 'Coiling' ? 'text-emerald-400 animate-pulse' : 
              stock.atrCoilStatus === 'Expanding' ? 'text-amber-400' : 
              'text-slate-400'
            }`}>
              ATR: {stock.atrCoilStatus}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <div className="text-[13px] text-slate-400 leading-relaxed italic mb-8 line-clamp-3 bg-slate-950/40 p-5 rounded-[1.5rem] border border-slate-800/40 shadow-inner">
          "{stock.description}"
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[11px] text-slate-600 font-black uppercase tracking-widest bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-800/50">{stock.sector}</span>
          {stock.sourceUrls && stock.sourceUrls.length > 0 && (
            <a href={stock.sourceUrls[0].uri} target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-500 hover:text-emerald-400 flex items-center gap-2 font-black uppercase tracking-widest transition-all hover:gap-3">
              Deep Scan <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
