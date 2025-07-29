import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/utils/password'
import { loginSchema } from '@/lib/validations/auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'your@email.com'
        },
        password: {
          label: 'Password',
          type: 'password',
          placeholder: 'Your password'
        }
      },
      async authorize(credentials, req) {
        console.log('🔐 NextAuth authorize function called');

        // Validate credentials exist
        if (!credentials) {
          console.log('❌ No credentials provided');
          return null;
        }

        const { email, password } = credentials;

        if (!email || !password) {
          console.log('❌ Missing email or password');
          return null;
        }

        console.log('🔐 Processing credentials for email:', email);

        try {
          // Normalize email
          const normalizedEmail = email.toLowerCase().trim();
          console.log('🔐 Normalized email:', normalizedEmail);

          // Find user in database
          console.log('🔍 Looking up user in database...');
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              avatar: true,
            }
          });

          console.log('🔍 User lookup result:', {
            found: !!user,
            email: user?.email
          });

          if (!user) {
            console.log('❌ User not found for email:', normalizedEmail);
            return null;
          }

          // Verify password
          console.log('🔑 Verifying password...');
          const bcrypt = require('bcryptjs');
          const isPasswordValid = await bcrypt.compare(password, user.password);

          console.log('🔑 Password verification result:', { valid: isPasswordValid });

          if (!isPasswordValid) {
            console.log('❌ Invalid password for user:', normalizedEmail);
            return null;
          }

          // Return user object (password excluded)
          const userResult = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar || null,
          };

          console.log('✅ Authentication successful for user:', userResult.email);
          return userResult;

        } catch (error) {
          console.error('💥 Authentication error:', error);
          return null;
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
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET,
}
