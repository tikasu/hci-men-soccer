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
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { PlayoffMatch, Team } from '../types';
import { getTeamById } from './teamService';

const PLAYOFF_MATCHES_COLLECTION = 'playoffMatches';

// Get all playoff matches
export const getAllPlayoffMatches = async (): Promise<PlayoffMatch[]> => {
  try {
    const playoffMatchesCollection = collection(db, PLAYOFF_MATCHES_COLLECTION);
    
    try {
      // Try with the compound query that requires an index
      const q = query(
        playoffMatchesCollection, 
        orderBy('round', 'asc'), 
        orderBy('matchNumber', 'asc')
      );
      const matchSnapshot = await getDocs(q);
      
      const matches = matchSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PlayoffMatch));

      // Fetch team names for each match if they don't exist
      const matchesWithTeamNames = await Promise.all(
        matches.map(async (match) => {
          if (!match.homeTeamName || !match.awayTeamName) {
            const homeTeam = match.homeTeamId ? await getTeamById(match.homeTeamId) : null;
            const awayTeam = match.awayTeamId ? await getTeamById(match.awayTeamId) : null;
            
            return {
              ...match,
              homeTeamName: homeTeam?.name || 'TBD',
              awayTeamName: awayTeam?.name || 'TBD',
            };
          }
          return match;
        })
      );
      
      return matchesWithTeamNames;
    } catch (indexError) {
      console.warn('Index error, falling back to client-side sorting:', indexError);
      
      // Fallback: Get all matches and sort client-side if the index doesn't exist yet
      const q = query(playoffMatchesCollection);
      const matchSnapshot = await getDocs(q);
      
      const matches = matchSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PlayoffMatch));
      
      // Sort by round and matchNumber client-side
      matches.sort((a, b) => {
        // First sort by round
        const roundOrder = { 'quarterfinal': 1, 'semifinal': 2, 'final': 3 };
        const roundDiff = roundOrder[a.round as keyof typeof roundOrder] - roundOrder[b.round as keyof typeof roundOrder];
        
        if (roundDiff !== 0) return roundDiff;
        
        // Then sort by matchNumber
        return a.matchNumber - b.matchNumber;
      });
      
      // Fetch team names for each match if they don't exist
      const matchesWithTeamNames = await Promise.all(
        matches.map(async (match) => {
          if (!match.homeTeamName || !match.awayTeamName) {
            const homeTeam = match.homeTeamId ? await getTeamById(match.homeTeamId) : null;
            const awayTeam = match.awayTeamId ? await getTeamById(match.awayTeamId) : null;
            
            return {
              ...match,
              homeTeamName: homeTeam?.name || 'TBD',
              awayTeamName: awayTeam?.name || 'TBD',
            };
          }
          return match;
        })
      );
      
      return matchesWithTeamNames;
    }
  } catch (error) {
    console.error('Error getting playoff matches:', error);
    throw error;
  }
};

