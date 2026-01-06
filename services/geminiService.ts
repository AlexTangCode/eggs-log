
import { GoogleGenAI } from "@google/genai";
import { Hen, EggLog } from "../types";

export const getSmartInsights = async (hens: Hen[], logs: EggLog[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
    Analyze this poultry data for my "Chloes Chicken" flock:
    Hens: ${JSON.stringify(hensContext)}
    Recent Egg Logs: ${JSON.stringify(logsContext)}
    
    Task:
    Generate a succinct, high-value AI Insights report.
    1. Identify the "Star Performer" (most eggs recorded).
    2. Check for "Health Alerts": If a hen hasn't laid an egg in the last 3 days (Today is ${new Date().toISOString().split('T')[0]}), flag them specifically.
    3. Provide one "Smart Tip" for improving egg quality (calcium, lighting, stress).
    
    IMPORTANT: Provide the response in Simplified Chinese.
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
    return response.text || "目前没有生成任何见解。";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "您的母鸡正在享受安静时光。目前无法获取 AI 见解。";
  }
};
