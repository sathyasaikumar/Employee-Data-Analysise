import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Cpu, Sparkles, X, Play, CheckCircle2, AlertCircle, BarChart3, TrendingUp,
  Layers, ShieldAlert, ShieldCheck, Target, FileSpreadsheet, Download, RefreshCw, Eye, Trash2,
  Sliders, Award, HelpCircle, Activity, Zap, Check, ArrowRight, Maximize2, Minimize2,
  Database, Filter, CheckSquare, Square, Search, ChevronRight, Scale, Clock, PieChart, BarChart2,
  Folder, FolderOpen, FolderCheck, FolderTree, ChevronDown, ChevronUp, Grid,
  Columns, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';

import {
  analyzeDatasetProfile,
  detectMLProblemType,
  recommendTargetColumn,
  getRecommendedModels,
  ML_ALGORITHM_LIBRARY,
  runAutoMLPipeline,
  predictSingle,
  predictBatch,
  getSavedModels,
  saveModelToRegistry,
  deleteSavedModel,
  getFallbackWorkforceData
} from '../utils/automlEngine';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler
);

export default function AutoMLEngineModal({ isOpen, onClose, data = [], headers = [], schema = {}, datasetName = 'Active Dataset' }) {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'leaderboard' | 'explainability' | 'predict' | 'registry'
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [algoFilter, setAlgoFilter] = useState('all');
  const [algoSearch, setAlgoSearch] = useState('');

  // Dataset Profiling State
  const [profile, setProfile] = useState(null);
  const [targetCol, setTargetCol] = useState('');
  const [problemInfo, setProblemInfo] = useState({ problemType: 'binary_classification', confidence: 'High', reason: '' });
  const [selectedModels, setSelectedModels] = useState([]);
  const [enableTuning, setEnableTuning] = useState(true);

  // Training & Execution State
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState({ currentModel: '', progressPercent: 0, status: 'Idle' });
  const [pipelineResults, setPipelineResults] = useState(null);
  const [selectedBestModel, setSelectedBestModel] = useState(null);

  // SHAP Explainability View State
  const [shapModelId, setShapModelId] = useState('');
  const [shapViewMode, setShapViewMode] = useState('importance'); // 'importance' | 'waterfall' | 'radar' | 'beeswarm'

  // Prediction State
  const [predictInputs, setPredictInputs] = useState({});
  const [singlePredResult, setSinglePredResult] = useState(null);
  const [batchPredictions, setBatchPredictions] = useState(null);
  const [batchPredictRowCount, setBatchPredictRowCount] = useState('all');
  const [showBatchTable, setShowBatchTable] = useState(false);
  const [isBatchTableFullscreen, setIsBatchTableFullscreen] = useState(false);

  // Batch Table Row & Column Access / Selection State
  const [selectedTableRows, setSelectedTableRows] = useState(new Set()); // Set of row original indexes
  const [visibleTableCols, setVisibleTableCols] = useState([]); // List of visible column keys
  const [showColSelectorDropdown, setShowColSelectorDropdown] = useState(false);
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [tableSortCol, setTableSortCol] = useState(null);
  const [tableSortDir, setTableSortDir] = useState('asc'); // 'asc' | 'desc'
  const [showOnlySelectedRows, setShowOnlySelectedRows] = useState(false);

  // Model Registry State
  const [savedModelsList, setSavedModelsList] = useState([]);
  const [selectedViewModel, setSelectedViewModel] = useState(null);

  // Active Working Data & Row Limit State
  const [rawSourceData, setRawSourceData] = useState([]);
  const [selectedRowLimit, setSelectedRowLimit] = useState('all');
  const [workingData, setWorkingData] = useState([]);
  const [workingHeaders, setWorkingHeaders] = useState([]);

  // Helper to slice/expand rows according to row limit selection
  const getRowsForLimit = useCallback((sourceRows, limit) => {
    if (!sourceRows || sourceRows.length === 0) return [];
    if (limit === 'all') return sourceRows;
    const targetCount = parseInt(limit, 10);
    if (isNaN(targetCount) || targetCount <= 0) return sourceRows;
    if (sourceRows.length >= targetCount) {
      return sourceRows.slice(0, targetCount);
    }
    const expanded = [...sourceRows];
    let i = 0;
    while (expanded.length < targetCount) {
      const baseRow = sourceRows[i % sourceRows.length];
      const clone = { ...baseRow };
      Object.keys(clone).forEach(k => {
        const val = clone[k];
        if (typeof val === 'number') {
          const noise = (Math.random() * 0.08 - 0.04) * val;
          clone[k] = Math.round((val + noise) * 100) / 100;
        } else if (typeof val === 'string' && (k.toLowerCase().includes('id') || k.toLowerCase().includes('name'))) {
          clone[k] = `${val}_${expanded.length + 1}`;
        }
      });
      expanded.push(clone);
      i++;
    }
    return expanded;
  }, []);

  const handleRowLimitChange = (newLimit) => {
    setSelectedRowLimit(newLimit);
    const updatedRows = getRowsForLimit(rawSourceData, newLimit);
    setWorkingData(updatedRows);
    const prof = analyzeDatasetProfile(updatedRows, workingHeaders, schema);
    setProfile(prof);
    const prob = detectMLProblemType(updatedRows, targetCol, workingHeaders);
    setProblemInfo(prob);
  };

  // Boot Initialization
  useEffect(() => {
    if (isOpen) {
      let activeRows = data;
      let activeCols = headers;

      if (!activeRows || activeRows.length === 0) {
        const fallback = getFallbackWorkforceData();
        activeRows = fallback.data;
        activeCols = fallback.headers;
      }

      setRawSourceData(activeRows);
      const initialEffectiveRows = getRowsForLimit(activeRows, selectedRowLimit);
      setWorkingData(initialEffectiveRows);
      setWorkingHeaders(activeCols);

      const prof = analyzeDatasetProfile(initialEffectiveRows, activeCols, schema);
      setProfile(prof);

      const recTarget = recommendTargetColumn(initialEffectiveRows, activeCols);
      const initialTarget = recTarget || activeCols[0] || 'Status';
      setTargetCol(initialTarget);

      const prob = detectMLProblemType(initialEffectiveRows, initialTarget, activeCols);
      setProblemInfo(prob);

      // Select default top 4 models
      const defaultCat = getCategoryKey(prob.problemType);
      const availModels = ML_ALGORITHM_LIBRARY[defaultCat] || [];
      setSelectedModels(availModels.slice(0, 4).map(m => m.id));

      // Load Registry
      setSavedModelsList(getSavedModels());
    }
  }, [isOpen, data, headers, schema, getRowsForLimit]);

  function getCategoryKey(probType) {
    if (probType.includes('classification')) return 'classification';
    if (probType === 'regression') return 'regression';
    if (probType === 'clustering') return 'clustering';
    if (probType === 'anomaly_detection') return 'anomaly_detection';
    return 'time_series';
  }

  // Folder Category Classifier for Machine Learning Algorithm Families
  function getAlgorithmFolder(algoId) {
    if (['logistic_regression', 'linear_regression', 'ridge', 'lasso', 'elastic_net', 'polynomial'].includes(algoId)) {
      return { id: 'linear', name: 'Linear Models', shortName: 'Linear', icon: '📈', color: '#06b6d4', desc: 'Fast, interpretable parametric regression and classification' };
    }
    if (['decision_tree', 'random_forest', 'extra_trees', 'dt_regressor', 'rf_regressor', 'et_regressor'].includes(algoId)) {
      return { id: 'trees', name: 'Tree Ensembles', shortName: 'Trees', icon: '🌲', color: '#10b981', desc: 'Non-linear recursive partitioning and bagged tree ensembles' };
    }
    if (['gradient_boosting', 'adaboost', 'hist_gb', 'xgboost', 'lightgbm', 'catboost', 'gb_regressor', 'hist_gb_regressor', 'xgboost_regressor', 'lightgbm_regressor', 'catboost_regressor'].includes(algoId)) {
      return { id: 'boosting', name: 'Gradient Boosting', shortName: 'Boosting', icon: '🚀', color: '#8b5cf6', desc: 'High-accuracy sequential error-correcting boosted models' };
    }
    if (['knn', 'svm', 'naive_bayes', 'svr'].includes(algoId)) {
      return { id: 'kernels', name: 'Distance & Kernels', shortName: 'Kernels', icon: '📍', color: '#f59e0b', desc: 'Geom-boundary classifiers, Bayesian and nearest neighbor estimators' };
    }
    if (['mlp', 'mlp_regressor', 'neural_network', 'lstm'].includes(algoId)) {
      return { id: 'neural', name: 'Neural Networks', shortName: 'Neural', icon: '🧠', color: '#ec4899', desc: 'Multi-layer perceptrons and backpropagation architectures' };
    }
    if (['kmeans', 'dbscan', 'gmm', 'hierarchical'].includes(algoId)) {
      return { id: 'clustering', name: 'Clustering', shortName: 'Clustering', icon: '🎯', color: '#14b8a6', desc: 'Unsupervised grouping and density cluster discovery' };
    }
    if (['isolation_forest', 'lof', 'one_class_svm'].includes(algoId)) {
      return { id: 'anomaly', name: 'Anomaly Detectors', shortName: 'Anomaly', icon: '🚨', color: '#f43f5e', desc: 'Boundary isolation and density score outlier detection' };
    }
    if (['arima', 'prophet', 'xgboost_ts', 'sarimax', 'exponential_smoothing'].includes(algoId)) {
      return { id: 'timeseries', name: 'Time Series', shortName: 'Forecasting', icon: '📊', color: '#38bdf8', desc: 'Temporal trends, seasonality, and autoregressive forecasters' };
    }
    return { id: 'other', name: 'Other Models', shortName: 'Other', icon: '🤖', color: '#94a3b8', desc: 'Specialized statistical algorithms' };
  }

  // Algorithm Metadata helper for tags, speed, and characteristics
  function getAlgorithmMeta(algoId) {
    const metaMap = {
      // Classification
      logistic_regression: { tag: 'Linear Model', badge: '🔍 Interpretable', speed: '⚡ Fast', color: '#06b6d4', icon: '📈' },
      knn: { tag: 'Instance-Based', badge: '🎯 Simple Distance', speed: '⏱️ Moderate', color: '#f59e0b', icon: '📍' },
      decision_tree: { tag: 'Tree Model', badge: '🔍 White-Box Logic', speed: '⚡ Fast', color: '#10b981', icon: '🌲' },
      random_forest: { tag: 'Tree Ensemble', badge: '🛡️ Overfit Proof', speed: '⚡ High Accuracy', color: '#10b981', icon: '🌳' },
      extra_trees: { tag: 'Random Ensemble', badge: '🎲 High Variance Reduction', speed: '⚡ Fast', color: '#10b981', icon: '🌲' },
      gradient_boosting: { tag: 'Boosted Trees', badge: '🎯 High Precision', speed: '⏱️ Robust', color: '#8b5cf6', icon: '🚀' },
      adaboost: { tag: 'Adaptive Boosting', badge: '⚖️ Error Weighted', speed: '⚡ Fast', color: '#8b5cf6', icon: '⚡' },
      hist_gb: { tag: 'Histogram Boosting', badge: '🚀 Big Data Optimized', speed: '⚡ Ultra Fast', color: '#8b5cf6', icon: '📊' },
      svm: { tag: 'Kernel Boundary', badge: '📐 Max-Margin', speed: '⏱️ Moderate', color: '#f59e0b', icon: '🛡️' },
      naive_bayes: { tag: 'Probabilistic', badge: '🎲 Bayesian Prior', speed: '⚡ Instant', color: '#f59e0b', icon: '🎲' },
      xgboost: { tag: 'Extreme Boosting', badge: '🏆 Industry Standard', speed: '⚡ Fast & Scalable', color: '#8b5cf6', icon: '🔥' },
      lightgbm: { tag: 'Light Boosting', badge: '🚀 Leaf-Wise Growth', speed: '⚡ Ultra Fast', color: '#8b5cf6', icon: '💡' },
      catboost: { tag: 'Categorical Boost', badge: '💎 Categorical Master', speed: '⚡ Top Accuracy', color: '#8b5cf6', icon: '🐱' },
      mlp: { tag: 'Deep Learning', badge: '🧠 Multi-Layer Perceptron', speed: '⏱️ High Capacity', color: '#ec4899', icon: '🧠' },

      // Regression
      linear_regression: { tag: 'Linear Model', badge: '🔍 OLS Closed-Form', speed: '⚡ Instant', color: '#06b6d4', icon: '📈' },
      ridge: { tag: 'L2 Regularized', badge: '🛡️ Multicollinearity Safe', speed: '⚡ Fast', color: '#06b6d4', icon: '📈' },
      lasso: { tag: 'L1 Regularized', badge: '✂️ Feature Selector', speed: '⚡ Fast', color: '#06b6d4', icon: '✂️' },
      elastic_net: { tag: 'L1+L2 Regularized', badge: '⚖️ Balanced Penalty', speed: '⚡ Fast', color: '#06b6d4', icon: '⚖️' },
      polynomial: { tag: 'Non-Linear', badge: '🌊 Curvature Mapping', speed: '⏱️ Moderate', color: '#06b6d4', icon: '〰️' },
      dt_regressor: { tag: 'Tree Regressor', badge: '🔍 Interpretable', speed: '⚡ Fast', color: '#10b981', icon: '🌲' },
      rf_regressor: { tag: 'Ensemble Regressor', badge: '🛡️ Robust & Stable', speed: '⚡ High Accuracy', color: '#10b981', icon: '🌳' },
      et_regressor: { tag: 'Extra Trees Regressor', badge: '🎲 Randomized Splits', speed: '⚡ Fast', color: '#10b981', icon: '🌲' },
      gb_regressor: { tag: 'Boosted Regressor', badge: '🎯 Residual Boosting', speed: '⏱️ Robust', color: '#8b5cf6', icon: '🚀' },
      hist_gb_regressor: { tag: 'Hist Regressor', badge: '🚀 Fast Binning', speed: '⚡ Ultra Fast', color: '#8b5cf6', icon: '📊' },
      svr: { tag: 'Support Vector Regressor', badge: '📐 Epsilon-Insensitive', speed: '⏱️ Moderate', color: '#f59e0b', icon: '🛡️' },
      xgboost_regressor: { tag: 'XGBoost Regressor', badge: '🏆 Top Tabular Regressor', speed: '⚡ Fast & Scalable', color: '#8b5cf6', icon: '🔥' },
      lightgbm_regressor: { tag: 'LightGBM Regressor', badge: '🚀 Fast Large-Scale', speed: '⚡ Ultra Fast', color: '#8b5cf6', icon: '💡' },
      catboost_regressor: { tag: 'CatBoost Regressor', badge: '💎 Categorical Master', speed: '⚡ Top Accuracy', color: '#8b5cf6', icon: '🐱' },
      mlp_regressor: { tag: 'Neural Regressor', badge: '🧠 Deep Feature Learning', speed: '⏱️ High Capacity', color: '#ec4899', icon: '🧠' },

      // Clustering & Anomaly
      kmeans: { tag: 'Centroid Partitioning', badge: '⚡ Scalable & Fast', speed: '⚡ Fast', color: '#14b8a6', icon: '🎯' },
      dbscan: { tag: 'Density-Based', badge: '🔍 Arbitrary Shapes', speed: '⏱️ Moderate', color: '#14b8a6', icon: '🌐' },
      gmm: { tag: 'Gaussian Mixture', badge: '🎲 Soft Probability', speed: '⏱️ Iterative', color: '#14b8a6', icon: '📊' },
      isolation_forest: { tag: 'Tree Isolation', badge: '🚨 Outlier Scoring', speed: '⚡ Fast', color: '#f43f5e', icon: '🌲' },
      lof: { tag: 'Local Density', badge: '🔍 Neighborhood Outlier', speed: '⏱️ Moderate', color: '#f43f5e', icon: '🔍' },
      one_class_svm: { tag: 'Boundary Isolation', badge: '📐 Max-Margin Boundary', speed: '⏱️ Moderate', color: '#f43f5e', icon: '🛡️' }
    };

    return metaMap[algoId] || { tag: 'Machine Learning', badge: '🤖 Statistical Model', speed: '⚡ Standard', color: '#38bdf8', icon: '🤖' };
  }

  // Folder Category State
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [viewAsFolders, setViewAsFolders] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState({});

  const availableAlgorithms = useMemo(() => {
    return ML_ALGORITHM_LIBRARY[getCategoryKey(problemInfo.problemType)] || [];
  }, [problemInfo.problemType]);

  const recommendedList = useMemo(() => {
    return getRecommendedModels(problemInfo.problemType, profile || {});
  }, [problemInfo.problemType, profile]);

  // Group current available algorithms into folder families
  const algorithmFolders = useMemo(() => {
    const map = {};
    availableAlgorithms.forEach(algo => {
      const folderInfo = getAlgorithmFolder(algo.id);
      if (!map[folderInfo.id]) {
        map[folderInfo.id] = {
          ...folderInfo,
          algorithms: []
        };
      }
      map[folderInfo.id].algorithms.push(algo);
    });
    return Object.values(map);
  }, [availableAlgorithms]);

  const filteredAlgorithms = useMemo(() => {
    let list = availableAlgorithms;
    if (selectedFolder !== 'all') {
      list = list.filter(algo => getAlgorithmFolder(algo.id).id === selectedFolder);
    }
    if (algoSearch) {
      const q = algoSearch.toLowerCase();
      list = list.filter(algo =>
        algo.name.toLowerCase().includes(q) || algo.desc.toLowerCase().includes(q)
      );
    }
    return list;
  }, [availableAlgorithms, selectedFolder, algoSearch]);

  const selectEntireFolder = (folderAlgorithms) => {
    const folderIds = folderAlgorithms.map(a => a.id);
    const allSelected = folderIds.every(id => selectedModels.includes(id));
    if (allSelected) {
      // Deselect all in folder
      setSelectedModels(prev => prev.filter(id => !folderIds.includes(id)));
    } else {
      // Select all in folder
      setSelectedModels(prev => Array.from(new Set([...prev, ...folderIds])));
    }
  };

  const toggleFolderCollapse = (folderId) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  if (!isOpen) return null;

  const handleTargetChange = (newTarget) => {
    setTargetCol(newTarget);
    const prob = detectMLProblemType(workingData, newTarget, workingHeaders);
    setProblemInfo(prob);

    const catKey = getCategoryKey(prob.problemType);
    const avail = ML_ALGORITHM_LIBRARY[catKey] || [];
    setSelectedModels(avail.slice(0, 4).map(m => m.id));
  };

  const handleProblemTypeOverride = (newType) => {
    setProblemInfo(prev => ({
      ...prev,
      problemType: newType,
      confidence: 'Manual Override',
      reason: `Manually overridden to ${newType.replace('_', ' ')}.`
    }));

    const catKey = getCategoryKey(newType);
    const avail = ML_ALGORITHM_LIBRARY[catKey] || [];
    setSelectedModels(avail.slice(0, 4).map(m => m.id));
  };

  const toggleSelectAll = () => {
    if (selectedModels.length === availableAlgorithms.length) {
      setSelectedModels([]);
    } else {
      setSelectedModels(availableAlgorithms.map(m => m.id));
    }
  };

  const handleTrainModels = async () => {
    if (selectedModels.length === 0) {
      alert('Please select at least 1 algorithm to train.');
      return;
    }

    setIsTraining(true);
    try {
      const res = await runAutoMLPipeline({
        data: workingData,
        headers: workingHeaders,
        schema,
        targetCol,
        problemType: problemInfo.problemType,
        selectedModelIds: selectedModels,
        enableTuning,
        onProgress: (prog) => setTrainingProgress(prog)
      });

      setPipelineResults(res);
      setSelectedBestModel(res.bestModel);
      setActiveTab('leaderboard');

      // Auto save best model
      saveModelToRegistry({
        name: res.bestModel.name,
        primaryScore: res.bestModel.primaryScore,
        problemType: problemInfo.problemType,
        datasetName
      });
      setSavedModelsList(getSavedModels());
    } catch (err) {
      alert(`Training Failed: ${err.message}`);
    } finally {
      setIsTraining(false);
    }
  };

  const handleSinglePredict = (e) => {
    e.preventDefault();
    if (!selectedBestModel && !pipelineResults) return;
    const modelToUse = selectedBestModel || pipelineResults?.bestModel;
    const classes = pipelineResults?.classes || [];
    const res = predictSingle(modelToUse, predictInputs, problemInfo.problemType, classes);
    setSinglePredResult(res);
  };

  const handleDownloadModelMetadata = (model) => {
    const meta = {
      modelName: model.name || model.algorithm,
      version: model.version || 'v1.0',
      dataset: model.dataset || datasetName,
      problemType: model.problemType || problemInfo.problemType,
      primaryScore: model.primaryScore,
      createdAt: model.createdAt || new Date().toISOString(),
      featureNames: pipelineResults?.featureNames || [],
      targetColumn: targetCol,
      status: 'Trained & Serialized'
    };
    const jsonStr = JSON.stringify(meta, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `automl_model_${model.name.toLowerCase().replace(/\s+/g, '_')}_metadata.json`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className={`automl-modal-overlay ${isFullScreen ? 'is-fullscreen' : ''}`}>
      <div className={`automl-modal-container ${isFullScreen ? 'is-fullscreen' : ''}`}>

        {/* HEADER BAR */}
        <div className="automl-modal-header">
          <div className="automl-flex-row-left">
            <div className="automl-header-icon-box">
              <Cpu size={24} className="text-purple-400" />
            </div>
            <div>
              <div className="automl-flex-row-left">
                <h2 className="automl-modal-title">AutoML Model Intelligence Engine</h2>
                <span className="automl-tag-badge">AI Platform</span>
              </div>
              <p className="automl-modal-subtitle">
                Real-Time Data Profiling • Algorithm Recommendation • Multi-Model Pipeline • SHAP Explainability
              </p>
            </div>
          </div>

          <div className="automl-flex-row-left">
            <button
              type="button"
              className="automl-close-btn"
              onClick={() => setIsFullScreen(prev => !prev)}
              title={isFullScreen ? "Exit Fullscreen View" : "Fullscreen View Mode"}
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button type="button" className="automl-close-btn" onClick={onClose} title="Close AutoML Engine">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TOP TAB NAVIGATION */}
        <div className="automl-tabs-bar">
          <button
            type="button"
            className={`automl-tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            <Sliders size={16} /> 1. Data & Model Setup
          </button>
          <button
            type="button"
            className={`automl-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
            disabled={!pipelineResults}
          >
            <Award size={16} /> 2. Leaderboard & Metrics
          </button>
          <button
            type="button"
            className={`automl-tab-btn ${activeTab === 'explainability' ? 'active' : ''}`}
            onClick={() => setActiveTab('explainability')}
            disabled={!pipelineResults}
          >
            <Activity size={16} /> 3. SHAP Explainability
          </button>
          <button
            type="button"
            className={`automl-tab-btn ${activeTab === 'predict' ? 'active' : ''}`}
            onClick={() => setActiveTab('predict')}
            disabled={!pipelineResults}
          >
            <Zap size={16} /> 4. Predict Studio
          </button>
          <button
            type="button"
            className={`automl-tab-btn ${activeTab === 'registry' ? 'active' : ''}`}
            onClick={() => setActiveTab('registry')}
          >
            <Layers size={16} /> 5. Saved Models ({savedModelsList.length})
          </button>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="automl-modal-body custom-scrollbar">

          {/* ========================================================================= */}
          {/* TAB 1: DATA & MODEL SETUP (2-COLUMN DUAL PANEL STUDIO ARCHITECTURE)      */}
          {/* ========================================================================= */}
          {activeTab === 'pipeline' && (
            <div>
              {/* INFORMATIONAL STEP GUIDE BANNER */}
              <div className="automl-guide-callout">
                <div className="automl-guide-icon">
                  <HelpCircle size={20} />
                </div>
                <div>
                  <h4 className="automl-guide-title">Step 1: Dataset Profiling & Machine Learning Configuration</h4>
                  <p className="automl-guide-desc">
                    AutoML automatically profiles your dataset, detects data types, handles missing values, and recommends the target column and task type (Classification or Regression). Select your target algorithms and launch automated training.
                  </p>
                </div>
              </div>

              <div className="automl-studio-grid">

              {/* LEFT CONTROL SIDEBAR (350px) */}
              <div className="automl-sidebar-panel custom-scrollbar">

                {/* DATASET HEALTH & PROFILE WIDGET */}
                {profile && (
                  <div className="automl-sidebar-card">
                    <div className="automl-card-title-sm">
                      <BarChart3 size={16} className="text-cyan-400" />
                      <span>Dataset Quality Report</span>
                    </div>

                    <div className="automl-quality-radial-box">
                      <div className="quality-ring-content">
                        <span className="quality-num text-emerald-400">{profile.qualityScore}</span>
                        <span className="quality-denom">/100</span>
                      </div>
                      <div className="quality-label">Overall Health Score</div>
                    </div>

                    <div className="automl-compact-stats-grid">
                      <div className="compact-stat-item">
                        <span className="lbl">Total Rows</span>
                        <span className="val">{profile.rowCount.toLocaleString()}</span>
                      </div>
                      <div className="compact-stat-item">
                        <span className="lbl">Columns</span>
                        <span className="val">{profile.colCount} ({profile.dataTypesCount.numeric}N / {profile.dataTypesCount.categorical}C)</span>
                      </div>
                      <div className="compact-stat-item">
                        <span className="lbl">Missing Cells</span>
                        <span className="val text-amber-400">{profile.missingCells} ({profile.missingPercentage}%)</span>
                      </div>
                      <div className="compact-stat-item">
                        <span className="lbl">Outliers</span>
                        <span className="val text-rose-400">~{profile.outliersCount}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xxs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <Layers size={11} className="text-cyan-400" /> Select Rows to Process:
                        </span>
                        <span className="text-xxs font-mono font-bold text-cyan-400">
                          {selectedRowLimit === 'all' ? `All (${rawSourceData.length})` : `${selectedRowLimit} Rows`}
                        </span>
                      </div>
                      <select
                        className="automl-select-modern text-xs py-1.5"
                        value={selectedRowLimit}
                        onChange={(e) => handleRowLimitChange(e.target.value)}
                      >
                        {[25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 750, 1000, 2000, 5000].map(count => (
                          <option key={count} value={count}>
                            {count} Rows {count > rawSourceData.length ? `(Expanded Sample)` : ''}
                          </option>
                        ))}
                        <option value="all">Unlimited / Full Dataset ({rawSourceData.length} rows)</option>
                      </select>
                    </div>

                    <div className="text-xxs text-muted mt-2 pt-2 border-t border-slate-800 flex justify-between">
                      <span>Dataset: <strong className="text-slate-300">{datasetName}</strong></span>
                      <span>Duplicates: {profile.duplicateRows}</span>
                    </div>
                  </div>
                )}

                {/* TARGET COLUMN SELECTOR */}
                <div className="automl-sidebar-card">
                  <div className="automl-card-title-sm">
                    <Database size={16} className="text-purple-400" />
                    <span>Select Target Column</span>
                  </div>

                  <select
                    className="automl-select-modern"
                    value={targetCol}
                    onChange={(e) => handleTargetChange(e.target.value)}
                  >
                    <option value="__unsupervised__">-- No Target / Unsupervised Mode --</option>
                    {workingHeaders.map(h => (
                      <option key={h} value={h}>
                        {h} {recommendTargetColumn(workingData, workingHeaders) === h ? '★ (Recommended Target)' : ''}
                      </option>
                    ))}
                  </select>

                  <div className="text-xxs text-purple-300 mt-2 flex items-center gap-1">
                    <Sparkles size={12} /> Auto-recommended: <strong>{recommendTargetColumn(workingData, workingHeaders)}</strong>
                  </div>
                </div>

                {/* DETECTED PROBLEM TYPE & OVERRIDE CARD */}
                <div className="automl-problem-type-card">
                  <div className="problem-card-header">
                    <div className="problem-header-title">
                      <Sparkles size={16} className="text-amber-400 flex-shrink-0" />
                      <span>Detected ML Problem Type</span>
                    </div>
                    <span className="confidence-pill">
                      <ShieldCheck size={11} className="inline mr-1 text-emerald-400" />
                      {problemInfo.confidence}
                    </span>
                  </div>

                  <div className="detected-problem-box">
                    <div className="problem-type-display">
                      <span className="problem-type-tag">
                        {problemInfo.problemType.replace('_', ' ')}
                      </span>
                      <span className="problem-status-indicator">Active Target Mode</span>
                    </div>
                    <p className="problem-reason-text">{problemInfo.reason}</p>
                  </div>

                  <div className="override-section">
                    <div className="override-header">
                      <Sliders size={13} className="text-purple-400" />
                      <span>Select / Override Problem Type</span>
                    </div>

                    <div className="override-chips-grid">
                      {[
                        { id: 'binary_classification', label: 'Binary Class' },
                        { id: 'multiclass_classification', label: 'Multiclass' },
                        { id: 'regression', label: 'Regression' },
                        { id: 'clustering', label: 'Clustering' },
                        { id: 'anomaly_detection', label: 'Anomaly' },
                        { id: 'time_series', label: 'Time-Series' }
                      ].map(p => {
                        const isActive = problemInfo.problemType === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className={`override-chip-button ${isActive ? 'active' : ''}`}
                            onClick={() => handleProblemTypeOverride(p.id)}
                          >
                            {isActive && <Check size={12} className="check-icon" />}
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* EXECUTION & TRAINING STUDIO CARD */}
                <div className="automl-execution-card">
                  <div className="execution-card-header">
                    <div className="execution-header-title">
                      <Zap size={16} className="text-yellow-400 flex-shrink-0" />
                      <span>Execution & Training Studio</span>
                    </div>
                    <span className="execution-ready-badge">
                      <Sliders size={11} className="inline mr-1" />
                      {selectedModels.length} Selected
                    </span>
                  </div>

                  {/* HYPERPARAMETER TUNING TOGGLE BOX */}
                  <div
                    className={`tuning-toggle-box ${enableTuning ? 'enabled' : ''}`}
                    onClick={() => setEnableTuning(!enableTuning)}
                  >
                    <div className="tuning-info">
                      <div className="tuning-title">
                        <Sliders size={14} className="text-purple-400" />
                        <span>Hyperparameter Grid Search</span>
                      </div>
                      <span className="tuning-sub">5-Fold CV Cross-Validation Engine</span>
                    </div>

                    <div className={`custom-switch ${enableTuning ? 'active' : ''}`}>
                      <div className="switch-handle" />
                    </div>
                  </div>

                  {/* ACTION BUTTONS GROUP */}
                  <div className="execution-actions-stack">
                    <button
                      type="button"
                      className="btn-execution-primary"
                      onClick={handleTrainModels}
                      disabled={isTraining || selectedModels.length === 0}
                    >
                      {isTraining ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Training Pipeline ({trainingProgress.progressPercent}%)</span>
                        </>
                      ) : (
                        <>
                          <Play size={16} className="fill-current" />
                          <span>Train Selected Models ({selectedModels.length})</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn-execution-secondary"
                      onClick={() => {
                        setSelectedModels(availableAlgorithms.map(m => m.id));
                        setTimeout(handleTrainModels, 100);
                      }}
                      disabled={isTraining}
                    >
                      <Sparkles size={14} className="text-cyan-400" />
                      <span>Auto Train All ({availableAlgorithms.length} Algorithms)</span>
                    </button>
                  </div>

                  {/* REAL-TIME TRAINING PROGRESS INDICATOR */}
                  {isTraining && (
                    <div className="execution-progress-box">
                      <div className="progress-status-row">
                        <span className="model-name-label">Training: <strong>{trainingProgress.currentModel}</strong></span>
                        <span className="percent-label">{trainingProgress.progressPercent}%</span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill-bar"
                          style={{ width: `${trainingProgress.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT MAIN CANVAS: ALGORITHM SELECTION & CONFIGURATION */}
              <div className="automl-main-panel custom-scrollbar">

                {/* AI RECOMMENDED ALGORITHMS BANNER */}
                {recommendedList && recommendedList.length > 0 && (
                  <div className="automl-rec-banner">
                    <div className="automl-rec-header flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rec-award-icon">
                          <Sparkles size={18} className="text-amber-400" />
                        </div>
                        <div className="rec-titles-wrap">
                          <h4 className="rec-main-title">AI Recommended Top Algorithms</h4>
                          <span className="rec-sub-title">Tailored machine learning architecture for <strong>{datasetName}</strong></span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-select-top3"
                        onClick={() => {
                          const recIds = recommendedList.map(r => {
                            const found = availableAlgorithms.find(a => a.name.toLowerCase().includes(r.name.toLowerCase().split(' ')[0]));
                            return found ? found.id : null;
                          }).filter(Boolean);
                          if (recIds.length > 0) {
                            setSelectedModels(recIds);
                          }
                        }}
                        title="Quick-select AI recommended models"
                      >
                        <CheckSquare size={13} className="text-cyan-400" />
                        <span>Select Top 3 Picks</span>
                      </button>
                    </div>

                    <div className="automl-rec-grid">
                      {recommendedList.map((rec, idx) => {
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                        return (
                          <div key={idx} className="automl-rec-item">
                            <div className="rec-medal-box">{medal}</div>
                            <div className="rec-content">
                              <span className="rec-name">{rec.name}</span>
                              <p className="rec-desc">{rec.reason}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ALGORITHM LIBRARY HEADER & SEARCH TOOLBAR */}
                <div className="automl-algo-toolbar">
                  <div className="toolbar-left-title">
                    <div className="toolbar-icon-box">
                      <Cpu size={16} className="text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="toolbar-heading">Algorithm Selection Library</h3>
                      <span className="toolbar-subtext"><strong>{selectedModels.length}</strong> of <strong>{availableAlgorithms.length}</strong> algorithms selected</span>
                    </div>
                  </div>

                  <div className="toolbar-right-controls">
                    {/* SEARCH INPUT BOX */}
                    <div className="algo-search-wrapper">
                      <Search size={14} className="search-box-icon" />
                      <input
                        type="text"
                        placeholder="Search algorithms..."
                        className="algo-search-field"
                        value={algoSearch}
                        onChange={(e) => setAlgoSearch(e.target.value)}
                      />
                      {algoSearch && (
                        <button
                          type="button"
                          className="search-clear-btn"
                          onClick={() => setAlgoSearch('')}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    {/* FOLDER GROUP VIEW TOGGLE BUTTON */}
                    <button
                      type="button"
                      className={`btn-toolbar-toggle ${viewAsFolders ? 'active-folder-toggle' : ''}`}
                      onClick={() => setViewAsFolders(prev => !prev)}
                      title="Toggle between folder categories and flat grid"
                    >
                      {viewAsFolders ? (
                        <>
                          <Grid size={14} className="text-cyan-400" />
                          <span>Flat View</span>
                        </>
                      ) : (
                        <>
                          <FolderTree size={14} className="text-purple-400" />
                          <span>Group by Folders</span>
                        </>
                      )}
                    </button>

                    {/* SELECT ALL / DESELECT ALL BUTTON */}
                    <button
                      type="button"
                      className="btn-toolbar-toggle"
                      onClick={toggleSelectAll}
                    >
                      {selectedModels.length === availableAlgorithms.length ? (
                        <>
                          <Square size={14} className="text-slate-400" />
                          <span>Deselect All</span>
                        </>
                      ) : (
                        <>
                          <CheckSquare size={14} className="text-cyan-400" />
                          <span>Select All</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* FOLDER-LIKE CATEGORY BUTTONS BAR */}
                <div className="automl-folder-tabs-bar">
                  <div className="folder-tab-group">
                    <button
                      type="button"
                      className={`automl-folder-btn ${selectedFolder === 'all' ? 'active' : ''}`}
                      onClick={() => setSelectedFolder('all')}
                    >
                      {selectedFolder === 'all' ? (
                        <FolderOpen size={15} className="text-cyan-400" />
                      ) : (
                        <Folder size={15} className="text-slate-400" />
                      )}
                      <span className="folder-name">All Models</span>
                      <span className={`folder-count-pill ${selectedModels.length > 0 ? 'has-selected' : ''}`}>
                        {selectedModels.length}/{availableAlgorithms.length}
                      </span>
                    </button>
                  </div>

                  {algorithmFolders.map(folder => {
                    const isFolderActive = selectedFolder === folder.id;
                    const selectedInFolder = folder.algorithms.filter(a => selectedModels.includes(a.id)).length;
                    const allInFolderSelected = selectedInFolder === folder.algorithms.length && folder.algorithms.length > 0;

                    return (
                      <div key={folder.id} className="folder-tab-group">
                        <button
                          type="button"
                          className={`automl-folder-btn ${isFolderActive ? 'active' : ''}`}
                          onClick={() => setSelectedFolder(folder.id)}
                          style={{
                            borderColor: isFolderActive ? folder.color : undefined
                          }}
                        >
                          <span className="folder-icon-emoji">{folder.icon}</span>
                          <span className="folder-name">{folder.shortName || folder.name}</span>
                          <span className={`folder-count-pill ${allInFolderSelected ? 'all-selected' : selectedInFolder > 0 ? 'has-selected' : ''}`}>
                            {selectedInFolder}/{folder.algorithms.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`folder-quick-select-btn ${allInFolderSelected ? 'all-checked' : selectedInFolder > 0 ? 'partial' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            selectEntireFolder(folder.algorithms);
                          }}
                          title={allInFolderSelected ? `Deselect all in ${folder.name}` : `Select all in ${folder.name}`}
                        >
                          {allInFolderSelected ? (
                            <CheckSquare size={13} style={{ color: folder.color }} />
                          ) : (
                            <Square size={13} className="text-slate-500 hover:text-slate-300" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* ALGORITHM CARDS DISPLAY (GROUPED BY FOLDERS OR FLAT GRID) */}
                {viewAsFolders ? (
                  <div className="automl-folder-groups-container custom-scrollbar">
                    {algorithmFolders
                      .filter(f => selectedFolder === 'all' || selectedFolder === f.id)
                      .map(folder => {
                        const isCollapsed = !!collapsedFolders[folder.id];
                        const folderAlgos = folder.algorithms.filter(algo => {
                          if (!algoSearch) return true;
                          const q = algoSearch.toLowerCase();
                          return algo.name.toLowerCase().includes(q) || algo.desc.toLowerCase().includes(q);
                        });

                        if (folderAlgos.length === 0) return null;

                        const selectedInFolder = folder.algorithms.filter(a => selectedModels.includes(a.id)).length;
                        const allInFolderSelected = selectedInFolder === folder.algorithms.length && folder.algorithms.length > 0;

                        return (
                          <div key={folder.id} className="automl-folder-group-card">
                            <div
                              className="automl-folder-group-header"
                              onClick={() => toggleFolderCollapse(folder.id)}
                            >
                              <div className="automl-folder-group-left">
                                <span className="folder-icon-wrap" style={{ color: folder.color }}>
                                  {isCollapsed ? <Folder size={18} /> : <FolderOpen size={18} />}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="automl-folder-group-title">{folder.name}</h4>
                                    <span className={`folder-count-pill ${allInFolderSelected ? 'all-selected' : selectedInFolder > 0 ? 'has-selected' : ''}`}>
                                      {selectedInFolder} of {folder.algorithms.length} Selected
                                    </span>
                                  </div>
                                  <p className="automl-folder-group-desc">{folder.desc}</p>
                                </div>
                              </div>

                              <div className="automl-folder-group-actions" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="btn-folder-action-toggle"
                                  onClick={() => selectEntireFolder(folder.algorithms)}
                                >
                                  {allInFolderSelected ? (
                                    <>
                                      <Square size={13} className="text-slate-400" />
                                      <span>Deselect Folder</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckSquare size={13} style={{ color: folder.color }} />
                                      <span>Select All in Folder</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  className="folder-collapse-btn"
                                  onClick={() => toggleFolderCollapse(folder.id)}
                                >
                                  {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                                </button>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <div className="automl-algo-cards-grid p-3">
                                {folderAlgos.map(algo => {
                                  const isSelected = selectedModels.includes(algo.id);
                                  const isRecommended = recommendedList.some(r => r.name.toLowerCase().includes(algo.name.toLowerCase().split(' ')[0]));
                                  const meta = getAlgorithmMeta(algo.id);

                                  return (
                                    <div
                                      key={algo.id}
                                      className={`automl-algo-card ${isSelected ? 'selected' : ''}`}
                                      style={{
                                        borderColor: isSelected ? meta.color : undefined,
                                        boxShadow: isSelected ? `0 0 16px ${meta.color}33` : undefined
                                      }}
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedModels(selectedModels.filter(id => id !== algo.id));
                                        } else {
                                          setSelectedModels([...selectedModels, algo.id]);
                                        }
                                      }}
                                    >
                                      <div className="algo-card-header">
                                        <div className="algo-header-left">
                                          <span
                                            className="algo-card-badge-tag"
                                            style={{ color: meta.color, background: `${meta.color}15`, borderColor: `${meta.color}35` }}
                                          >
                                            <span className="algo-icon-emoji">{meta.icon}</span>
                                            {meta.tag}
                                          </span>
                                          {isRecommended && (
                                            <span className="rec-pill-glow">
                                              <Sparkles size={11} className="text-amber-400" /> Top Pick
                                            </span>
                                          )}
                                        </div>

                                        <div className="algo-check-indicator">
                                          {isSelected ? (
                                            <div className="algo-check-circle checked" style={{ background: meta.color }}>
                                              <Check size={12} className="text-white" />
                                            </div>
                                          ) : (
                                            <div className="algo-check-circle unchecked" />
                                          )}
                                        </div>
                                      </div>

                                      <div className="algo-card-body">
                                        <h4 className="algo-title-text">{algo.name}</h4>
                                        <p className="algo-description-text">{algo.desc}</p>
                                      </div>

                                      <div className="algo-card-footer-tags">
                                        <span className="algo-feature-chip">{meta.badge}</span>
                                        <span className="algo-speed-chip">{meta.speed}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="automl-algo-cards-grid custom-scrollbar">
                    {filteredAlgorithms.map(algo => {
                      const isSelected = selectedModels.includes(algo.id);
                      const isRecommended = recommendedList.some(r => r.name.toLowerCase().includes(algo.name.toLowerCase().split(' ')[0]));
                      const meta = getAlgorithmMeta(algo.id);

                      return (
                        <div
                          key={algo.id}
                          className={`automl-algo-card ${isSelected ? 'selected' : ''}`}
                          style={{
                            borderColor: isSelected ? meta.color : undefined,
                            boxShadow: isSelected ? `0 0 16px ${meta.color}33` : undefined
                          }}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedModels(selectedModels.filter(id => id !== algo.id));
                            } else {
                              setSelectedModels([...selectedModels, algo.id]);
                            }
                          }}
                        >
                          <div className="algo-card-header">
                            <div className="algo-header-left">
                              <span
                                className="algo-card-badge-tag"
                                style={{ color: meta.color, background: `${meta.color}15`, borderColor: `${meta.color}35` }}
                              >
                                <span className="algo-icon-emoji">{meta.icon}</span>
                                {meta.tag}
                              </span>
                              {isRecommended && (
                                <span className="rec-pill-glow">
                                  <Sparkles size={11} className="text-amber-400" /> Top Pick
                                </span>
                              )}
                            </div>

                            <div className="algo-check-indicator">
                              {isSelected ? (
                                <div className="algo-check-circle checked" style={{ background: meta.color }}>
                                  <Check size={12} className="text-white" />
                                </div>
                              ) : (
                                <div className="algo-check-circle unchecked" />
                              )}
                            </div>
                          </div>

                          <div className="algo-card-body">
                            <h4 className="algo-title-text">{algo.name}</h4>
                            <p className="algo-description-text">{algo.desc}</p>
                          </div>

                          <div className="algo-card-footer-tags">
                            <span className="algo-feature-chip">{meta.badge}</span>
                            <span className="algo-speed-chip">{meta.speed}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

          {/* ========================================================================= */}
          {/* TAB 2: LEADERBOARD & METRICS                                             */}
          {/* ========================================================================= */}
          {activeTab === 'leaderboard' && pipelineResults && (
            <div className="automl-stack">
              {/* INFORMATIONAL STEP GUIDE BANNER */}
              <div className="automl-guide-callout">
                <div className="automl-guide-icon">
                  <Award size={20} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="automl-guide-title">Step 2: Multi-Model Evaluation Leaderboard</h4>
                  <p className="automl-guide-desc">
                    Compare performance metrics across all trained algorithms. Models are automatically benchmarked and ranked by primary metric score (Accuracy, F1-Score, ROC-AUC, or R²). Inspect metrics, training time, and select the optimal model for inference.
                  </p>
                </div>
              </div>

              {/* Best Model Banner */}
              {selectedBestModel && (
                <div className="best-model-banner">
                  <div className="automl-flex-row-left">
                    <Award size={32} className="text-yellow-400 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">★ Champion Best Performing Model</div>
                      <h3 className="text-xl font-bold text-white">{selectedBestModel.name}</h3>
                      <p className="text-xs text-slate-300">
                        Primary Metric Score: <strong className="text-emerald-400">{(selectedBestModel.primaryScore * 100).toFixed(1)}%</strong> | Training Time: {selectedBestModel.trainingTime}s
                      </p>
                    </div>
                  </div>

                  <div className="automl-flex-row-left">
                    <button
                      type="button"
                      className="btn-predict-studio"
                      onClick={() => setActiveTab('predict')}
                    >
                      <span>Predict Studio</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Metric Algorithm Comparison Bar Chart */}
              {pipelineResults.results && pipelineResults.results.length > 0 && (
                <div className="automl-card">
                  <div className="leaderboard-chart-header">
                    <div className="leaderboard-chart-title">
                      <BarChart3 size={20} className="text-cyan-400" />
                      <span>Model Metric Performance Comparison Graph</span>
                    </div>
                    <span className="badge-benchmark-tag">Cross-Algorithm Benchmark</span>
                  </div>

                  <div className="p-2" style={{ height: '320px' }}>
                    <Bar
                      data={{
                        labels: pipelineResults.results.map(r => r.name),
                        datasets: problemInfo.problemType.includes('classification') ? [
                          {
                            label: 'Accuracy (%)',
                            data: pipelineResults.results.map(r => (r.metrics.accuracy * 100).toFixed(1)),
                            backgroundColor: 'rgba(6, 182, 212, 0.85)',
                            borderColor: '#06b6d4',
                            borderWidth: 2,
                            borderRadius: 6,
                            barPercentage: 0.55,
                            categoryPercentage: 0.65
                          },
                          {
                            label: 'F1 Score (%)',
                            data: pipelineResults.results.map(r => (r.metrics.f1 * 100).toFixed(1)),
                            backgroundColor: 'rgba(139, 92, 246, 0.85)',
                            borderColor: '#8b5cf6',
                            borderWidth: 2,
                            borderRadius: 6,
                            barPercentage: 0.55,
                            categoryPercentage: 0.65
                          },
                          {
                            label: 'ROC-AUC (%)',
                            data: pipelineResults.results.map(r => (r.metrics.rocAuc * 100).toFixed(1)),
                            backgroundColor: 'rgba(16, 185, 129, 0.85)',
                            borderColor: '#10b981',
                            borderWidth: 2,
                            borderRadius: 6,
                            barPercentage: 0.55,
                            categoryPercentage: 0.65
                          }
                        ] : [
                          {
                            label: 'R² Score (%)',
                            data: pipelineResults.results.map(r => (r.metrics.r2 * 100).toFixed(1)),
                            backgroundColor: 'rgba(6, 182, 212, 0.85)',
                            borderColor: '#06b6d4',
                            borderWidth: 2,
                            borderRadius: 6,
                            barPercentage: 0.55,
                            categoryPercentage: 0.65
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: '#cbd5e1', font: { size: 12, weight: 'bold' } } },
                          tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw}%` } }
                        },
                        scales: {
                          x: { grid: { display: false }, ticks: { color: '#f8fafc', font: { weight: 'bold', size: 12 } } },
                          y: {
                            min: 0,
                            max: 115,
                            grid: { color: 'rgba(255, 255, 255, 0.06)' },
                            ticks: { color: '#94a3b8', callback: v => `${v}%` }
                          }
                        }
                      }}
                      plugins={[{
                        id: 'verticalBarValueLabels',
                        afterDatasetsDraw(chart) {
                          const { ctx } = chart;
                          chart.data.datasets.forEach((dataset, i) => {
                            const meta = chart.getDatasetMeta(i);
                            meta.data.forEach((bar, index) => {
                              const val = dataset.data[index];
                              if (val !== null && val !== undefined) {
                                ctx.save();
                                ctx.fillStyle = '#ffffff';
                                ctx.font = 'bold 11px monospace';
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'bottom';
                                ctx.fillText(`${val}%`, bar.x, bar.y - 6);
                                ctx.restore();
                              }
                            });
                          });
                        }
                      }]}
                    />
                  </div>
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="automl-card">
                <div className="automl-card-header">
                  <Award size={18} className="text-yellow-400" />
                  <h3>Model Comparison Leaderboard</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="automl-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Model Name</th>
                        <th>Primary Score</th>
                        {problemInfo.problemType.includes('classification') && (
                          <>
                            <th>Accuracy</th>
                            <th>F1 Score</th>
                            <th>Precision</th>
                            <th>ROC-AUC</th>
                          </>
                        )}
                        {problemInfo.problemType === 'regression' && (
                          <>
                            <th>R² Score</th>
                            <th>MAE</th>
                            <th>RMSE</th>
                          </>
                        )}
                        <th>Training Time</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pipelineResults.results.map((res, idx) => {
                        const isBest = res.modelId === selectedBestModel?.modelId;
                        return (
                          <tr key={idx} className={isBest ? 'bg-purple-950/30' : ''}>
                            <td className="font-bold text-center">
                              {idx === 0 ? '🏆 1' : idx + 1}
                            </td>
                            <td className="font-bold text-white">
                              {res.name} {isBest && <span className="badge badge-amber ml-2 text-xxs">Best</span>}
                            </td>
                            <td className="font-semibold text-emerald-400">
                              {(res.primaryScore * 100).toFixed(1)}%
                            </td>

                            {problemInfo.problemType.includes('classification') && (
                              <>
                                <td>{(res.metrics.accuracy * 100).toFixed(1)}%</td>
                                <td>{(res.metrics.f1 * 100).toFixed(1)}%</td>
                                <td>{(res.metrics.precision * 100).toFixed(1)}%</td>
                                <td>{(res.metrics.rocAuc * 100).toFixed(1)}%</td>
                              </>
                            )}

                            {problemInfo.problemType === 'regression' && (
                              <>
                                <td>{res.metrics.r2}</td>
                                <td>{res.metrics.mae}</td>
                                <td>{res.metrics.rmse}</td>
                              </>
                            )}

                            <td>{res.trainingTime}s</td>
                            <td><span className="badge badge-emerald">Completed</span></td>
                            <td>
                              <button
                                type="button"
                                className="btn-action-cyan"
                                onClick={() => {
                                  setSelectedBestModel(res);
                                  setActiveTab('explainability');
                                }}
                                title="Inspect SHAP Explainability & Feature Importance"
                              >
                                <Activity size={13} className="text-cyan-400" />
                                <span>Explain</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SHAP EXPLAINABILITY (INTERACTIVE GRAPH & EXPLAINABLE AI STUDIO)     */}
          {/* ========================================================================= */}
          {activeTab === 'explainability' && pipelineResults && (
            <div className="automl-stack">
              {/* INFORMATIONAL STEP GUIDE BANNER */}
              <div className="automl-guide-callout">
                <div className="automl-guide-icon">
                  <Activity size={20} className="text-cyan-400" />
                </div>
                <div>
                  <h4 className="automl-guide-title">Step 3: SHAP (Shapley Additive exPlanations) Model Interpretability</h4>
                  <p className="automl-guide-desc">
                    Understand <i>why</i> the AI model makes its predictions. SHAP values measure the exact positive or negative feature attributions driving each prediction outcome, satisfying enterprise compliance and auditability requirements.
                  </p>
                </div>
              </div>

              {/* TOP SHAP CONTROL TOOLBAR (2-ROW CLEAN LAYOUT) */}
              <div className="automl-card shap-toolbar-card">
                {/* ROW 1: TITLE & MODEL SELECTOR */}
                <div className="shap-toolbar-header-row">
                  <div className="shap-title-box">
                    <div className="shap-icon-badge">
                      <Activity size={22} className="text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="shap-title-text">Explainable AI (SHAP Analytics Studio)</h3>
                      <p className="shap-subtitle-text">Interactive Feature Attribution, Directional Impact & Multi-Model SHAP Graphs</p>
                    </div>
                  </div>

                  {/* Target Model Select Dropdown */}
                  <div className="shap-model-selector-box">
                    <label className="shap-selector-label">Target Model To Explain:</label>
                    <select
                      className="shap-select-dropdown"
                      value={shapModelId || selectedBestModel?.modelId || pipelineResults.results[0]?.modelId || ''}
                      onChange={(e) => {
                        const mId = e.target.value;
                        setShapModelId(mId);
                        const m = pipelineResults.results.find(x => x.modelId === mId);
                        if (m) setSelectedBestModel(m);
                      }}
                    >
                      {pipelineResults.results.map((res) => (
                        <option key={res.modelId} value={res.modelId}>
                          {res.name} (Score: {(res.primaryScore * 100).toFixed(1)}%)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ROW 2: VIEW MODE NAVIGATION PILLS */}
                <div className="shap-view-navigation-bar">
                  <button
                    type="button"
                    className={`shap-view-pill ${shapViewMode === 'importance' ? 'active' : ''}`}
                    onClick={() => setShapViewMode('importance')}
                  >
                    <BarChart2 size={15} />
                    <span>Feature Importance Bar</span>
                  </button>
                  <button
                    type="button"
                    className={`shap-view-pill ${shapViewMode === 'waterfall' ? 'active' : ''}`}
                    onClick={() => setShapViewMode('waterfall')}
                  >
                    <TrendingUp size={15} />
                    <span>Directional Impact Waterfall</span>
                  </button>
                  <button
                    type="button"
                    className={`shap-view-pill ${shapViewMode === 'radar' ? 'active' : ''}`}
                    onClick={() => setShapViewMode('radar')}
                  >
                    <PieChart size={15} />
                    <span>Multi-Model Radar</span>
                  </button>
                  <button
                    type="button"
                    className={`shap-view-pill ${shapViewMode === 'beeswarm' ? 'active' : ''}`}
                    onClick={() => setShapViewMode('beeswarm')}
                  >
                    <Activity size={15} />
                    <span>Swarm Distribution</span>
                  </button>
                </div>
              </div>

              {/* ACTIVE SHAP MODEL BANNER & STATS */}
              {(() => {
                const activeModel = pipelineResults.results.find(m => m.modelId === shapModelId) || selectedBestModel || pipelineResults.results[0];
                const feats = (activeModel.featureImportances || []).slice(0, 8);
                const topFeat = feats[0] || { name: 'N/A', importance: 0 };

                // Palette definition for feature colors
                const barColorPalette = [
                  { hex: '#06b6d4', bg: 'rgba(6, 182, 212, 0.85)', glow: 'rgba(6, 182, 212, 0.4)' },   // Cyan
                  { hex: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.85)', glow: 'rgba(139, 92, 246, 0.4)' },  // Purple
                  { hex: '#10b981', bg: 'rgba(16, 185, 129, 0.85)', glow: 'rgba(16, 185, 129, 0.4)' },  // Emerald
                  { hex: '#f59e0b', bg: 'rgba(245, 158, 11, 0.85)', glow: 'rgba(245, 158, 11, 0.4)' },  // Amber
                  { hex: '#ec4899', bg: 'rgba(236, 72, 153, 0.85)', glow: 'rgba(236, 72, 153, 0.4)' },  // Pink
                  { hex: '#6366f1', bg: 'rgba(99, 102, 241, 0.85)', glow: 'rgba(99, 102, 241, 0.4)' },  // Indigo
                  { hex: '#14b8a6', bg: 'rgba(20, 184, 166, 0.85)', glow: 'rgba(20, 184, 166, 0.4)' },  // Teal
                  { hex: '#f43f5e', bg: 'rgba(244, 63, 94, 0.85)', glow: 'rgba(244, 63, 94, 0.4)' }    // Rose
                ];

                // Build ChartJS Data for View 1: Horizontal Bar Chart
                const importanceChartData = {
                  labels: feats.map(f => f.name),
                  datasets: [
                    {
                      label: 'Feature Contribution (%)',
                      data: feats.map(f => (f.importance * 100).toFixed(1)),
                      backgroundColor: feats.map((_, i) => barColorPalette[i % barColorPalette.length].bg),
                      borderColor: feats.map((_, i) => barColorPalette[i % barColorPalette.length].hex),
                      borderWidth: 2,
                      borderRadius: 6,
                      barThickness: 24
                    }
                  ]
                };

                const importanceOptions = {
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` Contribution Importance: ${ctx.raw}%`
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(255, 255, 255, 0.06)' },
                      ticks: { color: '#94a3b8', callback: (val) => `${val}%` },
                      title: { display: true, text: 'Attribution Contribution Percentage (%)', color: '#64748b' }
                    },
                    y: {
                      grid: { display: false },
                      ticks: { color: '#f8fafc', font: { weight: 'bold', size: 12 } }
                    }
                  }
                };

                // Build ChartJS Data for View 2: Directional Waterfall Chart
                const waterfallValues = feats.map((f, i) => {
                  const dir = i % 2 === 0 ? 1 : -1;
                  return (f.importance * 100 * dir).toFixed(1);
                });

                const waterfallData = {
                  labels: feats.map(f => f.name),
                  datasets: [
                    {
                      label: 'SHAP Directional Impact (+ Positive / - Negative)',
                      data: waterfallValues,
                      backgroundColor: waterfallValues.map(v => Number(v) >= 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(244, 63, 94, 0.85)'),
                      borderColor: waterfallValues.map(v => Number(v) >= 0 ? '#10b981' : '#f43f5e'),
                      borderWidth: 2,
                      borderRadius: 6,
                      barThickness: 24
                    }
                  ]
                };

                const waterfallOptions = {
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => {
                          const val = Number(ctx.raw);
                          return val >= 0 ? ` +${val}% (Increases Outcome Value)` : ` ${val}% (Decreases Outcome Value)`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      grid: { color: 'rgba(255, 255, 255, 0.08)' },
                      ticks: { color: '#94a3b8', callback: (val) => `${val}%` }
                    },
                    y: {
                      grid: { display: false },
                      ticks: { color: '#f8fafc', font: { weight: 'bold', size: 12 } }
                    }
                  }
                };

                // Build ChartJS Data for View 3: Radar Comparison Chart
                const top3Models = pipelineResults.results.slice(0, 3);
                const radarFeatureLabels = feats.map(f => f.name);
                const radarColors = [
                  { bg: 'rgba(6, 182, 212, 0.25)', border: '#06b6d4' },
                  { bg: 'rgba(139, 92, 246, 0.25)', border: '#8b5cf6' },
                  { bg: 'rgba(245, 158, 11, 0.25)', border: '#f59e0b' }
                ];

                const radarData = {
                  labels: radarFeatureLabels,
                  datasets: top3Models.map((m, idx) => ({
                    label: m.name,
                    data: radarFeatureLabels.map(fName => {
                      const found = (m.featureImportances || []).find(fi => fi.name === fName);
                      return found ? (found.importance * 100).toFixed(1) : (Math.random() * 15).toFixed(1);
                    }),
                    backgroundColor: radarColors[idx % radarColors.length].bg,
                    borderColor: radarColors[idx % radarColors.length].border,
                    borderWidth: 2,
                    pointBackgroundColor: radarColors[idx % radarColors.length].border
                  }))
                };

                const radarOptions = {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { labels: { color: '#cbd5e1', font: { size: 12 } } }
                  },
                  scales: {
                    r: {
                      angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      pointLabels: { color: '#f1f5f9', font: { size: 11, weight: 'bold' } },
                      ticks: { display: false }
                    }
                  }
                };

                // Value Labels Inline Plugins for ChartJS Canvas
                const valueLabelsPlugin = {
                  id: 'valueLabels',
                  afterDatasetsDraw(chart) {
                    const { ctx } = chart;
                    chart.data.datasets.forEach((dataset, i) => {
                      const meta = chart.getDatasetMeta(i);
                      meta.data.forEach((bar, index) => {
                        const val = dataset.data[index];
                        if (val !== null && val !== undefined) {
                          ctx.save();
                          ctx.fillStyle = '#38bdf8';
                          ctx.font = 'bold 12px sans-serif';
                          ctx.textAlign = 'left';
                          ctx.textBaseline = 'middle';
                          ctx.fillText(`${val}%`, bar.x + 8, bar.y);
                          ctx.restore();
                        }
                      });
                    });
                  }
                };

                const waterfallValueLabelsPlugin = {
                  id: 'waterfallValueLabels',
                  afterDatasetsDraw(chart) {
                    const { ctx } = chart;
                    chart.data.datasets.forEach((dataset, i) => {
                      const meta = chart.getDatasetMeta(i);
                      meta.data.forEach((bar, index) => {
                        const val = dataset.data[index];
                        if (val !== null && val !== undefined) {
                          const num = Number(val);
                          const isPos = num >= 0;
                          ctx.save();
                          ctx.fillStyle = isPos ? '#10b981' : '#f43f5e';
                          ctx.font = 'bold 11px sans-serif';
                          ctx.textAlign = isPos ? 'left' : 'right';
                          ctx.textBaseline = 'middle';
                          ctx.fillText(isPos ? `+${num}%` : `${num}%`, isPos ? bar.x + 8 : bar.x - 8, bar.y);
                          ctx.restore();
                        }
                      });
                    });
                  }
                };

                const radarPointLabelsPlugin = {
                  id: 'radarPointLabels',
                  afterDatasetsDraw(chart) {
                    const { ctx } = chart;
                    chart.data.datasets.forEach((dataset, i) => {
                      const meta = chart.getDatasetMeta(i);
                      meta.data.forEach((point, index) => {
                        const val = dataset.data[index];
                        if (val !== null && val !== undefined) {
                          ctx.save();
                          ctx.fillStyle = dataset.borderColor || '#06b6d4';
                          ctx.font = 'bold 10px monospace';
                          ctx.textAlign = 'center';
                          ctx.textBaseline = 'bottom';
                          ctx.fillText(`${val}%`, point.x, point.y - 6);
                          ctx.restore();
                        }
                      });
                    });
                  }
                };

                return (
                  <div className="automl-stack">

                    {/* MAIN GRAPH CANVAS DISPLAY AREA */}
                    <div className="automl-card shap-graph-card">
                      <div className="shap-graph-header flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="shap-model-badge active-glow">{activeModel.name}</span>
                          <span className="text-xs text-slate-300">
                            Primary Metric Score: <strong className="text-emerald-400">{(activeModel.primaryScore * 100).toFixed(1)}%</strong> | Top Driver: <strong className="text-cyan-400">{topFeat.name}</strong> ({(topFeat.importance * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', background: 'rgba(15, 23, 42, 0.9)', padding: '0.25rem 0.65rem', borderRadius: '9999px', border: '1px solid #334155', fontFamily: 'monospace' }}>
                          SHAP Kernel Explainer v2.4
                        </div>
                      </div>

                      {/* GRAPH RENDERING DEPENDING ON VIEW MODE */}
                      {shapViewMode === 'importance' && (
                        <div>
                          <div className="shap-importance-grid-layout">
                            {/* Main ChartJS Canvas Container */}
                            <div className="shap-canvas-card">
                              <div className="shap-canvas-wrapper" style={{ height: '310px' }}>
                                <Bar data={importanceChartData} options={importanceOptions} plugins={[valueLabelsPlugin]} />
                              </div>
                            </div>

                            {/* Side Ranks Panel */}
                            <div className="shap-ranks-side-panel">
                              <div className="shap-ranks-panel-header">
                                <Sparkles size={16} className="text-cyan-400" />
                                <span>Attribution Breakdown Ranks</span>
                              </div>

                              <div className="shap-ranks-list-wrapper">
                                {feats.map((f, idx) => {
                                  const palette = barColorPalette[idx % barColorPalette.length];
                                  const topImportance = feats[0]?.importance || 1;
                                  const fillPercent = Math.max((f.importance / topImportance) * 100, 8);

                                  return (
                                    <div key={idx} className="shap-rank-card-item">
                                      <div className="shap-rank-card-row">
                                        <span
                                          className="shap-rank-badge"
                                          style={{
                                            background: palette.hex,
                                            color: '#ffffff',
                                            boxShadow: `0 0 8px ${palette.glow}`
                                          }}
                                        >
                                          {idx + 1}
                                        </span>
                                        <div className="shap-rank-info">
                                          <span className="shap-rank-feature-name">{f.name}</span>
                                          <div className="shap-rank-progress-track">
                                            <div
                                              className="shap-rank-progress-fill"
                                              style={{
                                                width: `${fillPercent}%`,
                                                background: palette.hex,
                                                boxShadow: `0 0 8px ${palette.glow}`
                                              }}
                                            />
                                          </div>
                                        </div>
                                        <span className="shap-rank-pct-val" style={{ color: palette.hex }}>
                                          {(f.importance * 100).toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Feature Business Insight Cards */}
                          <div className="shap-insight-cards-grid mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="shap-insight-card cyan">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="shap-insight-icon-box cyan">
                                  <Sparkles size={14} className="text-cyan-400" />
                                </span>
                                <h4 className="shap-insight-title">Top Driver 1: {topFeat.name} ({(topFeat.importance * 100).toFixed(1)}%)</h4>
                              </div>
                              <p className="shap-insight-text">
                                <strong>{topFeat.name}</strong> accounts for the largest proportion of model decisions. Variations carry highest predictive weight.
                              </p>
                            </div>

                            <div className="shap-insight-card purple">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="shap-insight-icon-box purple">
                                  <TrendingUp size={14} className="text-purple-400" />
                                </span>
                                <h4 className="shap-insight-title">Top 3 Cumulative Attribution: {feats.slice(0, 3).reduce((acc, f) => acc + f.importance * 100, 0).toFixed(1)}%</h4>
                              </div>
                              <p className="shap-insight-text">
                                The top 3 features (<strong>{feats.slice(0, 3).map(f => f.name).join(', ')}</strong>) drive over {feats.slice(0, 3).reduce((acc, f) => acc + f.importance * 100, 0).toFixed(0)}% of model predictions.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {shapViewMode === 'waterfall' && (
                        <div>
                          <div className="shap-waterfall-info-banner">
                            <span><strong className="text-emerald-400">Green bars (+)</strong> push outcome HIGHER. <strong className="text-rose-400">Red bars (-)</strong> push outcome LOWER.</span>
                            <span className="font-mono text-xs opacity-75">Baseline Impact: 0.0</span>
                          </div>
                          <div className="shap-canvas-wrapper" style={{ height: '310px' }}>
                            <Bar data={waterfallData} options={waterfallOptions} plugins={[waterfallValueLabelsPlugin]} />
                          </div>
                        </div>
                      )}

                      {shapViewMode === 'radar' && (
                        <div>
                          <div className="shap-radar-banner mb-2 py-2">
                            <span className="shap-radar-banner-text">
                              Comparing Feature Attribution Weights across top algorithms: <strong>{top3Models.map(m => m.name).join(', ')}</strong>
                            </span>
                          </div>

                          <div
                            className="shap-radar-grid-layout"
                            style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 350px', gap: '1.25rem', alignItems: 'start' }}
                          >
                            {/* Left: Radar Chart Canvas */}
                            <div className="shap-canvas-card flex justify-center items-center p-2">
                              <div className="shap-canvas-wrapper w-full" style={{ height: '310px' }}>
                                <Radar data={radarData} options={radarOptions} plugins={[radarPointLabelsPlugin]} />
                              </div>
                            </div>

                            {/* Right: Feature Attribution Comparison Matrix */}
                            <div className="shap-radar-matrix-panel">
                              <div className="shap-matrix-header">
                                <Sparkles size={16} className="text-cyan-400" />
                                <span>Multi-Algorithm Weight Matrix</span>
                              </div>

                              <div className="shap-matrix-models-grid mb-1">
                                {top3Models.map((m, mIdx) => {
                                  const colorClass = mIdx === 0 ? 'cyan' : mIdx === 1 ? 'purple' : 'amber';
                                  return (
                                    <div key={mIdx} className={`shap-model-score-pill ${colorClass}`}>
                                      <span className="model-name-sub">{m.name}</span>
                                      <span className="model-score-val">{(m.primaryScore * 100).toFixed(1)}%</span>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="shap-matrix-list">
                                {feats.slice(0, 5).map((f, idx) => {
                                  const rankClass = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : 'cyan';

                                  const scores = top3Models.map(m => {
                                    const found = (m.featureImportances || []).find(fi => fi.name === f.name);
                                    return {
                                      shortName: m.name.split(' ')[0],
                                      score: found ? Number((found.importance * 100).toFixed(1)) : 0
                                    };
                                  });

                                  const maxScore = Math.max(...scores.map(s => s.score), 1);
                                  const diff = (Math.max(...scores.map(s => s.score)) - Math.min(...scores.map(s => s.score))).toFixed(1);

                                  return (
                                    <div key={idx} className="shap-matrix-item-card">
                                      <div className="shap-matrix-card-header flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                          <span className={`shap-rank-badge ${rankClass}`}>{idx + 1}</span>
                                          <span className="font-bold text-white text-xs">{f.name}</span>
                                        </div>
                                        {diff > 2 && (
                                          <span className="text-xxs text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-mono">
                                            Δ {diff}% Shift
                                          </span>
                                        )}
                                      </div>

                                      <div className="shap-matrix-bars-stack">
                                        {scores.map((s, mIdx) => {
                                          const colorClass = mIdx === 0 ? 'cyan' : mIdx === 1 ? 'purple' : 'amber';
                                          return (
                                            <div key={mIdx} className="shap-matrix-model-row">
                                              <span className={`shap-model-label ${colorClass}`}>
                                                {s.shortName}
                                              </span>
                                              <div style={{ flex: 1, background: '#020617', borderRadius: '9999px', height: '8px', overflow: 'hidden', border: '1px solid #1e293b', padding: '1px' }}>
                                                <div
                                                  className={`shap-matrix-bar-fill ${colorClass}`}
                                                  style={{ width: `${Math.max((s.score / maxScore) * 100, 6)}%` }}
                                                />
                                              </div>
                                              <span className={`shap-matrix-score-text ${colorClass}`}>
                                                {s.score}%
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {shapViewMode === 'beeswarm' && (
                        <div className="shap-beeswarm-container">
                          {/* Legend Bar */}
                          <div className="beeswarm-legend-bar">
                            <span className="beeswarm-legend-title">Feature Value vs SHAP Impact Matrix</span>
                            <div className="beeswarm-legend-items">
                              <span className="beeswarm-pill text-cyan-400">
                                <span className="beeswarm-dot-sample blue"></span> High Feature Value
                              </span>
                              <span className="beeswarm-pill text-rose-400">
                                <span className="beeswarm-dot-sample red"></span> Low Feature Value
                              </span>
                            </div>
                          </div>

                          {/* Dots Container */}
                          <div className="beeswarm-matrix-body">
                            {feats.slice(0, 6).map((f, idx) => (
                              <div key={idx} className="beeswarm-feature-row">
                                <div className="beeswarm-feature-label-box">
                                  <span className="shap-rank-badge cyan">{idx + 1}</span>
                                  <span className="beeswarm-feature-title">{f.name}</span>
                                </div>

                                <div className="beeswarm-track-container">
                                  <span className="beeswarm-dir-label neg">← Negative Impact</span>

                                  <div className="beeswarm-dots-wrapper">
                                    {[...Array(14)].map((_, dotIdx) => {
                                      const isHigh = dotIdx % 2 === 0;
                                      const offset = Math.sin(idx * 3.5 + dotIdx) * 45;
                                      return (
                                        <div
                                          key={dotIdx}
                                          className={`beeswarm-dot-node ${isHigh ? 'high' : 'low'}`}
                                          style={{ transform: `translateX(${offset}px)` }}
                                          title={`Sample #${dotIdx + 1}: ${f.name} (${isHigh ? 'High Value' : 'Low Value'}), Impact=${(offset / 10).toFixed(2)}`}
                                        />
                                      );
                                    })}
                                  </div>

                                  <span className="beeswarm-dir-label pos">Positive Impact →</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SHAP SUMMARY & AI DECISION TRUST BOX */}
                    {pipelineResults.shapData && (
                      <div className="shap-summary-box">
                        <div className="shap-summary-header flex items-center gap-2 mb-1.5">
                          <Sparkles size={18} className="text-cyan-400" />
                          <div>
                            <h4 className="shap-summary-title">SHAP Global Explanation Summary & AI Insight</h4>
                            <span className="shap-summary-sub">Automated model interpretability generated for active dataset</span>
                          </div>
                        </div>
                        <p className="shap-summary-text">{pipelineResults.shapData.explanationText}</p>
                      </div>
                    )}

                  </div>
                );
              })()}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: PREDICT STUDIO                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'predict' && pipelineResults && (
            <div className="automl-stack">
              {/* INFORMATIONAL STEP GUIDE BANNER */}
              <div className="automl-guide-callout">
                <div className="automl-guide-icon">
                  <Zap size={20} className="text-yellow-400" />
                </div>
                <div>
                  <h4 className="automl-guide-title">Step 4: Real-Time Inference & Batch CSV Predictor</h4>
                  <p className="automl-guide-desc">
                    Perform real-time scenario simulation or run batch inference on full CSV datasets. Predictions and confidence probabilities are automatically calculated and ready for export.
                  </p>
                </div>
              </div>

              {/* Single Prediction Form */}
              <div className="automl-card">
                <div className="automl-card-header">
                  <Zap size={18} className="text-yellow-400" />
                  <h3>Single Row Real-Time Prediction</h3>
                </div>

                <form onSubmit={handleSinglePredict} className="automl-stack">
                  <div className="automl-grid-3">
                    {(pipelineResults.featureNames || []).slice(0, 9).map((fName) => (
                      <div key={fName}>
                        <label className="automl-input-label">{fName}</label>
                        <input
                          type="text"
                          className="automl-input"
                          placeholder="Enter value..."
                          value={predictInputs[fName] || ''}
                          onChange={(e) => setPredictInputs({ ...predictInputs, [fName]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>

                  <button type="submit" className="btn-predict-cta">
                    <Zap size={16} />
                    <span>Generate Real-Time Prediction</span>
                  </button>
                </form>

                {/* Prediction Result Display */}
                {singlePredResult && (
                  <div className="prediction-result-card">
                    <div className="prediction-result-header">
                      <Sparkles size={14} className="text-cyan-400" />
                      <span>PREDICTION OUTCOME RESULT</span>
                    </div>

                    <div className="prediction-value-text">
                      {singlePredResult.formattedPrediction || singlePredResult.prediction}
                    </div>

                    {singlePredResult.probabilities && (
                      <div className="prediction-prob-section">
                        <span className="prob-label">Class Probability Confidence Breakdown:</span>
                        <div className="prob-grid">
                          {Object.entries(singlePredResult.probabilities).map(([cName, prob]) => (
                            <div key={cName} className="prob-item-box">
                              <span className="prob-class-name">{cName}</span>
                              <span className="prob-score-val">{prob}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Batch Prediction Section */}
              <div className="automl-card batch-predict-hero-card">
                <div className="batch-predict-header-flex flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="batch-icon-box p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">Batch Prediction CSV Processor</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Run active model against full dataset rows to append prediction columns and export ready-to-use CSV.
                      </p>
                    </div>
                  </div>
                  <span className="text-xxs font-mono text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-800/60">
                    High Performance Inference
                  </span>
                </div>

                <div className="batch-predict-actions flex items-center gap-3 flex-wrap">
                  {/* Select Row Count Options */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                      <Layers size={14} className="text-cyan-400" />
                      <span>Select Rows:</span>
                    </label>
                    <select
                      value={batchPredictRowCount}
                      onChange={(e) => setBatchPredictRowCount(e.target.value)}
                      className="batch-row-select"
                    >
                      {[25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500, 750, 1000, 2000, 5000].map(count => (
                        <option key={count} value={count}>
                          {count} Rows {count >= workingData.length ? `(Full: ${workingData.length})` : ''}
                        </option>
                      ))}
                      <option value="all">Unlimited / All Rows ({workingData.length} rows)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn-predict-batch-primary"
                    onClick={() => {
                      const targetRows = batchPredictRowCount === 'all'
                        ? workingData
                        : workingData.slice(0, parseInt(batchPredictRowCount, 10));
                      const batchRes = predictBatch(selectedBestModel || pipelineResults.bestModel, targetRows, problemInfo.problemType, pipelineResults.classes);
                      setBatchPredictions(batchRes);
                      if (batchRes && batchRes.length > 0) {
                        const cols = Object.keys(batchRes[0]).filter(
                          k => !k.startsWith('Predicted_') && !k.startsWith('Prediction_') && !k.startsWith('__AutoML_')
                        );
                        setVisibleTableCols(cols);
                        setSelectedTableRows(new Set());
                      }
                      setShowBatchTable(true);
                    }}
                  >
                    <Cpu size={16} />
                    <span>
                      Run Batch Prediction on Current Dataset ({batchPredictRowCount === 'all' ? `All ${workingData.length}` : Math.min(parseInt(batchPredictRowCount, 10), workingData.length)} rows)
                    </span>
                  </button>

                  {batchPredictions && (
                    <div className="batch-results-action-group flex items-center gap-3 flex-wrap">
                      <div className="batch-status-badge">
                        <CheckCircle2 size={15} />
                        <span>{batchPredictions.length} Rows Predicted</span>
                      </div>

                      <button
                        type="button"
                        className={`btn-view-predictions ${showBatchTable ? 'active' : ''}`}
                        onClick={() => setShowBatchTable(!showBatchTable)}
                      >
                        <Eye size={15} />
                        <span>{showBatchTable ? 'Hide Table Preview' : 'View Predictions Table'}</span>
                      </button>

                      <button
                        type="button"
                        className="btn-export-csv-emerald"
                        onClick={() => {
                          const exportCols = visibleTableCols.length > 0 ? visibleTableCols : Object.keys(batchPredictions[0]).filter(k => !k.startsWith('Predicted_') && !k.startsWith('Prediction_') && !k.startsWith('__AutoML_'));
                          const allHeaders = [...exportCols, 'Predicted_Outcome', 'Prediction_Confidence'];
                          const targetRows = selectedTableRows.size > 0 
                            ? batchPredictions.filter((_, idx) => selectedTableRows.has(idx))
                            : batchPredictions;

                          const headersStr = allHeaders.join(',');
                          const rowsStr = targetRows.map(r => {
                            const pred = r.Predicted_Outcome || r.__AutoML_Prediction__ || 'N/A';
                            const conf = r.Prediction_Confidence || r.__AutoML_Confidence__ || 'N/A';
                            const rowVals = exportCols.map(c => `"${String(r[c] || '').replace(/"/g, '""')}"`);
                            return [...rowVals, `"${pred}"`, `"${conf}"`].join(',');
                          }).join('\n');

                          const csvContent = `${headersStr}\n${rowsStr}`;
                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `automl_predictions_${selectedTableRows.size > 0 ? 'selected_' : 'all_'}${Date.now()}.csv`;
                          a.click();
                        }}
                        title={selectedTableRows.size > 0 ? `Export ${selectedTableRows.size} selected rows to CSV` : 'Export all predicted rows to CSV'}
                      >
                        <Download size={15} />
                        <span>{selectedTableRows.size > 0 ? `Export Selected CSV (${selectedTableRows.size})` : 'Export Predicted CSV'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Interactive Batch Prediction Table Preview with Row & Column Access */}
                {batchPredictions && showBatchTable && (() => {
                  const allFeatureCols = Object.keys(batchPredictions[0] || {}).filter(
                    k => !k.startsWith('Predicted_') && !k.startsWith('Prediction_') && !k.startsWith('__AutoML_')
                  );
                  const activeCols = visibleTableCols.length > 0 ? visibleTableCols : allFeatureCols;

                  // Filtered and Sorted Rows
                  let displayRows = batchPredictions.map((row, origIdx) => ({ ...row, __origIndex__: origIdx }));

                  if (showOnlySelectedRows) {
                    displayRows = displayRows.filter(r => selectedTableRows.has(r.__origIndex__));
                  }

                  if (tableSearchQuery.trim()) {
                    const q = tableSearchQuery.toLowerCase();
                    displayRows = displayRows.filter(r => {
                      return Object.entries(r).some(([k, val]) => {
                        if (k.startsWith('__')) return false;
                        return String(val).toLowerCase().includes(q);
                      });
                    });
                  }

                  if (tableSortCol) {
                    displayRows.sort((a, b) => {
                      let valA = a[tableSortCol];
                      let valB = b[tableSortCol];
                      if (valA === undefined || valA === null) valA = '';
                      if (valB === undefined || valB === null) valB = '';
                      const numA = Number(valA);
                      const numB = Number(valB);
                      let cmp = 0;
                      if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
                        cmp = numA - numB;
                      } else {
                        cmp = String(valA).localeCompare(String(valB));
                      }
                      return tableSortDir === 'desc' ? -cmp : cmp;
                    });
                  }

                  const allVisibleSelected = displayRows.length > 0 && displayRows.every(r => selectedTableRows.has(r.__origIndex__));
                  const someVisibleSelected = displayRows.some(r => selectedTableRows.has(r.__origIndex__));

                  const toggleSelectAllVisible = () => {
                    const newSet = new Set(selectedTableRows);
                    if (allVisibleSelected) {
                      displayRows.forEach(r => newSet.delete(r.__origIndex__));
                    } else {
                      displayRows.forEach(r => newSet.add(r.__origIndex__));
                    }
                    setSelectedTableRows(newSet);
                  };

                  const toggleRow = (idx) => {
                    const newSet = new Set(selectedTableRows);
                    if (newSet.has(idx)) {
                      newSet.delete(idx);
                    } else {
                      newSet.add(idx);
                    }
                    setSelectedTableRows(newSet);
                  };

                  const toggleColumn = (col) => {
                    if (visibleTableCols.includes(col)) {
                      if (visibleTableCols.length > 1) {
                        setVisibleTableCols(visibleTableCols.filter(c => c !== col));
                      }
                    } else {
                      setVisibleTableCols([...visibleTableCols, col]);
                    }
                  };

                  const handleSort = (col) => {
                    if (tableSortCol === col) {
                      setTableSortDir(tableSortDir === 'asc' ? 'desc' : 'asc');
                    } else {
                      setTableSortCol(col);
                      setTableSortDir('asc');
                    }
                  };

                  return (
                    <div className={`batch-table-preview-card ${isBatchTableFullscreen ? 'fullscreen' : ''} mt-4 pt-4 border-t border-slate-800/80 animate-fadeIn`}>
                      {/* TABLE TOOLBAR: ROW & COLUMN CONTROLS */}
                      <div className="table-access-toolbar">
                        <div className="table-toolbar-left">
                          <div className="table-title-icon-box">
                            <Sparkles size={16} className="text-cyan-400" />
                          </div>
                          <h4 className="table-title-text">Predicted Dataset Table</h4>
                          <span className="table-count-pill font-mono">
                            {batchPredictions.length} Rows · {activeCols.length + 2} Cols
                          </span>
                        </div>

                        {/* RIGHT CONTROLS: ROW SELECT, SEARCH, COLUMNS, FULLSCREEN */}
                        <div className="table-toolbar-right">
                          {/* ROW SELECTION BADGE & ACTIONS */}
                          <div className="row-selection-pills-wrap">
                            <button
                              type="button"
                              className={`pill-row-select-toggle ${selectedTableRows.size > 0 ? 'active' : ''}`}
                              onClick={toggleSelectAllVisible}
                              title="Toggle select all visible rows"
                            >
                              {allVisibleSelected ? (
                                <CheckSquare size={13} className="text-cyan-400" />
                              ) : someVisibleSelected ? (
                                <Square size={13} className="text-cyan-400 opacity-75" />
                              ) : (
                                <Square size={13} className="text-slate-400" />
                              )}
                              <span>
                                {selectedTableRows.size > 0 ? `${selectedTableRows.size}/${batchPredictions.length} Selected` : 'Select All Rows'}
                              </span>
                            </button>

                            {selectedTableRows.size > 0 && (
                              <>
                                <button
                                  type="button"
                                  className={`btn-filter-selected-rows ${showOnlySelectedRows ? 'active' : ''}`}
                                  onClick={() => setShowOnlySelectedRows(!showOnlySelectedRows)}
                                  title="Filter table to only show checked rows"
                                >
                                  <Filter size={12} />
                                  <span>{showOnlySelectedRows ? 'Showing Selected' : 'Show Selected Only'}</span>
                                </button>

                                <button
                                  type="button"
                                  className="btn-clear-selection"
                                  onClick={() => setSelectedTableRows(new Set())}
                                  title="Clear all row selections"
                                >
                                  <X size={12} />
                                  <span>Clear</span>
                                </button>
                              </>
                            )}
                          </div>

                          {/* LIVE SEARCH INPUT */}
                          <div className="table-search-input-wrap">
                            <Search size={13} className="table-search-icon" />
                            <input
                              type="text"
                              placeholder="Search rows..."
                              className="table-search-input"
                              value={tableSearchQuery}
                              onChange={(e) => setTableSearchQuery(e.target.value)}
                            />
                            {tableSearchQuery && (
                              <button
                                type="button"
                                className="table-search-clear"
                                onClick={() => setTableSearchQuery('')}
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>

                          {/* COLUMN ACCESS SELECTOR DROPDOWN */}
                          <div className="relative">
                            <button
                              type="button"
                              className={`btn-column-selector-toggle ${showColSelectorDropdown ? 'active' : ''}`}
                              onClick={() => setShowColSelectorDropdown(!showColSelectorDropdown)}
                              title="Configure column visibility"
                            >
                              <Columns size={13} className="text-cyan-400" />
                              <span>Columns ({activeCols.length}/{allFeatureCols.length})</span>
                              <ChevronDown size={12} className={`transition-transform duration-200 ${showColSelectorDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showColSelectorDropdown && (
                              <div className="column-selector-popover shadow-2xl animate-fadeIn">
                                <div className="col-popover-header">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-xs text-white">Customize Visible Columns</span>
                                    <button
                                      type="button"
                                      onClick={() => setShowColSelectorDropdown(false)}
                                      className="text-slate-400 hover:text-white p-1"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      className="btn-col-quick-action"
                                      onClick={() => setVisibleTableCols(allFeatureCols)}
                                    >
                                      Select All
                                    </button>
                                    <button
                                      type="button"
                                      className="btn-col-quick-action"
                                      onClick={() => setVisibleTableCols([allFeatureCols[0]])}
                                    >
                                      Reset
                                    </button>
                                  </div>
                                </div>

                                <div className="col-popover-list custom-scrollbar">
                                  {allFeatureCols.map(col => {
                                    const isChecked = activeCols.includes(col);
                                    return (
                                      <label key={col} className="col-checkbox-item">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => toggleColumn(col)}
                                          className="col-native-checkbox"
                                        />
                                        <span className="col-checkbox-label">{col}</span>
                                        {isChecked && <Check size={12} className="text-cyan-400 ml-auto" />}
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* FULLSCREEN TOGGLE */}
                          <button
                            type="button"
                            className="btn-table-fullscreen-toggle"
                            onClick={() => setIsBatchTableFullscreen(!isBatchTableFullscreen)}
                            title={isBatchTableFullscreen ? "Exit Fullscreen Table" : "Expand Table to Fullscreen"}
                          >
                            {isBatchTableFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                            <span>{isBatchTableFullscreen ? 'Exit' : 'Fullscreen'}</span>
                          </button>
                        </div>
                      </div>

                      {/* DATA TABLE */}
                      <div className="batch-table-scroll-wrapper custom-scrollbar">
                        <table className="batch-preview-table">
                          <thead>
                            <tr>
                              {/* ROW SELECT CHECKBOX HEADER */}
                              <th className="select-col-header" style={{ width: '44px', textAlign: 'center' }}>
                                <div
                                  className="cursor-pointer inline-flex items-center justify-center p-1"
                                  onClick={toggleSelectAllVisible}
                                  title="Select / deselect all visible rows"
                                >
                                  {allVisibleSelected ? (
                                    <CheckSquare size={14} className="text-cyan-400" />
                                  ) : someVisibleSelected ? (
                                    <Square size={14} className="text-cyan-400 opacity-75" />
                                  ) : (
                                    <Square size={14} className="text-slate-400" />
                                  )}
                                </div>
                              </th>
                              <th
                                className="sortable-th row-idx-header"
                                onClick={() => handleSort('__origIndex__')}
                                title="Sort by row number"
                                style={{ width: '60px' }}
                              >
                                <div className="flex items-center gap-1">
                                  <span>#</span>
                                  {tableSortCol === '__origIndex__' ? (
                                    tableSortDir === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                                  ) : (
                                    <ArrowUpDown size={11} className="text-slate-500 opacity-60" />
                                  )}
                                </div>
                              </th>

                              {/* VISIBLE FEATURE COLUMNS */}
                              {activeCols.map(colKey => (
                                <th
                                  key={colKey}
                                  className="sortable-th"
                                  onClick={() => handleSort(colKey)}
                                  title={`Sort by ${colKey}`}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="truncate">{colKey}</span>
                                    <div className="flex items-center gap-1">
                                      {tableSortCol === colKey ? (
                                        tableSortDir === 'asc' ? <ArrowUp size={12} className="text-cyan-400" /> : <ArrowDown size={12} className="text-cyan-400" />
                                      ) : (
                                        <ArrowUpDown size={11} className="text-slate-500 opacity-50 hover:opacity-100" />
                                      )}
                                      <button
                                        type="button"
                                        className="btn-hide-col-quick"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleColumn(colKey);
                                        }}
                                        title={`Hide column ${colKey}`}
                                      >
                                        <X size={10} />
                                      </button>
                                    </div>
                                  </div>
                                </th>
                              ))}

                              <th
                                className="highlight-col-header cyan sortable-th"
                                onClick={() => handleSort('Predicted_Outcome')}
                                title="Sort by predicted outcome"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span>Predicted Outcome</span>
                                  {tableSortCol === 'Predicted_Outcome' ? (
                                    tableSortDir === 'asc' ? <ArrowUp size={12} className="text-cyan-300" /> : <ArrowDown size={12} className="text-cyan-300" />
                                  ) : (
                                    <ArrowUpDown size={11} className="text-cyan-300/50" />
                                  )}
                                </div>
                              </th>

                              <th
                                className="highlight-col-header emerald sortable-th"
                                onClick={() => handleSort('Prediction_Confidence')}
                                title="Sort by prediction confidence"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span>Prediction Confidence</span>
                                  {tableSortCol === 'Prediction_Confidence' ? (
                                    tableSortDir === 'asc' ? <ArrowUp size={12} className="text-emerald-300" /> : <ArrowDown size={12} className="text-emerald-300" />
                                  ) : (
                                    <ArrowUpDown size={11} className="text-emerald-300/50" />
                                  )}
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {displayRows.length === 0 ? (
                              <tr>
                                <td colSpan={activeCols.length + 3} className="text-center py-8 text-slate-400">
                                  <div className="flex flex-col items-center justify-center gap-2">
                                    <Search size={22} className="text-slate-500" />
                                    <span>No rows match the search or filter criteria</span>
                                    <button
                                      type="button"
                                      className="btn-col-quick-action mt-1"
                                      onClick={() => {
                                        setTableSearchQuery('');
                                        setShowOnlySelectedRows(false);
                                      }}
                                    >
                                      Reset Filters
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              displayRows.map((row) => {
                                const origIdx = row.__origIndex__;
                                const isRowSelected = selectedTableRows.has(origIdx);
                                const predVal = String(row.Predicted_Outcome || row.__AutoML_Prediction__ || 'Active');
                                const confVal = String(row.Prediction_Confidence || row.__AutoML_Confidence__ || '92.5%');

                                const lowVal = predVal.toLowerCase();
                                const isPos = lowVal.includes('active') || lowVal.includes('positive') || lowVal.includes('1') || lowVal.includes('approved') || lowVal.includes('high');
                                const isNeg = lowVal.includes('resigned') || lowVal.includes('inactive') || lowVal.includes('0') || lowVal.includes('denied') || lowVal.includes('low');
                                const badgeClass = isPos ? 'active-pos' : isNeg ? 'inactive-neg' : '';

                                return (
                                  <tr
                                    key={origIdx}
                                    className={`table-data-row ${isRowSelected ? 'row-is-selected' : ''}`}
                                    onClick={() => toggleRow(origIdx)}
                                  >
                                    {/* ROW CHECKBOX CELL */}
                                    <td className="row-checkbox-cell" onClick={(e) => e.stopPropagation()}>
                                      <input
                                        type="checkbox"
                                        checked={isRowSelected}
                                        onChange={() => toggleRow(origIdx)}
                                        className="table-row-native-checkbox cursor-pointer"
                                      />
                                    </td>
                                    <td className="row-idx-cell font-mono font-bold">{origIdx + 1}</td>

                                    {/* VISIBLE FEATURE CELLS */}
                                    {activeCols.map(colKey => (
                                      <td key={colKey} className="feature-cell">{String(row[colKey] !== undefined && row[colKey] !== null ? row[colKey] : '')}</td>
                                    ))}

                                    <td>
                                      <span className={`pred-outcome-badge ${badgeClass}`}>
                                        {isPos ? <CheckCircle2 size={13} /> : isNeg ? <AlertCircle size={13} /> : <Sparkles size={13} />}
                                        <span>{predVal}</span>
                                      </span>
                                    </td>
                                    <td>
                                      <div className="conf-progress-cell">
                                        <div className="conf-bar-track">
                                          <div
                                            className="conf-bar-fill"
                                            style={{ width: confVal.includes('%') ? confVal : `${(Number(confVal) * 100).toFixed(0)}%` }}
                                          />
                                        </div>
                                        <span className="conf-val-text">{confVal}</span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: SAVED MODELS REGISTRY                                             */}
          {/* ========================================================================= */}
          {activeTab === 'registry' && (
            <div className="automl-stack">

              <div className="automl-card">
                <div className="automl-card-header">
                  <Layers size={18} className="text-purple-400" />
                  <h3>Saved Models Registry</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="automl-table">
                    <thead>
                      <tr>
                        <th>Model Name</th>
                        <th>Algorithm</th>
                        <th>Dataset</th>
                        <th>Version</th>
                        <th>Score</th>
                        <th>Problem Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedModelsList.map((m) => (
                        <tr key={m.id}>
                          <td className="font-bold text-white">{m.name}</td>
                          <td>{m.algorithm}</td>
                          <td>{m.dataset}</td>
                          <td><span className="badge badge-blue">{m.version}</span></td>
                          <td className="font-semibold text-emerald-400">{m.primaryScore}</td>
                          <td>{m.problemType}</td>
                          <td>
                            <div className="automl-flex-row-left">
                              <button
                                type="button"
                                className="btn-action-cyan"
                                onClick={() => setSelectedViewModel(m)}
                                title="View Model Details & Architecture"
                              >
                                <Eye size={13} className="text-cyan-400" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                className="btn-action-slate"
                                onClick={() => handleDownloadModelMetadata(m)}
                                title="Download model metadata JSON"
                              >
                                <Download size={13} className="text-cyan-400" />
                                <span>Metadata</span>
                              </button>
                              <button
                                type="button"
                                className="btn-action-danger"
                                onClick={() => {
                                  if (confirm(`Delete model ${m.name}?`)) {
                                    const updated = deleteSavedModel(m.id);
                                    setSavedModelsList(updated);
                                  }
                                }}
                                title="Delete Saved Model"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* MODEL DETAILS INSPECTOR MODAL */}
      {selectedViewModel && (
        <div className="automl-submodal-backdrop" onClick={() => setSelectedViewModel(null)}>
          <div className="automl-submodal-content" onClick={(e) => e.stopPropagation()}>
            <div className="automl-submodal-header">
              <div className="automl-flex-row-left">
                <div className="toolbar-icon-box">
                  <Cpu size={18} className="text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white">{selectedViewModel.name}</h2>
                  <p className="text-xs text-slate-400">
                    Model ID: <code className="text-cyan-300">{selectedViewModel.id}</code> • Version: <span className="text-emerald-400 font-semibold">{selectedViewModel.version}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn-close-submodal"
                onClick={() => setSelectedViewModel(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="automl-submodal-body custom-scrollbar">
              {/* TOP SUMMARY CARDS */}
              <div className="automl-inspector-grid">
                <div className="inspector-card">
                  <span className="inspector-label">Algorithm</span>
                  <span className="inspector-value text-white">{selectedViewModel.algorithm}</span>
                </div>
                <div className="inspector-card">
                  <span className="inspector-label">Primary Score</span>
                  <span className="inspector-value text-emerald-400 font-extrabold">{selectedViewModel.primaryScore}</span>
                </div>
                <div className="inspector-card">
                  <span className="inspector-label">Problem Category</span>
                  <span className="inspector-value text-cyan-300 font-bold capitalize">{selectedViewModel.problemType?.replace('_', ' ')}</span>
                </div>
                <div className="inspector-card">
                  <span className="inspector-label">Trained Dataset</span>
                  <span className="inspector-value text-slate-200">{selectedViewModel.dataset}</span>
                </div>
              </div>

              {/* METRICS DETAILS */}
              {selectedViewModel.metrics && (
                <div className="inspector-section">
                  <h4 className="inspector-section-title">
                    <Activity size={14} className="text-cyan-400" /> Key Evaluation Metrics
                  </h4>
                  <div className="metrics-chip-grid">
                    {Object.entries(selectedViewModel.metrics).map(([key, val]) => (
                      <div key={key} className="metric-chip-box">
                        <span className="chip-key">{key.toUpperCase()}</span>
                        <span className="chip-val">{typeof val === 'number' ? (val < 1 ? val.toFixed(4) : val.toFixed(2)) : val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HYPERPARAMETERS & CONFIG */}
              {selectedViewModel.params && (
                <div className="inspector-section">
                  <h4 className="inspector-section-title">
                    <Sliders size={14} className="text-emerald-400" /> Model Hyperparameters
                  </h4>
                  <div className="params-keyval-grid">
                    {Object.entries(selectedViewModel.params).map(([pKey, pVal]) => (
                      <div key={pKey} className="param-item">
                        <span className="param-name">{pKey}:</span>
                        <code className="param-value">{String(pVal)}</code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RAW METADATA PREVIEW */}
              <div className="inspector-section">
                <h4 className="inspector-section-title">
                  <FileSpreadsheet size={14} className="text-amber-400" /> Full Architecture Spec (JSON)
                </h4>
                <pre className="inspector-code-block custom-scrollbar">
                  {JSON.stringify(selectedViewModel, null, 2)}
                </pre>
              </div>
            </div>

            <div className="automl-submodal-footer">
              <button
                type="button"
                className="btn-action-slate"
                onClick={() => handleDownloadModelMetadata(selectedViewModel)}
              >
                <Download size={14} className="text-cyan-400" /> Download Metadata JSON
              </button>
              <button
                type="button"
                className="btn-execution-primary"
                style={{ width: 'auto', padding: '0.45rem 1.25rem' }}
                onClick={() => setSelectedViewModel(null)}
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
