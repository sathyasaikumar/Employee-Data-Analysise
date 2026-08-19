import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Database,
  Clock,
  Users,
  Activity,
  FileText,
  Cpu,
  Download,
  Eye,
  RefreshCw,
  X,
  HardDrive,
  CheckCircle2,
  Server,
  FileSpreadsheet,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { API_BASE } from '../utils/api';

export function StorageExplorerContent({ theme = 'dark', embedded = false }) {
  const [storageData, setStorageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('datasets');
  const [error, setError] = useState(null);

  const fetchStorageOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/system/folders`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setStorageData(data);
      } else {
        throw new Error(data.error || 'Failed to fetch storage');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to storage backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageOverview();
  }, []);

  const currentCategory = storageData?.categories?.find(c => c.id === activeCategory) || storageData?.categories?.[0];

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'database': return <Database size={15} className="text-blue-400" />;
      case 'clock': return <Clock size={15} className="text-purple-400" />;
      case 'users': return <Users size={15} className="text-emerald-400" />;
      case 'activity': return <Activity size={15} className="text-teal-400" />;
      case 'file-text': return <FileText size={15} className="text-amber-400" />;
      case 'cpu': return <Cpu size={15} className="text-rose-400" />;
      default: return <Folder size={15} className="text-blue-400" />;
    }
  };

  return (
    <div className={`storage-explorer-container ${embedded ? 'embedded-view' : ''}`}>
      {/* Top Quick Metrics */}
      <div className="storage-metrics-grid">
        <div className="storage-metric-tile">
          <span className="metric-tile-label">
            <HardDrive size={12} className="text-sky-400" /> Total Storage Footprint
          </span>
          <span className="metric-tile-value text-sky-400">
            {storageData?.totalBytesFormatted || 'Calculating...'}
          </span>
          <div className="storage-mini-bar">
            <div className="storage-mini-bar-fill" style={{ width: '45%' }} />
          </div>
        </div>

        <div className="storage-metric-tile">
          <span className="metric-tile-label">
            <FolderOpen size={12} className="text-purple-400" /> Storage Categories
          </span>
          <span className="metric-tile-value text-purple-400">
            {storageData?.categories?.length || 6} Dedicated Folders
          </span>
          <span className="metric-tile-sub">uploads/ & database/</span>
        </div>

        <div className="storage-metric-tile">
          <span className="metric-tile-label">
            <Layers size={12} className="text-emerald-400" /> Total Stored Files
          </span>
          <span className="metric-tile-value text-emerald-400">
            {storageData?.totalFilesCount || 0} Files on Disk
          </span>
          <span className="metric-tile-sub">Synchronized with Node Backend</span>
        </div>

        <div className="storage-metric-tile">
          <span className="metric-tile-label">
            <ShieldCheck size={12} className="text-amber-400" /> Storage Engine
          </span>
          <span className="metric-tile-value text-amber-400">
            Express Port 5000
          </span>
          <span className="metric-tile-sub">JSON & File System</span>
        </div>
      </div>

      {/* Main Category Splitter */}
      <div className="storage-explorer-split">
        {/* Left Sidebar Category Tabs */}
        <div className="storage-categories-sidebar">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="categories-sidebar-header">STORAGE FOLDERS</span>
            <button
              type="button"
              className="storage-mini-refresh-btn"
              onClick={fetchStorageOverview}
              disabled={loading}
              title="Refresh Folder Records"
            >
              <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="categories-list">
            {storageData?.categories?.map((cat) => {
              const isActive = activeCategory === cat.id;
              const totalFiles = (cat.files?.length || 0) + (cat.dbFiles?.length || 0);
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`storage-category-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(cat.icon)}
                    <div className="category-text">
                      <span className="category-name">{cat.name}</span>
                      <span className="category-path">{cat.path}</span>
                    </div>
                  </div>
                  <span className="category-count-badge">
                    {cat.recordsCount !== undefined ? `${cat.recordsCount} items` : `${totalFiles} files`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Files & Folder Content Explorer */}
        <div className="storage-content-pane">
          {currentCategory ? (
            <div>
              <div className="content-pane-header">
                <div>
                  <h4 className="category-active-title">{currentCategory.name}</h4>
                  <p className="category-active-desc">{currentCategory.description}</p>
                </div>
                <span className="category-location-pill">
                  📁 {currentCategory.path}
                </span>
              </div>

              {/* Files List Table */}
              <div className="storage-files-table-wrap">
                <table className="storage-files-table">
                  <thead>
                    <tr>
                      <th>File / Registry Name</th>
                      <th>Size</th>
                      <th>Storage Type</th>
                      <th>Last Modified</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Render files in current category */}
                    {currentCategory.files && currentCategory.files.length > 0 ? (
                      currentCategory.files.map((file, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="flex items-center gap-2">
                              {file.name.endsWith('.csv') ? (
                                <FileSpreadsheet size={14} className="text-emerald-400" />
                              ) : file.name.endsWith('.json') ? (
                                <Database size={14} className="text-sky-400" />
                              ) : file.name.endsWith('.pdf') ? (
                                <FileText size={14} className="text-rose-400" />
                              ) : (
                                <FileText size={14} className="text-blue-400" />
                              )}
                              <span className="font-semibold text-main">{file.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="file-size-badge">{file.sizeFormatted}</span>
                          </td>
                          <td>
                            <span className="file-type-badge">
                              {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                            </span>
                          </td>
                          <td className="text-muted text-xs">
                            {new Date(file.modifiedAt).toLocaleDateString()} {new Date(file.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              {file.url && (
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="file-action-btn download"
                                  title="Download File"
                                >
                                  <Download size={11} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : null}

                    {/* Render DB files */}
                    {currentCategory.dbFiles && currentCategory.dbFiles.length > 0 ? (
                      currentCategory.dbFiles.map((file, idx) => (
                        <tr key={`db-${idx}`}>
                          <td>
                            <div className="flex items-center gap-2">
                              <Database size={14} className="text-purple-400" />
                              <span className="font-semibold text-main">{file.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="file-size-badge">{file.sizeFormatted}</span>
                          </td>
                          <td>
                            <span className="file-type-badge purple">JSON DATABASE</span>
                          </td>
                          <td className="text-muted text-xs">
                            {new Date(file.modifiedAt).toLocaleDateString()} {new Date(file.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            <span className="text-xs text-emerald-400 font-semibold">Active DB</span>
                          </td>
                        </tr>
                      ))
                    ) : null}

                    {(!currentCategory.files || currentCategory.files.length === 0) &&
                     (!currentCategory.dbFiles || currentCategory.dbFiles.length === 0) && (
                      <tr>
                        <td colSpan={5} className="empty-storage-notice">
                          No files currently stored in this category folder.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-storage-notice">Select a category folder to browse files</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StorageExplorerModal({ isOpen, onClose, theme = 'dark' }) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="storage-modal-overlay" onClick={onClose}>
      <div className="storage-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Glowing Ambient Bar */}
        <div className="storage-modal-glow-bar" />

        {/* Modal Header */}
        <div className="storage-modal-header">
          <div className="storage-modal-title-wrap">
            <div className="storage-modal-icon-badge">
              <HardDrive size={20} className="text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="storage-modal-title">Dedicated Backend Storage Explorer</h3>
                <span className="storage-modal-live-tag">
                  <Server size={10} className="inline mr-1 text-emerald-400" /> DISK ONLINE
                </span>
              </div>
              <p className="storage-modal-subtitle">
                Inspect physical storage directories, JSON registries, uploaded files & server footprints
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="storage-close-btn"
              onClick={onClose}
              title="Close (Esc)"
              aria-label="Close Storage Explorer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body with Storage Content */}
        <div className="storage-modal-body">
          <StorageExplorerContent theme={theme} embedded={false} />
        </div>

        {/* Modal Footer */}
        <div className="storage-modal-footer">
          <div className="flex items-center gap-2 text-xs text-muted">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>All folders auto-initialized and synchronized in real-time with Express storage engine.</span>
          </div>
          <button
            type="button"
            className="btn btn-primary storage-done-btn"
            onClick={onClose}
          >
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
}
