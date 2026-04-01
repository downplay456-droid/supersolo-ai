interface StatusGlowProps {
  status: 'processing' | 'ready'
}

export default function StatusGlow({ status }: StatusGlowProps) {
  const isProcessing = status === 'processing'
  
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      {/* 呼吸光晕层 (仅在处理中显示) */}
      {isProcessing && (
        <div className="absolute inset-0 rounded-full bg-orange-500/50 animate-ping" />
      )}
      
      {/* 核心发光点 */}
      <div 
        className={`relative w-2 h-2 rounded-full transition-shadow duration-500 ${
          isProcessing 
            ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' 
            : 'bg-[#c6ff00] shadow-[0_0_8px_rgba(198,255,0,0.6)]'
        }`} 
      />
    </div>
  )
}
