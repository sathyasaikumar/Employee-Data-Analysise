import React, { useState, useMemo, useEffect } from 'react';
import {
  GitCompare, Plus, Trash2, Trophy, Zap, Heart, Shield,
  Layers, Check, Sparkles, RefreshCw, RotateCcw, BarChart2, FileText, Filter, Sliders,
  Database, ArrowRight, Activity, ArrowUpDown, FileSpreadsheet, Loader2, Compass
} from 'lucide-react';
import { fetchDatasetById } from '../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PALETTE = [
  { main: '#3b82f6', bg: 'rgba(59, 130, 246, 0.8)', lightBg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.4)', name: 'Blue' },
  { main: '#10b981', bg: 'rgba(16, 185, 129, 0.8)', lightBg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', name: 'Emerald' },
  { main: '#06b6d4', bg: 'rgba(6, 182, 212, 0.8)', lightBg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.4)', name: 'Cyan' },
  { main: '#f59e0b', bg: 'rgba(245, 158, 11, 0.8)', lightBg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', name: 'Amber' },
  { main: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.8)', lightBg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.4)', name: 'Purple' },
  { main: '#f43f5e', bg: 'rgba(244, 63, 94, 0.8)', lightBg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.4)', name: 'Rose' },
  { main: '#ec4899', bg: 'rgba(236, 72, 153, 0.8)', lightBg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.4)', name: 'Pink' }
];

