import React, { useState, useMemo, useEffect } from 'react';
import { 
  GitCompare, Plus, Trash2, Trophy, Zap, Heart, Shield, 
  Layers, Check, Sparkles, RefreshCw, BarChart2, FileText, Filter, Sliders 
} from 'lucide-react';
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

export default function ComparisonView({ data = [], headers = [], schema = {}, theme = 'dark' }) {
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

  return (
    <div className="comparison-view-container">
      {/* Top CSV Context Header & Controls */}
      <div className="comparison-controls-card">
        <div className="controls-header-title">
          <div className="csv-file-context-badge">
            <FileText size={15} className="text-accent-blue" />
            <span>CSV Dataset Comparison Engine • {data.length.toLocaleString()} Rows & {headers.length} Columns</span>
          </div>
          <h2>Dynamic CSV-Dependent Comparison Studio</h2>
          <p className="controls-subtitle">Compare performance, metrics, and aggregates across dynamic groups derived directly from your loaded CSV file.</p>
        </div>

        {/* Dynamic CSV Dimension & Metric Selection Grid */}
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

              {/* Add Group Dropdown */}
              {unselectedGroups.length > 0 && (
                <div className="add-group-dropdown-wrapper">
                  <select
                    className="add-group-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddGroup(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>+ Add Group...</option>
                    {unselectedGroups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              )}

              {selectedGroups.length < allAvailableGroups.length && (
                <button
                  type="button"
                  className="btn btn-secondary select-all-btn"
                  onClick={handleSelectAll}
                >
                  <Sparkles size={14} className="text-amber" />
                  <span>Compare All ({allAvailableGroups.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Winner Highlights */}
      {leaderboard.pLeader && (
        <div className="leaderboard-grid">
          <div className="leader-card card-salary">
            <div className="leader-header">
              <Trophy size={18} className="text-amber" />
              <span className="leader-title">Top {primaryMetric || 'Primary'} Leader</span>
            </div>
            <h4 className="leader-name">{leaderboard.pLeader.name}</h4>
            <p className="leader-val">{formatMetricValue(leaderboard.pLeader.primaryVal, primaryMetric)} avg</p>
          </div>

          <div className="leader-card card-perf">
            <div className="leader-header">
              <Zap size={18} className="text-cyan" />
              <span className="leader-title">Top {secondaryMetric || 'Secondary'} Leader</span>
            </div>
            <h4 className="leader-name">{leaderboard.sLeader.name}</h4>
            <p className="leader-val">{formatMetricValue(leaderboard.sLeader.secondaryVal, secondaryMetric)} avg</p>
          </div>

          <div className="leader-card card-sat">
            <div className="leader-header">
              <Heart size={18} className="text-rose" />
              <span className="leader-title">Top {tertiaryMetric || 'Tertiary'} Leader</span>
            </div>
            <h4 className="leader-name">{leaderboard.tLeader.name}</h4>
            <p className="leader-val">{formatMetricValue(leaderboard.tLeader.tertiaryVal, tertiaryMetric)} avg</p>
          </div>

          <div className="leader-card card-ret">
            <div className="leader-header">
              <Shield size={18} className="text-emerald" />
              <span className="leader-title">Retention / Active Champion</span>
            </div>
            <h4 className="leader-name">{leaderboard.aLeader.name}</h4>
            <p className="leader-val">{leaderboard.aLeader.activePct}% active</p>
          </div>
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
                <td className="font-semibold text-accent-blue">{leaderboard.pLeader?.name || 'N/A'}</td>
              </tr>

              {primaryMetric && (
                <tr>
                  <td className="font-semibold">Avg {primaryMetric}</td>
                  {groupStatsList.map(g => (
                    <td key={g.name} className={getHeatmapClass(g.primaryVal, 'primaryVal')}>
                      {formatMetricValue(g.primaryVal, primaryMetric)}
                    </td>
                  ))}
                  <td className="font-semibold text-accent-emerald">{leaderboard.pLeader?.name || 'N/A'}</td>
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
                  <td className="font-semibold text-accent-cyan">{leaderboard.sLeader?.name || 'N/A'}</td>
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
                  <td className="font-semibold text-accent-amber">{leaderboard.tLeader?.name || 'N/A'}</td>
                </tr>
              )}

              <tr>
                <td className="font-semibold">Active Status Ratio</td>
                {groupStatsList.map(g => (
                  <td key={g.name} className={getHeatmapClass(g.activePct, 'activePct')}>
                    {g.activePct}%
                  </td>
                ))}
                <td className="font-semibold text-accent-emerald">{leaderboard.aLeader?.name || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
