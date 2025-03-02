import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Settings } from '../types';

const SETTINGS_DOC_ID = 'league_settings';

// Default settings
const defaultSettings: Settings = {
  leagueName: 'HCI Soccer League',
  currentSeason: 'Winter 2025',
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
  enableAIInsights: true,
  maxAdminUsers: 8,
  signupEnabled: true,
  adminSecretCode: 'admin123' // This should be changed by the first admin
};

// Get settings
export const getSettings = async (): Promise<Settings> => {
  try {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      return settingsSnap.data() as Settings;
    } else {
      // If settings don't exist, create default settings
      await setDoc(settingsRef, defaultSettings);
      return defaultSettings;
    }
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
};

// Update settings
export const updateSettings = async (settings: Settings): Promise<void> => {
  try {
    const settingsRef = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(settingsRef, settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
}; 