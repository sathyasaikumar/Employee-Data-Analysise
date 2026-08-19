import React from 'react';
import { Calculator, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

export default function StatsOverview({ stats, headers, schema }) {
  if (!stats) return null;

  return (
    <div className="table-card stats-matrix-card">
      <div className="table-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Calculator size={14} className="text-amber-400" />
          <h3 className="stats-matrix-title">
            Dataset Statistical Profiling & Matrix
          </h3>
          <span className="stats-matrix-count-tag">
            {headers.length} Columns
          </span>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Column Name</th>
              <th>Data Type</th>
              <th>Total Count</th>
              <th>Missing Rows</th>
              <th>Mean / Avg</th>
              <th>Median</th>
              <th>Std Deviation</th>
              <th>Min Value</th>
              <th>Max Value</th>
              <th>Unique Categories</th>
            </tr>
          </thead>
          <tbody>
            {headers.map(header => {
              const stat = stats[header];
              const colType = (schema[header] || stat?.type || 'unknown').toLowerCase();

              if (!stat) return null;

              let typeBadgeClass = 'badge-blue';
              if (colType === 'categorical') typeBadgeClass = 'badge-emerald';
              if (colType === 'datetime' || colType === 'date') typeBadgeClass = 'badge-purple';

              return (
                <tr key={header}>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{header}</td>
                  <td>
                    <span className={`badge stats-type-badge ${typeBadgeClass}`}>
                      {colType.toUpperCase()}
                    </span>
                  </td>
                  <td>{stat.count?.toLocaleString()}</td>
                  <td style={{ color: stat.missingCount > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                    {stat.missingCount} ({Math.round((stat.missingCount / (stat.count + stat.missingCount || 1)) * 100)}%)
                  </td>
                  <td>{stat.type === 'numeric' ? (stat.mean !== undefined ? stat.mean.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>{stat.type === 'numeric' ? (stat.median !== undefined ? stat.median.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>{stat.type === 'numeric' ? (stat.stdDev !== undefined ? stat.stdDev.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>{stat.type === 'numeric' ? (stat.min !== undefined ? stat.min.toLocaleString() : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>{stat.type === 'numeric' ? (stat.max !== undefined ? stat.max.toLocaleString() : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>
                    {stat.type === 'categorical' ? (
                      <span title={`Top: ${stat.topCategory} (${stat.topFrequency} times)`}>
                        {stat.uniqueCount} unique (Top: <b style={{ color: 'var(--text-main)' }}>{stat.topCategory}</b>)
                      </span>
                    ) : (
                      <span style={{ opacity: 0.35 }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
