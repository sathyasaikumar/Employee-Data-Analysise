import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { Bar, Line, Doughnut, Radar, PolarArea, Scatter } from 'react-chartjs-2';
import {
  Sparkles,
  Download,
  FileImage,
  Camera,
  FileSpreadsheet,
  Copy,
  Check,
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Radar as RadarIcon,
  Compass,
  Zap,
  Sliders,
  Palette,
  Maximize2
} from 'lucide-react';

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
          return v !== undefined && v !== null ? (typeof v === 'object' ? JSON.stringify(v) : v) : '';
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
        className="chart-export-trigger-btn"
        onClick={() => setIsOpen(prev => !prev)}
        title="Export chart in high resolution"
      >
        <Download size={13} />
        <span>Export</span>
      </button>

      {isOpen && (
        <div className="chart-export-dropdown">
          <div className="chart-export-title">Export Chart Visualization</div>
          <button type="button" className="chart-export-item" onClick={() => handleDownload('png')}>
            <FileImage size={12} className="text-cyan-400" />
            <span>Download High-Res PNG</span>
          </button>
          <button type="button" className="chart-export-item" onClick={() => handleDownload('jpeg')}>
            <Camera size={12} className="text-pink-400" />
            <span>Download JPEG</span>
          </button>
          <button type="button" className="chart-export-item" onClick={handleCSVDownload}>
            <FileSpreadsheet size={12} className="text-emerald-400" />
            <span>Export Chart Aggregation (CSV)</span>
          </button>
          <div className="chart-export-divider" />
          <button type="button" className="chart-export-item" onClick={handleCopyImage}>
            {copied ? <Check size={12} className="text-teal-400" /> : <Copy size={12} className="text-amber-400" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy to Clipboard'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

const COLOR_PALETTES = {
  electric: ['#0284c7', '#38bdf8', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'],
  emerald: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#0d9488', '#14b8a6', '#2dd4bf', '#a7f3d0'],
  sunset: ['#f43f5e', '#fb7185', '#fda4af', '#f97316', '#fb923c', '#e11d48', '#be123c', '#f59e0b'],
  cyberpunk: ['#ec4899', '#a855f7', '#8b5cf6', '#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e']
};

export default function CustomChartBuilder({ data = [], headers = [], schema = {}, theme = 'dark' }) {
  const customChartRef = useRef(null);
  const categoricalHeaders = headers.filter(h => schema?.[h] === 'categorical' || schema?.[h] === 'datetime');
  const numericHeaders = headers.filter(h => schema?.[h] === 'numeric');

  const defaultX = categoricalHeaders[0] || headers[0] || '';
  const defaultY = numericHeaders[0] || headers[1] || headers[0] || '';

  const [xAxis, setXAxis] = useState(defaultX);
  const [yAxis, setYAxis] = useState(defaultY);
  const [aggregation, setAggregation] = useState('mean'); // mean, sum, count, min, max
  const [chartType, setChartType] = useState('bar'); // bar, line, doughnut, radar, polarArea, scatter, histogram
  const [palette, setPalette] = useState('electric');
  const [histogramBins, setHistogramBins] = useState(10);

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

  const currentColors = COLOR_PALETTES[palette] || COLOR_PALETTES.electric;

  // ----------------------------------------------------
  // 1. Grouped Aggregation Data
  // ----------------------------------------------------
  const { labels, chartValues, scatterData, trendline, histogramData } = useMemo(() => {
    if (!data || data.length === 0) {
      return { labels: [], chartValues: [], scatterData: [], trendline: null, histogramData: null };
    }

    const groupMap = {};
    const scatterPts = [];
    const numValuesY = [];

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
        numValuesY.push(yVal);
        const xNum = typeof rawX === 'number' ? rawX : Number(String(rawX).replace(/[\$,]/g, ''));
        if (!isNaN(xNum)) {
          scatterPts.push({ x: xNum, y: yVal });
        }
      }
    });

    const lbls = Object.keys(groupMap).slice(0, 24); // top 24 categories
    const vals = lbls.map(label => {
      const v = groupMap[label];
      if (!v || v.length === 0) return 0;
      if (aggregation === 'sum') return Number(v.reduce((a, b) => a + b, 0).toFixed(2));
      if (aggregation === 'mean') return Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(2));
      if (aggregation === 'count') return v.length;
      if (aggregation === 'min') {
        const minVal = Math.min(...v);
        return isFinite(minVal) ? Number(minVal.toFixed(2)) : 0;
      }
      if (aggregation === 'max') {
        const maxVal = Math.max(...v);
        return isFinite(maxVal) ? Number(maxVal.toFixed(2)) : 0;
      }
      return 0;
    });

    // Calculate Linear Regression Trendline for Scatter
    let tLine = null;
    if (scatterPts.length > 2) {
      const n = scatterPts.length;
      const sumX = scatterPts.reduce((acc, p) => acc + p.x, 0);
      const sumY = scatterPts.reduce((acc, p) => acc + p.y, 0);
      const sumXY = scatterPts.reduce((acc, p) => acc + p.x * p.y, 0);
      const sumX2 = scatterPts.reduce((acc, p) => acc + p.x * p.x, 0);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
      const intercept = (sumY - slope * sumX) / n;

      const sortedX = scatterPts.map(p => p.x).sort((a, b) => a - b);
      const minX = sortedX[0];
      const maxX = sortedX[sortedX.length - 1];
      tLine = {
        slope: Number(slope.toFixed(4)),
        intercept: Number(intercept.toFixed(2)),
        points: [
          { x: minX, y: Number((slope * minX + intercept).toFixed(2)) },
          { x: maxX, y: Number((slope * maxX + intercept).toFixed(2)) }
        ]
      };
    }

    // Calculate Histogram Bins & Density
    let hist = null;
    if (numValuesY.length > 0) {
      const min = Math.min(...numValuesY);
      const max = Math.max(...numValuesY);
      const binWidth = (max - min) / (histogramBins || 10) || 1;
      const bins = Array.from({ length: histogramBins }, (_, i) => ({
        label: `${Math.round(min + i * binWidth)} - ${Math.round(min + (i + 1) * binWidth)}`,
        count: 0
      }));

      numValuesY.forEach(val => {
        let idx = Math.floor((val - min) / binWidth);
        if (idx >= histogramBins) idx = histogramBins - 1;
        if (idx < 0) idx = 0;
        bins[idx].count++;
      });

      hist = {
        labels: bins.map(b => b.label),
        counts: bins.map(b => b.count)
      };
    }

    return { labels: lbls, chartValues: vals, scatterData: scatterPts, trendline: tLine, histogramData: hist };
  }, [data, activeX, activeY, aggregation, histogramBins]);

  if (!data || data.length === 0 || !activeX) {
    return (
      <div className="chart-card">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No data available for building custom visualization.
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. ChartJS Dataset Configurations
  // ----------------------------------------------------
  const chartData = {
    labels,
    datasets: [
      {
        label: `${aggregation.toUpperCase()} of ${activeY} by ${activeX}`,
        data: chartValues,
        backgroundColor: chartType === 'doughnut' || chartType === 'polarArea' || chartType === 'radar'
          ? currentColors
          : `${currentColors[0]}cc`,
        borderColor: chartType === 'doughnut' || chartType === 'polarArea'
          ? (isLight ? '#ffffff' : '#0f172a')
          : currentColors[0],
        borderWidth: 2,
        borderRadius: chartType === 'bar' ? 6 : 0,
        fill: chartType === 'line' || chartType === 'radar',
        pointBackgroundColor: currentColors[1] || currentColors[0],
        pointRadius: 4
      }
    ]
  };

  const scatterChartData = {
    datasets: [
      {
        label: `${activeY} vs ${activeX} Data Points`,
        data: scatterData,
        backgroundColor: `${currentColors[0]}bb`,
        borderColor: currentColors[0],
        pointRadius: 5,
        pointHoverRadius: 7
      },
      ...(trendline ? [{
        type: 'line',
        label: `Regression Trendline (Slope: ${trendline.slope})`,
        data: trendline.points,
        borderColor: '#f43f5e',
        borderWidth: 2,
        borderDash: [6, 4],
        fill: false,
        pointRadius: 0
      }] : [])
    ]
  };

  const histogramChartData = histogramData ? {
    labels: histogramData.labels,
    datasets: [
      {
        label: `Frequency Distribution of ${activeY}`,
        data: histogramData.counts,
        backgroundColor: `${currentColors[2] || currentColors[0]}bb`,
        borderColor: currentColors[2] || currentColors[0],
        borderWidth: 1.5,
        borderRadius: 4
      }
    ]
  } : chartData;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, font: { family: 'Inter', size: 10, weight: 'bold' } }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        borderColor: tooltipBorder,
        borderWidth: 1
      }
    },
    scales: chartType === 'radar' || chartType === 'polarArea' ? {
      r: {
        grid: { color: gridColor },
        angleLines: { color: gridColor },
        pointLabels: { color: textColor, font: { family: 'Inter', size: 9.5 } },
        ticks: { backdropColor: 'transparent', color: textColor }
      }
    } : chartType !== 'doughnut' ? {
      x: {
        ticks: { color: textColor, font: { family: 'Inter', size: 9.5 } },
        grid: { color: gridColor }
      },
      y: {
        ticks: { color: textColor, font: { family: 'Inter', size: 9.5 } },
        grid: { color: gridColor }
      }
    } : {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="chart-builder-controls" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
            <Compass size={13} className="text-cyan-400" />
            X-Axis (Dimension / Category)
          </label>
          <select value={activeX} onChange={(e) => setXAxis(e.target.value)}>
            {headers.map(h => (
              <option key={h} value={h}>{h} ({schema?.[h] || 'unknown'})</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
            <Activity size={13} className="text-pink-400" />
            Y-Axis (Measure / Metric)
          </label>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
            <Sliders size={13} className="text-amber-400" />
            Aggregation Function
          </label>
          <select value={aggregation} onChange={(e) => setAggregation(e.target.value)}>
            <option value="mean">Average (Mean)</option>
            <option value="sum">Sum / Total</option>
            <option value="count">Count (Frequency)</option>
            <option value="min">Minimum Value</option>
            <option value="max">Maximum Value</option>
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
            <BarChart3 size={13} className="text-indigo-400" />
            Visualization Architecture
          </label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="bar">📊 Modern Bar Chart</option>
            <option value="line">📈 Smooth Line & Trend</option>
            <option value="doughnut">🍩 Donut Ring Chart</option>
            <option value="radar">🕸️ Spider / Radar Benchmark</option>
            <option value="polarArea">🌐 Polar Area Radial</option>
            <option value="scatter">🎯 Scatter Plot + Trendline</option>
            <option value="histogram">📉 KDE Frequency Histogram</option>
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
            <Palette size={13} className="text-emerald-400" />
            Color Palette Theme
          </label>
          <select value={palette} onChange={(e) => setPalette(e.target.value)}>
            <option value="electric">⚡ Electric Sky & Purple</option>
            <option value="emerald">🌿 Emerald Mint Gradient</option>
            <option value="sunset">🌅 Sunset Rose & Amber</option>
            <option value="cyberpunk">🔮 Cyberpunk Neon</option>
          </select>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} className="text-amber-400" />
            <div>
              <h3 className="chart-title" style={{ margin: 0 }}>
                {chartType === 'scatter'
                  ? `Scatter Correlation: ${activeY} vs ${activeX}`
                  : chartType === 'histogram'
                  ? `KDE Distribution Histogram of ${activeY}`
                  : `Custom Analytics: ${aggregation.toUpperCase()}(${activeY}) by ${activeX}`}
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
                Interactive dynamic calculation with live retina canvas rendering and export
              </p>
            </div>
          </div>

          <ChartExportMenu
            containerRef={customChartRef}
            chartData={chartType === 'scatter' ? scatterChartData : chartType === 'histogram' ? histogramChartData : chartData}
            chartTitle={`Custom_${chartType}_${activeY}_by_${activeX}`}
            theme={theme}
          />
        </div>

        <div className="chart-container custom-builder-chart-container" ref={customChartRef} style={{ height: '340px', minHeight: '340px' }}>
          {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
          {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
          {chartType === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}
          {chartType === 'radar' && <Radar data={chartData} options={chartOptions} />}
          {chartType === 'polarArea' && <PolarArea data={chartData} options={chartOptions} />}
          {chartType === 'scatter' && <Scatter data={scatterChartData} options={chartOptions} />}
          {chartType === 'histogram' && <Bar data={histogramChartData} options={chartOptions} />}
        </div>
      </div>
    </div>
  );
}
