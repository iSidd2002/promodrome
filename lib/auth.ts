import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/utils/password'
import { loginSchema } from '@/lib/validations/auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const isProduction = process.env.NODE_ENV === 'production';

        if (!isProduction) {
          console.log('🔐 Authorize called with credentials:', {
            email: credentials?.email,
            hasPassword: !!credentials?.password
          });
        }

        if (!credentials?.email || !credentials?.password) {
          if (!isProduction) console.log('❌ Missing email or password');
          return null
        }

        try {
          // Validate input
          const { email, password } = loginSchema.parse(credentials)
          const normalizedEmail = email.toLowerCase().trim();
          if (!isProduction) console.log('✅ Credentials validated for email:', normalizedEmail);

          // Find user in database with error handling
          let user;
          try {
            user = await prisma.user.findUnique({
              where: { email: normalizedEmail },
              select: {
                id: true,
                email: true,
                name: true,
                password: true,
                avatar: true,
              }
            });
          } catch (dbError) {
            console.error('💥 Database error during user lookup:', dbError);
            return null;
          }

          if (!isProduction) {
            console.log('🔍 User lookup result:', {
              found: !!user,
              email: user?.email
            });
          }

          if (!user) {
            if (!isProduction) console.log('❌ User not found for email:', normalizedEmail);
            return null
          }

          // Verify password with error handling
          let isPasswordValid = false;
          try {
            isPasswordValid = await verifyPassword(password, user.password);
          } catch (passwordError) {
            console.error('💥 Password verification error:', passwordError);
            return null;
          }

          if (!isProduction) {
            console.log('🔑 Password verification:', { valid: isPasswordValid });
          }

          if (!isPasswordValid) {
            if (!isProduction) console.log('❌ Invalid password for user:', normalizedEmail);
            return null
          }

          // Return user object (password excluded)
          const userResult = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
          };

          if (!isProduction) {
            console.log('✅ Authentication successful for user:', userResult.email);
          }
          return userResult;
        } catch (error) {
          console.error('💥 Authentication error:', error);

          // In production, try a simplified approach as fallback
          if (isProduction && credentials?.email && credentials?.password) {
            try {
              const fallbackUser = await prisma.user.findFirst({
                where: {
                  email: {
                    equals: credentials.email.toLowerCase().trim(),
                    mode: 'insensitive'
                  }
                },
                select: {
                  id: true,
                  email: true,
                  name: true,
                  password: true,
                  avatar: true,
                }
              });

              if (fallbackUser) {
                const bcrypt = require('bcryptjs');
                const isValid = await bcrypt.compare(credentials.password, fallbackUser.password);
                if (isValid) {
                  return {
                    id: fallbackUser.id,
                    email: fallbackUser.email,
                    name: fallbackUser.name,
                    image: fallbackUser.avatar,
                  };
                }
              }
            } catch (fallbackError) {
              console.error('💥 Fallback authentication also failed:', fallbackError);
            }
          }

          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle callback URLs properly
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}
