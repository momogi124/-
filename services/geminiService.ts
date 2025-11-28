import { GoogleGenAI, Type } from "@google/genai";
import { ArtCritique } from "../types";

// Note: In a real production environment, this should be proxied through a backend.
// We assume process.env.API_KEY is available as per instructions.

export const generateArtisticCritique = async (imageDataBase64: string): Promise<ArtCritique> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemPrompt = `
    You are a high-concept avant-garde art critic and digital philosopher. 
    Analyze the visual structure of the provided image as if it were a 
    topological data sculpture. Use abstract, restrained, and sophisticated 
    language typical of high-end design magazines (like Wallpaper*, 
    Open Processing, or TouchDesigner forums).
    Focus on geometry, flow, entropy, and signal.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/png", data: imageDataBase64 } },
          { text: "Generate a critique of this form." }
        ]
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A cryptic, single-word or two-word title." },
            description: { type: Type.STRING, description: "A poetic, abstract paragraph describing the form and flow." },
            mood: { type: Type.STRING, description: "Three adjectives separated by dots." }
          },
          required: ["title", "description", "mood"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ArtCritique;
    }
    
    throw new Error("No response generated");

  } catch (error) {
    console.error("Gemini Critique Error:", error);
    return {
      title: "STATIC_VOID",
      description: "Signal lost. The data stream is silent.",
      mood: "Null. Void. Empty."
    };
  }
};
