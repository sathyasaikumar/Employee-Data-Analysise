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
import { SAMPLE_DATASETS } from './utils/sampleData';
import { getStoredUser, logoutUser } from './utils/auth';
import { startSession, endActiveSession } from './utils/activityTracker';
import { startLiveTracking, stopLiveTracking, subscribeToLiveStats, refreshLiveStatsNow } from './utils/liveTracker';
import { convertFileToCsvContent } from './utils/fileConverter';
import {
  fetchDatasetHistory,
  uploadDatasetFile,
  fetchDatasetById,
  deleteDatasetById,
  deleteAllDatasets,
  deleteDatasetsBulk,
  seedSampleDatasets
} from './utils/api';
import { LayoutDashboard, Sliders, Table as TableIcon, Calculator, GitCompare, Loader2, Filter, Radio } from 'lucide-react';

export default function App() {
  const [totalRows, setTotalRows] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [headers, setHeaders] = useState([]);
  const [schema, setSchema] = useState({});
  const [stats, setStats] = useState({});
  const [healthScore, setHealthScore] = useState(100);
  const [missingCells, setMissingCells] = useState(0);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [completenessScore, setCompletenessScore] = useState(100);
  const [anomaliesData, setAnomaliesData] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [pageData, setPageData] = useState([]);

  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeLevel, setActiveLevel] = useState('all'); // 'all' | 'low' | 'medium' | 'high'
  const [isLoading, setIsLoading] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ text: '', rowCount: 0 });

  // Sidebar Visibility State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Mode States
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [isLiveUsersMode, setIsLiveUsersMode] = useState(false);
  const [liveStats, setLiveStats] = useState(null);
  const [datasetsList, setDatasetsList] = useState([]);

  // Mobile Filter Drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // User Auth & Profile Modal State
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // AutoML Model Intelligence Engine Modal State
  const [isAutoMLOpen, setIsAutoMLOpen] = useState(false);
  const [isMLPipelineOpen, setIsMLPipelineOpen] = useState(false);
  const [isDLExecutiveOpen, setIsDLExecutiveOpen] = useState(false);
  const [isDLStudioOpen, setIsDLStudioOpen] = useState(false);

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

    refreshDatasetsHistory();

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

  useEffect(() => {
    handleLoadSample('workforce');
  }, []);

  const processWithWorker = (payload, name) => {
    setIsLoading(true);
    setError(null);
    setProgressInfo({ text: 'Parsing & processing multi-million row dataset...', rowCount: 0 });

    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(new URL('./workers/csvWorker.js', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, rowCount, status, totalRows, filteredCount, headers, schema, stats, healthScore, dashboardMetrics, pageData, message } = e.data;

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
        setHealthScore(healthScore);
        setMissingCells(mCells || 0);
        setDuplicateCount(dCount || 0);
        setCompletenessScore(cScore !== undefined ? cScore : 100);
        setAnomaliesData(anomalies || null);
        setDashboardMetrics(dashboardMetrics);
        setPageData(pageData);
        setDatasetName(name);

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

  // Upload file to backend server disk & analyze
  const handleFileSelect = async (file) => {
    try {
      setIsLoading(true);
      setError(null);
      setProgressInfo({ text: `Analyzing dataset structures for ${file.name}...`, rowCount: 0 });

      // 1. Immediately start high-speed Web Worker analysis directly in browser (non-blocking)
      const converted = await convertFileToCsvContent(file);
      if (converted.csvContent) {
        processWithWorker({ rawCsv: converted.csvContent }, converted.datasetName);
      } else {
        processWithWorker({ file: converted.file || file }, converted.datasetName || file.name);
      }

      // 2. Concurrently save to server storage (uploads/datasets/) in background & refresh history
      try {
        await uploadDatasetFile(file);
        await refreshDatasetsHistory();
      } catch (backendErr) {
        console.warn('Backend API background save notice:', backendErr.message);
        await refreshDatasetsHistory();
      }
    } catch (err) {
      setError(`Failed to read/upload file ${file.name}: ${err.message}`);
      setIsLoading(false);
    }
  };

  // Load dataset from History by ID
  const handleSelectHistoryDataset = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      setProgressInfo({ text: 'Reading stored dataset from uploads/datasets/...', rowCount: 0 });

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
        hasData={hasData && !isLoading}
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
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenMLPipeline={() => setIsMLPipelineOpen(true)}
        onOpenAutoML={() => setIsAutoMLOpen(true)}
        onOpenDLExecutive={() => setIsDLExecutiveOpen(true)}
        onOpenDLStudio={() => setIsDLStudioOpen(true)}
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
            />
          </>
        )}

        <div className="content-area">
          {hasData && !isUploadMode && !isHistoryMode && !isLiveUsersMode && !isLoading && (
            <div className="mobile-filter-bar">
              <button
                type="button"
                className="mobile-filter-trigger-btn"
                onClick={() => {
                  setIsSidebarOpen(true);
                  setIsMobileFilterOpen(true);
                }}
              >
                <Filter size={16} />
                <span>Filter Options</span>
                {isFiltered && (
                  <span className="mobile-filter-count-badge">Filtered</span>
                )}
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="dropzone-container" style={{ cursor: 'default' }}>
              <div className="upload-icon-circle" style={{ animation: 'spin 1.5s linear infinite' }}>
                <Loader2 size={36} />
              </div>
              <h2 className="dropzone-title">Processing Dataset...</h2>
              <p className="dropzone-subtitle">{progressInfo.text}</p>
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
          ) : (!hasData || isUploadMode) ? (
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
    </div>
  );
}
