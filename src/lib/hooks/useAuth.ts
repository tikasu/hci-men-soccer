import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { useQuery } from '@tanstack/react-query';
import { auth } from '../firebase/config';
import { getUserData, signIn, signInWithGoogle, signOut, signUp } from '../firebase/auth';
import { User } from '../types';

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Use React Query to fetch and cache the current user
  const { data: user, refetch } = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      return await getUserData(currentUser);
    },
    enabled: false, // Don't run on mount, we'll handle this with onAuthStateChanged
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        await refetch();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refetch]);

  // Sign up function
  const handleSignUp = async (email: string, password: string) => {
    setLoading(true);
    const newUser = await signUp(email, password);
    setLoading(false);
    if (newUser) {
      await refetch();
      router.push('/teams');
    }
    return newUser;
  };

  // Sign in function
  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    const loggedInUser = await signIn(email, password);
    setLoading(false);
    if (loggedInUser) {
      await refetch();
      router.push('/teams');
    }
    return loggedInUser;
  };

  // Sign in with Google function
  const handleSignInWithGoogle = async () => {
    setLoading(true);
    const loggedInUser = await signInWithGoogle();
    setLoading(false);
    if (loggedInUser) {
      await refetch();
      router.push('/teams');
    }
    return loggedInUser;
  };

  // Sign out function
  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
    // Force refetch to clear user data
    await refetch();
    router.push('/');
  };

  return {
    user,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };
} 