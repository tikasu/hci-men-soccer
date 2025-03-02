import OpenAI from 'openai';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AIInsight, Team, Player, Match } from '../types';
import { getTeamById } from './teamService';
import { getPlayersByTeamId } from './teamService';
import { getMatchById } from './matchService';
import { getSettings } from './settingsService';

const INSIGHTS_COLLECTION = 'insights';

// Check if OpenAI API key is available
const hasApiKey = !!process.env.OPENAI_API_KEY;

// Initialize OpenAI client only if API key is available
const openai = hasApiKey 
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null;

// Helper function to create a fallback insight when OpenAI is not available
const createFallbackInsight = (type: 'team' | 'player' | 'match', relatedId: string, message: string): Omit<AIInsight, 'id'> => {
  return {
    content: message,
    type,
    relatedId,
    createdAt: new Date().toISOString(),
  };
};

// Helper function to check if AI insights are enabled
const checkAIInsightsEnabled = async (): Promise<boolean> => {
  try {
    const settings = await getSettings();
    return settings.enableAIInsights;
  } catch (error) {
    console.error('Error checking if AI insights are enabled:', error);
    return false;
  }
};

// Generate team insight
export const generateTeamInsight = async (teamId: string): Promise<AIInsight | null> => {
  try {
    // Check if AI insights are enabled in settings
    const isEnabled = await checkAIInsightsEnabled();
    if (!isEnabled) {
      const fallbackInsight = createFallbackInsight(
        'team', 
        teamId, 
        "AI insights are currently disabled in the system settings."
      );
      const docRef = await addDoc(collection(db, INSIGHTS_COLLECTION), fallbackInsight);
      return {
        id: docRef.id,
        ...fallbackInsight,
      };
    }

    const team = await getTeamById(teamId);
    
    if (!team) {
      return null;
    }
    
    // If OpenAI is not available, return a fallback insight
    if (!openai) {
      const fallbackInsight = createFallbackInsight(
        'team', 
        teamId, 
        "AI insights are not available. Please add an OpenAI API key to your environment variables."
      );
      const docRef = await addDoc(collection(db, INSIGHTS_COLLECTION), fallbackInsight);
      return {
        id: docRef.id,
        ...fallbackInsight,
      };
    }
    
    const players = await getPlayersByTeamId(teamId);
    
    // Create a prompt for the AI
    const prompt = `Generate a brief, insightful analysis of the soccer team "${team.name}" based on the following player information:
    
    ${players.map(player => `- ${player.name} (${player.position}): ${player.stats.goals} goals, ${player.stats.assists} assists, ${player.stats.gamesPlayed} games played`).join('\n')}
    
    Focus on team strengths, areas for improvement, and any notable player performances. Keep it concise (2-3 sentences).`;
    
    // Generate insight using OpenAI
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });
    
    const content = completion.choices[0]?.message?.content || 'No insight available.';
    
    // Save insight to Firestore
    const insight: Omit<AIInsight, 'id'> = {
      content,
      type: 'team',
      relatedId: teamId,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, INSIGHTS_COLLECTION), insight);
    
    return {
      id: docRef.id,
      ...insight,
    };
  } catch (error) {
    console.error('Error generating team insight:', error);
    return null;
  }
};

