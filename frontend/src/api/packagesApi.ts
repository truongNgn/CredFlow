import api from "@/api/client"
import type { ApiResponse, Package } from "@/types"

export async function getPackages() {
  const response = await api.get<ApiResponse<Package[]>>("/packages")
  return response.data.data
}

export async function getPackage(id: string) {
  const response = await api.get<ApiResponse<Package>>(`/packages/${id}`)
  return response.data.data
}
