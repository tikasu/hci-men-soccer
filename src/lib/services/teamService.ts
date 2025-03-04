import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Team, Player } from '../types';

const TEAMS_COLLECTION = 'teams';
const PLAYERS_COLLECTION = 'players';

// Get all teams
export const getAllTeams = async (): Promise<Team[]> => {
  try {
    const teamsSnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
    return teamsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Team[];
  } catch (error) {
    console.error('Error getting teams:', error);
    return [];
  }
};

// Get a team by ID
export const getTeamById = async (id: string): Promise<Team | null> => {
  if (!id) {
    console.error('Invalid team ID provided:', id);
    return null;
  }

  try {
    console.log(`Attempting to fetch team with ID: ${id}`);
    const teamDoc = await getDoc(doc(db, TEAMS_COLLECTION, id));
    
    if (!teamDoc.exists()) {
      console.error(`Team document does not exist for ID: ${id}`);
      return null;
    }
    
    const teamData = teamDoc.data();
    console.log(`Successfully fetched team: ${teamData.name || 'Unknown'} (${id})`);
    
    return {
      id: teamDoc.id,
      ...teamData,
    } as Team;
  } catch (error) {
    console.error(`Error getting team with ID ${id}:`, error);
    // Rethrow with more context for better debugging
    throw new Error(`Failed to fetch team with ID ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create a new team
export const createTeam = async (team: Omit<Team, 'id'>): Promise<Team | null> => {
  try {
    const docRef = await addDoc(collection(db, TEAMS_COLLECTION), team);
    return {
      id: docRef.id,
      ...team,
    };
  } catch (error) {
    console.error('Error creating team:', error);
    return null;
  }
};

// Update a team
export const updateTeam = async (id: string, team: Partial<Team>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, TEAMS_COLLECTION, id), team);
    return true;
  } catch (error) {
    console.error('Error updating team:', error);
    return false;
  }
};

// Delete a team
export const deleteTeam = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, TEAMS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error('Error deleting team:', error);
    return false;
  }
};

// Get players by team ID
export const getPlayersByTeamId = async (teamId: string): Promise<Player[]> => {
  try {
    const playersQuery = query(
      collection(db, PLAYERS_COLLECTION),
      where('teamId', '==', teamId)
    );
    
    const playersSnapshot = await getDocs(playersQuery);
    
    return playersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Player[];
  } catch (error) {
    console.error('Error getting players:', error);
    return [];
  }
};

// Add a player to a team
export const addPlayerToTeam = async (teamId: string, player: Omit<Player, 'id'>): Promise<Player | null> => {
  try {
    const playerWithTeam = {
      ...player,
      teamId
    };
    const docRef = await addDoc(collection(db, PLAYERS_COLLECTION), playerWithTeam);
    return {
      id: docRef.id,
      ...playerWithTeam,
    };
  } catch (error) {
    console.error('Error adding player:', error);
    return null;
  }
};

// Update a player
export const updatePlayer = async (id: string, player: Partial<Player>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, PLAYERS_COLLECTION, id), player);
    return true;
  } catch (error) {
    console.error('Error updating player:', error);
    return false;
  }
};

// Delete a player
export const deletePlayer = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, PLAYERS_COLLECTION, id));
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    return false;
  }
}; 