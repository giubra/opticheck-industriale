
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import RoundView from './components/RoundView';
import InventoryView from './components/InventoryView';
import LoginView from './components/LoginView';
import { MOCK_DEVICES } from './constants';
import { Device } from './types';
import { ApiService, DbConfig } from './services/apiService';
import { 
  Activity, Database, User, ShieldCheck, Bell, Save, 
  BrainCircuit, Lock, Server, Table, RefreshCw, Loader2, Clock
} from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [devices, setDevices] = useState<Device[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  const [dbConfig, setDbConfig] = useState<DbConfig>({
    server: 'mysql-prod-01.industrial-cloud.net',
    user: 'admin_alex_j',
    password: '',
    database: 'opticheck_main',
    table: 'operator_rounds'
  });
  
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const syncIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Check auth
    const authStatus = localStorage.getItem('opticheck_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }

    // Load config
    const savedConfig = localStorage.getItem('opticheck_db_config_v2');
    if (savedConfig) {
      setDbConfig(JSON.parse(savedConfig));
    }

    // Load devices
    const savedDevices = localStorage.getItem('opticheck_devices');
    if (savedDevices) {
      setDevices(JSON.parse(savedDevices));
    } else {
      setDevices(MOCK_DEVICES);
      localStorage.setItem('opticheck_devices', JSON.stringify(MOCK_DEVICES));
    }

    // Setup Auto-Sync (Every 5 minutes)
    syncIntervalRef.current = window.setInterval(() => {
      autoSyncInventory();
    }, 5 * 60 * 1000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, []);

  const autoSyncInventory = async () => {
    if (!isAuthenticated) return;
    setIsSyncing(true);
    const result = await ApiService.syncInventoryToCloud(devices, dbConfig);
    if (result.success) {
      setLastSyncTime(new Date().toLocaleTimeString());
    }
    setIsSyncing(false);
  };

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      localStorage.setItem('opticheck_auth', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('opticheck_auth');
  };

  const handleSaveConfig = () => {
    localStorage.setItem('opticheck_db_config_v2', JSON.stringify(dbConfig));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSyncInventory = async () => {
    setIsSyncing(true);
    setSyncStatus("Avvio sincronizzazione asset...");
    const result = await ApiService.syncInventoryToCloud(devices, dbConfig);
    setSyncStatus(result.message);
    setLastSyncTime(new Date().toLocaleTimeString());
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus(null);
    }, 4000);
  };

  const handleAddDevice = (device: Device) => {
    const updated = [...devices, device];
    setDevices(updated);
    localStorage.setItem('opticheck_devices', JSON.stringify(updated));
  };

  const handleUpdateDevice = (updatedDevice: Device) => {
    const updated = devices.map(d => d.id === updatedDevice.id ? updatedDevice : d);
    setDevices(updated);
    localStorage.setItem('opticheck_devices', JSON.stringify(updated));
  };

  const handleRemoveDevice = (id: string) => {
    const updated = devices.filter(d => d.id !== id);
    setDevices(updated);
    localStorage.setItem('opticheck_devices', JSON.stringify(updated));
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard devices={devices} />;
      case 'rounds':
        return <RoundView devices={devices} />;
      case 'inventory':
        return <InventoryView devices={devices} onAdd={handleAddDevice} onUpdate={handleUpdateDevice} onRemove={handleRemoveDevice} />;
      case 'settings':
        return (
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                    <Database size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">Parametri MySQL Cloud</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Configurazione Connessione Remota</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {syncStatus ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold animate-in fade-in slide-in-from-right-2">
                      {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                      {syncStatus}
                    </div>
                  ) : (
                    lastSyncTime && (
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase">
                        <Clock size={12} />
                        Ultima Sincronizzazione: {lastSyncTime}
                      </div>
                    )
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Server / Endpoint</label>
                  <div className="relative">
                    <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      value={dbConfig.server}
                      onChange={e => setDbConfig({...dbConfig, server: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold" 
                      placeholder="db.cloud-instance.mysql.net"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Username</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      value={dbConfig.user}
                      onChange={e => setDbConfig({...dbConfig, user: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold" 
                      placeholder="root_user"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="password" 
                      value={dbConfig.password}
                      onChange={e => setDbConfig({...dbConfig, password: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold" 
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Database</label>
                  <div className="relative">
                    <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      value={dbConfig.database}
                      onChange={e => setDbConfig({...dbConfig, database: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold" 
                      placeholder="nome_database"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase ml-1 tracking-widest">Tabella Principale</label>
                  <div className="relative">
                    <Table className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input 
                      type="text" 
                      value={dbConfig.table}
                      onChange={e => setDbConfig({...dbConfig, table: e.target.value})}
                      className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold" 
                      placeholder="rounds_logs"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col md:flex-row gap-3">
                <button 
                  onClick={handleSaveConfig}
                  className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    isSaved ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isSaved ? <ShieldCheck size={20} /> : <Save size={20} />}
                  {isSaved ? 'Impostazioni Salvate' : 'Salva Configurazione'}
                </button>
                <button 
                  onClick={handleSyncInventory}
                  disabled={isSyncing}
                  className="flex-1 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-600 font-bold flex items-center justify-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                  Sincronizza Asset su Cloud
                </button>
              </div>
              <p className="mt-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Sincronizzazione automatica attiva ogni 5 minuti
              </p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black uppercase text-slate-400 mb-6 tracking-widest">Sistema & Notifiche</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                      <BrainCircuit size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Auto-Diagnostica AI</p>
                      <p className="text-xs text-slate-500">Analisi predittiva automatica durante il salvataggio.</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-blue-600 rounded-full relative shadow-inner"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                      <Bell size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Avvisi in Real-Time</p>
                      <p className="text-xs text-slate-500">Notifiche push per anomalie critiche su mobile.</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-slate-200 rounded-full relative shadow-inner"><div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard devices={devices} />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout}>
      {renderContent()}
    </Layout>
  );
};

export default App;
