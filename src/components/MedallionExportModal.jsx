import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Download,
  X,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Code,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Database,
  Award,
  Cpu,
  TrendingUp,
  Check
} from 'lucide-react';
import {
  generateBronzeDataset,
  generateSilverDataset,
  generateGoldDataset,
  downloadMedallionCSV,
  downloadMedallionXLSX,
  downloadMedallionJSON,
  downloadFullMedallionSuiteWorkbook
} from '../utils/medallionExporter';

export default function MedallionExportModal({
  isOpen,
  onClose,
  data = [],
  headers = [],
  schema = {},
  datasetName = 'Active Dataset',
  theme = 'dark',
  onDownloadSuccess = null
}) {
  if (!isOpen) return null;

  const [downloadingTier, setDownloadingTier] = useState(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState(null);

  const safeName = (datasetName || 'Dataset').replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = new Date().toISOString().slice(0, 10);

  // Pre-calculate tier metrics
  const bronze = generateBronzeDataset(data, headers);
  const silver = generateSilverDataset(data, headers);
  const gold = generateGoldDataset(data, headers, schema);

  const handleDownloadTier = (tier, format) => {
    setDownloadingTier(`${tier}-${format}`);
    try {
      let targetObj;
      let suffix = '';

      if (tier === 'bronze') {
        targetObj = bronze;
        suffix = 'BRONZE_RAW';
      } else if (tier === 'silver') {
        targetObj = silver;
        suffix = 'SILVER_CLEANED';
      } else {
        targetObj = gold;
        suffix = 'GOLD_ML_CURATED';
      }

      const filename = `${safeName}_${suffix}_${timestamp}.${format}`;

      if (format === 'csv') {
        downloadMedallionCSV(targetObj.data, filename);
      } else if (format === 'xlsx') {
        downloadMedallionXLSX(targetObj.data, `${tier.toUpperCase()} Data`, filename, targetObj.auditLog);
      } else if (format === 'json') {
        downloadMedallionJSON(targetObj.data, filename);
      }

      setDownloadSuccessMessage(`Downloaded ${tier.toUpperCase()} tier as ${format.toUpperCase()}!`);
      setTimeout(() => setDownloadSuccessMessage(null), 3000);

      if (onDownloadSuccess) {
        onDownloadSuccess({
          mode: 'download',
          type: format.toUpperCase(),
          filename,
          recordCount: targetObj.rowCount,
          columnsCount: targetObj.colCount,
          title: `${tier.toUpperCase()} Tier Exported`,
          desc: `Exported ${targetObj.tierName} dataset with ${targetObj.rowCount.toLocaleString()} rows.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      console.error('Medallion Download Error:', err);
    } finally {
      setTimeout(() => setDownloadingTier(null), 400);
    }
  };

  const handleDownloadFullSuite = () => {
    setDownloadingTier('full-suite');
    try {
      const res = downloadFullMedallionSuiteWorkbook({
        datasetName,
        rawData: data,
        headers,
        schema
      });

      setDownloadSuccessMessage('Downloaded Full Medallion Suite Master Workbook!');
      setTimeout(() => setDownloadSuccessMessage(null), 3000);

      if (onDownloadSuccess) {
        onDownloadSuccess({
          mode: 'download',
          type: 'XLSX (Full Suite)',
          filename: res.filename,
          recordCount: bronze.rowCount,
          columnsCount: gold.colCount,
          title: 'Full Medallion Suite Exported',
          desc: 'Complete 3-tier workbook generated with Bronze, Silver, Gold, and Transformation Audit logs.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    } catch (err) {
      console.error('Full suite export failed:', err);
    } finally {
      setTimeout(() => setDownloadingTier(null), 400);
    }
  };

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.82)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          background: theme === 'light' ? '#ffffff' : '#0f172a',
          border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid #334155',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: theme === 'light' ? '#f8fafc' : '#131d36'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              <Award size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Medallion Architecture Dataset Exporter
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Download <strong style={{ color: 'var(--text-main)' }}>{datasetName}</strong> in Bronze, Silver, or Gold Tier standard
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Master Suite Banner */}
        <div
          style={{
            margin: '1.25rem 1.75rem 0.5rem 1.75rem',
            padding: '1rem 1.25rem',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(236, 72, 153, 0.12), rgba(59, 130, 246, 0.12))',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', color: '#fbbf24' }}>
              <Sparkles size={15} /> Full Medallion Suite (All 3 Tiers)
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Includes 🥉 Bronze, 🥈 Silver, 🥇 Gold, and complete transformation audit logs in 1 multi-tab Excel (.xlsx) file.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadFullSuite}
            disabled={downloadingTier === 'full-suite'}
            style={{
              padding: '0.55rem 1.2rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
            }}
          >
            <Download size={14} />
            {downloadingTier === 'full-suite' ? 'Generating Workbook...' : 'Download Master Suite (.xlsx)'}
          </button>
        </div>

        {/* 3 Medallion Tier Cards Grid */}
        <div
          style={{
            padding: '1.25rem 1.75rem 1.75rem 1.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.25rem',
            overflowY: 'auto'
          }}
        >
          {/* 🥉 1. BRONZE TIER */}
          <div
            style={{
              background: theme === 'light' ? '#f8fafc' : '#141e33',
              border: '1px solid rgba(217, 119, 6, 0.35)',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    background: 'rgba(217, 119, 6, 0.15)',
                    color: '#d97706',
                    border: '1px solid rgba(217, 119, 6, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}
                >
                  🥉 BRONZE TIER
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Raw Ingest</span>
              </div>

              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>
                Unaltered Source Data
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
                Exact original state preserving initial missing values, duplicate entries, raw casing, and schema.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)' }}>
                  {bronze.rowCount.toLocaleString()} Rows
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-main)' }}>
                  {bronze.colCount} Columns
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.12)', color: '#d97706' }}>
                  Raw Format
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.45rem 0.2rem', justifyContent: 'center' }}
                onClick={() => handleDownloadTier('bronze', 'csv')}
              >
                <FileText size={11} /> CSV
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.45rem 0.2rem', justifyContent: 'center' }}
                onClick={() => handleDownloadTier('bronze', 'xlsx')}
              >
                <FileSpreadsheet size={11} /> XLSX
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.45rem 0.2rem', justifyContent: 'center' }}
                onClick={() => handleDownloadTier('bronze', 'json')}
              >
                <Code size={11} /> JSON
              </button>
            </div>
          </div>

          {/* 🥈 2. SILVER TIER */}
          <div
            style={{
              background: theme === 'light' ? '#f8fafc' : '#141e33',
              border: '1px solid rgba(148, 163, 184, 0.45)',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    background: 'rgba(148, 163, 184, 0.15)',
                    color: '#94a3b8',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}
                >
                  🥈 SILVER TIER
                </span>
                <span style={{ fontSize: '0.72rem', color: '#38bdf8' }}>Cleaned & Validated</span>
              </div>

              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>
                Cleaned & Conformed
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
                Imputed missing values, treated outliers, normalized text & category casings, and purged duplicates.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399' }}>
                  ✓ 100% Quality Score
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8' }}>
                  0 Missing Cells
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.45rem 0.2rem', justifyContent: 'center' }}
                onClick={() => handleDownloadTier('silver', 'csv')}
              >
                <FileText size={11} /> CSV
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.45rem 0.2rem', justifyContent: 'center' }}
                onClick={() => handleDownloadTier('silver', 'xlsx')}
              >
                <FileSpreadsheet size={11} /> XLSX
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.45rem 0.2rem', justifyContent: 'center' }}
                onClick={() => handleDownloadTier('silver', 'json')}
              >
                <Code size={11} /> JSON
              </button>
            </div>
          </div>

          {/* 🥇 3. GOLD TIER */}
          <div
            style={{
              background: theme === 'light' ? '#f8fafc' : '#141e33',
              border: '1px solid rgba(234, 179, 8, 0.45)',
              borderRadius: '14px',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span
                  style={{
                    background: 'rgba(234, 179, 8, 0.15)',
                    color: '#eab308',
                    border: '1px solid rgba(234, 179, 8, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em'
                  }}
                >
                  🥇 GOLD TIER
                </span>
                <span style={{ fontSize: '0.72rem', color: '#f59e0b' }}>ML Feature Store</span>
              </div>

              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)' }}>
                Curated & ML-Engineered
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 0.85rem 0', lineHeight: 1.4 }}>
                Feature-engineered with date decomposition (DayOfWeek, Quarter), log scaling, and ML model readiness.
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.12)', color: '#eab308' }}>
                  + {gold.engineeredFeatures.length} New ML Features
                </span>
                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
                  {gold.colCount} Total Cols
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.45rem 0.2rem', justifyContent: 'center' }}
                onClick={() => handleDownloadTier('gold', 'csv')}
              >
                <FileText size={11} /> CSV
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.45rem 0.2rem', justifyContent: 'center' }}
                onClick={() => handleDownloadTier('gold', 'xlsx')}
              >
                <FileSpreadsheet size={11} /> XLSX
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '0.45rem 0.2rem', justifyContent: 'center' }}
                onClick={() => handleDownloadTier('gold', 'json')}
              >
                <Code size={11} /> JSON
              </button>
            </div>
          </div>
        </div>

        {/* Footer info & Toast */}
        {downloadSuccessMessage && (
          <div
            style={{
              padding: '0.65rem 1.75rem',
              background: 'rgba(16, 185, 129, 0.15)',
              borderTop: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#34d399',
              fontSize: '0.78rem',
              fontWeight: 600
            }}
          >
            <Check size={14} /> {downloadSuccessMessage}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
