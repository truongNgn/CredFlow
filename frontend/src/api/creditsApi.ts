import api from "@/api/client"
import type { ApiResponse, Feature, PurchaseResult, TransactionPage } from "@/types"

export async function purchasePackage(packageId: string) {
  const response = await api.post<ApiResponse<PurchaseResult>>("/credits/purchase", { package_id: packageId })
  return response.data.data
}

export async function getBalance() {
  const response = await api.get<ApiResponse<{ balance: number }>>("/credits/balance")
  return response.data.data
}

export async function getTransactions(page = 1, pageSize = 10) {
  const response = await api.get<ApiResponse<TransactionPage>>("/credits/transactions", {
    params: { page, page_size: pageSize },
  })
  return response.data.data
}

export async function getFeatures() {
  const response = await api.get<ApiResponse<Feature[]>>("/credits/features")
  return response.data.data
}
