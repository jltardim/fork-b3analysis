import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { sign as jwtSign } from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
          const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            backendToken: data.token,
          };
        } catch {
          return null;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== "placeholder"
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })]
      : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_ID !== "placeholder"
      ? [GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        })]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        // Use backend token from credentials login
        if ((user as any).backendToken) {
          token.accessToken = (user as any).backendToken;
        }
      }
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      // Fallback: generate backend-compatible JWT if none exists
      if (!token.accessToken && token.email) {
        token.accessToken = jwtSign(
          { email: token.email, name: token.name, sub: token.email },
          process.env.NEXTAUTH_SECRET!,
          { algorithm: "HS256" }
        );
      }
      // Register user in backend on first login (OAuth flow)
      if (user && !((user as any).backendToken) && token.accessToken) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";
          await fetch(`${backendUrl}/api/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: token.accessToken }),
          });
        } catch {
          // Backend may be unavailable during dev
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
