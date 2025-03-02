import { collection, getDocs, doc, getDoc, addDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AIInsight } from '../types';

// Get all insights
export const getAllInsights = async (): Promise<AIInsight[]> => {
  try {
    const insightsCollection = collection(db, 'insights');
    const q = query(insightsCollection, orderBy('createdAt', 'desc'));
    const insightSnapshot = await getDocs(q);
    
    return insightSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AIInsight));
  } catch (error) {
    console.error('Error getting insights:', error);
    throw error;
  }
};

// Get insights by type and related ID
export const getInsightsByTypeAndId = async (type: 'team' | 'player' | 'match', relatedId: string): Promise<AIInsight[]> => {
  try {
    const insightsCollection = collection(db, 'insights');
    const q = query(
      insightsCollection, 
      where('type', '==', type),
      where('relatedId', '==', relatedId),
      orderBy('createdAt', 'desc')
    );
    const insightSnapshot = await getDocs(q);
    
    return insightSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AIInsight));
  } catch (error) {
    console.error('Error getting insights:', error);
    throw error;
  }
};

// Delete an insight
export const deleteInsight = async (insightId: string): Promise<void> => {
  try {
    const insightRef = doc(db, 'insights', insightId);
    await deleteDoc(insightRef);
  } catch (error) {
    console.error('Error deleting insight:', error);
    throw error;
  }
};

// Generate a new insight
export const generateInsight = async (type: 'team' | 'player' | 'match', relatedId: string): Promise<AIInsight> => {
  try {
    // In a real application, this would call an AI service to generate the insight
    // For now, we'll just create a placeholder insight
    let content = '';
    
    if (type === 'team') {
      content = 'This team has shown strong performance in recent matches, with improved defensive coordination and effective counter-attacks.';
    } else if (type === 'player') {
      content = 'This player has demonstrated consistent improvement in their passing accuracy and positioning, contributing significantly to team success.';
    } else {
      content = 'This match showcased excellent tactical adjustments from both sides, with the winning team capitalizing on set piece opportunities.';
    }
    
    const insightData = {
      type,
      relatedId,
      content,
      createdAt: new Date().toISOString()
    };
    
    const insightsCollection = collection(db, 'insights');
    const docRef = await addDoc(insightsCollection, insightData);
    
    return {
      id: docRef.id,
      ...insightData
    };
  } catch (error) {
    console.error('Error generating insight:', error);
    throw error;
  }
}; 