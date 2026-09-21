const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'metrics.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.serialize(() => {
      // Create tables for server metrics
      db.run(`CREATE TABLE IF NOT EXISTS server_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        cpu_load REAL,
        ram_used REAL,
        ram_total REAL,
        disk_used REAL,
        disk_total REAL
      )`);

      // Create table for network metrics
      db.run(`CREATE TABLE IF NOT EXISTS network_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        target TEXT,
        status TEXT,
        response_time REAL
      )`);

      // Create table for CI/CD events
      db.run(`CREATE TABLE IF NOT EXISTS cicd_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        repo TEXT,
        branch TEXT,
        commit_hash TEXT,
        message TEXT,
        status TEXT
      )`);
    });
  }
});

const saveServerMetrics = (data) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO server_metrics (cpu_load, ram_used, ram_total, disk_used, disk_total) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [data.cpu_load, data.ram_used, data.ram_total, data.disk_used, data.disk_total], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

const saveNetworkMetrics = (data) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO network_metrics (target, status, response_time) VALUES (?, ?, ?)`;
    db.run(query, [data.target, data.status, data.response_time], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

const getRecentServerMetrics = (limit = 30) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM server_metrics ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.reverse()); // chronological order
    });
  });
};

const getRecentNetworkMetrics = (limit = 30) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM network_metrics ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.reverse());
    });
  });
};

const saveCicdEvent = (data) => {
  return new Promise((resolve, reject) => {
    const query = `INSERT INTO cicd_events (repo, branch, commit_hash, message, status) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [data.repo, data.branch, data.commit_hash, data.message, data.status], function (err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

const getRecentCicdEvents = (limit = 10) => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM cicd_events ORDER BY id DESC LIMIT ?`, [limit], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  saveServerMetrics,
  saveNetworkMetrics,
  getRecentServerMetrics,
  getRecentNetworkMetrics,
  saveCicdEvent,
  getRecentCicdEvents
};
