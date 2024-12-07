import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { score, challengesCount, hintsUsed, timeSpent, difficulty } = await request.json();

    // Save game result
    const game = await prisma.game.create({
      data: {
        userId: session.user.id,
        score,
        challengesCount,
        hintsUsed,
        timeSpent,
        difficulty,
      },
    });

    // Update user stats
    const userGames = await prisma.game.findMany({
      where: { userId: session.user.id },
    });

    const totalGames = userGames.length;
    const highScore = Math.max(...userGames.map(g => g.score));
    const totalHints = userGames.reduce((sum, g) => sum + g.hintsUsed, 0);
    const averageTime = userGames.reduce((sum, g) => sum + g.timeSpent, 0) / totalGames;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        highScore,
        totalGames,
        totalHints,
        averageTime,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error('Failed to save game:', error);
    return NextResponse.json(
      { error: 'Failed to save game' },
      { status: 500 }
    );
  }
} 