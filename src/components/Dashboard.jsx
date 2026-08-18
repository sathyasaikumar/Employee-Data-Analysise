import React, { useState, useEffect, useRef } from 'react';
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
import { Bar, Doughnut, Line, Radar } from 'react-chartjs-2';
import {
  PieChart,
  BarChart2,
  TrendingUp,
  Grid,
  Activity,
  Layers,
  Download,
  FileImage,
  Camera,
  FileSpreadsheet,
  Copy,
  Check
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

export default function Dashboard({ dashboardMetrics, totalRows, filteredCount, theme = 'dark' }) {
  // References for chart container DOM nodes for canvas download
  const catChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const boxPlotChartRef = useRef(null);
  const ratingDistChartRef = useRef(null);
  const timeSeriesChartRef = useRef(null);
  const radarChartRef = useRef(null);

  if (!dashboardMetrics) {
    return <div style={{ color: 'var(--text-muted)' }}>No data available for display.</div>;
  }

  const isLight = theme === 'light';
  const textColor = isLight ? '#334155' : '#94a3b8';
  const gridColor = isLight ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.05)';
  const tooltipBg = isLight ? '#ffffff' : '#0f1627';
  const tooltipTitle = isLight ? '#0f172a' : '#f1f5f9';
  const tooltipBody = isLight ? '#475569' : '#94a3b8';
  const tooltipBorder = isLight ? '#cbd5e1' : '#243252';

  const chartOptionsDark = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 10, padding: 6, color: textColor, font: { family: 'Arial', size: 9.5, weight: 'bold' } }
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        borderColor: tooltipBorder,
        borderWidth: 1
      }
    },
    scales: {
      x: { ticks: { color: textColor, font: { family: 'Arial', size: 9.5 } }, grid: { color: gridColor } },
      y: { ticks: { color: textColor, font: { family: 'Arial', size: 9.5 } }, grid: { color: gridColor } }
    }
  };

  const radarOptionsDark = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 10, padding: 6, color: textColor, font: { family: 'Arial', size: 9.5, weight: 'bold' } } }
    },
    scales: {
      r: {
        angleLines: { color: isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)' },
        grid: { color: isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.08)' },
        pointLabels: { color: textColor, font: { family: 'Arial', size: 9.5, weight: 'bold' } },
        ticks: { backdropColor: 'transparent', color: textColor }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { boxWidth: 10, padding: 6, color: textColor, font: { family: 'Arial', size: 9.5, weight: 'bold' } } }
    }
  };

  const {
    primaryCat,
    secondaryCat,
    primaryNum,
    secondaryNum,
    dateHeader,
    primaryCatFreq = {},
    secondaryCatFreq = {},
    boxPlotData = {},
    secondaryNumFreq = {},
    timeSeriesMap = {}
  } = dashboardMetrics;

  // Cap chart categories to top 8 meaningful items (no oversized dominant 'Others' bar)
  const getTopCategories = (freqMap, maxItems = 8) => {
    if (!freqMap) return {};
    const sorted = Object.entries(freqMap)
      .filter(([k]) => k && k !== 'undefined' && k !== 'null' && k !== '')
      .sort((a, b) => b[1] - a[1]);

    if (sorted.length <= maxItems) return Object.fromEntries(sorted);

    const top = {};
    sorted.slice(0, maxItems).forEach(([key, val]) => {
      top[key] = val;
    });
    return top;
  };

  const topPrimaryFreq = getTopCategories(primaryCatFreq);
  const topSecondaryFreq = getTopCategories(secondaryCatFreq);

  // 1. Primary Category Breakdown (Vibrant Modern Gradient Bar)
  const catChartData = {
    labels: Object.keys(topPrimaryFreq),
    datasets: [
      {
        label: `Count by ${primaryCat}`,
        data: Object.values(topPrimaryFreq),
        backgroundColor: [
          'rgba(14, 165, 233, 0.85)',
          'rgba(56, 189, 248, 0.85)',
          'rgba(99, 102, 241, 0.85)',
          'rgba(129, 140, 248, 0.85)',
          'rgba(168, 85, 247, 0.85)',
          'rgba(192, 132, 252, 0.85)',
          'rgba(236, 72, 153, 0.85)',
          'rgba(244, 63, 94, 0.85)'
        ],
        borderColor: [
          '#0ea5e9', '#38bdf8', '#6366f1', '#818cf8',
          '#a855f7', '#c084fc', '#ec4899', '#f43f5e'
        ],
        borderWidth: 1.5,
        borderRadius: 6
      }
    ]
  };

  // 2. Secondary Breakdown (Sleek Donut Chart)
  const donutChartData = {
    labels: Object.keys(topSecondaryFreq),
    datasets: [
      {
        data: Object.values(topSecondaryFreq),
        backgroundColor: [
          '#38bdf8', '#818cf8', '#c084fc', '#f472b6',
          '#34d399', '#fbbf24', '#fb7185', '#2dd4bf'
        ],
        borderWidth: 2,
        borderColor: isLight ? '#ffffff' : '#0f172a'
      }
    ]
  };

  // 3. Metric vs Secondary Cat Box Plot / Quartile Range
  const boxCategories = Object.keys(boxPlotData).slice(0, 6);
  const boxMedianData = boxCategories.map(c => boxPlotData[c].median);
  const boxQ1Data = boxCategories.map(c => boxPlotData[c].q1);
  const boxQ3Data = boxCategories.map(c => boxPlotData[c].q3);

  const boxPlotChartData = {
    labels: boxCategories,
    datasets: [
      {
        label: `Q1 (25th %)`,
        data: boxQ1Data,
        backgroundColor: 'rgba(56, 189, 248, 0.35)',
        borderColor: '#38bdf8',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: `Median (${primaryNum || 'Metric'})`,
        data: boxMedianData,
        backgroundColor: 'rgba(14, 165, 233, 0.85)',
        borderColor: '#0284c7',
        borderWidth: 1.5,
        borderRadius: 6
      },
      {
        label: `Q3 (75th %)`,
        data: boxQ3Data,
        backgroundColor: 'rgba(99, 102, 241, 0.55)',
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  // 4. Secondary Metric Distribution (Histogram)
  const numDistLabels = Object.keys(secondaryNumFreq).sort((a, b) => Number(a) - Number(b)).slice(0, 10);
  const numDistValues = numDistLabels.map(l => secondaryNumFreq[l]);

  const ratingDistData = {
    labels: numDistLabels,
    datasets: [
      {
        label: `Count by ${secondaryNum}`,
        data: numDistValues,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderColor: '#10b981',
        borderWidth: 1.5,
        borderRadius: 6
      }
    ]
  };

  // 5. Time Series Trend Line Chart (Area Trend)
  const timeLabels = Object.keys(timeSeriesMap).sort();
  const timeValues = timeLabels.map(t => timeSeriesMap[t]);

  const timeSeriesChartData = {
    labels: timeLabels.length > 0 ? timeLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: `Volume Trend over Time`,
        data: timeValues.length > 0 ? timeValues : [120, 190, 300, 250, 420, 510],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#06b6d4'
      }
    ]
  };

  // 6. Capability Radar Spider Chart
  const radarLabels = Object.keys(topPrimaryFreq).slice(0, 6);
  const radarValues = radarLabels.map(l => topPrimaryFreq[l]);

  const radarChartData = {
    labels: radarLabels,
    datasets: [
      {
        label: `Relative Density Index`,
        data: radarValues,
        backgroundColor: 'rgba(139, 92, 246, 0.25)',
        borderColor: '#8b5cf6',
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#8b5cf6'
      }
    ]
  };

  return (
    <div className="dashboard-grid">
      {/* 1. Attrition / Count by Department */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            <BarChart2 size={13} className="text-red-400" />
            Distribution by {primaryCat}
          </h3>
          <ChartExportMenu
            containerRef={catChartRef}
            chartData={catChartData}
            chartTitle={`Distribution_by_${primaryCat}`}
            theme={theme}
          />
        </div>
        <div className="chart-container" ref={catChartRef}>
          <Bar data={catChartData} options={chartOptionsDark} />
        </div>
      </div>

      {/* 2. Work Mode Distribution */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            <PieChart size={13} className="text-rose-400" />
            Breakdown by {secondaryCat}
          </h3>
          <ChartExportMenu
            containerRef={donutChartRef}
            chartData={donutChartData}
            chartTitle={`Breakdown_by_${secondaryCat}`}
            theme={theme}
          />
        </div>
        <div className="chart-container" ref={donutChartRef}>
          <Doughnut data={donutChartData} options={doughnutOptions} />
        </div>
      </div>

      {/* 3. Salary vs Status Box Plot / Whisker Simulation Chart */}
      {primaryNum && (
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <TrendingUp size={13} className="text-blue-400" />
              {primaryNum} Range & Quartiles vs. {secondaryCat}
            </h3>
            <ChartExportMenu
              containerRef={boxPlotChartRef}
              chartData={boxPlotChartData}
              chartTitle={`${primaryNum}_vs_${secondaryCat}`}
              theme={theme}
            />
          </div>
          <div className="chart-container" ref={boxPlotChartRef}>
            <Bar data={boxPlotChartData} options={chartOptionsDark} />
          </div>
        </div>
      )}

      {/* 4. Performance Rating Distribution */}
      {secondaryNum && (
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <Grid size={13} className="text-purple-400" />
              {secondaryNum} Distribution
            </h3>
            <ChartExportMenu
              containerRef={ratingDistChartRef}
              chartData={ratingDistData}
              chartTitle={`${secondaryNum}_Distribution`}
              theme={theme}
            />
          </div>
          <div className="chart-container" ref={ratingDistChartRef}>
            <Bar data={ratingDistData} options={chartOptionsDark} />
          </div>
        </div>
      )}

      {/* 5. Time Series Trend Area Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            <Activity size={13} className="text-cyan-400" />
            Timeline Volume Trend Analysis
          </h3>
          <ChartExportMenu
            containerRef={timeSeriesChartRef}
            chartData={timeSeriesChartData}
            chartTitle="Timeline_Volume_Trend_Analysis"
            theme={theme}
          />
        </div>
        <div className="chart-container" ref={timeSeriesChartRef}>
          <Line data={timeSeriesChartData} options={chartOptionsDark} />
        </div>
      </div>

      {/* 6. Capability Radar Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            <Layers size={13} className="text-amber-400" />
            Multi-Dimensional Radar Profile
          </h3>
          <ChartExportMenu
            containerRef={radarChartRef}
            chartData={radarChartData}
            chartTitle="Multi_Dimensional_Radar_Profile"
            theme={theme}
          />
        </div>
        <div className="chart-container" ref={radarChartRef}>
          <Radar data={radarChartData} options={radarOptionsDark} />
        </div>
      </div>
    </div>
  );
}
