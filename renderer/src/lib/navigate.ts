'use client';

function getRelativeTarget(href: string): string {
  const cleanHref = href.startsWith('/') ? href.slice(1) : href;
  const path = window.location.pathname.replace(/\\/g, '/');
  const isInSubdir = path.match(/\/[^/]+\/index\.html$/);
  const prefix = isInSubdir ? '../' : './';
  return prefix + cleanHref + '/index.html';
}

export function navigate(href: string) {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'file:') {
      window.location.href = getRelativeTarget(href);
    } else {
      window.location.href = href;
    }
  }
}

export function navigateReplace(href: string) {
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'file:') {
      window.location.replace(getRelativeTarget(href));
    } else {
      window.location.replace(href);
    }
  }
}

export function getActiveRoute(): string {
  if (typeof window === 'undefined') return '/';
  const path = window.location.pathname.replace(/\\/g, '/');
  const match = path.match(/\/([^/]+)\/index\.html$/);
  return match ? '/' + match[1] : '/';
}
