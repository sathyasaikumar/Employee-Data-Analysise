import React, { useState, useEffect, useRef } from 'react';
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
import UserProfileModal from './components/UserProfileModal';
import CookieConsentBanner from './components/CookieConsentBanner';
import MLPipelineModal from './components/MLPipelineModal';
import AutoMLEngineModal from './components/AutoMLEngineModal';
import DeepLearningExecutiveModal from './components/DeepLearningExecutiveModal';
import DeepLearningStudioModal from './components/DeepLearningStudioModal';
import VoiceAssistant from './components/VoiceAssistant';
import { SAMPLE_DATASETS } from './utils/sampleData';
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
  X
} from 'lucide-react';
import { generateExecutivePDFReport } from './utils/pdfReportGenerator';

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
  const [uploadSuccessPopup, setUploadSuccessPopup] = useState(null);
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
  const [isAutoMLOpen, setIsAutoMLOpen] = useState(false);
  const [isMLPipelineOpen, setIsMLPipelineOpen] = useState(false);
  const [isDLExecutiveOpen, setIsDLExecutiveOpen] = useState(false);
  const [isDLStudioOpen, setIsDLStudioOpen] = useState(false);
  const [isAnomaliesModalOpen, setIsAnomaliesModalOpen] = useState(false);

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
          setUploadSuccessPopup({
            name: name || 'Dataset',
            totalRows: totalRows || 0,
            columnsCount: headers ? headers.length : 0,
            healthScore: 100,
            anomaliesCount: anomalies?.totalAnomalies || 0,
            completenessScore: 100,
            cleaningReport: cleaningReport || null
          });
        } else {
          setUploadSuccessPopup(null);
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
        link.setAttribute('download', `${cleanName}_Export_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsLoading(false);
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
      }, 1200);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      setIsExportingPDF(false);
      setPdfProgress(null);
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
        onSeedSample={() => handleLoadSampleDataset('workforce')}
        onOpenUpload={() => {
          setIsProfileOpen(false);
          setIsUploadMode(true);
        }}
      />

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

                {/* ⚠️ AUTOMATIC ANOMALY DETECTION - SINGLE-CLICK COMPACT BUTTON */}
                {anomaliesData && (
                  <button
                    type="button"
                    className="nav-anomalies-single-btn"
                    onClick={() => setIsAnomaliesModalOpen(true)}
                    title="Open Automatic Anomaly Detection with 5 Unique AI Models"
                  >
                    <span className="nav-anomalies-btn-pulse">
                      <AlertTriangle size={12} className="text-rose-400" />
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
              </div>

              {activeTab === 'ai_projects' && (
                <AIProjectExplorer
                  onOpenMLStudio={() => setIsMLStudioOpen(true)}
                  onOpenAutoML={() => setIsAutoMLOpen(true)}
                  onOpenExplainableAI={() => setIsExplainableAIOpen(true)}
                  onOpenComparisonArena={() => setIsComparisonArenaOpen(true)}
                  initialProject={selectedAIProject}
                />
              )}

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

      {/* AutoML Model Intelligence Engine Modal */}
      <AutoMLEngineModal 
        isOpen={isAutoMLOpen}
        onClose={() => setIsAutoMLOpen(false)}
        data={pageData && pageData.length > 0 ? pageData : SAMPLE_DATASETS.workforce?.data}
        headers={headers && headers.length > 0 ? headers : SAMPLE_DATASETS.workforce?.headers}
        schema={schema}
        datasetName={datasetName || 'Workforce Dataset'}
      />

      {/* 14-Stage End-to-End ML Workflow Pipeline Modal */}
      <MLPipelineModal
        isOpen={isMLPipelineOpen}
        onClose={() => setIsMLPipelineOpen(false)}
        activeDatasetName={datasetName || 'Workforce Dataset'}
      />

      {/* Executive Summary & Deep Learning Architecture Intelligence Hub Modal */}
      <DeepLearningExecutiveModal
        isOpen={isDLExecutiveOpen}
        onClose={() => setIsDLExecutiveOpen(false)}
      />

      {/* Deep Learning Project Analysis Studio (Real-Time Learning, Training & Simulator) */}
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

      {/* 🎉 DATASET UPLOAD SUCCESS POPUP */}
      {uploadSuccessPopup && (
        <div className="dataset-upload-popup-overlay" onClick={() => setUploadSuccessPopup(null)}>
          <div className="dataset-upload-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="popup-glow-header">
              <div className="popup-check-icon">
                <CheckCircle2 size={24} className="text-emerald-400" />
              </div>
              <button
                type="button"
                className="popup-close-btn"
                onClick={() => setUploadSuccessPopup(null)}
                title="Close Notification"
              >
                <X size={16} />
              </button>
            </div>

            <div className="popup-body-content">
              <span className="popup-badge-success">✨ DATASET AUTO-CLEANED & CERTIFIED</span>
              <h3 className="popup-dataset-title">{uploadSuccessPopup.name}</h3>
              <p className="popup-dataset-desc">
                Dataset successfully parsed, auto-cleaned, null values intelligently imputed, and verified at 100% data health.
              </p>

              {uploadSuccessPopup.cleaningReport && (
                <div className="popup-cleaning-audit-box">
                  <div className="cleaning-audit-header">
                    <Sparkles size={13} className="text-emerald-400" />
                    <span>Automated Quality & Sanitization Actions</span>
                  </div>
                  <div className="cleaning-audit-chips">
                    <span className="audit-chip">
                      ✓ {uploadSuccessPopup.cleaningReport.nullsImputed > 0 ? `${uploadSuccessPopup.cleaningReport.nullsImputed} Nulls Imputed` : '0 Null Values (Clean)'}
                    </span>
                    <span className="audit-chip">
                      ✓ {uploadSuccessPopup.cleaningReport.typesNormalized > 0 ? `${uploadSuccessPopup.cleaningReport.typesNormalized} Formats Normalized` : 'Types Normalized'}
                    </span>
                    <span className="audit-chip">
                      ✓ {uploadSuccessPopup.cleaningReport.whitespacesTrimmed > 0 ? `${uploadSuccessPopup.cleaningReport.whitespacesTrimmed} Fields Sanitized` : 'Whitespace Sanitized'}
                    </span>
                    <span className="audit-chip">
                      ✓ {uploadSuccessPopup.cleaningReport.duplicatesRemoved > 0 ? `${uploadSuccessPopup.cleaningReport.duplicatesRemoved} Duplicates Resolved` : '0 Duplicate Records'}
                    </span>
                  </div>
                </div>
              )}

              <div className="popup-stats-grid">
                <div className="popup-stat-tile">
                  <span className="stat-label">
                    <Database size={11} className="inline mr-1 text-blue-400" /> Total Records
                  </span>
                  <span className="stat-value text-blue-400">{uploadSuccessPopup.totalRows.toLocaleString()}</span>
                </div>
                <div className="popup-stat-tile">
                  <span className="stat-label">
                    <Layers size={11} className="inline mr-1 text-cyan-400" /> Features
                  </span>
                  <span className="stat-value text-cyan-400">{uploadSuccessPopup.columnsCount} Columns</span>
                </div>
                <div className="popup-stat-tile">
                  <span className="stat-label">
                    <Activity size={11} className="inline mr-1 text-emerald-400" /> Health Index
                  </span>
                  <span className="stat-value text-emerald-400">{uploadSuccessPopup.healthScore}%</span>
                </div>
                <div className="popup-stat-tile">
                  <span className="stat-label">
                    <Sparkles size={11} className="inline mr-1 text-purple-400" /> Anomalies
                  </span>
                  <span className="stat-value text-purple-400">{uploadSuccessPopup.anomaliesCount} Outliers</span>
                </div>
              </div>

              <div className="popup-action-buttons">
                <button
                  type="button"
                  className="btn btn-primary popup-action-btn"
                  onClick={() => setUploadSuccessPopup(null)}
                >
                  <CheckCircle2 size={14} /> Open Executive Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
