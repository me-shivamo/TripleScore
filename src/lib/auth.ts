import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { adminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Firebase Google",
      credentials: {
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        try {
          const decodedToken = await adminAuth.verifyIdToken(
            credentials.idToken
          );

          const { uid, email, name, picture } = decodedToken;

          if (!email) return null;

          const user = await prisma.user.upsert({
            where: { firebaseUid: uid },
            update: { updatedAt: new Date() },
            create: {
              firebaseUid: uid,
              email,
              name: name ?? null,
              avatarUrl: picture ?? null,
              gamification: {
                create: {},
              },
            },
            include: {
              profile: true,
            },
          });

          return {
            id: user.id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            name: user.name,
            onboardingCompleted: user.profile?.onboardingCompleted ?? false,
          };
        } catch (error) {
          console.error("Firebase token verification failed:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.onboardingCompleted = (user as any).onboardingCompleted;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.onboardingCompleted =
          token.onboardingCompleted as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
