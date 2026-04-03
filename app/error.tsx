'use client'

import { useEffect } from 'react'

// 灰度版本错误边界：纯原生HTML实现，无外部依赖
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('页面错误:', error)
  }, [error])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: '0 16px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 900, color: '#dc2626', margin: 0 }}>Oops!</h1>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#000', margin: '16px 0' }}>页面出现错误</h2>
        <p style={{ color: '#4b5563', margin: '8px 0 24px' }}>{error.message || '抱歉，页面加载时遇到了问题'}</p>
        <button
          onClick={() => reset()}
          style={{
            backgroundColor: '#dc2626',
            color: '#fff',
            fontWeight: 700,
            padding: '12px 24px',
            border: '2px solid #000',
            boxShadow: '4px 4px 0px 0px #000',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          重试刷新
        </button>
        <div style={{ marginTop: '32px' }}>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{ color: '#6b7280', fontSize: '0.875rem', border: 'none', background: 'none', cursor: 'pointer' }}
          >
            返回首页
          </button>
        </div>
      </div>
    </div>
  )
}
