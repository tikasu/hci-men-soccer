// This script cleans up the player pool by:
// 1. Removing all existing players from the player pool
// 2. Adding all current team players to the player pool

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  addDoc, 
  query, 
  where 
} = require('firebase/firestore');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Log the Firebase config for debugging (without sensitive values)
console.log('Firebase config loaded:', {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '***' : 'undefined',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? '***' : 'undefined',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? '***' : 'undefined',
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection names
const PLAYERS_POOL_COLLECTION = 'players_pool';
const TEAMS_COLLECTION = 'teams';
const PLAYERS_COLLECTION = 'players';

// Function to get all players from the player pool
async function getAllPoolPlayers() {
  try {
    const playersSnapshot = await getDocs(collection(db, PLAYERS_POOL_COLLECTION));
    return playersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting pool players:', error);
    return [];
  }
}

// Function to delete a player from the player pool
async function deletePoolPlayer(id) {
  try {
    await deleteDoc(doc(db, PLAYERS_POOL_COLLECTION, id));
    return true;
  } catch (error) {
    console.error(`Error deleting pool player ${id}:`, error);
    return false;
  }
}

// Function to get all teams
async function getAllTeams() {
  try {
    const teamsSnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
    return teamsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting teams:', error);
    return [];
  }
}

// Function to get players by team ID
async function getPlayersByTeamId(teamId) {
  try {
    const playersQuery = query(
      collection(db, PLAYERS_COLLECTION),
      where('teamId', '==', teamId)
    );
    
    const playersSnapshot = await getDocs(playersQuery);
    
    return playersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error(`Error getting players for team ${teamId}:`, error);
    return [];
  }
}

// Function to add a player to the pool
async function addPlayerToPool(player, teamName, season) {
  try {
    // Create the pool player data
    const poolPlayerData = {
      name: player.name,
      position: player.position,
      number: player.number || '',
      stats: player.stats || {
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        gamesPlayed: 0
      },
      isActive: true, // Ensure all players are active
      currentTeamId: player.teamId,
      currentTeam: teamName,
      lastSeason: season,
      seasonHistory: [{
        season,
        teamId: player.teamId,
        teamName,
      }],
    };
    
    // Log player data for debugging
    console.log(`Adding player: ${player.name}, Position: ${player.position}, Team: ${teamName}, Active: true`);
    
    // Add to the player pool
    const docRef = await addDoc(collection(db, PLAYERS_POOL_COLLECTION), poolPlayerData);
    
    return {
      id: docRef.id,
      ...poolPlayerData,
    };
  } catch (error) {
    console.error(`Error adding player ${player.name} to pool:`, error);
    return null;
  }
}

// Main function to clean up the player pool
async function cleanupPlayerPool() {
  try {
    console.log('Starting player pool cleanup...');
    
    // Step 1: Get all players from the player pool
    console.log('Getting all players from the player pool...');
    const poolPlayers = await getAllPoolPlayers();
    console.log(`Found ${poolPlayers.length} players in the pool.`);
    
    // Step 2: Delete all players from the pool
    console.log('Deleting all players from the pool...');
    let deletedCount = 0;
    for (const player of poolPlayers) {
      const success = await deletePoolPlayer(player.id);
      if (success) {
        deletedCount++;
      }
    }
    console.log(`Deleted ${deletedCount} players from the pool.`);
    
    // Step 3: Get all teams
    console.log('Getting all teams...');
    const teams = await getAllTeams();
    console.log(`Found ${teams.length} teams.`);
    
    // Step 4: Get all players from each team and add them to the pool
    console.log('Adding team players to the pool...');
    const currentSeason = 'Winter 2025';
    let addedCount = 0;
    let activeCount = 0;
    let positionCounts = {
      Goalkeeper: 0,
      Fieldplayer: 0,
      Other: 0
    };
    
    for (const team of teams) {
      console.log(`Processing team: ${team.name}`);
      const teamPlayers = await getPlayersByTeamId(team.id);
      console.log(`Found ${teamPlayers.length} players in team ${team.name}.`);
      
      for (const player of teamPlayers) {
        const addedPlayer = await addPlayerToPool(player, team.name, currentSeason);
        if (addedPlayer) {
          addedCount++;
          if (addedPlayer.isActive) {
            activeCount++;
          }
          
          // Count positions
          if (addedPlayer.position === 'Goalkeeper') {
            positionCounts.Goalkeeper++;
          } else if (addedPlayer.position === 'Fieldplayer') {
            positionCounts.Fieldplayer++;
          } else {
            positionCounts.Other++;
          }
        }
      }
    }
    
    console.log(`Added ${addedCount} players to the pool.`);
    console.log(`Active players: ${activeCount}`);
    console.log(`Position counts: Goalkeeper: ${positionCounts.Goalkeeper}, Fieldplayer: ${positionCounts.Fieldplayer}, Other: ${positionCounts.Other}`);
    console.log('Player pool cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error during player pool cleanup:', error);
  }
}

// Run the cleanup
cleanupPlayerPool()
  .then(() => {
    console.log('Script execution completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 