// Generate player insight
export const generatePlayerInsight = async (playerId: string, teamId: string): Promise<AIInsight | null> => {
  try {
    // Check if AI insights are enabled in settings
    const isEnabled = await checkAIInsightsEnabled();
    if (!isEnabled) {
      const fallbackInsight = createFallbackInsight(
        'player', 
        playerId, 
        "AI insights are currently disabled in the system settings."
      );
      const docRef = await addDoc(collection(db, INSIGHTS_COLLECTION), fallbackInsight);
      return {
        id: docRef.id,
        ...fallbackInsight,
      };
    }

    const players = await getPlayersByTeamId(teamId);
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      return null;
    }
    
    // If OpenAI is not available, return a fallback insight
    if (!openai) {
      const fallbackInsight = createFallbackInsight(
        'player', 
        playerId, 
        "AI insights are not available. Please add an OpenAI API key to your environment variables."
      );
      const docRef = await addDoc(collection(db, INSIGHTS_COLLECTION), fallbackInsight);
      return {
        id: docRef.id,
        ...fallbackInsight,
      };
    }
    
    const team = await getTeamById(teamId);
    
    // Create a prompt for the AI
    const prompt = `Generate a brief, insightful analysis of the soccer player "${player.name}" who plays as a ${player.position} for ${team?.name || 'their team'} based on the following stats:
    
    - Goals: ${player.stats.goals}
    - Assists: ${player.stats.assists}
    - Yellow Cards: ${player.stats.yellowCards}
    - Red Cards: ${player.stats.redCards}
    - Games Played: ${player.stats.gamesPlayed}
    
    Focus on the player's strengths, areas for improvement, and contribution to the team. Keep it concise (2-3 sentences).`;
    
    // Generate insight using OpenAI
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });
    
    const content = completion.choices[0]?.message?.content || 'No insight available.';
    
    // Save insight to Firestore
    const insight: Omit<AIInsight, 'id'> = {
      content,
      type: 'player',
      relatedId: playerId,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, INSIGHTS_COLLECTION), insight);
    
    return {
      id: docRef.id,
      ...insight,
    };
  } catch (error) {
    console.error('Error generating player insight:', error);
    return null;
  }
};

// Generate match insight
export const generateMatchInsight = async (matchId: string): Promise<AIInsight | null> => {
  try {
    // Check if AI insights are enabled in settings
    const isEnabled = await checkAIInsightsEnabled();
    if (!isEnabled) {
      const fallbackInsight = createFallbackInsight(
        'match', 
        matchId, 
        "AI insights are currently disabled in the system settings."
      );
      const docRef = await addDoc(collection(db, INSIGHTS_COLLECTION), fallbackInsight);
      return {
        id: docRef.id,
        ...fallbackInsight,
      };
    }

    const match = await getMatchById(matchId);
    
    if (!match || !match.isCompleted) {
      return null;
    }
    
    // If OpenAI is not available, return a fallback insight
    if (!openai) {
      const fallbackInsight = createFallbackInsight(
        'match', 
        matchId, 
        "AI insights are not available. Please add an OpenAI API key to your environment variables."
      );
      const docRef = await addDoc(collection(db, INSIGHTS_COLLECTION), fallbackInsight);
      return {
        id: docRef.id,
        ...fallbackInsight,
      };
    }
    
    // Create a prompt for the AI
    const prompt = `Generate a brief, insightful match summary for the soccer game between ${match.homeTeamName} and ${match.awayTeamName} that ended with a score of ${match.homeScore}-${match.awayScore}.
    
    The match was played at ${match.location} on ${match.date}.
    
    Focus on key moments, team performances, and the significance of the result. Keep it concise (3-4 sentences).`;
    
    // Generate insight using OpenAI
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });
    
    const content = completion.choices[0]?.message?.content || 'No insight available.';
    
    // Save insight to Firestore
    const insight: Omit<AIInsight, 'id'> = {
      content,
      type: 'match',
      relatedId: matchId,
      createdAt: new Date().toISOString(),
    };
    
    const docRef = await addDoc(collection(db, INSIGHTS_COLLECTION), insight);
    
    return {
      id: docRef.id,
      ...insight,
    };
  } catch (error) {
    console.error('Error generating match insight:', error);
    return null;
  }
};

// Get insights by type and related ID
export const getInsightsByTypeAndId = async (type: 'team' | 'player' | 'match', relatedId: string): Promise<AIInsight[]> => {
  try {
    const insightsQuery = query(
      collection(db, INSIGHTS_COLLECTION),
      where('type', '==', type),
      where('relatedId', '==', relatedId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const insightsSnapshot = await getDocs(insightsQuery);
    
    return insightsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AIInsight[];
  } catch (error) {
    console.error('Error getting insights:', error);
    return [];
  }
};

// Get latest insights
export const getLatestInsights = async (limit: number = 5): Promise<AIInsight[]> => {
  try {
    const insightsQuery = query(
      collection(db, INSIGHTS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit
    );
    
    const insightsSnapshot = await getDocs(insightsQuery);
    
    return insightsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AIInsight[];
  } catch (error) {
    console.error('Error getting latest insights:', error);
    return [];
  }
}; 