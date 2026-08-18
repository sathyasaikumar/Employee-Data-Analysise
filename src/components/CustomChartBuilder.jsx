import React, { useState, useEffect, useRef } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Sparkles,
  Download,
  FileImage,
  Camera,
  FileSpreadsheet,
  Copy,
  Check
} from 'lucide-react';

function ChartExportMenu({ containerRef, chartData, chartTitle, theme = 'dark' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleDownload = (format) => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = canvas.width;
    offCanvas.height = canvas.height;
    const ctx = offCanvas.getContext('2d');

    const isLight = theme === 'light';
    ctx.fillStyle = isLight ? '#ffffff' : '#0f172a';
    ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = offCanvas.toDataURL(mimeType, 1.0);

    const cleanTitle = (chartTitle || 'chart').replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.download = `${cleanTitle}.${format === 'jpeg' ? 'jpg' : 'png'}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  const handleCSVDownload = () => {
    if (!chartData || !chartData.labels) return;
    const labels = chartData.labels || [];
    const datasets = chartData.datasets || [];

    const headers = ['Category / Dimension', ...datasets.map(d => d.label || 'Value')];
    const rows = labels.map((label, idx) => {
      const rowVals = [
        `"${label.toString().replace(/"/g, '""')}"`,
        ...datasets.map(d => {
          const v = d.data ? d.data[idx] : '';
          return v !== undefined && v !== null ? v : '';
        })
      ];
      return rowVals.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const cleanTitle = (chartTitle || 'chart_data').replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.download = `${cleanTitle}_data.csv`;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOpen(false);
  };

  const handleCopyImage = async () => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;

    try {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = canvas.width;
      offCanvas.height = canvas.height;
      const ctx = offCanvas.getContext('2d');
      const isLight = theme === 'light';
      ctx.fillStyle = isLight ? '#ffffff' : '#0f172a';
      ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
      ctx.drawImage(canvas, 0, 0);

      offCanvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
            setIsOpen(false);
          }, 1500);
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  return (
    <div className="chart-export-wrap" ref={menuRef}>
      <button
        type="button"
        className={`chart-export-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        title="Download / Export this Graph"
      >
        <Download size={11} />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="chart-export-dropdown">
          <div className="export-dropdown-header">Export Graph</div>
          <button type="button" className="export-dropdown-item" onClick={() => handleDownload('png')}>
            <FileImage size={12} className="text-blue-400" />
            <span>Download PNG (HD)</span>
          </button>
          <button type="button" className="export-dropdown-item" onClick={() => handleDownload('jpeg')}>
            <Camera size={12} className="text-purple-400" />
            <span>Download JPG Image</span>
          </button>
          <button type="button" className="export-dropdown-item" onClick={handleCSVDownload}>
            <FileSpreadsheet size={12} className="text-emerald-400" />
            <span>Export Data (CSV)</span>
          </button>
          <button type="button" className="export-dropdown-item" onClick={handleCopyImage}>
            {copied ? <Check size={12} className="text-teal-400" /> : <Copy size={12} className="text-amber-400" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function CustomChartBuilder({ data = [], headers = [], schema = {}, theme = 'dark' }) {
  const customChartRef = useRef(null);
  const categoricalHeaders = headers.filter(h => schema[h] === 'categorical' || schema[h] === 'datetime');
  const numericHeaders = headers.filter(h => schema[h] === 'numeric');

  const defaultX = categoricalHeaders[0] || headers[0] || '';
  const defaultY = numericHeaders[0] || headers[1] || headers[0] || '';

  const [xAxis, setXAxis] = useState(defaultX);
  const [yAxis, setYAxis] = useState(defaultY);
  const [aggregation, setAggregation] = useState('mean'); // mean, sum, count, min, max
  const [chartType, setChartType] = useState('bar'); // bar, line, doughnut

  // Automatically update X and Y axes when dataset headers change
  useEffect(() => {
    if (!headers.includes(xAxis)) {
      setXAxis(defaultX);
    }
    if (!headers.includes(yAxis)) {
      setYAxis(defaultY);
    }
  }, [headers]);

  const activeX = headers.includes(xAxis) ? xAxis : defaultX;
  const activeY = headers.includes(yAxis) ? yAxis : defaultY;

  const isLight = theme === 'light';
  const textColor = isLight ? '#334155' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.05)';
  const tooltipBg = isLight ? '#ffffff' : '#0f1627';
  const tooltipTitle = isLight ? '#0f172a' : '#f1f5f9';
  const tooltipBody = isLight ? '#475569' : '#94a3b8';
  const tooltipBorder = isLight ? '#cbd5e1' : '#243252';

  if (!data || data.length === 0 || !activeX) {
    return (
      <div className="chart-card">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No data available for building custom visualization.
        </div>
      </div>
    );
  }

  // Aggregate Data based on selected parameters
  const groupMap = {};

  data.forEach(row => {
    if (!row) return;
    const rawX = row[activeX];
    const xVal = rawX !== undefined && rawX !== null && rawX !== '' ? rawX.toString() : 'N/A';
    
    const rawY = row[activeY];
    const yVal = typeof rawY === 'number' 
      ? rawY 
      : Number((rawY || 0).toString().replace(/[\$,]/g, ''));

    if (!groupMap[xVal]) {
      groupMap[xVal] = [];
    }
    if (!isNaN(yVal)) {
      groupMap[xVal].push(yVal);
    }
  });

  const labels = Object.keys(groupMap);
  const chartValues = labels.map(label => {
    const vals = groupMap[label];
    if (!vals || vals.length === 0) return 0;

    if (aggregation === 'sum') {
      return Number(vals.reduce((a, b) => a + b, 0).toFixed(2));
    } else if (aggregation === 'mean') {
      return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
    } else if (aggregation === 'count') {
      return vals.length;
    } else if (aggregation === 'min') {
      const minVal = Math.min(...vals);
      return isFinite(minVal) ? Number(minVal.toFixed(2)) : 0;
    } else if (aggregation === 'max') {
      const maxVal = Math.max(...vals);
      return isFinite(maxVal) ? Number(maxVal.toFixed(2)) : 0;
    }
    return 0;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: `${aggregation.toUpperCase()} of ${activeY} by ${activeX}`,
        data: chartValues,
        backgroundColor: chartType === 'doughnut' 
          ? ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
          : 'rgba(59, 130, 246, 0.75)',
        borderColor: '#3b82f6',
        borderWidth: 2,
        borderRadius: 6,
        fill: chartType === 'line'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, font: { family: 'Inter' } }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        borderColor: tooltipBorder,
        borderWidth: 1
      }
    },
    scales: chartType !== 'doughnut' ? {
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor }
      },
      y: {
        ticks: { color: textColor },
        grid: { color: gridColor }
      }
    } : {}
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="chart-builder-controls">
        <div className="form-group">
          <label>X-Axis (Dimension / Category)</label>
          <select value={activeX} onChange={(e) => setXAxis(e.target.value)}>
            {headers.map(h => (
              <option key={h} value={h}>{h} ({schema[h] || 'unknown'})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Y-Axis (Measure / Metric)</label>
          <select value={activeY} onChange={(e) => setYAxis(e.target.value)}>
            {numericHeaders.length > 0 ? (
              numericHeaders.map(h => (
                <option key={h} value={h}>{h}</option>
              ))
            ) : (
              headers.map(h => <option key={h} value={h}>{h}</option>)
            )}
          </select>
        </div>

        <div className="form-group">
          <label>Aggregation Function</label>
          <select value={aggregation} onChange={(e) => setAggregation(e.target.value)}>
            <option value="mean">Average (Mean)</option>
            <option value="sum">Sum / Total</option>
            <option value="count">Count (Frequency)</option>
            <option value="min">Minimum Value</option>
            <option value="max">Maximum Value</option>
          </select>
        </div>

        <div className="form-group">
          <label>Chart Visualization Type</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="bar">Bar Chart</option>
            <option value="line">Line / Trend Chart</option>
            <option value="doughnut">Donut Chart</option>
          </select>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            <Sparkles size={18} className="text-amber-400" />
            Custom Visualization: {aggregation.toUpperCase()}({activeY}) grouped by {activeX}
          </h3>
          <ChartExportMenu
            containerRef={customChartRef}
            chartData={chartData}
            chartTitle={`Custom_${aggregation}_${activeY}_by_${activeX}`}
            theme={theme}
          />
        </div>
        <div className="chart-container" ref={customChartRef} style={{ height: '400px' }}>
          {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
          {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
          {chartType === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}
        </div>
      </div>
    </div>
  );
}

