import { toast as sonnerToast } from "sonner"

export interface ToastProps {
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
  duration?: number
}

export function useToast() {
  return {
    toast: ({ title, description, variant = "default", duration = 5000, ...props }: ToastProps) => {
      if (variant === "destructive") {
        sonnerToast.error(title, {
          description,
          duration,
          ...props,
        })
      } else {
        sonnerToast(title, {
          description,
          duration,
          ...props,
        })
      }
    },
  }
}