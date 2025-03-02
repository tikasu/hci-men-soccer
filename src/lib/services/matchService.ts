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
import { Match, Standing, Team } from '../types';
import { getTeamById } from './teamService';
import { getSettings } from './settingsService';

const MATCHES_COLLECTION = 'matches';
const STANDINGS_COLLECTION = 'standings';

// Get all matches
export const getAllMatches = async (): Promise<Match[]> => {
  try {
    const matchesCollection = collection(db, 'matches');
    const q = query(matchesCollection, orderBy('date', 'asc'));
    const matchSnapshot = await getDocs(q);
    
    return matchSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Match));
  } catch (error) {
    console.error('Error getting matches:', error);
    throw error;
  }
};

// Get future matches
export const getFutureMatches = async (): Promise<Match[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const matchesQuery = query(
      collection(db, MATCHES_COLLECTION),
      where('date', '>=', today),
      orderBy('date', 'asc')
    );
    
    const matchesSnapshot = await getDocs(matchesQuery);
    const matches = matchesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Match[];
    
    // Fetch team names for each match
    const matchesWithTeamNames = await Promise.all(
      matches.map(async (match) => {
        const homeTeam = await getTeamById(match.homeTeamId);
        const awayTeam = await getTeamById(match.awayTeamId);
        
        return {
          ...match,
          homeTeamName: homeTeam?.name || 'Unknown Team',
          awayTeamName: awayTeam?.name || 'Unknown Team',
        };
      })
    );
    
    return matchesWithTeamNames;
  } catch (error) {
    console.error('Error getting future matches:', error);
    return [];
  }
};

// Get past matches
export const getPastMatches = async (): Promise<Match[]> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const matchesQuery = query(
      collection(db, MATCHES_COLLECTION),
      where('date', '<', today),
      orderBy('date', 'desc')
    );
    
    const matchesSnapshot = await getDocs(matchesQuery);
    const matches = matchesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Match[];
    
    // Fetch team names for each match
    const matchesWithTeamNames = await Promise.all(
      matches.map(async (match) => {
        const homeTeam = await getTeamById(match.homeTeamId);
        const awayTeam = await getTeamById(match.awayTeamId);
        
        return {
          ...match,
          homeTeamName: homeTeam?.name || 'Unknown Team',
          awayTeamName: awayTeam?.name || 'Unknown Team',
        };
      })
    );
    
    return matchesWithTeamNames;
  } catch (error) {
    console.error('Error getting past matches:', error);
    return [];
  }
};

// Get a match by ID
export const getMatchById = async (matchId: string): Promise<Match | null> => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (matchSnap.exists()) {
      return {
        id: matchSnap.id,
        ...matchSnap.data()
      } as Match;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting match:', error);
    throw error;
  }
};

// Create a new match
export const createMatch = async (matchData: Partial<Match>): Promise<string> => {
  try {
    const matchesCollection = collection(db, 'matches');
    const docRef = await addDoc(matchesCollection, matchData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
};

// Update a match
export const updateMatch = async (matchId: string, matchData: Partial<Match>): Promise<void> => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, matchData);
  } catch (error) {
    console.error('Error updating match:', error);
    throw error;
  }
};

// Delete a match
export const deleteMatch = async (matchId: string): Promise<void> => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await deleteDoc(matchRef);
  } catch (error) {
    console.error('Error deleting match:', error);
    throw error;
  }
};

// Get all standings
export const getAllStandings = async (): Promise<Standing[]> => {
  try {
    // Use the new function that handles manual rankings
    return getAllStandingsWithManualRanking();
  } catch (error) {
    console.error('Error getting standings:', error);
    throw error;
  }
};

