'use client';

import { useState, useEffect } from 'react';
import { useTimer } from 'react-timer-hook';
import { CodeChallenge, generateCodeChallenge } from '@/lib/openai';
import { GameState, GameStats, LeaderboardEntry } from '@/lib/types';
import { ArrowPathIcon, HeartIcon, LightBulbIcon } from '@heroicons/react/24/solid';
import Leaderboard from '@/components/Leaderboard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { initializeAchievements } from '@/lib/achievements';
import { checkAchievements } from '@/lib/achievements';
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import UserMenu from '@/components/UserMenu';
import LoadingSpinner from '@/components/LoadingSpinner';

const INITIAL_STATS: GameStats = {
  score: 0,
  streak: 0,
  level: 1,
  timeRemaining: 180,
  lives: 3,
};

// Temporary mock data for the leaderboard
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: '1',
    username: 'AlgorithmAce',
    score: 2500,
    challengesCompleted: 15,
    averageTime: 120,
    hintsUsed: 5,
    lastPlayed: new Date().toISOString(),
    difficulty: 'Hard'
  },
  {
    id: '2',
    username: 'CodeNinja',
    score: 2200,
    challengesCompleted: 12,
    averageTime: 150,
    hintsUsed: 8,
    lastPlayed: new Date().toISOString(),
    difficulty: 'Medium'
  },
];

type Tab = 'game' | 'leaderboard';

interface HintConfirmation {
  isOpen: boolean;
  hintIndex: number;
  pointsDeduction: number;
}

// Add interface for game data
interface GameData {
  score: number;
  timeSpent: number;
  hintsUsed: number;
  difficulty: string;
  streak: number;
}

// Add this interface
interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// Update the session type
declare module "next-auth" {
  interface Session {
    user?: SessionUser;
  }
}

