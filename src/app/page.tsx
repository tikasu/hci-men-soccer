'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page instead of standings
    router.replace('/home');
  }, [router]);

  // Return null or minimal content as it won't be visible
  return null;
}
