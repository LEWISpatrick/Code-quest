import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

interface GameData {
  score: number;
  hintsUsed: number;
  timeSpent: number;
  difficulty: string;
  challengesCount: number;
}

interface AggregateResult {
  _max: {
    score: number | null;
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const gameData: GameData = await request.json();

    // Save the game
    const game = await prisma.game.create({
      data: {
        userId: session.user.id,
        ...gameData
      },
    });

    // Update user stats
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        highScore: {
          set: await prisma.game.aggregate({
            where: { userId: session.user.id },
            _max: { score: true }
          }).then((result: AggregateResult) => result._max.score || 0)
        },
        totalGames: {
          increment: 1,
        },
        totalHints: {
          increment: gameData.hintsUsed,
        },
        averageTime: {
          set: await prisma.game.aggregate({
            where: { userId: session.user.id },
            _avg: { timeSpent: true }
          }).then(result => result._avg.timeSpent || 0)
        },
      },
    });

    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Failed to save game:', error);
    return NextResponse.json(
      { error: 'Failed to save game' },
      { status: 500 }
    );
  }
} 