export default function Home() {
  // 1. First, all useState declarations
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('game');
  const [gameState, setGameState] = useState<GameState>('menu');
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [challenge, setChallenge] = useState<CodeChallenge | null>(null);
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [usedHints, setUsedHints] = useState<Set<number>>(new Set());
  const [showHints, setShowHints] = useState(false);
  const [hintConfirm, setHintConfirm] = useState<HintConfirmation>({
    isOpen: false,
    hintIndex: -1,
    pointsDeduction: 0,
  });
  const [totalHintsUsed, setTotalHintsUsed] = useState(0);

  const { data: session, status } = useSession();
  const { seconds, minutes, start, pause, restart } = useTimer({
    expiryTimestamp: new Date(Date.now() + 180000),
    onExpire: () => handleGameOver(),
    autoStart: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  useEffect(() => {
    fetch('/api/achievements/init', { method: 'POST' })
      .catch(error => console.error('Failed to initialize achievements:', error));
    
    if (session?.user?.id) {
      setUserId(session.user.id);
    }
  }, [session]);

  async function handleGameOver() {
    setGameState('gameOver');
    pause();

    if (!session?.user?.id || !challenge) return;

    try {
      const gameData = {
        score: stats.score,
        hintsUsed: totalHintsUsed,
        timeSpent: 180 - seconds,
        difficulty: 'Easy',
        challengesCount: stats.level
      };

      const response = await fetch('/api/games/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      if (!response.ok) throw new Error('Failed to save game');

      await checkAchievements(session.user.id, {
        score: stats.score,
        timeSpent: 180 - seconds,
        hintsUsed: totalHintsUsed,
        difficulty: 'Easy',
        streak: stats.streak,
      });

    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  async function startGame() {
    setLoading(true);
    try {
      const response = await fetch('/api/challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ level: 1 }),
      });
      
      if (!response.ok) throw new Error('Failed to generate challenge');
      
      const newChallenge = await response.json();
      setChallenge(newChallenge);
      setUserCode(newChallenge.code);
      setGameState('playing');
      setStats(INITIAL_STATS);
      setUsedHints(new Set());
      setTotalHintsUsed(0);
      const time = new Date();
      time.setSeconds(time.getSeconds() + 180);
      restart(time);
    } catch (error) {
      console.error('Failed to start game:', error);
    }
    setLoading(false);
  }

  function handleHintClick(hintIndex: number) {
    if (!challenge || usedHints.has(hintIndex)) return;
    
    const hint = challenge.hints[hintIndex];
    setHintConfirm({
      isOpen: true,
      hintIndex,
      pointsDeduction: hint.pointsDeduction,
    });
  }

  function useHint(hintIndex: number) {
    if (!challenge || usedHints.has(hintIndex)) return;
    
    const hint = challenge.hints[hintIndex];
    const newUsedHints = new Set(usedHints).add(hintIndex);
    setUsedHints(newUsedHints);
    setTotalHintsUsed(prev => prev + 1);
    
    setStats(prev => ({
      ...prev,
      score: Math.max(0, prev.score - hint.pointsDeduction),
    }));
  }

  async function submitSolution() {
    if (!challenge) return;
    
    const isCorrect = userCode.trim() === challenge.solution.trim();
    
    if (isCorrect) {
      setStats(prev => ({
        ...prev,
        score: prev.score + (100 * prev.streak),
        streak: prev.streak + 1,
        level: prev.level + 1,
      }));
      
      if (stats.level >= 3) {
        handleGameOver();
        return;
      }

      try {
        const newChallenge = await generateCodeChallenge(stats.level + 1);
        setChallenge(newChallenge);
        setUserCode(newChallenge.code);
        setUsedHints(new Set());
      } catch (error) {
        console.error('Failed to generate next challenge:', error);
      }
    } else {
      setStats(prev => ({
        ...prev,
        streak: 0,
        lives: prev.lives - 1,
      }));

      if (stats.lives <= 1) {
        handleGameOver();
      }
    }
  }

  // 4. Loading states
  if (status === "loading" || !session || !userId) {
    return <LoadingSpinner />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <UserMenu />
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('game')}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === 'game'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Game
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={hintConfirm.isOpen}
        onClose={() => setHintConfirm(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => useHint(hintConfirm.hintIndex)}
        title="Use Hint?"
        message={`Using this hint will deduct ${hintConfirm.pointsDeduction} points from your score. Are you sure?`}
        confirmText="Use Hint"
      />

      {activeTab === 'game' ? (
        <>
          {gameState === 'menu' && (
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-8 text-blue-500">CodeQuest</h1>
              <p className="text-xl mb-8">Debug the World</p>
              <button
                onClick={startGame}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
              >
                {loading ? 'Loading...' : 'Start Game'}
              </button>
            </div>
          )}

          {gameState === 'playing' && challenge && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl font-bold">Score: {stats.score}</div>
                  <div className="text-yellow-500">Streak: {stats.streak}x</div>
                  <div className="flex items-center">
                    {[...Array(stats.lives)].map((_, i) => (
                      <HeartIcon key={i} className="h-6 w-6 text-red-500" />
                    ))}
                  </div>
                </div>
                <div className="text-2xl font-mono">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Level {stats.level} Challenge</h2>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                      showHints ? 'bg-yellow-500 text-gray-900' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <LightBulbIcon className="h-5 w-5" />
                    <span>Hints</span>
                  </button>
                </div>

                <h3 className="text-lg font-medium mb-4">{challenge.title}</h3>
                <p className="text-gray-300 mb-4">{challenge.explanation}</p>

                {showHints && (
                  <div className="mb-4 bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-lg font-medium mb-2 text-yellow-500">Available Hints</h4>
                    <div className="space-y-2">
                      {challenge.hints.map((hint, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            {usedHints.has(index) ? (
                              <p className="text-gray-300">{hint.text}</p>
                            ) : (
                              <p className="text-gray-500">Hint {index + 1}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleHintClick(index)}
                            disabled={usedHints.has(index)}
                            className={`ml-4 px-3 py-1 rounded-lg text-sm transition-colors ${
                              usedHints.has(index)
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                            }`}
                          >
                            {usedHints.has(index) ? 'Used' : `-${hint.pointsDeduction} points`}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <textarea
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value)}
                  className="w-full h-64 bg-gray-900 text-white p-4 font-mono rounded-lg mb-4"
                />

                <div className="flex justify-between">
                  <button
                    onClick={submitSolution}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Submit Solution
                  </button>
                  <button
                    onClick={() => setUserCode(challenge.code)}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Reset Code
                  </button>
                </div>
              </div>
            </div>
          )}

          {gameState === 'gameOver' && (
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
              <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 mb-8">
                <p className="text-2xl font-bold text-blue-400 mb-4">Final Score: {stats.score}</p>
                <div className="space-y-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Challenges Completed:</span>
                    <span className="font-medium">{stats.level - 1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Highest Streak:</span>
                    <span className="font-medium">{stats.streak}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Hints Used:</span>
                    <span className="font-medium">{totalHintsUsed}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={startGame}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </>
      ) : (
        <Leaderboard />
      )}
    </main>
  );
}
