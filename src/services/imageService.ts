import { GoogleGenAI } from "@google/genai";
import { RewardTier } from "../types";
import { CUSTOM_IMAGES } from "../constants";

// 使用常量中配置的背景图作为最终回退
export const STADIUM_FALLBACK = CUSTOM_IMAGES.STADIUM_BG;

export async function generateBabeImage(tier: RewardTier): Promise<string> {
  // 1. 优先检查是否有手动配置的自定义图片
  let customPath: string | null = null;
  switch (tier) {
    case RewardTier.NONE: 
      const loseVideos = CUSTOM_IMAGES.BABES.LOSE;
      customPath = loseVideos[Math.floor(Math.random() * loseVideos.length)]; 
      break;
    case RewardTier.BIG: 
      const winVideos = CUSTOM_IMAGES.BABES.WIN_BIG;
      customPath = winVideos[Math.floor(Math.random() * winVideos.length)];
      break;
    default: customPath = CUSTOM_IMAGES.BABES.IDLE;
  }

  // 如果配置了自定义图片，直接返回，不再调用 AI
  if (customPath) return customPath;

  // 2. 如果没有自定义图片，则尝试 AI 生成
  // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  let actionPrompt = "";
  switch (tier) {
    case RewardTier.NONE:
      actionPrompt = "comforting gesture, gentle smile, looking at camera with encouragement, 'try again' hand signal";
      break;
    case RewardTier.SMALL:
      actionPrompt = "blowing a kiss, winking, playful smile, holding a soccer ball";
      break;
    case RewardTier.MEDIUM:
      actionPrompt = "celebrating, cheering, hands in the air, energetic victory pose, big smile";
      break;
    case RewardTier.BIG:
      actionPrompt = "passionate celebration, jumping, cheering wildly, holding a trophy, extreme joy, radiant smile";
      break;
    default:
      actionPrompt = "standing confidently, waving to the viewer, inviting pose, athletic stance";
  }

  const prompt = `Photorealistic 8k full body shot of a stunningly beautiful Latin/American fitness model as a football cheerleader. 
  She has healthy tanned skin, long wavy hair, and is wearing a Brazil-themed yellow athletic crop top and green sports shorts. 
  She is standing in the middle of a vibrant green football stadium field. 
  The background shows blurred stadium seats and bright stadium lights. 
  Action: ${actionPrompt}. 
  Cinematic lighting, high detail, natural skin texture.`;

  try {
    // Switching to 2.5-flash-image which might have different permission requirements in some regions
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio: "9:16",
        },
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from AI");
    }

    const candidate = response.candidates[0];
    if (candidate.finishReason === "SAFETY") {
      throw new Error("Image generation blocked by safety filters");
    }

    const part = candidate.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }

    throw new Error("No image data in AI response. This usually means the API key does not support image generation.");
  } catch (error: any) {
    console.error("Gemini API Error Details:", error);
    
    if (error?.message?.includes("PERMISSION_DENIED") || error?.status === "PERMISSION_DENIED") {
      console.error("CRITICAL: Permission Denied. Please ensure you have selected a PAID API key with Billing enabled.");
    }
    
    return STADIUM_FALLBACK;
  }
}
