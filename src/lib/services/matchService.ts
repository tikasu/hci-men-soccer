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
export const getAllStandings = async (season?: string): Promise<Standing[]> => {
  try {
    // Use the new function that handles manual rankings with optional season filtering
    return getAllStandingsWithManualRanking(season);
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
    const currentSeason = settings.currentSeason;
    
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
      points: 0,
      season: currentSeason
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
export const getAllStandingsWithManualRanking = async (season?: string): Promise<Standing[]> => {
  try {
    const standingsCollection = collection(db, 'standings');
    
    // Create query based on whether a season filter is provided
    let standingsQuery;
    if (season) {
      standingsQuery = query(standingsCollection, where('season', '==', season));
    } else {
      // If no season is provided, get the current season from settings
      const settings = await getSettings();
      const currentSeason = settings.currentSeason;
      standingsQuery = query(standingsCollection, where('season', '==', currentSeason));
    }
    
    const standingSnapshot = await getDocs(standingsQuery);
    
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
        season: data.season,
      };
    });
    
    // Get all matches for head-to-head comparison
    const matchesCollection = collection(db, MATCHES_COLLECTION);
    const matchesQuery = query(matchesCollection, where('isCompleted', '==', true));
    const matchesSnapshot = await getDocs(matchesQuery);
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Match));
    
    // First, sort by points (primary ranking factor)
    let sortedStandings = [...standings].sort((a, b) => {
      return b.points - a.points;
    });
    
    // Group teams with the same number of points
    const pointGroups: Record<number, Standing[]> = {};
    sortedStandings.forEach(standing => {
      if (!pointGroups[standing.points]) {
        pointGroups[standing.points] = [];
      }
      pointGroups[standing.points].push(standing);
    });
    
    // For each group of teams with the same points, apply tiebreakers
    const finalStandings: Standing[] = [];
    
    // Process each point group
    Object.values(pointGroups).forEach(group => {
      if (group.length === 1) {
        // No tiebreaker needed for a single team
        finalStandings.push(group[0]);
      } else {
        // Apply tiebreakers for groups with multiple teams
        const resolvedGroup = resolveGroupTiebreakers(group, matches);
        finalStandings.push(...resolvedGroup);
      }
    });
    
    // Sort the final standings by points (descending)
    finalStandings.sort((a, b) => b.points - a.points);
    
    // Then, apply manual rankings if they exist
    const manuallyRankedTeams = finalStandings.filter(s => s.manuallyRanked);
    const automaticallyRankedTeams = finalStandings.filter(s => !s.manuallyRanked);
    
    if (manuallyRankedTeams.length > 0) {
      // Sort manually ranked teams by their manual rank
      manuallyRankedTeams.sort((a, b) => (a.manualRank || 0) - (b.manualRank || 0));
      
      // Combine the lists, with manually ranked teams in their specified positions
      const manualFinalStandings: Standing[] = [];
      let autoIndex = 0;
      
      for (let i = 0; i < finalStandings.length; i++) {
        const manualTeamAtThisRank = manuallyRankedTeams.find(t => t.manualRank === i + 1);
        
        if (manualTeamAtThisRank) {
          manualFinalStandings.push(manualTeamAtThisRank);
        } else if (autoIndex < automaticallyRankedTeams.length) {
          manualFinalStandings.push(automaticallyRankedTeams[autoIndex]);
          autoIndex++;
        }
      }
      
      // Add any remaining teams
      while (autoIndex < automaticallyRankedTeams.length) {
        manualFinalStandings.push(automaticallyRankedTeams[autoIndex]);
        autoIndex++;
      }
      
      return manualFinalStandings;
    }
    
    // If no manual rankings, return the automatically sorted standings
    return finalStandings;
  } catch (error) {
    console.error('Error getting standings with manual ranking:', error);
    throw error;
  }
};

