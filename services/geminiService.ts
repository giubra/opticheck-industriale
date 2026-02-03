import { GoogleGenAI } from "@google/genai";
import { Round, CheckEntry, Device } from "../types";

export class GeminiService {
  async analyzeRoundPerformance(round: Round): Promise<string> {
    const prompt = `
      Come esperto ingegnere di manutenzione industriale, analizza i seguenti dati del giro di controllo dell'operatore e fornisci un riassunto conciso in ITALIANO.
      Evidenzia eventuali cali di efficienza, guasti funzionali o valori che si avvicinano alle soglie critiche.
      
      Operatore Giro: ${round.operatorName}
      Controlli Totali: ${round.entries.length}
      
      Dati:
      ${JSON.stringify(round.entries, null, 2)}
      
      Fornisci:
      1. Sintesi dello stato di salute generale.
      2. Elementi specifici che richiedono attenzione immediata.
      3. Suggerimenti per l'ottimizzazione dell'efficienza.
    `;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text || "Impossibile generare l'analisi in questo momento.";
    } catch (error) {
      console.error("Errore Analisi Gemini:", error);
      return "Si è verificato un errore durante l'analisi AI.";
    }
  }

  async troubleshootDevice(device: Device, check: CheckEntry): Promise<string> {
    const prompt = `
      RICHIESTA RISOLUZIONE PROBLEMI (ITALIANO):
      Dispositivo: ${device.name} (${device.type})
      Stato Registrato: ${check.functionalityStatus}
      Valori Riportati: Temp ${check.temperature}°C, Pressione ${check.pressure} bar, Efficienza ${check.efficiency}%
      Note: ${check.notes}
      
      Le specifiche del dispositivo definiscono i limiti: Temp Max ${device.specifications.maxTemp}°C, Pressione Max ${device.specifications.maxPressure} bar.
      
      Fornisci una breve spiegazione diagnostica e 3 passaggi prioritari per la risoluzione dei problemi per l'operatore.
    `;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });
      return response.text || "Nessun dato di risoluzione problemi disponibile.";
    } catch (error) {
      console.error("Errore Risoluzione Gemini:", error);
      return "Recupero dei passaggi di risoluzione problemi fallito.";
    }
  }

  async extractNumberFromImage(base64Image: string, valueType: 'temperatura' | 'pressione'): Promise<string> {
    // Prompt specializzato per il riconoscimento di numeri in ambito industriale
    const prompt = `
      Agisci come un esperto di OCR industriale specializzato in metrologia. 
      L'obiettivo è estrarre un VALORE NUMERICO di ${valueType}.
      
      REGOLE DI RICONOSCIMENTO:
      1. Identifica display LCD a 7 segmenti, LED digitali o quadranti analogici.
      2. Estrai SOLO il numero (es. 42.5). Ignora unità di misura (°C, bar, psi).
      3. Gestisci ombre, riflessi sul vetro e cifre parzialmente rovinate tipiche degli impianti industriali.
      4. Se vedi un manometro analogico, stima la posizione della lancetta sulla scala numerica.
      
      OUTPUT:
      - Restituisci esclusivamente il numero puro.
      - Se il valore è assolutamente illeggibile, restituisci "ERROR".
      - Usa il punto decimali.
    `;
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          { text: prompt },
        ],
      });
      
      const result = response.text?.trim() || "ERROR";
      return result === "ERROR" ? "" : result;
    } catch (error) {
      console.error("Errore OCR Vision (Specialized Mode):", error);
      return "";
    }
  }
}