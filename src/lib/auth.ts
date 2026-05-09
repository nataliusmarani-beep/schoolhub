import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import db from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = db
          .prepare("SELECT * FROM users WHERE email = ? AND active = 1")
          .get(credentials.email as string) as any;

        if (!user) return null;

        const ok = await bcrypt.compare(credentials.password as string, user.password);
        if (!ok) return null;

        const school = db
          .prepare("SELECT * FROM schools WHERE id = ?")
          .get(user.school_id) as any;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: String(user.school_id),
          schoolSlug: school?.slug ?? "",
          schoolName: school?.name ?? "",
          image: user.avatar_url ?? null,
        };
      },
    }),
  ],
});
