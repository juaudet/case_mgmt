import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'

const API_URL =
  process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Docker/local dev can trigger Auth.js host validation failures even when env vars are set.
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(1),
          })
          .safeParse(credentials)
        if (!parsed.success) return null

        const res = await fetch(`${API_URL}/api/v1/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            username: parsed.data.email,
            password: parsed.data.password,
          }),
        })
        if (!res.ok) return null

        const data = await res.json()
        const meRes = await fetch(`${API_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        if (!meRes.ok) return null
        const user = await meRes.json()

        return {
          id: user.id,
          email: user.email,
          name: user.full_name,
          role: user.role,
          accessToken: data.access_token,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role
        token.accessToken = (user as { accessToken: string }).accessToken
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.accessToken = token.accessToken as string
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})
