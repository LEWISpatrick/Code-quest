import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get('difficulty');

  try {
    const users = await prisma.user.findMany({
      where: {
        games: {
          some: difficulty ? { difficulty } : {},
        },
      },
      select: {
        id: true,
        name: true,
        image: true,
        highScore: true,
        totalGames: true,
        totalHints: true,
        averageTime: true,
        games: {
          where: difficulty ? { difficulty } : {},
          orderBy: { completedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [
        { highScore: 'desc' },
        { totalGames: 'desc' },
      ],
      take: 100,
    });

    const leaderboardEntries = users.map(user => ({
      id: user.id,
      username: user.name || 'Anonymous Player',
      score: user.highScore,
      challengesCompleted: user.totalGames,
      averageTime: Math.round(user.averageTime),
      hintsUsed: user.totalHints,
      lastPlayed: user.games[0]?.completedAt.toISOString() || new Date().toISOString(),
      difficulty: difficulty || 'All',
    }));

    return NextResponse.json(leaderboardEntries);
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
} 