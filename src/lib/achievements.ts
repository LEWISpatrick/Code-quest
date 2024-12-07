import { prisma } from './prisma';

interface AchievementCondition {
  type: 'score' | 'games' | 'streak' | 'speed' | 'hints' | 'difficulty';
  value: number;
  operator: 'gte' | 'lte' | 'eq';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

interface UserAchievement {
  achievement: {
    name: string;
  };
}

const ACHIEVEMENTS = [
  {
    name: 'First Steps',
    description: 'Complete your first challenge',
    icon: '🎯',
    category: 'Progress',
    condition: JSON.stringify({ 
      type: 'games', 
      value: 1, 
      operator: 'gte' 
    }),
    points: 10,
  },
  {
    name: 'Speed Demon',
    description: 'Complete a challenge in under 60 seconds',
    icon: '⚡',
    category: 'Speed',
    condition: JSON.stringify({
      type: 'speed',
      value: 60,
      operator: 'lte'
    }),
    points: 20,
  },
  {
    name: 'Perfect Score',
    description: 'Get a score of 300 or higher',
    icon: '🏆',
    category: 'Score',
    condition: JSON.stringify({ type: 'score', value: 300, operator: 'gte' }),
    points: 30,
  },
  {
    name: 'No Hints Needed',
    description: 'Complete a Hard challenge without using hints',
    icon: '🧠',
    category: 'Skill',
    condition: JSON.stringify({ type: 'hints', value: 0, operator: 'eq', difficulty: 'Hard' }),
    points: 40,
  },
  {
    name: 'Streak Master',
    description: 'Achieve a streak of 5 or more',
    icon: '🔥',
    category: 'Streak',
    condition: JSON.stringify({ type: 'streak', value: 5, operator: 'gte' }),
    points: 30,
  },
  {
    name: 'Challenge Champion',
    description: 'Complete 10 challenges',
    icon: '👑',
    category: 'Progress',
    condition: JSON.stringify({ type: 'games', value: 10, operator: 'gte' }),
    points: 50,
  },
];

export async function initializeAchievements() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement,
    });
  }
}

export async function checkAchievements(userId: string, gameData: {
  score: number;
  timeSpent: number;
  hintsUsed: number;
  difficulty: string;
  streak: number;
}) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      games: true,
      achievements: {
        include: { achievement: true },
      },
    },
  });

  if (!user) return [];

  const unlockedAchievements = [];
  const existingAchievementNames = new Set(
    user.achievements.map((ua: UserAchievement) => ua.achievement.name)
  );

  for (const achievement of ACHIEVEMENTS) {
    if (existingAchievementNames.has(achievement.name)) continue;

    const condition = JSON.parse(achievement.condition) as AchievementCondition;
    let isUnlocked = false;

    switch (condition.type) {
      case 'score':
        isUnlocked = gameData.score >= condition.value;
        break;
      case 'games':
        isUnlocked = user.games.length >= condition.value;
        break;
      case 'streak':
        isUnlocked = gameData.streak >= condition.value;
        break;
      case 'speed':
        isUnlocked = gameData.timeSpent <= condition.value;
        break;
      case 'hints':
        isUnlocked = gameData.hintsUsed === condition.value &&
          (!condition.difficulty || gameData.difficulty === condition.difficulty);
        break;
    }

    if (isUnlocked) {
      const dbAchievement = await prisma.achievement.findUnique({
        where: { name: achievement.name },
      });

      if (dbAchievement) {
        const userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: dbAchievement.id,
          },
          include: {
            achievement: true,
          },
        });

        unlockedAchievements.push(userAchievement);
      }
    }
  }

  return unlockedAchievements;
}

export async function getUserAchievements(userId: string) {
  return prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: {
      unlockedAt: 'desc',
    },
  });
} 