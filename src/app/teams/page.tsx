'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTeams } from '@/lib/hooks/useTeams';

export default function TeamsPage() {
  const { data: teams, isLoading, error } = useTeams();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> Failed to load teams. Please try again later.</span>
      </div>
    );
  }

  // Sort teams alphabetically by name
  const sortedTeams = teams ? [...teams].sort((a, b) => a.name.localeCompare(b.name)) : [];

  return (
    <div className="px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-green-900">Teams</h1>
      
      {sortedTeams && sortedTeams.length > 0 ? (
        <div className="max-w-md mx-auto">
          {sortedTeams.map((team) => (
            <Link 
              key={team.id} 
              href={`/teams/${team.id}`}
              className="block bg-white shadow-md hover:shadow-lg transition-shadow rounded-lg overflow-hidden mb-4 border border-gray-200"
            >
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-2 text-green-800">{team.name}</h2>
                <div className="flex justify-between items-center">
                  <span className="text-base text-gray-700 font-medium">View Roster</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-green-800" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative max-w-md mx-auto" role="alert">
          <strong className="font-bold">No teams found!</strong>
          <span className="block sm:inline"> There are currently no teams in the league.</span>
        </div>
      )}
    </div>
  );
} 