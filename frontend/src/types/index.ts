export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

export interface User {
  id: string
  email: string
  role: "user" | "admin"
  created_at: string
}

export interface AuthPayload {
  access_token: string
  token_type: string
  user: User
}

export interface Feature {
  id: string
  name: string
  slug: string
  description: string | null
  unlocked_at?: string
}

export interface Package {
  id: string
  name: string
  description: string | null
  price: string
  credit_amount: number
  is_active: boolean
  features: Feature[]
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  package_id: string | null
  package_name: string | null
  amount: string
  credits_added: number
  status: "pending" | "success" | "failed"
  created_at: string
}

export interface TransactionPage {
  items: Transaction[]
  page: number
  page_size: number
  total: number
  pages: number
}

export interface PurchaseResult {
  transaction_id: string
  status: "success" | "failed"
  credits_added: number
  balance: number
  unlocked_features: Feature[]
}

export interface PackageInput {
  name: string
  description: string
  price: number
  credit_amount: number
  is_active: boolean
  feature_slugs: string[]
}

export interface AdminStats {
  users: number
  transactions: number
  successful_revenue: string
}
