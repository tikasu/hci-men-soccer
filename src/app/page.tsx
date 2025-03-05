'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Add a small delay before redirecting to show the admin setup notice
    const timer = setTimeout(() => {
      setRedirecting(true);
      router.push('/standings');
    }, 5000); // 5 second delay
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Welcome to Soccer League</h1>
        
        {/* First Time Notice - Only show if no user is logged in */}
        {!isAuthenticated && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 text-left max-w-2xl mx-auto" role="alert">
            <p className="font-bold">First Time Setup</p>
            <p>If this is your first time using the system, please <Link href="/login" className="text-blue-600 hover:underline">login</Link> with your account first. If you need administrator access, please contact an existing administrator.</p>
          </div>
        )}
        
        {redirecting ? (
          <div>
            <p className="text-gray-600 mb-8">Redirecting to Standings page...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800 mx-auto"></div>
          </div>
        ) : (
          <div className="mt-6">
            <Link href="/standings" className="bg-green-700 text-white py-2 px-4 rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Go to Standings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
