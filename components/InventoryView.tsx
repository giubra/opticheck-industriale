
import React, { useState, useRef, useEffect } from 'react';
import { Device, Status } from '../types';
import { 
  Plus, Trash2, Box, MapPin, Gauge, Thermometer, 
  ShieldAlert, CheckCircle, QrCode, X, Download, Fingerprint, Loader2, Link, Camera, Image as ImageIcon,
  Pencil, AlertCircle
} from 'lucide-react';

interface InventoryViewProps {
  devices: Device[];
  onAdd: (device: Device) => void;
  onUpdate: (device: Device) => void;
  onRemove: (id: string) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ devices, onAdd, onUpdate, onRemove }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [showQrModal, setShowQrModal] = useState<Device | null>(null);
  const [nfcAsset, setNfcAsset] = useState<Device | null>(null);
  const [isNfcWriting, setIsNfcWriting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    nfcId: '',
    maxTemp: '',
    maxPressure: '',
    minEfficiency: '80'
  });

  // Handle populating form when editing
  useEffect(() => {
    if (editingDevice) {
      setFormData({
        name: editingDevice.name,
        type: editingDevice.type,
        location: editingDevice.location,
        nfcId: editingDevice.nfcId || '',
        maxTemp: editingDevice.specifications.maxTemp.toString(),
        maxPressure: editingDevice.specifications.maxPressure.toString(),
        minEfficiency: editingDevice.specifications.minEfficiency.toString()
      });
      setPreviewImage(editingDevice.imageUrl || null);
      setIsAdding(true);
    }
  }, [editingDevice]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingDevice(null);
    setPreviewImage(null);
    setFormData({ name: '', type: '', location: '', nfcId: '', maxTemp: '', maxPressure: '', minEfficiency: '80' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const devicePayload = {
      name: formData.name,
      type: formData.type,
      location: formData.location,
      nfcId: formData.nfcId || undefined,
      imageUrl: previewImage || undefined,
      specifications: {
        maxTemp: parseFloat(formData.maxTemp),
        maxPressure: parseFloat(formData.maxPressure),
        minEfficiency: parseFloat(formData.minEfficiency),
      }
    };

    if (editingDevice) {
      const updatedDevice: Device = {
        ...editingDevice,
        ...devicePayload
      };
      onUpdate(updatedDevice);
    } else {
      const newDevice: Device = {
        id: `D-${Math.floor(Math.random() * 900) + 100}`,
        lastChecked: 'Mai controllato',
        status: 'Ottimale' as Status,
        ...devicePayload
      };
      onAdd(newDevice);
    }
    
    resetForm();
  };

  const handleAssignNfc = async (device: Device) => {
    setIsNfcWriting(true);
    // Simulation of hardware NFC interaction
    await new Promise(resolve => setTimeout(resolve, 2000));
    const mockNfcId = `NFC-${Math.floor(Math.random() * 1000000).toString(16).toUpperCase()}`;
    
    if (isAdding) {
      // If we are currently filling the form, just update the field
      setFormData(prev => ({ ...prev, nfcId: mockNfcId }));
    } else {
      // Otherwise update the device directly
      onUpdate({ ...device, nfcId: mockNfcId });
    }
    
    setIsNfcWriting(false);
    setNfcAsset(null);
  };

  const getQrUrl = (id: string) => `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${id}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Registro Asset Industriali</h2>
          <p className="text-slate-500 text-sm">Gestione e configurazione dei dispositivi dell'impianto.</p>
        </div>
        <button 
          onClick={() => {
            if (isAdding) resetForm();
            else setIsAdding(true);
          }}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
            isAdding ? 'bg-slate-200 text-slate-700' : 'bg-blue-600 text-white shadow-blue-100'
          }`}
        >
          {isAdding ? 'Annulla' : <><Plus size={20} /> Aggiungi Asset</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border-2 border-blue-100 shadow-xl animate-in zoom-in-95 duration-300">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            {editingDevice ? <Pencil className="text-blue-600" size={20} /> : <Box className="text-blue-600" size={20} />}
            {editingDevice ? `Modifica Asset: ${editingDevice.name}` : 'Configura Nuovo Dispositivo'}
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Image Upload Section */}
            <div className="lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-2 block">Foto Asset</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all overflow-hidden group"
              >
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera className="text-slate-300 group-hover:text-blue-500 mb-2" size={32} />
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase">Carica o Scatta</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              {previewImage && (
                <button 
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="mt-2 text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 mx-auto"
                >
                  <X size={12} /> Rimuovi Foto
                </button>
              )}
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Nome Dispositivo</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 outline-none font-semibold transition-all"
                    placeholder="es. Turbina B-12"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Tipologia</label>
                  <input 
                    required
                    type="text" 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 outline-none font-semibold transition-all"
                    placeholder="es. Pompa Idraulica"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Posizione (Settore)</label>
                  <input 
                    required
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 outline-none font-semibold transition-all"
                    placeholder="es. Settore 1 - Ala Est"
                  />
                </div>
              </div>

              {/* NFC Specific Field in Form */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">ID Tag NFC (Opzionale)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      value={formData.nfcId}
                      onChange={e => setFormData({...formData, nfcId: e.target.value})}
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 outline-none font-semibold transition-all"
                      placeholder="NFC-XXXXXX o Scansiona Tag"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNfcAsset(editingDevice || ({} as Device))}
                    className="px-4 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
                  >
                    <Link size={16} /> Scansiona
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Temp. Max (°C)</label>
                  <div className="relative">
                    <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      required
                      type="number" 
                      value={formData.maxTemp}
                      onChange={e => setFormData({...formData, maxTemp: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 outline-none font-semibold transition-all"
                      placeholder="85"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Press. Max (bar)</label>
                  <div className="relative">
                    <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      required
                      type="number" 
                      value={formData.maxPressure}
                      onChange={e => setFormData({...formData, maxPressure: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 outline-none font-semibold transition-all"
                      placeholder="12"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Eff. Min (%)</label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      required
                      type="number" 
                      value={formData.minEfficiency}
                      onChange={e => setFormData({...formData, minEfficiency: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 outline-none font-semibold transition-all"
                      placeholder="75"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={resetForm} className="px-6 py-4 rounded-2xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                  Annulla
                </button>
                <button type="submit" className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-colors shadow-lg active:scale-95">
                  {editingDevice ? 'Salva Modifiche' : 'Registra Asset'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <Box size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-bold">Nessun asset registrato.</p>
            <p className="text-sm">Inizia aggiungendo un nuovo dispositivo all'inventario.</p>
          </div>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all flex flex-col relative overflow-hidden">
              {/* Asset Photo / Header */}
              <div className="aspect-[16/9] relative bg-slate-100 overflow-hidden">
                {device.imageUrl ? (
                  <img src={device.imageUrl} alt={device.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon size={48} strokeWidth={1} />
                  </div>
                )}
                
                {/* Badge Status overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                    device.status === 'Ottimale' ? 'bg-green-500 text-white' :
                    device.status === 'Attenzione' ? 'bg-yellow-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {device.status}
                  </span>
                  
                  {/* NFC Association Badge */}
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${
                    device.nfcId ? 'bg-blue-600 text-white' : 'bg-slate-700/80 text-white/60'
                  }`}>
                    {device.nfcId ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                    NFC: {device.nfcId ? 'Associato' : 'Mancante'}
                  </span>
                </div>

                {/* Quick actions overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => setEditingDevice(device)}
                    className="p-2 bg-white/20 backdrop-blur-md text-white hover:bg-blue-600 transition-all rounded-xl shadow-lg"
                    title="Modifica Asset"
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    onClick={() => onRemove(device.id)}
                    className="p-2 bg-white/20 backdrop-blur-md text-white hover:bg-red-500 transition-all rounded-xl shadow-lg"
                    title="Elimina Asset"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowQrModal(device)}
                      className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
                      title="Mostra QR Code"
                    >
                      <QrCode size={20} />
                    </button>
                    <button 
                      onClick={() => setNfcAsset(device)}
                      className={`p-2 rounded-xl transition-all ${device.nfcId ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                      title={device.nfcId ? `NFC: ${device.nfcId}` : 'Configura NFC'}
                    >
                      <Fingerprint size={20} />
                    </button>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{device.id}</span>
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{device.name}</h4>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{device.type}</p>
                    {device.nfcId && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 text-[8px] font-black text-blue-600 uppercase">
                        <Fingerprint size={8} /> {device.nfcId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mt-auto pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="truncate">{device.location}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 p-2 rounded-xl text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase">T. Max</p>
                    <p className="text-xs font-bold text-slate-700">{device.specifications.maxTemp}°</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase">P. Max</p>
                    <p className="text-xs font-bold text-slate-700">{device.specifications.maxPressure}b</p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Eff. Min</p>
                    <p className="text-xs font-bold text-slate-700">{device.specifications.minEfficiency}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* NFC Assignment Modal */}
      {nfcAsset && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">Configurazione NFC</h3>
                <p className="text-xs opacity-60 uppercase font-bold tracking-wider">{nfcAsset.id || 'NUOVO ASSET'}</p>
              </div>
              <button onClick={() => setNfcAsset(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 flex flex-col items-center">
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 border-4 transition-all ${isNfcWriting ? 'border-blue-500 border-t-transparent animate-spin' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                {isNfcWriting ? <Fingerprint size={48} className="animate-pulse text-blue-500" /> : <Fingerprint size={48} />}
              </div>
              
              <h4 className="text-xl font-black text-slate-800 text-center mb-2">Avvicina Tag NFC</h4>
              <p className="text-sm text-slate-500 text-center mb-8">
                {isNfcWriting 
                  ? "Scrittura identificatore univoco sul tag in corso... Non allontanare il dispositivo."
                  : nfcAsset.name ? `Collega un tag NFC fisico a "${nfcAsset.name}".` : "Avvicina il tag per rilevarne l'ID."}
              </p>
              
              {!isNfcWriting && (
                <button 
                  onClick={() => handleAssignNfc(nfcAsset)}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  <Link size={20} />
                  Avvia Associazione
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg">Asset QR Code</h3>
                <p className="text-xs opacity-80 uppercase font-bold tracking-wider">{showQrModal.id}</p>
              </div>
              <button onClick={() => setShowQrModal(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 flex flex-col items-center">
              <div className="bg-white p-4 rounded-3xl border-2 border-slate-100 shadow-inner mb-6">
                <img 
                  src={getQrUrl(showQrModal.id)} 
                  alt={`QR code for ${showQrModal.name}`}
                  className="w-48 h-48"
                />
              </div>
              <h4 className="text-xl font-black text-slate-800 text-center mb-1">{showQrModal.name}</h4>
              <p className="text-sm text-slate-500 mb-8">{showQrModal.location}</p>
              
              <button 
                onClick={() => window.print()}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
              >
                <Download size={20} />
                Scarica per Stampa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;
