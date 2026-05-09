import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import prisma from "./prisma";

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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { school: true },
        });

        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(credentials.password as string, user.password);
        if (!ok) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          schoolSlug: user.school.slug,
          schoolName: user.school.name,
          image: user.avatarUrl ?? null,
        };
      },
    }),
  ],
});