export default function ComparisonView({
  data = [],
  headers = [],
  schema = {},
  stats = {},
  totalRows = 0,
  healthScore = 100,
  datasetName = 'Primary Dataset',
  datasetsList = [],
  onSelectDataset,
  theme = 'dark'
}) {
  // Mode selection: 'cohort' (within active dataset) vs 'cross_dataset' (compare 2 uploaded files)
  const [compareMode, setCompareMode] = useState(() => {
    return (datasetsList && datasetsList.length > 1) ? 'cross_dataset' : 'cohort';
  });

  // Cross-Dataset State
  const [dataset2Id, setDataset2Id] = useState('');
  const [dataset2Info, setDataset2Info] = useState(null);
  const [isLoadingDataset2, setIsLoadingDataset2] = useState(false);

  // Initialize dataset2 to first available other dataset
  useEffect(() => {
    if (datasetsList && datasetsList.length > 1) {
      const other = datasetsList.find(d => d.originalName !== datasetName && d.savedName !== datasetName);
      if (other && !dataset2Id) {
        setDataset2Id(other.id);
      }
    }
  }, [datasetsList, datasetName]);

  // Load dataset 2 details when dataset2Id changes
  useEffect(() => {
    if (!dataset2Id) {
      setDataset2Info(null);
      return;
    }
    let isMounted = true;
    const fetchDataset2 = async () => {
      try {
        setIsLoadingDataset2(true);
        const res = await fetchDatasetById(dataset2Id);
        if (isMounted && res && res.success) {
          setDataset2Info(res);
        }
      } catch (err) {
        console.warn('Failed to load second dataset for comparison:', err.message);
      } finally {
        if (isMounted) setIsLoadingDataset2(false);
      }
    };
    fetchDataset2();
    return () => { isMounted = false; };
  }, [dataset2Id]);

  // 1. SMART CSV COLUMN CLASSIFICATION
  const { categoricalCols, numericCols } = useMemo(() => {
    if (!headers.length || !data.length) return { categoricalCols: [], numericCols: [] };

    const cat = [];
    const num = [];

    headers.forEach(h => {
      const lower = h.toLowerCase();
      // Skip primary unique ID keys if almost all values are unique
      const uniqueVals = new Set(data.map(r => r[h])).size;
      const isIDColumn = lower.endsWith('_id') || lower === 'id' || lower.startsWith('id_') || (uniqueVals === data.length && data.length > 5);

      if (isIDColumn) return;

      // Check numeric
      let isNumeric = schema[h]?.type === 'number' || schema[h]?.type === 'integer' || schema[h]?.type === 'float';
      if (!isNumeric) {
        // Sample first 10 rows to detect numbers
        const sample = data.slice(0, 10).map(r => r[h]).filter(v => v !== null && v !== undefined && v !== '');
        const numCount = sample.filter(v => !isNaN(Number(v))).length;
        if (sample.length > 0 && numCount / sample.length > 0.7) {
          isNumeric = true;
        }
      }

      if (isNumeric) {
        num.push(h);
      } else if (uniqueVals >= 2 && uniqueVals <= Math.min(30, data.length)) {
        cat.push(h);
      }
    });

    // Fallback if no categorical column found
    if (cat.length === 0 && headers.length > 0) {
      headers.forEach(h => {
        const u = new Set(data.map(r => r[h])).size;
        if (u < data.length) cat.push(h);
      });
    }

    return { categoricalCols: cat, numericCols: num };
  }, [data, headers, schema]);

  // 2. DYNAMIC DIMENSION & METRIC SELECTION STATE (CSV-DEPENDENT)
  const [selectedDimension, setSelectedDimension] = useState('');
  const [primaryMetric, setPrimaryMetric] = useState('');
  const [secondaryMetric, setSecondaryMetric] = useState('');
  const [tertiaryMetric, setTertiaryMetric] = useState('');

  // Auto-set initial selections dependent on active CSV file headers
  useEffect(() => {
    if (categoricalCols.length > 0) {
      const prefDim = categoricalCols.find(c => c.includes('Department') || c.includes('Region') || c.includes('Work_Mode') || c.includes('Category')) || categoricalCols[0];
      setSelectedDimension(prefDim);
    }
    if (numericCols.length > 0) {
      const prefPrimary = numericCols.find(c => c.includes('Salary') || c.includes('Revenue') || c.includes('Sales') || c.includes('Compensation')) || numericCols[0];
      setPrimaryMetric(prefPrimary);

      const prefSec = numericCols.find(c => (c.includes('Rating') || c.includes('Score') || c.includes('Satisfaction') || c.includes('Units')) && c !== prefPrimary) || numericCols[1] || numericCols[0];
      setSecondaryMetric(prefSec);

      const prefTert = numericCols.find(c => c !== prefPrimary && c !== prefSec) || numericCols[2] || numericCols[0];
      setTertiaryMetric(prefTert);
    }
  }, [categoricalCols, numericCols]);

  // Extract unique group values for selected dimension
  const allAvailableGroups = useMemo(() => {
    if (!selectedDimension || !data.length) return [];
    const set = new Set();
    data.forEach(row => {
      if (row[selectedDimension] !== undefined && row[selectedDimension] !== null && row[selectedDimension] !== '') {
        set.add(String(row[selectedDimension]));
      }
    });
    return Array.from(set).sort();
  }, [data, selectedDimension]);

  // Selected multi-groups state
  const [selectedGroups, setSelectedGroups] = useState([]);

  // Sync selected groups when dimension changes
  useEffect(() => {
    if (allAvailableGroups.length > 0) {
      setSelectedGroups(allAvailableGroups.slice(0, Math.min(5, allAvailableGroups.length)));
    } else {
      setSelectedGroups([]);
    }
  }, [selectedDimension, allAvailableGroups]);

  // Group Handlers
  const handleAddGroup = (groupName) => {
    if (groupName && !selectedGroups.includes(groupName)) {
      setSelectedGroups([...selectedGroups, groupName]);
    }
  };

  const handleRemoveGroup = (groupName) => {
    if (selectedGroups.length <= 2) {
      alert('Comparison requires at least 2 active groups.');
      return;
    }
    setSelectedGroups(selectedGroups.filter(g => g !== groupName));
  };

  const handleSelectAll = () => {
    setSelectedGroups([...allAvailableGroups]);
  };

  // 3. UNIVERSAL VALUE FORMATTER DEPENDENT ON CSV COLUMN NAME & VALUE
  const formatMetricValue = (val, colName) => {
    if (val === undefined || val === null || isNaN(val)) return 'N/A';
    const lower = (colName || '').toLowerCase();

    // Currency
    if (lower.includes('salary') || lower.includes('revenue') || lower.includes('cost') || lower.includes('price') || lower.includes('profit') || lower.includes('compensation') || lower.includes('amount')) {
      return `$${Math.round(val).toLocaleString()}`;
    }
    // Percentage
    if (lower.includes('pct') || lower.includes('percent') || lower.includes('rate') || lower.includes('ratio') || lower.includes('discount')) {
      return `${parseFloat(val.toFixed(1))}%`;
    }
    // Standard decimal
    if (val % 1 !== 0) {
      return parseFloat(val.toFixed(2)).toString();
    }
    return val.toLocaleString();
  };

  // 4. DYNAMIC AGGREGATION FOR ALL SELECTED METRICS & GROUPS
  const groupStatsList = useMemo(() => {
    if (!selectedDimension || !selectedGroups.length) return [];

    return selectedGroups.map((grpName, index) => {
      const rows = data.filter(r => String(r[selectedDimension]) === grpName);

      const computeColAvg = (col) => {
        if (!col || !rows.length) return 0;
        let sum = 0, count = 0;
        rows.forEach(r => {
          const v = parseFloat(r[col]);
          if (!isNaN(v)) { sum += v; count++; }
        });
        return count ? sum / count : 0;
      };

      const primaryVal = computeColAvg(primaryMetric);
      const secondaryVal = computeColAvg(secondaryMetric);
      const tertiaryVal = computeColAvg(tertiaryMetric);

      // Active/Status Ratio
      let activeCount = 0;
      const statusCol = headers.find(h => h.toLowerCase().includes('status') || h.toLowerCase().includes('state'));
      if (statusCol) {
        rows.forEach(r => {
          const st = String(r[statusCol] || '').toLowerCase();
          if (st.includes('active') || st.includes('completed') || st.includes('high') || st.includes('passed')) activeCount++;
        });
      }

      const activePct = rows.length ? Math.round((activeCount / rows.length) * 100) : 100;
      const color = PALETTE[index % PALETTE.length];

      return {
        name: grpName,
        color,
        count: rows.length,
        primaryVal,
        secondaryVal,
        tertiaryVal,
        activePct
      };
    });
  }, [data, selectedDimension, selectedGroups, primaryMetric, secondaryMetric, tertiaryMetric, headers]);

  // Leaderboard Calculation
  const leaderboard = useMemo(() => {
    if (!groupStatsList.length) return {};
    const pLeader = [...groupStatsList].sort((a, b) => b.primaryVal - a.primaryVal)[0];
    const sLeader = [...groupStatsList].sort((a, b) => b.secondaryVal - a.secondaryVal)[0];
    const tLeader = [...groupStatsList].sort((a, b) => b.tertiaryVal - a.tertiaryVal)[0];
    const aLeader = [...groupStatsList].sort((a, b) => b.activePct - a.activePct)[0];

    return { pLeader, sLeader, tLeader, aLeader };
  }, [groupStatsList]);

  // Chart Data: Multi-Group Bar Chart
  const barChartData = {
    labels: [
      primaryMetric ? `${primaryMetric} (Avg)` : 'Primary Metric',
      secondaryMetric ? `${secondaryMetric} (Avg)` : 'Secondary Metric',
      tertiaryMetric ? `${tertiaryMetric} (Avg)` : 'Tertiary Metric',
      'Active / Completion %'
    ],
    datasets: groupStatsList.map(g => ({
      label: g.name,
      data: [
        g.primaryVal > 1000 ? g.primaryVal / 1000 : g.primaryVal,
        g.secondaryVal > 1000 ? g.secondaryVal / 1000 : g.secondaryVal * (g.secondaryVal <= 5 ? 20 : 1),
        g.tertiaryVal > 1000 ? g.tertiaryVal / 1000 : g.tertiaryVal * (g.tertiaryVal <= 5 ? 20 : 1),
        g.activePct
      ],
      backgroundColor: g.color.bg,
      borderColor: g.color.main,
      borderWidth: 2,
      borderRadius: 6
    }))
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
          font: { family: 'Inter', weight: '600', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#38bdf8',
        bodyColor: '#ffffff',
        padding: 12,
        cornerRadius: 10
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: theme === 'dark' ? '#94a3b8' : '#475569' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.06)' },
        ticks: { color: theme === 'dark' ? '#94a3b8' : '#475569' }
      }
    }
  };

  // Heatmap Highlighting Helper
  const getHeatmapClass = (val, key) => {
    if (!groupStatsList.length) return '';
    const vals = groupStatsList.map(g => g[key]);
    const maxVal = Math.max(...vals);
    const minVal = Math.min(...vals);

    if (val === maxVal && maxVal !== minVal) return 'cell-max';
    if (val === minVal && maxVal !== minVal) return 'cell-min';
    return '';
  };

  const unselectedGroups = allAvailableGroups.filter(g => !selectedGroups.includes(g));

  // 5. CROSS-DATASET COMPUTED COMPARISON (Dataset A vs Dataset B)
  const crossComparison = useMemo(() => {
    const ds1 = {
      name: datasetName || 'Primary Dataset',
      rowCount: totalRows || data.length,
      columnCount: headers.length,
      headers: headers,
      schema: schema,
      healthScore: healthScore !== undefined ? healthScore : 100,
      numericCols: numericCols
    };

    if (!dataset2Info || !dataset2Info.dataset) {
      return { ds1, ds2: null, sharedHeaders: [], sharedNumericStats: {} };
    }

    const d2Meta = dataset2Info.dataset;
    const d2Data = dataset2Info.data || [];
    const d2Headers = d2Meta.columns ? d2Meta.columns.map(c => typeof c === 'string' ? c : c.name) : (d2Data.length > 0 ? Object.keys(d2Data[0]) : []);

    const ds2 = {
      id: d2Meta.id,
      name: d2Meta.originalName || 'Dataset B',
      rowCount: d2Meta.rowCount || d2Data.length,
      columnCount: d2Headers.length,
      headers: d2Headers,
      healthScore: d2Meta.healthScore !== undefined ? d2Meta.healthScore : 95,
      fileSize: d2Meta.fileSize || 'N/A',
      data: d2Data
    };

    // Shared / overlapping column names
    const sharedHeaders = headers.filter(h1 =>
      d2Headers.some(h2 => h2.toLowerCase() === h1.toLowerCase())
    );

    // Compute averages for shared numeric headers
    const sharedNumericStats = {};
    sharedHeaders.forEach(h => {
      const d2Key = d2Headers.find(k => k.toLowerCase() === h.toLowerCase());
      const valsA = data.map(r => parseFloat(r[h])).filter(v => !isNaN(v));
      const valsB = d2Data.map(r => parseFloat(r[d2Key])).filter(v => !isNaN(v));

      const avgA = valsA.length ? valsA.reduce((a, b) => a + b, 0) / valsA.length : null;
      const avgB = valsB.length ? valsB.reduce((a, b) => a + b, 0) / valsB.length : null;

      if (avgA !== null || avgB !== null) {
        sharedNumericStats[h] = { avgA: avgA || 0, avgB: avgB || 0 };
      }
    });

    return { ds1, ds2, sharedHeaders, sharedNumericStats };
  }, [datasetName, totalRows, data, headers, schema, healthScore, numericCols, dataset2Info]);

  // Cross-Dataset Bar Chart Data
  const crossBarChartData = useMemo(() => {
    if (!crossComparison.ds2) return null;
    const { ds1, ds2 } = crossComparison;

    return {
      labels: ['Record Volume (Rows)', 'Feature Count (Columns)', 'Health Index Score (%)'],
      datasets: [
        {
          label: ds1.name,
          data: [ds1.rowCount, ds1.columnCount, ds1.healthScore],
          backgroundColor: 'rgba(56, 189, 248, 0.85)',
          borderColor: '#38bdf8',
          borderWidth: 1.5,
          borderRadius: 6
        },
        {
          label: ds2.name,
          data: [ds2.rowCount, ds2.columnCount, ds2.healthScore],
          backgroundColor: 'rgba(168, 85, 247, 0.85)',
          borderColor: '#a855f7',
          borderWidth: 1.5,
          borderRadius: 6
        }
      ]
    };
  }, [crossComparison]);

  return (
    <div className="comparison-view-container">
      {/* Top Header & Mode Toggle */}
      <div className="comparison-controls-card">
        <div className="controls-header-title">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="csv-file-context-badge">
              <FileText size={15} className="text-accent-blue" />
              <span>Multi-Dataset Analysis & Comparison Engine • {datasetName}</span>
            </div>

            {/* Mode Switcher */}
            <div className="comparison-mode-toggle-group">
              <button
                type="button"
                className={`mode-toggle-btn ${compareMode === 'cross_dataset' ? 'active' : ''}`}
                onClick={() => setCompareMode('cross_dataset')}
              >
                <GitCompare size={12} />
                <span>Multi-Dataset Analysis ({datasetsList.length || 'Unlimited'})</span>
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${compareMode === 'cohort' ? 'active' : ''}`}
                onClick={() => setCompareMode('cohort')}
              >
                <Layers size={12} />
                <span>Single-Dataset Cohorts</span>
              </button>
            </div>
          </div>

          <h2>{compareMode === 'cross_dataset' ? 'Multi-Dataset Cross Comparative Intelligence' : 'Dynamic CSV Group Comparison Studio'}</h2>
          <p className="controls-subtitle">
            {compareMode === 'cross_dataset'
              ? 'Compare across unlimited uploaded datasets side-by-side with deep statistical metrics, feature overlap, schema alignment, and health checks.'
              : 'Compare performance, metrics, and aggregates across dynamic groups derived directly from your active CSV file.'}
          </p>
        </div>

        {/* CROSS-DATASET SELECTOR BAR */}
        {compareMode === 'cross_dataset' ? (
          <div className="cross-dataset-selector-bar">
            <div className="cross-dataset-box dataset-a-box">
              <div className="box-tag">DATASET 1 (ACTIVE)</div>
              <div className="box-title truncate" title={datasetName}>
                <Database size={15} className="text-sky-400" />
                <span>{datasetName}</span>
              </div>
              <div className="box-meta">
                <span>{totalRows ? totalRows.toLocaleString() : data.length} rows</span> •
                <span>{headers.length} features</span> •
                <span className="text-emerald-400">{healthScore}% health</span>
              </div>
            </div>

            <div className="cross-vs-indicator">
              <button
                type="button"
                className="vs-circle vs-swap-btn"
                onClick={() => {
                  if (dataset2Id && onSelectDataset) {
                    onSelectDataset(dataset2Id);
                  }
                }}
                title={dataset2Id ? `Click circular arrow to swap: make "${crossComparison.ds2?.name || 'Dataset 2'}" the active dataset` : 'VS'}
              >
                <span className="vs-text">VS</span>
                <RotateCcw size={14} className="vs-swap-icon" />
              </button>
            </div>

            <div className="cross-dataset-box dataset-b-box">
              <div className="box-tag">DATASET 2 (TARGET)</div>
              <div className="flex items-center gap-2">
                <Database size={15} className="text-purple-400" />
                <select
                  className="auth-input auth-select cross-select"
                  value={dataset2Id}
                  onChange={(e) => setDataset2Id(e.target.value)}
                >
                  <option value="" disabled>Select Second Dataset to Compare...</option>
                  {datasetsList.map(ds => (
                    <option key={ds.id} value={ds.id}>
                      {ds.originalName} ({ds.rowCount ? ds.rowCount.toLocaleString() : '?'} rows)
                    </option>
                  ))}
                </select>
              </div>
              {dataset2Info?.dataset && (
                <div className="box-meta">
                  <span>{dataset2Info.dataset.rowCount?.toLocaleString()} rows</span> •
                  <span>{dataset2Info.dataset.columnCount || (dataset2Info.data?.[0] ? Object.keys(dataset2Info.data[0]).length : 0)} features</span> •
                  <span className="text-emerald-400">{dataset2Info.dataset.healthScore || 95}% health</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* SINGLE DATASET COHORT SELECTORS */
          <div className="multi-group-manager">
            <div className="csv-selectors-row">
              <div className="csv-selector-item">
                <label className="selector-label text-accent-cyan">
                  <Layers size={14} className="inline mr-1" />
                  Comparison Dimension (Group By):
                </label>
                <select
                  className="auth-input auth-select"
                  value={selectedDimension}
                  onChange={(e) => setSelectedDimension(e.target.value)}
                >
                  {categoricalCols.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="csv-selector-item">
                <label className="selector-label text-accent-blue">
                  <Sliders size={14} className="inline mr-1" />
                  Primary CSV Metric:
                </label>
                <select
                  className="auth-input auth-select"
                  value={primaryMetric}
                  onChange={(e) => setPrimaryMetric(e.target.value)}
                >
                  {numericCols.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="csv-selector-item">
                <label className="selector-label text-accent-emerald">
                  <Sliders size={14} className="inline mr-1" />
                  Secondary CSV Metric:
                </label>
                <select
                  className="auth-input auth-select"
                  value={secondaryMetric}
                  onChange={(e) => setSecondaryMetric(e.target.value)}
                >
                  {numericCols.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Comparison Group Chips Bar */}
            <div className="active-groups-bar">
              <span className="active-groups-title">Active Comparison Groups ({selectedGroups.length} Selected):</span>
              <div className="active-chips-flex">
                {groupStatsList.map((g) => (
                  <div
                    key={g.name}
                    className="multi-group-chip"
                    style={{
                      backgroundColor: g.color.lightBg,
                      borderColor: g.color.border,
                      color: g.color.main
                    }}
                  >
                    <span className="chip-dot" style={{ backgroundColor: g.color.main }} />
                    <span className="chip-name">{g.name}</span>
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() => handleRemoveGroup(g.name)}
                      title={`Remove ${g.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {unselectedGroups.length > 0 && (
                  <select
                    className="add-group-select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) handleAddGroup(e.target.value);
                    }}
                  >
                    <option value="" disabled>+ Add Group...</option>
                    {unselectedGroups.map(grp => (
                      <option key={grp} value={grp}>{grp}</option>
                    ))}
                  </select>
                )}

                {allAvailableGroups.length > selectedGroups.length && (
                  <button
                    type="button"
                    className="select-all-btn"
                    onClick={handleSelectAll}
                  >
                    <Sparkles size={14} className="text-amber" />
                    <span>Compare All ({allAvailableGroups.length})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          CROSS-DATASET COMPARISON CONTENT
          ========================================================================= */}
      {compareMode === 'cross_dataset' ? (
        isLoadingDataset2 ? (
          <div className="loading-card flex items-center justify-center p-8 gap-3">
            <Loader2 size={24} className="animate-spin text-sky-400" />
            <span>Analyzing and cross-referencing second dataset...</span>
          </div>
        ) : !crossComparison.ds2 ? (
          <div className="empty-compare-state p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800">
            <GitCompare size={36} className="mx-auto mb-3 text-sky-400 opacity-60" />
            <h3 className="text-lg font-bold">Select a Second Dataset Above to Compare</h3>
            <p className="text-slate-400 text-sm mt-1">Upload multiple files or choose from your saved datasets to perform side-by-side comparative analysis.</p>
          </div>
        ) : (
          <div className="cross-compare-results-container flex flex-col gap-6 mt-6">
            {/* Head-to-Head KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="metric-card bg-slate-900/70 p-4 rounded-xl border border-sky-500/30">
                <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-1">Record Volume Δ</div>
                <div className="text-xl font-extrabold text-white">
                  {crossComparison.ds1.rowCount.toLocaleString()} vs {crossComparison.ds2.rowCount.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Difference: {Math.abs(crossComparison.ds1.rowCount - crossComparison.ds2.rowCount).toLocaleString()} rows ({Math.round((crossComparison.ds1.rowCount / (crossComparison.ds2.rowCount || 1)) * 100)}%)
                </div>
              </div>

              <div className="metric-card bg-slate-900/70 p-4 rounded-xl border border-purple-500/30">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Feature Diversity</div>
                <div className="text-xl font-extrabold text-white">
                  {crossComparison.ds1.columnCount} vs {crossComparison.ds2.columnCount} Cols
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Overlapping features: <strong className="text-cyan-400">{crossComparison.sharedHeaders.length} shared columns</strong>
                </div>
              </div>

              <div className="metric-card bg-slate-900/70 p-4 rounded-xl border border-emerald-500/30">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Health & Integrity</div>
                <div className="text-xl font-extrabold text-white">
                  {crossComparison.ds1.healthScore}% vs {crossComparison.ds2.healthScore}%
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {crossComparison.ds1.healthScore >= crossComparison.ds2.healthScore ? 'Dataset 1 has higher data purity' : 'Dataset 2 has higher data purity'}
                </div>
              </div>

              <div className="metric-card bg-slate-900/70 p-4 rounded-xl border border-amber-500/30 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Quick Switch</div>
                  <div className="text-sm font-bold text-slate-200 truncate">{crossComparison.ds2.name}</div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary mt-2 flex items-center justify-center gap-1.5 py-1 text-xs"
                  onClick={() => onSelectDataset && onSelectDataset(crossComparison.ds2.id)}
                >
                  <ArrowRight size={12} /> Set as Active Analysis
                </button>
              </div>
            </div>

            {/* Visual Side-by-Side Chart */}
            {crossBarChartData && (
              <div className="chart-card p-5 bg-slate-900/70 rounded-xl border border-slate-800">
                <h3 className="text-base font-bold text-white mb-1">Cross-Dataset Dimensional Overview</h3>
                <span className="text-xs text-slate-400 block mb-4">Side-by-side volume, feature count, and health score comparison</span>
                <div style={{ height: '300px' }}>
                  <Bar data={crossBarChartData} options={barChartOptions} />
                </div>
              </div>
            )}

            {/* Shared Attributes Comparison Table */}
            {crossComparison.sharedHeaders.length > 0 && (
              <div className="chart-card p-5 bg-slate-900/70 rounded-xl border border-slate-800">
                <h3 className="text-base font-bold text-white mb-1">Shared Feature Attributes & Overlap Analysis</h3>
                <span className="text-xs text-slate-400 block mb-4">Features present in both {crossComparison.ds1.name} and {crossComparison.ds2.name}</span>
                <div className="comparison-table-wrapper overflow-x-auto">
                  <table className="comparison-table w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="p-2 text-left text-slate-400 font-bold">Feature Name</th>
                        <th className="p-2 text-left text-sky-400 font-bold">{crossComparison.ds1.name}</th>
                        <th className="p-2 text-left text-purple-400 font-bold">{crossComparison.ds2.name}</th>
                        <th className="p-2 text-left text-emerald-400 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crossComparison.sharedHeaders.map(headerName => {
                        const numStat = crossComparison.sharedNumericStats[headerName];
                        return (
                          <tr key={headerName} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="p-2 font-semibold text-white">{headerName}</td>
                            <td className="p-2 text-slate-300">
                              {numStat ? `Avg: ${formatMetricValue(numStat.avgA, headerName)}` : (crossComparison.ds1.schema[headerName] || 'Present')}
                            </td>
                            <td className="p-2 text-slate-300">
                              {numStat ? `Avg: ${formatMetricValue(numStat.avgB, headerName)}` : 'Present'}
                            </td>
                            <td className="p-2 text-emerald-400 font-semibold flex items-center gap-1">
                              <Check size={13} /> Aligned
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        /* =========================================================================
           SINGLE-DATASET COHORT VIEW CONTENT
           ========================================================================= */
        <>
          {/* Leaderboard Winner Highlights */}
          {leaderboard && leaderboard.pLeader && (
            <div className="leaderboard-grid">
              <div className="leader-card card-salary">
                <div className="leader-header">
                  <Trophy size={18} className="text-amber" />
                  <span className="leader-title">Top {primaryMetric || 'Primary'} Leader</span>
                </div>
                <h4 className="leader-name">{leaderboard.pLeader.name}</h4>
                <p className="leader-val">{formatMetricValue(leaderboard.pLeader.primaryVal, primaryMetric)} avg</p>
              </div>

              {leaderboard.sLeader && (
                <div className="leader-card card-perf">
                  <div className="leader-header">
                    <Zap size={18} className="text-cyan" />
                    <span className="leader-title">Top {secondaryMetric || 'Secondary'} Leader</span>
                  </div>
                  <h4 className="leader-name">{leaderboard.sLeader.name}</h4>
                  <p className="leader-val">{formatMetricValue(leaderboard.sLeader.secondaryVal, secondaryMetric)} avg</p>
                </div>
              )}

              {leaderboard.tLeader && (
                <div className="leader-card card-sat">
                  <div className="leader-header">
                    <Heart size={18} className="text-rose" />
                    <span className="leader-title">Top {tertiaryMetric || 'Tertiary'} Leader</span>
                  </div>
                  <h4 className="leader-name">{leaderboard.tLeader.name}</h4>
                  <p className="leader-val">{formatMetricValue(leaderboard.tLeader.tertiaryVal, tertiaryMetric)} avg</p>
                </div>
              )}

              {leaderboard.aLeader && (
                <div className="leader-card card-ret">
                  <div className="leader-header">
                    <Shield size={18} className="text-emerald" />
                    <span className="leader-title">Retention / Active Champion</span>
                  </div>
                  <h4 className="leader-name">{leaderboard.aLeader.name}</h4>
                  <p className="leader-val">{leaderboard.aLeader.activePct}% active</p>
                </div>
              )}
            </div>
          )}

          {/* Multi-Group Side-by-Side Cards Grid */}
          <div className="multi-group-cards-grid" style={{ gridTemplateColumns: `repeat(${Math.min(selectedGroups.length, 5)}, 1fr)` }}>
            {groupStatsList.map((g) => (
              <div
                key={g.name}
                className="multi-stat-column-card"
                style={{ borderColor: g.color.border }}
              >
                <div className="multi-card-header" style={{ backgroundColor: g.color.lightBg }}>
                  <span className="multi-group-badge" style={{ backgroundColor: g.color.main }}>
                    {g.name}
                  </span>
                  <span className="count-pill">{g.count} records</span>
                </div>

                <div className="multi-card-metrics">
                  {primaryMetric && (
                    <div className="metric-row">
                      <span className="m-label">Avg {primaryMetric}</span>
                      <span className="m-val">{formatMetricValue(g.primaryVal, primaryMetric)}</span>
                    </div>
                  )}

                  {secondaryMetric && (
                    <div className="metric-row">
                      <span className="m-label">Avg {secondaryMetric}</span>
                      <span className="m-val">{formatMetricValue(g.secondaryVal, secondaryMetric)}</span>
                    </div>
                  )}

                  {tertiaryMetric && (
                    <div className="metric-row">
                      <span className="m-label">Avg {tertiaryMetric}</span>
                      <span className="m-val">{formatMetricValue(g.tertiaryVal, tertiaryMetric)}</span>
                    </div>
                  )}

                  <div className="metric-row">
                    <span className="m-label">Active Ratio</span>
                    <span className="m-val">{g.activePct}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visual Bar Chart */}
          <div className="comparison-charts-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="chart-card">
              <div className="chart-card-header">
                <h3 className="chart-title">CSV Metric Distribution Chart ({selectedDimension})</h3>
                <span className="chart-subtitle">Side-by-side comparative visualization for {selectedGroups.length} groups</span>
              </div>
              <div className="chart-container-box" style={{ height: '320px' }}>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          </div>

          {/* Multi-Group Heatmap Table */}
          <div className="chart-card" style={{ marginTop: '1.5rem' }}>
            <div className="chart-card-header">
              <h3 className="chart-title">Dynamic CSV Heatmap Comparison Matrix</h3>
              <span className="chart-subtitle">Automatically calculated metrics from uploaded CSV file</span>
            </div>

            <div className="comparison-table-wrapper">
              <table className="comparison-table multi-heatmap-table">
                <thead>
                  <tr>
                    <th>CSV Metric / Attribute</th>
                    {groupStatsList.map(g => (
                      <th key={g.name} style={{ color: g.color.main }}>{g.name}</th>
                    ))}
                    <th>🏆 Category Leader</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-semibold">Sample Record Count</td>
                    {groupStatsList.map(g => (
                      <td key={g.name} className={getHeatmapClass(g.count, 'count')}>
                        {g.count} rows
                      </td>
                    ))}
                    <td className="font-semibold text-accent-blue">{leaderboard?.pLeader?.name || 'N/A'}</td>
                  </tr>

                  {primaryMetric && (
                    <tr>
                      <td className="font-semibold">Avg {primaryMetric}</td>
                      {groupStatsList.map(g => (
                        <td key={g.name} className={getHeatmapClass(g.primaryVal, 'primaryVal')}>
                          {formatMetricValue(g.primaryVal, primaryMetric)}
                        </td>
                      ))}
                      <td className="font-semibold text-accent-emerald">{leaderboard?.pLeader?.name || 'N/A'}</td>
                    </tr>
                  )}

                  {secondaryMetric && (
                    <tr>
                      <td className="font-semibold">Avg {secondaryMetric}</td>
                      {groupStatsList.map(g => (
                        <td key={g.name} className={getHeatmapClass(g.secondaryVal, 'secondaryVal')}>
                          {formatMetricValue(g.secondaryVal, secondaryMetric)}
                        </td>
                      ))}
                      <td className="font-semibold text-accent-cyan">{leaderboard?.sLeader?.name || 'N/A'}</td>
                    </tr>
                  )}

                  {tertiaryMetric && (
                    <tr>
                      <td className="font-semibold">Avg {tertiaryMetric}</td>
                      {groupStatsList.map(g => (
                        <td key={g.name} className={getHeatmapClass(g.tertiaryVal, 'tertiaryVal')}>
                          {formatMetricValue(g.tertiaryVal, tertiaryMetric)}
                        </td>
                      ))}
                      <td className="font-semibold text-accent-amber">{leaderboard?.tLeader?.name || 'N/A'}</td>
                    </tr>
                  )}

                  <tr>
                    <td className="font-semibold">Active Status Ratio</td>
                    {groupStatsList.map(g => (
                      <td key={g.name} className={getHeatmapClass(g.activePct, 'activePct')}>
                        {g.activePct}%
                      </td>
                    ))}
                    <td className="font-semibold text-accent-emerald">{leaderboard?.aLeader?.name || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
