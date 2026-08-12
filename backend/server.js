import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const UPLOADS_DIR = path.join(rootDir, 'uploads', 'datasets');
const DATABASE_DIR = path.join(rootDir, 'database');
const METADATA_FILE = path.join(DATABASE_DIR, 'datasets.json');
const USERS_FILE = path.join(DATABASE_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATABASE_DIR, 'sessions.json');

// Ensure directories exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(DATABASE_DIR)) {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
}
if (!fs.existsSync(METADATA_FILE)) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify([], null, 2));
}

// Seed default users if users.json does not exist
if (!fs.existsSync(USERS_FILE)) {
  const seedUsers = [
    {
      id: 'usr_admin_101',
      name: 'Sathya Sai Kumar',
      email: 'admin@corporate.com',
      role: 'Executive Admin',
      avatar: 'SS',
      loginType: 'email',
      totalLogins: 14,
      registeredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_alex_102',
      name: 'Alex Morgan',
      email: 'alex.morgan@corporate.com',
      role: 'Senior Data Lead',
      avatar: 'AM',
      loginType: 'email',
      totalLogins: 28,
      registeredAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_sarah_103',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@corporate.com',
      role: 'Workforce Manager',
      avatar: 'SJ',
      loginType: 'phone',
      totalLogins: 19,
      registeredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_david_104',
      name: 'David Chen',
      email: 'david.dev@github.com',
      role: 'Software Engineer',
      avatar: 'DC',
      loginType: 'github',
      totalLogins: 32,
      registeredAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'usr_elena_105',
      name: 'Elena Rostova',
      email: 'elena.sso@enterprise.org',
      role: 'Enterprise Architect',
      avatar: 'ER',
      loginType: 'sso',
      totalLogins: 11,
      registeredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
  fs.writeFileSync(USERS_FILE, JSON.stringify(seedUsers, null, 2));
}

// Seed default sessions if sessions.json does not exist
if (!fs.existsSync(SESSIONS_FILE)) {
  const now = Date.now();
  const seedSessions = [
    {
      id: 'sess_1001',
      userId: 'usr_alex_102',
      username: 'Alex Morgan',
      userEmail: 'alex.morgan@corporate.com',
      userRole: 'Senior Data Lead',
      avatar: 'AM',
      loginType: 'email',
      loginTime: new Date(now - 120 * 60 * 1000).toISOString(),
      logoutTime: new Date(now - 45 * 60 * 1000).toISOString(),
      status: 'offline',
      lastActiveTime: new Date(now - 45 * 60 * 1000).toISOString(),
      clientTabId: 'tab_seed_1'
    },
    {
      id: 'sess_1002',
      userId: 'usr_david_104',
      username: 'David Chen',
      userEmail: 'david.dev@github.com',
      userRole: 'Software Engineer',
      avatar: 'DC',
      loginType: 'github',
      loginTime: new Date(now - 30 * 60 * 1000).toISOString(),
      logoutTime: null,
      status: 'online',
      lastActiveTime: new Date(now - 1 * 60 * 1000).toISOString(),
      clientTabId: 'tab_seed_2'
    },
    {
      id: 'sess_1003',
      userId: 'usr_sarah_103',
      username: 'Sarah Jenkins',
      userEmail: 'sarah.jenkins@corporate.com',
      userRole: 'Workforce Manager',
      avatar: 'SJ',
      loginType: 'phone',
      loginTime: new Date(now - 15 * 60 * 1000).toISOString(),
      logoutTime: null,
      status: 'online',
      lastActiveTime: new Date(now - 2 * 60 * 1000).toISOString(),
      clientTabId: 'tab_seed_3'
    }
  ];
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(seedSessions, null, 2));
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static route to serve uploaded dataset files if requested directly
app.use('/uploads/datasets', express.static(UPLOADS_DIR));

// Helper to read metadata DB
function getMetadataList() {
  try {
    const raw = fs.readFileSync(METADATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

// Helper to write metadata DB
function saveMetadataList(data) {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Format bytes into human readable string
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Configure multer storage with unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const uniqueFileName = `dataset_${timestamp}_${randomId}_${baseName}${ext}`;
    cb(null, uniqueFileName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB file size limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.csv', '.xlsx', '.xls', '.json', '.tsv', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type (${ext}). Only CSV, Excel (.xlsx, .xls), and JSON are allowed.`));
    }
  }
});

// Analyze dataset file contents to calculate rows, cols, health score, missing cells, data types
function analyzeFileContent(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  let rows = [];
  let headers = [];

  if (ext === '.csv' || ext === '.tsv' || ext === '.txt') {
    const fileText = fs.readFileSync(filePath, 'utf-8');
    const parsed = Papa.parse(fileText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: true
    });
    rows = parsed.data || [];
    headers = parsed.meta.fields || (rows.length > 0 ? Object.keys(rows[0]) : []);
  } else if (ext === '.xlsx' || ext === '.xls') {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    if (rows.length > 0) {
      headers = Object.keys(rows[0]);
    }
  } else if (ext === '.json') {
    const rawText = fs.readFileSync(filePath, 'utf-8');
    const parsedObj = JSON.parse(rawText);
    rows = Array.isArray(parsedObj) ? parsedObj : (parsedObj.data && Array.isArray(parsedObj.data) ? parsedObj.data : [parsedObj]);
    if (rows.length > 0) {
      headers = Object.keys(rows[0]);
    }
  }

  const rowCount = rows.length;
  const columnCount = headers.length;
  let missingCells = 0;
  const totalCells = rowCount * columnCount;

  // Type inference & null count per column
  const columnsAnalysis = headers.map(header => {
    let nullCount = 0;
    let numericCount = 0;
    let dateCount = 0;

    rows.forEach(row => {
      const val = row[header];
      if (val === null || val === undefined || val === '' || String(val).trim() === '') {
        nullCount++;
        missingCells++;
      } else {
        if (typeof val === 'number' || (!isNaN(val) && !isNaN(parseFloat(val)))) {
          numericCount++;
        }
        if (typeof val === 'string' && !isNaN(Date.parse(val)) && val.length > 5) {
          dateCount++;
        }
      }
    });

    const validCount = rowCount - nullCount;
    let inferredType = 'categorical';
    if (validCount > 0) {
      if (numericCount / validCount > 0.7) inferredType = 'numeric';
      else if (dateCount / validCount > 0.7) inferredType = 'datetime';
    }

    return {
      name: header,
      type: inferredType,
      missingCount: nullCount,
      nullRatio: rowCount > 0 ? (nullCount / rowCount) : 0
    };
  });

  // Duplicate rows detection
  const rowStrings = new Set();
  let duplicateCount = 0;
  rows.forEach(r => {
    const str = JSON.stringify(r);
    if (rowStrings.has(str)) {
      duplicateCount++;
    } else {
      rowStrings.add(str);
    }
  });

  // Health Score Calculation (100% max)
  let completenessScore = totalCells > 0 ? Math.max(0, Math.round(((totalCells - missingCells) / totalCells) * 100)) : 100;
  let uniquenessScore = rowCount > 0 ? Math.max(0, Math.round(((rowCount - duplicateCount) / rowCount) * 100)) : 100;
  let healthScore = Math.round((completenessScore * 0.7) + (uniquenessScore * 0.3));

  return {
    rows,
    headers,
    rowCount,
    columnCount,
    columns: columnsAnalysis,
    missingCells,
    duplicateCount,
    completenessScore,
    healthScore
  };
}

// REST API Endpoints

// 1. GET /api/datasets - List all dataset metadata
app.get('/api/datasets', (req, res) => {
  try {
    const datasets = getMetadataList();
    res.json({ success: true, count: datasets.length, datasets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/upload - Upload dataset file and save metadata
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    try {
      const filePath = req.file.path;
      const originalName = req.file.originalname;
      const savedName = req.file.filename;
      const fileSizeBytes = req.file.size;
      const ext = path.extname(originalName).toLowerCase().replace('.', '');
      let normalizedFileType = ext;
      if (ext === 'xlsx' || ext === 'xls') normalizedFileType = 'excel';

      // Perform analysis
      const analysis = analyzeFileContent(filePath, originalName);

      const now = new Date();
      const datasetId = `ds_${now.getTime()}_${Math.random().toString(36).substring(2, 7)}`;

      const newMetadata = {
        id: datasetId,
        originalName,
        savedName,
        filePath: path.relative(rootDir, filePath).replace(/\\/g, '/'),
        uploadDate: now.toISOString(),
        uploadDateFormatted: now.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }),
        fileSize: formatBytes(fileSizeBytes),
        fileSizeBytes,
        fileType: normalizedFileType,
        rowCount: analysis.rowCount,
        columnCount: analysis.columnCount,
        columns: analysis.columns,
        healthScore: analysis.healthScore,
        missingCells: analysis.missingCells,
        duplicateCount: analysis.duplicateCount,
        completenessScore: analysis.completenessScore,
        status: 'Active'
      };

      const datasets = getMetadataList();
      datasets.unshift(newMetadata); // newest first
      saveMetadataList(datasets);

      res.status(201).json({
        success: true,
        message: 'Dataset uploaded and saved successfully to uploads/datasets/',
        dataset: newMetadata,
        data: analysis.rows,
        headers: analysis.headers
      });
    } catch (parseErr) {
      // If parsing fails, clean up file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, error: `Dataset analysis failed: ${parseErr.message}` });
    }
  });
});

// 3. GET /api/datasets/:id - Retrieve dataset metadata and parsed rows
app.get('/api/datasets/:id', (req, res) => {
  try {
    const datasets = getMetadataList();
    const ds = datasets.find(d => d.id === req.params.id);
    if (!ds) {
      return res.status(404).json({ success: false, error: 'Dataset not found.' });
    }

    const fullFilePath = path.join(rootDir, ds.filePath);
    if (!fs.existsSync(fullFilePath)) {
      return res.status(404).json({ success: false, error: 'Physical file not found in uploads/datasets/.' });
    }

    const analysis = analyzeFileContent(fullFilePath, ds.originalName);

    res.json({
      success: true,
      dataset: ds,
      data: analysis.rows,
      headers: analysis.headers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. GET /api/datasets/:id/download - Download original physical file
app.get('/api/datasets/:id/download', (req, res) => {
  try {
    const datasets = getMetadataList();
    const ds = datasets.find(d => d.id === req.params.id);
    if (!ds) {
      return res.status(404).json({ success: false, error: 'Dataset metadata not found.' });
    }

    const fullFilePath = path.join(rootDir, ds.filePath);
    if (!fs.existsSync(fullFilePath)) {
      return res.status(404).json({ success: false, error: 'Physical file does not exist on disk.' });
    }

    res.download(fullFilePath, ds.originalName, (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Failed to download file.' });
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. DELETE /api/datasets/:id - Delete physical file and metadata
app.delete('/api/datasets/:id', (req, res) => {
  try {
    const datasets = getMetadataList();
    const index = datasets.findIndex(d => d.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Dataset not found.' });
    }

    const ds = datasets[index];
    const fullFilePath = path.join(rootDir, ds.filePath);

    // Delete physical file if exists
    if (fs.existsSync(fullFilePath)) {
      fs.unlinkSync(fullFilePath);
    }

    // Remove from metadata database
    datasets.splice(index, 1);
    saveMetadataList(datasets);

    res.json({
      success: true,
      message: `Dataset '${ds.originalName}' deleted from disk and history.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/seed - Seed sample datasets into uploads/datasets if empty
app.post('/api/seed', (req, res) => {
  try {
    const existing = getMetadataList();
    if (existing.length > 0) {
      return res.json({ success: true, message: 'Datasets already exist in storage.', datasets: existing });
    }

    // Sample workforce dataset CSV
    const sampleCsvContent = `EmployeeID,FullName,Department,Role,Salary,WorkMode,PerformanceRating,JoinDate,Status
EMP-101,Aarav Sharma,Engineering,Senior FullStack Engineer,98500,Hybrid,4.8,2022-03-15,Active
EMP-102,Priya Patel,Data Analytics,Lead Data Scientist,112000,Remote,4.9,2021-08-10,Active
EMP-103,Rohan Verma,Product Management,Senior Product Manager,105000,On-Site,4.5,2020-01-20,Active
EMP-104,Ananya Roy,Human Resources,HR Business Partner,68000,Hybrid,4.2,2023-05-12,Active
EMP-105,Vikram Malhotra,Engineering,DevOps Architect,118000,Remote,4.9,2019-11-04,Active
EMP-106,Sneha Gupta,Finance,Financial Analyst,74000,On-Site,4.1,2022-09-01,Active
EMP-107,Karan Singh,Marketing,Growth Marketing Lead,89000,Hybrid,4.6,2021-04-18,Active
EMP-108,Divya Nair,Sales,Enterprise Account Exec,95000,Remote,4.7,2022-11-30,Active
EMP-109,Aditya Joshi,Cybersecurity,Security Consultant,102000,Hybrid,4.8,2020-06-25,Active
EMP-110,Meera Reddy,Engineering,QA Automation Lead,82000,On-Site,4.3,2023-02-14,Active`;

    const sampleFileName = 'workforce_intelligence_2026.csv';
    const savedName = `dataset_seed_1001_${sampleFileName}`;
    const filePath = path.join(UPLOADS_DIR, savedName);

    fs.writeFileSync(filePath, sampleCsvContent, 'utf-8');

    const analysis = analyzeFileContent(filePath, sampleFileName);
    const fileStats = fs.statSync(filePath);

    const now = new Date();
    const seededMetadata = {
      id: `ds_seed_1001`,
      originalName: sampleFileName,
      savedName,
      filePath: path.relative(rootDir, filePath).replace(/\\/g, '/'),
      uploadDate: now.toISOString(),
      uploadDateFormatted: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      fileSize: formatBytes(fileStats.size),
      fileSizeBytes: fileStats.size,
      fileType: 'csv',
      rowCount: analysis.rowCount,
      columnCount: analysis.columnCount,
      columns: analysis.columns,
      healthScore: analysis.healthScore,
      missingCells: analysis.missingCells,
      duplicateCount: analysis.duplicateCount,
      completenessScore: analysis.completenessScore,
      status: 'Active'
    };

    saveMetadataList([seededMetadata]);

    res.status(201).json({
      success: true,
      message: 'Seeded initial sample dataset to uploads/datasets/',
      datasets: [seededMetadata]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ========================================================
// LIVE WEBSITE LOGIN & USER ACTIVITY COUNTER SYSTEM
// ========================================================

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes configurable timeout

function getUsersList() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

function saveUsersList(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function getSessionsList() {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return [];
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

function saveSessionsList(data) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// Global array of SSE connected response streams
let sseClients = [];

function broadcastLiveStats() {
  const stats = calculateLiveStats();
  const payload = `data: ${JSON.stringify(stats)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch (err) {
      // client disconnected
    }
  });
}

function calculateLiveStats() {
  const users = getUsersList();
  const sessions = getSessionsList();
  const now = Date.now();

  // Determine online sessions (active heartbeat within INACTIVITY_TIMEOUT_MS)
  const onlineUserIds = new Set();
  const activeUserIds = new Set();
  
  let todayLoginsCount = 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  sessions.forEach(sess => {
    const lastActive = new Date(sess.lastActiveTime || sess.loginTime).getTime();
    const loginDate = new Date(sess.loginTime);
    const isWithinTimeout = (now - lastActive) <= INACTIVITY_TIMEOUT_MS;

    if (sess.status === 'online' && isWithinTimeout) {
      onlineUserIds.add(sess.userId);
      activeUserIds.add(sess.userId);
    } else if (now - lastActive <= 24 * 60 * 60 * 1000) {
      activeUserIds.add(sess.userId);
    }

    if (loginDate >= todayStart) {
      todayLoginsCount++;
    }
  });

  const totalRegisteredUsers = users.length;
  const onlineNowCount = onlineUserIds.size;
  const totalLoginsCount = sessions.length;
  const activeUsersCount = activeUserIds.size || onlineNowCount;
  const offlineUsersCount = Math.max(0, totalRegisteredUsers - onlineNowCount);

  // Formatted Recent Login Activity Logs (Sorted by Login Time Descending)
  const recentActivityLogs = [...sessions]
    .sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime))
    .slice(0, 50)
    .map(sess => {
      const lastActive = new Date(sess.lastActiveTime || sess.loginTime).getTime();
      const isOnline = sess.status === 'online' && (now - lastActive) <= INACTIVITY_TIMEOUT_MS;
      return {
        id: sess.id,
        userId: sess.userId,
        username: sess.username || sess.userEmail || 'Corporate User',
        userEmail: sess.userEmail || 'N/A',
        userRole: sess.userRole || 'Analyst',
        avatar: sess.avatar || 'US',
        loginType: sess.loginType || 'email',
        loginTime: sess.loginTime,
        logoutTime: isOnline ? null : sess.logoutTime,
        status: isOnline ? 'Online' : 'Offline',
        lastActiveTime: sess.lastActiveTime
      };
    });

  // Daily, Weekly, and Monthly Login Activity Charts Data
  const dailyLabels = [];
  const dailyCounts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    dailyLabels.push(dateStr);

    const dayStart = new Date(d.setHours(0,0,0,0)).getTime();
    const dayEnd = new Date(d.setHours(23,59,59,999)).getTime();
    const count = sessions.filter(s => {
      const t = new Date(s.loginTime).getTime();
      return t >= dayStart && t <= dayEnd;
    }).length;
    dailyCounts.push(count);
  }

  const weeklyLabels = ['3 Weeks Ago', '2 Weeks Ago', 'Last Week', 'This Week'];
  const weeklyCounts = [0, 0, 0, 0];
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  sessions.forEach(s => {
    const diff = now - new Date(s.loginTime).getTime();
    if (diff < oneWeekMs) weeklyCounts[3]++;
    else if (diff < 2 * oneWeekMs) weeklyCounts[2]++;
    else if (diff < 3 * oneWeekMs) weeklyCounts[1]++;
    else if (diff < 4 * oneWeekMs) weeklyCounts[0]++;
  });

  const monthlyLabels = [];
  const monthlyCounts = [];
  for (let i = 5; i >= 0; i--) {
    const mDate = new Date();
    mDate.setMonth(mDate.getMonth() - i);
    const mStr = mDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    monthlyLabels.push(mStr);

    const mYear = mDate.getFullYear();
    const mMonth = mDate.getMonth();
    const count = sessions.filter(s => {
      const d = new Date(s.loginTime);
      return d.getFullYear() === mYear && d.getMonth() === mMonth;
    }).length;
    monthlyCounts.push(count);
  }

  return {
    totalUsers: totalRegisteredUsers,
    onlineNow: onlineNowCount,
    liveUsers: onlineNowCount, // Main LIVE USERS metric
    totalLogins: totalLoginsCount,
    todaysLogins: todayLoginsCount,
    activeUsers: activeUsersCount,
    offlineUsers: offlineUsersCount,
    inactivityTimeoutMinutes: Math.round(INACTIVITY_TIMEOUT_MS / 60000),
    recentLogs: recentActivityLogs,
    charts: {
      daily: { labels: dailyLabels, data: dailyCounts },
      weekly: { labels: weeklyLabels, data: weeklyCounts },
      monthly: { labels: monthlyLabels, data: monthlyCounts }
    }
  };
}

// Background cleaner: runs every 10 seconds to auto-logout inactive sessions (> 5 mins)
setInterval(() => {
  const sessions = getSessionsList();
  const now = Date.now();
  let updated = false;

  sessions.forEach(sess => {
    if (sess.status === 'online') {
      const lastActive = new Date(sess.lastActiveTime || sess.loginTime).getTime();
      if (now - lastActive > INACTIVITY_TIMEOUT_MS) {
        sess.status = 'offline';
        sess.logoutTime = sess.lastActiveTime || new Date().toISOString();
        updated = true;
      }
    }
  });

  if (updated) {
    saveSessionsList(sessions);
    broadcastLiveStats();
  }
}, 10000);

// API Endpoints for Live Users & Session Management

// GET /api/live-users/stats - Get latest live user counts and activity logs
app.get('/api/live-users/stats', (req, res) => {
  res.json({ success: true, stats: calculateLiveStats() });
});

// GET /api/live-users/stream - SSE real-time stream endpoint
app.get('/api/live-users/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  const clientId = Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const clientObj = { id: clientId, res };
  sseClients.push(clientObj);

  // Send initial data immediately
  res.write(`data: ${JSON.stringify(calculateLiveStats())}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// POST /api/auth/login - Record successful login & create session
app.post('/api/auth/login', (req, res) => {
  try {
    const { userId, name, email, phone, role, avatar, loginType, clientTabId } = req.body;
    
    if (!name && !email && !phone) {
      return res.status(400).json({ success: false, error: 'User identifier is required.' });
    }

    const cleanUserId = userId || `usr_${Date.now()}`;
    const users = getUsersList();
    let existingUser = users.find(u => u.id === cleanUserId || (email && u.email === email) || (phone && u.phone === phone));

    if (!existingUser) {
      existingUser = {
        id: cleanUserId,
        name: name || 'Corporate User',
        email: email || `${cleanUserId}@corporate.com`,
        phone: phone || null,
        role: role || 'Authorized Analyst',
        avatar: avatar || 'US',
        loginType: loginType || 'email',
        totalLogins: 1,
        registeredAt: new Date().toISOString()
      };
      users.push(existingUser);
    } else {
      existingUser.totalLogins = (existingUser.totalLogins || 0) + 1;
      if (name) existingUser.name = name;
      if (role) existingUser.role = role;
      if (avatar) existingUser.avatar = avatar;
    }
    saveUsersList(users);

    const sessions = getSessionsList();
    const newSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: existingUser.id,
      username: existingUser.name,
      userEmail: existingUser.email,
      userRole: existingUser.role,
      avatar: existingUser.avatar,
      loginType: loginType || 'email',
      loginTime: new Date().toISOString(),
      logoutTime: null,
      status: 'online',
      lastActiveTime: new Date().toISOString(),
      clientTabId: clientTabId || `tab_${Date.now()}`
    };
    sessions.push(newSession);
    saveSessionsList(sessions);

    broadcastLiveStats();

    res.json({
      success: true,
      message: 'Login session recorded successfully.',
      session: newSession,
      user: existingUser,
      stats: calculateLiveStats()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/logout - Record logout & update active count
app.post('/api/auth/logout', (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    const sessions = getSessionsList();
    let updated = false;

    sessions.forEach(sess => {
      if ((sessionId && sess.id === sessionId) || (!sessionId && userId && sess.userId === userId && sess.status === 'online')) {
        sess.status = 'offline';
        sess.logoutTime = new Date().toISOString();
        updated = true;
      }
    });

    if (updated) {
      saveSessionsList(sessions);
      broadcastLiveStats();
    }

    res.json({ success: true, message: 'Logged out successfully.', stats: calculateLiveStats() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/heartbeat - Keep active session alive
app.post('/api/auth/heartbeat', (req, res) => {
  try {
    const { sessionId, userId, clientTabId } = req.body;
    if (!sessionId && !userId) {
      return res.status(400).json({ success: false, error: 'Session ID or User ID required.' });
    }

    const sessions = getSessionsList();
    const nowIso = new Date().toISOString();
    let sess = sessions.find(s => s.id === sessionId);

    if (!sess && userId) {
      // Find latest session for this user
      sess = [...sessions].reverse().find(s => s.userId === userId);
    }

    if (sess) {
      sess.lastActiveTime = nowIso;
      if (sess.status === 'offline') {
        sess.status = 'online';
        sess.logoutTime = null;
      }
      saveSessionsList(sessions);
      broadcastLiveStats();
    }

    res.json({ success: true, lastActiveTime: nowIso });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Dataset Storage Backend API running on port ${PORT}`);
  console.log(`📁 Uploads Directory: ${UPLOADS_DIR}`);
  console.log(`💾 Database File:    ${METADATA_FILE}`);
  console.log(`====================================================`);
});

