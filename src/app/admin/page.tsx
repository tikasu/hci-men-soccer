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
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Teams Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Teams Management</h2>
            <p className="text-gray-600 mb-4">Add, edit, or remove teams from the league.</p>
            <Link 
              href="/admin/teams" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              Manage Teams
            </Link>
          </div>
        </div>
        
        {/* Players Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Players Management</h2>
            <p className="text-gray-600 mb-4">Add, edit, or remove players and update their statistics.</p>
            <Link 
              href="/admin/players" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              Manage Players
            </Link>
          </div>
        </div>
        
        {/* Matches Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Matches Management</h2>
            <p className="text-gray-600 mb-4">Schedule new matches, update scores, and manage the league calendar.</p>
            <Link 
              href="/admin/matches" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              Manage Matches
            </Link>
          </div>
        </div>
        
        {/* Playoff Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Playoff Management</h2>
            <p className="text-gray-600 mb-4">Set up and manage the playoff bracket and schedule.</p>
            <Link 
              href="/admin/playoffs" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              Manage Playoffs
            </Link>
          </div>
        </div>
        
        {/* Standings */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">League Standings</h2>
            <p className="text-gray-600 mb-4">View and monitor the current league standings table.</p>
            <Link 
              href="/admin/standings" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              View Standings
            </Link>
          </div>
        </div>
        
        {/* AI Insights */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">AI Insights</h2>
            <p className="text-gray-600 mb-4">Generate and manage AI-powered insights for teams, players, and matches.</p>
            <Link 
              href="/admin/insights" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              Manage Insights
            </Link>
          </div>
        </div>
        
        {/* User Management */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <p className="text-gray-600 mb-4">Manage user accounts and permissions.</p>
            <Link 
              href="/admin/users" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              Manage Users
            </Link>
          </div>
        </div>
        
        {/* Settings */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <p className="text-gray-600 mb-4">Configure league settings and preferences.</p>
            <Link 
              href="/admin/settings" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              Manage Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 