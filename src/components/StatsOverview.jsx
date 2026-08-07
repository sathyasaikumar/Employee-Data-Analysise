import React from 'react';
import { Calculator, CheckCircle2, FileText, AlertTriangle } from 'lucide-react';

export default function StatsOverview({ stats, headers, schema }) {
  if (!stats) return null;

  return (
    <div className="table-card">
      <div className="table-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calculator size={18} className="text-amber-400" />
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600 }}>
            Dataset Statistical Profiling & Matrix
          </h3>
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
              const colType = schema[header];

              if (!stat) return null;

              return (
                <tr key={header}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{header}</td>
                  <td>
                    <span className={`badge ${colType === 'numeric' ? 'badge-blue' : 'badge-emerald'}`}>
                      {colType}
                    </span>
                  </td>
                  <td>{stat.count}</td>
                  <td style={{ color: stat.missingCount > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                    {stat.missingCount} ({Math.round((stat.missingCount / (stat.count + stat.missingCount || 1)) * 100)}%)
                  </td>
                  <td>{stat.type === 'numeric' ? stat.mean?.toLocaleString() : '-'}</td>
                  <td>{stat.type === 'numeric' ? stat.median?.toLocaleString() : '-'}</td>
                  <td>{stat.type === 'numeric' ? stat.stdDev?.toLocaleString() : '-'}</td>
                  <td>{stat.type === 'numeric' ? stat.min?.toLocaleString() : '-'}</td>
                  <td>{stat.type === 'numeric' ? stat.max?.toLocaleString() : '-'}</td>
                  <td>
                    {stat.type === 'categorical' ? (
                      <span title={`Top: ${stat.topCategory} (${stat.topFrequency} times)`}>
                        {stat.uniqueCount} unique (Top: <b>{stat.topCategory}</b>)
                      </span>
                    ) : (
                      '-'
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
