import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, AlertCircle, FileText, Table, FileCode, File } from 'lucide-react';

export default function FileUpload({ 
  onFileSelect, 
  onLoadSample, 
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
      <div 
        className={`dropzone-container ${isDragActive ? 'drag-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileInputChange} 
          accept=".csv,.xlsx,.xls,.json,.pdf,.tsv,.txt" 
          style={{ display: 'none' }} 
        />

        <div className="upload-icon-circle">
          <UploadCloud size={36} />
        </div>

        <h2 className="dropzone-title">Upload Data File (CSV, Excel, JSON, PDF)</h2>
        <p className="dropzone-subtitle">
          Drag and drop your spreadsheet or document here, or click to browse files.
          Supports <strong>CSV</strong>, <strong>Excel (.xlsx / .xls)</strong>, <strong>JSON</strong>, <strong>PDF</strong>, and <strong>TSV</strong> files.
        </p>

        <button 
          className="btn btn-primary btn-select-file"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <FileSpreadsheet size={18} /> Select File (CSV, Excel, JSON, PDF)
        </button>

        {/* Multi-Format Support Badges */}
        <div className="supported-formats-row">
          <span className="format-tag csv"><Table size={12} /> CSV / TSV</span>
          <span className="format-tag excel"><FileSpreadsheet size={12} /> Excel (.xlsx, .xls)</span>
          <span className="format-tag json"><FileCode size={12} /> JSON</span>
          <span className="format-tag pdf"><FileText size={12} /> PDF Report</span>
        </div>

        {error && (
          <div style={{ marginTop: '1rem', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', width: '100%', maxWidth: '560px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
            <Sparkles size={14} className="inline mr-1 text-amber-400" /> Or explore instant demo datasets:
          </p>
          <div className="sample-buttons">
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
