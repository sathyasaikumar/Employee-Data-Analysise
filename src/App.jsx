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
import { LayoutDashboard, Sliders, Table as TableIcon, Calculator, GitCompare, Loader2 } from 'lucide-react';

export default function App() {
  const [totalRows, setTotalRows] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);
  const [headers, setHeaders] = useState([]);
  const [schema, setSchema] = useState({});
  const [stats, setStats] = useState({});
  const [healthScore, setHealthScore] = useState(100);
  const [datasetName, setDatasetName] = useState('');
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [pageData, setPageData] = useState([]);
  
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeLevel, setActiveLevel] = useState('all'); // 'all' | 'low' | 'medium' | 'high'
  const [isLoading, setIsLoading] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ text: '', rowCount: 0 });

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
        setTotalRows(totalRows);
        setFilteredCount(filteredCount);
        setHeaders(headers);
        setSchema(schema);
        setStats(stats);
        setHealthScore(healthScore);
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
      } else if (type === 'FILTER_RESULT') {
        setFilteredCount(e.data.filteredCount);
        setDashboardMetrics(e.data.dashboardMetrics);
        setPageData(e.data.pageData);
      } else if (type === 'PAGE_RESULT') {
        setPageData(e.data.pageData);
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

  const handleFileSelect = (file) => {
    processWithWorker({ file }, file.name);
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
    alert(`Exporting ${filteredCount.toLocaleString()} records...`);
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
        datasetName={datasetName}
        onUploadClick={() => setTotalRows(0)}
        onLoadSample={handleLoadSample}
        onResetData={() => setTotalRows(0)}
        onExportCSV={handleExportCSV}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="main-layout">
        {hasData && !isLoading && (
          <SidebarFilters 
            headers={headers}
            schema={schema}
            stats={stats}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetFilters={handleResetFilters}
          />
        )}

        <div className="content-area">
          {isLoading ? (
            <div className="dropzone-container" style={{ cursor: 'default' }}>
              <div className="upload-icon-circle" style={{ animation: 'spin 1.5s linear infinite' }}>
                <Loader2 size={36} />
              </div>
              <h2 className="dropzone-title">Processing Dataset...</h2>
              <p className="dropzone-subtitle">{progressInfo.text}</p>
            </div>
          ) : !hasData ? (
            <FileUpload 
              onFileSelect={handleFileSelect}
              onLoadSample={handleLoadSample}
              error={error}
            />
          ) : (
            <>
              <KPICards 
                totalRows={totalRows}
                filteredRows={filteredCount}
                healthScore={healthScore}
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
