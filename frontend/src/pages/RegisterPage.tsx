import { useState, type FormEvent } from "react"
import toast from "react-hot-toast"
import { Link, useNavigate } from "react-router-dom"
import { register } from "@/api/authApi"
import { getApiError } from "@/api/client"
import { AuthShell } from "@/components/AuthShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/authStore"

export function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((state) => state.setAuth)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirm) return toast.error("Passwords do not match")
    setLoading(true)
    try {
      const payload = await register(email, password)
      setAuth(payload.user, payload.access_token)
      toast.success("Your workspace is ready")
      navigate("/dashboard")
    } catch (error) {
      toast.error(getApiError(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Start with zero credits and choose a plan when ready.">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block text-sm font-bold">Email<Input className="mt-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="block text-sm font-bold">Password<Input className="mt-2" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        <label className="block text-sm font-bold">Confirm password<Input className="mt-2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></label>
        <Button className="w-full" size="lg" variant="accent" disabled={loading}>{loading ? "Creating account..." : "Create account"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/55">Already have an account? <Link className="font-bold text-forest underline" to="/login">Sign in</Link></p>
    </AuthShell>
  )
}
