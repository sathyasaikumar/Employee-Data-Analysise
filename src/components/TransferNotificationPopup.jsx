import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  X,
  Database,
  Layers,
  Activity,
  Sparkles,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  Trash2,
  HardDrive,
  AlertTriangle
} from 'lucide-react';

export default function TransferNotificationPopup({
  data,
  onClose,
  onOpenDashboard,
  theme = 'dark'
}) {
  if (!data) return null;

  const isDelete = data.mode === 'delete';
  const isUpload = data.mode === 'upload' || (!data.mode && !data.filename && !isDelete);
  const isDownload = data.mode === 'download' || (!isUpload && !isDelete);

  const duration = data.duration || 6000; // 6 seconds auto-close
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = 50;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, duration, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const fileName = data.name || data.filename || (isDelete ? 'Deleted Resource' : 'Dataset');
  const records = data.totalRows || data.recordCount || data.recordsCount || 0;
  const columns = data.columnsCount || 0;
  const health = data.healthScore !== undefined ? data.healthScore : 100;
  const anomalies = data.anomaliesCount || 0;
  const fileType = data.type || (isUpload ? 'DATASET' : (isDelete ? 'PURGED' : 'CSV'));
  const timestamp = data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const storagePath = data.storagePath || (isDelete ? 'uploads/datasets/' : null);

  const modeClass = isDelete ? 'delete-mode' : (isUpload ? 'upload-mode' : 'download-mode');
  const progressFillClass = isDelete ? 'rose' : (isUpload ? 'emerald' : 'sky');
  const badgeClass = isDelete ? 'rose' : (isUpload ? 'emerald' : 'sky');

  return (
    <div
      className="transfer-popup-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`transfer-popup-card ${modeClass}`}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Glowing Top Ambient Line */}
        <div className="transfer-card-glow-bar" />

        {/* Header */}
        <div className="transfer-header">
          <div className="transfer-icon-wrap">
            {isDelete ? (
              <div className="transfer-icon-box delete">
                <Trash2 size={20} className="icon-main" />
                <div className="icon-pulse-ring" />
              </div>
            ) : isUpload ? (
              <div className="transfer-icon-box upload">
                <Upload size={20} className="icon-main" />
                <div className="icon-pulse-ring" />
              </div>
            ) : (
              <div className="transfer-icon-box download">
                <Download size={20} className="icon-main" />
                <div className="icon-pulse-ring" />
              </div>
            )}
            <div className="transfer-title-group">
              <span className={`transfer-badge ${badgeClass}`}>
                {isDelete
                  ? (data.badge || '🗑️ RESOURCE PERMANENTLY REMOVED')
                  : isUpload
                  ? (data.badge || '✨ DATASET AUTO-CLEANED & READY')
                  : (data.badge || `📥 ${fileType} EXPORT COMPLETED`)}
              </span>
              <h3 className="transfer-title" title={fileName}>
                {fileName}
              </h3>
            </div>
          </div>

          <button
            type="button"
            className="transfer-close-btn"
            onClick={onClose}
            title="Dismiss notification (Esc)"
            aria-label="Close notification"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body Content */}
        <div className="transfer-body">
          <p className="transfer-desc">
            {data.desc || (
              isDelete
                ? 'The specified resource was safely unlinked from disk storage and registry entries have been purged.'
                : isUpload
                ? 'Dataset parsed, normalized, nulls imputed, and fully integrated into the intelligence engine.'
                : 'Export generated with high precision and successfully saved to your downloads storage.'
            )}
          </p>

          {/* Cleaning Audit Report (for Uploads) */}
          {isUpload && data.cleaningReport && (
            <div className="transfer-cleaning-box">
              <div className="transfer-cleaning-header">
                <Sparkles size={12} className="text-emerald-400" />
                <span>Automated Quality Sanitization</span>
              </div>
              <div className="transfer-chips-wrap">
                <span className="transfer-chip">
                  ✓ {data.cleaningReport.nullsImputed > 0 ? `${data.cleaningReport.nullsImputed} Nulls Imputed` : '0 Missing Values'}
                </span>
                <span className="transfer-chip">
                  ✓ {data.cleaningReport.typesNormalized > 0 ? `${data.cleaningReport.typesNormalized} Types Normalized` : 'Schema Verified'}
                </span>
                <span className="transfer-chip">
                  ✓ {data.cleaningReport.whitespacesTrimmed > 0 ? `${data.cleaningReport.whitespacesTrimmed} Fields Cleaned` : 'Whitespace Sanitized'}
                </span>
                <span className="transfer-chip">
                  ✓ {data.cleaningReport.duplicatesRemoved > 0 ? `${data.cleaningReport.duplicatesRemoved} Duplicates Resolved` : '0 Duplicates'}
                </span>
              </div>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="transfer-stats-grid">
            {isDelete ? (
              <>
                <div className="transfer-stat-tile">
                  <span className="tile-label">
                    <Trash2 size={11} className="tile-icon text-rose-400" /> Items Removed
                  </span>
                  <span className="tile-val text-rose-400">
                    {data.deletedCount ? `${data.deletedCount} File(s)` : (records ? `${records.toLocaleString()} Records` : '1 Item')}
                  </span>
                </div>

                <div className="transfer-stat-tile">
                  <span className="tile-label">
                    <HardDrive size={11} className="tile-icon text-amber-400" /> Storage Path
                  </span>
                  <span className="tile-val text-amber-400" title={storagePath}>
                    {storagePath ? storagePath.replace(/^uploads\//, '') : 'Storage Purged'}
                  </span>
                </div>

                <div className="transfer-stat-tile">
                  <span className="tile-label">
                    <ShieldCheck size={11} className="tile-icon text-emerald-400" /> Disk Status
                  </span>
                  <span className="tile-val text-emerald-400">
                    Unlinked & Reclaimed
                  </span>
                </div>

                <div className="transfer-stat-tile">
                  <span className="tile-label">
                    <Clock size={11} className="tile-icon text-purple-400" /> Purge Time
                  </span>
                  <span className="tile-val text-purple-400">
                    {timestamp}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="transfer-stat-tile">
                  <span className="tile-label">
                    <Database size={11} className="tile-icon text-blue-400" /> Total Records
                  </span>
                  <span className="tile-val text-blue-400">{records.toLocaleString()}</span>
                </div>

                <div className="transfer-stat-tile">
                  <span className="tile-label">
                    {isUpload ? (
                      <>
                        <Layers size={11} className="tile-icon text-cyan-400" /> Features
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet size={11} className="tile-icon text-cyan-400" /> Format
                      </>
                    )}
                  </span>
                  <span className="tile-val text-cyan-400">
                    {isUpload ? `${columns} Columns` : fileType}
                  </span>
                </div>

                <div className="transfer-stat-tile">
                  <span className="tile-label">
                    {isUpload ? (
                      <>
                        <Activity size={11} className="tile-icon text-emerald-400" /> Health Index
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={11} className="tile-icon text-emerald-400" /> Status
                      </>
                    )}
                  </span>
                  <span className="tile-val text-emerald-400">
                    {isUpload ? `${health}%` : 'Verified 100%'}
                  </span>
                </div>

                <div className="transfer-stat-tile">
                  <span className="tile-label">
                    {isUpload ? (
                      <>
                        <Sparkles size={11} className="tile-icon text-purple-400" /> Outliers
                      </>
                    ) : (
                      <>
                        <Clock size={11} className="tile-icon text-purple-400" /> Export Time
                      </>
                    )}
                  </span>
                  <span className="tile-val text-purple-400">
                    {isUpload ? `${anomalies} Detected` : timestamp}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Button & Countdown bar */}
          <div className="transfer-actions">
            <button
              type="button"
              className={`btn ${isDelete ? 'delete-notify-btn' : 'btn-primary transfer-primary-btn'}`}
              onClick={() => {
                if (isUpload && onOpenDashboard) {
                  onOpenDashboard();
                }
                onClose();
              }}
            >
              <CheckCircle2 size={13} />
              <span>
                {isDelete
                  ? 'Acknowledge & Close'
                  : isUpload
                  ? 'Open Executive Dashboard'
                  : 'Dismiss & Continue'}
              </span>
              <ArrowRight size={12} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Micro Countdown Progress Bar */}
        <div className="transfer-progress-track">
          <div
            className={`transfer-progress-fill ${progressFillClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
