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

let reconnectTimeout = null;
let retryCount = 0;

/**
 * Establish Server-Sent Events (SSE) connection with exponential backoff & jitter
 */
function connectSseStream() {
  if (eventSource) return;
  if (reconnectTimeout) clearTimeout(reconnectTimeout);

  try {
    eventSource = new EventSource(SSE_STREAM_URL);

    eventSource.onopen = () => {
      retryCount = 0; // reset backoff on successful connection
    };

    eventSource.onmessage = (event) => {
      try {
        if (!event.data || event.data.startsWith(':')) return;
        const stats = JSON.parse(event.data);
        notifySubscribers(stats);
      } catch (err) {
        // Ignore heartbeat/malformed comments safely
      }
    };

    eventSource.onerror = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      // Exponential backoff with jitter: 3s -> 4.5s -> 6.7s ... up to max 30s
      retryCount = Math.min(retryCount + 1, 6);
      const delay = Math.min(3000 * Math.pow(1.5, retryCount) + Math.random() * 1000, 30000);
      reconnectTimeout = setTimeout(connectSseStream, delay);
    };
  } catch (err) {
    const delay = 5000 + Math.random() * 2000;
    reconnectTimeout = setTimeout(connectSseStream, delay);
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

  const activeSessId = currentSessionId || sessionStorage.getItem('corporate_session_id');

  if (user || activeSessId) {
    try {
      const res = await logoutUserApi({
        sessionId: activeSessId,
        userId: user?.id,
        email: user?.email,
        username: user?.name || user?.fullName
      });
      if (res?.stats) {
        notifySubscribers(res.stats);
      }
    } catch (err) {
      console.warn('Logout API record error:', err.message);
    }
  }

  currentSessionId = null;
  sessionStorage.removeItem('corporate_session_id');

  // Trigger immediate fresh live stats pull to update all open UI components
  setTimeout(() => {
    refreshLiveStatsNow();
  }, 100);
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
