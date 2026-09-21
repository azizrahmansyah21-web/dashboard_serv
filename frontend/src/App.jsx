import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, HardDrive, MemoryStick, Server, Globe } from 'lucide-react';

function App() {
  const [current, setCurrent] = useState({ server: null, network: [] });
  const [history, setHistory] = useState({ server: [], network: [] });

  const fetchData = async () => {
    try {
      const curRes = await fetch('/api/metrics/current');
      const curData = await curRes.json();
      setCurrent(curData);

      const histRes = await fetch('/api/metrics/history');
      const histData = await histRes.json();
      setHistory(histData);
    } catch (err) {
      console.error('Failed to fetch metrics', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const { server, network } = current;

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8 flex items-center gap-3">
        <Activity className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Monitoring Dashboard
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="text-emerald-400" />
            <h2 className="text-xl font-semibold">CPU Load</h2>
          </div>
          <div className="text-4xl font-bold">
            {server ? server.cpu_load.toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <MemoryStick className="text-purple-400" />
            <h2 className="text-xl font-semibold">RAM Usage</h2>
          </div>
          <div className="text-4xl font-bold mb-2">
            {server ? formatBytes(server.ram_used) : '0 B'}
          </div>
          <div className="text-sm text-slate-400">
            Total: {server ? formatBytes(server.ram_total) : '0 B'}
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="text-blue-400" />
            <h2 className="text-xl font-semibold">Disk Usage</h2>
          </div>
          <div className="text-4xl font-bold mb-2">
            {server ? formatBytes(server.disk_used) : '0 B'}
          </div>
          <div className="text-sm text-slate-400">
            Total: {server ? formatBytes(server.disk_total) : '0 B'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
           <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
             <Server className="text-emerald-400" /> Server History
           </h2>
           <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history.server}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="id" stroke="#94a3b8" tick={false} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="cpu_load" stroke="#34d399" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ram_used" stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="text-blue-400" /> Network Status
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Response Time</th>
                </tr>
              </thead>
              <tbody>
                {network.map((net, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-3 px-4 font-mono text-sm">{net.target}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${net.status === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {net.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-sm">
                      {net.response_time} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
