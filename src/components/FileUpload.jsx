import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, AlertCircle, FileText, Table, FileCode, HardDrive, History, ArrowLeft } from 'lucide-react';

export default function FileUpload({ 
  onFileSelect, 
  onLoadSample, 
  onOpenHistory,
  onBackToDashboard,
  hasPreviousDataset,
  previousDatasetName,
  error
}) {
  const fileInputRef = useRef(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="content-area">
      {hasPreviousDataset && (
        <div style={{ marginBottom: '1rem', width: '100%', maxWidth: '680px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBackToDashboard} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={15} /> Return to Active Analysis ({previousDatasetName})
          </button>
        </div>
      )}

      <div 
        className={`dropzone-container ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ position: 'relative' }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          accept=".csv,.xlsx,.xls,.json,.tsv,.txt" 
          style={{ display: 'none' }} 
        />

        <div className="upload-icon-circle">
          <UploadCloud size={36} />
        </div>

        <h2 className="dropzone-title">Upload Dataset File (CSV, Excel, JSON)</h2>
        <p className="dropzone-subtitle">
          Drag and drop your dataset here, or click to select from your machine.
          <br />
          Supports <strong>CSV</strong>, <strong>Excel (.xlsx / .xls)</strong>, and <strong>JSON</strong> files.
        </p>

        {/* Automatic Disk Storage Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: '0.35rem 0.85rem',
          borderRadius: '20px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '0.8rem',
          fontWeight: 600,
          marginBottom: '1.25rem'
        }}>
          <HardDrive size={14} /> Automatically saved to server storage: <code>uploads/datasets/</code>
        </div>

        <div>
          <button 
            className="btn btn-primary btn-select-file"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FileSpreadsheet size={18} /> Select Dataset File (CSV, Excel, JSON)
          </button>
        </div>

        {/* Format Tags */}
        <div className="supported-formats-row" style={{ marginTop: '1.25rem' }}>
          <span className="format-tag csv"><Table size={12} /> CSV / TSV</span>
          <span className="format-tag excel"><FileSpreadsheet size={12} /> Excel (.xlsx, .xls)</span>
          <span className="format-tag json"><FileCode size={12} /> JSON</span>
        </div>

        {error && (
          <div style={{ marginTop: '1rem', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Demo Datasets & History Link */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', width: '100%', maxWidth: '580px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>
              <Sparkles size={14} className="inline mr-1 text-amber-400" /> Explore demo datasets or view history:
            </p>
            {onOpenHistory && (
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenHistory();
                }}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <History size={13} /> View Dataset History
              </button>
            )}
          </div>
          <div className="sample-buttons" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample('workforce');
              }}
            >
              🏢 Workforce Intelligence Demo
            </button>
            <button 
              className="btn btn-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample('sales');
              }}
            >
              📈 Sales & Revenue Analytics Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
