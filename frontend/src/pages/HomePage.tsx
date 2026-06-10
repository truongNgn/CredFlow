import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-cream text-ink">
      <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-5 lg:px-8">
        <span className="text-2xl font-black">CredFlow<span className="text-forest">.</span></span>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost"><Link to="/login">Sign in</Link></Button>
          <Button asChild><Link to="/register">Start free</Link></Button>
        </div>
      </nav>
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pt-24">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white/60 px-4 py-2 text-sm font-bold"><Sparkles size={16} /> Built for fast-moving teams</div>
          <h1 className="max-w-3xl text-6xl font-black leading-[0.91] tracking-[-0.055em] sm:text-7xl lg:text-[92px]">Credits without the clutter.</h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/60">Buy what you need, unlock powerful tools, and understand every transaction from one calm dashboard.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent"><Link to="/pricing">Explore plans <ArrowRight className="ml-2" size={18} /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/login">Open dashboard</Link></Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-5 text-sm font-semibold text-ink/60">
            <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-forest" /> No setup fee</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={17} className="text-forest" /> Instant access</span>
          </div>
        </div>
        <div className="relative mx-auto h-[470px] w-full max-w-lg">
          <div className="absolute inset-8 rotate-6 rounded-[48px] bg-lime" />
          <div className="absolute inset-8 -rotate-3 rounded-[48px] bg-forest" />
          <div className="absolute inset-0 flex flex-col justify-between rounded-[48px] bg-ink p-9 text-white shadow-2xl">
            <div className="flex items-center justify-between"><span className="font-bold">Available balance</span><span className="rounded-full bg-white/10 px-3 py-1 text-xs">LIVE</span></div>
            <div><p className="text-7xl font-black">2,480</p><p className="mt-2 text-white/50">credits ready to use</p></div>
            <div className="grid grid-cols-3 gap-3">
              {[42, 68, 90, 58, 78, 100, 72, 88, 96].map((height, index) => <div key={index} className="flex h-20 items-end rounded-xl bg-white/5 p-2"><div className="w-full rounded-lg bg-lime" style={{ height: `${height}%` }} /></div>)}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
