import { GoogleGenAI, Content } from "@google/genai";
import { MEETAI_SYSTEM_INSTRUCTION } from '../constants';
import { Message, MessageRole, Attachment } from '../types';

let genAI: GoogleGenAI | null = null;

const getAIClient = (): GoogleGenAI => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API_KEY is missing from environment variables");
      throw new Error("API Key missing");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

// Convert internal Message format to Gemini Content format
const formatHistory = (messages: Message[]): Content[] => {
  return messages
    .filter(m => !m.isThinking && m.role !== MessageRole.SYSTEM)
    .map(m => {
      const parts: any[] = [];
      
      // Add text
      if (m.text) {
        parts.push({ text: m.text });
      }

      // Add attachments if any
      if (m.attachments && m.attachments.length > 0) {
        m.attachments.forEach(att => {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data
            }
          });
        });
      }

      return {
        role: m.role === MessageRole.USER ? 'user' : 'model',
        parts: parts
      };
    });
};

export async function fileToGenerativePart(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // remove data:image/jpeg;base64,
      const base64Data = base64String.split(',')[1];
      resolve({
        name: file.name,
        mimeType: file.type,
        data: base64Data
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function* streamMessageToGemini(
  currentHistory: Message[],
  newMessage: string,
  attachments: Attachment[] = []
): AsyncGenerator<string, void, unknown> {
  try {
    const ai = getAIClient();
    
    // Construct the full history for context
    // Note: In a chat flow, the 'newMessage' is usually already part of the history state in the UI,
    // but the API expects history + current prompt.
    // If the UI passes the history INCLUDING the new message, we just use that.
    // If the UI passes history WITHOUT the new message, we append it.
    
    // Check if the last message in history matches the new message, if so, use history as is.
    // Otherwise construct the payload.
    
    const formattedHistory = formatHistory(currentHistory);
    
    // If the caller didn't add the new message to history yet, we manually construct the last turn.
    // However, usually it's cleaner to pass the FULL history including the latest user prompt.
    // For this implementation, we will assume 'currentHistory' contains everything EXCEPT the response we are about to generate.

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: formattedHistory,
      config: {
        systemInstruction: MEETAI_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        yield chunk.text;
      }
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    yield "Error: Unable to connect to MeetAi brain. Please check your connection or API key.";
  }
}