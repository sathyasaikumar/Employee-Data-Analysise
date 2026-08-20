import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, Download } from 'lucide-react';

export default function DataTable({ 
  pageData = [], 
  headers = [], 
  schema = {}, 
  filteredCount = 0, 
  onPageChange, 
  onExportCSV 
}) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  // Reset page to 1 if current page becomes invalid due to filters
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
      if (onPageChange) {
        onPageChange(1, pageSize, sortColumn, sortDirection);
      }
    }
  }, [filteredCount, totalPages]);

  // Reset sort column if header list changes completely
  useEffect(() => {
    if (sortColumn && !headers.includes(sortColumn)) {
      setSortColumn(null);
    }
  }, [headers]);

  const handleSort = (header) => {
    let newDir = 'asc';
    if (sortColumn === header) {
      newDir = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortColumn(header);
    setSortDirection(newDir);
    if (onPageChange) {
      onPageChange(currentPage, pageSize, header, newDir);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (onPageChange) {
      onPageChange(newPage, pageSize, sortColumn, sortDirection);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    if (onPageChange) {
      onPageChange(1, newSize, sortColumn, sortDirection);
    }
  };

  const startRecord = filteredCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = filteredCount > 0 ? Math.min(currentPage * pageSize, filteredCount) : 0;

  return (
    <div className="table-card">
      <div className="table-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Dataset Table (<b style={{ color: 'var(--text-main)' }}>{(filteredCount || 0).toLocaleString()}</b> records)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Rows per page:</span>
          <select 
            className="sample-select table-page-size-select"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <button className="btn btn-outline table-export-btn" onClick={onExportCSV}>
            <Download size={12} /> Export Filtered CSV
          </button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header} onClick={() => handleSort(header)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span>{header}</span>
                    <ArrowUpDown size={11} className={sortColumn === header ? "text-accent-blue" : "text-muted"} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData && pageData.length > 0 ? (
              pageData.map((row, idx) => (
                <tr key={idx}>
                  {headers.map(header => {
                    const val = row ? row[header] : undefined;
                    const valStr = val !== undefined && val !== null ? val.toString() : '-';

                    if (header && (header.toLowerCase() === 'status' || header.toLowerCase() === 'work_mode')) {
                      let badgeClass = 'badge-blue';
                      if (valStr === 'Active' || valStr === 'Remote') badgeClass = 'badge-emerald';
                      if (valStr === 'Resigned' || valStr === 'Onsite') badgeClass = 'badge-amber';
                      if (valStr === 'Terminated') badgeClass = 'badge-rose';

                      return (
                        <td key={header}>
                          <span className={`badge ${badgeClass}`}>{valStr}</span>
                        </td>
                      );
                    }

                    if (schema?.[header] === 'numeric' && (header?.toLowerCase()?.includes('salary') || header?.toLowerCase()?.includes('revenue'))) {
                      const num = Number(valStr.replace(/[\$,]/g, ''));
                      const formatted = !isNaN(num) ? `$${num.toLocaleString()}` : valStr;
                      return <td key={header} style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>{formatted}</td>;
                    }

                    return <td key={header}>{valStr}</td>;
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={headers.length || 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No matching records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div>
          Showing {startRecord.toLocaleString()} to {endRecord.toLocaleString()} of {(filteredCount || 0).toLocaleString()} records
        </div>
        <div className="page-controls">
          <button 
            className="btn btn-secondary"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            style={{ padding: '0.35rem 0.65rem' }}
          >
            <ChevronLeft size={16} /> Previous
          </button>
          <span>Page {currentPage.toLocaleString()} of {totalPages.toLocaleString()}</span>
          <button 
            className="btn btn-secondary"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            style={{ padding: '0.35rem 0.65rem' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

