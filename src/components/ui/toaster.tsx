"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="up">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon =
          variant === "success"
            ? CheckCircle
            : variant === "destructive"
            ? AlertTriangle
            : Info

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  variant === "success" && "text-success-foreground",
                  variant === "destructive" && "text-destructive-foreground"
                )}
              />
              <div className="grid flex-1 gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
            </div>
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
