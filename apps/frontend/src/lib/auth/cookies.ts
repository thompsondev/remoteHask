const AUTH_COOKIE = 'rh_auth';

export function setAuthCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=86400; SameSite=Lax`;
}

export function clearAuthCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function getAuthCookieName(): string {
  return AUTH_COOKIE;
}
