import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '../types';
import { isSignupEnabled } from '../services/userService';

// Sign up with email and password
export const signUp = async (email: string, password: string): Promise<User | null> => {
  try {
    // Check if signup is enabled
    const signupEnabled = await isSignupEnabled();
    if (!signupEnabled) {
      console.error('Signup is disabled');
      return null;
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a user document in Firestore
    const newUser: User = {
      id: user.uid,
      email: user.email || '',
      role: 'user',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      active: true, // New users are active by default
    };
    
    await setDoc(doc(db, 'users', user.uid), newUser);
    return newUser;
  } catch (error) {
    console.error('Error signing up:', error);
    return null;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userData = await getUserData(user);
    
    // Check if user is active and is an admin
    if (userData && (!userData.active || userData.role !== 'admin')) {
      // Sign out if user is not active or not an admin
      await firebaseSignOut(auth);
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error('Error signing in:', error);
    return null;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Create a new user document
      const newUser: User = {
        id: user.uid,
        email: user.email || '',
        role: 'user', // Default role is user
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        active: true, // New users are active by default
      };
      
      await setDoc(doc(db, 'users', user.uid), newUser);
      
      // Sign out if not an admin
      await firebaseSignOut(auth);
      return null;
    }
    
    const userData = userDoc.data() as User;
    
    // Check if user is active and is an admin
    if (!userData.active || userData.role !== 'admin') {
      // Sign out if user is not active or not an admin
      await firebaseSignOut(auth);
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return null;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

// Get user data from Firestore
export const getUserData = async (user: FirebaseUser): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Check if user is admin
export const isAdmin = async (user: FirebaseUser): Promise<boolean> => {
  try {
    const userData = await getUserData(user);
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}; 