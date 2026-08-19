import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateImplementationPlanPDF() {
  console.log('🚀 Generating Total Implementation Plan PDF...');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 182 mm

  // Color Palette
  const navyDark = [15, 23, 42];        // #0f172a
  const navyLight = [30, 41, 59];       // #1e293b
  const bluePrimary = [2, 132, 199];    // #0284c7
  const blueLight = [224, 242, 254];    // #e0f2fe
  const cyanAccent = [6, 182, 212];     // #06b6d4
  const emeraldGreen = [16, 185, 129];  // #10b981
  const purpleAI = [139, 92, 246];      // #8b5cf6
  const amberWarning = [245, 158, 11];  // #f59e0b
  const slateText = [51, 65, 85];       // #334155
  const mutedText = [100, 116, 139];    // #64748b
  const lightBg = [248, 250, 252];      // #f8fafc
  const cardBorder = [226, 232, 240];   // #e2e8f0
  const white = [255, 255, 255];

  const totalPages = 5;
  const docDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const docId = 'SYS-IMP-2026-V3';

  const drawHeader = (title, subtitle, pageNum) => {
    // Header background banner
    doc.setFillColor(...navyDark);
    doc.rect(0, 0, pageWidth, 24, 'F');

    // Accent line
    doc.setFillColor(...bluePrimary);
    doc.rect(0, 24, pageWidth, 1.8, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title.toUpperCase(), margin, 11);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text(subtitle, margin, 18);

    // Metadata Right
    doc.setFontSize(7);
    doc.text(`DOC ID: ${docId}`, pageWidth - margin, 11, { align: 'right' });
    doc.text(`DATE: ${docDate}`, pageWidth - margin, 18, { align: 'right' });
  };

  const drawFooter = (pageNum) => {
    doc.setDrawColor(...cardBorder);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mutedText);
    doc.text(`Corporate Access Intelligence System • Sathya Sai Kumar • Project Implementation Blueprint`, margin, pageHeight - 7);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  const drawSectionHeader = (y, number, title, tag = '') => {
    doc.setFillColor(...blueLight);
    doc.roundedRect(margin, y, contentWidth, 7.5, 1.5, 1.5, 'F');

    doc.setFillColor(...bluePrimary);
    doc.rect(margin, y, 3, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...navyDark);
    doc.text(`${number}. ${title.toUpperCase()}`, margin + 6, y + 5.2);

    if (tag) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...bluePrimary);
      doc.text(tag.toUpperCase(), pageWidth - margin - 4, y + 5.2, { align: 'right' });
    }
  };

  const drawCard = (x, y, w, h, title, items = [], accentColor = bluePrimary) => {
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...cardBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    // Accent line on left
    doc.setFillColor(...accentColor);
    doc.roundedRect(x, y, 2.5, h, 1, 1, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...navyDark);
    doc.text(title, x + 5, y + 5.5);

    // Items
    let currentY = y + 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...slateText);

    items.forEach(item => {
      if (typeof item === 'string') {
        const lines = doc.splitTextToSize(`• ${item}`, w - 8);
        doc.text(lines, x + 5, currentY);
        currentY += lines.length * 3.3;
      } else if (item.label && item.value) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${item.label}: `, x + 5, currentY);
        const labelWidth = doc.getTextWidth(`${item.label}: `);
        doc.setFont('helvetica', 'normal');
        const valLines = doc.splitTextToSize(item.value, w - 8 - labelWidth);
        doc.text(valLines, x + 5 + labelWidth, currentY);
        currentY += Math.max(valLines.length * 3.3, 3.8);
      }
    });
  };

  // =========================================================================
  // PAGE 1: EXECUTIVE OVERVIEW, OBJECTIVES & HIGH-LEVEL ARCHITECTURE
  // =========================================================================
  drawHeader('Corporate Access Intelligence System', 'Total Website Implementation Plan & Architecture Blueprint', 1);
  
  let y = 30;

  // Hero Overview Box
  doc.setFillColor(...navyDark);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'F');
  
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('ENTERPRISE DATA ANALYTICS & INTELLIGENCE PLATFORM', margin + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(226, 232, 240);
  const heroDesc = 'A high-performance, full-stack intelligence portal unifying multi-format data ingestion (CSV/XLSX/JSON), browser multi-threaded parsing, AutoML & Deep Learning predictive modeling, real-time Server-Sent Events telemetry, atomic file storage, interactive visual analytics, and executive PDF reporting.';
  const heroLines = doc.splitTextToSize(heroDesc, contentWidth - 12);
  doc.text(heroLines, margin + 6, y + 13);

  // Quick Spec Badges
  const badges = [
    { label: 'Frontend', val: 'React 18 + Vite 5 (Port 3000)' },
    { label: 'Backend', val: 'Node.js Express 5 (Port 5000)' },
    { label: 'AutoML', val: 'Client-Side Neural & Tree Engine' },
    { label: 'Security', val: 'Role Auth + Live Session Audit' }
  ];
  let badgeX = margin;
  const badgeW = contentWidth / 4;
  y += 29;

  badges.forEach((b, i) => {
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...cardBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin + (i * (badgeW + 1.5)) - (i > 0 ? 1 : 0), y, badgeW - 1.5, 11, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(...bluePrimary);
    doc.text(b.label.toUpperCase(), margin + (i * (badgeW + 1.5)) + 3, y + 4.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...navyDark);
    doc.text(b.val, margin + (i * (badgeW + 1.5)) + 3, y + 8.5);
  });

  y += 15;

  // Section 1: Core System Goals & Requirements
  drawSectionHeader(y, '1', 'Strategic Objectives & System Scope', 'Production Ready');
  y += 10;

  const colW = (contentWidth - 4) / 2;
  drawCard(margin, y, colW, 40, 'Business & Operational Objectives', [
    { label: 'Instant Ingestion', value: 'Zero-latency upload of datasets up to 50MB with greedy parsing.' },
    { label: 'Universal Parsing', value: 'Seamless support for CSV, XLSX, XLS, and structured JSON.' },
    { label: 'Predictive Intelligence', value: 'Automated AutoML training (Linear, Ridge, Lasso, Trees, Neural).' },
    { label: 'Live Telemetry', value: 'Real-time multi-tab user tracking via Server-Sent Events (SSE).' },
    { label: 'Audit Trail', value: 'Full session lifecycle logging with duration, roles, and status.' }
  ], bluePrimary);

  drawCard(margin + colW + 4, y, colW, 40, 'Technical Architecture Principles', [
    { label: 'Dual-Server Architecture', value: 'Vite Frontend (Port 3000) + Express Backend (Port 5000).' },
    { label: 'Atomic File Safety', value: 'Crash-resilient atomic file writing to prevent database corruption.' },
    { label: 'Multi-threaded UI', value: 'Web Worker offloading for parsing to eliminate UI thread freezing.' },
    { label: 'Stateless & Resilient', value: 'Global in-memory caching with fallback to file-system DB.' },
    { label: 'Executive Output', value: 'Single-click generation of multi-page vector PDF reports.' }
  ], emeraldGreen);

  y += 43;

  // Section 2: Technology Stack Matrix
  drawSectionHeader(y, '2', 'Complete Technology Stack & Dependencies', 'Full Stack');
  y += 10;

  // Tech Stack Grid (4 Columns)
  const techCols = [
    {
      title: 'Frontend Tier',
      color: bluePrimary,
      items: [
        'React 18.2 (Functional + Hooks)',
        'Vite 5.1.6 (Fast HMR & Bundler)',
        'Chart.js 4.4.1 & react-chartjs-2',
        'Lucide React (Modern Icons)',
        'HTML5 Web Workers (csvWorker)'
      ]
    },
    {
      title: 'Backend Tier',
      color: emeraldGreen,
      items: [
        'Node.js (ES Module Runtime)',
        'Express 5.2.1 REST API',
        'Multer 2.2.0 (Multipart Engine)',
        'CORS (Cross-Origin Resource)',
        'Concurrently 10.0 (Unified Dev)'
      ]
    },
    {
      title: 'Data & Analytics',
      color: purpleAI,
      items: [
        'PapaParse 5.4.1 (CSV Engine)',
        'XLSX 0.18.5 (Excel Sheet Engine)',
        'AutoML Engine (Custom Matrix Math)',
        'Deep Learning Studio Simulation',
        'Statistical Profiling Algorithms'
      ]
    },
    {
      title: 'Export & Utility',
      color: amberWarning,
      items: [
        'jsPDF 4.2.1 (Vector PDF Engine)',
        'html2canvas 1.4.1 (HD Charts)',
        'Exchange Rate API Integration',
        'Local Storage & Session Storage',
        'Vercel Serverless Ready (/tmp)'
      ]
    }
  ];

  const gridW = (contentWidth - 6) / 4;
  techCols.forEach((col, i) => {
    drawCard(margin + (i * (gridW + 2)), y, gridW, 36, col.title, col.items, col.color);
  });

  y += 39;

  // Section 3: Dual-Port Operational Pipeline
  drawSectionHeader(y, '3', 'Dual-Server Operational Flow (Port 3000 + Port 5000)', 'Network Proxy');
  y += 10;

  drawCard(margin, y, contentWidth, 31, 'Network Topology & Development Proxy Pipeline', [
    { label: 'Client Layer', value: 'Vite runs on http://localhost:3000 serving responsive React SPA.' },
    { label: 'Vite Proxy', value: 'Vite config routes all requests from /api and /uploads to http://localhost:5000 with changeOrigin enabled.' },
    { label: 'API Backend', value: 'Express runs on http://localhost:5000 handling file uploads, DB queries, SSE feeds, and model persistence.' },
    { label: 'Unified Command', value: 'Running "npm run dev:all" triggers concurrently to spin up both services simultaneously with a single terminal command.' }
  ], cyanAccent);

  drawFooter(1);

  // =========================================================================
  // PAGE 2: DETAILED SYSTEM ARCHITECTURE & DIRECTORY STRUCTURE
  // =========================================================================
  doc.addPage();
  drawHeader('Corporate Access Intelligence System', 'Component Hierarchy & Dedicated Storage Architecture', 2);
  
  y = 30;

  // Section 4: Dedicated Storage Architecture
  drawSectionHeader(y, '4', 'Dedicated Directory & Storage Architecture', 'Category Partitioning');
  y += 10;

  const storageCards = [
    {
      title: 'Uploads Partition (/uploads)',
      color: bluePrimary,
      items: [
        { label: 'uploads/datasets/', value: 'Raw & formatted CSV/XLSX uploaded files with timestamped unique IDs.' },
        { label: 'uploads/reports/', value: 'Generated Executive PDF analytics documents ready for download.' },
        { label: 'uploads/exports/', value: 'Processed and filtered dataset archives exported by analysts.' }
      ]
    },
    {
      title: 'Database Registry (/database)',
      color: emeraldGreen,
      items: [
        { label: 'database/datasets/', value: 'datasets.json storing comprehensive metadata, schemas & health scores.' },
        { label: 'database/sessions/', value: 'sessions.json tracking active/historical user login events & durations.' },
        { label: 'database/users/', value: 'users.json containing user profiles, roles, and login counts.' },
        { label: 'database/live_users/', value: 'live_stats.json tracking real-time concurrency & peak traffic.' },
        { label: 'database/models/', value: 'automl_models.json storing trained ML model weights and metrics.' }
      ]
    }
  ];

  drawCard(margin, y, colW, 46, storageCards[0].title, storageCards[0].items, storageCards[0].color);
  drawCard(margin + colW + 4, y, colW, 46, storageCards[1].title, storageCards[1].items, storageCards[1].color);

  y += 49;

  // Section 5: Frontend Component Architecture Hierarchy
  drawSectionHeader(y, '5', 'Frontend React 18 Component Hierarchy', 'Modular Design');
  y += 10;

  const componentsGrid = [
    {
      title: 'Core & Layout',
      color: navyDark,
      items: [
        'App.jsx (Root State & Routing)',
        'Header.jsx (Nav, Mode, Role Info)',
        'SidebarFilters.jsx (Dynamic Filters)',
        'Dashboard.jsx (Analytics Grid)',
        'KPICards.jsx (Dynamic KPI Badges)'
      ]
    },
    {
      title: 'Data & Visuals',
      color: bluePrimary,
      items: [
        'DataTable.jsx (Paginated Grid)',
        'DatasetHistory.jsx (Version History)',
        'FileUpload.jsx (Drag & Drop Zone)',
        'CustomChartBuilder.jsx (Chart Studio)',
        'ComparisonView.jsx (Side-by-Side)'
      ]
    },
    {
      title: 'AI & Intelligence',
      color: purpleAI,
      items: [
        'AutoMLEngineModal.jsx (ML Trainer)',
        'DeepLearningStudioModal.jsx (DL)',
        'DeepLearningExecutiveModal.jsx',
        'MLPipelineModal.jsx (Pipeline view)',
        'VoiceAssistant.jsx (Speech Engine)'
      ]
    },
    {
      title: 'Security & Utilities',
      color: emeraldGreen,
      items: [
        'LoginPage.jsx & LoginModal.jsx',
        'OAuthPromptModal.jsx (SSO Simulation)',
        'LiveUserTracker.jsx (Live SSE View)',
        'StorageExplorerModal.jsx (Disk)',
        'RealtimeCalculatorModal.jsx'
      ]
    }
  ];

  componentsGrid.forEach((col, i) => {
    drawCard(margin + (i * (gridW + 2)), y, gridW, 42, col.title, col.items, col.color);
  });

  y += 45;

  // Section 6: In-Memory Caching & Atomic File Writing Flow
  drawSectionHeader(y, '6', 'High-Concurrency Atomic Storage Engine', 'Million-User Scale');
  y += 10;

  drawCard(margin, y, contentWidth, 38, 'Atomic Write Engine (safeWriteJsonAtomic) & Read Caching Architecture', [
    { label: 'Race Condition Prevention', value: 'When writing updates, the server creates a unique temporary file (.tmp_timestamp_rand), writes data, and performs an OS-level atomic rename to target file.' },
    { label: '4,000ms In-Memory Read Caching', value: 'High-frequency read requests serve cached JSON objects from memory, bypassing disk I/O for 4 seconds, enabling thousands of concurrent requests per second.' },
    { label: 'Resilient Fallback', value: 'If atomic rename encounters locked file handles on Windows, synchronous fallback ensures zero data loss while logging a graceful guard notice.' },
    { label: 'Process Shields', value: 'Global uncaughtException and unhandledRejection handlers protect the Express server from unexpected crashes, maintaining 100% uptime.' }
  ], purpleAI);

  drawFooter(2);

  // =========================================================================
  // PAGE 3: CORE FUNCTIONAL WORKFLOWS & INTELLIGENCE ENGINES
  // =========================================================================
  doc.addPage();
  drawHeader('Corporate Access Intelligence System', 'Data Pipeline, AutoML & Realtime Telemetry Workflows', 3);
  
  y = 30;

  // Section 7: Dataset Ingestion & Profiling Engine
  drawSectionHeader(y, '7', 'Dataset Ingestion, Parsing & Quality Profiling', 'Web Worker + Server Multer');
  y += 10;

  drawCard(margin, y, colW, 48, '1. Multi-Stage Ingestion Pipeline', [
    { label: 'Upload Interface', value: 'Supports single or batch drag-and-drop of CSV, XLSX, XLS, JSON up to 50MB.' },
    { label: 'Server-Side Multer', value: 'Saves file into uploads/datasets/ with sanitized unique timestamped name.' },
    { label: 'PapaParse & SheetJS', value: 'Greedy parsing converts tabular rows into structured JSON objects.' },
    { label: 'Sampling Optimization', value: 'Down-samples datasets >2,000 rows for sub-second column type detection.' }
  ], bluePrimary);

  drawCard(margin + colW + 4, y, colW, 48, '2. Automated Quality Audit (Health Score)', [
    { label: 'Health Score Formula', value: 'Health = (Completeness × 70%) + (Uniqueness × 30%).' },
    { label: 'Type Classification', value: 'Detects numeric, categorical, and ISO datetime columns dynamically.' },
    { label: 'Missing Cell Audit', value: 'Counts null, undefined, and empty string cells across all dimensions.' },
    { label: 'Duplicate Detection', value: 'Fast Set-based hash comparison identifies duplicate record occurrences.' }
  ], emeraldGreen);

  y += 51;

  // Section 8: AutoML & Deep Learning Engine
  drawSectionHeader(y, '8', 'AutoML Predictive Engine & Deep Learning Studio', 'Client-Side AI Math');
  y += 10;

  const aiCards = [
    {
      title: 'AutoML Feature & Model Matrix',
      color: purpleAI,
      items: [
        { label: 'Regression Suite', value: 'Linear Regression, Ridge Regression, Lasso, Decision Tree, Random Forest.' },
        { label: 'Classification Suite', value: 'Logistic Regression, Multi-Class Decision Trees, Random Forest Classifier.' },
        { label: 'Feature Engineering', value: 'Z-score normalization, One-Hot Encoding, missing value median imputation.' },
        { label: 'Model Evaluation', value: 'Calculates R², MSE, RMSE, MAE, Accuracy, Precision, Recall, and F1-Score.' }
      ]
    },
    {
      title: 'Deep Learning & Neural Network Studio',
      color: navyDark,
      items: [
        { label: 'Architecture Customizer', value: 'Configurable hidden layers, neuron counts (16 to 256), and activations (ReLU, Sigmoid, Tanh).' },
        { label: 'Hyperparameter Tuning', value: 'Adjustable learning rate, epoch cycles (10-100), batch size, and L2 regularization.' },
        { label: 'Live Loss Curves', value: 'Real-time Canvas training visualization plotting loss convergence and validation accuracy.' },
        { label: 'Inference Engine', value: 'Interactive manual predictor providing instant multi-variable inference outputs.' }
      ]
    }
  ];

  drawCard(margin, y, colW, 48, aiCards[0].title, aiCards[0].items, aiCards[0].color);
  drawCard(margin + colW + 4, y, colW, 48, aiCards[1].title, aiCards[1].items, aiCards[1].color);

  y += 51;

  // Section 9: Real-time Telemetry & Security Audit Trail
  drawSectionHeader(y, '9', 'Live Telemetry & Enterprise Session Security', 'SSE + Audit Trail');
  y += 10;

  drawCard(margin, y, contentWidth, 30, 'Server-Sent Events (SSE) Active Concurrency & Session Logging', [
    { label: 'Real-Time SSE Stream', value: 'Endpoint /api/live-users maintains persistent SSE stream pushing active visitor counts, peak concurrents, and online user rosters.' },
    { label: 'Heartbeat Keep-Alive', value: 'Clients emit heartbeat ping every 10 seconds. Inactive sessions automatically transition to offline state after 30 seconds.' },
    { label: 'Multi-Tab Coordination', value: 'Unique clientTabId prevents duplicate counting across multiple tabs belonging to the same authenticated user session.' }
  ], cyanAccent);

  drawFooter(3);

  // =========================================================================
  // PAGE 4: REST API SPECIFICATIONS & DATA CONTRACTS
  // =========================================================================
  doc.addPage();
  drawHeader('Corporate Access Intelligence System', 'RESTful API Specification & Communication Contracts', 4);
  
  y = 30;

  // Section 10: Complete API Endpoints Table
  drawSectionHeader(y, '10', 'Backend REST API Endpoints Specification', 'Express 5.2.1');
  y += 9;

  // Table Layout
  const tableHeaderY = y;
  const colX = [margin, margin + 22, margin + 55, margin + 115, margin + 145];
  const colWidths = [22, 33, 60, 30, 37];

  doc.setFillColor(...navyDark);
  doc.rect(margin, tableHeaderY, contentWidth, 6.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('METHOD', colX[0] + 2, tableHeaderY + 4.5);
  doc.text('ENDPOINT', colX[1] + 2, tableHeaderY + 4.5);
  doc.text('DESCRIPTION & FUNCTION', colX[2] + 2, tableHeaderY + 4.5);
  doc.text('PAYLOAD / PARAMS', colX[3] + 2, tableHeaderY + 4.5);
  doc.text('RESPONSE', colX[4] + 2, tableHeaderY + 4.5);

  const apiRows = [
    { m: 'GET', ep: '/api/datasets', d: 'Fetch all dataset metadata & health scores', p: 'None', r: '{ success, datasets[] }', c: bluePrimary },
    { m: 'POST', ep: '/api/upload', d: 'Upload and parse single CSV/Excel dataset', p: 'FormData(file)', r: '{ success, dataset, data }', c: emeraldGreen },
    { m: 'POST', ep: '/api/upload-multiple', d: 'Batch upload multiple dataset files', p: 'FormData(files[])', r: '{ success, results[] }', c: emeraldGreen },
    { m: 'GET', ep: '/api/datasets/:id', d: 'Retrieve parsed rows and schema by ID', p: 'URL Param :id', r: '{ success, dataset, data }', c: bluePrimary },
    { m: 'GET', ep: '/api/datasets/:id/download', d: 'Stream original raw dataset file to client', p: 'URL Param :id', r: 'Binary File Attachment', c: bluePrimary },
    { m: 'DELETE', ep: '/api/datasets/:id', d: 'Delete physical file and metadata registry', p: 'URL Param :id', r: '{ success, message }', c: [244, 63, 94] },
    { m: 'GET', ep: '/api/sessions', d: 'Fetch active & historical login sessions', p: 'None', r: '{ success, sessions[] }', c: bluePrimary },
    { m: 'POST', ep: '/api/sessions/login', d: 'Record new user login event and role', p: '{ userId, name, email }', r: '{ success, session }', c: emeraldGreen },
    { m: 'POST', ep: '/api/sessions/heartbeat', d: 'Keep-alive ping to maintain online state', p: '{ sessionId, tabId }', r: '{ success: true }', c: emeraldGreen },
    { m: 'POST', ep: '/api/sessions/logout', d: 'End session and record logout timestamp', p: '{ sessionId }', r: '{ success, duration }', c: amberWarning },
    { m: 'GET', ep: '/api/live-users', d: 'Real-time Server-Sent Events telemetry feed', p: 'SSE Connection', r: 'event: live_update', c: cyanAccent },
    { m: 'GET', ep: '/api/system/folders', d: 'Categorized storage breakdown & file counts', p: 'None', r: '{ categories[], totalBytes }', c: bluePrimary },
    { m: 'POST', ep: '/api/automl/models', d: 'Persist trained AutoML model architecture', p: '{ modelData }', r: '{ success, modelId }', c: purpleAI }
  ];

  let currentTableY = tableHeaderY + 6.5;
  doc.setFontSize(6.2);

  apiRows.forEach((row, idx) => {
    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, currentTableY, contentWidth, 7, 'F');
    doc.setDrawColor(...cardBorder);
    doc.setLineWidth(0.2);
    doc.line(margin, currentTableY + 7, pageWidth - margin, currentTableY + 7);

    // Method badge
    doc.setFillColor(...row.c);
    doc.roundedRect(colX[0] + 1.5, currentTableY + 1.5, 15, 4, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(row.m, colX[0] + 9, currentTableY + 4.3, { align: 'center' });

    // Endpoint
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navyDark);
    doc.text(row.ep, colX[1] + 2, currentTableY + 4.5);

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...slateText);
    doc.text(row.d, colX[2] + 2, currentTableY + 4.5);

    // Params
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    doc.text(row.p, colX[3] + 2, currentTableY + 4.5);

    // Response
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navyDark);
    doc.text(row.r, colX[4] + 2, currentTableY + 4.5);

    currentTableY += 7;
  });

  y = currentTableY + 6;

  // Section 11: Data Models & Schemas
  drawSectionHeader(y, '11', 'Core JSON Data Models & Schemas', 'Database Contracts');
  y += 9;

  drawCard(margin, y, colW, 40, 'Dataset Metadata Model (datasets.json)', [
    { label: 'id', value: 'String (e.g. "ds_171800000_abc")' },
    { label: 'originalName', value: 'String (e.g. "Employee_Records.csv")' },
    { label: 'rowCount / columnCount', value: 'Numbers (e.g. 15,000 / 18)' },
    { label: 'healthScore / completeness', value: 'Percentages (e.g. 98% / 100%)' },
    { label: 'columns', value: 'Array<{ name, type, nullRatio }>' }
  ], bluePrimary);

  drawCard(margin + colW + 4, y, colW, 40, 'Session Audit Model (sessions.json)', [
    { label: 'id / userId', value: 'String (e.g. "sess_1002" / "usr_alex_102")' },
    { label: 'username / userRole', value: 'String (e.g. "Alex Morgan" / "Senior Data Lead")' },
    { label: 'loginTime / logoutTime', value: 'ISO Date Strings or null' },
    { label: 'status', value: 'Enum: "online" | "offline"' },
    { label: 'clientTabId', value: 'Unique Browser Tab Identifier' }
  ], emeraldGreen);

  drawFooter(4);

  // =========================================================================
  // PAGE 5: DEPLOYMENT, VERIFICATION & EXECUTIVE SUMMARY
  // =========================================================================
  doc.addPage();
  drawHeader('Corporate Access Intelligence System', 'Deployment Strategy, Verification Plan & Operational Sign-off', 5);
  
  y = 30;

  // Section 12: Deployment & Serverless Hybrid Architecture
  drawSectionHeader(y, '12', 'Deployment & Environment Architecture', 'Vercel + Node.js');
  y += 10;

  drawCard(margin, y, colW, 46, '1. Local Development Environment', [
    { label: 'Command', value: '"npm run dev:all" runs Express (5000) & Vite (3000).' },
    { label: 'Proxy Target', value: 'Vite automatically proxies /api and /uploads to port 5000.' },
    { label: 'Hot Reloading', value: 'Vite React HMR provides instantaneous UI reflection without reloading.' },
    { label: 'Local Filesystem', value: 'Full persistent file storage in ./uploads and ./database.' }
  ], bluePrimary);

  drawCard(margin + colW + 4, y, colW, 46, '2. Production & Vercel Hybrid Strategy', [
    { label: 'Serverless API', value: 'Express handles Vercel Serverless Functions via /api routing.' },
    { label: 'Dynamic Pathing', value: 'Environment detects isVercel and routes writable storage to /tmp/corporate-data.' },
    { label: 'Static Bundle', value: '"npm run build" produces minified, optimized static assets in /dist.' },
    { label: 'Asset Caching', value: 'Cache-Control headers configured for high-speed CDN delivery.' }
  ], emeraldGreen);

  y += 49;

  // Section 13: Comprehensive Verification & Test Matrix
  drawSectionHeader(y, '13', 'System Verification & Quality Assurance Matrix', 'Validated');
  y += 10;

  const testCards = [
    {
      title: 'Data & Upload Tests',
      color: bluePrimary,
      items: [
        '50MB CSV/Excel ingestion speed verified.',
        'Malformed row recovery tested with PapaParse greedy parser.',
        'File size boundary check & format filter enforcement.'
      ]
    },
    {
      title: 'AutoML & AI Math Tests',
      color: purpleAI,
      items: [
        'Regression R² and MSE benchmarked against sample datasets.',
        'Decision Tree split node integrity and categorical encoding verified.',
        'Neural network loss curve convergence validated.'
      ]
    },
    {
      title: 'Security & Concurrency Tests',
      color: emeraldGreen,
      items: [
        'SSE multi-client broadcast tested under simulated concurrent tabs.',
        'Atomic safe-file writing tested under rapid concurrent POSTs.',
        'Session expiry transitions verified on idle timeout.'
      ]
    }
  ];

  const testGridW = (contentWidth - 4) / 3;
  testCards.forEach((tc, i) => {
    drawCard(margin + (i * (testGridW + 2)), y, testGridW, 36, tc.title, tc.items, tc.color);
  });

  y += 39;

  // Section 14: Executive Sign-off & System Metadata
  drawSectionHeader(y, '14', 'Executive Project Summary & Sign-off Details', 'Approved');
  y += 10;

  // Executive Sign-off Box
  doc.setFillColor(...navyDark);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'F');

  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PROJECT ARCHITECT & LEAD DEVELOPER: SATHYA SAI KUMAR', margin + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(203, 213, 225);
  doc.text('Platform: Corporate Access Intelligence System & Advanced Data Analytics Portal', margin + 6, y + 13);
  doc.text('Status: Production-Grade • All Modules Operational • High-Concurrency Architecture Certified', margin + 6, y + 18);
  doc.text(`Generated: ${new Date().toLocaleString()} • Version: Release 3.0 Enterprise`, margin + 6, y + 23);

  // Verification Seal
  doc.setFillColor(...emeraldGreen);
  doc.roundedRect(contentWidth - margin - 22, y + 5, 36, 10, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('SYSTEM READY', contentWidth - margin - 4, y + 11.5, { align: 'center' });

  drawFooter(5);

  // Save to file
  const outputPath = path.resolve(__dirname, '..', 'Corporate_Access_Intelligence_System_Total_Implementation_Plan.pdf');
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, pdfBuffer);

  // Also save in public folder so users can download it directly from the web browser if needed
  const publicPath = path.resolve(__dirname, '..', 'public', 'Corporate_Access_Intelligence_System_Total_Implementation_Plan.pdf');
  fs.writeFileSync(publicPath, pdfBuffer);

  console.log(`✅ PDF successfully generated at: ${outputPath}`);
  console.log(`✅ Public downloadable copy saved at: ${publicPath}`);
}

generateImplementationPlanPDF().catch(console.error);
