'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  if (loading || (!isAuthenticated || !isAdmin)) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Teams Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Teams Management</h2>
            <p className="text-gray-700 mb-4 text-base">Add, edit, or remove teams from the league.</p>
            <Link 
              href="/admin/teams" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              Manage Teams
            </Link>
          </div>
        </div>
        
        {/* Players Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Players Management</h2>
            <p className="text-gray-700 mb-4 text-base">Add, edit, or remove players and update their statistics.</p>
            <Link 
              href="/admin/players" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              Manage Players
            </Link>
          </div>
        </div>
        
        {/* Matches Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Matches Management</h2>
            <p className="text-gray-700 mb-4 text-base">Schedule matches, update scores, and record player statistics.</p>
            <Link 
              href="/admin/matches" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              Manage Matches
            </Link>
          </div>
        </div>
        
        {/* Playoff Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Playoff Management</h2>
            <p className="text-gray-700 mb-4 text-base">Set up and manage the playoff bracket and schedule.</p>
            <Link 
              href="/admin/playoffs" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              Manage Playoffs
            </Link>
          </div>
        </div>
        
        {/* Standings */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">League Standings</h2>
            <p className="text-gray-700 mb-4 text-base">View and manually adjust team standings if needed.</p>
            <Link 
              href="/admin/standings" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              Manage Standings
            </Link>
          </div>
        </div>
        
        {/* AI Insights */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">AI Insights</h2>
            <p className="text-gray-700 mb-4 text-base">View AI-generated insights about teams, players, and matches.</p>
            <Link 
              href="/admin/insights" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              View Insights
            </Link>
          </div>
        </div>
        
        {/* User Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">User Management</h2>
            <p className="text-gray-700 mb-4 text-base">Manage user accounts and permissions.</p>
            <Link 
              href="/admin/users" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              Manage Users
            </Link>
          </div>
        </div>
        
        {/* Settings */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">League Settings</h2>
            <p className="text-gray-700 mb-4 text-base">Configure league settings, seasons, and scoring rules.</p>
            <Link 
              href="/admin/settings" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              Manage Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 