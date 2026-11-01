// Deep links that should survive the sign-in round trip (e.g. a family-invite SMS link opened
// while signed out). Only same-app paths on an allowlist are stored — never arbitrary URLs.
const KEY = 'post_login_redirect';
const ALLOWED = [/^\/family\/join\?token=[0-9a-f]{64}$/];

export function rememberPostLoginPath(path: string): void {
  if (!ALLOWED.some(re => re.test(path))) return;
  try { sessionStorage.setItem(KEY, path); } catch { /* storage unavailable */ }
}

/** Where to go after a successful sign-in; consumes the stored deep link. */
export function postLoginPath(fallback = '/dashboard'): string {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (path && ALLOWED.some(re => re.test(path))) return path;
  } catch { /* storage unavailable */ }
  return fallback;
}
