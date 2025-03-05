'use client';

import { useState, useEffect } from 'react';
import { useTeams } from '@/lib/hooks/useTeams';
import { useSettings } from '@/lib/hooks/useSettings';
import Link from 'next/link';
import TopScorers from '../components/TopScorers';

export default function HomePage() {
  const { data: teams, isLoading: isLoadingTeams } = useTeams();
  const { data: settings, isLoading: isLoadingSettings } = useSettings();
  
  const isLoading = isLoadingTeams || isLoadingSettings;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Modern, smaller banner */}
      <div className="bg-white rounded-xl mb-6 shadow-sm border-l-4 border-green-600 flex items-center justify-center py-3">
        <p className="text-lg sm:text-xl font-medium text-gray-800">
          <span className="text-green-600 font-bold">{settings?.currentSeason || 'Current'}</span> Season
        </p>
      </div>

      {/* Mobile-friendly card layout */}
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Standings Card - Priority 1 */}
        <div className="group bg-white shadow-md hover:shadow-lg rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:bg-green-50">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">League Standings</h2>
            </div>
            
            <div className="overflow-hidden max-h-0 group-hover:max-h-40 transition-all duration-300">
              <p className="text-gray-700 mb-4">
                Check out the current standings to see how your favorite team is performing this season.
              </p>
            </div>
            
            <div>
              <Link 
                href="/standings" 
                className="inline-block w-full bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base text-center transition-colors duration-300"
              >
                View Standings
              </Link>
            </div>
          </div>
        </div>

        {/* Schedule Card - Priority 2 */}
        <div className="group bg-white shadow-md hover:shadow-lg rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:bg-green-50">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Upcoming Matches</h2>
            </div>
            
            <div className="overflow-hidden max-h-0 group-hover:max-h-40 transition-all duration-300">
              <p className="text-gray-700 mb-4">
                Stay up to date with all the upcoming matches in the league.
              </p>
            </div>
            
            <div>
              <Link 
                href="/schedule" 
                className="inline-block w-full bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base text-center transition-colors duration-300"
              >
                View Schedule
              </Link>
            </div>
          </div>
        </div>

        {/* Teams Card - Priority 3 */}
        <div className="group bg-white shadow-md hover:shadow-lg rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:bg-green-50">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Teams</h2>
            </div>
            
            <div className="overflow-hidden max-h-0 group-hover:max-h-40 transition-all duration-300">
              <p className="text-gray-700 mb-4">
                {teams?.length || 0} teams competing this season
              </p>
            </div>
            
            <div>
              <Link 
                href="/teams" 
                className="inline-block w-full bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base text-center transition-colors duration-300"
              >
                View Teams
              </Link>
            </div>
          </div>
        </div>

        {/* Top Scorers Card - Priority 4 */}
        <div className="group bg-white shadow-md hover:shadow-lg rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-[1.02] hover:bg-green-50">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Top Goal Scorers</h2>
            </div>
            
            <div className="overflow-hidden max-h-0 group-hover:max-h-[300px] transition-all duration-300">
              <div className="mb-4">
                <TopScorers />
              </div>
            </div>
            
            <div>
              <Link 
                href="/stats" 
                className="inline-block w-full bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base text-center transition-colors duration-300"
              >
                View All Stats
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 