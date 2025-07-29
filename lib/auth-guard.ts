import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Higher-order function to protect API routes with authentication
 */
export function withAuth<T extends any[]>(
  handler: (req: NextRequest, session: any, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Get the session from NextAuth
      const session = await getServerSession(authOptions);

      // Check if user is authenticated
      if (!session || !session.user) {
        return NextResponse.json(
          { 
            error: 'Authentication required',
            message: 'You must be signed in to access this resource.',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }

      // Call the original handler with the session
      return await handler(req, session, ...args);
    } catch (error) {
      console.error('Auth guard error:', error);
      return NextResponse.json(
        { 
          error: 'Authentication error',
          message: 'An error occurred while verifying authentication.',
          code: 'AUTH_ERROR'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Utility to check if a user is authenticated in API routes
 */
export async function requireAuth(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    throw new Error('Authentication required');
  }
  
  return session;
}

/**
 * Utility to get user ID from session
 */
export function getUserId(session: any): string {
  if (!session?.user?.id) {
    throw new Error('User ID not found in session');
  }
  return session.user.id;
}

/**
 * Utility to validate user ownership of a resource
 */
export function validateUserOwnership(session: any, resourceUserId: string): boolean {
  const userId = getUserId(session);
  return userId === resourceUserId;
}

/**
 * Create standardized error responses
 */
export const AuthErrors = {
  UNAUTHORIZED: {
    error: 'Authentication required',
    message: 'You must be signed in to access this resource.',
    code: 'UNAUTHORIZED'
  },
  FORBIDDEN: {
    error: 'Access forbidden',
    message: 'You do not have permission to access this resource.',
    code: 'FORBIDDEN'
  },
  INVALID_SESSION: {
    error: 'Invalid session',
    message: 'Your session is invalid or has expired. Please sign in again.',
    code: 'INVALID_SESSION'
  },
  USER_NOT_FOUND: {
    error: 'User not found',
    message: 'The user associated with this session was not found.',
    code: 'USER_NOT_FOUND'
  }
} as const;
