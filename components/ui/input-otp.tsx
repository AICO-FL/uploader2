// Simplified OTP input component
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputOTPProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string
  maxLength?: number
  onComplete?: (value: string) => void
}

const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  ({ className, maxLength = 6, value, onChange, onComplete, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/[^0-9]/g, "")
      
      if (onChange) {
        const event = {
          ...e,
          target: {
            ...e.target,
            value: newValue
          }
        }
        onChange(event)
      }

      if (newValue.length === maxLength && onComplete) {
        onComplete(newValue)
      }
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d*"
        maxLength={maxLength}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        value={value}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
InputOTP.displayName = "InputOTP"

export { InputOTP }