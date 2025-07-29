import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { updateSessionSchema } from '@/lib/validations/session'
import { ZodError } from 'zod'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updateData = updateSessionSchema.parse(body)

    // Convert string dates to Date objects
    const processedData: Record<string, unknown> = { ...updateData }
    if (processedData.endTime && typeof processedData.endTime === 'string') {
      processedData.endTime = new Date(processedData.endTime)
    }

    // Verify the session belongs to the user
    const existingSession = await prisma.pomodoroSession.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const updatedSession = await prisma.pomodoroSession.update({
      where: { id: id },
      data: processedData
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Session update error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the session belongs to the user
    const existingSession = await prisma.pomodoroSession.findFirst({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    await prisma.pomodoroSession.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Session deleted successfully' })
  } catch (error) {
    console.error('Session deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
