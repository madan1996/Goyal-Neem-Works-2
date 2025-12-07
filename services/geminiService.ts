import { GoogleGenAI } from "@google/genai";
import { PRODUCTS } from "../constants";
import { logger } from "./loggerService";

// Initialize Gemini Client
// IMPORTANT: The API key must be available in process.env.API_KEY
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_INSTRUCTION = `
You are 'Veda', an expert Ayurvedic and Herbal Consultant for the 'VedaRoot' store.
Your goal is to help customers choose the right herbal products based on their needs.

Here is the list of available products in the store:
${PRODUCTS.map(p => `- ${p.name} (${p.nameHindi}): ${p.description} (Benefits: ${p.benefits.join(', ')})`).join('\n')}

Rules:
1. Answer users primarily in Hindi mixed with English terms (Hinglish) or pure Hindi if they ask in Hindi. If they ask in English, answer in English.
2. Recommend VedaRoot products from the list above when relevant to the user's ailment.
3. If the user asks about a medical condition, provide general ayurvedic advice but include a disclaimer that you are an AI and they should consult a doctor.
4. Keep answers concise, warm, and earthy in tone. Use emojis like 🌿, 🍵, ✨.
5. Do not hallucinate products not in the list, but you can suggest general herbs (like Turmeric, Neem) if we don't sell a specific product, then guide them to something similar we do sell.
`;

export const sendMessageToGemini = async (message: string, history: {role: 'user' | 'model', text: string}[]) => {
  if (!apiKey) {
    logger.log('ERROR', 'API Key missing', { 
      errorCode: 'API_KEY_MISSING', 
      functionName: 'sendMessageToGemini' 
    });
    return "Error: API Key is missing. Please configure the API Key.";
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message });
    return result.text;
  } catch (error) {
    logger.log('ERROR', 'Gemini API Request Failed', {
      errorCode: 'GEMINI_API_ERROR',
      functionName: 'sendMessageToGemini',
      requestData: { message, historyCount: history.length },
      error: error
    });
    console.error("Gemini API Error:", error);
    return "माफ़ कीजिये, मैं अभी उत्तर देने में असमर्थ हूँ। कृपया थोड़ी देर बाद प्रयास करें। (Sorry, I cannot answer right now.)";
  }
};