import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Player } from '../types';

const PLAYERS_POOL_COLLECTION = 'players_pool';
const PLAYERS_COLLECTION = 'players';

// Extended player type with additional fields for the pool
export interface PoolPlayer extends Omit<Player, 'teamId'> {
  isActive: boolean;
  currentTeamId?: string;
  currentTeam?: string;
  lastSeason?: string;
  seasonHistory?: {
    season: string;
    teamId: string;
    teamName: string;
  }[];
}

// Get all players from the pool
export const getAllPoolPlayers = async (): Promise<PoolPlayer[]> => {
  try {
    const playersSnapshot = await getDocs(collection(db, PLAYERS_POOL_COLLECTION));
    const players = playersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PoolPlayer[];
    
    console.log(`[playerPoolService] Fetched ${players.length} players from database`);
    console.log(`[playerPoolService] Active players: ${players.filter(p => p.isActive).length}`);
    
    return players;
  } catch (error) {
    console.error('Error getting pool players:', error);
    return [];
  }
};

// Get a player from the pool by ID
export const getPoolPlayerById = async (id: string): Promise<PoolPlayer | null> => {
  try {
    const playerDoc = await getDoc(doc(db, PLAYERS_POOL_COLLECTION, id));
    
    if (!playerDoc.exists()) {
      return null;
    }
    
    return {
      id: playerDoc.id,
      ...playerDoc.data(),
    } as PoolPlayer;
  } catch (error) {
    console.error('Error getting pool player:', error);
    return null;
  }
};

// Add a new player to the pool
export const addPlayerToPool = async (player: Omit<PoolPlayer, 'id'>): Promise<PoolPlayer | null> => {
  try {
    const docRef = await addDoc(collection(db, PLAYERS_POOL_COLLECTION), {
      ...player,
      isActive: true, // New players are active by default
    });
    
    return {
      id: docRef.id,
      ...player,
      isActive: true,
    };
  } catch (error) {
    console.error('Error adding player to pool:', error);
    return null;
  }
};

// Update a player in the pool
export const updatePoolPlayer = async (id: string, player: Partial<PoolPlayer>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, PLAYERS_POOL_COLLECTION, id), player);
    return true;
  } catch (error) {
    console.error('Error updating pool player:', error);
    return false;
  }
};

// Toggle a player's active status
export const togglePlayerActiveStatus = async (id: string, isActive: boolean): Promise<boolean> => {
  try {
    await updateDoc(doc(db, PLAYERS_POOL_COLLECTION, id), { isActive });
    return true;
  } catch (error) {
    console.error('Error toggling player status:', error);
    return false;
  }
};

// Assign players from the pool to a team
export const assignPlayersToTeam = async (
  playerIds: string[], 
  teamId: string, 
  teamName: string,
  season: string
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    const currentDate = new Date();
    
    // Get all the players to assign
    const playersToAssign = await Promise.all(
      playerIds.map(id => getPoolPlayerById(id))
    );
    
    // Filter out any null results
    const validPlayers = playersToAssign.filter(p => p !== null) as PoolPlayer[];
    
    for (const player of validPlayers) {
      // Update the pool player record
      const poolPlayerRef = doc(db, PLAYERS_POOL_COLLECTION, player.id);
      
      // Create or update season history
      const seasonHistory = player.seasonHistory || [];
      const seasonEntry = {
        season,
        teamId,
        teamName,
      };
      
      // Add to team's players collection
      const teamPlayerData = {
        name: player.name,
        position: player.position,
        number: player.number || '',
        stats: player.stats,
        teamId,
      };
      
      // Add to the team's players collection
      const newPlayerRef = doc(collection(db, PLAYERS_COLLECTION));
      batch.set(newPlayerRef, teamPlayerData);
      
      // Update the pool player
      batch.update(poolPlayerRef, {
        currentTeamId: teamId,
        currentTeam: teamName,
        lastSeason: season,
        seasonHistory: [...seasonHistory, seasonEntry],
        isActive: true, // Automatically set to active when assigned
      });
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error assigning players to team:', error);
    return false;
  }
};

// Remove a player from a team but keep in the pool
export const removePlayerFromTeam = async (playerId: string, teamPlayerId: string): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    
    // Remove from team's players collection
    const teamPlayerRef = doc(db, PLAYERS_COLLECTION, teamPlayerId);
    batch.delete(teamPlayerRef);
    
    // Update the pool player
    const poolPlayerRef = doc(db, PLAYERS_POOL_COLLECTION, playerId);
    batch.update(poolPlayerRef, {
      currentTeamId: null,
      currentTeam: null,
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error removing player from team:', error);
    return false;
  }
};

// Import players from a team to the pool (for initial setup)
export const importPlayersFromTeam = async (teamId: string, teamName: string, season: string): Promise<boolean> => {
  try {
    const playersQuery = query(
      collection(db, PLAYERS_COLLECTION),
      where('teamId', '==', teamId)
    );
    
    const playersSnapshot = await getDocs(playersQuery);
    const batch = writeBatch(db);
    
    for (const playerDoc of playersSnapshot.docs) {
      const playerData = playerDoc.data() as Player;
      
      // Check if player already exists in pool by name (could be more sophisticated)
      const existingQuery = query(
        collection(db, PLAYERS_POOL_COLLECTION),
        where('name', '==', playerData.name)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      if (existingSnapshot.empty) {
        // Player doesn't exist in pool, add them
        const poolPlayerData: Omit<PoolPlayer, 'id'> = {
          name: playerData.name,
          position: playerData.position,
          number: playerData.number || '',
          stats: playerData.stats,
          isActive: true,
          currentTeamId: teamId,
          currentTeam: teamName,
          lastSeason: season,
          seasonHistory: [{
            season,
            teamId,
            teamName,
          }],
        };
        
        const newPoolPlayerRef = doc(collection(db, PLAYERS_POOL_COLLECTION));
        batch.set(newPoolPlayerRef, poolPlayerData);
      } else {
        // Player exists, update their record
        const existingPlayer = existingSnapshot.docs[0];
        const existingData = existingPlayer.data() as PoolPlayer;
        
        const seasonHistory = existingData.seasonHistory || [];
        const seasonEntry = {
          season,
          teamId,
          teamName,
        };
        
        batch.update(existingPlayer.ref, {
          currentTeamId: teamId,
          currentTeam: teamName,
          lastSeason: season,
          seasonHistory: [...seasonHistory, seasonEntry],
          isActive: true,
        });
      }
    }
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error importing players from team:', error);
    return false;
  }
}; 