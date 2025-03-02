'use client';

import { ReactNode } from 'react';
import { QueryProvider } from '@/lib/providers/QueryProvider';

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>;
} 