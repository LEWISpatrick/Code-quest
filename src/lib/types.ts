import { CodeChallenge } from './openai';

export type GameState = 'menu' | 'playing' | 'gameOver';

export interface GameStats {
  score: number;
  streak: number;
  level: number;
  timeRemaining: number;
  lives: number;
}

export interface GameContext {
  state: GameState;
  stats: GameStats;
  currentChallenge?: CodeChallenge;
  setState: (state: GameState) => void;
  setStats: (stats: Partial<GameStats>) => void;
  setCurrentChallenge: (challenge: CodeChallenge) => void;
  resetGame: () => void;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  challengesCompleted: number;
  averageTime: number;
  hintsUsed: number;
  lastPlayed: string;
  rank?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
} 