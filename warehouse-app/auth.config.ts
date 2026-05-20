import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  // Trust the Host header (we sit behind Render/Vercel/nginx, which terminate TLS
  // and forward via X-Forwarded-* headers). Without this, Auth.js v5 refuses to
  // construct URLs from request headers and throws UntrustedHost.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";

      if (isOnLogin) return isLoggedIn ? Response.redirect(new URL("/dashboard", nextUrl)) : true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  providers: [],
};
