"use client"

export function BackgroundGradient() {
  return (
    <>
      <div className="fixed inset-0 bg-background z-[-2]" />
      <div className="fixed inset-0 bg-grid z-[-1] opacity-20" />
      <div
        className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-radial from-primary/10 via-transparent to-transparent z-[-1] opacity-60 blur-3xl"
        style={{
          background: "radial-gradient(circle at 50% 0%, rgba(var(--primary-rgb), 0.15), transparent 70%)",
        }}
      />
    </>
  )
}
