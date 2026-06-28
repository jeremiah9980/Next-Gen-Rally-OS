import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from '@rally/core-data'

/**
 * next-auth configuration for Rally-OS.
 *
 * Two sign-in paths:
 *  - Credentials (email + password) for coaches provisioned with a passwordHash.
 *  - Email magic links via the configured SMTP transport (EMAIL_SERVER/EMAIL_FROM).
 *
 * The PrismaAdapter backs the Account / Session / VerificationToken tables (the
 * email provider needs them), but the session itself is a JWT — credentials
 * sign-in requires the JWT strategy. The org/role tenancy claims ride on the
 * token so every server component can scope reads to the coach's organization.
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    verifyRequest: '/login?check=email',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Email and password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })
        if (!user?.passwordHash) return null

        const valid = await compare(credentials.password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        }
      },
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id
        token.role = 'role' in user && user.role ? String(user.role) : 'COACH'
        token.organizationId =
          'organizationId' in user ? (user.organizationId as string | null) : null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? ''
        session.user.role = (token.role as string) ?? 'COACH'
        session.user.organizationId = (token.organizationId as string | null) ?? null
      }
      return session
    },
  },
}
