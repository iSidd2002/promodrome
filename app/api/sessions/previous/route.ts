import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find the most recent completed pomodoro session
    const previousSession = await prisma.pomodoroSession.findFirst({
      where: {
        userId: session.user.id,
        sessionType: 'POMODORO',
        completed: true,
      },
      orderBy: {
        endTime: 'desc'
      }
    })

    if (!previousSession) {
      return NextResponse.json({ error: 'No previous session found' }, { status: 404 })
    }

    return NextResponse.json(previousSession)
  } catch (error) {
    console.error('Previous session fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
