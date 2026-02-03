import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { AlertCircle, CheckCircle2, Zap, Clock } from 'lucide-react';
import { Device } from '../types';

interface DashboardProps {
  devices: Device[];
}

const efficiencyData = [
  { time: '08:00', value: 88 },
  { time: '10:00', value: 92 },
  { time: '12:00', value: 85 },
  { time: '14:00', value: 89 },
  { time: '16:00', value: 91 },
];

const Dashboard: React.FC<DashboardProps> = ({ devices }) => {
  const healthDistribution = [
    { name: 'Ottimale', count: devices.filter(d => d.status === 'Ottimale').length, fill: '#10b981' },
    { name: 'Attenzione', count: devices.filter(d => d.status === 'Attenzione').length, fill: '#f59e0b' },
    { name: 'Critico', count: devices.filter(d => d.status === 'Critico').length, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Asset Monitorati', value: devices.length.toString(), icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Allarmi Critici', value: healthDistribution[2].count.toString().padStart(2, '0'), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Sistemi in Salute', value: healthDistribution[0].count.toString(), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Tempo al Prossimo Giro', value: '1.5h', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Andamento Efficienza (Ultime 24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={efficiencyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Stato dei Dispositivi</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {healthDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-500">{item.name}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Stato Manutenzioni Correnti</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Dispositivo</th>
              <th className="px-6 py-4">Posizione</th>
              <th className="px-6 py-4">Stato</th>
              <th className="px-6 py-4">Ultimo Controllo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-medium">{device.name}</p>
                  <p className="text-xs text-slate-400">{device.id}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{device.location}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    device.status === 'Ottimale' ? 'bg-green-100 text-green-800' :
                    device.status === 'Attenzione' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {device.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{device.lastChecked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;