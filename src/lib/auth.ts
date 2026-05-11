import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail } from "./supabase-db";
import { supabaseServer } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data, error } = await supabaseServer.auth.signInWithPassword({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password,
        });

        if (error || !data.user) return null;

        return {
          id: data.user.id,
          email: data.user.email ?? credentials.email.trim().toLowerCase(),
          name: data.user.user_metadata?.name ?? undefined,
          image: data.user.user_metadata?.avatar_url ?? undefined,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
      }
      const email = (token.email as string) || undefined;
      if (email) {
        const u = await getUserByEmail(email);
        if (u) {
          const expired = !!u.planExpiresAt && new Date(u.planExpiresAt) <= new Date();
          token.tier = expired ? "FREE" : u.tier;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.tier = (token.tier as typeof session.user.tier) ?? "FREE";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
