import React, { useState, useRef, useEffect } from 'react';
import {
  BarChart3, Upload, Download, Layers, LogIn, LogOut, ShieldCheck, Sun, Moon,
  ArrowLeft, Menu, X, Database, Filter, Radio, Maximize2, Minimize2,
  Folder, ChevronDown, Sparkles, Cpu, Zap, Brain, BookOpen, FileText, Compass,
  Trash2, Plus, Search, FileSpreadsheet, Check, RefreshCw, RotateCcw, Mic, Calculator, HardDrive
} from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function Header({
  hasData,
  hasPreviousDataset,
  isUploadMode,
  isHistoryMode,
  isLiveUsersMode,
  isSidebarOpen = true,
  onToggleSidebar,
  isFiltered = false,
  datasetName,
  onUploadClick,
  onHistoryClick,
  onLiveUsersClick,
  onOpenStorageExplorer,
  savedDatasetsCount = 0,
  liveUsersCount = 0,
  onLoadSample,
  onResetData,
  onBackToDashboard,
  onExportCSV,
  onExportPDF,
  isExportingPDF = false,
  currentUser,
  onOpenLogin,
  onOpenProfile,
  onLogout,
  theme = 'dark',
  onToggleTheme,
  onSetTheme,
  onOpenDataCleaner,
  onOpenAutoML,
  onCloseAutoML,
  onOpenDLExecutive,
  onCloseDLExecutive,
  onOpenDLStudio,
  onCloseDLStudio,
  onOpenMLPipeline,
  onCloseMLPipeline,
  onOpenAnomalies,
  onCloseAnomalies,
  onOpenCalculator,
  activeTab,
  onSelectTab,
  filters,
  onFilterChange,
  onResetFilters,
  datasetsList = [],
  onSelectDataset,
  onDeleteDataset,
  onFileUpload,
  totalRows = 0,
  headersCount = 0,
  healthScore = 100
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAppFullScreen, setIsAppFullScreen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  const [isDatasetMenuOpen, setIsDatasetMenuOpen] = useState(false);
  const [datasetSearchTerm, setDatasetSearchTerm] = useState('');
  const folderRef = useRef(null);
  const datasetMenuRef = useRef(null);
  const quickFileInputRef = useRef(null);

  // In-app Delete Confirmation Modal State
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    dataset: null,
    isActiveDataset: false
  });
  const [isDeletingDataset, setIsDeletingDataset] = useState(false);

  const handleConfirmDeleteDataset = async () => {
    if (!deleteConfirmState.dataset) return;
    setIsDeletingDataset(true);
    try {
      if (deleteConfirmState.dataset.id && onDeleteDataset) {
        await onDeleteDataset(deleteConfirmState.dataset.id);
      }
      if (deleteConfirmState.isActiveDataset && onResetData) {
        onResetData();
      }
      setIsDatasetMenuOpen(false);
      setDeleteConfirmState({ isOpen: false, dataset: null, isActiveDataset: false });
    } catch (err) {
      console.error('Delete error in header:', err);
    } finally {
      setIsDeletingDataset(false);
    }
  };

  // Close dataset dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datasetMenuRef.current && !datasetMenuRef.current.contains(event.target)) {
        setIsDatasetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync fullscreen state with browser events (handles ESC key and browser toggles)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsAppFullScreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Close folder menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (folderRef.current && !folderRef.current.contains(event.target)) {
        setIsFolderOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleAppFullScreen = () => {
    try {
      const isCurrentlyFs = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );

      if (!isCurrentlyFs) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch((err) => console.warn('Fullscreen request failed:', err));
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch((err) => console.warn('Exit fullscreen failed:', err));
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('App Fullscreen error:', err.message);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="app-header">
      <div className="brand-section">
        <img src="/logo.png" alt="Sathya Logo" className="brand-gold-logo" />
        <div className="brand-text-container">
          <h1 className="brand-title">Corporate Access & Intelligence</h1>
          <p className="brand-subtitle">Enterprise Workforce & Data Analytics</p>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-menu-toggle-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div className={`header-actions ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Back button when in upload mode, history mode, or live users mode */}
        {(isUploadMode || isHistoryMode || isLiveUsersMode || !hasData) && hasPreviousDataset && (
          <button
            type="button"
            className="btn btn-secondary btn-back-unique"
            onClick={() => {
              onBackToDashboard();
              closeMobileMenu();
            }}
            title="Return back to active dataset dashboard"
          >
            <ArrowLeft size={12} />
            <span>Back to Dashboard</span>
          </button>
        )}

        {/* Loaded Dataset Hub Badge & Checkup Menu */}
        {hasData && !isUploadMode && !isHistoryMode && !isLiveUsersMode && (
          <div className="header-pill-item header-dataset-badge-container" ref={datasetMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className={`badge badge-blue header-dataset-badge header-dataset-interactive-btn ${isDatasetMenuOpen ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsDatasetMenuOpen(prev => !prev);
              }}
              title="Click to checkup active dataset, switch files, download or delete"
            >
              <Layers size={13} className="folder-icon flex-shrink-0" />
              <span className="truncate-text">{(datasetName || 'Loaded Dataset').replace(/\.[^/.]+$/, '').toUpperCase()}</span>
              {datasetsList && datasetsList.length > 1 && (
                <span className="header-dataset-count-pill">{datasetsList.length}</span>
              )}
              <ChevronDown size={11} className={`header-dataset-chevron ${isDatasetMenuOpen ? 'rotate' : ''}`} />
            </button>

            {isDatasetMenuOpen && (
              <div className="header-dataset-hub-dropdown">
                {/* Active Dataset Checkup Section */}
                <div className="hub-active-checkup-card">
                  <div className="hub-active-header">
                    <div className="hub-active-icon">
                      <Database size={15} className="text-sky-400" />
                    </div>
                    <div className="hub-active-info">
                      <span className="hub-active-tag">CURRENT ACTIVE DATASET</span>
                      <h4 className="hub-active-name truncate" title={datasetName}>{datasetName}</h4>
                    </div>
                    {datasetsList && datasetsList.length > 1 && (
                      <button
                        type="button"
                        className="hub-cycle-dataset-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentIdx = datasetsList.findIndex(d => d.originalName === datasetName || d.savedName === datasetName);
                          const nextIdx = (currentIdx + 1) % datasetsList.length;
                          const nextDs = datasetsList[nextIdx];
                          if (nextDs && onSelectDataset) {
                            onSelectDataset(nextDs.id);
                          }
                        }}
                        title="Click circle arrow to immediately cycle to next dataset"
                      >
                        <RotateCcw size={13} className="hub-cycle-icon text-sky-400" />
                      </button>
                    )}
                  </div>

                  <div className="hub-checkup-stats-row">
                    <div className="hub-checkup-stat">
                      <span className="stat-num text-sky-400">{totalRows ? totalRows.toLocaleString() : 0}</span>
                      <span className="stat-lbl">Records</span>
                    </div>
                    <div className="hub-checkup-stat">
                      <span className="stat-num text-cyan-400">{headersCount || 0}</span>
                      <span className="stat-lbl">Features</span>
                    </div>
                    <div className="hub-checkup-stat">
                      <span className="stat-num text-emerald-400">{healthScore || 100}%</span>
                      <span className="stat-lbl">Health</span>
                    </div>
                  </div>

                  <div className="hub-active-actions-row">
                    <button
                      type="button"
                      className="hub-btn download-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onExportCSV) onExportCSV();
                      }}
                      title="Download active dataset"
                    >
                      <Download size={12} /> Download File
                    </button>
                    <button
                      type="button"
                      className="hub-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        const match = (datasetsList || []).find(d => d.originalName === datasetName || d.savedName === datasetName);
                        setDeleteConfirmState({
                          isOpen: true,
                          dataset: match || { id: null, originalName: datasetName || 'Active Dataset', rowCount: totalRows },
                          isActiveDataset: true
                        });
                      }}
                      title="Delete active dataset"
                    >
                      <Trash2 size={12} /> Delete File
                    </button>
                  </div>
                </div>

                {/* Switch Between Unlimited Uploaded Files */}
                <div className="hub-all-datasets-section">
                  <div className="hub-section-header">
                    <div className="hub-section-title">
                      <Layers size={13} className="text-purple-400" />
                      <span>All Uploaded Files ({datasetsList ? datasetsList.length : 0})</span>
                    </div>
                    <button
                      type="button"
                      className="hub-upload-mini-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        quickFileInputRef.current?.click();
                      }}
                      title="Upload additional dataset files"
                    >
                      <Plus size={12} /> Add Files
                    </button>
                  </div>

                  <input
                    type="file"
                    ref={quickFileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const files = Array.from(e.target.files);
                        if (onFileUpload) onFileUpload(files.length === 1 ? files[0] : files);
                        setIsDatasetMenuOpen(false);
                      }
                    }}
                    accept=".csv,.xlsx,.xls,.json,.tsv,.txt"
                    multiple
                    style={{ display: 'none' }}
                  />

                  {datasetsList && datasetsList.length > 3 && (
                    <div className="hub-search-box">
                      <Search size={12} className="text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search uploaded files..."
                        value={datasetSearchTerm}
                        onChange={(e) => setDatasetSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  <div className="hub-datasets-list-scroll">
                    {(!datasetsList || datasetsList.length === 0) ? (
                      <div className="hub-empty-state">
                        <p>No additional datasets saved on server.</p>
                      </div>
                    ) : (
                      datasetsList
                        .filter(ds => !datasetSearchTerm || (ds.originalName && ds.originalName.toLowerCase().includes(datasetSearchTerm.toLowerCase())))
                        .map(ds => {
                          const isActive = ds.originalName === datasetName || ds.savedName === datasetName;
                          return (
                            <div
                              key={ds.id}
                              className={`hub-dataset-row ${isActive ? 'active-row' : ''}`}
                              onClick={() => {
                                if (onSelectDataset) onSelectDataset(ds.id);
                                setIsDatasetMenuOpen(false);
                              }}
                              title={`Click to switch analysis to ${ds.originalName}`}
                            >
                              <div className="hub-row-left">
                                <FileSpreadsheet size={14} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
                                <div className="hub-row-details">
                                  <span className="hub-file-name truncate">{ds.originalName}</span>
                                  <span className="hub-file-meta">
                                    {ds.rowCount ? `${ds.rowCount.toLocaleString()} rows` : ''} {ds.fileSize ? `• ${ds.fileSize}` : ''}
                                  </span>
                                </div>
                              </div>

                              <div className="hub-row-actions" onClick={(e) => e.stopPropagation()}>
                                {/* Circle Arrow Quick Switch Button */}
                                <button
                                  type="button"
                                  className={`hub-row-icon-btn switch-circle-btn ${isActive ? 'active-switch' : ''}`}
                                  onClick={() => {
                                    if (onSelectDataset) onSelectDataset(ds.id);
                                    setIsDatasetMenuOpen(false);
                                  }}
                                  title={isActive ? 'Currently active dataset' : `Immediately switch active analysis to ${ds.originalName}`}
                                >
                                  <RefreshCw size={11} className={isActive ? 'text-emerald-400' : 'text-sky-400 circle-arrow-icon'} />
                                </button>
                                <a
                                  href={`/api/datasets/${ds.id}/download`}
                                  download
                                  className="hub-row-icon-btn download"
                                  title="Download dataset file"
                                >
                                  <Download size={11} />
                                </a>
                                <button
                                  type="button"
                                  className="hub-row-icon-btn delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmState({
                                      isOpen: true,
                                      dataset: ds,
                                      isActiveDataset: isActive
                                    });
                                  }}
                                  title="Delete dataset"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {/* UNIQUE ADVANCED FOLDER-LIKE AUTOML ENGINE BUTTON */}
        <div className="header-pill-item automl-folder-btn-container">
          <button
            id="header-btn-automl"
            type="button"
            className="btn header-folder-btn automl-header-folder-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onOpenAutoML) onOpenAutoML();
              closeMobileMenu();
            }}
            title="Open AI-Powered AutoML Model Selection & Prediction Platform"
            aria-label="Open AI-Powered AutoML Model Selection & Prediction Platform"
          >
            <Folder size={13} className="folder-icon text-cyan-400" />
            <span>AutoML Engine</span>
            <span className="automl-folder-ai-pill">
              <Zap size={7.5} className="inline mr-0.5" /> AI
            </span>
          </button>
        </div>

        {/* UNIQUE ADVANCED FOLDER-LIKE DEEP LEARNING PROJECT ANALYSIS STUDIO BUTTON */}
        <div className="header-pill-item dl-studio-btn-container">
          <button
            id="header-btn-dl-studio"
            type="button"
            className="btn header-folder-btn dl-studio-header-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onOpenDLStudio) onOpenDLStudio();
              closeMobileMenu();
            }}
            title="Open Deep Learning Project Analysis Studio (Real-Time Dataset Analysis, Training & Experimentation)"
            aria-label="Open Deep Learning Project Analysis Studio"
          >
            <Folder size={13} className="folder-icon text-violet-400" />
            <span>DL Studio</span>
            <span className="automl-folder-ai-pill dl-studio-ai-pill">
              <Brain size={7.5} className="inline mr-0.5 text-white" /> DEEP
            </span>
          </button>
        </div>


        {/* CONSOLIDATED TOOLS FOLDER DROPDOWN MENU NEAR LOGOUT */}
        <div className="header-pill-item folder-menu-container" ref={folderRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className={`btn header-folder-btn ${isFolderOpen ? 'active' : ''}`}
            onClick={() => setIsFolderOpen(prev => !prev)}
            title="Open System Tools & Actions Folder"
          >
            <Folder size={13} className="folder-icon" />
            <span>System Folder</span>
            <ChevronDown size={12} className={`folder-chevron ${isFolderOpen ? 'rotate' : ''}`} />
          </button>

          {/* Folder Dropdown Content */}
          {isFolderOpen && (
            <div className="folder-dropdown-menu">
              <div className="folder-dropdown-header">
                <div className="folder-header-title">
                  <Folder size={14} style={{ color: '#6366f1' }} />
                  <span>System Folder</span>
                </div>
                <span className="folder-header-sub">System Tools &amp; Dataset Management</span>
              </div>

              {/* Data & Storage Section */}
              <div className="folder-section">
                <div className="folder-section-label">DATASET MANAGEMENT</div>
                <div className="folder-items-grid">
                  {/* Dataset History */}
                  <button
                    type="button"
                    className={`folder-item-btn ${isHistoryMode ? 'active' : ''}`}
                    onClick={() => {
                      if (onHistoryClick) onHistoryClick();
                      setIsFolderOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    <div className="folder-item-icon-box cyan">
                      <Database size={15} />
                    </div>
                    <div className="folder-item-text">
                      <span className="item-title">Dataset History</span>
                      <span className="item-desc">Stored server files</span>
                    </div>
                    {savedDatasetsCount > 0 && (
                      <span className="folder-item-badge cyan">{savedDatasetsCount}</span>
                    )}
                  </button>

                  {hasData && (
                    <>
                      <button
                        type="button"
                        className="folder-item-btn"
                        onClick={() => {
                          onExportCSV();
                          setIsFolderOpen(false);
                          closeMobileMenu();
                        }}
                      >
                        <div className="folder-item-icon-box emerald">
                          <Download size={15} />
                        </div>
                        <div className="folder-item-text">
                          <span className="item-title">Export Filtered CSV</span>
                          <span className="item-desc">Download active processed data</span>
                        </div>
                        <span className="folder-item-badge emerald">CSV</span>
                      </button>

                      <button
                        type="button"
                        className="folder-item-btn"
                        onClick={() => {
                          if (onExportPDF) onExportPDF();
                          setIsFolderOpen(false);
                          closeMobileMenu();
                        }}
                        disabled={isExportingPDF}
                      >
                        <div className="folder-item-icon-box rose">
                          <FileText size={15} />
                        </div>
                        <div className="folder-item-text">
                          <span className="item-title">Executive PDF Report</span>
                          <span className="item-desc">Download multi-page presentation</span>
                        </div>
                        <span className="folder-item-badge rose">PDF</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* System & Analytics Section */}
              <div className="folder-section border-top">
                <div className="folder-section-label">AI &amp; DEEP LEARNING INTELLIGENCE</div>
                <div className="folder-items-grid">
                  <button
                    type="button"
                    className="folder-item-btn"
                    onClick={() => {
                      if (onOpenDLStudio) onOpenDLStudio();
                      setIsFolderOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    <div className="folder-item-icon-box purple">
                      <Sparkles size={15} />
                    </div>
                    <div className="folder-item-text">
                      <span className="item-title">DL Project Analysis Studio</span>
                      <span className="item-desc">Real-time deep learning pipeline</span>
                    </div>
                    <span className="folder-item-badge purple">PRO</span>
                  </button>

                  <button
                    type="button"
                    className="folder-item-btn"
                    onClick={() => {
                      if (onOpenDLExecutive) onOpenDLExecutive();
                      setIsFolderOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    <div className="folder-item-icon-box violet">
                      <Brain size={15} />
                    </div>
                    <div className="folder-item-text">
                      <span className="item-title">DL Architecture &amp; Summary</span>
                      <span className="item-desc">Executive guide &amp; matrix</span>
                    </div>
                    <span className="folder-item-badge violet">DOCS</span>
                  </button>

                  <a
                    href="/Corporate_Access_Intelligence_System_Total_Implementation_Plan.pdf"
                    download="Corporate_Access_Intelligence_System_Total_Implementation_Plan.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="folder-item-btn"
                    onClick={() => {
                      setIsFolderOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    <div className="folder-item-icon-box sky">
                      <BookOpen size={15} />
                    </div>
                    <div className="folder-item-text">
                      <span className="item-title">Total Implementation Plan</span>
                      <span className="item-desc">Download complete 5-page blueprint</span>
                    </div>
                    <span className="folder-item-badge sky">PDF</span>
                  </a>

                  <button
                    type="button"
                    className="folder-item-btn"
                    onClick={() => {
                      if (onOpenAutoML) onOpenAutoML();
                      setIsFolderOpen(false);
                      closeMobileMenu();
                    }}
                  >
                    <div className="folder-item-icon-box cyan">
                      <Cpu size={15} />
                    </div>
                    <div className="folder-item-text">
                      <span className="item-title">AutoML Studio</span>
                      <span className="item-desc">Interactive model training &amp; SHAP</span>
                    </div>
                    <span className="folder-item-badge cyan">AI</span>
                  </button>
                </div>
              </div>

              {/* AI Voice Control & Assistant Section */}
              <div className="folder-section border-top">
                <div className="folder-section-label">AI VOICE CONTROL & ASSISTANT</div>
                <VoiceAssistant
                  embedded={true}
                  activeTab={activeTab}
                  onSelectTab={onSelectTab}
                  onOpenAutoML={onOpenAutoML}
                  onCloseAutoML={onCloseAutoML}
                  onOpenDLStudio={onOpenDLStudio}
                  onCloseDLStudio={onCloseDLStudio}
                  onOpenDLExecutive={onOpenDLExecutive}
                  onCloseDLExecutive={onCloseDLExecutive}
                  onOpenMLPipeline={onOpenMLPipeline}
                  onCloseMLPipeline={onCloseMLPipeline}
                  onOpenAnomalies={onOpenAnomalies}
                  onCloseAnomalies={onCloseAnomalies}
                  onOpenCalculator={onOpenCalculator}
                  onOpenProfile={onOpenProfile}
                  onUploadClick={onUploadClick}
                  onHistoryClick={onHistoryClick}
                  onLiveUsersClick={onLiveUsersClick}
                  onLoadSample={onLoadSample}
                  onBackToDashboard={onBackToDashboard}
                  datasetsList={datasetsList}
                  onSelectDataset={onSelectDataset}
                  datasetName={datasetName}
                  onExportPDF={onExportPDF}
                  onExportCSV={onExportCSV}
                  theme={theme}
                  onToggleTheme={onToggleTheme}
                  onSetTheme={onSetTheme}
                  onLogout={onLogout}
                  filters={filters}
                  onFilterChange={onFilterChange}
                  onResetFilters={onResetFilters}
                  isSidebarOpen={isSidebarOpen}
                  onToggleSidebar={onToggleSidebar}
                />
              </div>

              {/* System & Monitoring Section */}
              <div className="folder-section border-top">
                <div className="folder-section-label">SYSTEM & MONITORING</div>

                <button
                  type="button"
                  className={`folder-item-btn ${isLiveUsersMode ? 'active' : ''}`}
                  onClick={() => {
                    if (onLiveUsersClick) onLiveUsersClick();
                    setIsFolderOpen(false);
                    closeMobileMenu();
                  }}
                >
                  <Radio size={13} style={{ color: '#10b981' }} className="animate-pulse" />
                  <div className="folder-item-text">
                    <span className="item-title">Live Website Users</span>
                    <span className="item-desc">Real-time active connections</span>
                  </div>
                  <span className="folder-item-badge green">{liveUsersCount}</span>
                </button>

                <button
                  type="button"
                  className="folder-item-btn"
                  onClick={() => {
                    onToggleTheme();
                    setIsFolderOpen(false);
                  }}
                >
                  {theme === 'dark' ? <Sun size={13} style={{ color: '#f59e0b' }} /> : <Moon size={13} style={{ color: '#6366f1' }} />}
                  <div className="folder-item-text">
                    <span className="item-title">Switch Theme</span>
                    <span className="item-desc">Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="folder-item-btn"
                  onClick={() => {
                    toggleAppFullScreen();
                    setIsFolderOpen(false);
                  }}
                >
                  {isAppFullScreen ? <Minimize2 size={13} style={{ color: '#10b981' }} /> : <Maximize2 size={13} style={{ color: '#10b981' }} />}
                  <div className="folder-item-text">
                    <span className="item-title">{isAppFullScreen ? 'Exit Full Screen' : 'Full Screen View'}</span>
                    <span className="item-desc">Toggle display mode</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Badge */}
        <div className="user-auth-wrapper">
          {currentUser ? (
            <div className="user-profile-badge" title="Click to View Personal Profile & Login Activity System">
              <div
                className="user-avatar-trigger"
                onClick={() => {
                  if (onOpenProfile) onOpenProfile();
                  closeMobileMenu();
                }}
              >
                <div className="user-avatar">
                  {currentUser.photo ? (
                    <img 
                      src={currentUser.photo} 
                      alt={currentUser.name} 
                      className="header-user-avatar-img" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.header-avatar-fallback');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className="header-avatar-fallback"
                    style={{ 
                      display: currentUser.photo ? 'none' : 'flex',
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {currentUser.avatar || 'US'}
                  </span>
                </div>

                <div className="user-info">
                  <span className="user-name">{currentUser.name}</span>
                  <span className="user-role-badge">
                    <ShieldCheck size={10} className="inline mr-0.5 text-emerald-400" />
                    {currentUser.role || 'Authorized User'}
                  </span>
                </div>
              </div>

              <button
                className="logout-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                  closeMobileMenu();
                }}
                title="Logout of current session"
              >
                <LogOut size={11} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary login-trigger-btn"
              onClick={() => {
                onOpenLogin();
                closeMobileMenu();
              }}
            >
              <LogIn size={16} /> Log In
            </button>
          )}
        </div>
      </div>

      {/* 🗑️ UNIQUE GLASSMORPHIC DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={deleteConfirmState.isOpen}
        onClose={() => !isDeletingDataset && setDeleteConfirmState({ isOpen: false, dataset: null, isActiveDataset: false })}
        onConfirm={handleConfirmDeleteDataset}
        isDeleting={isDeletingDataset}
        title={deleteConfirmState.isActiveDataset ? `Delete Active Dataset?` : `Delete Stored Dataset?`}
        subtitle="Permanent Server Storage Purge"
        itemName={deleteConfirmState.dataset?.originalName || datasetName || 'Dataset'}
        itemType="dataset"
        targetCount={1}
        storagePath="uploads/datasets/"
        recordsCount={deleteConfirmState.dataset?.rowCount}
        fileSize={deleteConfirmState.dataset?.fileSize}
        theme={theme}
      />
    </header>
  );
}

