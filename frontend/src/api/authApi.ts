import api from "@/api/client"
import type { ApiResponse, AuthPayload, User } from "@/types"

export async function login(email: string, password: string) {
  const response = await api.post<ApiResponse<AuthPayload>>("/auth/login", { email, password })
  return response.data.data
}

export async function register(email: string, password: string) {
  const response = await api.post<ApiResponse<AuthPayload>>("/auth/register", { email, password })
  return response.data.data
}

export async function getMe() {
  const response = await api.get<ApiResponse<User>>("/auth/me")
  return response.data.data
}
