'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  TrophyIcon, 
  ClockIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  ShareIcon,
  HeartIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/solid';

interface ProfileStats {
  totalGames: number;
  highScore: number;
  averageTime: number;
  totalHints: number;
  achievements: Achievement[];
  followers: number;
  following: number;
  recentGames: Game[];
  posts: Post[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

interface Game {
  id: string;
  score: number;
  difficulty: string;
  completedAt: string;
  challengesCount: number;
  hintsUsed: number;
}

interface Post {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
  game: Game;
}

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'games' | 'posts'>('achievements');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [params.userId]);

  async function fetchProfileData() {
    try {
      const response = await fetch(`/api/profile/${params.userId}`);
      const data = await response.json();
      setStats(data);
      setIsFollowing(data.isFollowing);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFollow() {
    if (!session) return;
    try {
      const response = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: params.userId }),
      });
      if (response.ok) {
        setIsFollowing(!isFollowing);
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-gray-400">This user profile does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Image
                src={session?.user?.image || '/default-avatar.png'}
                alt="Profile"
                width={120}
                height={120}
                className="rounded-full"
              />
              <div className="absolute -bottom-2 -right-2 bg-blue-500 rounded-full p-2">
                <TrophyIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{session?.user?.name}</h1>
              <p className="text-gray-400 mt-1">Joined {new Date(stats.createdAt).toLocaleDateString()}</p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="text-sm">
                  <span className="text-gray-400">Followers</span>
                  <p className="font-bold">{stats.followers}</p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Following</span>
                  <p className="font-bold">{stats.following}</p>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Games</span>
                  <p className="font-bold">{stats.totalGames}</p>
                </div>
              </div>
            </div>
          </div>
          {session?.user?.id !== params.userId && (
            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isFollowing
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">High Score</p>
              <p className="text-2xl font-bold">{stats.highScore}</p>
            </div>
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Avg Time</p>
              <p className="text-2xl font-bold">{Math.round(stats.averageTime)}s</p>
            </div>
            <ClockIcon className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Total Games</p>
              <p className="text-2xl font-bold">{stats.totalGames}</p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400">Hints Used</p>
              <p className="text-2xl font-bold">{stats.totalHints}</p>
            </div>
            <TrophyIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg">
          {(['achievements', 'games', 'posts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid gap-4">
        {activeTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.achievements.map((achievement) => (
              <div key={achievement.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div>
                    <h3 className="font-bold">{achievement.name}</h3>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'games' && (
          <div className="space-y-4">
            {stats.recentGames.map((game) => (
              <div key={game.id} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{game.score}</span>
                      <span className="text-sm text-gray-400">points</span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {game.difficulty} • {game.challengesCount} challenges
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(game.completedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-4">
            {stats.posts.map((post) => (
              <div key={post.id} className="bg-gray-800 rounded-lg p-6">
                <p className="text-gray-300 mb-4">{post.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <HeartIcon className="w-5 h-5 text-red-500 mr-1" />
                      {post.likes}
                    </div>
                    <div className="flex items-center">
                      <ChatBubbleLeftIcon className="w-5 h-5 text-blue-500 mr-1" />
                      {post.comments}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <ShareIcon className="w-5 h-5 text-gray-500 mr-1" />
                    Share
                  </div>
                </div>
                <div className="mt-4 p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold">{post.game.score}</span>
                      <span className="text-gray-400 ml-1">points</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {post.game.difficulty} Challenge
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 