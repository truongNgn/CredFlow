import { Check, Loader2, PartyPopper } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Link } from "react-router-dom"
import { getApiError } from "@/api/client"
import { getTransactions, purchasePackage } from "@/api/creditsApi"
import { getPackages } from "@/api/packagesApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { useCreditsStore } from "@/store/creditsStore"
import type { Package, PurchaseResult } from "@/types"

export function PricingPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPackageId, setCurrentPackageId] = useState<string | null>(null)
  const token = useAuthStore((state) => state.token)
  const setBalance = useCreditsStore((state) => state.setBalance)
  const setFeatures = useCreditsStore((state) => state.setFeatures)
  const [selected, setSelected] = useState<Package | null>(null)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<PurchaseResult | null>(null)

  const handlePurchase = async () => {
    if (!selected) return
    setProcessing(true)
    try {
      const purchase = await purchasePackage(selected.id)
      setResult(purchase)
      if (purchase.status === "success") {
        setBalance(purchase.balance)
        setFeatures(purchase.unlocked_features)
        setCurrentPackageId(selected.id)
        toast.success("Purchase completed")
      } else {
        toast.error("Payment was declined. No credits were charged.")
      }
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setProcessing(false)
    }
  }

  useEffect(() => {
    getPackages()
      .then(setPackages)
      .catch((error) => toast.error(getApiError(error)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!token) return
    getTransactions(1, 100)
      .then((data) => {
        const latest = data.items.find((item) => item.status === "success" && item.package_id)
        setCurrentPackageId(latest?.package_id ?? null)
      })
      .catch(() => setCurrentPackageId(null))
  }, [token])

  return (
    <div className="min-h-screen bg-cream px-5 py-16 text-ink lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-forest">Simple pricing</p>
          <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl">Pick your power level.</h1>
          <p className="mt-5 text-lg text-ink/55">Credits never expire in the MVP. Every plan permanently unlocks its included capabilities.</p>
        </div>
        {loading ? (
          <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin" size={34} /></div>
        ) : (
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {packages.map((item) => {
              const popular = item.name.toLowerCase() === "pro"
              const current = item.id === currentPackageId
              return (
                <Card key={item.id} className={cn("relative flex flex-col overflow-hidden", popular && "border-forest bg-ink text-white lg:-translate-y-4", current && "ring-4 ring-lime")}>
                  {popular && <Badge className="absolute right-6 top-6">Most popular</Badge>}
                  {current && <Badge className={cn("absolute left-6 top-6", popular && "top-16")}>Current plan</Badge>}
                  <CardHeader className="pt-8">
                    <p className={cn("text-sm font-bold uppercase tracking-[0.2em]", popular ? "text-lime" : "text-forest")}>{item.name}</p>
                    <div className="mt-4 flex items-end gap-2"><span className="text-6xl font-black">${Number(item.price)}</span><span className={popular ? "text-white/50" : "text-ink/45"}>/ pack</span></div>
                    <p className={cn("mt-4 min-h-12", popular ? "text-white/60" : "text-ink/55")}>{item.description}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <div className={cn("my-5 rounded-2xl p-5", popular ? "bg-white/10" : "bg-cream")}>
                      <p className="text-3xl font-black">{item.credit_amount.toLocaleString()}</p><p className="text-sm opacity-60">credits included</p>
                    </div>
                    <ul className="flex-1 space-y-3">
                      {item.features.map((feature) => <li key={feature.id} className="flex gap-3 text-sm"><span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-full", popular ? "bg-lime text-ink" : "bg-forest text-white")}><Check size={13} /></span>{feature.name}</li>)}
                    </ul>
                    {token ? (
                      <Button className="mt-8 w-full" size="lg" variant={popular ? "accent" : "default"} disabled={current} onClick={() => { setResult(null); setSelected(item) }}>
                        {current ? "Current plan" : "Choose plan"}
                      </Button>
                    ) : (
                      <Button className="mt-8 w-full" size="lg" variant={popular ? "accent" : "default"} disabled>
                        Sign in to buy
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && !processing && setSelected(null)}>
        <DialogContent>
          {result?.status === "success" ? (
            <div className="py-8 text-center">
              <PartyPopper className="mx-auto text-forest" size={56} />
              <DialogTitle className="mt-5 text-3xl font-black">Credits added</DialogTitle>
              <DialogDescription className="mt-2 text-ink/55">Your new balance is {result.balance.toLocaleString()} credits.</DialogDescription>
              <div className="mt-5 flex flex-wrap justify-center gap-2">{result.unlocked_features.map((feature) => <Badge key={feature.id}>{feature.name}</Badge>)}</div>
              <Button asChild className="mt-7"><Link to="/dashboard">Open dashboard</Link></Button>
            </div>
          ) : (
            <>
              <DialogTitle className="text-2xl font-black">Confirm {selected?.name}</DialogTitle>
              <DialogDescription className="mt-2 text-ink/55">Demo payment form. Card details are not stored or validated.</DialogDescription>
              <div className="mt-6 space-y-4">
                <Input placeholder="Name on card" defaultValue="Demo User" />
                <Input placeholder="Card number" defaultValue="4242 4242 4242 4242" />
                <div className="grid grid-cols-2 gap-3"><Input placeholder="MM/YY" defaultValue="12/30" /><Input placeholder="CVV" defaultValue="123" /></div>
                {result?.status === "failed" && <p className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">Payment declined. Try the demo payment again.</p>}
                <div className="flex items-center justify-between rounded-2xl bg-white p-4"><span>{selected?.credit_amount.toLocaleString()} credits</span><strong>${selected && Number(selected.price).toFixed(2)}</strong></div>
                <Button className="w-full" size="lg" disabled={processing} onClick={handlePurchase}>
                  {processing && <Loader2 className="mr-2 animate-spin" size={18} />}{processing ? "Processing..." : "Pay now"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
