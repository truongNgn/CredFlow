import { create } from "zustand"
import type { Feature } from "@/types"

interface CreditsState {
  balance: number
  features: Feature[]
  setBalance: (balance: number) => void
  setFeatures: (features: Feature[]) => void
  reset: () => void
}

export const useCreditsStore = create<CreditsState>((set) => ({
  balance: 0,
  features: [],
  setBalance: (balance) => set({ balance }),
  setFeatures: (features) => set({ features }),
  reset: () => set({ balance: 0, features: [] }),
}))
