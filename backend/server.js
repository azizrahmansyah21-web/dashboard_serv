const express = require('express');
const cors = require('cors');
const path = require('path');
const { startCollector, getCurrentMetrics } = require('./collector');
const { getRecentServerMetrics, getRecentNetworkMetrics, saveCicdEvent, getRecentCicdEvents } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Start collecting metrics every 5 seconds
startCollector(5000);

// API Routes
app.get('/api/metrics/current', (req, res) => {
  res.json(getCurrentMetrics());
});

app.get('/api/metrics/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 60; // default 60 data points
    const serverHistory = await getRecentServerMetrics(limit);
    const networkHistory = await getRecentNetworkMetrics(limit);
    
    res.json({
      server: serverHistory,
      network: networkHistory
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cicd/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await getRecentCicdEvents(limit);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/webhook/cicd', async (req, res) => {
  try {
    const { repo, branch, commit_hash, message, status } = req.body;
    await saveCicdEvent({ repo, branch, commit_hash, message, status });
    res.json({ success: true, message: 'CI/CD event recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
