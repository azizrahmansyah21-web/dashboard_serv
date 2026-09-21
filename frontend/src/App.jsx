import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Cpu, HardDrive, MemoryStick, Server, Globe, Rocket, TerminalSquare, Sun, Moon } from 'lucide-react';

function App() {
  const [current, setCurrent] = useState({ server: null, network: [], processes: { top: [], tracked: [] } });
  const [history, setHistory] = useState({ server: [], network: [] });
  const [cicd, setCicd] = useState([]);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check if user has a preference saved, or default to system preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return true; // Default dark
  });

  useEffect(() => {
    // Toggle dark class on HTML element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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
      // Convert UTC to Local time
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
  const colors = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777']; // Tailwind 600 colors for solid contrast

  // Chart theme values
  const gridColor = isDarkMode ? '#334155' : '#e2e8f0';
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipText = isDarkMode ? '#f8fafc' : '#0f172a';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard<span className="font-medium text-slate-500 dark:text-slate-400">Serv</span>
          </h1>
        </div>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        
        {/* Core Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400">
              <Cpu className="w-5 h-5" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">CPU Load</h2>
            </div>
            <div className="text-4xl font-bold text-slate-900 dark:text-white mt-auto">
              {server ? server.cpu_load.toFixed(1) : 0}%
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400">
              <MemoryStick className="w-5 h-5" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">RAM Usage</h2>
            </div>
            <div className="text-4xl font-bold text-slate-900 dark:text-white mt-auto mb-1">
              {server ? formatBytes(server.ram_used) : '0 B'}
            </div>
            <div className="text-xs text-slate-500">
              Total: {server ? formatBytes(server.ram_total) : '0 B'}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2 text-slate-600 dark:text-slate-400">
              <HardDrive className="w-5 h-5" />
              <h2 className="text-sm font-semibold uppercase tracking-wider">Disk Usage</h2>
            </div>
            <div className="text-4xl font-bold text-slate-900 dark:text-white mt-auto mb-1">
              {server ? formatBytes(server.disk_used) : '0 B'}
            </div>
            <div className="text-xs text-slate-500">
              Total: {server ? formatBytes(server.disk_total) : '0 B'}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
             <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
               <Server className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Server History
             </h2>
             <div className="h-64 mt-auto">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.server}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="id" stroke={axisColor} tick={false} axisLine={false} />
                    <YAxis stroke={axisColor} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '6px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      itemStyle={{ color: tooltipText }}
                    />
                    <Line type="monotone" dataKey="cpu_load" stroke="#059669" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    <Line type="monotone" dataKey="ram_used" stroke="#7c3aed" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Network Status & Ping
            </h2>
            
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2 px-1 font-medium">Target</th>
                    <th className="py-2 px-1 font-medium">Status</th>
                    <th className="py-2 px-1 text-right font-medium">Response</th>
                  </tr>
                </thead>
                <tbody>
                  {network.map((net, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                      <td className="py-3 px-1 font-mono text-xs text-slate-700 dark:text-slate-300">{net.target}</td>
                      <td className="py-3 px-1">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${net.status === 'UP' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'}`}>
                          {net.status}
                        </span>
                      </td>
                      <td className="py-3 px-1 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {net.response_time} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="h-48 mt-auto">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={networkChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="timestamp" stroke={axisColor} tick={false} axisLine={false} />
                    <YAxis stroke={axisColor} axisLine={false} tickLine={false} width={40} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '6px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: tooltipText }}
                    />
                    {network.map((net, i) => (
                       <Line key={net.target} type="monotone" dataKey={net.target} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    ))}
                  </LineChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Data Tables Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          
          <div className="bg-white dark:bg-slate-900 p-0 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <TerminalSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Active Processes
              </h2>
            </div>
            
            <div className="p-0">
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Top CPU Processes</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
                      <th className="py-2 px-6 font-medium">PID</th>
                      <th className="py-2 px-6 font-medium">Name</th>
                      <th className="py-2 px-6 text-right font-medium">CPU</th>
                      <th className="py-2 px-6 text-right font-medium">RAM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {processes.top.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                        <td className="py-3 px-6 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.pid}</td>
                        <td className="py-3 px-6 text-slate-800 dark:text-slate-200">{p.name}</td>
                        <td className="py-3 px-6 text-right font-mono text-emerald-600 dark:text-emerald-400">{p.cpu.toFixed(1)}%</td>
                        <td className="py-3 px-6 text-right font-mono text-purple-600 dark:text-purple-400">
                          {p.memRss ? (p.memRss / 1024).toFixed(1) + ' MB' : (p.mem ? p.mem.toFixed(1) + '%' : 'N/A')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-800 mt-4">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tracked Services</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
                      <th className="py-2 px-6 font-medium">PID</th>
                      <th className="py-2 px-6 font-medium">Name</th>
                      <th className="py-2 px-6 text-right font-medium">CPU</th>
                      <th className="py-2 px-6 text-right font-medium">RAM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {processes.tracked.length === 0 ? (
                      <tr><td colSpan="4" className="py-6 text-center text-slate-500 dark:text-slate-400">No tracked processes found</td></tr>
                    ) : processes.tracked.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                        <td className="py-3 px-6 text-slate-500 dark:text-slate-400 font-mono text-xs">{p.pid}</td>
                        <td className="py-3 px-6 text-slate-800 dark:text-slate-200">{p.name}</td>
                        <td className="py-3 px-6 text-right font-mono text-emerald-600 dark:text-emerald-400">{p.cpu.toFixed(1)}%</td>
                        <td className="py-3 px-6 text-right font-mono text-purple-600 dark:text-purple-400">
                          {p.memRss ? (p.memRss / 1024).toFixed(1) + ' MB' : (p.mem ? p.mem.toFixed(1) + '%' : 'N/A')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-0 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                <Rocket className="w-5 h-5 text-pink-600 dark:text-pink-400" /> CI/CD Deployments
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-3 px-6 font-medium">Repository / Branch</th>
                    <th className="py-3 px-6 font-medium">Message</th>
                    <th className="py-3 px-6 font-medium">Status</th>
                    <th className="py-3 px-6 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {cicd.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500 dark:text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                          <Rocket className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                          <p>No deployments recorded yet.</p>
                          <p className="text-xs mt-1">Configure your post-receive hook.</p>
                        </div>
                      </td>
                    </tr>
                  ) : cicd.map((event, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/25 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{event.repo}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{event.branch}</div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                        {event.message || <span className="font-mono text-xs">{event.commit_hash}</span>}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                          event.status?.toLowerCase() === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                          : event.status?.toLowerCase() === 'failed' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                          : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                        }`}>
                          {event.status || 'UNKNOWN'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                        {new Date(event.timestamp.replace(' ', 'T') + 'Z').toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

export default App;
