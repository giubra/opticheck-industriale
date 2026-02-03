
import React from 'react';
import { LayoutDashboard, ClipboardList, Settings, Activity, User, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const tabLabels: Record<string, string> = {
    dashboard: 'Bacheca',
    rounds: 'Giri',
    inventory: 'Asset',
    settings: 'Impostazioni'
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Bacheca' },
    { id: 'rounds', icon: ClipboardList, label: 'Giri' },
    { id: 'inventory', icon: Activity, label: 'Asset' },
    { id: 'settings', icon: Settings, label: 'Impostazioni' },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden flex-col md:flex-row">
      {/* Sidebar - Desktop Only */}
      <aside className="w-64 bg-slate-900 text-white flex-col hidden md:flex">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <Activity className="text-blue-400" size={32} />
            <span className="text-xl font-bold tracking-tight">OptiCheck</span>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Alex J.</p>
                <p className="text-xs text-slate-400 uppercase">Operatore</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <LogOut size={16} />
            Esci
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400" onClick={onLogout}>
              <LogOut size={20} />
            </button>
            <h1 className="text-lg font-bold">{tabLabels[activeTab] || activeTab}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Live</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 safe-bottom z-50">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === item.id ? 'text-blue-600' : 'text-slate-400'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'fill-blue-50' : ''} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
