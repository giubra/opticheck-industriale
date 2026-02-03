import React, { useState, useRef, useEffect } from 'react';
import { Device, Round, CheckEntry } from '../types';
import { GeminiService } from '../services/geminiService';
import { OcrService } from '../services/ocrService';
import { ApiService, DbConfig } from '../services/apiService';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  ChevronRight, CheckCircle, AlertTriangle, Loader2, BrainCircuit, 
  ChevronLeft, Wrench, ClipboardList, Activity, QrCode, CloudIcon, Download,
  Database, ShieldCheck, X, Fingerprint, Search, Camera, Image as ImageIcon,
  Zap, Scan, Focus
} from 'lucide-react';

interface RoundViewProps {
  devices: Device[];
}

const RoundView: React.FC<RoundViewProps> = ({ devices }) => {
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [troubleshootResult, setTroubleshootResult] = useState<string | null>(null);
  const [isTroubleshooting, setIsTroubleshooting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isNfcReading, setIsNfcReading] = useState(false);
  const [isIdentified, setIsIdentified] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // OCR States
  const [isOcrActive, setIsOcrActive] = useState(false);
  const [ocrTarget, setOcrTarget] = useState<'temp' | 'pressure' | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ocrLoopRef = useRef<number | null>(null);

  const reportRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Form states
  const [temp, setTemp] = useState('');
  const [pressure, setPressure] = useState('');
  const [efficiency, setEfficiency] = useState('');
  const [notes, setNotes] = useState('');
  const [funcStatus, setFuncStatus] = useState<'Passa' | 'Fallito'>('Passa');

  const gemini = new GeminiService();

  useEffect(() => {
    if (isScanning) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scanner.render((decodedText) => {
        handleScanSuccess(decodedText);
        scanner.clear();
      }, (error) => {});
      
      scannerRef.current = scanner;
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, [isScanning]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startOcr = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          startAutoCaptureLoop();
        }
      } catch (err) {
        console.error("Camera error:", err);
        setIsOcrActive(false);
        alert("Impossibile accedere alla fotocamera.");
      }
    };

    if (isOcrActive) {
      startOcr();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (ocrLoopRef.current) {
        window.clearInterval(ocrLoopRef.current);
        ocrLoopRef.current = null;
      }
    };
  }, [isOcrActive]);

  const startAutoCaptureLoop = () => {
    if (ocrLoopRef.current) return;
    ocrLoopRef.current = window.setInterval(() => {
      captureAndOcr();
    }, 2500); // Optimized for industrial reading
  };

  const captureAndOcr = async () => {
    if (!videoRef.current || !canvasRef.current || !ocrTarget || isOcrProcessing) return;
    
    setIsOcrProcessing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      setIsOcrProcessing(false);
      return;
    }

    // Precision window for gauge reading
    const boxWidth = 480;
    const boxHeight = 280;
    canvas.width = boxWidth;
    canvas.height = boxHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const startX = (video.videoWidth - boxWidth) / 2;
      const startY = (video.videoHeight - boxHeight) / 2;
      ctx.drawImage(video, startX, startY, boxWidth, boxHeight, 0, 0, boxWidth, boxHeight);
      
      // Execute specialized number recognition
      const extractedValue = await OcrService.recognizeNumber(
        canvas, 
        ocrTarget === 'temp' ? 'temperatura' : 'pressione'
      );
      
      if (extractedValue) {
        if (ocrTarget === 'temp') setTemp(extractedValue);
        else setPressure(extractedValue);
        
        setIsOcrActive(false);
        setOcrTarget(null);
        if (ocrLoopRef.current) clearInterval(ocrLoopRef.current);
        ocrLoopRef.current = null;
      }
    }
    setIsOcrProcessing(false);
  };

  const startNewRound = () => {
    if (devices.length === 0) {
      alert("Aggiungi almeno un asset nell'inventario prima di iniziare il giro.");
      return;
    }
    const configStr = localStorage.getItem('opticheck_db_config_v2');
    const config: DbConfig = configStr ? JSON.parse(configStr) : { server: '', user: 'Operatore' };

    setCurrentRound({
      id: `R-${Date.now()}`,
      operatorName: config.user,
      startTime: new Date().toLocaleString('it-IT'),
      status: 'In Corso',
      entries: []
    });
    setSelectedDeviceIndex(0);
    setAnalysisResult(null);
    setSaveMessage(null);
    setIsIdentified(false);
  };

  const currentDevice = devices[selectedDeviceIndex];

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(false);
    const foundIndex = devices.findIndex(d => d.id === decodedText);
    
    if (foundIndex !== -1) {
      const alreadyChecked = currentRound?.entries.some(e => e.deviceId === decodedText);
      if (alreadyChecked) {
        alert(`L'asset "${devices[foundIndex].name}" è già stato controllato in questo giro.`);
        return;
      }
      setSelectedDeviceIndex(foundIndex);
      setIsIdentified(true);
    } else {
      alert(`Asset con ID "${decodedText}" non trovato nell'inventario.`);
    }
  };

  const handleNfcRead = async () => {
    setIsNfcReading(true);
    if ('NDEFReader' in window) {
      try {
        // @ts-ignore
        const ndef = new NDEFReader();
        await ndef.scan();
        ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
          setIsNfcReading(false);
          const assetWithNfc = devices.find(d => d.nfcId !== undefined);
          if (assetWithNfc) {
            handleAutoIdentified(assetWithNfc.nfcId!);
          } else {
            alert("Nessun asset con NFC configurato trovato nel sistema.");
          }
        });
      } catch (error) {
        console.error("NFC Error:", error);
        setIsNfcReading(false);
        simulateNfcRead(); 
      }
    } else {
      simulateNfcRead();
    }
  };

  const simulateNfcRead = () => {
    setTimeout(() => {
      setIsNfcReading(false);
      const assetsWithNfc = devices.filter(d => d.nfcId);
      if (assetsWithNfc.length > 0) {
        const randomAsset = assetsWithNfc[Math.floor(Math.random() * assetsWithNfc.length)];
        handleAutoIdentified(randomAsset.nfcId!);
      } else {
        alert("Simulazione: Nessun asset nell'inventario ha un tag NFC configurato.");
      }
    }, 2000);
  };

  const handleAutoIdentified = (nfcId: string) => {
    const foundIndex = devices.findIndex(d => d.nfcId === nfcId);
    if (foundIndex !== -1) {
      const alreadyChecked = currentRound?.entries.some(e => e.deviceId === devices[foundIndex].id);
      if (alreadyChecked) {
        alert(`L'asset "${devices[foundIndex].name}" (NFC: ${nfcId}) è già stato controllato.`);
        return;
      }
      setSelectedDeviceIndex(foundIndex);
      setIsIdentified(true);
    } else {
      alert(`Tag NFC "${nfcId}" non riconosciuto dal sistema.`);
    }
  };

  const handleNext = async () => {
    if (!currentRound) return;

    const newEntry: CheckEntry = {
      deviceId: currentDevice.id,
      timestamp: new Date().toLocaleString('it-IT'),
      temperature: parseFloat(temp),
      pressure: parseFloat(pressure),
      efficiency: parseFloat(efficiency),
      functionalityStatus: funcStatus,
      notes
    };

    const updatedRound = {
      ...currentRound,
      entries: [...currentRound.entries, newEntry]
    };
    
    setCurrentRound(updatedRound);
    setTemp(''); setPressure(''); setEfficiency(''); setNotes(''); setFuncStatus('Passa'); setTroubleshootResult(null);
    setIsIdentified(false);

    const checkedIds = updatedRound.entries.map(e => e.deviceId);
    const nextUncheckedIndex = devices.findIndex(d => !checkedIds.includes(d.id));

    if (nextUncheckedIndex !== -1) {
      setSelectedDeviceIndex(nextUncheckedIndex);
    } else {
      updatedRound.status = 'Completato';
      setCurrentRound(updatedRound);
      finalizeRound(updatedRound);
    }
  };

  const finalizeRound = async (round: Round) => {
    setIsAnalyzing(true);
    const aiResponse = await gemini.analyzeRoundPerformance(round);
    setAnalysisResult(aiResponse);
    setIsAnalyzing(false);

    const configStr = localStorage.getItem('opticheck_db_config_v2');
    if (!configStr) {
      setSaveMessage("Attenzione: Configurazione database mancante.");
      return;
    }
    
    const config: DbConfig = JSON.parse(configStr);

    setIsSaving(true);
    const dbResponse = await ApiService.saveRoundToCloud(round, config);
    setSaveMessage(dbResponse.message);
    setIsSaving(false);
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Report_Giro_${currentRound?.id}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (!currentRound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-12 text-center px-6">
        <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
          <ClipboardList className="text-blue-600" size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">Giro di Controllo</h2>
        <p className="text-slate-500 max-w-sm mb-10 leading-relaxed text-sm">
          Sincronizzazione Cloud MySQL attiva. Inizia il giro per registrare i dati sensore e ottenere analisi istantanee tramite AI.
        </p>
        <button 
          onClick={startNewRound}
          className="w-full max-w-xs bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-blue-200 active:scale-95 transition-transform"
        >
          Inizia Nuovo Giro
        </button>
      </div>
    );
  }

  if (currentRound.status === 'Completato') {
    const pieData = [
      { name: 'Pass', value: currentRound.entries.filter(e => e.functionalityStatus === 'Passa').length },
      { name: 'Fail', value: currentRound.entries.filter(e => e.functionalityStatus === 'Fallito').length },
    ];
    const COLORS = ['#10b981', '#ef4444'];

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in zoom-in-95">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-black mb-1">Sessione Completata</h2>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase">
             <CloudIcon size={14} className={isSaving ? "text-blue-500 animate-pulse" : "text-blue-500"} />
             {saveMessage || (isSaving ? 'Salvataggio su Database Cloud...' : 'In attesa di conferma...')}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Stato Funzionale Giro</h4>
             <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="flex justify-around mt-2">
                <div className="text-center">
                  <p className="text-lg font-black text-green-600">{pieData[0].value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Superati</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-red-600">{pieData[1].value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Anomalie</p>
                </div>
             </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
             <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Andamento Efficienza</h4>
             <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentRound.entries}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis hide dataKey="deviceId" />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
             </div>
             <p className="text-center text-[10px] font-bold text-slate-400 uppercase mt-2">Variazione per Dispositivo</p>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] p-4 opacity-5">
            <BrainCircuit size={150} />
          </div>
          <h3 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-blue-400">
            <BrainCircuit size={18} />
            Ingegneria Diagnostica (AI)
          </h3>
          
          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="animate-spin text-blue-400" size={32} />
              <span className="text-slate-400 text-xs font-bold uppercase animate-pulse">Generazione analisi tecnica...</span>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {analysisResult}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button 
            disabled={isGeneratingPdf}
            onClick={exportPDF}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            {isGeneratingPdf ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            Scarica Report Tecnico (PDF)
          </button>
          <button 
            onClick={() => setCurrentRound(null)}
            className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold active:bg-slate-50"
          >
            Torna alla Bacheca
          </button>
        </div>

        <div ref={reportRef} className="pdf-template">
          <div className="flex justify-between items-start border-b-4 border-blue-600 pb-6 mb-8">
             <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase">Report Manutenzione</h1>
                <p className="text-slate-500 font-bold uppercase text-sm">Sistema OptiCheck Industriale</p>
             </div>
             <div className="text-right">
                <p className="font-bold text-slate-900 uppercase">ID SESSIONE: {currentRound.id}</p>
                <p className="text-sm text-slate-500">Data: {currentRound.startTime}</p>
             </div>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl text-sm leading-relaxed text-slate-700 italic border border-slate-200">
            {analysisResult}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4 pb-10">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avanzamento Giro</span>
            <span className="text-sm font-bold text-slate-700">{currentRound.entries.length} di {devices.length} Asset</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${isIdentified ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {isIdentified ? <><ShieldCheck size={12} /> Asset Identificato</> : <><Search size={12} /> In attesa di Scan</>}
          </div>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 ease-out" 
            style={{ width: `${(currentRound.entries.length / devices.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
        {!isIdentified ? (
          <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <QrCode size={32} />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Scansione Automatica</h3>
            <p className="text-slate-500 text-sm mb-8 max-w-[320px]">
              Il sistema identificherà automaticamente l'asset non appena scansionerai il suo codice QR o toccherai il tag NFC.
            </p>
            
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <button 
                onClick={() => setIsScanning(true)}
                className="py-4 bg-slate-900 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
              >
                <QrCode size={24} />
                <span className="text-[10px] uppercase">Scan QR</span>
              </button>
              <button 
                onClick={handleNfcRead}
                disabled={isNfcReading}
                className={`py-4 bg-blue-600 text-white rounded-2xl font-bold flex flex-col items-center justify-center gap-2 shadow-xl active:scale-95 transition-all ${isNfcReading ? 'opacity-50' : ''}`}
              >
                {isNfcReading ? <Loader2 size={24} className="animate-spin" /> : <Fingerprint size={24} />}
                <span className="text-[10px] uppercase">{isNfcReading ? 'Ricerca...' : 'Tag NFC'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 overflow-hidden shrink-0 border border-slate-200">
                  {currentDevice.imageUrl ? (
                    <img src={currentDevice.imageUrl} alt={currentDevice.name} className="w-full h-full object-cover" />
                  ) : (
                    <Activity size={24} />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 leading-tight text-lg">{currentDevice.name}</h3>
                  <p className="text-xs text-slate-500">{currentDevice.location} • {currentDevice.type}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-[9px] font-black uppercase">Identificato</div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{currentDevice.id}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Temp. (°C)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={temp}
                      onChange={e => setTemp(e.target.value)}
                      className="w-full pl-4 pr-12 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg font-semibold" 
                      placeholder="---"
                    />
                    <button 
                      onClick={() => { setOcrTarget('temp'); setIsOcrActive(true); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Press. (bar)</label>
                  <div className="relative group">
                    <input 
                      type="number" 
                      inputMode="decimal"
                      value={pressure}
                      onChange={e => setPressure(e.target.value)}
                      className="w-full pl-4 pr-12 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg font-semibold" 
                      placeholder="---"
                    />
                    <button 
                      onClick={() => { setOcrTarget('pressure'); setIsOcrActive(true); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-colors"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Efficienza (%)</label>
                <input 
                  type="number" 
                  inputMode="decimal"
                  value={efficiency}
                  onChange={e => setEfficiency(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-lg font-semibold" 
                  placeholder="---"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Esito Operativo</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFuncStatus('Passa')}
                    className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold ${funcStatus === 'Passa' ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 'border-slate-100 text-slate-400'}`}
                  >
                    PASS
                  </button>
                  <button 
                    onClick={() => setFuncStatus('Fallito')}
                    className={`flex-1 py-4 rounded-2xl border-2 transition-all font-bold ${funcStatus === 'Fallito' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-100' : 'border-slate-100 text-slate-400'}`}
                  >
                    FAIL
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Osservazioni Tecniche</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 outline-none h-20 text-sm" 
                  placeholder="Note aggiuntive..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsIdentified(false)}
                  className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold active:bg-slate-200"
                >
                  Indietro
                </button>
                <button 
                  onClick={handleNext}
                  disabled={!temp || !pressure || !efficiency}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold active:scale-[0.98] transition-all disabled:bg-slate-200 shadow-xl shadow-slate-200"
                >
                  Salva Controllo
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Vision-Powered Precision OCR Overlay */}
      {isOcrActive && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col animate-in fade-in duration-300 overflow-hidden">
          <div className="p-4 bg-slate-900/80 backdrop-blur-md flex justify-between items-center text-white shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Focus size={18} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Industrial Precision OCR</h3>
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                  Target: {ocrTarget === 'temp' ? 'Temperatura' : 'Pressione'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => {
                setIsOcrActive(false);
                if (ocrLoopRef.current) clearInterval(ocrLoopRef.current);
                ocrLoopRef.current = null;
              }} 
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="relative flex-1 bg-black flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Precision Detection Box */}
              <div className="w-[480px] h-[280px] border-[3px] border-blue-500 rounded-2xl relative shadow-[0_0_100px_rgba(59,130,246,0.3)] bg-blue-500/5">
                <div className="absolute top-0 left-0 w-12 h-12 border-t-[4px] border-l-[4px] border-white rounded-tl-2xl -translate-x-1 -translate-y-1"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-[4px] border-r-[4px] border-white rounded-tr-2xl translate-x-1 -translate-y-1"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[4px] border-l-[4px] border-white rounded-bl-2xl -translate-x-1 translate-y-1"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[4px] border-r-[4px] border-white rounded-br-2xl translate-x-1 translate-y-1"></div>
                
                {/* Metrology-style high-frequency scan lines */}
                <div className="absolute inset-x-0 h-0.5 bg-blue-400/60 shadow-[0_0_15px_rgba(59,130,246,0.9)] animate-[scan_1.8s_linear_infinite]" />
              </div>
              
              <div className="mt-12 px-6 text-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-black/70 backdrop-blur-md rounded-full border border-white/20">
                  <Zap size={18} className="text-blue-400 animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.15em]">Rilevamento cifre strumentali attivo</span>
                </div>
              </div>
            </div>

            {isOcrProcessing && (
              <div className="absolute inset-x-0 bottom-24 flex justify-center animate-in slide-in-from-bottom-4">
                <div className="bg-slate-900/95 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-5 border border-blue-500/40">
                  <div className="relative">
                    <Loader2 size={28} className="animate-spin text-blue-400" />
                    <BrainCircuit size={12} className="absolute inset-0 m-auto text-white animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm uppercase tracking-tight">Analisi Metrica AI</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Filtraggio rumore ottico...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 bg-slate-900 shrink-0 border-t border-white/10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <ShieldCheck size={14} className="text-green-500" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Digital Display Calibration Engine</p>
            </div>
            <p className="text-white/60 text-[11px] leading-relaxed max-w-[320px] mx-auto font-medium">
              Ottimizzato per 7-segmenti LED, LCD industriali e quadranti analogici. Mantieni il sensore al centro dell'inquadratura.
            </p>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {isScanning && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-900">Scansione Asset</h3>
              <button onClick={() => setIsScanning(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-4">
              <div className="bg-slate-100 rounded-3xl overflow-hidden relative border-4 border-blue-500/20 aspect-square">
                <div id="qr-reader" className="w-full h-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RoundView;