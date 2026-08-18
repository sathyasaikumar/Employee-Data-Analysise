import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, AlertCircle, Table, FileCode, HardDrive, History, ArrowLeft } from 'lucide-react';

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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onFileSelect(files.length === 1 ? files[0] : files);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFileSelect(files.length === 1 ? files[0] : files);
    }
  };

  return (
    <div className="file-upload-page-center">
      {hasPreviousDataset && (
        <div className="upload-back-row">
          <button className="btn btn-secondary btn-sm" onClick={onBackToDashboard}>
            <ArrowLeft size={13} /> Return to Active Analysis ({previousDatasetName})
          </button>
        </div>
      )}

      <div 
        className={`dropzone-container dropzone-compact ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          accept=".csv,.xlsx,.xls,.json,.tsv,.txt" 
          multiple
          style={{ display: 'none' }} 
        />

        <div className="upload-icon-circle-compact">
          <UploadCloud size={26} />
        </div>

        <h2 className="dropzone-title-compact">Upload Dataset Files (.csv to all formats)</h2>
        <p className="dropzone-subtitle-compact">
          Drag & drop single or <strong>unlimited batch files</strong>, or click to browse.
          <br />
          Supports <strong>CSV</strong>, <strong>Excel</strong>, and <strong>JSON</strong> with automatic <code>.csv</code> normalization.
        </p>

        {/* Badges */}
        <div className="upload-badges-compact-row">
          <span className="upload-badge-pill green">
            <HardDrive size={12} /> Auto-Saved: <code>uploads/datasets/</code>
          </span>
          <span className="upload-badge-pill blue">
            <Sparkles size={12} className="text-amber-400" /> Unlimited Batch Upload
          </span>
        </div>

        <div className="upload-cta-row">
          <button 
            type="button"
            className="btn btn-primary btn-select-file-compact"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <FileSpreadsheet size={15} /> Select Dataset Files (Batch Supported)
          </button>
        </div>

        {/* Format Tags */}
        <div className="supported-formats-row-compact">
          <span className="format-tag csv"><Table size={11} /> CSV / TSV</span>
          <span className="format-tag excel"><FileSpreadsheet size={11} /> Excel (.xlsx, .xls)</span>
          <span className="format-tag json"><FileCode size={11} /> JSON</span>
        </div>

        {error && (
          <div className="upload-error-banner">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Dataset History Quick Link */}
        {onOpenHistory && (
          <div className="upload-footer-compact" style={{ justifyContent: 'center', marginTop: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-xs history-btn-compact"
              onClick={(e) => {
                e.stopPropagation();
                onOpenHistory();
              }}
            >
              <History size={12} /> View Saved Dataset History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
