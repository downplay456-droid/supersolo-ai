'use client'

// 灰度版本全局错误边界：纯原生HTML实现，无外部依赖
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#fff' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h1 style={{ fontSize: '6rem', fontWeight: 900, color: '#dc2626', margin: 0 }}>500</h1>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#000', margin: '16px 0' }}>系统错误</h2>
            <p style={{ color: '#4b5563', margin: '8px 0 24px' }}>{error.message || '抱歉，系统遇到了严重问题'}</p>
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
              刷新重试
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
