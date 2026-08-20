import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import DatasetHistory from './components/DatasetHistory';
import LiveUserTracker from './components/LiveUserTracker';
import SidebarFilters from './components/SidebarFilters';
import KPICards from './components/KPICards';
import Dashboard from './components/Dashboard';
import CustomChartBuilder from './components/CustomChartBuilder';
import DataTable from './components/DataTable';
import StatsOverview from './components/StatsOverview';
import ComparisonView from './components/ComparisonView';
import LoginPage from './components/LoginPage';
import CookieConsentBanner from './components/CookieConsentBanner';
import VoiceAssistant from './components/VoiceAssistant';
import TransferNotificationPopup from './components/TransferNotificationPopup';
import { SAMPLE_DATASETS } from './utils/sampleData';

// 🚀 Dynamic Lazy-Loaded Heavy Studio Modals for Extreme Performance
const UserProfileModal = lazy(() => import('./components/UserProfileModal'));
const MLPipelineModal = lazy(() => import('./components/MLPipelineModal'));
const AutoMLEngineModal = lazy(() => import('./components/AutoMLEngineModal'));
const DeepLearningExecutiveModal = lazy(() => import('./components/DeepLearningExecutiveModal'));
const DeepLearningStudioModal = lazy(() => import('./components/DeepLearningStudioModal'));
const RealtimeCalculatorModal = lazy(() => import('./components/RealtimeCalculatorModal'));
const DataCleaningStudioModal = lazy(() => import('./components/DataCleaningStudioModal'));
const StorageExplorerModal = lazy(() => import('./components/StorageExplorerModal'));
const MedallionExportModal = lazy(() => import('./components/MedallionExportModal'));

const ModalSuspenseLoader = () => (
  <div style={{
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    color: '#38bdf8',
    fontFamily: 'Inter, system-ui, sans-serif'
  }}>
    <div style={{
      width: '42px',
      height: '42px',
      borderRadius: '50%',
      border: '3px solid rgba(56, 189, 248, 0.2)',
      borderTopColor: '#38bdf8',
      animation: 'spin 0.8s linear infinite'
    }} />
    <span style={{ fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>
      Loading Studio Module...
    </span>
  </div>
);
import { getStoredUser, logoutUser } from './utils/auth';
import { startSession, endActiveSession } from './utils/activityTracker';
import { startLiveTracking, stopLiveTracking, subscribeToLiveStats, refreshLiveStatsNow } from './utils/liveTracker';
import { convertFileToCsvContent } from './utils/fileConverter';
import {
  fetchDatasetHistory,
  uploadDatasetFile,
  uploadMultipleDatasetFiles,
  fetchDatasetById,
  deleteDatasetById,
  deleteAllDatasets,
  deleteDatasetsBulk,
  seedSampleDatasets
} from './utils/api';
import {
  LayoutDashboard,
  Sliders,
  Table as TableIcon,
  Calculator,
  GitCompare,
  Loader2,
  Filter,
  Radio,
  AlertTriangle,
  Eye,
  Sparkles,
  FileText,
  Download,
  Brain,
  Cpu,
  Layers,
  CheckCircle2,
  Database,
  Activity,
  FileSpreadsheet,
  Award,
  X
} from 'lucide-react';
import { generateExecutivePDFReport } from './utils/pdfReportGenerator';
import { generateExecutiveExcelWorkbook } from './utils/excelReportGenerator';

// Instant 0ms snapshot cache loader for lightning-fast refresh
const getStoredDatasetSnapshot = () => {
  try {
    const raw = sessionStorage.getItem('active_dataset_snapshot') || localStorage.getItem('active_dataset_snapshot');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.totalRows > 0) return parsed;
    }
  } catch (e) {
    console.warn('Snapshot cache notice:', e);
  }
  return null;
};