// Get standing by team ID
export const getStandingByTeamId = async (teamId: string): Promise<Standing | null> => {
  try {
    const standingsCollection = collection(db, 'standings');
    const q = query(standingsCollection, where('teamId', '==', teamId));
    const standingSnapshot = await getDocs(q);
    
    if (!standingSnapshot.empty) {
      const standingDoc = standingSnapshot.docs[0];
      const standingData = standingDoc.data() as Omit<Standing, 'id'>;
      return {
        teamId: standingData.teamId,
        teamName: standingData.teamName,
        played: standingData.played,
        won: standingData.won,
        drawn: standingData.drawn,
        lost: standingData.lost,
        goalsFor: standingData.goalsFor,
        goalsAgainst: standingData.goalsAgainst,
        points: standingData.points,
        manuallyRanked: standingData.manuallyRanked,
        manualRank: standingData.manualRank,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting standing:', error);
    throw error;
  }
};

// Recalculate standings for a team from scratch
export const recalculateTeamStandings = async (teamId: string): Promise<void> => {
  try {
    // Get all matches for this team
    const matchesCollection = collection(db, 'matches');
    const homeMatchesQuery = query(matchesCollection, where('homeTeamId', '==', teamId));
    const awayMatchesQuery = query(matchesCollection, where('awayTeamId', '==', teamId));
    
    const homeMatchesSnapshot = await getDocs(homeMatchesQuery);
    const awayMatchesSnapshot = await getDocs(awayMatchesQuery);
    
    const homeMatches = homeMatchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Match));
    
    const awayMatches = awayMatchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Match));
    
    // Filter to only completed matches with valid scores
    const completedHomeMatches = homeMatches.filter(match => 
      match.isCompleted && 
      match.homeScore !== undefined && match.homeScore !== null &&
      match.awayScore !== undefined && match.awayScore !== null
    );
    
    const completedAwayMatches = awayMatches.filter(match => 
      match.isCompleted && 
      match.homeScore !== undefined && match.homeScore !== null &&
      match.awayScore !== undefined && match.awayScore !== null
    );
    
    console.log(`Team ${teamId} - Total matches: ${homeMatches.length + awayMatches.length}`);
    console.log(`Team ${teamId} - Completed home matches: ${completedHomeMatches.length}`);
    console.log(`Team ${teamId} - Completed away matches: ${completedAwayMatches.length}`);
    
    // Log all matches for debugging
    console.log('Home matches:', homeMatches.map(m => ({
      id: m.id,
      isCompleted: m.isCompleted,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      date: m.date
    })));
    console.log('Away matches:', awayMatches.map(m => ({
      id: m.id,
      isCompleted: m.isCompleted,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      date: m.date
    })));
    
    // Get team name
    const team = await getTeamById(teamId);
    const teamName = team?.name || 'Unknown Team';
    
    // Get settings for points
    const settings = await getSettings();
    const pointsForWin = settings.pointsForWin;
    const pointsForDraw = settings.pointsForDraw;
    const pointsForLoss = settings.pointsForLoss;
    
    // Create new standing object
    const newStanding: Omit<Standing, 'id'> = {
      teamId,
      teamName,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0
    };
    
    // Calculate home match stats
    for (const match of completedHomeMatches) {
      newStanding.played += 1;
      newStanding.goalsFor += match.homeScore!;
      newStanding.goalsAgainst += match.awayScore!;
      
      console.log(`Processing home match ${match.id}: ${match.homeScore} - ${match.awayScore}`);
      
      if (match.homeScore! > match.awayScore!) {
        console.log(`  Result: WIN (${match.homeScore} > ${match.awayScore})`);
        newStanding.won += 1;
        newStanding.points += pointsForWin;
      } else if (match.homeScore! == match.awayScore!) {
        console.log(`  Result: DRAW (${match.homeScore} == ${match.awayScore})`);
        newStanding.drawn += 1;
        newStanding.points += pointsForDraw;
      } else {
        console.log(`  Result: LOSS (${match.homeScore} < ${match.awayScore})`);
        newStanding.lost += 1;
        newStanding.points += pointsForLoss;
      }
    }
    
    // Calculate away match stats
    for (const match of completedAwayMatches) {
      newStanding.played += 1;
      newStanding.goalsFor += match.awayScore!;
      newStanding.goalsAgainst += match.homeScore!;
      
      console.log(`Processing away match ${match.id}: ${match.homeScore} - ${match.awayScore}`);
      
      if (match.awayScore! > match.homeScore!) {
        console.log(`  Result: WIN (${match.awayScore} > ${match.homeScore})`);
        newStanding.won += 1;
        newStanding.points += pointsForWin;
      } else if (match.awayScore! == match.homeScore!) {
        console.log(`  Result: DRAW (${match.awayScore} == ${match.homeScore})`);
        newStanding.drawn += 1;
        newStanding.points += pointsForDraw;
      } else {
        console.log(`  Result: LOSS (${match.awayScore} < ${match.homeScore})`);
        newStanding.lost += 1;
        newStanding.points += pointsForLoss;
      }
    }
    
    // Update or create standing in database
    const standingsCollection = collection(db, 'standings');
    const q = query(standingsCollection, where('teamId', '==', teamId));
    const standingSnapshot = await getDocs(q);
    
    if (standingSnapshot.empty) {
      // Create new standing
      await addDoc(standingsCollection, newStanding);
    } else {
      // Update existing standing
      const standingDoc = standingSnapshot.docs[0];
      await updateDoc(doc(db, 'standings', standingDoc.id), newStanding);
    }
    
    console.log(`Recalculated standings for team ${teamName}:`, newStanding);
  } catch (error) {
    console.error('Error recalculating team standings:', error);
    throw error;
  }
};

