import { GeminiService } from './geminiService';

/**
 * OcrService potenziato per il riconoscimento di numeri industriali.
 * Implementa una fase di pre-processing dell'immagine (contrasto e saturazione)
 * per migliorare la leggibilità di display digitali e analogici.
 */
export class OcrService {
  private static gemini = new GeminiService();

  static async recognizeNumber(canvas: HTMLCanvasElement, type: 'temperatura' | 'pressione'): Promise<string | null> {
    try {
      // Pre-processing del canvas per aumentare il contrasto dei numeri
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tctx = tempCanvas.getContext('2d');
      
      if (tctx) {
        // Applichiamo filtri per rendere i numeri più definiti (stile EasyOCR/PaddleOCR)
        tctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)';
        tctx.drawImage(canvas, 0, 0);
        
        const base64Image = tempCanvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        
        // Chiamata al motore Vision specializzato in numeri
        const extracted = await this.gemini.extractNumberFromImage(base64Image, type);
        
        if (extracted && extracted !== "ERROR") {
          const cleaned = extracted.replace(',', '.').replace(/[^0-9.]/g, '');
          if (!isNaN(parseFloat(cleaned))) {
            return cleaned;
          }
        }
      }
      return null;
    } catch (error) {
      console.error("OCR Runtime Error (Industrial Mode):", error);
      return null;
    }
  }

  static async terminate() {
    // Cloud-based engine, no local termination needed
  }
}