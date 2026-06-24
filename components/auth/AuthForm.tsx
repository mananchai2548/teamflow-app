'use client'

import { useState } from 'react'
import { login, signup } from '@/lib/actions/auth'
import { ArrowRight, Mail, Lock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    
    let result;
    if (isLogin) {
      result = await login(formData)
    } else {
      result = await signup(formData)
    }

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md p-8 rounded-2xl glass animate-in fade-in zoom-in duration-500">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-indigo-700 dark:from-indigo-400 dark:to-indigo-300">
          TeamFlow
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          {isLogin ? 'Welcome back to your workspace' : 'Create your account to get started'}
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="fullName">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                required={!isLogin}
                className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                placeholder="John Doe"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full pl-10 pr-4 py-2 bg-white/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
              placeholder="••••••••"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-white transition-all",
            "bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 active:scale-[0.98]",
            loading && "opacity-70 cursor-not-allowed"
          )}
        >
          {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => {
            setIsLogin(!isLogin)
            setError(null)
          }}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  )
}
