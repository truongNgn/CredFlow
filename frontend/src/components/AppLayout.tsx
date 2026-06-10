import { BarChart3, CreditCard, LogOut, Menu, PackageOpen, Settings, X } from "lucide-react"
import { useState } from "react"
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"
import { useCreditsStore } from "@/store/creditsStore"

const navItems = [
  { to: "/dashboard", label: "Overview", icon: BarChart3 },
  { to: "/pricing", label: "Plans", icon: PackageOpen },
  { to: "/transactions", label: "Transactions", icon: CreditCard },
]

export function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const visibleNavItems = user?.role === "admin" ? [...navItems, { to: "/admin", label: "Admin", icon: Settings }] : navItems
  const resetCredits = useCreditsStore((state) => state.reset)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    resetCredits()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-3 text-xl font-black tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-lime">C</span>
            CredFlow
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {visibleNavItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn("flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold", isActive ? "bg-ink text-white" : "hover:bg-ink/5")
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <p className="text-sm font-bold">{user?.email}</p>
              <p className="text-xs uppercase tracking-wider text-ink/50">{user?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}><LogOut size={15} /></Button>
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        {open && (
          <div className="border-t border-ink/10 px-5 py-4 md:hidden">
            {visibleNavItems.map(({ to, label }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-3 font-semibold hover:bg-ink/5">{label}</NavLink>
            ))}
            <Button className="mt-3 w-full" variant="outline" onClick={handleLogout}>Sign out</Button>
          </div>
        )}
      </header>
      <main><Outlet /></main>
    </div>
  )
}
