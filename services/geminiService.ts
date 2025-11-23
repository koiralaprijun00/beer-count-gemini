import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Beer } from '../types';
import { STATIC_BEERS } from './staticBeerData';

// Lazy initialization of AI client to handle missing API keys gracefully
let ai: GoogleGenAI | null = null;

const getAI = (): GoogleGenAI | null => {
  if (ai) return ai;
  
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("Gemini API key not found. AI features will be disabled. Using static data only.");
    return null;
  }
  
  try {
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    return null;
  }
};

const beerSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Name of the beer" },
      brewery: { type: Type.STRING, description: "Name of the brewery" },
      type: { type: Type.STRING, description: "Style of beer (e.g. IPA, Stout)" },
      abv: { type: Type.STRING, description: "Alcohol by volume percentage (e.g. 5.4%)" },
      description: { type: Type.STRING, description: "A very short, fun 1-sentence fact about this beer style or brand." },
      emoji: { type: Type.STRING, description: "A single emoji that best represents this beer." }
    },
    required: ["name", "brewery", "type", "abv", "description", "emoji"]
  }
};

export const searchBeersWithGemini = async (query: string): Promise<Beer[]> => {
  const model = 'gemini-2.5-flash';
  const normalizedQuery = query.toLowerCase().trim();

  // 1. SEARCH LOCAL STATIC DATA FIRST (Instant & Huge Database)
  const localMatches = STATIC_BEERS.filter(b => 
    b.name.toLowerCase().includes(normalizedQuery) || 
    b.brewery.toLowerCase().includes(normalizedQuery) ||
    b.type.toLowerCase().includes(normalizedQuery)
  ).map(b => ({ ...b, id: crypto.randomUUID() }));

  // If we have enough local matches, return them to save API calls
  if (localMatches.length >= 10) {
    return localMatches;
  }

  // 2. IF NOT ENOUGH LOCAL MATCHES, ASK GEMINI
  const aiClient = getAI();
  if (!aiClient) {
    return localMatches; // Return local matches if AI is not available
  }
  
  try {
    const response = await aiClient.models.generateContent({
      model,
      contents: `The user is searching for beers with the query: "${query}". 
      Return a list of 6 distinct, real-world beers that match this search.
      
      IMPORTANT: Do NOT include these beers if possible, as I already have them: ${localMatches.map(b => b.name).join(', ')}.
      
      If the query is generic (like "IPA"), return 6 popular examples not in the list above.
      Keep descriptions punchy and fun.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: beerSchema,
        temperature: 0.7
      }
    });

    const text = response.text;
    if (!text) return localMatches; // Fallback to just local matches if API fails

    const rawBeers = JSON.parse(text);
    
    const aiBeers = rawBeers.map((b: any) => ({
      id: crypto.randomUUID(),
      name: b.name,
      brewery: b.brewery,
      type: b.type,
      abv: b.abv,
      description: b.description,
      emoji: b.emoji || '🍺'
    }));

    // Combine local matches with AI results (Local first)
    return [...localMatches, ...aiBeers];

  } catch (error) {
    console.error("Error searching beers:", error);
    return localMatches; // Fail gracefully to local data
  }
};

export const getTrendingBeers = async (): Promise<Beer[]> => {
  // Mix a few static popular beers with AI logic to save time
  const shuffledStatic = [...STATIC_BEERS]
    .sort(() => 0.5 - Math.random())
    .slice(0, 5)
    .map(b => ({ ...b, id: crypto.randomUUID() }));

  const model = 'gemini-2.5-flash';
  const aiClient = getAI();
  
  if (!aiClient) {
    return shuffledStatic; // Return static beers if AI is not available
  }
  
  try {
    const response = await aiClient.models.generateContent({
      model,
      contents: `Generate a list of 5 diverse, popular, and highly-rated craft beers from around the world for a "Discover" section. 
      Do NOT include: ${shuffledStatic.map(b => b.name).join(', ')}.
      Include a mix of styles (Stout, Sour, IPA, Lager).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: beerSchema,
        temperature: 0.9
      }
    });

    const text = response.text;
    if (!text) return shuffledStatic;
    const rawBeers = JSON.parse(text);

    const aiBeers = rawBeers.map((b: any) => ({
      id: crypto.randomUUID(),
      name: b.name,
      brewery: b.brewery,
      type: b.type,
      abv: b.abv,
      description: b.description,
      emoji: b.emoji || '🍺'
    }));

    return [...shuffledStatic, ...aiBeers];
  } catch (error) {
    console.error("Error fetching trending beers:", error);
    return shuffledStatic;
  }
};

export const generateFunFact = async (beerName: string): Promise<string> => {
    const aiClient = getAI();
    if (!aiClient) {
        return "A mysterious brew with no known history!";
    }
    
    try {
        const response = await aiClient.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Tell me a very short, hilarious, or interesting fact about ${beerName} in one sentence. Keep it under 20 words.`,
        });
        return response.text || "A mysterious brew with no known history!";
    } catch (e) {
        return "This beer is too cool for facts right now.";
    }
}