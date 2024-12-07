import { initializeAchievements } from '@/lib/achievements'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    await initializeAchievements()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to initialize achievements:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
} 