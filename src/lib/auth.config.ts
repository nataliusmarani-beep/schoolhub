import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
      const isPublicSchoolPage = /^\/[a-z0-9-]+(\/[a-z0-9-]*)*\/?$/.test(nextUrl.pathname) &&
        !nextUrl.pathname.startsWith("/dashboard") &&
        !nextUrl.pathname.startsWith("/api") &&
        !nextUrl.pathname.startsWith("/login") &&
        !nextUrl.pathname.startsWith("/register") &&
        !nextUrl.pathname.startsWith("/forgot-password");
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      if (isApiAuth || isPublicSchoolPage) return true;

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
        token.schoolSlug = (user as any).schoolSlug;
        token.schoolName = (user as any).schoolName;
        token.id = (user as any).id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).schoolSlug = token.schoolSlug;
        (session.user as any).schoolName = token.schoolName;
        (session.user as any).id = token.id ?? token.sub;
      }
      return session;
    },
  },
  providers: [],
  session: { strategy: "jwt" },
};
