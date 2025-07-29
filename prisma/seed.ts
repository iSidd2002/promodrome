import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123456', 12)

  // Check if demo user already exists
  let demoUser = await prisma.user.findUnique({
    where: { email: 'demo@example.com' }
  })

  if (!demoUser) {
    // Create demo user
    demoUser = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        password: hashedPassword,
        name: 'Demo User',
        theme: 'SYSTEM',
        notifications: true,
        soundEnabled: true,
      }
    })

    // Create user settings separately
    await prisma.userSettings.create({
      data: {
        userId: demoUser.id,
        pomodoroDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: false,
        autoStartPomodoros: false,
      }
    })

    console.log('✅ Demo user and settings created')
  } else {
    console.log('✅ Demo user already exists')
  }

  console.log('✅ Demo user created:', { 
    id: demoUser.id, 
    email: demoUser.email, 
    name: demoUser.name 
  })

  // Create some sample pomodoro sessions for the demo user
  const sampleSessions = [
    {
      sessionType: 'POMODORO' as const,
      plannedDuration: 25 * 60, // 25 minutes in seconds
      actualDuration: 25 * 60,
      completed: true,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
    },
    {
      sessionType: 'SHORT_BREAK' as const,
      plannedDuration: 5 * 60, // 5 minutes in seconds
      actualDuration: 5 * 60,
      completed: true,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 35 * 60 * 1000),
    },
    {
      sessionType: 'POMODORO' as const,
      plannedDuration: 25 * 60,
      actualDuration: 20 * 60, // Stopped early
      completed: false,
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 20 * 60 * 1000),
    }
  ]

  for (const session of sampleSessions) {
    await prisma.pomodoroSession.create({
      data: {
        userId: demoUser.id,
        ...session,
      }
    })
  }

  console.log('✅ Sample sessions created')

  // Create user stats for the demo user
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Check if yesterday's stats exist
  const yesterdayStats = await prisma.userStats.findUnique({
    where: {
      userId_date: {
        userId: demoUser.id,
        date: yesterday,
      }
    }
  })

  if (!yesterdayStats) {
    await prisma.userStats.create({
      data: {
        userId: demoUser.id,
        date: yesterday,
        pomodorosCompleted: 1,
        totalFocusTime: 25 * 60, // 25 minutes
        totalBreakTime: 5 * 60,  // 5 minutes
        weeklyPomodoros: 1,
        monthlyPomodoros: 1,
      }
    })
  }

  // Check if today's stats exist
  const todayStats = await prisma.userStats.findUnique({
    where: {
      userId_date: {
        userId: demoUser.id,
        date: today,
      }
    }
  })

  if (!todayStats) {
    await prisma.userStats.create({
      data: {
        userId: demoUser.id,
        date: today,
        pomodorosCompleted: 0,
        totalFocusTime: 0,
        totalBreakTime: 0,
        weeklyPomodoros: 1,
        monthlyPomodoros: 1,
      }
    })
  }

  console.log('✅ User stats created')
  console.log('🎉 Database seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
