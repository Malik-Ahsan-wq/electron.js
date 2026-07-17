'use client';

// With trailingSlash:true, routes are at /login/index.html
// Under app:// protocol, navigate to app:///login/ so relative assets resolve correctly
function resolveAppUrl(href: string): string {
  const clean = href.startsWith('/') ? href : '/' + href;
  // Ensure trailing slash for directory-based routes (not for root)
  const withSlash = clean === '/' ? clean : clean.replace(/\/?$/, '/');
  return 'app://' + withSlash;
}

export function navigate(href: string) {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'app:') {
      window.location.href = resolveAppUrl(href);
    } else {
      window.location.href = href;
    }
  }
}

export function navigateReplace(href: string) {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'app:') {
      window.location.replace(resolveAppUrl(href));
    } else {
      window.location.replace(href);
    }
  }
}

export function getActiveRoute(): string {
  if (typeof window === 'undefined') return '/';
  const pathname = window.location.pathname.replace(/\\/g, '/');
  // Match first path segment: /login/ → /login
  const match = pathname.match(/^\/([^/]+)/);
  return match ? '/' + match[1] : '/';
}
