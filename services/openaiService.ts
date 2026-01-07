
/**
 * OpenAI Service for Chloes Chicken
 * Optimized for gpt-4o-mini.
 */

export interface OpenAiRecipe {
  recipeName: string;
  eggsNeeded: number;
  steps: string[];
  whyChloeLikes: string;
  secret: string;
}

export const getOpenAiRecipe = async (inventoryCount: number, apiKey: string): Promise<OpenAiRecipe | null> => {
  if (!apiKey) throw new Error("MISSING_API_KEY");

  const prompt = `现在储蛋盒有 ${inventoryCount} 枚鸡蛋，请为 3 岁的 Chloe 推荐一个简单健康的鸡蛋食谱。
同时也考虑 Chloe 的父母 Alex 和 YI（华人）的饮食习惯。
要求包含：菜名、用蛋量、制作步骤、制作秘诀、为什么 Chloe 会喜欢。
语气要温馨。`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "你是一位专业的幼儿营养师。用户叫Chloe，3岁。家里的两只母鸡每天产新鲜鸡蛋。你的任务是提供温馨、健康、符合华人家庭习惯的食谱。请以 JSON 格式返回，包含字段：recipeName, eggsNeeded, steps (数组), whyChloeLikes, secret。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      })
    });

    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "OpenAI API Request Failed");
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      recipeName: result.recipeName || "营养鸡蛋餐",
      eggsNeeded: result.eggsNeeded || 1,
      steps: result.steps || [],
      whyChloeLikes: result.whyChloeLikes || "因为它很好吃且造型可爱！",
      secret: result.secret || "新鲜的鸡蛋是关键。"
    };
  } catch (error) {
    console.error("OpenAI Service Error:", error);
    throw error;
  }
};
