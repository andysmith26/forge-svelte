import { SvelteKitAuth } from '@auth/sveltekit';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from '@auth/sveltekit/providers/google';
import { prisma } from './prisma';

export const {
  handle: authHandle,
  signIn,
  signOut
} = SvelteKitAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt'
  },
  providers: [Google],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        // Only allow sign-in if a matching Person exists
        const person = await prisma.person.findFirst({
          where: {
            OR: [{ email: user.email }, { googleId: account.providerAccountId }]
          }
        });

        if (!person) {
          return false;
        }

        // Link googleId if not already linked, and update lastLoginAt
        await prisma.person.update({
          where: { id: person.id },
          data: {
            googleId: person.googleId || account.providerAccountId,
            lastLoginAt: new Date()
          }
        });

        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.personId = (user as { personId?: string }).personId ?? null;
      }

      // Ensure personId is always resolved
      if (token.personId === undefined && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { personId: true }
        });
        token.personId = dbUser?.personId ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.sub ?? '';
        (session.user as { personId?: string }).personId = (token.personId as string) ?? undefined;
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      // When a new User is created by Auth.js, link it to an existing Person
      if (user.email) {
        const person = await prisma.person.findFirst({
          where: { email: user.email }
        });
        if (person) {
          await prisma.user.update({
            where: { id: user.id },
            data: { personId: person.id }
          });
        }
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error'
  }
});
