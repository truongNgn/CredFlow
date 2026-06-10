import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border border-ink/15 bg-white/80 px-4 text-ink outline-none transition placeholder:text-ink/35 focus:border-forest focus:ring-2 focus:ring-lime/50",
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = "Input"
