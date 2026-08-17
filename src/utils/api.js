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
 * Retrieve dataset by ID with full parsed rows and columns
 */
export async function fetchDatasetById(id) {
  const res = await fetch(`${API_BASE}/datasets/${id}`);
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Failed to fetch dataset ${id}`);
  }
  return json;
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
  const res = await fetch(`${API_BASE}/datasets/${id}`, {
    method: 'DELETE'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Failed to delete dataset ${id}`);
  }
  return json;
}

/**
 * Delete ALL physical dataset files and clear metadata
 */
export async function deleteAllDatasets() {
  const res = await fetch(`${API_BASE}/datasets`, {
    method: 'DELETE'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to delete all datasets');
  }
  return json;
}

/**
 * Bulk delete selected physical dataset files by IDs
 */
export async function deleteDatasetsBulk(ids = []) {
  if (!ids || ids.length === 0) return { success: true, deletedCount: 0 };
  const queryParam = ids.join(',');
  const res = await fetch(`${API_BASE}/datasets?ids=${encodeURIComponent(queryParam)}`, {
    method: 'DELETE'
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error || 'Failed to delete selected datasets');
  }
  return json;
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


