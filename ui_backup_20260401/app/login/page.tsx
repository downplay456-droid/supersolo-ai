'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, KeyRound } from 'lucide-react'

type AuthMode = 'password' | 'magic_link' | 'signup'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [mode, setMode] = useState<AuthMode>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const error = searchParams.get('error')
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      // 强制刷新服务端状态，确保middleware能检测到新的会话cookie
      router.refresh()
      // 短暂延迟确保cookie同步完成
      setTimeout(() => {
        router.push(redirectTo)
      }, 300)
    } catch (err: any) {
      console.error('Login error:', err)
      router.push(`/login?error=${encodeURIComponent(err.message || '登录失败，请检查邮箱和密码')}&redirectTo=${redirectTo}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        },
      })

      if (error) throw error
      router.refresh()
      router.push('/login?message=Check your email for the magic link to sign in')
    } catch (err: any) {
      console.error('Magic link error:', err)
      router.push(`/login?error=${encodeURIComponent(err.message || '发送魔法链接失败，请稍后重试')}&redirectTo=${redirectTo}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        },
      })

      if (error) throw error
      router.refresh()
      router.push('/login?message=Check your email to confirm your account')
    } catch (err: any) {
      console.error('Signup error:', err)
      router.push(`/login?error=${encodeURIComponent(err.message || '注册失败，请稍后重试')}&redirectTo=${redirectTo}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a12] font-sans relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -top-48 -left-48"></div>
      <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -bottom-48 -right-48"></div>
      
      {/* Login card with glow effect */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg blur-lg opacity-30 group-hover:opacity-40 transition duration-1000"></div>
        <Card className="relative w-full max-w-md bg-[#12121f] border-[#2a2a3a] text-white shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SuperSolo AI
            </CardTitle>
            <CardDescription className="text-center text-gray-400 text-base">
              {mode === 'password' ? 'Sign in to your account' : mode === 'signup' ? 'Create your new account' : 'Get a magic link to sign in'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={mode === 'password' ? handlePasswordLogin : mode === 'signup' ? handleSignUp : handleMagicLinkLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-800 text-red-200">
                  <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
                </Alert>
              )}
              {searchParams.get('message') && (
                <Alert className="bg-green-900/20 border-green-800 text-green-200">
                  <AlertDescription>{decodeURIComponent(searchParams.get('message')!)}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-[#1a1a2e] border-[#2a2a3a] text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
              {(mode === 'password' || mode === 'signup') && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                    className="bg-[#1a1a2e] border-[#2a2a3a] text-white placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-600/20"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {mode === 'password' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
              </Button>
              <button
                type="button"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5 justify-center"
                onClick={() => setMode(mode === 'password' ? 'magic_link' : 'password')}
                disabled={loading}
              >
                <KeyRound className="h-3.5 w-3.5" />
                {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
              </button>
              <p className="text-sm text-center text-gray-400">
                {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium ml-1"
                  onClick={() => setMode(mode === 'signup' ? 'password' : 'signup')}
                  disabled={loading}
                >
                  {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
