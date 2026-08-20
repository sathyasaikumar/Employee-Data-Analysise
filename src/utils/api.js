export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Fetch list of all saved dataset metadata
 */
export async function fetchDatasetHistory() {
  try {
    const res = await fetch(`${API_BASE}/datasets`);
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    const json = await res.json();
    return json.datasets || [];
  } catch (err) {
    console.warn('API server unreachable, falling back to empty history:', err.message);
    return [];
  }
}

/**
 * Upload a dataset file (CSV, XLSX, JSON) to backend server disk
 */
export async function uploadDatasetFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to upload dataset file.');
    }

    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Upload server connection timed out.');
    }
    throw err;
  }
}

/**
 * Upload multiple dataset files in batch to backend server storage
 */
export async function uploadMultipleDatasetFiles(files) {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for batch

  try {
    const res = await fetch(`${API_BASE}/upload-multiple`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to upload dataset files.');
    }

    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Multiple file upload server connection timed out.');
    }
    throw err;
  }
}

/**
 * Retrieve dataset by ID with full parsed rows and columns
 */
export async function fetchDatasetById(id) {
  if (!id) {
    throw new Error('Invalid dataset ID requested.');
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

  try {
    const res = await fetch(`${API_BASE}/datasets/${id}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response.');
    }

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || `Failed to fetch dataset ${id}`);
    }
    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Dataset request timed out. Please check server connection.');
    }
    throw err;
  }
}

/**
 * Get direct download URL for original physical file
 */
export function getDatasetDownloadUrl(id) {
  return `${API_BASE}/datasets/${id}/download`;
}

/**
 * Delete physical dataset file and metadata
 */
export async function deleteDatasetById(id) {
  if (!id) return { success: false, error: 'No dataset ID provided' };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_BASE}/datasets/${id}`, {
      method: 'DELETE',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const json = await res.json().catch(() => ({ success: res.ok }));
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Failed to delete dataset ${id}`);
    }
    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`Dataset ${id} delete error:`, err.message);
    throw err;
  }
}

/**
 * Delete ALL physical dataset files and clear metadata
 */
export async function deleteAllDatasets() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}/datasets`, {
      method: 'DELETE',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const json = await res.json().catch(() => ({ success: res.ok }));
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete all datasets');
    }
    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Delete all datasets error:', err.message);
    throw err;
  }
}

/**
 * Bulk delete selected physical dataset files by IDs
 */
export async function deleteDatasetsBulk(ids = []) {
  if (!ids || ids.length === 0) return { success: true, deletedCount: 0 };
  const queryParam = ids.join(',');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${API_BASE}/datasets?ids=${encodeURIComponent(queryParam)}`, {
      method: 'DELETE',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const json = await res.json().catch(() => ({ success: res.ok }));
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Failed to delete selected datasets');
    }
    return json;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Bulk delete datasets error:', err.message);
    throw err;
  }
}

/**
 * Seed initial sample datasets if storage is empty
 */
export async function seedSampleDatasets() {
  try {
    const res = await fetch(`${API_BASE}/seed`, {
      method: 'POST'
    });
    const json = await res.json();
    return json.datasets || [];
  } catch (err) {
    console.warn('Seeding failed:', err.message);
    return [];
  }
}

/**
 * Fetch Live User Stats & Admin Metrics from backend
 */
export async function fetchLiveUserStatsApi() {
  try {
    const res = await fetch(`${API_BASE}/live-users/stats`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.stats || null;
  } catch (err) {
    console.warn('Failed to fetch live user stats from API:', err.message);
    return null;
  }
}

/**
 * Record a user login session in backend database
 */
export async function loginUserApi(userData) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Failed to post login to API:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Record user logout in backend database
 */
export async function logoutUserApi(sessionOrData, maybeUserId) {
  try {
    let payload = {};
    if (typeof sessionOrData === 'object' && sessionOrData !== null) {
      payload = sessionOrData;
    } else {
      payload = { sessionId: sessionOrData, userId: maybeUserId };
    }
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Failed to post logout to API:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send heartbeat ping to maintain active online session status
 */
export async function sendHeartbeatApi(sessionId, userId, clientTabId) {
  try {
    const res = await fetch(`${API_BASE}/auth/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, userId, clientTabId })
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Heartbeat ping failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Force a specific user session offline (Admin Action)
 */
export async function forceSessionOfflineApi(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/live-users/sessions/${sessionId}/logout`, {
      method: 'POST'
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Failed to force session offline:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a specific live user login session log by ID
 */
export async function deleteLiveSessionApi(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/live-users/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Failed to delete live session log:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Bulk clear live user login session logs (mode='offline' or 'all')
 */
export async function clearLiveSessionsApi(mode = 'offline') {
  try {
    const res = await fetch(`${API_BASE}/live-users/sessions?mode=${mode}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('Failed to clear live session logs:', err.message);
    return { success: false, error: err.message };
  }
}


