"use client"

export function LcarsLoadingScreen() {
  return (
    <div className="min-h-screen bg-lcars-black flex flex-col items-center justify-center">
      <div className="w-64 h-64 relative">
        <div className="absolute top-0 left-0 w-32 h-32 bg-lcars-orange rounded-tl-full animate-pulse"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-lcars-blue rounded-tr-full animate-pulse delay-100"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-lcars-purple rounded-bl-full animate-pulse delay-200"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-lcars-gold rounded-br-full animate-pulse delay-300"></div>
      </div>
      <div className="mt-8 text-lcars-orange text-2xl font-bold tracking-widest">LCARS SYSTEM INITIALIZING</div>
      <div className="mt-4 text-lcars-blue">LOADING DATABASE...</div>
    </div>
  )
}
