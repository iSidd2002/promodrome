import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const daysParam = searchParams.get('days') || '7'; // Default to 7 days
    
    const days = parseInt(daysParam);
    const endDate = dateParam ? new Date(dateParam) : new Date();
    
    // Set to end of day
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // Fetch sessions for the date range
    const sessions = await prisma.pomodoroSession.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Group sessions by date and calculate statistics
    const dailyStats = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      });
      
      const pomodoroSessions = daySessions.filter(s => s.sessionType === 'POMODORO');
      const completedPomodoros = pomodoroSessions.filter(s => s.completed);
      const attemptedPomodoros = pomodoroSessions.length;

      // Calculate total focus time (only completed pomodoro sessions)
      const totalFocusMinutes = completedPomodoros.reduce((total, session) => {
        return total + Math.floor((session.actualDuration || session.plannedDuration) / 60);
      }, 0);
      
      const completionRate = attemptedPomodoros > 0 
        ? Math.round((completedPomodoros.length / attemptedPomodoros) * 100)
        : 0;
      
      dailyStats.push({
        date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
        formattedDate: currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        shortDate: currentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        attempted: attemptedPomodoros,
        completed: completedPomodoros.length,
        totalFocusMinutes,
        totalFocusTime: {
          hours: Math.floor(totalFocusMinutes / 60),
          minutes: totalFocusMinutes % 60,
          formatted: `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`
        },
        completionRate,
        allSessions: daySessions.length,
        completedSessions: daySessions.filter(s => s.completed).length,
      });
    }

    // Calculate summary statistics
    const totalAttempted = dailyStats.reduce((sum, day) => sum + day.attempted, 0);
    const totalCompleted = dailyStats.reduce((sum, day) => sum + day.completed, 0);
    const totalFocusMinutes = dailyStats.reduce((sum, day) => sum + day.totalFocusMinutes, 0);
    const averageCompletionRate = dailyStats.length > 0 
      ? Math.round(dailyStats.reduce((sum, day) => sum + day.completionRate, 0) / dailyStats.length)
      : 0;

    const summary = {
      totalAttempted,
      totalCompleted,
      totalFocusMinutes,
      totalFocusTime: {
        hours: Math.floor(totalFocusMinutes / 60),
        minutes: totalFocusMinutes % 60,
        formatted: `${Math.floor(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m`
      },
      averageCompletionRate,
      activeDays: dailyStats.filter(day => day.attempted > 0).length,
    };

    return NextResponse.json({
      dailyStats: dailyStats.reverse(), // Most recent first
      summary,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        days,
      }
    });

  } catch (error) {
    console.error('Daily stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
