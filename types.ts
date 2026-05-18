
export interface Stock {
  symbol: string;
  name: string;
  price: number;
  targetPrice: number;
  upside: number; // numeric percentage
  peRatio: string;
  marketCap: string;
  rsi: number;
  vwap: number;
  vwapUpper?: number;
  vwapLower?: number;
  movingAverage: string;
  description: string;
  sector: string;
  analystSentiment: 'Bullish' | 'Neutral' | 'Bearish';
  priceHistory: number[];
  nextEarningsDate: string;
  riskScore: number; // 1-10
  rewardScore: number; // 1-10
  emaStackStatus: 'Bullish' | 'Neutral' | 'Bearish';
  ema20?: number;
  ema50?: number;
  ema200?: number;
  atrCoilStatus: 'Coiling' | 'Expanding' | 'Neutral';
  atr?: number;
  isAIRecommendation: boolean;
  recommendationReason?: string;
  sourceUrls?: { title: string; uri: string }[];
}

export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  SAVED = 'SAVED'
}
