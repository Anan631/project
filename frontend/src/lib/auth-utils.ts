/**
 * Utility functions for authentication
 */

/**
 * Set authentication cookies and localStorage
 */
export function setAuthData(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}) {
  if (typeof window === 'undefined') return;

  // Set localStorage (for client-side use)
  localStorage.setItem('userId', user.id);
  localStorage.setItem('userName', user.name);
  localStorage.setItem('userEmail', user.email);
  localStorage.setItem('userRole', user.role);

  // Set cookies (for server-side middleware)
  const expires = new Date();
  expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  document.cookie = `userId=${user.id}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  document.cookie = `userName=${encodeURIComponent(user.name)}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  document.cookie = `userEmail=${user.email}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  document.cookie = `userRole=${user.role}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
  document.cookie = `authToken=${user.id}-${Date.now()}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
}

/**
 * Clear authentication data (logout)
 */
export function clearAuthData() {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');

  // Clear cookies
  const expires = new Date(0).toUTCString();
  document.cookie = `userId=; path=/; expires=${expires}`;
  document.cookie = `userName=; path=/; expires=${expires}`;
  document.cookie = `userEmail=; path=/; expires=${expires}`;
  document.cookie = `userRole=; path=/; expires=${expires}`;
  document.cookie = `authToken=; path=/; expires=${expires}`;
}

/**
 * Get authentication data from localStorage
 */
export function getAuthData(): {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
} {
  if (typeof window === 'undefined') {
    return {
      userId: null,
      userName: null,
      userEmail: null,
      userRole: null,
    };
  }

  return {
    userId: localStorage.getItem('userId'),
    userName: localStorage.getItem('userName'),
    userEmail: localStorage.getItem('userEmail'),
    userRole: localStorage.getItem('userRole'),
  };
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const userId = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole');
  return !!(userId && userRole);
}

