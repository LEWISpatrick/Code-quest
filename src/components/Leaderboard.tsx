'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { LeaderboardEntry } from '@/lib/types';

export default function Leaderboard() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
    
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setEntries(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load leaderboard:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading leaderboard...</div>;

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <div key={entry.id} className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">{entry.username}</h3>
              <p className="text-gray-400">Score: {entry.score}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Games: {entry.challengesCompleted}</p>
              <p className="text-sm text-gray-400">Avg Time: {entry.averageTime}s</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 