// Get playoff matches by round
export const getPlayoffMatchesByRound = async (round: 'quarterfinal' | 'semifinal' | 'final'): Promise<PlayoffMatch[]> => {
  try {
    const playoffMatchesCollection = collection(db, PLAYOFF_MATCHES_COLLECTION);
    
    // First try with the compound query that requires an index
    try {
      const q = query(
        playoffMatchesCollection,
        where('round', '==', round),
        orderBy('matchNumber', 'asc')
      );
      
      const matchSnapshot = await getDocs(q);
      
      const matches = matchSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PlayoffMatch));

      // Fetch team names for each match if they don't exist
      const matchesWithTeamNames = await Promise.all(
        matches.map(async (match) => {
          if (!match.homeTeamName || !match.awayTeamName) {
            const homeTeam = match.homeTeamId ? await getTeamById(match.homeTeamId) : null;
            const awayTeam = match.awayTeamId ? await getTeamById(match.awayTeamId) : null;
            
            return {
              ...match,
              homeTeamName: homeTeam?.name || 'TBD',
              awayTeamName: awayTeam?.name || 'TBD',
            };
          }
          return match;
        })
      );
      
      return matchesWithTeamNames;
    } catch (indexError) {
      console.warn('Index error, falling back to client-side filtering:', indexError);
      
      // Fallback: Get all matches and filter client-side if the index doesn't exist yet
      const q = query(playoffMatchesCollection);
      const matchSnapshot = await getDocs(q);
      
      const allMatches = matchSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ref: doc.ref,
          round: data.round,
          matchNumber: data.matchNumber,
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          homeTeamName: data.homeTeamName,
          awayTeamName: data.awayTeamName,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          date: data.date,
          location: data.location,
          isCompleted: data.isCompleted
        };
      });
      
      // Filter by round and sort by matchNumber client-side
      const filteredMatches = allMatches
        .filter(match => match.round === round)
        .sort((a, b) => a.matchNumber - b.matchNumber);
      
      // Fetch team names for each match if they don't exist
      const matchesWithTeamNames = await Promise.all(
        filteredMatches.map(async (match) => {
          if (!match.homeTeamName || !match.awayTeamName) {
            const homeTeam = match.homeTeamId ? await getTeamById(match.homeTeamId) : null;
            const awayTeam = match.awayTeamId ? await getTeamById(match.awayTeamId) : null;
            
            return {
              ...match,
              homeTeamName: homeTeam?.name || 'TBD',
              awayTeamName: awayTeam?.name || 'TBD',
            };
          }
          return match;
        })
      );
      
      return matchesWithTeamNames;
    }
  } catch (error) {
    console.error(`Error getting ${round} matches:`, error);
    throw error;
  }
};

