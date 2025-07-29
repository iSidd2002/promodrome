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
        console.log('🔐 Authorize called with credentials:', {
          email: credentials?.email,
          hasPassword: !!credentials?.password
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing email or password');
          return null
        }

        try {
          // Validate input
          const { email, password } = loginSchema.parse(credentials)
          const normalizedEmail = email.toLowerCase().trim();
          console.log('✅ Credentials validated for email:', normalizedEmail);

          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              avatar: true,
            }
          })

          console.log('🔍 User lookup result:', {
            found: !!user,
            email: user?.email
          });

          if (!user) {
            console.log('❌ User not found for email:', normalizedEmail);
            return null
          }

          // Verify password
          const isPasswordValid = await verifyPassword(password, user.password)
          console.log('🔑 Password verification:', { valid: isPasswordValid });

          if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', normalizedEmail);
            return null
          }

          // Return user object (password excluded)
          const userResult = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
          };

          console.log('✅ Authentication successful for user:', userResult.email);
          return userResult;
        } catch (error) {
          console.error('💥 Authentication error:', error)
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
