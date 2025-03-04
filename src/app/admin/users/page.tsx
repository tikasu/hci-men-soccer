'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { getAllUsers, updateUserRole, updateUserActiveStatus } from '@/lib/services/userService';
import { User } from '@/lib/types';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, isAdmin, isAuthenticated, loading } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
    }
  }, [isAuthenticated, isAdmin, loading, router]);

  // Load users
  useEffect(() => {
    const loadUsers = async () => {
      if (!isAuthenticated || !isAdmin) return;
      
      setIsLoadingUsers(true);
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users');
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (!loading && isAuthenticated && isAdmin) {
      loadUsers();
    }
  }, [isAuthenticated, isAdmin, loading]);

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

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateUserRole(userId, newRole);
      setSuccess(`User role updated to ${newRole} successfully!`);
      
      // Update the local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update user role');
      console.error(err);
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleActiveStatusChange = async (userId: string, newActiveStatus: boolean) => {
    try {
      await updateUserActiveStatus(userId, newActiveStatus);
      setSuccess(`User ${newActiveStatus ? 'enabled' : 'disabled'} successfully!`);
      
      // Update the local state
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, active: newActiveStatus } : u
        )
      );
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to ${newActiveStatus ? 'enable' : 'disable'} user`);
      console.error(err);
      
      // Clear error message after 3 seconds
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Manage Users</h1>

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

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-800 uppercase text-sm leading-normal">
                <th className="py-3 px-6 text-left">Email</th>
                <th className="py-3 px-6 text-left">Name</th>
                <th className="py-3 px-6 text-center">Role</th>
                <th className="py-3 px-6 text-center">Status</th>
                <th className="py-3 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-base">
              {isLoadingUsers ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-800"></div>
                    </div>
                  </td>
                </tr>
              ) : users && users.length > 0 ? (
                users.map((userData) => (
                  <tr key={userData.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      {userData.email}
                    </td>
                    <td className="py-3 px-6 text-left">
                      {userData.displayName || '-'}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {userData.role === 'admin' ? (
                        <span className="bg-purple-100 text-purple-800 py-1 px-3 rounded-full text-xs">Admin</span>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs">User</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {userData.active ? (
                        <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs">Active</span>
                      ) : (
                        <span className="bg-red-100 text-red-800 py-1 px-3 rounded-full text-xs">Disabled</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {userData.id !== user?.id && (
                        <div className="flex item-center justify-center space-x-2">
                          {userData.role === 'user' ? (
                            <button
                              onClick={() => handleRoleChange(userData.id, 'admin')}
                              className="bg-purple-100 hover:bg-purple-200 text-purple-800 py-1 px-3 rounded text-xs"
                            >
                              Make Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(userData.id, 'user')}
                              className="bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-3 rounded text-xs"
                            >
                              Make User
                            </button>
                          )}
                          
                          {userData.active ? (
                            <button
                              onClick={() => handleActiveStatusChange(userData.id, false)}
                              className="bg-red-100 hover:bg-red-200 text-red-800 py-1 px-3 rounded text-xs"
                            >
                              Disable
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActiveStatusChange(userData.id, true)}
                              className="bg-green-100 hover:bg-green-200 text-green-800 py-1 px-3 rounded text-xs"
                            >
                              Enable
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
                      <strong className="font-bold">No users found!</strong>
                      <span className="block sm:inline"> There are currently no users in the system.</span>
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