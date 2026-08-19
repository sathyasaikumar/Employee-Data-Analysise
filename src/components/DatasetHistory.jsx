import React, { useState, useMemo } from 'react';
import { 
  Database, HardDrive, FileText, Table, FileSpreadsheet, FileCode, 
  Trash2, Download, Play, Search, Clock, CheckCircle2, AlertTriangle, 
  RefreshCw, Sparkles, FolderDown, ShieldCheck, ArrowRight, X,
  CheckSquare, Square, AlertCircle, Info, Layers, Check
} from 'lucide-react';
import { getDatasetDownloadUrl } from '../utils/api';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export default function DatasetHistory({ 
  datasets = [], 
  onSelectDataset, 
  onDeleteDataset, 
  onDeleteAllDatasets,
  onDeleteBulkDatasets,
  onRefresh, 
  onSeedSample,
  onOpenUpload,
  isLoading 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Custom in-app confirmation modal state (prevents any window.confirm / screen minimize)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: 'single', // 'single' | 'bulk' | 'all'
    datasetId: null,
    datasetName: null,
    targetCount: 0
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(prev => (prev?.text === text ? null : prev));
    }, 4000);
  };

  // Filter datasets based on search and format
  const filteredDatasets = useMemo(() => {
    return datasets.filter(ds => {
      const nameMatch = (ds.originalName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ds.savedName || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const typeStr = (ds.fileType || '').toLowerCase();
      let formatMatch = true;
      if (formatFilter === 'csv') {
        formatMatch = typeStr === 'csv' || typeStr === 'tsv' || typeStr === 'txt';
      } else if (formatFilter === 'excel') {
        formatMatch = typeStr === 'excel' || typeStr === 'xlsx' || typeStr === 'xls';
      } else if (formatFilter === 'json') {
        formatMatch = typeStr === 'json';
      }

      return nameMatch && formatMatch;
    });
  }, [datasets, searchTerm, formatFilter]);

  // Summary Metrics
  const totalDatasets = datasets.length;
  const totalSizeBytes = datasets.reduce((acc, curr) => acc + (curr.fileSizeBytes || 0), 0);
  const totalRows = datasets.reduce((acc, curr) => acc + (curr.rowCount || 0), 0);

  const formatTotalBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 KB';
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

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredDatasets.length && filteredDatasets.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredDatasets.map(d => d.id));
      setSelectedIds(allIds);
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Trigger Delete Modals (NO window.confirm!)
  const promptDeleteSingle = (e, id, name) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      type: 'single',
      datasetId: id,
      datasetName: name,
      targetCount: 1
    });
  };

  const promptDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteModal({
      isOpen: true,
      type: 'bulk',
      datasetId: null,
      datasetName: `${selectedIds.size} Selected Datasets`,
      targetCount: selectedIds.size
    });
  };

  const promptDeleteAll = () => {
    if (datasets.length === 0) return;
    setDeleteModal({
      isOpen: true,
      type: 'all',
      datasetId: null,
      datasetName: `All ${datasets.length} Datasets`,
      targetCount: datasets.length
    });
  };

  // Execute Deletion safely without screen minimize
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteModal.type === 'single') {
        if (onDeleteDataset) {
          await onDeleteDataset(deleteModal.datasetId);
        }
        showToast(`Dataset "${deleteModal.datasetName}" removed from disk storage.`, 'success');
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(deleteModal.datasetId);
          return next;
        });
      } else if (deleteModal.type === 'bulk') {
        const idsArray = Array.from(selectedIds);
        if (onDeleteBulkDatasets) {
          await onDeleteBulkDatasets(idsArray);
        } else if (onDeleteDataset) {
          for (const id of idsArray) {
            await onDeleteDataset(id);
          }
        }
        showToast(`Successfully deleted ${idsArray.length} dataset(s) from server disk.`, 'success');
        setSelectedIds(new Set());
      } else if (deleteModal.type === 'all') {
        if (onDeleteAllDatasets) {
          await onDeleteAllDatasets();
        } else if (onDeleteDataset) {
          for (const ds of datasets) {
            await onDeleteDataset(ds.id);
          }
        }
        showToast(`All ${totalDatasets} datasets permanently deleted from uploads/datasets/.`, 'success');
        setSelectedIds(new Set());
      }
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ isOpen: false, type: 'single', datasetId: null, datasetName: null, targetCount: 0 });
    }
  };

  const isAllFilteredSelected = filteredDatasets.length > 0 && selectedIds.size === filteredDatasets.length;

  return (
    <div className="dataset-history-container" style={{ padding: '1.5rem', width: '100%', position: 'relative' }}>
      
      {/* Non-intrusive Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          background: toastMessage.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          fontWeight: 600,
          fontSize: '0.9rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.text}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', marginLeft: '0.5rem' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Banner & Action Header */}
      <div className="history-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.65rem', 
        flexWrap: 'wrap', 
        gap: '0.5rem' 
      }}>
        <div>
          <h2 style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'Arial, sans-serif', margin: 0 }}>
            <Database className="text-cyan-400" size={15} /> Dataset Storage & History Center
          </h2>
          <p style={{ fontSize: '0.60rem', color: 'var(--text-muted)', marginTop: '0.1rem', fontFamily: 'Arial, sans-serif' }}>
            Physically stored in <code style={{ background: 'var(--bg-glass)', padding: '0.08rem 0.3rem', borderRadius: '3px', color: 'var(--accent-cyan)' }}>uploads/datasets/</code> on server disk.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Refresh Button */}
          <button 
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            title="Refresh History from server disk"
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.55rem', height: '24px', fontSize: '0.65rem', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
          
          {/* DELETE ALL DATASETS BUTTON */}
          {totalDatasets > 0 && (
            <button 
              type="button"
              onClick={promptDeleteAll}
              title="Delete all datasets from disk and history"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.6rem',
                height: '24px',
                borderRadius: '5px',
                fontSize: '0.65rem',
                fontWeight: 700,
                fontFamily: 'Arial, sans-serif',
                cursor: 'pointer',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.28)';
                e.currentTarget.style.borderColor = '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
              }}
            >
              <Trash2 size={11} /> Delete All ({totalDatasets})
            </button>
          )}

          {/* Upload Button */}
          <button 
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenUpload}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.65rem', height: '24px', fontSize: '0.65rem', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}
          >
            <FolderDown size={12} /> Upload New Dataset
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="history-summary-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '0.45rem', 
        marginBottom: '0.65rem' 
      }}>
        <div className="kpi-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.45rem 0.65rem', minHeight: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Arial, sans-serif' }}>SAVED DATASETS</span>
            <div style={{ padding: '0.2rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '4px', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={13} />
            </div>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginTop: '0.1rem', fontFamily: 'Arial, sans-serif' }}>
            {totalDatasets}
          </div>
          <span style={{ fontSize: '0.54rem', color: 'var(--accent-emerald)', marginTop: '0.05rem', display: 'block', fontFamily: 'Arial, sans-serif' }}>
            Permanent Physical Storage
          </span>
        </div>

        <div className="kpi-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.45rem 0.65rem', minHeight: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Arial, sans-serif' }}>STORAGE USED</span>
            <div style={{ padding: '0.2rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '4px', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={13} />
            </div>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginTop: '0.1rem', fontFamily: 'Arial, sans-serif' }}>
            {formatTotalBytes(totalSizeBytes)}
          </div>
          <span style={{ fontSize: '0.54rem', color: 'var(--text-muted)', marginTop: '0.05rem', display: 'block', fontFamily: 'Arial, sans-serif' }}>
            Stored in uploads/datasets/
          </span>
        </div>

        <div className="kpi-card" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.45rem 0.65rem', minHeight: '64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.56rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Arial, sans-serif' }}>TOTAL ROWS RECORDED</span>
            <div style={{ padding: '0.2rem', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '4px', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Table size={13} />
            </div>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-bright)', marginTop: '0.1rem', fontFamily: 'Arial, sans-serif' }}>
            {totalRows.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.54rem', color: 'var(--accent-cyan)', marginTop: '0.05rem', display: 'block', fontFamily: 'Arial, sans-serif' }}>
            Parsed & Processed Rows
          </span>
        </div>
      </div>

      {/* Controls Bar: Search, Format Filter & Bulk Actions */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '0.55rem',
        flexWrap: 'wrap',
        gap: '0.45rem',
        background: 'var(--card-bg)',
        padding: '0.35rem 0.65rem',
        borderRadius: '6px',
        border: '1px solid var(--border-color)'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px', flex: '1' }}>
          <Search size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text"
            placeholder="Search datasets by original name, unique filename, format..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.2rem 1.6rem 0.2rem 1.8rem',
              height: '24px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-color)',
              borderRadius: '5px',
              color: 'var(--text-bright)',
              fontSize: '0.68rem',
              fontFamily: 'Arial, sans-serif',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchTerm && (
            <button 
              type="button" 
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '0.45rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Format Selector Pills */}
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 800, fontFamily: 'Arial, sans-serif' }}>Format:</span>
          {['all', 'csv', 'excel', 'json'].map(fmt => (
            <button
              key={fmt}
              type="button"
              onClick={() => setFormatFilter(fmt)}
              className={`pill-btn ${formatFilter === fmt ? 'active' : ''}`}
              style={{
                padding: '0.15rem 0.45rem',
                height: '22px',
                borderRadius: '4px',
                fontSize: '0.62rem',
                fontWeight: 700,
                fontFamily: 'Arial, sans-serif',
                cursor: 'pointer',
                border: formatFilter === fmt ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                background: formatFilter === fmt ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: formatFilter === fmt ? 'var(--accent-blue)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                boxSizing: 'border-box'
              }}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Selection Action Bar (appears when 1+ datasets are selected) */}
      {selectedIds.size > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          padding: '0.35rem 0.65rem',
          marginBottom: '0.55rem',
          flexWrap: 'wrap',
          gap: '0.45rem',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{
              background: '#ef4444',
              color: '#ffffff',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.60rem',
              fontWeight: 800
            }}>
              {selectedIds.size} Selected
            </span>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-bright)', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
              {selectedIds.size} of {filteredDatasets.length} datasets selected
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleClearSelection}
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.15rem 0.45rem', height: '22px', fontSize: '0.62rem', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}
            >
              Clear Selection
            </button>

            <button
              type="button"
              onClick={promptDeleteSelected}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.15rem 0.55rem',
                height: '22px',
                borderRadius: '4px',
                fontSize: '0.62rem',
                fontWeight: 800,
                fontFamily: 'Arial, sans-serif',
                cursor: 'pointer',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}
            >
              <Trash2 size={11} /> Delete Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      )}

      {/* Dataset History Table */}
      {filteredDatasets.length === 0 ? (
        <div className="dropzone-container" style={{ padding: '2rem 1rem', textAlign: 'center' }}>
          <div className="upload-icon-circle">
            <Database size={24} />
          </div>
          <h3 style={{ fontSize: '0.88rem', color: 'var(--text-bright)', marginBottom: '0.3rem', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
            {totalDatasets === 0 ? 'No Stored Datasets in History' : 'No matching datasets found'}
          </h3>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1rem auto', fontFamily: 'Arial, sans-serif' }}>
            {totalDatasets === 0 
              ? 'Upload CSV, Excel, or JSON files to store them permanently in uploads/datasets/.' 
              : 'Try clearing your search term or format filter to view all stored datasets.'}
          </p>

          {totalDatasets === 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={onOpenUpload} style={{ height: '24px', fontSize: '0.65rem' }}>
                <FolderDown size={12} /> Upload First Dataset
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onSeedSample} style={{ height: '24px', fontSize: '0.65rem' }}>
                <Sparkles size={12} /> Load Demo Seed Dataset
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ 
          background: 'var(--card-bg)', 
          borderRadius: '8px', 
          border: '1px solid var(--border-color)', 
          overflow: 'hidden' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.68rem', fontFamily: 'Arial, sans-serif' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                {/* Select All Checkbox */}
                <th style={{ padding: '0.35rem 0.45rem 0.35rem 0.65rem', width: '32px' }}>
                  <div 
                    onClick={handleSelectAllFiltered}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: isAllFilteredSelected ? 'var(--accent-blue)' : 'var(--text-muted)' }}
                    title={isAllFilteredSelected ? "Deselect all" : "Select all"}
                  >
                    {isAllFilteredSelected ? <CheckSquare size={13} className="text-indigo-400" /> : <Square size={13} />}
                  </div>
                </th>
                <th style={{ padding: '0.35rem 0.55rem', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dataset Name & Stored File</th>
                <th style={{ padding: '0.35rem 0.55rem', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Upload Date & Time</th>
                <th style={{ padding: '0.35rem 0.55rem', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Size</th>
                <th style={{ padding: '0.35rem 0.55rem', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rows × Cols</th>
                <th style={{ padding: '0.35rem 0.55rem', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Health Score</th>
                <th style={{ padding: '0.35rem 0.55rem', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</th>
                <th style={{ padding: '0.35rem 0.55rem', textAlign: 'right', fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDatasets.map((ds, idx) => {
                const isSelected = selectedIds.has(ds.id);
                return (
                  <tr 
                    key={ds.id || idx}
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      background: isSelected 
                        ? 'rgba(99, 102, 241, 0.08)' 
                        : idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                      transition: 'background 0.15s ease'
                    }}
                    className="history-table-row"
                  >
                    {/* Row Checkbox */}
                    <td style={{ padding: '0.35rem 0.45rem 0.35rem 0.65rem' }}>
                      <div 
                        onClick={() => handleToggleSelect(ds.id)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: isSelected ? 'var(--accent-blue)' : 'var(--text-dim)' }}
                        title={isSelected ? "Deselect row" : "Select row"}
                      >
                        {isSelected ? <CheckSquare size={13} className="text-indigo-400" /> : <Square size={13} />}
                      </div>
                    </td>

                    {/* Original File Name & Saved Name */}
                    <td style={{ padding: '0.35rem 0.55rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <div style={{ marginTop: '0.05rem' }}>
                          {getFormatIcon(ds.fileType)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.72rem', fontFamily: 'Arial, sans-serif' }}>
                            {ds.originalName}
                          </div>
                          <div style={{ fontSize: '0.56rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.05rem' }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>saved as:</span> {ds.savedName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Upload Timestamp */}
                    <td style={{ padding: '0.35rem 0.55rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: '0.62rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={11} className="text-slate-400" />
                        <span>{ds.uploadDateFormatted || new Date(ds.uploadDate).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* File Size */}
                    <td style={{ padding: '0.35rem 0.55rem', color: 'var(--text-bright)', fontWeight: 700, fontSize: '0.64rem' }}>
                      {ds.fileSize}
                    </td>

                    {/* Dimensions */}
                    <td style={{ padding: '0.35rem 0.55rem' }}>
                      <span style={{ 
                        padding: '0.1rem 0.35rem', 
                        background: 'rgba(255,255,255,0.05)', 
                        borderRadius: '4px', 
                        fontWeight: 700,
                        fontSize: '0.60rem',
                        color: 'var(--text-bright)'
                      }}>
                        {(ds.rowCount || 0).toLocaleString()} r × {ds.columnCount || 0} c
                      </span>
                    </td>

                    {/* Health Score */}
                    <td style={{ padding: '0.35rem 0.55rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <div style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          background: (ds.healthScore || 100) >= 80 ? '#10b981' : (ds.healthScore || 100) >= 60 ? '#f59e0b' : '#ef4444' 
                        }} />
                        <span style={{ 
                          fontWeight: 700, 
                          fontSize: '0.62rem',
                          color: (ds.healthScore || 100) >= 80 ? '#34d399' : (ds.healthScore || 100) >= 60 ? '#fbbf24' : '#f87171' 
                        }}>
                          {ds.healthScore || 100}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '0.35rem 0.55rem' }}>
                      <span style={{ 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '8px', 
                        fontSize: '0.58rem', 
                        fontWeight: 700, 
                        background: 'rgba(16, 185, 129, 0.15)', 
                        color: '#34d399',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                      }}>
                        <CheckCircle2 size={10} /> Active
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: '0.35rem 0.55rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '0.25rem', alignItems: 'center' }}>
                        {/* Analyze Button */}
                        <button 
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => onSelectDataset(ds.id)}
                          style={{ padding: '0.12rem 0.4rem', height: '20px', fontSize: '0.60rem', display: 'flex', alignItems: 'center', gap: '0.2rem', fontFamily: 'Arial, sans-serif', fontWeight: 700 }}
                          title="Analyze this dataset in Dashboard"
                        >
                          <Play size={10} /> Analyze
                        </button>

                        {/* Download Button */}
                        <a 
                          href={getDatasetDownloadUrl(ds.id)}
                          download={ds.originalName}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.12rem 0.4rem', height: '20px', fontSize: '0.60rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', textDecoration: 'none', fontFamily: 'Arial, sans-serif', fontWeight: 700, boxSizing: 'border-box' }}
                          title="Download original file from uploads/datasets/"
                        >
                          <Download size={10} /> Download
                        </a>

                        {/* Delete Button (Opens custom in-app modal) */}
                        <button 
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => promptDeleteSingle(e, ds.id, ds.originalName)}
                          style={{ 
                            padding: '0.12rem 0.35rem', 
                            height: '20px',
                            fontSize: '0.60rem', 
                            color: '#f87171', 
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.08)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem',
                            fontFamily: 'Arial, sans-serif',
                            fontWeight: 700
                          }}
                          title="Permanently delete from server disk"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 🗑️ UNIQUE GLASSMORPHIC DELETE CONFIRMATION MODAL */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => !isDeleting && setDeleteModal({ isOpen: false, type: 'single', datasetId: null, datasetName: null, targetCount: 0 })}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title={
          deleteModal.type === 'all' 
            ? 'Delete All Datasets?' 
            : deleteModal.type === 'bulk' 
            ? `Delete ${deleteModal.targetCount} Datasets?` 
            : 'Delete Stored Dataset?'
        }
        subtitle="Permanent Server Storage Purge"
        itemName={deleteModal.datasetName || 'Dataset'}
        itemType={deleteModal.type}
        targetCount={deleteModal.targetCount}
        storagePath="uploads/datasets/"
        recordsCount={
          deleteModal.type === 'single'
            ? datasets.find(d => d.id === deleteModal.datasetId)?.rowCount
            : null
        }
        fileSize={
          deleteModal.type === 'single'
            ? datasets.find(d => d.id === deleteModal.datasetId)?.fileSize
            : null
        }
      />

    </div>
  );
}
