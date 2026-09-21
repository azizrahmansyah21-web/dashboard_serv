const si = require('systeminformation');
const ping = require('ping');
const axios = require('axios');
const { saveServerMetrics, saveNetworkMetrics } = require('./db');

const targets = [
  'https://agass.agis.link',
  'https://agis.link',
  '172.16.3.4',
  '172.16.3.16'
];

// Track specific process names (lowercase)
const trackedProcessNames = ['node', 'pm2', 'nginx', 'python', 'docker', 'mysql', 'postgres'];

let currentServerMetrics = {};
let currentNetworkMetrics = [];
let currentProcesses = { top: [], tracked: [] };

const collectServerMetrics = async () => {
  try {
    const cpuLoad = await si.currentLoad();
    const mem = await si.mem();
    const fsSize = await si.fsSize();
    
    // Find the main drive, assuming the first one or '/'
    const mainFs = fsSize.find(fs => fs.mount === '/' || fs.mount === 'C:') || fsSize[0];

    const metrics = {
      cpu_load: cpuLoad.currentLoad,
      ram_used: mem.active,
      ram_total: mem.total,
      disk_used: mainFs ? mainFs.used : 0,
      disk_total: mainFs ? mainFs.size : 0,
    };
    
    currentServerMetrics = metrics;
    await saveServerMetrics(metrics);
  } catch (err) {
    console.error('Error collecting server metrics:', err.message);
  }
};

const checkTarget = async (target) => {
  let status = 'DOWN';
  let response_time = 0;

  try {
    if (target.startsWith('http://') || target.startsWith('https://')) {
      const start = Date.now();
      const res = await axios.get(target, { timeout: 5000 });
      if (res.status >= 200 && res.status < 400) {
        status = 'UP';
      }
      response_time = Date.now() - start;
    } else {
      const res = await ping.promise.probe(target, { timeout: 5 });
      if (res.alive) {
        status = 'UP';
        response_time = res.time;
      }
    }
  } catch (err) {
    status = 'DOWN';
  }

  return { target, status, response_time };
};

const collectNetworkMetrics = async () => {
  try {
    const results = await Promise.all(targets.map(t => checkTarget(t)));
    currentNetworkMetrics = results;
    
    for (const result of results) {
      await saveNetworkMetrics(result);
    }
  } catch (err) {
    console.error('Error collecting network metrics:', err.message);
  }
};

const collectProcesses = async () => {
  try {
    const procData = await si.processes();
    const list = procData.list || [];
    
    // Get top 5 by CPU
    const top = [...list].sort((a, b) => b.cpu - a.cpu).slice(0, 5).map(p => ({
      name: p.name,
      pid: p.pid,
      cpu: p.cpu,
      mem: p.mem
    }));

    // Find tracked processes
    const tracked = list
      .filter(p => trackedProcessNames.some(name => p.name.toLowerCase().includes(name)))
      .map(p => ({
        name: p.name,
        pid: p.pid,
        cpu: p.cpu,
        mem: p.mem
      }));

    currentProcesses = { top, tracked };
  } catch (err) {
    console.error('Error collecting processes:', err.message);
  }
};

const startCollector = (intervalMs = 5000) => {
  // Collect immediately
  collectServerMetrics();
  collectNetworkMetrics();
  collectProcesses();

  // Then collect periodically
  setInterval(() => {
    collectServerMetrics();
    collectNetworkMetrics();
    collectProcesses();
  }, intervalMs);
};

const getCurrentMetrics = () => {
  return {
    server: currentServerMetrics,
    network: currentNetworkMetrics,
    processes: currentProcesses
  };
};

module.exports = {
  startCollector,
  getCurrentMetrics
};
