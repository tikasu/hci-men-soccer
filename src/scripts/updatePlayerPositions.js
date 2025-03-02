// Script to update player positions in the database
// This script updates all players with position "Forward", "Defender", or "Midfielder" to "Fieldplayer"

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where, 
  writeBatch 
} = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const PLAYERS_POOL_COLLECTION = 'players_pool';
const PLAYERS_COLLECTION = 'players';

async function updatePlayerPositions() {
  try {
    console.log('Starting position update process...');
    
    // Update players in the pool
    console.log('Updating players in the pool...');
    const poolPlayersSnapshot = await getDocs(collection(db, PLAYERS_POOL_COLLECTION));
    
    const poolBatch = writeBatch(db);
    let poolUpdateCount = 0;
    
    poolPlayersSnapshot.forEach((playerDoc) => {
      const playerData = playerDoc.data();
      if (playerData.position === 'Forward' || playerData.position === 'Defender' || playerData.position === 'Midfielder') {
        poolBatch.update(doc(db, PLAYERS_POOL_COLLECTION, playerDoc.id), {
          position: 'Fieldplayer'
        });
        poolUpdateCount++;
      }
    });
    
    await poolBatch.commit();
    console.log(`Updated ${poolUpdateCount} players in the pool.`);
    
    // Update team players
    console.log('Updating team players...');
    const teamPlayersSnapshot = await getDocs(collection(db, PLAYERS_COLLECTION));
    
    const teamBatch = writeBatch(db);
    let teamUpdateCount = 0;
    
    teamPlayersSnapshot.forEach((playerDoc) => {
      const playerData = playerDoc.data();
      if (playerData.position === 'Forward' || playerData.position === 'Defender' || playerData.position === 'Midfielder') {
        teamBatch.update(doc(db, PLAYERS_COLLECTION, playerDoc.id), {
          position: 'Fieldplayer'
        });
        teamUpdateCount++;
      }
    });
    
    await teamBatch.commit();
    console.log(`Updated ${teamUpdateCount} team players.`);
    
    console.log('Position update completed successfully!');
  } catch (error) {
    console.error('Error updating player positions:', error);
  }
}

// Run the update function
updatePlayerPositions(); 