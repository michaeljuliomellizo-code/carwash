'use client';

import { AppProvider } from '@/lib/store';
import Shell from '@/components/carwash/Shell';

export default function Home() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
