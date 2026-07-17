'use client';

function resolveAppUrl(href: string): string {
  const path = href.startsWith('/') ? href.slice(1) : href;
  return 'app:///' + path;
}

export function navigate(href: string) {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'app:') {
      window.location.href = resolveAppUrl(href);
    } else if (window.location.protocol === 'file:') {
      window.location.href = href;
    } else {
      window.location.href = href;
    }
  }
}

export function navigateReplace(href: string) {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'app:') {
      window.location.replace(resolveAppUrl(href));
    } else if (window.location.protocol === 'file:') {
      window.location.replace(href);
    } else {
      window.location.replace(href);
    }
  }
}

export function getActiveRoute(): string {
  if (typeof window === 'undefined') return '/';
  const protocol = window.location.protocol;
  if (protocol === 'app:') {
    const path = window.location.pathname.replace(/\\/g, '/');
    const match = path.match(/^\/([^/]+)/);
    return match ? '/' + match[1] : '/';
  }
  const path = window.location.pathname.replace(/\\/g, '/');
  const match = path.match(/\/([^/]+)\.html$/);
  return match ? '/' + match[1] : '/';
}
