import api from "@/api/client"
import type { AdminStats, ApiResponse, Feature, Package, PackageInput } from "@/types"

export async function getAdminPackages() {
  return (await api.get<ApiResponse<Package[]>>("/admin/packages")).data.data
}

export async function getAdminFeatures() {
  return (await api.get<ApiResponse<Feature[]>>("/admin/features")).data.data
}

export async function getAdminStats() {
  return (await api.get<ApiResponse<AdminStats>>("/admin/stats")).data.data
}

export async function createPackage(input: PackageInput) {
  return (await api.post<ApiResponse<Package>>("/admin/packages", input)).data.data
}

export async function updatePackage(id: string, input: Partial<PackageInput>) {
  return (await api.put<ApiResponse<Package>>(`/admin/packages/${id}`, input)).data.data
}

export async function deletePackage(id: string) {
  await api.delete(`/admin/packages/${id}`)
}
