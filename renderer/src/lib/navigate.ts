'use client';

export function navigate(href: string) {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'app:') {
      window.location.href = 'app://' + (href.startsWith('/') ? href.slice(1) : href);
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
      window.location.replace('app://' + (href.startsWith('/') ? href.slice(1) : href));
    } else if (window.location.protocol === 'file:') {
      window.location.replace(href);
    } else {
      window.location.replace(href);
    }
  }
}

export function getActiveRoute(): string {
  if (typeof window === 'undefined') return '/';
  if (window.location.protocol === 'app:') {
    const path = window.location.pathname.replace(/\\/g, '/');
    const match = path.match(/^\/([^/]+)/);
    return match ? '/' + match[1] : '/';
  }
  const path = window.location.pathname.replace(/\\/g, '/');
  const matchFile = path.match(/\/([^/]+)\/index\.html$/);
  if (matchFile) return '/' + matchFile[1];
  const matchHttp = path.match(/^\/([^/]+)/);
  if (matchHttp) return '/' + matchHttp[1];
  return '/';
}
