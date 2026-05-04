'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Shield, Lock } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const parsed = loginSchema.safeParse({
      email: fd.get('email'),
      password: fd.get('password'),
    })
    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      setLoading(false)
      return
    }
    const result = await signIn('credentials', { ...parsed.data, redirect: false })
    if (result?.error) {
      setError('Invalid credentials')
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1923]">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-2 bg-[#1A3A5C] rounded-lg">
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">SIEM Case Manager</h1>
            <p className="text-sm text-slate-400">Security Incident Response Platform</p>
          </div>
        </div>

        <div className="bg-[#162030] border border-[#1E3048] rounded-xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                defaultValue="analyst.kim@corp.local"
                className="w-full bg-[#0F1923] border border-[#1E3048] rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                placeholder="you@corp.local"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <input
                name="password"
                type="password"
                required
                defaultValue="Demo1234!"
                className="w-full bg-[#0F1923] border border-[#1E3048] rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            {error && (
              <div className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A3A5C] hover:bg-[#2A5A8C] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
