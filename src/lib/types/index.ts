export interface Player {
  id: string;
  name: string;
  position: string;
  number?: string;
  teamId: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  gamesPlayed: number;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  description?: string;
}

export interface Match {
  id: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  location: string;
  isCompleted: boolean;
  playerStats?: {
    goalScorers?: { playerId: string; count: number }[];
    assistProviders?: { playerId: string; count: number }[];
  };
}

export interface Standing {
  teamId: string;
  teamName?: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  manuallyRanked?: boolean;
  manualRank?: number;
  season?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  displayName?: string;
  photoURL?: string;
  active: boolean;
}

export interface AIInsight {
  id: string;
  content: string;
  type: 'team' | 'player' | 'match';
  relatedId: string;
  createdAt: string;
}

export interface Settings {
  leagueName: string;
  currentSeason: string;
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;
  enableAIInsights: boolean;
  maxAdminUsers: number;
  signupEnabled: boolean;
  adminSecretCode: string;
}

export interface PlayoffMatch {
  id: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  location: string;
  isCompleted: boolean;
  round: 'quarterfinal' | 'semifinal' | 'final';
  matchNumber: number; // 1-4 for quarterfinals, 1-2 for semifinals, 1 for final
} 