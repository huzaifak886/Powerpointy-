import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AnimationStep {
  title: string;
  description: string;
  screenshotPrompt: string;
}

export interface AnimationGuide {
  id: string;
  userId: string;
  title: string;
  steps: AnimationStep[];
  refinementTips: string[];
  youtubeReferences: { title: string; url: string }[];
  createdAt: string;
}

export async function generateAnimationGuide(prompt: string, userId: string): Promise<AnimationGuide> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Help the user create a PowerPoint animation or transition based on this prompt: "${prompt}". 
    Search for high-quality YouTube tutorials or professional animation techniques.
    Provide a structured response with:
    1. A catchy title.
    2. A list of 4-6 detailed steps. For each step, provide a short title, a detailed description, and a descriptive prompt for what a screenshot of this step in PowerPoint would look like (e.g., "Selection Pane showing two overlapping circles with Morph transition selected").
    3. 3-4 professional refinement tips.
    4. 2-3 YouTube search terms or video titles.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                screenshotPrompt: { type: Type.STRING }
              },
              required: ["title", "description", "screenshotPrompt"]
            }
          },
          refinementTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          youtubeReferences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING }
              }
            }
          }
        },
        required: ["title", "steps", "refinementTips"]
      }
    },
  });

  const data = JSON.parse(response.text || "{}");
  return {
    id: Date.now().toString(),
    userId,
    ...data,
    createdAt: new Date().toISOString()
  };
}