// Get a playoff match by ID
export const getPlayoffMatchById = async (matchId: string): Promise<PlayoffMatch | null> => {
  try {
    const matchRef = doc(db, PLAYOFF_MATCHES_COLLECTION, matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (matchSnap.exists()) {
      const match = {
        id: matchSnap.id,
        ...matchSnap.data()
      } as PlayoffMatch;

      // Fetch team names if they don't exist
      if (!match.homeTeamName || !match.awayTeamName) {
        const homeTeam = match.homeTeamId ? await getTeamById(match.homeTeamId) : null;
        const awayTeam = match.awayTeamId ? await getTeamById(match.awayTeamId) : null;
        
        return {
          ...match,
          homeTeamName: homeTeam?.name || 'TBD',
          awayTeamName: awayTeam?.name || 'TBD',
        };
      }
      
      return match;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting playoff match:', error);
    throw error;
  }
};

// Create a new playoff match
export const createPlayoffMatch = async (matchData: Partial<PlayoffMatch>): Promise<string> => {
  try {
    const playoffMatchesCollection = collection(db, PLAYOFF_MATCHES_COLLECTION);
    const docRef = await addDoc(playoffMatchesCollection, matchData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating playoff match:', error);
    throw error;
  }
};

// Update a playoff match
export const updatePlayoffMatch = async (matchId: string, matchData: Partial<PlayoffMatch>): Promise<void> => {
  try {
    const matchRef = doc(db, PLAYOFF_MATCHES_COLLECTION, matchId);
    
    // Ensure we're not sending undefined values to Firestore
    const cleanedData = Object.entries(matchData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    await updateDoc(matchRef, cleanedData);
  } catch (error) {
    console.error('Error updating playoff match:', error);
    throw error;
  }
};

// Delete a playoff match
export const deletePlayoffMatch = async (matchId: string): Promise<void> => {
  try {
    const matchRef = doc(db, PLAYOFF_MATCHES_COLLECTION, matchId);
    await deleteDoc(matchRef);
  } catch (error) {
    console.error('Error deleting playoff match:', error);
    throw error;
  }
};

// Initialize playoff bracket with empty matches
export const initializePlayoffBracket = async (): Promise<void> => {
  try {
    const playoffMatchesCollection = collection(db, PLAYOFF_MATCHES_COLLECTION);
    const existingMatches = await getDocs(playoffMatchesCollection);
    
    // Only initialize if there are no existing playoff matches
    if (existingMatches.empty) {
      // Create quarterfinal matches
      for (let i = 1; i <= 4; i++) {
        await createPlayoffMatch({
          date: '',
          homeTeamId: '',
          awayTeamId: '',
          homeTeamName: 'TBD',
          awayTeamName: 'TBD',
          location: '',
          isCompleted: false,
          round: 'quarterfinal',
          matchNumber: i
        });
      }
      
      // Create semifinal matches
      for (let i = 1; i <= 2; i++) {
        await createPlayoffMatch({
          date: '',
          homeTeamId: '',
          awayTeamId: '',
          homeTeamName: 'TBD',
          awayTeamName: 'TBD',
          location: '',
          isCompleted: false,
          round: 'semifinal',
          matchNumber: i
        });
      }
      
      // Create final match
      await createPlayoffMatch({
        date: '',
        homeTeamId: '',
        awayTeamId: '',
        homeTeamName: 'TBD',
        awayTeamName: 'TBD',
        location: '',
        isCompleted: false,
        round: 'final',
        matchNumber: 1
      });
    }
  } catch (error) {
    console.error('Error initializing playoff bracket:', error);
    throw error;
  }
};

// Update next round match based on winners
export const updateNextRoundMatch = async (
  currentRound: 'quarterfinal' | 'semifinal',
  currentMatchNumber: number,
  winnerId: string,
  winnerName: string
): Promise<void> => {
  try {
    if (!winnerId || !winnerName) {
      console.error('Cannot update next round: Winner ID or name is missing');
      return;
    }
    
    let nextRound: 'semifinal' | 'final';
    let nextMatchNumber: number;
    let isHomeTeam: boolean;
    
    if (currentRound === 'quarterfinal') {
      nextRound = 'semifinal';
      // Quarterfinal matches 1 and 2 feed into semifinal match 1
      // Quarterfinal matches 3 and 4 feed into semifinal match 2
      nextMatchNumber = currentMatchNumber <= 2 ? 1 : 2;
      // Odd-numbered quarterfinal winners become home teams in semifinals
      isHomeTeam = currentMatchNumber % 2 === 1;
    } else {
      // Semifinal
      nextRound = 'final';
      nextMatchNumber = 1;
      // Semifinal match 1 winner becomes home team in final
      isHomeTeam = currentMatchNumber === 1;
    }
    
    // Find the next round match
    const playoffMatchesCollection = collection(db, PLAYOFF_MATCHES_COLLECTION);
    
    try {
      // Try with the compound query that requires an index
      const q = query(
        playoffMatchesCollection,
        where('round', '==', nextRound),
        where('matchNumber', '==', nextMatchNumber)
      );
      
      const matchSnapshot = await getDocs(q);
      
      if (!matchSnapshot.empty) {
        const nextMatch = matchSnapshot.docs[0];
        
        // Update the appropriate team in the next round
        if (isHomeTeam) {
          await updateDoc(nextMatch.ref, {
            homeTeamId: winnerId,
            homeTeamName: winnerName
          });
        } else {
          await updateDoc(nextMatch.ref, {
            awayTeamId: winnerId,
            awayTeamName: winnerName
          });
        }
      } else {
        console.error(`Next round match not found: ${nextRound} match ${nextMatchNumber}`);
      }
    } catch (indexError) {
      console.warn('Index error, falling back to client-side filtering:', indexError);
      
      // Fallback: Get all matches and filter client-side if the index doesn't exist yet
      const q = query(playoffMatchesCollection);
      const matchSnapshot = await getDocs(q);
      
      const allMatches = matchSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ref: doc.ref,
          round: data.round,
          matchNumber: data.matchNumber,
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
          homeTeamName: data.homeTeamName,
          awayTeamName: data.awayTeamName,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          date: data.date,
          location: data.location,
          isCompleted: data.isCompleted
        };
      });
      
      // Filter by round and matchNumber client-side
      const nextMatches = allMatches.filter(
        match => match.round === nextRound && match.matchNumber === nextMatchNumber
      );
      
      if (nextMatches.length > 0) {
        const nextMatch = nextMatches[0];
        
        // Update the appropriate team in the next round
        if (isHomeTeam) {
          await updateDoc(nextMatch.ref, {
            homeTeamId: winnerId,
            homeTeamName: winnerName
          });
        } else {
          await updateDoc(nextMatch.ref, {
            awayTeamId: winnerId,
            awayTeamName: winnerName
          });
        }
      } else {
        console.error(`Next round match not found: ${nextRound} match ${nextMatchNumber}`);
      }
    }
  } catch (error) {
    console.error('Error updating next round match:', error);
    throw error;
  }
}; 