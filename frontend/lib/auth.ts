import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'

const API_URL =
  process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/** Decode the `exp` claim from a JWT without a library (server-side only). */
function jwtExpiry(token: string): number {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    return (payload.exp ?? 0) * 1000
  } catch {
    return 0
  }
}

/** Call the backend refresh endpoint, passing the stored refresh token as a cookie. */
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `refresh_token=${refreshToken}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data.access_token as string) ?? null
  } catch {
    return null
  }
}

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

        // Capture the refresh_token value the backend sets as an httponly cookie so we
        // can use it server-side to silently re-issue access tokens later.
        const setCookie = res.headers.get('set-cookie') ?? ''
        const refreshTokenMatch = setCookie.match(/refresh_token=([^;]+)/)
        const refreshToken = refreshTokenMatch?.[1] ?? ''

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
          refreshToken,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // First sign-in: persist backend tokens into the NextAuth JWT.
      if (user) {
        token.role = (user as { role: string }).role
        token.accessToken = (user as { accessToken: string }).accessToken
        token.refreshToken = (user as unknown as { refreshToken: string }).refreshToken
      }

      // Proactively refresh 60 s before expiry so in-flight requests never see a 401.
      const expiry = jwtExpiry(token.accessToken as string)
      if (expiry && Date.now() < expiry - 60_000) return token

      // Token is expired or about to expire — try a silent refresh.
      const rt = token.refreshToken as string | undefined
      if (!rt) return token

      const newAccessToken = await refreshAccessToken(rt)
      if (newAccessToken) token.accessToken = newAccessToken

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
