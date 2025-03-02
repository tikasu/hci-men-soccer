'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAddPlayerToPool } from '@/lib/hooks/usePlayerPool';
import Link from 'next/link';

export default function AddPlayerToPoolPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  const addPlayerMutation = useAddPlayerToPool();
  
  const [formData, setFormData] = useState({
    name: '',
    position: 'Fieldplayer', // Default position
    number: '',
    stats: {
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      gamesPlayed: 0
    }
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('stats.')) {
      const statName = name.split('.')[1];
      setFormData({
        ...formData,
        stats: {
          ...formData.stats,
          [statName]: parseInt(value) || 0
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.name) {
      setError('Player name is required');
      return;
    }
    
    try {
      await addPlayerMutation.mutateAsync({
        ...formData,
        isActive: true,
        seasonHistory: []
      });
      
      setSuccess('Player added to pool successfully!');
      
      // Reset form after successful submission
      setFormData({
        name: '',
        position: 'Fieldplayer',
        number: '',
        stats: {
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          gamesPlayed: 0
        }
      });
      
      // Redirect back to player pool after a short delay
      setTimeout(() => {
        router.push('/admin/player-pool');
      }, 1500);
    } catch (err) {
      console.error('Failed to add player:', err);
      setError('Failed to add player to pool');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Add Player to Pool</h1>
        <Link
          href="/admin/player-pool"
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Player Pool
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Player Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="Goalkeeper">Goalkeeper</option>
                <option value="Fieldplayer">Fieldplayer</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                Jersey Number
              </label>
              <input
                type="text"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-3">Player Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <div>
              <label htmlFor="stats.goals" className="block text-sm font-medium text-gray-700 mb-1">
                Goals
              </label>
              <input
                type="number"
                id="stats.goals"
                name="stats.goals"
                value={formData.stats.goals}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="stats.assists" className="block text-sm font-medium text-gray-700 mb-1">
                Assists
              </label>
              <input
                type="number"
                id="stats.assists"
                name="stats.assists"
                value={formData.stats.assists}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="stats.yellowCards" className="block text-sm font-medium text-gray-700 mb-1">
                Yellow Cards
              </label>
              <input
                type="number"
                id="stats.yellowCards"
                name="stats.yellowCards"
                value={formData.stats.yellowCards}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="stats.redCards" className="block text-sm font-medium text-gray-700 mb-1">
                Red Cards
              </label>
              <input
                type="number"
                id="stats.redCards"
                name="stats.redCards"
                value={formData.stats.redCards}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="stats.gamesPlayed" className="block text-sm font-medium text-gray-700 mb-1">
                Games Played
              </label>
              <input
                type="number"
                id="stats.gamesPlayed"
                name="stats.gamesPlayed"
                value={formData.stats.gamesPlayed}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link
              href="/admin/player-pool"
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800"
            >
              Add Player
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 