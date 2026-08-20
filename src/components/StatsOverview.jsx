import React from 'react';
import { Calculator, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

export default function StatsOverview({ stats = {}, headers = [], schema = {} }) {
  if (!stats || !headers || headers.length === 0) {
    return (
      <div className="table-card stats-matrix-card">
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No statistical profiling available for this dataset.
        </div>
      </div>
    );
  }

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
              const stat = stats?.[header];
              const colType = ((schema && schema[header]) || stat?.type || 'unknown').toString().toLowerCase();

              if (!stat) {
                return (
                  <tr key={header}>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{header}</td>
                    <td><span className="badge stats-type-badge badge-blue">UNPROFILED</span></td>
                    <td colSpan={8} style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending calculation...</td>
                  </tr>
                );
              }

              let typeBadgeClass = 'badge-blue';
              if (colType === 'categorical') typeBadgeClass = 'badge-emerald';
              if (colType === 'datetime' || colType === 'date') typeBadgeClass = 'badge-purple';

              const missingCnt = stat.missingCount || 0;
              const totalCnt = stat.count || 0;
              const totalSum = totalCnt + missingCnt || 1;

              return (
                <tr key={header}>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{header}</td>
                  <td>
                    <span className={`badge stats-type-badge ${typeBadgeClass}`}>
                      {colType.toUpperCase()}
                    </span>
                  </td>
                  <td>{totalCnt.toLocaleString()}</td>
                  <td style={{ color: missingCnt > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                    {missingCnt} ({Math.round((missingCnt / totalSum) * 100)}%)
                  </td>
                  <td>{stat.type === 'numeric' ? (stat.mean !== undefined && stat.mean !== null ? Number(stat.mean).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>{stat.type === 'numeric' ? (stat.median !== undefined && stat.median !== null ? Number(stat.median).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>{stat.type === 'numeric' ? (stat.stdDev !== undefined && stat.stdDev !== null ? Number(stat.stdDev).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>{stat.type === 'numeric' ? (stat.min !== undefined && stat.min !== null ? Number(stat.min).toLocaleString() : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>{stat.type === 'numeric' ? (stat.max !== undefined && stat.max !== null ? Number(stat.max).toLocaleString() : '—') : <span style={{ opacity: 0.35 }}>—</span>}</td>
                  <td>
                    {stat.type === 'categorical' ? (
                      <span title={`Top: ${stat.topCategory || 'N/A'} (${stat.topFrequency || 0} times)`}>
                        {stat.uniqueCount || 0} unique (Top: <b style={{ color: 'var(--text-main)' }}>{stat.topCategory || 'N/A'}</b>)
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
