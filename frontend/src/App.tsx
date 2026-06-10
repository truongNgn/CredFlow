import { useEffect } from "react"
import { Toaster } from "react-hot-toast"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { getMe } from "@/api/authApi"
import { AppLayout } from "@/components/AppLayout"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { DashboardPage } from "@/pages/DashboardPage"
import { AdminPage } from "@/pages/AdminPage"
import { HomePage } from "@/pages/HomePage"
import { LoginPage } from "@/pages/LoginPage"
import { PricingPage } from "@/pages/PricingPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { TransactionsPage } from "@/pages/TransactionsPage"
import { useAuthStore } from "@/store/authStore"

export default function App() {
  const { token, setUser, logout } = useAuthStore()
  useEffect(() => {
    if (token) getMe().then(setUser).catch(logout)
  }, [token, setUser, logout])

  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { borderRadius: "14px", background: "#122019", color: "#fff" } }} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