export default function App() {
  const initialSnapshot = getStoredDatasetSnapshot();

  const [totalRows, setTotalRows] = useState(() => initialSnapshot?.totalRows || 0);
  const [filteredCount, setFilteredCount] = useState(() => initialSnapshot?.filteredCount || 0);
  const [headers, setHeaders] = useState(() => initialSnapshot?.headers || []);
  const [schema, setSchema] = useState(() => initialSnapshot?.schema || {});
  const [stats, setStats] = useState(() => initialSnapshot?.stats || {});
  const [healthScore, setHealthScore] = useState(() => initialSnapshot?.healthScore ?? 100);
  const [missingCells, setMissingCells] = useState(() => initialSnapshot?.missingCells || 0);
  const [duplicateCount, setDuplicateCount] = useState(() => initialSnapshot?.duplicateCount || 0);
  const [completenessScore, setCompletenessScore] = useState(() => initialSnapshot?.completenessScore ?? 100);
  const [anomaliesData, setAnomaliesData] = useState(() => initialSnapshot?.anomalies || null);
  const [datasetName, setDatasetName] = useState(() => initialSnapshot?.name || '');
  const [dashboardMetrics, setDashboardMetrics] = useState(() => initialSnapshot?.dashboardMetrics || null);
  const [pageData, setPageData] = useState(() => initialSnapshot?.pageData || []);
  const [isInitialLoading, setIsInitialLoading] = useState(() => !initialSnapshot);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(null);

  const [error, setError] = useState(null);
  const [transferPopup, setTransferPopup] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeLevel, setActiveLevel] = useState('all'); // 'all' | 'low' | 'medium' | 'high'
  const [isLoading, setIsLoading] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ text: '', rowCount: 0 });

  // Sidebar Visibility State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mode States (Always default to Executive Dashboard on refresh unless explicitly toggled)
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [isLiveUsersMode, setIsLiveUsersMode] = useState(false);
  const [liveStats, setLiveStats] = useState(null);
  const [datasetsList, setDatasetsList] = useState([]);

  // Mobile Filter Drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // User Auth & Profile Modal State (Preserved synchronously across refreshes)
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // AI, AutoML & Deep Learning Modal States
  const [isCleaningStudioOpen, setIsCleaningStudioOpen] = useState(false);
  const [isAutoMLOpen, setIsAutoMLOpen] = useState(false);
  const [isMLPipelineOpen, setIsMLPipelineOpen] = useState(false);
  const [isDLExecutiveOpen, setIsDLExecutiveOpen] = useState(false);
  const [isDLStudioOpen, setIsDLStudioOpen] = useState(false);
  const [isAnomaliesModalOpen, setIsAnomaliesModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isMedallionModalOpen, setIsMedallionModalOpen] = useState(false);
  const [calculatorInitialValue, setCalculatorInitialValue] = useState(null);
  const [calculatorInitialMode, setCalculatorInitialMode] = useState('standard');

  const handleOpenCalculator = (val = null, mode = 'standard') => {
    setCalculatorInitialValue(val);
    setCalculatorInitialMode(mode);
    setIsCalculatorOpen(true);
  };

  const handleCloseCalculator = () => {
    setIsCalculatorOpen(false);
  };

  // Global Alt+C shortcut to toggle Real-Time Calculator
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setIsCalculatorOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const workerRef = useRef(null);

  const [filters, setFilters] = useState({
    search: '',
    categorical: {},
    numeric: {}
  });

  // Fetch saved datasets history from backend API on boot
  const refreshDatasetsHistory = async () => {
    try {
      let list = await fetchDatasetHistory();
      if (list.length === 0) {
        list = await seedSampleDatasets();
      }
      setDatasetsList(list);
    } catch (err) {
      console.warn('Backend server offline or unreachable:', err.message);
    }
  };

  // Live Users real-time tracking effect
  useEffect(() => {
    const unsubscribe = subscribeToLiveStats((stats) => {
      if (stats) setLiveStats(stats);
    });

    const saved = getStoredUser();
    if (saved) {
      setCurrentUser(saved);
      startSession(saved);
      startLiveTracking(saved, (stats) => setLiveStats(stats));
    } else {
      startLiveTracking(null, (stats) => setLiveStats(stats));
    }

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // On initial mount: restore last active dataset, latest uploaded dataset, or sample
  useEffect(() => {
    let isMounted = true;

    const initializeDataset = async () => {
      try {
        let list = await fetchDatasetHistory();
        if (!list || list.length === 0) {
          list = await seedSampleDatasets();
        }
        if (isMounted) setDatasetsList(list || []);

        const savedActiveId = localStorage.getItem('active_dataset_id');

        if (savedActiveId && savedActiveId.startsWith('sample:')) {
          const sampleKey = savedActiveId.replace('sample:', '');
          if (SAMPLE_DATASETS[sampleKey]) {
            handleLoadSample(sampleKey);
            return;
          }
        }

        if (savedActiveId && list && list.length > 0) {
          const matchingDataset = list.find(d => d.id === savedActiveId);
          if (matchingDataset) {
            handleSelectHistoryDataset(savedActiveId);
            return;
          }
        }

        // If the user has any uploaded datasets on the server, automatically restore the latest active one!
        if (list && list.length > 0) {
          handleSelectHistoryDataset(list[0].id);
          return;
        }

        // Default demo fallback if server is completely empty
        handleLoadSample('workforce');
      } catch (err) {
        console.warn('Dataset initialization notice:', err.message);
        handleLoadSample('workforce');
      }
    };

    initializeDataset();

    return () => {
      isMounted = false;
    };
  }, []);

  const processWithWorker = (payload, name, isNewUpload = false) => {
    setIsLoading(true);
    setError(null);
    setProgressInfo({ text: 'Parsing & processing multi-million row dataset...', rowCount: 0 });

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(new URL('./workers/csvWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, rowCount, status, totalRows, filteredCount, headers, schema, stats, healthScore, dashboardMetrics, pageData, cleaningReport, message } = e.data;

      if (type === 'PROGRESS') {
        setProgressInfo({
          text: status || `Parsed ${rowCount ? rowCount.toLocaleString() : 0} rows...`,
          rowCount: rowCount || 0
        });
      } else if (type === 'COMPLETE') {
        const { missingCells: mCells, duplicateCount: dCount, completenessScore: cScore, anomalies } = e.data;
        setTotalRows(totalRows);
        setFilteredCount(filteredCount);
        setHeaders(headers);
        setSchema(schema);
        setStats(stats);
        setHealthScore(100);
        setMissingCells(0);
        setDuplicateCount(dCount || 0);
        setCompletenessScore(100);
        setAnomaliesData(anomalies || null);
        setDashboardMetrics(dashboardMetrics);
        setPageData(pageData);
        setDatasetName(name);

        try {
          const snapshot = {
            totalRows,
            filteredCount,
            headers,
            schema,
            stats,
            healthScore: 100,
            missingCells: 0,
            duplicateCount: dCount || 0,
            completenessScore: 100,
            cleaningReport: cleaningReport || null,
            anomalies: anomalies || null,
            dashboardMetrics,
            pageData,
            name
          };
          sessionStorage.setItem('active_dataset_snapshot', JSON.stringify(snapshot));
          localStorage.setItem('active_dataset_snapshot', JSON.stringify(snapshot));
        } catch (err) {
          // ignore cache quota
        }

        const initialNumericFilters = {};
        headers.forEach(c => {
          if (schema[c] === 'numeric' && stats[c]) {
            initialNumericFilters[c] = [stats[c].min, stats[c].max];
          }
        });

        setFilters({
          search: '',
          categorical: {},
          numeric: initialNumericFilters
        });

        setIsLoading(false);
        setIsUploadMode(false);
        setIsHistoryMode(false);
        setIsInitialLoading(false);

        // Trigger Upload Success Popup ONLY if user actively uploaded a new file (not on refresh/switching)
        if (isNewUpload) {
          setTransferPopup({
            mode: 'upload',
            name: name || 'Dataset',
            totalRows: totalRows || 0,
            columnsCount: headers ? headers.length : 0,
            healthScore: 100,
            anomaliesCount: anomalies?.totalAnomalies || 0,
            completenessScore: 100,
            cleaningReport: cleaningReport || null,
            desc: 'Dataset parsed, normalized, nulls imputed, and fully integrated into the intelligence engine.'
          });
        } else {
          setTransferPopup(null);
        }
      } else if (type === 'FILTER_RESULT') {
        setFilteredCount(e.data.filteredCount);
        setDashboardMetrics(e.data.dashboardMetrics);
        setPageData(e.data.pageData);
      } else if (type === 'PAGE_RESULT') {
        setPageData(e.data.pageData);
      } else if (type === 'EXPORT_RESULT') {
        const { csvString } = e.data;
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const cleanName = (datasetName || 'Dataset').replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${cleanName}_Export_${timestamp}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsLoading(false);

        // Show Advanced Download Popup
        setTransferPopup({
          mode: 'download',
          type: 'CSV',
          filename,
          recordCount: filteredCount || totalRows,
          columnsCount: headers ? headers.length : 0,
          title: 'Filtered CSV Dataset Exported',
          desc: 'Filtered records successfully generated, formatted, and downloaded to your local storage.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else if (type === 'ERROR') {
        setError(message || 'Failed to parse dataset.');
        setIsLoading(false);
      }
    };

    worker.onerror = (err) => {
      setError(err.message || 'Worker thread execution failed.');
      setIsLoading(false);
    };

    worker.postMessage({ action: 'PARSE', ...payload });
  };

  // Upload file(s) to backend server disk & analyze (Supports Single & Unlimited Multi-Files)
  const handleFileSelect = async (filesInput) => {
    try {
      const files = Array.isArray(filesInput) ? filesInput : [filesInput];
      if (files.length === 0) return;

      const primaryFile = files[0];
      setIsLoading(true);
      setError(null);
      setProgressInfo({
        text: files.length > 1
          ? `Processing batch of ${files.length} dataset files... Analyzing ${primaryFile.name}...`
          : `Analyzing dataset structures for ${primaryFile.name}...`,
        rowCount: 0
      });

      // 1. Immediately start high-speed Web Worker analysis on the primary file for instant dashboard viewing
      const converted = await convertFileToCsvContent(primaryFile);
      if (converted.csvContent) {
        processWithWorker({ rawCsv: converted.csvContent }, converted.datasetName, true);
      } else {
        processWithWorker({ file: converted.file || primaryFile }, converted.datasetName || primaryFile.name, true);
      }

      // 2. Concurrently save ALL selected files to backend server storage (uploads/datasets/)
      try {
        let uploadRes;
        if (files.length > 1) {
          uploadRes = await uploadMultipleDatasetFiles(files);
          if (uploadRes?.results?.[0]?.dataset?.id) {
            localStorage.setItem('active_dataset_id', uploadRes.results[0].dataset.id);
          }
        } else {
          uploadRes = await uploadDatasetFile(primaryFile);
          if (uploadRes?.dataset?.id) {
            localStorage.setItem('active_dataset_id', uploadRes.dataset.id);
          }
        }
        await refreshDatasetsHistory();
      } catch (backendErr) {
        console.warn('Backend API background save notice:', backendErr.message);
        await refreshDatasetsHistory();
      }
    } catch (err) {
      setError(`Failed to read/upload file: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Load dataset from History by ID
  const handleSelectHistoryDataset = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      setProgressInfo({ text: 'Reading stored dataset from uploads/datasets/...', rowCount: 0 });

      localStorage.setItem('active_dataset_id', id);

      const res = await fetchDatasetById(id);
      if (res.data && res.data.length > 0) {
        processWithWorker({ rows: res.data }, res.dataset?.originalName || 'History Dataset');
      } else {
        throw new Error('No readable records found in stored dataset.');
      }
    } catch (err) {
      setError(`Failed to load dataset: ${err.message}`);
      setIsLoading(false);
    }
  };

  const handleSelectDataset = handleSelectHistoryDataset;

  // Delete dataset from History by ID
  const handleDeleteHistoryDataset = async (id) => {
    try {
      if (localStorage.getItem('active_dataset_id') === id) {
        localStorage.removeItem('active_dataset_id');
      }
      const res = await deleteDatasetById(id);
      await refreshDatasetsHistory();
      return res;
    } catch (err) {
      console.error(`Failed to delete dataset: ${err.message}`);
      throw err;
    }
  };

  // Delete all datasets from History & disk
  const handleDeleteAllHistoryDatasets = async () => {
    try {
      localStorage.removeItem('active_dataset_id');
      const res = await deleteAllDatasets();
      await refreshDatasetsHistory();
      return res;
    } catch (err) {
      console.error(`Failed to delete all datasets: ${err.message}`);
      throw err;
    }
  };

  // Bulk delete selected datasets from History & disk
  const handleDeleteBulkHistoryDatasets = async (ids) => {
    try {
      const activeId = localStorage.getItem('active_dataset_id');
      if (activeId && ids.includes(activeId)) {
        localStorage.removeItem('active_dataset_id');
      }
      const res = await deleteDatasetsBulk(ids);
      await refreshDatasetsHistory();
      return res;
    } catch (err) {
      console.error(`Failed to bulk delete datasets: ${err.message}`);
      throw err;
    }
  };

  const handleLoadSample = (sampleKey) => {
    const sample = SAMPLE_DATASETS[sampleKey];
    if (!sample) return;
    localStorage.setItem('active_dataset_id', `sample:${sampleKey}`);
    processWithWorker({ rawCsv: sample.csvContent }, sample.name);
  };

  const handleFilterChange = (filterType, newValue) => {
    let newFilters = { ...filters };
    if (filterType === 'search') newFilters.search = newValue;
    else if (filterType === 'categorical') newFilters.categorical = newValue;
    else if (filterType === 'numeric') newFilters.numeric = newValue;

    setFilters(newFilters);

    if (workerRef.current) {
      workerRef.current.postMessage({
        action: 'FILTER',
        filters: newFilters,
        page: 1,
        pageSize: 10
      });
    }
  };

  const handleResetFilters = () => {
    const initialNumericFilters = {};
    headers.forEach(c => {
      if (schema[c] === 'numeric' && stats[c]) {
        initialNumericFilters[c] = [stats[c].min, stats[c].max];
      }
    });

    const resetF = {
      search: '',
      categorical: {},
      numeric: initialNumericFilters
    };
    setFilters(resetF);

    if (workerRef.current) {
      workerRef.current.postMessage({
        action: 'FILTER',
        filters: resetF,
        page: 1,
        pageSize: 10
      });
    }
  };

  const handlePageChange = (page, pageSize, sortColumn, sortDirection) => {
    if (workerRef.current) {
      workerRef.current.postMessage({
        action: 'GET_PAGE',
        page,
        pageSize,
        sortColumn,
        sortDirection
      });
    }
  };

  const handleLevelSelect = (level) => {
    setActiveLevel(level);
    const newNumericFilters = { ...filters.numeric };
    const numericCols = headers.filter(c => schema[c] === 'numeric' && stats[c]);

    numericCols.forEach(col => {
      const minVal = stats[col].min;
      const maxVal = stats[col].max;
      const span = maxVal - minVal;

      if (level === 'low') {
        newNumericFilters[col] = [minVal, Math.round(minVal + span * 0.33)];
      } else if (level === 'medium') {
        newNumericFilters[col] = [Math.round(minVal + span * 0.33), Math.round(minVal + span * 0.67)];
      } else if (level === 'high') {
        newNumericFilters[col] = [Math.round(minVal + span * 0.67), maxVal];
      } else {
        newNumericFilters[col] = [minVal, maxVal];
      }
    });

    const newF = { ...filters, numeric: newNumericFilters };
    setFilters(newF);

    if (workerRef.current) {
      workerRef.current.postMessage({
        action: 'FILTER',
        filters: newF,
        page: 1,
        pageSize: 10
      });
    }
  };

  const handleExportCSV = () => {
    if (workerRef.current) {
      setIsLoading(true);
      setProgressInfo({ text: 'Generating CSV file for download...', rowCount: filteredCount });
      workerRef.current.postMessage({ action: 'EXPORT_CSV' });
    }
  };

  const handleExportPDF = async () => {
    if (isExportingPDF) return;
    setIsExportingPDF(true);
    setPdfProgress({ step: 1, total: 5, message: 'Preparing PDF Report Engine...' });

    try {
      await generateExecutivePDFReport({
        datasetName,
        totalRows,
        filteredCount,
        healthScore,
        completenessScore,
        missingCells,
        duplicateCount,
        financialStats: stats,
        dashboardMetrics,
        anomalies: anomaliesData,
        headers,
        theme,
        onProgress: (p) => setPdfProgress(p)
      });
      setTimeout(() => {
        setIsExportingPDF(false);
        setPdfProgress(null);

        const cleanName = (datasetName || 'Dataset').replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${cleanName}_Executive_Report_${timestamp}.pdf`;

        setTransferPopup({
          mode: 'download',
          type: 'PDF',
          filename,
          recordCount: totalRows,
          columnsCount: headers ? headers.length : 0,
          title: 'Executive PDF Report Generated & Downloaded',
          desc: 'Multi-page high-resolution executive report generated with KPI matrices, charts, and complete statistical breakdown.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }, 800);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      setIsExportingPDF(false);
      setPdfProgress(null);
    }
  };

  const handleExportExcel = () => {
    try {
      const res = generateExecutiveExcelWorkbook({
        datasetName: datasetName || 'Workforce Dataset',
        data: pageData,
        headers: headers,
        schema: schema,
        stats: stats,
        totalRows: totalRows,
        healthScore: healthScore,
        completenessScore: completenessScore,
        missingCells: missingCells,
        duplicateCount: duplicateCount
      });

      setTransferPopup({
        mode: 'download',
        type: 'XLSX',
        filename: res.filename,
        recordCount: totalRows,
        columnsCount: headers ? headers.length : 0,
        title: 'Executive Multi-Sheet Excel Workbook Exported',
        desc: '4-Tab formatted workbook generated with Executive Summary, Column Statistics, Clean Records, and ML Insights.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } catch (err) {
      console.error('Excel Export failed:', err);
    }
  };

  const handleLogout = async () => {
    if (currentUser) {
      endActiveSession(currentUser.id || currentUser.email || currentUser.phone);
      await stopLiveTracking(currentUser);
    }
    logoutUser();
    setCurrentUser(null);
    setIsGuestMode(false);
    setIsProfileOpen(false);
    setIsLoginOpen(true);
  };

  const hasData = totalRows > 0;
  const isFiltered = filteredCount !== totalRows;

  // Render Full Page Login Page when unauthenticated or requested
  if (!currentUser || isLoginOpen) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          startSession(user);
          startLiveTracking(user, (stats) => setLiveStats(stats));
          setIsLoginOpen(false);
          setIsGuestMode(false);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
    );
  }

  return (
    <div className="app-container">
      <Header
        hasData={hasData}
        hasPreviousDataset={hasData}
        isUploadMode={isUploadMode}
        isHistoryMode={isHistoryMode}
        isLiveUsersMode={isLiveUsersMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isFiltered={isFiltered}
        savedDatasetsCount={datasetsList.length}
        liveUsersCount={liveStats?.liveUsers ?? 0}
        datasetName={datasetName}
        onUploadClick={() => {
          setIsUploadMode(true);
          setIsHistoryMode(false);
          setIsLiveUsersMode(false);
        }}
        onHistoryClick={() => {
          setIsHistoryMode(true);
          setIsUploadMode(false);
          setIsLiveUsersMode(false);
          refreshDatasetsHistory();
        }}
        onLiveUsersClick={() => {
          setIsLiveUsersMode(prev => !prev);
          setIsHistoryMode(false);
          setIsUploadMode(false);
        }}
        onLoadSample={(sampleKey) => {
          setIsUploadMode(false);
          setIsHistoryMode(false);
          setIsLiveUsersMode(false);
          handleLoadSample(sampleKey);
        }}
        onResetData={() => {
          setIsUploadMode(true);
          setIsHistoryMode(false);
          setIsLiveUsersMode(false);
        }}
        onBackToDashboard={() => {
          setIsUploadMode(false);
          setIsHistoryMode(false);
          setIsLiveUsersMode(false);
        }}
        onExportCSV={handleExportCSV}
        onExportPDF={handleExportPDF}
        isExportingPDF={isExportingPDF}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onSetTheme={(newTheme) => setTheme(newTheme)}
        onOpenDataCleaner={() => setIsCleaningStudioOpen(true)}
        onOpenMLPipeline={() => setIsMLPipelineOpen(true)}
        onCloseMLPipeline={() => setIsMLPipelineOpen(false)}
        onOpenAutoML={() => setIsAutoMLOpen(true)}
        onCloseAutoML={() => setIsAutoMLOpen(false)}
        onOpenDLExecutive={() => setIsDLExecutiveOpen(true)}
        onCloseDLExecutive={() => setIsDLExecutiveOpen(false)}
        onOpenDLStudio={() => setIsDLStudioOpen(true)}
        onCloseDLStudio={() => setIsDLStudioOpen(false)}
        onOpenAnomalies={() => setIsAnomaliesModalOpen(true)}
        onCloseAnomalies={() => setIsAnomaliesModalOpen(false)}
        onOpenStorageExplorer={() => setIsStorageModalOpen(true)}
        onOpenCalculator={() => handleOpenCalculator(null, 'standard')}
        onOpenMedallionExport={() => setIsMedallionModalOpen(true)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setIsUploadMode(false);
          setIsHistoryMode(false);
          setIsLiveUsersMode(false);
          setActiveTab(tab);
        }}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        datasetsList={datasetsList}
        onSelectDataset={handleSelectHistoryDataset}
        onDeleteDataset={handleDeleteHistoryDataset}
        onFileUpload={handleFileSelect}
        totalRows={totalRows}
        headersCount={headers.length}
        healthScore={healthScore}
      />

      <Suspense fallback={<ModalSuspenseLoader />}>
        {isProfileOpen && (
          <UserProfileModal
            currentUser={currentUser}
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onLogout={handleLogout}
            onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)}
            datasets={datasetsList}
            liveStats={liveStats}
            onSelectDataset={(id) => {
              setIsProfileOpen(false);
              handleSelectDataset(id);
            }}
            onDeleteDataset={handleDeleteHistoryDataset}
            onDeleteAllDatasets={handleDeleteAllHistoryDatasets}
            onDeleteBulkDatasets={handleDeleteBulkHistoryDatasets}
            onRefreshDatasets={refreshDatasetsHistory}
            onSeedSample={() => handleLoadSample('workforce')}
            onOpenUpload={() => {
              setIsProfileOpen(false);
              setIsUploadMode(true);
            }}
          />
        )}
      </Suspense>

      <div className="main-layout">
        {hasData && !isUploadMode && !isHistoryMode && !isLiveUsersMode && !isLoading && isSidebarOpen && (
          <>
            {isMobileFilterOpen && (
              <div
                className="sidebar-backdrop"
                onClick={() => setIsMobileFilterOpen(false)}
                title="Close Filter Drawer"
              />
            )}
            <SidebarFilters
              headers={headers}
              schema={schema}
              stats={stats}
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              isMobileOpen={isMobileFilterOpen}
              onCloseMobile={() => setIsMobileFilterOpen(false)}
              datasetName={datasetName}
              theme={theme}
              onUploadClick={() => {
                setIsUploadMode(true);
                setIsLiveUsersMode(false);
              }}
              onOpenCalculator={() => handleOpenCalculator(null, 'standard')}
              totalRows={totalRows}
              hasData={hasData}
            />
          </>
        )}

        <div className="content-area">
          {isLoading && hasData && (
            <div className="dashboard-loading-strip">
              <div className="loading-strip-fill" />
            </div>
          )}

          {(isLoading || isInitialLoading) && !hasData && !isUploadMode ? (
            <div className="executive-startup-loader">
              <div className="startup-logo-glow">
                <img src="/logo.png" alt="Corporate Access" className="startup-brand-logo" />
              </div>
              <h3 className="startup-title">Loading Executive Analytics Platform...</h3>
              <div className="startup-progress-bar">
                <div className="startup-progress-fill" />
              </div>
              <p className="startup-subtext">{progressInfo.text || 'Restoring dataset intelligence...'}</p>
            </div>
          ) : isLiveUsersMode ? (
            <LiveUserTracker
              liveStats={liveStats}
              currentUser={currentUser}
              onManualRefresh={refreshLiveStatsNow}
            />
          ) : isHistoryMode ? (
            <DatasetHistory
              datasets={datasetsList}
              onSelectDataset={handleSelectHistoryDataset}
              onDeleteDataset={handleDeleteHistoryDataset}
              onDeleteAllDatasets={handleDeleteAllHistoryDatasets}
              onDeleteBulkDatasets={handleDeleteBulkHistoryDatasets}
              onRefresh={refreshDatasetsHistory}
              onSeedSample={async () => {
                await seedSampleDatasets();
                await refreshDatasetsHistory();
              }}
              onOpenUpload={() => {
                setIsUploadMode(true);
                setIsHistoryMode(false);
                setIsLiveUsersMode(false);
              }}
              isLoading={isLoading}
            />
          ) : (isUploadMode || (!hasData && !isInitialLoading)) ? (
            <FileUpload
              onFileSelect={(file) => {
                setIsUploadMode(false);
                setIsHistoryMode(false);
                setIsLiveUsersMode(false);
                handleFileSelect(file);
              }}
              onLoadSample={(sampleKey) => {
                setIsUploadMode(false);
                setIsHistoryMode(false);
                setIsLiveUsersMode(false);
                handleLoadSample(sampleKey);
              }}
              onOpenHistory={() => {
                setIsHistoryMode(true);
                setIsUploadMode(false);
                setIsLiveUsersMode(false);
                refreshDatasetsHistory();
              }}
              error={error}
              hasPreviousDataset={hasData}
              previousDatasetName={datasetName}
              onBackToDashboard={() => setIsUploadMode(false)}
            />
          ) : (
            <>
              <KPICards
                totalRows={totalRows}
                filteredRows={filteredCount}
                healthScore={healthScore}
                missingCells={missingCells}
                duplicateCount={duplicateCount}
                completenessScore={completenessScore}
                anomalies={anomaliesData}
                stats={stats}
                schema={schema}
                activeLevel={activeLevel}
                onLevelSelect={handleLevelSelect}
                liveStats={liveStats}
                onOpenLiveTracker={() => setIsLiveUsersMode(true)}
                onOpenCalculator={handleOpenCalculator}
                isAnomaliesModalOpen={isAnomaliesModalOpen}
                onCloseAnomaliesModal={() => setIsAnomaliesModalOpen(false)}
                onOpenAnomaliesModal={() => setIsAnomaliesModalOpen(true)}
              />

              <div className="nav-tabs">
                <button
                  className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={13} /> Executive Dashboard
                </button>
                <button
                  className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
                  onClick={() => setActiveTab('builder')}
                >
                  <Sliders size={13} /> Custom Visual Studio
                </button>
                <button
                  className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                  onClick={() => setActiveTab('table')}
                >
                  <TableIcon size={13} /> Data Explorer Table ({filteredCount.toLocaleString()})
                </button>
                <button
                  className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <Calculator size={13} /> Statistical Profiling
                </button>
                <button
                  className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comparison')}
                >
                  <GitCompare size={13} /> Comparison Analysis
                </button>

                {/* 🧠 ADVANCED AI DATA CLEANING & PREPROCESSING BUTTON */}
                <button
                  type="button"
                  className="nav-cleaner-single-btn"
                  onClick={() => setIsCleaningStudioOpen(true)}
                  title="Open AI Dataset Cleaning, Profiling & Preprocessing Studio"
                >
                  <span className="nav-cleaner-btn-pulse">
                    <Sparkles size={12} className="nav-cleaner-icon" />
                  </span>
                  <span className="nav-cleaner-btn-text">AI Data Cleaner</span>
                  <span className="nav-cleaner-count-tag">
                    PRO
                  </span>
                </button>

                {/* ⚠️ AUTOMATIC ANOMALY DETECTION - SINGLE-CLICK COMPACT BUTTON */}
                {anomaliesData && (
                  <button
                    type="button"
                    className="nav-anomalies-single-btn"
                    onClick={() => setIsAnomaliesModalOpen(true)}
                    title="Open Automatic Anomaly Detection with 5 Unique AI Models"
                  >
                    <span className="nav-anomalies-btn-pulse">
                      <AlertTriangle size={12} className="nav-anomalies-icon" />
                    </span>
                    <span className="nav-anomalies-btn-text">Anomaly Detection</span>
                    <span className="nav-anomalies-count-tag">
                      {anomaliesData.totalAnomalies || 0}
                    </span>
                  </button>
                )}

                {/* 📄 COMPACT & UNIQUE EXECUTIVE PDF REPORT BUTTON */}
                {hasData && (
                  <button
                    type="button"
                    className="nav-pdf-report-btn"
                    onClick={handleExportPDF}
                    disabled={isExportingPDF}
                    title="Export High-Definition 3-Page Executive PDF Analytics Report"
                  >
                    <FileText size={11} className="nav-pdf-icon" />
                    <span className="nav-pdf-btn-text">
                      {isExportingPDF ? (pdfProgress ? `PDF (${pdfProgress.step}/6)...` : 'Generating...') : 'Executive PDF'}
                    </span>
                    <span className="nav-pdf-badge">
                      {isExportingPDF ? <Loader2 size={9} className="animate-spin" /> : 'HD'}
                    </span>
                  </button>
                )}

                {/* 📊 MULTI-TAB EXECUTIVE EXCEL WORKBOOK BUTTON */}
                {hasData && (
                  <button
                    type="button"
                    className="nav-pdf-report-btn"
                    style={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))',
                      borderColor: 'rgba(16, 185, 129, 0.35)',
                      color: '#34d399'
                    }}
                    onClick={handleExportExcel}
                    title="Export Professional Multi-Tab Excel Workbook (.xlsx) with Summaries, Stats & Clean Data"
                  >
                    <FileSpreadsheet size={11} className="text-emerald-400" />
                    <span className="nav-pdf-btn-text" style={{ color: '#6ee7b7' }}>Executive Excel</span>
                    <span className="nav-pdf-badge" style={{ background: '#059669', color: '#ecfdf5' }}>XLSX</span>
                  </button>
                )}

                {/* 🏅 MEDALLION DATA LAKE EXPORTER BUTTON (BRONZE, SILVER, GOLD) */}
                {hasData && (
                  <button
                    type="button"
                    className="nav-pdf-report-btn"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.28))',
                      borderColor: 'rgba(245, 158, 11, 0.45)',
                      color: '#fbbf24'
                    }}
                    onClick={() => setIsMedallionModalOpen(true)}
                    title="Download Dataset in Bronze (Raw), Silver (Cleaned), or Gold (ML-Curated) Medallion Standard"
                  >
                    <Award size={11} className="text-amber-400" />
                    <span className="nav-pdf-btn-text" style={{ color: '#fcd34d' }}>Medallion Tiers</span>
                    <span className="nav-pdf-badge" style={{ background: '#d97706', color: '#fffbeb' }}>🥉🥈🥇</span>
                  </button>
                )}
              </div>

              {activeTab === 'dashboard' && (
                <Dashboard
                  dashboardMetrics={dashboardMetrics}
                  totalRows={totalRows}
                  filteredCount={filteredCount}
                  theme={theme}
                />
              )}

              {activeTab === 'live_users' && (
                <LiveUserTracker
                  liveStats={liveStats}
                  currentUser={currentUser}
                  onManualRefresh={refreshLiveStatsNow}
                />
              )}

              {activeTab === 'builder' && (
                <CustomChartBuilder
                  data={pageData}
                  headers={headers}
                  schema={schema}
                  theme={theme}
                />
              )}

              {activeTab === 'table' && (
                <DataTable
                  pageData={pageData}
                  headers={headers}
                  schema={schema}
                  filteredCount={filteredCount}
                  onPageChange={handlePageChange}
                  onExportCSV={handleExportCSV}
                />
              )}

              {activeTab === 'stats' && (
                <StatsOverview
                  stats={stats}
                  headers={headers}
                  schema={schema}
                />
              )}

              {activeTab === 'comparison' && (
                <ComparisonView
                  data={pageData}
                  headers={headers}
                  schema={schema}
                  stats={stats}
                  totalRows={totalRows}
                  healthScore={healthScore}
                  datasetName={datasetName}
                  datasetsList={datasetsList}
                  onSelectDataset={handleSelectHistoryDataset}
                  theme={theme}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* GDPR Cookie Consent & Data Privacy Banner */}
      <CookieConsentBanner />

      {/* 🧠 Suspense-wrapped Studio Modals */}
      <Suspense fallback={<ModalSuspenseLoader />}>
        {/* 🧠 Advanced AI-Powered Dataset Cleaning & Preprocessing Studio Modal */}
        {isCleaningStudioOpen && (
          <DataCleaningStudioModal
            isOpen={isCleaningStudioOpen}
            onClose={() => setIsCleaningStudioOpen(false)}
            data={pageData && pageData.length > 0 ? pageData : SAMPLE_DATASETS.workforce?.data}
            headers={headers && headers.length > 0 ? headers : SAMPLE_DATASETS.workforce?.headers}
            schema={schema}
            datasetName={datasetName || 'Active Dataset'}
            theme={theme}
            onApplyCleanedData={(cleanedRows, cleanedHeaders) => {
              if (!cleanedRows || cleanedRows.length === 0) return;
              setPageData(cleanedRows.slice(0, 100));
              setTotalRows(cleanedRows.length);
              setFilteredCount(cleanedRows.length);
              setHeaders(cleanedHeaders);
              setHealthScore(100);
              setMissingCells(0);
              setDuplicateCount(0);
              setCompletenessScore(100);
            }}
            onLaunchAutoML={(cleanedRows, cleanedHeaders) => {
              if (cleanedRows && cleanedRows.length > 0) {
                setPageData(cleanedRows.slice(0, 100));
                setTotalRows(cleanedRows.length);
                setFilteredCount(cleanedRows.length);
                setHeaders(cleanedHeaders);
              }
              setIsCleaningStudioOpen(false);
              setIsAutoMLOpen(true);
            }}
          />
        )}

        {/* AutoML Model Intelligence Engine Modal */}
        {isAutoMLOpen && (
          <AutoMLEngineModal 
            isOpen={isAutoMLOpen}
            onClose={() => setIsAutoMLOpen(false)}
            data={pageData && pageData.length > 0 ? pageData : SAMPLE_DATASETS.workforce?.data}
            headers={headers && headers.length > 0 ? headers : SAMPLE_DATASETS.workforce?.headers}
            schema={schema}
            datasetName={datasetName || 'Workforce Dataset'}
          />
        )}

        {/* 14-Stage End-to-End ML Workflow Pipeline Modal */}
        {isMLPipelineOpen && (
          <MLPipelineModal
            isOpen={isMLPipelineOpen}
            onClose={() => setIsMLPipelineOpen(false)}
            activeDatasetName={datasetName || 'Workforce Dataset'}
          />
        )}

        {/* Executive Summary & Deep Learning Architecture Intelligence Hub Modal */}
        {isDLExecutiveOpen && (
          <DeepLearningExecutiveModal
            isOpen={isDLExecutiveOpen}
            onClose={() => setIsDLExecutiveOpen(false)}
          />
        )}

        {/* Deep Learning Project Analysis Studio (Real-Time Learning, Training & Simulator) */}
        {isDLStudioOpen && (
          <DeepLearningStudioModal
            isOpen={isDLStudioOpen}
            onClose={() => setIsDLStudioOpen(false)}
            data={pageData && pageData.length > 0 ? pageData : SAMPLE_DATASETS.workforce?.data}
            headers={headers && headers.length > 0 ? headers : SAMPLE_DATASETS.workforce?.headers}
            schema={schema}
            datasetName={datasetName || 'Workforce Dataset'}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {/* Real-Time Workforce & Statistical Analytics Calculator Modal */}
        {isCalculatorOpen && (
          <RealtimeCalculatorModal
            isOpen={isCalculatorOpen}
            onClose={handleCloseCalculator}
            initialValue={calculatorInitialValue}
            initialMode={calculatorInitialMode}
            stats={stats}
            schema={schema}
            totalRows={totalRows}
            filteredRows={filteredCount}
            datasetName={datasetName || 'Workforce Dataset'}
            theme={theme}
          />
        )}

        {/* 📁 Dedicated Backend Storage Explorer & Disk Architecture Modal */}
        {isStorageModalOpen && (
          <StorageExplorerModal
            isOpen={isStorageModalOpen}
            onClose={() => setIsStorageModalOpen(false)}
            theme={theme}
          />
        )}

        {/* 🏅 Medallion Architecture Exporter Modal (Bronze, Silver, Gold) */}
        {isMedallionModalOpen && (
          <MedallionExportModal
            isOpen={isMedallionModalOpen}
            onClose={() => setIsMedallionModalOpen(false)}
            data={pageData && pageData.length > 0 ? pageData : SAMPLE_DATASETS.workforce?.data}
            headers={headers && headers.length > 0 ? headers : SAMPLE_DATASETS.workforce?.headers}
            schema={schema}
            datasetName={datasetName || 'Active Dataset'}
            theme={theme}
            onDownloadSuccess={(info) => setTransferPopup(info)}
          />
        )}
      </Suspense>

      {/* 📄 PDF GENERATION PROGRESS TOAST */}
      {isExportingPDF && pdfProgress && (
        <div className="pdf-generation-toast">
          <div className="pdf-toast-content">
            <Loader2 size={18} className="animate-spin text-pink-400" />
            <div className="pdf-toast-text">
              <strong style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                Generating Executive PDF Report ({pdfProgress.step}/{pdfProgress.total})
              </strong>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                {pdfProgress.message}
              </p>
            </div>
          </div>
          <div className="pdf-toast-progress-bar">
            <div
              className="pdf-toast-progress-fill"
              style={{ width: `${(pdfProgress.step / pdfProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* 🎉 UNIFIED TRANSFER INTELLIGENCE POPUP (UPLOAD & DOWNLOAD) */}
      {transferPopup && (
        <TransferNotificationPopup
          data={transferPopup}
          onClose={() => setTransferPopup(null)}
          onOpenDashboard={() => {
            setIsUploadMode(false);
            setIsHistoryMode(false);
            setIsLiveUsersMode(false);
            setActiveTab('dashboard');
          }}
          theme={theme}
        />
      )}
    </div>
  );
}
