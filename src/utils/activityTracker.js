// Activity Tracking and Login History System Utility

const HISTORY_STORAGE_PREFIX = 'corporate_login_history_';
const PROFILE_DATA_PREFIX = 'corporate_user_profile_';

/**
 * Formats ISO timestamp or Date object into local timezone string
 */
export const formatLocalTimestamp = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (err) {
    return isoString;
  }
};

/**
 * Formats local date only
 */
export const formatLocalDate = (isoString) => {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  } catch (err) {
    return isoString;
  }
};

/**
 * Formats duration in milliseconds into readable string (e.g. 02h 15m 40s)
 */
export const formatDuration = (ms) => {
  if (!ms || ms <= 0) return '00m 00s';
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor(ms / (1000 * 60 * 60));

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

/**
 * Gets storage key for user login history
 */
const getHistoryKey = (userId) => {
  const cleanId = userId ? String(userId).replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest';
  return `${HISTORY_STORAGE_PREFIX}${cleanId}`;
};

/**
 * Gets user profile metadata (personal details, skills, created date)
 */
export const getUserProfile = (user) => {
  if (!user) return null;
  const cleanId = user.id || user.email || user.phone || 'guest';
  const storageKey = `${PROFILE_DATA_PREFIX}${cleanId}`;
  
  try {
    const raw = localStorage.getItem(storageKey);
    let stored = raw ? JSON.parse(raw) : {};

    return {
      photo: stored.photo || user.avatarUrl || null,
      avatarInitials: user.avatar || user.name?.substring(0, 2).toUpperCase() || 'US',
      fullName: stored.fullName || user.name || 'Corporate Account',
      email: stored.email || user.email || 'admin@corporate.com',
      phone: stored.phone || user.phone || '+1 (555) 234-5678',
      role: stored.role || user.role || 'Executive Data Analyst',
      department: stored.department || 'Business Intelligence & Analytics',
      location: stored.location || 'San Francisco, CA (Local Timezone)',
      bio: stored.bio || 'Senior Analytics Lead specialized in enterprise workforce optimization, financial modeling, and data strategy.',
      skills: stored.skills || ['Data Analytics', 'Workforce Intelligence', 'React.js', 'Python', 'Financial Modeling', 'Predictive AI'],
      interests: stored.interests || ['Machine Learning', 'Executive Dashboards', 'Data Security', 'Cloud Architecture'],
      createdDate: stored.createdDate || user.loginTime || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: stored.status || 'Verified Corporate Account'
    };
  } catch (err) {
    console.error('Failed to load user profile:', err);
    return {
      fullName: user.name || 'Corporate User',
      email: user.email || 'user@corporate.com',
      avatarInitials: user.avatar || 'US',
      role: user.role || 'Authorized User',
      skills: ['Data Analytics', 'React.js'],
      createdDate: new Date().toISOString()
    };
  }
};

/**
 * Saves updated user profile metadata
 */
export const saveUserProfile = (user, profileData) => {
  if (!user) return;
  const cleanId = user.id || user.email || user.phone || 'guest';
  const storageKey = `${PROFILE_DATA_PREFIX}${cleanId}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(profileData));
  } catch (err) {
    console.error('Failed to save user profile:', err);
  }
};

/**
 * Retrieves login history array for a user
 */
export const getLoginHistory = (userId) => {
  try {
    const raw = localStorage.getItem(getHistoryKey(userId));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read login history:', err);
    return [];
  }
};

/**
 * Saves login history array
 */
const saveLoginHistory = (userId, history) => {
  try {
    localStorage.setItem(getHistoryKey(userId), JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save login history:', err);
  }
};

/**
 * Starts a new login session when user logs in
 */
export const startSession = (user) => {
  if (!user) return null;
  const userId = user.id || user.email || user.phone || 'guest';
  const history = getLoginHistory(userId);
  const now = new Date().toISOString();

  // Close any orphaned active session first
  const updatedHistory = history.map(sess => {
    if (sess.status === 'Active') {
      const loginMs = new Date(sess.loginTime).getTime();
      const logoutMs = new Date().getTime();
      return {
        ...sess,
        logoutTime: now,
        durationMs: Math.max(0, logoutMs - loginMs),
        status: 'Logged Out'
      };
    }
    return sess;
  });

  const newSession = {
    id: `sess_${Date.now()}`,
    userId: userId,
    dateIso: now,
    loginTime: now,
    logoutTime: null,
    durationMs: 0,
    status: 'Active',
    device: navigator.userAgent.includes('Windows') ? 'Windows Desktop' : 'Web Browser',
    ipAddress: '192.168.1.104 (Localhost)'
  };

  updatedHistory.unshift(newSession);
  saveLoginHistory(userId, updatedHistory);
  return newSession;
};

/**
 * Ends the active session when user logs out
 */
export const endActiveSession = (userId) => {
  if (!userId) return;
  const history = getLoginHistory(userId);
  const now = new Date().toISOString();
  const logoutMs = new Date(now).getTime();

  const updatedHistory = history.map(sess => {
    if (sess.status === 'Active') {
      const loginMs = new Date(sess.loginTime).getTime();
      const dur = Math.max(0, logoutMs - loginMs);
      return {
        ...sess,
        logoutTime: now,
        durationMs: dur,
        status: 'Logged Out'
      };
    }
    return sess;
  });

  saveLoginHistory(userId, updatedHistory);
};

/**
 * Gets currently active session for live duration calculation
 */
export const getActiveSession = (userId) => {
  const history = getLoginHistory(userId);
  return history.find(s => s.status === 'Active') || null;
};

/**
 * Calculates metrics for Dashboard Cards:
 * 1. LAST LOGIN
 * 2. CURRENT SESSION (Live ms)
 * 3. TOTAL LOGIN HOURS
 * 4. LOGIN COUNT
 * 5. LAST LOGOUT
 */
export const calculateSessionStats = (userId) => {
  const history = getLoginHistory(userId);
  const nowMs = Date.now();

  const activeSession = history.find(s => s.status === 'Active');
  const completedSessions = history.filter(s => s.status === 'Logged Out');

  // 1. Last Login
  const lastLoginIso = history.length > 0 ? history[0].loginTime : null;

  // 2. Current Session Duration in ms
  let currentSessionMs = 0;
  if (activeSession) {
    currentSessionMs = Math.max(0, nowMs - new Date(activeSession.loginTime).getTime());
  }

  // 3. Total Login Hours across all sessions
  let totalMs = completedSessions.reduce((acc, s) => acc + (s.durationMs || 0), 0);
  if (activeSession) {
    totalMs += currentSessionMs;
  }
  const totalHoursFloat = (totalMs / (1000 * 60 * 60)).toFixed(1);

  // 4. Login Count
  const loginCount = history.length;

  // 5. Last Logout
  const lastLogoutSession = history.find(s => s.status === 'Logged Out');
  const lastLogoutIso = lastLogoutSession ? lastLogoutSession.logoutTime : null;

  return {
    lastLoginIso,
    currentSessionMs,
    totalMs,
    totalHoursFloat,
    loginCount,
    lastLogoutIso,
    activeSession,
    history
  };
};

/**
 * Seed initial sample login history for a realistic dashboard view if empty
 */
export const ensureSampleLoginHistory = (userId) => {
  const history = getLoginHistory(userId);
  if (history.length > 0) return history;

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const sampleHistory = [
    {
      id: `sess_${now}`,
      userId: userId,
      dateIso: new Date(now).toISOString(),
      loginTime: new Date(now - 14 * 60 * 1000).toISOString(),
      logoutTime: null,
      durationMs: 14 * 60 * 1000,
      status: 'Active',
      device: 'Windows Desktop (Chrome)',
      ipAddress: '192.168.1.104'
    },
    {
      id: `sess_${now - 1}`,
      userId: userId,
      dateIso: new Date(now - 1 * dayMs).toISOString(),
      loginTime: new Date(now - 1 * dayMs - 4 * 3600 * 1000).toISOString(),
      logoutTime: new Date(now - 1 * dayMs).toISOString(),
      durationMs: 4 * 3600 * 1000,
      status: 'Logged Out',
      device: 'Windows Desktop (Chrome)',
      ipAddress: '192.168.1.104'
    },
    {
      id: `sess_${now - 2}`,
      userId: userId,
      dateIso: new Date(now - 2 * dayMs).toISOString(),
      loginTime: new Date(now - 2 * dayMs - 6.5 * 3600 * 1000).toISOString(),
      logoutTime: new Date(now - 2 * dayMs).toISOString(),
      durationMs: 6.5 * 3600 * 1000,
      status: 'Logged Out',
      device: 'MacBook Pro (Safari)',
      ipAddress: '172.16.0.45'
    },
    {
      id: `sess_${now - 3}`,
      userId: userId,
      dateIso: new Date(now - 4 * dayMs).toISOString(),
      loginTime: new Date(now - 4 * dayMs - 5 * 3600 * 1000).toISOString(),
      logoutTime: new Date(now - 4 * dayMs).toISOString(),
      durationMs: 5 * 3600 * 1000,
      status: 'Logged Out',
      device: 'Mobile iOS (App)',
      ipAddress: '10.0.0.88'
    }
  ];

  saveLoginHistory(userId, sampleHistory);
  return sampleHistory;
};
