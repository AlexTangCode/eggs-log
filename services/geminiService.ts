
import { GoogleGenAI } from "@google/genai";
import { Hen, EggLog } from "../types";

export const getSmartInsights = async (hens: Hen[], logs: EggLog[]) => {
  // Initialize inside the function to ensure the API Key is fresh and avoid top-level ReferenceErrors
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prep data for context
  const hensContext = hens.map(h => ({
    name: h.name,
    breed: h.breed,
    id: h.id
  }));

  const logsContext = logs.slice(0, 50).map(l => ({
    henName: l.henName,
    henId: l.henId,
    weight: l.weight,
    date: new Date(l.timestamp).toISOString().split('T')[0]
  }));
  
  const prompt = `
    Analyze this poultry data for my "Hen-Egg Tracker" flock:
    Hens: ${JSON.stringify(hensContext)}
    Recent Egg Logs: ${JSON.stringify(logsContext)}
    
    Task:
    Generate a succinct, high-value AI Insights report.
    1. Identify the "Star Performer" (most eggs recorded).
    2. Check for "Health Alerts": If a hen hasn't laid an egg in the last 3 days (Today is ${new Date().toISOString().split('T')[0]}), flag them specifically.
    3. Provide one "Smart Tip" for improving egg quality (calcium, lighting, stress).
    
    Tone: Professional yet warm, like a digital farm consultant. 
    Keep it strictly under 120 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "No insights found for the current data.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Your hens are enjoying some quiet time. We couldn't fetch AI insights at this moment.";
  }
};
