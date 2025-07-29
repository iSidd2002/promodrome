import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const userCount = await prisma.user.count();
    
    // Test specific user lookup (the one from your logs)
    const testUser = await prisma.user.findUnique({
      where: { email: 'sharmasiddhant2002@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      status: 'success',
      database: 'connected',
      userCount,
      testUser: testUser ? {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        createdAt: testUser.createdAt,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
