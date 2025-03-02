import { collection, getDocs, doc, updateDoc, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from '../types';
import { getSettings } from './settingsService';

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const userSnapshot = await getDocs(usersCollection);
    
    return userSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as User));
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId: string, role: 'admin' | 'user'): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Update user active status
export const updateUserActiveStatus = async (userId: string, active: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { active });
  } catch (error) {
    console.error('Error updating user active status:', error);
    throw error;
  }
};

// Count admin users
export const countAdminUsers = async (): Promise<number> => {
  try {
    const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
    const snapshot = await getCountFromServer(adminQuery);
    return snapshot.data().count;
  } catch (error) {
    console.error('Error counting admin users:', error);
    throw error;
  }
};

// Check if admin limit is reached
export const isAdminLimitReached = async (): Promise<boolean> => {
  try {
    const settings = await getSettings();
    const adminCount = await countAdminUsers();
    return adminCount >= settings.maxAdminUsers;
  } catch (error) {
    console.error('Error checking admin limit:', error);
    throw error;
  }
};

// Check if signup is enabled
export const isSignupEnabled = async (): Promise<boolean> => {
  try {
    const settings = await getSettings();
    return settings.signupEnabled;
  } catch (error) {
    console.error('Error checking if signup is enabled:', error);
    throw error;
  }
};

// Verify admin secret code
export const verifyAdminSecretCode = async (code: string): Promise<boolean> => {
  try {
    const settings = await getSettings();
    return code === settings.adminSecretCode;
  } catch (error) {
    console.error('Error verifying admin secret code:', error);
    throw error;
  }
}; 