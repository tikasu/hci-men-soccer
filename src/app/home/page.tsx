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
    <div className="container mx-auto px-4 py-8">
      <div className="bg-green-700 p-6 rounded-lg mb-8 text-white text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">HCI MEN O30 SOCCER LEAGUE</h1>
        <p className="text-xl">{settings?.currentSeason || 'Current'} Season</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">League Standings</h2>
              <Link 
                href="/standings" 
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                View Full Standings
              </Link>
            </div>
            
            <p className="text-gray-700 mb-4">
              Check out the current standings to see how your favorite team is performing this season.
            </p>
            
            <Link 
              href="/standings" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              View Standings
            </Link>
          </div>

          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Upcoming Matches</h2>
              <Link 
                href="/schedule" 
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                View Full Schedule
              </Link>
            </div>
            
            <p className="text-gray-700 mb-4">
              Stay up to date with all the upcoming matches in the league.
            </p>
            
            <Link 
              href="/schedule" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              View Schedule
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          <TopScorers />
          
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Teams</h2>
              <Link 
                href="/teams" 
                className="text-sm text-green-700 hover:text-green-800 font-medium"
              >
                View All
              </Link>
            </div>
            
            <p className="text-gray-700 mb-4">
              {teams?.length || 0} teams competing this season
            </p>
            
            <Link 
              href="/teams" 
              className="inline-block bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
            >
              View Teams
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 