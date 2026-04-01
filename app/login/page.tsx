'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, KeyRound } from 'lucide-react'

type AuthMode = 'password' | 'magic_link' | 'signup'

function LoginContent() {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans relative px-4">
      {/* 顶部品牌标识 */}
      <div className="absolute top-8 left-8">
        <div className="font-display font-heavy text-2xl tracking-tighter">
          <span className="text-black">SUPER</span><span className="text-red-600">SOLO</span>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="w-full max-w-md space-y-8">
        {/* 大标题 */}
        <div className="text-center space-y-4">
          <h1 className="font-display font-heavy text-7xl tracking-tighter leading-none">
            <span className="text-black">AGENTS THAT</span><br />
            <span className="text-red-600">SELL.</span>
          </h1>
          <p className="text-lg text-gray-600 font-medium max-w-sm mx-auto">
            跨境电商选品全链路自动化平台，零经验挖掘全球爆款
          </p>
        </div>

        {/* 登录表单 */}
        <div className="border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000] bg-white">
          <form onSubmit={mode === 'password' ? handlePasswordLogin : mode === 'signup' ? handleSignUp : handleMagicLinkLogin}>
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-600 p-3 text-sm text-red-800 font-medium">
                  {decodeURIComponent(error)}
                </div>
              )}
              {searchParams.get('message') && (
                <div className="bg-green-50 border-l-4 border-green-600 p-3 text-sm text-green-800 font-medium">
                  {decodeURIComponent(searchParams.get('message')!)}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-black font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  邮箱地址
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-2 border-black h-12 px-4 text-black font-medium placeholder:text-gray-400 focus:border-red-600 focus:ring-0"
                />
              </div>

              {(mode === 'password' || mode === 'signup') && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-black font-bold text-sm uppercase tracking-wide flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    密码
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
                    className="border-2 border-black h-12 px-4 text-black font-medium placeholder:text-gray-400 focus:border-red-600 focus:ring-0"
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold text-lg h-12 border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {mode === 'password' ? '登录系统' : mode === 'signup' ? '创建账户' : '发送登录链接'}
              </Button>

              <div className="space-y-3 text-center">
                <button
                  type="button"
                  className="text-sm text-black font-semibold hover:text-red-600 transition-colors flex items-center gap-1.5 justify-center"
                  onClick={() => setMode(mode === 'password' ? 'magic_link' : 'password')}
                  disabled={loading}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {mode === 'password' ? '使用魔法链接登录' : '使用密码登录'}
                </button>

                <p className="text-sm text-gray-600">
                  {mode === 'signup' ? '已有账户？' : '还没有账户？'}
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-700 font-bold ml-1"
                    onClick={() => setMode(mode === 'signup' ? 'password' : 'signup')}
                    disabled={loading}
                  >
                    {mode === 'signup' ? '立即登录' : '免费注册'}
                  </button>
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* 底部数据展示 */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center border-2 border-black p-3">
            <div className="font-display font-heavy text-3xl text-red-600">10K+</div>
            <div className="text-xs font-bold uppercase text-gray-600">活跃卖家</div>
          </div>
          <div className="text-center border-2 border-black p-3">
            <div className="font-display font-heavy text-3xl text-black">98%</div>
            <div className="text-xs font-bold uppercase text-gray-600">爆款命中率</div>
          </div>
          <div className="text-center border-2 border-black p-3">
            <div className="font-display font-heavy text-3xl text-red-600">3x</div>
            <div className="text-xs font-bold uppercase text-gray-600">效率提升</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-red-600" />
    </div>}>
      <LoginContent />
    </Suspense>
  )
}
