
import React, { useState } from 'react';
import { Activity, Lock, User, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onLogin: (success: boolean) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulated authentication logic
    // In a real app, this would call a secure backend
    setTimeout(() => {
      if (username === 'admin' && password === 'admin123') {
        onLogin(true);
      } else if (username === 'operatore' && password === '1234') {
        onLogin(true);
      } else {
        setError('Credenziali non valide. Riprova.');
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-400 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-800/10">
          <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
                <div className="grid grid-cols-6 gap-2 rotate-12 scale-150">
                    {Array.from({length: 36}).map((_, i) => (
                        <div key={i} className="aspect-square border border-white/20 rounded-md"></div>
                    ))}
                </div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-500/20">
                <Activity size={32} />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tighter">OptiCheck</h1>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Management Industriale</p>
            </div>
          </div>

          <div className="p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase ml-1 tracking-widest">Utente Personale</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    required
                    type="text" 
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold" 
                    placeholder="Username"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-400 uppercase ml-1 tracking-widest">Chiave di Accesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:bg-white focus:border-blue-500 outline-none transition-all font-semibold" 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    Accedi al Sistema
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Supporto Tecnico v2.5.0 • Cloud Sync Attivo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
