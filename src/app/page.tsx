'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Immediately redirect to standings page
    router.replace('/standings');
  }, [router]);

  // Return null or minimal content as it won't be visible
  return null;
}