// Helper function to resolve tiebreakers within a group of teams with the same points
const resolveGroupTiebreakers = (group: Standing[], matches: Match[]): Standing[] => {
  if (group.length <= 1) {
    return group;
  }
  
  // Create a map of head-to-head results
  const h2hResults: Record<string, Record<string, { played: number, won: number, drawn: number, lost: number, goalsFor: number, goalsAgainst: number, points: number }>> = {};
  
  // Initialize the h2h results map
  group.forEach(team => {
    h2hResults[team.teamId] = {};
    group.forEach(opponent => {
      if (team.teamId !== opponent.teamId) {
        h2hResults[team.teamId][opponent.teamId] = {
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          points: 0
        };
      }
    });
  });
  
  // Calculate head-to-head results
  matches.forEach(match => {
    const homeTeamId = match.homeTeamId;
    const awayTeamId = match.awayTeamId;
    
    // Check if both teams are in the group
    if (
      group.some(team => team.teamId === homeTeamId) && 
      group.some(team => team.teamId === awayTeamId)
    ) {
      // Update home team's h2h record
      if (h2hResults[homeTeamId] && h2hResults[homeTeamId][awayTeamId]) {
        h2hResults[homeTeamId][awayTeamId].played += 1;
        h2hResults[homeTeamId][awayTeamId].goalsFor += match.homeScore || 0;
        h2hResults[homeTeamId][awayTeamId].goalsAgainst += match.awayScore || 0;
        
        if (match.homeScore! > match.awayScore!) {
          h2hResults[homeTeamId][awayTeamId].won += 1;
          h2hResults[homeTeamId][awayTeamId].points += 3; // Assuming 3 points for a win
        } else if (match.homeScore === match.awayScore) {
          h2hResults[homeTeamId][awayTeamId].drawn += 1;
          h2hResults[homeTeamId][awayTeamId].points += 1; // Assuming 1 point for a draw
        } else {
          h2hResults[homeTeamId][awayTeamId].lost += 1;
        }
      }
      
      // Update away team's h2h record
      if (h2hResults[awayTeamId] && h2hResults[awayTeamId][homeTeamId]) {
        h2hResults[awayTeamId][homeTeamId].played += 1;
        h2hResults[awayTeamId][homeTeamId].goalsFor += match.awayScore || 0;
        h2hResults[awayTeamId][homeTeamId].goalsAgainst += match.homeScore || 0;
        
        if (match.awayScore! > match.homeScore!) {
          h2hResults[awayTeamId][homeTeamId].won += 1;
          h2hResults[awayTeamId][homeTeamId].points += 3; // Assuming 3 points for a win
        } else if (match.awayScore === match.homeScore) {
          h2hResults[awayTeamId][homeTeamId].drawn += 1;
          h2hResults[awayTeamId][homeTeamId].points += 1; // Assuming 1 point for a draw
        } else {
          h2hResults[awayTeamId][homeTeamId].lost += 1;
        }
      }
    }
  });
  
  // Calculate total h2h points and goal difference for each team
  const h2hStats: Record<string, { points: number, goalDiff: number }> = {};
  
  group.forEach(team => {
    h2hStats[team.teamId] = {
      points: 0,
      goalDiff: 0
    };
    
    Object.keys(h2hResults[team.teamId]).forEach(opponentId => {
      const result = h2hResults[team.teamId][opponentId];
      h2hStats[team.teamId].points += result.points;
      h2hStats[team.teamId].goalDiff += (result.goalsFor - result.goalsAgainst);
    });
  });
  
  // Sort the group by h2h points, then h2h goal difference, then overall goal difference
  const sortedGroup = [...group].sort((a, b) => {
    // First tiebreaker: Head-to-head points
    const h2hPointsDiff = h2hStats[b.teamId].points - h2hStats[a.teamId].points;
    if (h2hPointsDiff !== 0) {
      return h2hPointsDiff;
    }
    
    // Second tiebreaker: Head-to-head goal difference
    const h2hGoalDiff = h2hStats[b.teamId].goalDiff - h2hStats[a.teamId].goalDiff;
    if (h2hGoalDiff !== 0) {
      return h2hGoalDiff;
    }
    
    // Third tiebreaker: Overall goal difference
    return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
  });
  
  // Handle circular head-to-head situations
  // If teams are still tied after all tiebreakers, we need to check for circular results
  // This is a simplified approach - for complex circular situations, more sophisticated algorithms might be needed
  const finalSortedGroup = handleCircularH2H(sortedGroup, h2hResults, h2hStats);
  
  return finalSortedGroup;
};

// Helper function to handle circular head-to-head situations
const handleCircularH2H = (
  sortedGroup: Standing[], 
  h2hResults: Record<string, Record<string, any>>,
  h2hStats: Record<string, { points: number, goalDiff: number }>
): Standing[] => {
  // Find groups of teams that are still tied after all tiebreakers
  const tiedGroups: Standing[][] = [];
  let currentTiedGroup: Standing[] = [sortedGroup[0]];
  
  for (let i = 1; i < sortedGroup.length; i++) {
    const prevTeam = sortedGroup[i - 1];
    const currentTeam = sortedGroup[i];
    
    // Check if teams are tied on all tiebreakers
    if (
      h2hStats[prevTeam.teamId].points === h2hStats[currentTeam.teamId].points &&
      h2hStats[prevTeam.teamId].goalDiff === h2hStats[currentTeam.teamId].goalDiff &&
      (prevTeam.goalsFor - prevTeam.goalsAgainst) === (currentTeam.goalsFor - currentTeam.goalsAgainst)
    ) {
      currentTiedGroup.push(currentTeam);
    } else {
      if (currentTiedGroup.length > 1) {
        tiedGroups.push([...currentTiedGroup]);
      }
      currentTiedGroup = [currentTeam];
    }
  }
  
  // Add the last tied group if it exists
  if (currentTiedGroup.length > 1) {
    tiedGroups.push(currentTiedGroup);
  }
  
  // If there are no tied groups, return the original sorted group
  if (tiedGroups.length === 0) {
    return sortedGroup;
  }
  
  // For each tied group, try to resolve circular situations
  const finalGroup = [...sortedGroup];
  
  tiedGroups.forEach(tiedGroup => {
    // For circular situations, we'll use overall goal difference as the final tiebreaker
    const resolvedTiedGroup = [...tiedGroup].sort((a, b) => {
      return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });
    
    // Replace the tied teams in the final group with the resolved order
    const startIndex = finalGroup.findIndex(team => team.teamId === tiedGroup[0].teamId);
    if (startIndex >= 0) {
      for (let i = 0; i < resolvedTiedGroup.length; i++) {
        finalGroup[startIndex + i] = resolvedTiedGroup[i];
      }
    }
  });
  
  return finalGroup;
};

// Update all existing standings with the current season
export const updateAllStandingsWithCurrentSeason = async (): Promise<void> => {
  try {
    // Get the current season from settings
    const settings = await getSettings();
    const currentSeason = settings.currentSeason;
    
    // Get all standings
    const standingsCollection = collection(db, 'standings');
    const standingSnapshot = await getDocs(standingsCollection);
    
    // Update each standing with the current season
    const updatePromises = standingSnapshot.docs.map(async (doc) => {
      const standingRef = doc.ref;
      await updateDoc(standingRef, { season: currentSeason });
      console.log(`Updated standing ${doc.id} with season ${currentSeason}`);
    });
    
    await Promise.all(updatePromises);
    console.log(`All standings updated with season ${currentSeason}`);
  } catch (error) {
    console.error('Error updating standings with current season:', error);
    throw error;
  }
}; 