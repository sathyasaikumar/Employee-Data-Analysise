import React, { useEffect } from 'react';
import {
  Trash2,
  AlertTriangle,
  X,
  Database,
  HardDrive,
  Layers,
  FileSpreadsheet,
  Cpu,
  Clock,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title = 'Delete Stored Dataset?',
  subtitle = 'Permanent Disk Deletion',
  itemName = 'Dataset',
  itemType = 'dataset', // 'dataset' | 'bulk' | 'all' | 'model' | 'session' | 'history' | 'calculator'
  targetCount = 1,
  storagePath = 'uploads/datasets/',
  recordsCount = null,
  fileSize = null,
  warningMessage = null,
  confirmButtonText = null,
  theme = 'dark'
}) {
  // Handle Escape key to cancel and Enter to confirm (if not already deleting)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      } else if (e.key === 'Enter' && !isDeleting && !e.shiftKey && !e.ctrlKey) {
        if (onConfirm) onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose, onConfirm]);

  if (!isOpen) return null;

  const getItemIcon = () => {
    switch (itemType) {
      case 'model':
        return <Cpu size={14} className="text-rose-400" />;
      case 'session':
      case 'history':
        return <Clock size={14} className="text-rose-400" />;
      case 'bulk':
      case 'all':
        return <Layers size={14} className="text-rose-400" />;
      default:
        return <FileSpreadsheet size={14} className="text-rose-400" />;
    }
  };

  const defaultButtonLabel = () => {
    if (confirmButtonText) return confirmButtonText;
    if (itemType === 'all') return `Permanently Delete All (${targetCount})`;
    if (itemType === 'bulk') return `Delete ${targetCount} Selected Datasets`;
    if (itemType === 'model') return 'Delete Trained Model';
    if (itemType === 'session') return 'Delete Session Record';
    if (itemType === 'history') return 'Clear All History Logs';
    if (itemType === 'calculator') return 'Clear Calculation Tape';
    return 'Confirm Permanent Delete';
  };

  return (
    <div
      className="delete-confirm-overlay"
      onClick={() => !isDeleting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="delete-confirm-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Crimson Ambient Glow Line */}
        <div className="delete-confirm-glow-bar" />

        {/* Header Section */}
        <div className="delete-confirm-header">
          <div className="delete-confirm-icon-wrap">
            <div className="delete-confirm-icon-box">
              <Trash2 size={22} className="delete-icon-main" />
              <div className="delete-icon-pulse-ring" />
            </div>
            <div className="delete-confirm-title-group">
              <div className="delete-badge-row">
                <span className="delete-confirm-badge">
                  <ShieldAlert size={10} className="mr-1 inline" />
                  PERMANENT PURGE AUDIT
                </span>
                {targetCount > 1 && (
                  <span className="delete-count-badge">
                    {targetCount} Items Selected
                  </span>
                )}
              </div>
              <h3 id="delete-modal-title" className="delete-confirm-title">
                {title}
              </h3>
              <span className="delete-confirm-subtitle">
                {subtitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="delete-confirm-close-btn"
            onClick={() => !isDeleting && onClose()}
            disabled={isDeleting}
            title="Cancel (Esc)"
            aria-label="Close dialog"
          >
            <X size={15} />
          </button>
        </div>

        {/* Card Body */}
        <div className="delete-confirm-body">
          {/* Target Resource Info Box */}
          <div className="delete-target-preview-box">
            <div className="delete-target-header">
              <div className="flex items-center gap-2 min-w-0">
                {getItemIcon()}
                <span className="delete-target-name truncate" title={itemName}>
                  {itemName}
                </span>
              </div>
              {fileSize && (
                <span className="delete-target-size-tag">
                  {fileSize}
                </span>
              )}
            </div>

            {/* Storage Metadata Pills */}
            <div className="delete-target-meta-row">
              {storagePath && (
                <span className="delete-meta-pill">
                  <HardDrive size={10} className="text-slate-400 mr-1 inline" />
                  <code>{storagePath}</code>
                </span>
              )}
              {recordsCount !== null && recordsCount !== undefined && (
                <span className="delete-meta-pill">
                  <Database size={10} className="text-slate-400 mr-1 inline" />
                  {typeof recordsCount === 'number' ? `${recordsCount.toLocaleString()} records` : recordsCount}
                </span>
              )}
            </div>
          </div>

          {/* Context Explanation */}
          <p className="delete-confirm-desc">
            {warningMessage || (
              itemType === 'all'
                ? `Are you sure you want to permanently erase ALL ${targetCount} datasets? This unlinks all physical files from disk storage and clears database registry entries.`
                : itemType === 'bulk'
                ? `Are you sure you want to permanently remove the ${targetCount} selected datasets from server disk storage?`
                : `Are you sure you want to permanently delete '${itemName}'? This physical file will be immediately unlinked from server storage.`
            )}
          </p>

          {/* High-Alert Warning Callout Box */}
          <div className="delete-warning-callout">
            <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
            <div className="delete-warning-text">
              <strong>Irreversible Action:</strong> Physical files and memory indices will be completely unlinked and cannot be restored.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="delete-confirm-actions">
            <button
              type="button"
              className="btn btn-secondary delete-cancel-btn"
              disabled={isDeleting}
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn delete-submit-btn"
              disabled={isDeleting}
              onClick={onConfirm}
            >
              {isDeleting ? (
                <>
                  <RefreshCw size={14} className="animate-spin mr-1.5 inline" />
                  <span>Purging from Storage...</span>
                </>
              ) : (
                <>
                  <Trash2 size={14} className="mr-1.5 inline" />
                  <span>{defaultButtonLabel()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
