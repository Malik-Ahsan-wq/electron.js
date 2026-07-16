'use client';

import { useEffect } from 'react';
import { navigateReplace } from '@/lib/navigate';

export default function RootPage() {
  useEffect(() => {
    navigateReplace('/login');
  }, []);
  return null;
}
