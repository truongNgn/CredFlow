import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import toast from "react-hot-toast"
import { getApiError } from "@/api/client"
import { getTransactions } from "@/api/creditsApi"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { TransactionPage } from "@/types"

type Filter = "all" | "success" | "failed" | "pending"

export function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState<Filter>("all")
  const [data, setData] = useState<TransactionPage>({ items: [], page: 1, page_size: 10, total: 0, pages: 0 })

  useEffect(() => {
    getTransactions(page, 10).then(setData).catch((error) => toast.error(getApiError(error)))
  }, [page])

  const items = useMemo(() => filter === "all" ? data.items : data.items.filter((item) => item.status === filter), [data.items, filter])

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-forest">Money trail</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Transaction history</h1>
      <p className="mt-3 text-ink/50">Every attempt, credit addition, and payment status in one place.</p>
      <div className="mt-9 flex flex-wrap gap-2">
        {(["all", "success", "failed", "pending"] as Filter[]).map((value) => <button key={value} onClick={() => setFilter(value)} className={cn("rounded-full px-4 py-2 text-sm font-bold capitalize", filter === value ? "bg-ink text-white" : "border border-ink/10 bg-white/50")}>{value}</button>)}
      </div>
      <Card className="mt-6 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-ink/10 bg-ink/[0.03] text-xs uppercase tracking-wider text-ink/45"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Package</th><th className="px-6 py-4">Credits</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Status</th></tr></thead>
              <tbody className="divide-y divide-ink/10">
                {items.map((item) => <tr key={item.id} className="hover:bg-cream/50"><td className="px-6 py-5 text-sm">{new Date(item.created_at).toLocaleDateString()}</td><td className="px-6 py-5 font-bold">{item.package_name ?? "Deleted package"}</td><td className="px-6 py-5 font-semibold">{item.credits_added.toLocaleString()}</td><td className="px-6 py-5">${Number(item.amount).toFixed(2)}</td><td className="px-6 py-5"><Badge className={cn(item.status === "success" && "bg-lime", item.status === "failed" && "bg-red-100 text-red-700", item.status === "pending" && "bg-amber-100 text-amber-700")}>{item.status}</Badge></td></tr>)}
              </tbody>
            </table>
          </div>
          {!items.length && <div className="grid place-items-center py-16 text-center"><Search className="text-ink/25" size={34} /><p className="mt-4 font-bold">No transactions found</p><p className="mt-1 text-sm text-ink/45">Try another status or make your first purchase.</p></div>}
          <div className="flex items-center justify-between border-t border-ink/10 px-6 py-4">
            <p className="text-sm text-ink/45">Page {data.page} of {Math.max(data.pages, 1)} · {data.total} total</p>
            <div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={16} /></Button><Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}><ChevronRight size={16} /></Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
