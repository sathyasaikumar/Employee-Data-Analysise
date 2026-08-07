import React, { useRef, useState } from 'react';
import { UploadCloud, FileSpreadsheet, Sparkles, AlertCircle } from 'lucide-react';
import { SAMPLE_DATASETS } from '../utils/sampleData';

export default function FileUpload({ onFileSelect, onLoadSample, error }) {
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
          accept=".csv" 
          style={{ display: 'none' }} 
        />

        <div className="upload-icon-circle">
          <UploadCloud size={36} />
        </div>

        <h2 className="dropzone-title">Upload your CSV Data File</h2>
        <p className="dropzone-subtitle">
          Drag and drop your spreadsheet here, or click to browse files from your local computer.
          Real-time client-side processing with statistical profiling & charts.
        </p>

        <button 
          className="btn btn-primary"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <FileSpreadsheet size={18} /> Select CSV File
        </button>

        {error && (
          <div style={{ marginTop: '1rem', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border-color)', pt: '1.5rem', width: '100%', maxWidth: '560px' }}>
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
