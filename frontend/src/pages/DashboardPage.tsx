import { ArrowUpRight, CreditCard, Layers3, Plus, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"
import { getApiError } from "@/api/client"
import { getBalance, getFeatures, getTransactions } from "@/api/creditsApi"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useCreditsStore } from "@/store/creditsStore"
import type { Transaction } from "@/types"

function AnimatedBalance({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const duration = 650
    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setDisplay(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) requestAnimationFrame(frame)
    }
    const id = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(id)
  }, [value])
  return <>{display.toLocaleString()}</>
}

export function DashboardPage() {
  const { balance, features, setBalance, setFeatures } = useCreditsStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getBalance(), getFeatures(), getTransactions(1, 100)])
      .then(([balanceData, featureData, transactionData]) => {
        setBalance(balanceData.balance)
        setFeatures(featureData)
        setTransactions(transactionData.items)
      })
      .catch((error) => toast.error(getApiError(error)))
      .finally(() => setLoading(false))
  }, [setBalance, setFeatures])

  const stats = useMemo(() => {
    const successful = transactions.filter((item) => item.status === "success")
    return {
      spend: successful.reduce((sum, item) => sum + Number(item.amount), 0),
      purchases: successful.length,
    }
  }, [transactions])

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-black uppercase tracking-[0.22em] text-forest">Workspace overview</p><h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Your credits, at a glance.</h1></div>
        <Button asChild variant="accent"><Link to="/pricing"><Plus className="mr-2" size={17} />Add credits</Link></Button>
      </div>
      <section className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden border-0 bg-ink text-white">
          <CardContent className="relative p-8 sm:p-10">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[42px] border-lime/20" />
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-lime">Available balance</p>
            <p className="mt-6 text-7xl font-black sm:text-8xl">{loading ? "—" : <AnimatedBalance value={balance} />}</p>
            <p className="mt-2 text-white/45">credits ready for your next workflow</p>
            <div className="mt-10 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-3/4 rounded-full bg-lime" /></div>
          </CardContent>
        </Card>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <Card><CardContent className="p-7"><div className="flex items-center justify-between"><CreditCard className="text-forest" /><ArrowUpRight size={18} /></div><p className="mt-8 text-4xl font-black">${stats.spend.toFixed(2)}</p><p className="mt-1 text-sm text-ink/50">Total successful spend</p></CardContent></Card>
          <Card><CardContent className="p-7"><div className="flex items-center justify-between"><Layers3 className="text-forest" /><ArrowUpRight size={18} /></div><p className="mt-8 text-4xl font-black">{stats.purchases}</p><p className="mt-1 text-sm text-ink/50">Completed purchases</p></CardContent></Card>
        </div>
      </section>
      <section className="mt-12">
        <div className="flex items-end justify-between"><div><p className="text-sm font-black uppercase tracking-[0.2em] text-forest">Unlocked tools</p><h2 className="mt-2 text-3xl font-black">Your capabilities</h2></div><span className="text-sm font-semibold text-ink/45">{features.length} active</span></div>
        {features.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => <Card key={feature.id}><CardContent className="p-6"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime"><Sparkles size={20} /></span><h3 className="mt-5 text-lg font-black">{feature.name}</h3><p className="mt-2 text-sm leading-relaxed text-ink/50">{feature.description ?? "Ready to use in your workspace."}</p></CardContent></Card>)}
          </div>
        ) : (
          <Card className="mt-6 border-dashed bg-transparent shadow-none"><CardContent className="p-10 text-center"><p className="font-bold">No features unlocked yet.</p><p className="mt-2 text-sm text-ink/50">Choose a plan to activate your first workflow.</p><Button asChild className="mt-5" variant="outline"><Link to="/pricing">View plans</Link></Button></CardContent></Card>
        )}
      </section>
    </div>
  )
}
