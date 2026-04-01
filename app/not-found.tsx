// 灰度版本404页面：纯原生HTML实现，无外部依赖
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: '0 16px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '6rem', fontWeight: 900, color: '#dc2626', margin: 0 }}>404</h1>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#000', margin: '16px 0' }}>页面不存在</h2>
        <p style={{ color: '#4b5563', margin: '8px 0 24px' }}>抱歉，您访问的页面不存在或已被移动</p>
        <a href="/dashboard" style={{
          backgroundColor: '#dc2626',
          color: '#fff',
          fontWeight: 700,
          padding: '12px 24px',
          border: '2px solid #000',
          boxShadow: '4px 4px 0px 0px #000',
          cursor: 'pointer',
          fontSize: '1rem',
          textDecoration: 'none',
          display: 'inline-block'
        }}>
          返回首页
        </a>
      </div>
    </div>
  )
}
