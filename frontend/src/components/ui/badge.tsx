import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex rounded-full bg-lime px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink", className)}
      {...props}
    />
  )
}
