import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Github from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Github({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@domain.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = { id: "1", email: credentials?.email as string }
        return user
      },
    }),
  ],
  pages: {
    signIn: "/signin",
    signOut: "/signout",
    error: "/error",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        ;(token as { id: string; email: string }).id = user.id
        ;(token as { id: string; email: string }).email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as { id: string; email: string }).id = token.id as string
        ;(session.user as { id: string; email: string }).email = token.email as string
      }
      return session
    },
  },
} as unknown as {
  providers: any[]
  pages: Record<string, string>
  session: { strategy: string }
  callbacks: {
    jwt: (args: { token: { id?: string; email?: string; [k: string]: unknown }; user: { id?: string; email?: string } }) => Promise<any>
    session: (args: { session: { user?: { id?: string; email?: string } }; token: { id?: string; email?: string } }) => Promise<any>
  }
}