
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Stock } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STOCK_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    price: { type: Type.NUMBER },
    targetPrice: { type: Type.NUMBER },
    upside: { type: Type.NUMBER },
    peRatio: { type: Type.STRING },
    marketCap: { type: Type.STRING },
    rsi: { type: Type.NUMBER },
    vwap: { type: Type.NUMBER },
    vwapUpper: { type: Type.NUMBER },
    vwapLower: { type: Type.NUMBER },
    movingAverage: { type: Type.STRING },
    sector: { type: Type.STRING },
    description: { type: Type.STRING },
    analystSentiment: { type: Type.STRING },
    nextEarningsDate: { type: Type.STRING },
    riskScore: { type: Type.NUMBER },
    rewardScore: { type: Type.NUMBER },
    emaStackStatus: { type: Type.STRING },
    ema20: { type: Type.NUMBER },
    ema50: { type: Type.NUMBER },
    ema200: { type: Type.NUMBER },
    atrCoilStatus: { type: Type.STRING },
    atr: { type: Type.NUMBER },
    isAIRecommendation: { type: Type.BOOLEAN },
    recommendationReason: { type: Type.STRING },
    priceHistory: {
      type: Type.ARRAY,
      items: { type: Type.NUMBER }
    }
  },
  required: [
    "symbol", "name", "price", "targetPrice", "upside", "marketCap", 
    "sector", "priceHistory", "nextEarningsDate", "riskScore", 
    "rewardScore", "isAIRecommendation", "recommendationReason",
    "vwap", "vwapUpper", "vwapLower", "emaStackStatus", "atrCoilStatus"
  ]
};

const cleanJsonResponse = (text: string) => {
  if (!text) return "[]";
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    return cleaned.substring(start, end + 1);
  }
  return cleaned;
};

export const fetchHighGrowthStocks = async (): Promise<Stock[]> => {
  // Increased to 12 stocks to show more cards while remaining stable
  const prompt = `Find 12 high-potential US stocks where analyst consensus price targets reflect at least 100% (2x) upside.
  
  Format as JSON array ONLY.
  Constraints:
  - upside MUST be >= 100.
  - isAIRecommendation: true for the 3 best setups.
  - Include marketCap (e.g. "1.5B").
  - EMA Analysis: Evaluate the EMA Stack (EMA 20, 50, 200). 
    - "Bullish" if EMA 20 > 50 > 200.
    - "Bearish" if 20 < 50 < 200.
    - "Neutral" otherwise.
  - ATR Coil Analysis: Identify if the stock is in an "ATR Coil" (low volatility contraction).
    - "Coiling" if recent ATR is significantly lower than average (tight range).
    - "Expanding" if ATR is spiking.
    - "Neutral" otherwise.
  - priceHistory: 10 recent daily prices.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: STOCK_SCHEMA
        },
        temperature: 0.2, // Slightly more creative to find more stocks
      },
    });

    const resultText = cleanJsonResponse(response.text || "[]");
    let stocks: Stock[] = JSON.parse(resultText);
    
    // Filter to ensure 100% floor is maintained
    stocks = stocks.filter(s => s.upside >= 100);
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = (groundingMetadata?.groundingChunks as any[]) || [];
    const sourceUrls = chunks.filter(c => c.web).map(c => ({ 
      title: c.web?.title || 'מקור מידע', 
      uri: c.web?.uri || '' 
    }));

    return stocks.map(stock => ({
      ...stock,
      sourceUrls,
      analystSentiment: (stock.analystSentiment as any) || 'Bullish'
    }));
  } catch (error) {
    console.error("Error fetching stocks:", error);
    throw error;
  }
};

export const fetchStockByTicker = async (ticker: string): Promise<Stock | null> => {
  const prompt = `Detailed institutional analysis for ticker ${ticker.toUpperCase()}. 
  Evaluate 2x upside potential. 
  Technical requirements: 
  - Analyze EMA Stack (20, 50, 200).
  - Return emaStackStatus as 'Bullish', 'Neutral', or 'Bearish'.
  - Analyze ATR Coil (volatility contraction).
  - Return atrCoilStatus as 'Coiling', 'Expanding', or 'Neutral'.
  - Return full financial/technical JSON.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: STOCK_SCHEMA,
        temperature: 0.1
      },
    });

    const resultText = cleanJsonResponse(response.text || "{}");
    const stock: Stock = JSON.parse(resultText);
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const chunks = (groundingMetadata?.groundingChunks as any[]) || [];
    const sourceUrls = chunks.filter(c => c.web).map(c => ({ 
      title: c.web?.title || 'מקור מידע', 
      uri: c.web?.uri || '' 
    }));

    return {
      ...stock,
      sourceUrls,
      analystSentiment: (stock.analystSentiment as any) || 'Bullish'
    };
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return null;
  }
};
