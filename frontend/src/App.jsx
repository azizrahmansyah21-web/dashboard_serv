import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, HardDrive, MemoryStick, Server, Globe, Rocket, TerminalSquare } from 'lucide-react';

function App() {
  const [current, setCurrent] = useState({ server: null, network: [], processes: { top: [], tracked: [] } });
  const [history, setHistory] = useState({ server: [], network: [] });
  const [cicd, setCicd] = useState([]);

  const fetchData = async () => {
    try {
      const baseUrl = import.meta.env.BASE_URL;
      const curRes = await fetch(`${baseUrl}api/metrics/current`);
      const curData = await curRes.json();
      setCurrent(curData);

      const histRes = await fetch(`${baseUrl}api/metrics/history`);
      const histData = await histRes.json();
      setHistory(histData);

      const cicdRes = await fetch(`${baseUrl}api/cicd/history`);
      const cicdData = await cicdRes.json();
      setCicd(cicdData);
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

  const formatNetworkHistory = (netHistory) => {
    const grouped = {};
    netHistory.forEach(item => {
      // Ubah UTC SQLite (YYYY-MM-DD HH:MM:SS) ke format waktu lokal (WIB)
      const localTime = new Date(item.timestamp.replace(' ', 'T') + 'Z').toLocaleTimeString();
      
      if (!grouped[localTime]) {
        grouped[localTime] = { timestamp: localTime };
      }
      grouped[localTime][item.target] = item.response_time;
    });
    return Object.values(grouped);
  };

  const { server, network, processes } = current;
  const networkChartData = formatNetworkHistory(history.network);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8 flex items-center gap-3">
        <Activity className="w-8 h-8 text-blue-400" />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Monitoring Dashboard
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="text-emerald-400" />
            <h2 className="text-xl font-semibold">CPU Load</h2>
          </div>
          <div className="text-4xl font-bold">
            {server ? server.cpu_load.toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl">
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

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl">
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
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl">
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

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl flex flex-col">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Globe className="text-blue-400" /> Network Status & Ping History
          </h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-2 px-4">Target</th>
                  <th className="py-2 px-4">Status</th>
                  <th className="py-2 px-4 text-right">Response Time</th>
                </tr>
              </thead>
              <tbody>
                {network.map((net, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-2 px-4 font-mono text-sm">{net.target}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${net.status === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {net.status}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-sm">
                      {net.response_time} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="h-64 mt-auto">
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={networkChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="timestamp" stroke="#94a3b8" tick={false} />
                  <YAxis stroke="#94a3b8" label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  {network.map((net, i) => (
                     <Line key={net.target} type="monotone" dataKey={net.target} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
                  ))}
                </LineChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl flex flex-col">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TerminalSquare className="text-purple-400" /> Top / Tracked Processes
          </h2>
          
          <div className="overflow-x-auto mb-4">
            <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Top CPU Processes</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-2 px-3">PID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 text-right">CPU %</th>
                  <th className="py-2 px-3 text-right">RAM</th>
                </tr>
              </thead>
              <tbody>
                {processes.top.map((p, i) => (
                  <tr key={i} className="border-b border-slate-700/30">
                    <td className="py-2 px-3 text-slate-400">{p.pid}</td>
                    <td className="py-2 px-3">{p.name}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400">{p.cpu.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right font-mono text-purple-400">
                      {p.memRss ? (p.memRss / 1024).toFixed(1) + ' MB' : (p.mem ? p.mem.toFixed(1) + '%' : 'N/A')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto">
            <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">Tracked Services</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-2 px-3">PID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 text-right">CPU %</th>
                  <th className="py-2 px-3 text-right">RAM</th>
                </tr>
              </thead>
              <tbody>
                {processes.tracked.length === 0 ? (
                  <tr><td colSpan="4" className="py-4 text-center text-slate-500">No tracked processes found</td></tr>
                ) : processes.tracked.map((p, i) => (
                  <tr key={i} className="border-b border-slate-700/30">
                    <td className="py-2 px-3 text-slate-400">{p.pid}</td>
                    <td className="py-2 px-3">{p.name}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-400">{p.cpu.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right font-mono text-purple-400">
                      {p.memRss ? (p.memRss / 1024).toFixed(1) + ' MB' : (p.mem ? p.mem.toFixed(1) + '%' : 'N/A')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm shadow-xl">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Rocket className="text-pink-400" /> CI/CD Deployments
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="py-3 px-4">Repository</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {cicd.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500">
                      No deployments recorded yet. Configure your post-receive hook.
                    </td>
                  </tr>
                ) : cicd.map((event, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-3 px-4">
                      <div className="font-semibold">{event.repo}</div>
                      <div className="text-xs text-slate-400">{event.branch}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{event.message || event.commit_hash}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        event.status?.toLowerCase() === 'success' ? 'bg-emerald-500/20 text-emerald-400' 
                        : event.status?.toLowerCase() === 'failed' ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {event.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-slate-400 whitespace-nowrap">
                      {new Date(event.timestamp.replace(' ', 'T') + 'Z').toLocaleString()}
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
