'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTeams } from '@/lib/hooks/useTeams';
import { createTeam, updateTeam, deleteTeam } from '@/lib/services/teamService';
import { Team } from '@/lib/types';

export default function AdminTeamsPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const { data: teams, isLoading: isLoadingTeams, refetch } = useTeams();
  
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null; // Will redirect in useEffect
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo: '',
      description: ''
    });
    setIsAddingTeam(false);
    setIsEditingTeam(null);
    setError('');
    setSuccess('');
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name) {
      setError('Team name is required');
      return;
    }

    try {
      await createTeam({
        name: formData.name,
        logo: formData.logo || '',
        description: formData.description || ''
      });
      setSuccess('Team added successfully!');
      resetForm();
      refetch();
    } catch (err) {
      setError('Failed to add team');
      console.error(err);
    }
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name) {
      setError('Team name is required');
      return;
    }

    if (!isEditingTeam) return;

    try {
      await updateTeam(isEditingTeam, {
        name: formData.name,
        logo: formData.logo || '',
        description: formData.description || ''
      });
      setSuccess('Team updated successfully!');
      resetForm();
      refetch();
    } catch (err) {
      setError('Failed to update team');
      console.error(err);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteTeam(teamId);
      setSuccess('Team deleted successfully!');
      refetch();
    } catch (err) {
      setError('Failed to delete team');
      console.error(err);
    }
  };

  const startEditTeam = (team: Team) => {
    setFormData({
      name: team.name,
      logo: team.logo || '',
      description: team.description || ''
    });
    setIsEditingTeam(team.id);
    setIsAddingTeam(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Teams</h1>
        <button
          onClick={() => {
            resetForm();
            setIsAddingTeam(true);
          }}
          className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 text-base"
        >
          Add New Team
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline text-base">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline text-base">{success}</span>
        </div>
      )}

      {(isAddingTeam || isEditingTeam) && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">{isAddingTeam ? 'Add New Team' : 'Edit Team'}</h2>
          <form onSubmit={isAddingTeam ? handleAddTeam : handleEditTeam}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-base font-medium text-gray-900 mb-1">
                Team Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="logo" className="block text-base font-medium text-gray-900 mb-1">
                Logo URL
              </label>
              <input
                type="text"
                id="logo"
                name="logo"
                value={formData.logo}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-base font-medium text-gray-900 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-700 hover:bg-green-800"
              >
                {isAddingTeam ? 'Add Team' : 'Update Team'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-800 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Team Name</th>
                <th className="py-3 px-6 text-left">Description</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-base">
              {isLoadingTeams ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-800"></div>
                    </div>
                  </td>
                </tr>
              ) : teams && teams.length > 0 ? (
                teams
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((team) => (
                  <tr key={team.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <div className="flex items-center">
                        {team.logo && (
                          <div className="mr-2">
                            <img src={team.logo} alt={team.name} className="h-8 w-8 rounded-full" />
                          </div>
                        )}
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-6 text-left">
                      {team.description ? (
                        <span className="truncate block max-w-xs">{team.description}</span>
                      ) : (
                        <span className="text-gray-400 italic">No description</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="flex item-center justify-center">
                        <button
                          onClick={() => startEditTeam(team)}
                          className="transform hover:text-green-700 hover:scale-110 mr-3"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="transform hover:text-red-700 hover:scale-110"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                      <strong className="font-bold">No teams found!</strong>
                      <span className="block sm:inline"> There are currently no teams in the league.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 