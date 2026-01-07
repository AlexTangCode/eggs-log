
import { GoogleGenAI, Type } from "@google/genai";
import { Hen, EggLog, Recipe } from "../types";

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

export const getChloeRecipe = async (inventoryCount: number): Promise<Recipe | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    作为一名专业的幼儿营养师，请根据目前储蛋盒里剩下的 ${inventoryCount} 枚鸡蛋，为 3 岁的小朋友 Chloe 推荐一道食谱。要求：
    1. 考虑到 3 岁宝宝的咀嚼能力和营养需求（低盐、软糯、造型可爱）。
    2. 结合 Chloe 喜欢的口味（如：喜欢蔬菜、或者是喜欢蛋挞类等，由 AI 发挥）。
    3. 考虑到 Chloe 爸妈 Alex 和 YI 的华人饮食偏好。
    4. 必须严格遵循以下 JSON 格式：
    {
      "recipeName": "菜名",
      "eggsNeeded": 数字,
      "secret": "制作秘诀",
      "whyChloeLikes": "为什么 Chloe 会喜欢",
      "steps": ["步骤1", "步骤2", "..."]
    }
    
    请直接返回 JSON 代码，不要包含 Markdown 代码块。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipeName: { type: Type.STRING },
            eggsNeeded: { type: Type.NUMBER },
            secret: { type: Type.STRING },
            whyChloeLikes: { type: Type.STRING },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["recipeName", "eggsNeeded", "secret", "whyChloeLikes", "steps"],
          propertyOrdering: ["recipeName", "eggsNeeded", "secret", "whyChloeLikes", "steps"]
        }
      }
    });
    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Recipe Error:", error);
    return null;
  }
};
