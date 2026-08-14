/**
 * Security Guard & Anti-Inspection Utility Module
 * Protects source code, application assets, and memory state from browser inspection,
 * right-click copying, view-source shortcuts, and DevTools debugging.
 */

export function initSecurityGuard() {
  if (typeof window === 'undefined') return;

  // 1. Disable Right-Click Context Menu
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  // 2. Block Inspect Element & Source Viewing Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // F12 key
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const key = e.key ? e.key.toLowerCase() : '';

    if (isCtrlOrCmd) {
      // Ctrl+Shift+I / J / C / K (DevTools & Console)
      if (isShift && (key === 'i' || key === 'j' || key === 'c' || key === 'k')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View Source)
      if (key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+S (Save Page HTML)
      if (key === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+P (Print / PDF Dump)
      if (key === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  }, { capture: true });

  // 3. Disable Dragging Code & Media Elements
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  // 4. Anti-Debugging & DevTools Detection Loop (Production Mode)
  if (import.meta.env.PROD) {
    setInterval(() => {
      const startTime = performance.now();
      // Executing debugger statement will pause if DevTools is open
      (function () {
        return false;
      })['constructor']('debugger')();
      const endTime = performance.now();
      
      // If execution was delayed significantly, DevTools is likely open
      if (endTime - startTime > 100) {
        console.clear();
      }
    }, 1000);
  }

  console.log('%c[Security System Active] Code protection & anti-tampering guards engaged.', 'color: #00ffaa; font-weight: bold;');
}

/**
 * Check if current session is authenticated
 */
export function isAuthenticated(user) {
  if (!user) return false;
  const storedUser = localStorage.getItem('corporate_auth_user');
  const storedSessionId = sessionStorage.getItem('corporate_session_id');
  return Boolean(storedUser && (storedSessionId || user.id));
}

/**
 * Role-Based Access Control (RBAC) Permission Verifier
 */
export function hasPermission(user, requiredRole = 'any') {
  if (!isAuthenticated(user)) return false;
  if (requiredRole === 'any') return true;

  const role = (user.role || '').toLowerCase();

  switch (requiredRole.toLowerCase()) {
    case 'admin':
    case 'executive admin':
      return role.includes('admin') || role.includes('executive');
    case 'manager':
      return role.includes('admin') || role.includes('manager') || role.includes('lead');
    default:
      return true;
  }
}

/**
 * Enforce Auth Guard before executing sensitive actions (Upload, Delete, Export)
 */
export function requireAuthGuard(user, actionCallback, onUnauthorized) {
  if (!isAuthenticated(user)) {
    if (typeof onUnauthorized === 'function') {
      onUnauthorized('Please log in to access this feature without permission.');
    }
    return false;
  }
  
  if (typeof actionCallback === 'function') {
    actionCallback();
  }
  return true;
}

