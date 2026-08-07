import React from 'react';
import { Database, Filter, Activity, DollarSign, TrendingUp, ShieldCheck } from 'lucide-react';

export default function KPICards({ totalRows = 0, filteredRows = 0, healthScore = 100, stats = {}, schema = {} }) {
  // Identify primary numeric column for highlighted metric (e.g. Salary or Revenue)
  const numericHeaders = Object.keys(schema || {}).filter(h => schema[h] === 'numeric');
  const primaryNumeric = numericHeaders.find(h => h.toLowerCase().includes('salary') || h.toLowerCase().includes('revenue')) || numericHeaders[0];

  const primaryStat = (primaryNumeric && stats) ? stats[primaryNumeric] : null;

  const formattedMean = primaryStat && primaryStat.mean !== undefined
    ? (primaryStat.mean >= 1000 ? `$${primaryStat.mean.toLocaleString()}` : primaryStat.mean.toLocaleString())
    : 'N/A';

  const safeTotal = totalRows || 0;
  const safeFiltered = filteredRows !== undefined ? filteredRows : 0;
  const activePercentage = safeTotal > 0 ? Math.round((safeFiltered / safeTotal) * 100) : 100;

  return (
    <div className="kpi-grid">
      <div className="kpi-card kpi-blue">
        <div className="kpi-info">
          <span className="kpi-label">Total Records</span>
          <span className="kpi-value">{safeTotal.toLocaleString()}</span>
          <span className="kpi-subtext">
            <Database size={12} /> Complete Dataset Size
          </span>
        </div>
        <div className="kpi-icon-box">
          <Database size={24} className="text-blue-400" />
        </div>
      </div>

      <div className="kpi-card kpi-cyan">
        <div className="kpi-info">
          <span className="kpi-label">Filtered Overview</span>
          <span className="kpi-value">{safeFiltered.toLocaleString()}</span>
          <span className="kpi-subtext">
            <Filter size={12} /> {activePercentage}% Active Selection
          </span>
        </div>
        <div className="kpi-icon-box">
          <Filter size={24} className="text-cyan-400" />
        </div>
      </div>

      <div className="kpi-card kpi-emerald">
        <div className="kpi-info">
          <span className="kpi-label">Avg {primaryNumeric || 'Metric'}</span>
          <span className="kpi-value">{formattedMean}</span>
          <span className="kpi-subtext">
            <TrendingUp size={12} /> Mean Value Highlight
          </span>
        </div>
        <div className="kpi-icon-box">
          <DollarSign size={24} className="text-emerald-400" />
        </div>
      </div>

      <div className="kpi-card kpi-amber">
        <div className="kpi-info">
          <span className="kpi-label">Data Health Score</span>
          <span className="kpi-value">{healthScore}%</span>
          <span className="kpi-subtext">
            <ShieldCheck size={12} /> Data Integrity Index
          </span>
        </div>
        <div className="kpi-icon-box">
          <Activity size={24} className="text-amber-400" />
        </div>
      </div>
    </div>
  );
}

