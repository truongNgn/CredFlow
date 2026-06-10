import type { ReactNode } from "react"
import { Link } from "react-router-dom"

export function AuthShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return (
    <main className="grid min-h-screen bg-cream lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="relative z-10 text-2xl font-black">CredFlow<span className="text-lime">.</span></Link>
        <div className="absolute -right-24 top-16 h-80 w-80 rounded-full border-[60px] border-lime/80" />
        <div className="absolute bottom-10 left-20 h-40 w-40 rotate-12 rounded-[42px] bg-forest" />
        <div className="relative z-10 max-w-lg">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.25em] text-lime">Credits that move with you</p>
          <h1 className="text-6xl font-black leading-[0.95]">Fund every idea. Track every move.</h1>
          <p className="mt-7 max-w-md text-lg text-white/65">A focused workspace for buying credits, unlocking capabilities, and keeping spend visible.</p>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-12 block text-xl font-black lg:hidden">CredFlow.</Link>
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-forest">Welcome</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">{title}</h2>
          <p className="mt-3 text-ink/55">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </section>
    </main>
  )
}