// Update standings after a match
export const updateStandings = async (matchId: string): Promise<void> => {
  try {
    const match = await getMatchById(matchId);
    
    if (!match) {
      console.log('Match not found for standings update');
      return;
    }
    
    // Recalculate standings for both teams from scratch
    await recalculateTeamStandings(match.homeTeamId);
    await recalculateTeamStandings(match.awayTeamId);
    
  } catch (error) {
    console.error('Error updating standings:', error);
    throw error;
  }
};

// Recalculate standings for all teams
export const recalculateAllTeamStandings = async (): Promise<void> => {
  try {
    // Get all teams
    const teamsCollection = collection(db, 'teams');
    const teamsSnapshot = await getDocs(teamsCollection);
    
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Team));
    
    console.log(`Recalculating standings for ${teams.length} teams...`);
    
    // Recalculate standings for each team
    for (const team of teams) {
      await recalculateTeamStandings(team.id);
    }
    
    console.log('All team standings recalculated successfully');
  } catch (error) {
    console.error('Error recalculating all team standings:', error);
    throw error;
  }
};

// Update a team's manual ranking
export const updateTeamManualRanking = async (
  teamId: string, 
  manuallyRanked: boolean, 
  manualRank?: number
): Promise<void> => {
  try {
    // Get the team's current standing
    const standingsCollection = collection(db, 'standings');
    const q = query(standingsCollection, where('teamId', '==', teamId));
    const standingSnapshot = await getDocs(q);
    
    if (standingSnapshot.empty) {
      console.error(`No standing found for team ${teamId}`);
      return;
    }
    
    // Update the standing with manual ranking info
    const standingDoc = standingSnapshot.docs[0];
    await updateDoc(doc(db, 'standings', standingDoc.id), {
      manuallyRanked,
      manualRank: manualRank || null
    });
    
    console.log(`Updated manual ranking for team ${teamId}: manuallyRanked=${manuallyRanked}, manualRank=${manualRank}`);
  } catch (error) {
    console.error('Error updating team manual ranking:', error);
    throw error;
  }
};

// Get all standings with manual ranking applied
export const getAllStandingsWithManualRanking = async (): Promise<Standing[]> => {
  try {
    const standingsCollection = collection(db, 'standings');
    const standingSnapshot = await getDocs(standingsCollection);
    
    // Get all standings
    const standings = standingSnapshot.docs.map(doc => {
      const data = doc.data() as Omit<Standing, 'id'>;
      return {
        teamId: data.teamId,
        teamName: data.teamName,
        played: data.played,
        won: data.won,
        drawn: data.drawn,
        lost: data.lost,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        points: data.points,
        manuallyRanked: data.manuallyRanked,
        manualRank: data.manualRank,
      };
    });
    
    // First, sort by points and goal difference (automatic ranking)
    let sortedStandings = [...standings].sort((a, b) => {
      if (a.points !== b.points) {
        return b.points - a.points;
      }
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
    
    // Then, apply manual rankings if they exist
    const manuallyRankedTeams = sortedStandings.filter(s => s.manuallyRanked);
    const automaticallyRankedTeams = sortedStandings.filter(s => !s.manuallyRanked);
    
    if (manuallyRankedTeams.length > 0) {
      // Sort manually ranked teams by their manual rank
      manuallyRankedTeams.sort((a, b) => (a.manualRank || 0) - (b.manualRank || 0));
      
      // Combine the lists, with manually ranked teams in their specified positions
      const finalStandings: Standing[] = [];
      let autoIndex = 0;
      
      for (let i = 0; i < sortedStandings.length; i++) {
        const manualTeamAtThisRank = manuallyRankedTeams.find(t => t.manualRank === i + 1);
        
        if (manualTeamAtThisRank) {
          finalStandings.push(manualTeamAtThisRank);
        } else if (autoIndex < automaticallyRankedTeams.length) {
          finalStandings.push(automaticallyRankedTeams[autoIndex]);
          autoIndex++;
        }
      }
      
      // Add any remaining teams
      while (autoIndex < automaticallyRankedTeams.length) {
        finalStandings.push(automaticallyRankedTeams[autoIndex]);
        autoIndex++;
      }
      
      return finalStandings;
    }
    
    // If no manual rankings, return the automatically sorted standings
    return sortedStandings;
  } catch (error) {
    console.error('Error getting standings with manual ranking:', error);
    throw error;
  }
}; 