import React, { useState } from 'react';
import { 
  Database, HardDrive, FileText, Table, FileSpreadsheet, FileCode, 
  Trash2, Download, Play, Search, Clock, CheckCircle2, AlertTriangle, 
  RefreshCw, Sparkles, FolderDown, ShieldCheck, ArrowRight
} from 'lucide-react';
import { getDatasetDownloadUrl } from '../utils/api';

export default function DatasetHistory({ 
  datasets, 
  onSelectDataset, 
  onDeleteDataset, 
  onRefresh, 
  onSeedSample,
  onOpenUpload,
  isLoading 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  // Filter datasets
  const filteredDatasets = datasets.filter(ds => {
    const matchesSearch = 
      (ds.originalName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ds.savedName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ds.fileType || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFormat = 
      formatFilter === 'all' || 
      (formatFilter === 'csv' && ds.fileType === 'csv') ||
      (formatFilter === 'excel' && (ds.fileType === 'excel' || ds.fileType === 'xlsx' || ds.fileType === 'xls')) ||
      (formatFilter === 'json' && ds.fileType === 'json');

    return matchesSearch && matchesFormat;
  });

  // Calculate summary metrics
  const totalDatasets = datasets.length;
  const totalSizeBytes = datasets.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);
  const totalRows = datasets.reduce((acc, curr) => acc + (curr.rowCount || 0), 0);

  const formatTotalBytes = (bytes) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFormatIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t === 'excel' || t === 'xlsx' || t === 'xls') {
      return <FileSpreadsheet className="text-emerald-400" size={18} />;
    } else if (t === 'json') {
      return <FileCode className="text-amber-400" size={18} />;
    }
    return <Table className="text-blue-400" size={18} />;
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete dataset '${name}' from server storage (uploads/datasets/)?`)) {
      setDeletingId(id);
      try {
        await onDeleteDataset(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="dataset-history-container" style={{ padding: '1.5rem', width: '100%' }}>
      {/* Top Banner & Title */}
      <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Database className="text-cyan-400" size={24} /> Dataset Storage & History Center
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Physically stored in <code style={{ background: 'var(--bg-glass)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: 'var(--accent-cyan)' }}>uploads/datasets/</code> on server disk.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={onRefresh}
            title="Refresh History"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem' }}
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={onOpenUpload}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem' }}
          >
            <FolderDown size={16} /> Upload New Dataset
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="history-summary-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1.25rem', 
        marginBottom: '1.75rem' 
      }}>
        <div className="kpi-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>SAVED DATASETS</span>
            <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '8px', color: '#60a5fa' }}>
              <Database size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-bright)', marginTop: '0.5rem' }}>
            {totalDatasets}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.25rem', display: 'block' }}>
            Permanent Physical Storage
          </span>
        </div>

        <div className="kpi-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>STORAGE USED</span>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '8px', color: '#34d399' }}>
              <HardDrive size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-bright)', marginTop: '0.5rem' }}>
            {formatTotalBytes(totalSizeBytes)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
            Stored in uploads/datasets/
          </span>
        </div>

        <div className="kpi-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL ROWS RECORDED</span>
            <div style={{ padding: '0.5rem', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '8px', color: '#c084fc' }}>
              <Table size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-bright)', marginTop: '0.5rem' }}>
            {totalRows.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.25rem', display: 'block' }}>
            Parsed & Processed Rows
          </span>
        </div>
      </div>

      {/* Controls Bar: Search & Format Filter */}
      <div style={{ 
        display: 'flex', 
        justify: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--card-bg)',
        padding: '1rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '260px', flex: '1' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Search datasets by original name, unique filename, format..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.85rem 0.55rem 2.4rem',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-bright)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>

        {/* Format Selector Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Format:</span>
          {['all', 'csv', 'excel', 'json'].map(fmt => (
            <button
              key={fmt}
              onClick={() => setFormatFilter(fmt)}
              className={`pill-btn ${formatFilter === fmt ? 'active' : ''}`}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: formatFilter === fmt ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                background: formatFilter === fmt ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: formatFilter === fmt ? 'var(--accent-blue)' : 'var(--text-muted)',
                textTransform: 'uppercase'
              }}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset History Table */}
      {filteredDatasets.length === 0 ? (
        <div className="dropzone-container" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <div className="upload-icon-circle">
            <Database size={36} />
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text-bright)', marginBottom: '0.5rem', fontWeight: 700 }}>
            {totalDatasets === 0 ? 'No Stored Datasets Found' : 'No matching datasets'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
            {totalDatasets === 0 
              ? 'Upload CSV, Excel, or JSON files to start storing them permanently in uploads/datasets/.' 
              : 'Try clearing your search term or format filter.'}
          </p>

          {totalDatasets === 0 && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={onOpenUpload}>
                <FolderDown size={16} /> Upload First Dataset
              </button>
              <button className="btn btn-secondary" onClick={onSeedSample}>
                <Sparkles size={16} /> Load Demo Seed Dataset
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)', 
          overflow: 'hidden' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Dataset Name & Stored File</th>
                <th style={{ padding: '0.85rem 1rem' }}>Upload Date & Time</th>
                <th style={{ padding: '0.85rem 1rem' }}>Size</th>
                <th style={{ padding: '0.85rem 1rem' }}>Rows × Cols</th>
                <th style={{ padding: '0.85rem 1rem' }}>Health Score</th>
                <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDatasets.map((ds, idx) => (
                <tr 
                  key={ds.id || idx}
                  style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                    transition: 'background 0.2s ease'
                  }}
                  className="history-table-row"
                >
                  {/* Original File Name & Unique Saved Name */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                      <div style={{ marginTop: '0.15rem' }}>
                        {getFormatIcon(ds.fileType)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.9rem' }}>
                          {ds.originalName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.1rem' }}>
                          <span style={{ color: 'var(--accent-cyan)' }}>saved as:</span> {ds.savedName}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Upload Timestamp */}
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={14} className="text-slate-400" />
                      <span>{ds.uploadDateFormatted || new Date(ds.uploadDate).toLocaleString()}</span>
                    </div>
                  </td>

                  {/* File Size */}
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-bright)', fontWeight: 600 }}>
                    {ds.fileSize}
                  </td>

                  {/* Dimensions */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      background: 'rgba(255,255,255,0.05)', 
                      borderRadius: '6px', 
                      fontWeight: 600,
                      color: 'var(--text-bright)'
                    }}>
                      {(ds.rowCount || 0).toLocaleString()} r × {ds.columnCount || 0} c
                    </span>
                  </td>

                  {/* Health Score */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ 
                        width: '8px', 
                        height: '8px', 
                        borderRadius: '50%', 
                        background: (ds.healthScore || 100) >= 80 ? '#10b981' : (ds.healthScore || 100) >= 60 ? '#f59e0b' : '#ef4444' 
                      }} />
                      <span style={{ 
                        fontWeight: 700, 
                        color: (ds.healthScore || 100) >= 80 ? '#34d399' : (ds.healthScore || 100) >= 60 ? '#fbbf24' : '#f87171' 
                      }}>
                        {ds.healthScore || 100}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      background: 'rgba(16, 185, 129, 0.15)', 
                      color: '#34d399',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <CheckCircle2 size={12} /> Active
                    </span>
                  </td>

                  {/* Action Buttons */}
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                      {/* Analyze Button */}
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => onSelectDataset(ds.id)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Analyze this dataset in Dashboard"
                      >
                        <Play size={13} /> Analyze
                      </button>

                      {/* Download Button */}
                      <a 
                        href={getDatasetDownloadUrl(ds.id)}
                        download={ds.originalName}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
                        title="Download original file from uploads/datasets/"
                      >
                        <Download size={13} /> Download
                      </a>

                      {/* Delete Button */}
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => handleDelete(e, ds.id, ds.originalName)}
                        disabled={deletingId === ds.id}
                        style={{ 
                          padding: '0.35rem 0.5rem', 
                          fontSize: '0.75rem', 
                          color: 'var(--accent-rose)', 
                          borderColor: 'rgba(239, 68, 68, 0.3)' 
                        }}
                        title="Permanently delete from disk"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
