import { Loader2, Pencil, Plus, Trash2, Users, WalletCards } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import toast from "react-hot-toast"
import { createPackage, deletePackage, getAdminFeatures, getAdminPackages, getAdminStats, updatePackage } from "@/api/adminApi"
import { getApiError } from "@/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { AdminStats, Feature, Package, PackageInput } from "@/types"

const emptyForm: PackageInput = { name: "", description: "", price: 0, credit_amount: 100, is_active: true, feature_slugs: [] }

export function AdminPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Package | null | undefined>(undefined)
  const [form, setForm] = useState<PackageInput>(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [packageData, featureData, statData] = await Promise.all([getAdminPackages(), getAdminFeatures(), getAdminStats()])
      setPackages(packageData); setFeatures(featureData); setStats(statData)
    } catch (error) { toast.error(getApiError(error)) } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const openForm = (item: Package | null) => {
    setEditing(item)
    setForm(item ? { name: item.name, description: item.description ?? "", price: Number(item.price), credit_amount: item.credit_amount, is_active: item.is_active, feature_slugs: item.features.map((feature) => feature.slug) } : emptyForm)
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true)
    try {
      if (editing) await updatePackage(editing.id, form); else await createPackage(form)
      toast.success(editing ? "Package updated" : "Package created")
      setEditing(undefined); await load()
    } catch (error) { toast.error(getApiError(error)) } finally { setSaving(false) }
  }
  const toggle = async (item: Package) => {
    try { await updatePackage(item.id, { is_active: !item.is_active }); await load() } catch (error) { toast.error(getApiError(error)) }
  }
  const remove = async (item: Package) => {
    if (!window.confirm(`Deactivate ${item.name}?`)) return
    try { await deletePackage(item.id); toast.success("Package deactivated"); await load() } catch (error) { toast.error(getApiError(error)) }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-[0.2em] text-forest">Admin</p><h1 className="mt-2 text-4xl font-black">Package control</h1></div><Button onClick={() => openForm(null)}><Plus className="mr-2" size={18} />Create package</Button></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="flex items-center gap-4 p-6"><Users /><div><p className="text-3xl font-black">{stats?.users ?? 0}</p><p className="text-sm text-ink/50">Users</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-4 p-6"><WalletCards /><div><p className="text-3xl font-black">{stats?.transactions ?? 0}</p><p className="text-sm text-ink/50">Transactions</p></div></CardContent></Card>
        <Card><CardContent className="p-6"><p className="text-3xl font-black">${Number(stats?.successful_revenue ?? 0).toFixed(2)}</p><p className="text-sm text-ink/50">Successful revenue</p></CardContent></Card>
      </div>
      <Card className="mt-8 overflow-hidden"><CardContent className="overflow-x-auto p-0">
        {loading ? <div className="grid h-56 place-items-center"><Loader2 className="animate-spin" /></div> : <table className="w-full min-w-[760px] text-left"><thead className="bg-ink text-white"><tr>{["Package", "Price", "Credits", "Status", "Actions"].map((heading) => <th key={heading} className="px-5 py-4 text-sm">{heading}</th>)}</tr></thead><tbody>{packages.map((item) => <tr key={item.id} className="border-b border-ink/10"><td className="px-5 py-4"><strong>{item.name}</strong><p className="text-xs text-ink/45">{item.features.map((feature) => feature.name).join(", ")}</p></td><td className="px-5 py-4">${Number(item.price).toFixed(2)}</td><td className="px-5 py-4">{item.credit_amount.toLocaleString()}</td><td className="px-5 py-4"><button onClick={() => toggle(item)}><Badge className={item.is_active ? "" : "bg-ink/20 text-ink"}>{item.is_active ? "Active" : "Inactive"}</Badge></button></td><td className="px-5 py-4"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openForm(item)}><Pencil size={15} /></Button><Button size="sm" variant="outline" onClick={() => remove(item)}><Trash2 size={15} /></Button></div></td></tr>)}</tbody></table>}
      </CardContent></Card>
      <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}><DialogContent><DialogTitle className="text-2xl font-black">{editing ? "Edit package" : "Create package"}</DialogTitle><DialogDescription className="mt-2 text-ink/50">Configure pricing, credits and unlocked features.</DialogDescription><form className="mt-6 space-y-4" onSubmit={submit}><Input required placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><div className="grid grid-cols-2 gap-3"><Input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: Number(event.target.value) })} /><Input required min="1" type="number" value={form.credit_amount} onChange={(event) => setForm({ ...form, credit_amount: Number(event.target.value) })} /></div><div className="space-y-2">{features.map((feature) => <label key={feature.id} className="flex items-center gap-3 rounded-xl bg-white p-3"><input type="checkbox" checked={form.feature_slugs.includes(feature.slug)} onChange={() => setForm({ ...form, feature_slugs: form.feature_slugs.includes(feature.slug) ? form.feature_slugs.filter((slug) => slug !== feature.slug) : [...form.feature_slugs, feature.slug] })} />{feature.name}</label>)}</div><label className="flex gap-3"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />Active</label><Button className="w-full" disabled={saving}>{saving && <Loader2 className="mr-2 animate-spin" size={17} />}{editing ? "Save changes" : "Create package"}</Button></form></DialogContent></Dialog>
    </div>
  )
}
