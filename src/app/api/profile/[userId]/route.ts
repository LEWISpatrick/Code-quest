import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession();
  const userId = params.userId;

  try {
    // Get user data with relationships
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: {
            unlockedAt: 'desc',
          },
        },
        games: {
          orderBy: {
            completedAt: 'desc',
          },
          take: 10,
        },
        posts: {
          include: {
            game: true,
            likes: true,
            comments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        followers: true,
        following: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the current user is following this profile
    const isFollowing = session?.user ? await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: userId,
        },
      },
    }) : null;

    // Format the response
    const response = {
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.bio,
      createdAt: user.createdAt,
      stats: {
        totalGames: user.totalGames,
        highScore: user.highScore,
        averageTime: user.averageTime,
        totalHints: user.totalHints,
      },
      achievements: user.achievements.map(ua => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        unlockedAt: ua.unlockedAt,
      })),
      followers: user.followers.length,
      following: user.following.length,
      isFollowing: !!isFollowing,
      recentGames: user.games.map(game => ({
        id: game.id,
        score: game.score,
        difficulty: game.difficulty,
        completedAt: game.completedAt,
        challengesCount: game.challengesCount,
        hintsUsed: game.hintsUsed,
      })),
      posts: user.posts.map(post => ({
        id: post.id,
        content: post.content,
        createdAt: post.createdAt,
        likes: post.likes.length,
        comments: post.comments.length,
        game: {
          id: post.game.id,
          score: post.game.score,
          difficulty: post.game.difficulty,
        },
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
} 