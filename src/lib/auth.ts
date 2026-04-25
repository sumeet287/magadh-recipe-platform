import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "CUSTOMER",
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user || !user.passwordHash) return null;
        if (!user.isActive) return null;

        const isValid = await compare(password, user.passwordHash);
        if (!isValid) return null;

        if (!user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          marketingOptIn: user.marketingOptIn,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        const next = new URL(url);
        if (next.origin === baseUrl) return url;
      } catch {
        /* ignore */
      }
      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          id?: string;
          role?: string;
          phone?: string | null;
          phoneVerified?: boolean;
          marketingOptIn?: boolean;
        };
        token.id = u.id ?? token.id;
        token.role = u.role ?? "CUSTOMER";
        token.phone = u.phone ?? null;
        token.phoneVerified = u.phoneVerified ?? false;
        token.marketingOptIn = u.marketingOptIn ?? false;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.image !== undefined) token.image = session.image;
        if (session.phone !== undefined) token.phone = session.phone;
        if (session.phoneVerified !== undefined) token.phoneVerified = session.phoneVerified;
        if (session.marketingOptIn !== undefined) token.marketingOptIn = session.marketingOptIn;
        if (session.phonePromptDismissedAt !== undefined) {
          token.phonePromptDismissedAt = session.phonePromptDismissedAt;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.phone = (token.phone as string | null | undefined) ?? null;
        session.user.phoneVerified = (token.phoneVerified as boolean | undefined) ?? false;
        session.user.marketingOptIn = (token.marketingOptIn as boolean | undefined) ?? false;
        session.user.phonePromptDismissedAt =
          (token.phonePromptDismissedAt as string | null | undefined) ?? null;
      }
      return session;
    },
  },
});
