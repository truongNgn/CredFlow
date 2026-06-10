import { useState, type FormEvent } from "react"
import toast from "react-hot-toast"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { login } from "@/api/authApi"
import { getApiError } from "@/api/client"
import { AuthShell } from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/authStore"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    try {
      const payload = await login(email, password)
      setAuth(payload.user, payload.access_token)
      toast.success("Welcome back")
      const target = (location.state as { from?: string } | null)?.from ?? "/dashboard"
      navigate(target, { replace: true })
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Sign in to your workspace" subtitle="Use your CredFlow account to continue.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-bold">Email<Input className="mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required /></label>
        <label className="block text-sm font-bold">Password<Input className="mt-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required /></label>
        <Button className="w-full" size="lg" variant="accent" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/55">New to CredFlow? <Link className="font-bold text-forest underline" to="/register">Create an account</Link></p>
    </AuthShell>
  )
}
