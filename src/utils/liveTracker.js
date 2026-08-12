import { API_BASE, fetchLiveUserStatsApi, loginUserApi, logoutUserApi, sendHeartbeatApi } from './api';

const SSE_STREAM_URL = `${API_BASE}/live-users/stream`;
const HEARTBEAT_INTERVAL_MS = 10000; // 10 seconds heartbeat interval

// Generate unique ID per browser tab to handle tab deduplication
const CLIENT_TAB_ID = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
sessionStorage.setItem('corporate_tab_id', CLIENT_TAB_ID);

let heartbeatInterval = null;
let eventSource = null;
let currentSessionId = sessionStorage.getItem('corporate_session_id') || null;
let activeCallbacks = new Set();

/**
 * Register callback function to receive real-time stats updates
 */
export function subscribeToLiveStats(callback) {
  activeCallbacks.add(callback);
  return () => {
    activeCallbacks.delete(callback);
  };
}

function notifySubscribers(stats) {
  activeCallbacks.forEach(cb => {
    try {
      cb(stats);
    } catch (err) {
      console.error('Error notifying live stats subscriber:', err);
    }
  });
}

/**
 * Initialize real-time tracking for an authenticated user session
 */
export async function startLiveTracking(user, onUpdate) {
  if (onUpdate) {
    activeCallbacks.add(onUpdate);
  }

  // Connect SSE stream for instant real-time pushes
  connectSseStream();

  if (!user) {
    // Guest or unauthenticated client still receives live stats via SSE
    const initialStats = await fetchLiveUserStatsApi();
    if (initialStats) notifySubscribers(initialStats);
    return;
  }

  // Record login session on backend API if not already established
  try {
    const loginRes = await loginUserApi({
      userId: user.id,
      name: user.name || user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      loginType: user.loginType || 'email',
      clientTabId: CLIENT_TAB_ID
    });

    if (loginRes?.success && loginRes?.session) {
      currentSessionId = loginRes.session.id;
      sessionStorage.setItem('corporate_session_id', currentSessionId);
      if (loginRes.stats) {
        notifySubscribers(loginRes.stats);
      }
    }
  } catch (err) {
    console.warn('Backend login tracking warning:', err.message);
  }

  // Start periodic heartbeat timer
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(() => {
    sendHeartbeatApi(currentSessionId, user.id, CLIENT_TAB_ID);
  }, HEARTBEAT_INTERVAL_MS);

  // Send immediate initial heartbeat
  sendHeartbeatApi(currentSessionId, user.id, CLIENT_TAB_ID);

  // Bind unload listener to signal logout if browser/tab closes
  window.removeEventListener('beforeunload', handleUnload);
  window.addEventListener('beforeunload', handleUnload);
}

function handleUnload() {
  const userRaw = localStorage.getItem('corporate_auth_user');
  if (userRaw && currentSessionId) {
    try {
      const user = JSON.parse(userRaw);
      const blob = new Blob([JSON.stringify({ sessionId: currentSessionId, userId: user.id })], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE}/auth/logout`, blob);
    } catch (e) {
      // Ignore beacon error on shutdown
    }
  }
}

/**
 * Establish Server-Sent Events (SSE) connection
 */
function connectSseStream() {
  if (eventSource) return;

  try {
    eventSource = new EventSource(SSE_STREAM_URL);

    eventSource.onmessage = (event) => {
      try {
        const stats = JSON.parse(event.data);
        notifySubscribers(stats);
      } catch (err) {
        console.error('Failed to parse SSE payload:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream error, retrying via polling fallback...', err);
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      // Retry SSE connection after 5 seconds
      setTimeout(connectSseStream, 5000);
    };
  } catch (err) {
    console.warn('EventSource initialization failed:', err.message);
  }
}

/**
 * Stop live tracking and record user logout
 */
export async function stopLiveTracking(user) {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  window.removeEventListener('beforeunload', handleUnload);

  if (user || currentSessionId) {
    try {
      const res = await logoutUserApi(currentSessionId, user?.id);
      if (res?.stats) {
        notifySubscribers(res.stats);
      }
    } catch (err) {
      console.warn('Logout API record error:', err.message);
    }
  }

  currentSessionId = null;
  sessionStorage.removeItem('corporate_session_id');
}

/**
 * Manually trigger a fresh stats fetch from API
 */
export async function refreshLiveStatsNow() {
  const stats = await fetchLiveUserStatsApi();
  if (stats) {
    notifySubscribers(stats);
  }
  return stats;
}
