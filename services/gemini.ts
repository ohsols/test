import { GoogleGenAI } from "@google/genai";

/**
 * Uses Gemini with Google Search to fetch "Wiki" information about a movie/item.
 */
export const getWikiIntelligence = async (title: string) => {
  if (!title || title.length < 2) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for real-world information about "${title}". 
      Provide a concise 3-sentence summary including release year, main cast, and reception.
      Use a dark, cinematic tone.`,
      config: {
        systemInstruction: "You are the Archive Intelligence. You provide verified data from the global knowledge base with an atmospheric, mysterious flair.",
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      }
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    return {
      text: text?.trim() || "Information restricted or unavailable in the current sector.",
      sources: sources.map((chunk: any) => chunk.web?.uri).filter(Boolean) as string[]
    };
  } catch (error) {
    console.error("Gemini Wiki Error:", error);
    return null;
  }
};

/**
 * Uses Gemini to generate a cinematic description for a search query.
 */
export const getQueryAestheticDescription = async (query: string) => {
  if (!query || query.length < 3) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, 1-sentence cinematic theme for this search: "${query}". 
      Example: "Uncovering the secrets of the digital frontier."
      Make it mysterious and atmospheric.`,
      config: {
        systemInstruction: "You are the AI Librarian of ChillZone. Your voice is dark, futuristic, and slightly mysterious.",
        temperature: 0.7,
        maxOutputTokens: 50,
      }
    });

    return response.text?.trim() || null;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};

/**
 * Uses Gemini to translate text into a target language.
 */
export const translateText = async (text: string, targetLanguage: string) => {
  if (!text || !targetLanguage || targetLanguage === 'en-US') return text;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '' });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following text into ${targetLanguage}. Only return the translated text, nothing else.
      Text: "${text}"`,
      config: {
        systemInstruction: "You are a professional translator. You translate text accurately while maintaining the original tone and context.",
        temperature: 0.1,
      }
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return text;
  }
};