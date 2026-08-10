import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import SidebarFilters from './components/SidebarFilters';
import KPICards from './components/KPICards';
import Dashboard from './components/Dashboard';
import CustomChartBuilder from './components/CustomChartBuilder';
import DataTable from './components/DataTable';
import StatsOverview from './components/StatsOverview';
import ComparisonView from './components/ComparisonView';
import LoginModal from './components/LoginModal';
import LoginPage from './components/LoginPage';
import { SAMPLE_DATASETS } from './utils/sampleData';
import { getStoredUser, logoutUser } from './utils/auth';
import { convertFileToCsvContent } from './utils/fileConverter';
import { LayoutDashboard, Sliders, Table as TableIcon, Calculator, GitCompare, Loader2, Filter } from 'lucide-react';

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

  // Mobile Filter Drawer state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // User Auth & Full Page View State
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

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

  useEffect(() => {
    // Check initial user authentication session
    const saved = getStoredUser();
    if (saved) {
      setCurrentUser(saved);
    }
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

  // Upload mode & navigation state
  const [isUploadMode, setIsUploadMode] = useState(false);

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
        setError(message || 'Failed to parse CSV file.');
        setIsLoading(false);
      }
    };

    worker.onerror = (err) => {
      setError(err.message || 'Worker thread execution failed.');
      setIsLoading(false);
    };

    worker.postMessage({ action: 'PARSE', ...payload });
  };

  const handleFileSelect = async (file) => {
    try {
      setIsLoading(true);
      setProgressInfo({ text: `Reading & converting ${file.name}...`, rowCount: 0 });
      const converted = await convertFileToCsvContent(file);
      if (converted.csvContent) {
        processWithWorker({ rawCsv: converted.csvContent }, converted.datasetName);
      } else {
        processWithWorker({ file: converted.file }, converted.datasetName);
      }
    } catch (err) {
      setError(`Failed to read file ${file.name}: ${err.message}`);
      setIsLoading(false);
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
      setProgressInfo({ text: 'Generating CSV file for instant download...', rowCount: filteredCount });
      workerRef.current.postMessage({ action: 'EXPORT_CSV' });
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsGuestMode(false);
    setIsLoginOpen(true);
  };

  const hasData = totalRows > 0;

  // Render Full Page Login Page when unauthenticated or requested
  if ((!currentUser && !isGuestMode) || isLoginOpen) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginOpen(false);
          setIsGuestMode(false);
        }}
        onGuestAccess={() => {
          setIsGuestMode(true);
          setIsLoginOpen(false);
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
        datasetName={datasetName}
        onUploadClick={() => setIsUploadMode(true)}
        onLoadSample={(sampleKey) => {
          setIsUploadMode(false);
          handleLoadSample(sampleKey);
        }}
        onResetData={() => setIsUploadMode(true)}
        onBackToDashboard={() => setIsUploadMode(false)}
        onExportCSV={handleExportCSV}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="main-layout">
        {hasData && !isUploadMode && !isLoading && (
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
          {hasData && !isUploadMode && !isLoading && (
            <div className="mobile-filter-bar">
              <button 
                type="button" 
                className="mobile-filter-trigger-btn"
                onClick={() => setIsMobileFilterOpen(true)}
              >
                <Filter size={16} />
                <span>Filter Options</span>
                {filteredCount !== totalRows && (
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
          ) : (!hasData || isUploadMode) ? (
            <FileUpload 
              onFileSelect={(file) => {
                setIsUploadMode(false);
                handleFileSelect(file);
              }}
              onLoadSample={(sampleKey) => {
                setIsUploadMode(false);
                handleLoadSample(sampleKey);
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
              />

              <div className="nav-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={16} /> Executive Dashboard
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
                  onClick={() => setActiveTab('builder')}
                >
                  <Sliders size={16} /> Custom Visual Studio
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                  onClick={() => setActiveTab('table')}
                >
                  <TableIcon size={16} /> Data Explorer Table ({filteredCount.toLocaleString()})
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <Calculator size={16} /> Statistical Profiling
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comparison')}
                >
                  <GitCompare size={16} /> Comparison Analysis
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
    </div>
  );
}
