import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // 先更新会话，自动处理cookie同步
  let response = await updateSession(request)

  // 创建服务端客户端检查会话状态（只读，不修改cookie）
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {}, // 不需要修改cookie，updateSession已经处理
        remove() {}, // 不需要修改cookie，updateSession已经处理
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // 路由保护
  const { pathname } = request.nextUrl
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/api/workflows')

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // 已登录用户访问登录页自动跳转
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
