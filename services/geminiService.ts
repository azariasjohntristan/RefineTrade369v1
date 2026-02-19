import { GoogleGenAI } from "@google/genai";
import { Trade } from '../types';

/**
 * Service to analyze trading performance using Gemini API.
 * Follows Google GenAI SDK guidelines for initialization and content generation.
 */
export const analyzeTradingPerformance = async (trades: Trade[], query: string): Promise<string> => {
  // Use process.env.API_KEY directly as required by guidelines.
  if (!process.env.API_KEY) {
    return "API Key not configured. Please check your environment variables.";
  }

  // Initialize the Gemini API client inside the function to ensure up-to-date configuration.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  /* Extract trade context from the generic selections record on the Trade object */
  const tradeContext = trades.map(t => {
    const strategyContext = Object.entries(t.selections || {})
      .map(([catId, tags]) => `${catId}:[${tags.join(',')}]`)
      .join(' ');

    return `${t.time}: ${t.type} ${t.pair} size:${t.size} entry:${t.entry} exit:${t.exit} PnL:${t.pnl} ${strategyContext}`;
  }).join('\n');

  const prompt = `
    You are a senior hedge fund risk manager and trading coach.
    Analyze the following recent trading execution log for a trader. 
    The log includes structural metadata for each trade:
    - Identity: Instrument IDs and asset identifiers.
    - Logic: Market bias and confluence signatures.
    - Temporal: Time window constraints and risk parameters.
    
    ${tradeContext}
    
    User Query: ${query}
    
    Provide a concise, structuralist analysis. Specifically correlate the strategy metadata (Identity/Logic/Temporal) with the results.
    Focus on risk management, execution sizing, and potential psychological biases.
    Use a professional, slightly stern but helpful tone. Format with bullet points where necessary.
  `;

  try {
    /* Use generateContent with gemini-3-flash-preview for text analysis task */
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    // Access .text property directly as per SDK guidelines.
    return response.text || "Analysis complete, but no text returned.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate analysis. Please try again later.";
  }
};