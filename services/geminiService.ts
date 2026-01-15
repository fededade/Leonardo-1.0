import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// Initialize the Gemini API
// IMPORTANTE: Imposta VITE_GEMINI_API_KEY nelle variabili d'ambiente di Vercel
// Ottieni la chiave da: https://aistudio.google.com/app/apikey
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

let genAI: GoogleGenAI | null = null;

if (API_KEY) {
  genAI = new GoogleGenAI({ apiKey: API_KEY });
}

export const generateStudySupport = async (
  history: ChatMessage[],
  currentInput: string,
  discipline: string,
  attachments?: { base64: string; mimeType: string; name?: string }[]
): Promise<string> => {
  
  if (!genAI || !API_KEY) {
    return "⚠️ API Key di Google AI non configurata. Contatta l'amministratore per configurare VITE_GEMINI_API_KEY su Vercel.";
  }

  try {
    const systemPrompt = `Sei Leonardo, un assistente didattico AI per studenti delle scuole superiori italiane.
Materia corrente: ${discipline}

Linee guida:
- Rispondi sempre in italiano
- Usa un linguaggio chiaro e adatto a studenti delle superiori
- Fornisci spiegazioni dettagliate con esempi pratici
- Se lo studente carica un'immagine, analizzala e aiutalo a capirla
- Incoraggia lo studente e renditi disponibile per ulteriori domande
- Se la domanda non è pertinente alla materia, rispondi comunque in modo educativo`;

    // Build conversation history for the API
    const contents: any[] = [];
    
    // Add history messages
    for (const msg of history) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
    
    // Add current message with optional attachment
    const currentParts: any[] = [];
    
    if (contents.length === 0) {
      // First message, include system prompt
      currentParts.push({ text: systemPrompt + "\n\nStudente: " + currentInput });
    } else {
      currentParts.push({ text: currentInput });
    }
    
    // Add attachment if present
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        currentParts.push({
          inlineData: {
            mimeType: attachment.mimeType,
            data: attachment.base64
          }
        });
      }
    }
    
    contents.push({
      role: 'user',
      parts: currentParts
    });

    const model = genAI.models.get("gemini-2.0-flash");
    
    const response = await model.generateContent({
      contents: contents
    });

    return response.text || "Mi dispiace, non sono riuscito a generare una risposta. Riprova!";
    
  } catch (error: any) {
    console.error("Errore Gemini API:", error);
    
    if (error.message?.includes("API_KEY") || error.message?.includes("apiKey")) {
      return "⚠️ Errore: API Key non valida o non configurata. Verifica VITE_GEMINI_API_KEY su Vercel.";
    }
    
    if (error.message?.includes("quota") || error.message?.includes("429")) {
      return "⚠️ Limite di richieste raggiunto. Riprova tra qualche minuto.";
    }
    
    if (error.message?.includes("SAFETY")) {
      return "⚠️ La richiesta non può essere elaborata per motivi di sicurezza. Prova a riformulare la domanda.";
    }
    
    return `❌ Si è verificato un errore: ${error.message || 'Errore sconosciuto'}. Riprova più tardi.`;
  }
};
