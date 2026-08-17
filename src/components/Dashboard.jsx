import React from 'react';
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
import { PieChart, BarChart2, TrendingUp, Grid, Activity, Layers } from 'lucide-react';

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

export default function Dashboard({ dashboardMetrics, totalRows, filteredCount, theme = 'dark' }) {
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

  // Cap chart categories to top 10 for clean UI
  const getTopCategories = (freqMap, maxItems = 10) => {
    const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
    if (sorted.length <= maxItems) return freqMap;

    const top = {};
    let otherSum = 0;
    sorted.forEach(([key, val], idx) => {
      if (idx < maxItems) top[key] = val;
      else otherSum += val;
    });
    if (otherSum > 0) top['Others'] = otherSum;
    return top;
  };

  const topPrimaryFreq = getTopCategories(primaryCatFreq);
  const topSecondaryFreq = getTopCategories(secondaryCatFreq);

  // 1. Attrition / Count by Department (Heatmap Bar Chart matching user screenshot)
  const catChartData = {
    labels: Object.keys(topPrimaryFreq),
    datasets: [
      {
        label: `Count by ${primaryCat}`,
        data: Object.values(topPrimaryFreq),
        backgroundColor: [
          '#b91c1c', '#dc2626', '#ef4444', '#f87171',
          '#f97316', '#fb923c', '#fdba74', '#fef3c7'
        ],
        borderRadius: 4
      }
    ]
  };

  // 2. Work Mode Distribution (Donut Chart)
  const donutChartData = {
    labels: Object.keys(topSecondaryFreq),
    datasets: [
      {
        data: Object.values(topSecondaryFreq),
        backgroundColor: ['#f43f5e', '#38bdf8', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#131b2e'
      }
    ]
  };

  // 3. Salary vs Status Box Plot / Quartile Range Whisker Chart (Inspired by user reference image!)
  const boxCategories = Object.keys(boxPlotData).slice(0, 6);
  const boxMedianData = boxCategories.map(c => boxPlotData[c].median);
  const boxQ1Data = boxCategories.map(c => boxPlotData[c].q1);
  const boxQ3Data = boxCategories.map(c => boxPlotData[c].q3);

  const boxPlotChartData = {
    labels: boxCategories,
    datasets: [
      {
        label: `Q1 (25th Percentile)`,
        data: boxQ1Data,
        backgroundColor: 'rgba(59, 130, 246, 0.4)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: `Median (${primaryNum || 'Metric'})`,
        data: boxMedianData,
        backgroundColor: '#3b82f6',
        borderColor: '#60a5fa',
        borderWidth: 2,
        borderRadius: 4
      },
      {
        label: `Q3 (75th Percentile)`,
        data: boxQ3Data,
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: '#2563eb',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  // 4. Performance Rating Distribution (Histogram)
  const numDistLabels = Object.keys(secondaryNumFreq).sort((a, b) => Number(a) - Number(b)).slice(0, 10);
  const numDistValues = numDistLabels.map(l => secondaryNumFreq[l]);

  const ratingDistData = {
    labels: numDistLabels,
    datasets: [
      {
        label: `Count by ${secondaryNum}`,
        data: numDistValues,
        backgroundColor: '#3b82f6',
        borderRadius: 4
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
        </div>
        <div className="chart-container">
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
        </div>
        <div className="chart-container">
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
          </div>
          <div className="chart-container">
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
          </div>
          <div className="chart-container">
            <Bar data={ratingDistData} options={chartOptionsDark} />
          </div>
        </div>
      )}

      {/* 5. NEW: Time Series Trend Area Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            <Activity size={13} className="text-cyan-400" />
            Timeline Volume Trend Analysis
          </h3>
        </div>
        <div className="chart-container">
          <Line data={timeSeriesChartData} options={chartOptionsDark} />
        </div>
      </div>

      {/* 6. NEW: Capability Radar Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            <Layers size={13} className="text-amber-400" />
            Multi-Dimensional Radar Profile
          </h3>
        </div>
        <div className="chart-container">
          <Radar data={radarChartData} options={radarOptionsDark} />
        </div>
      </div>
    </div>
  );
}
