 'use client'

import { useToast } from '@/hooks/use-toast'
import { X } from 'lucide-react'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts, dismiss, remove } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, center, ...props }: any) {
        // If a toast requests a centered overlay (e.g. success celebration), render a custom centered overlay
        if (center) {
          const colors = ["#FFD166", "#06D6A0", "#118AB2", "#EF476F", "#9B5DE5", "#F15BB5"]
          return (
            <div key={id} className="fixed inset-0 z-[120] flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto relative">
                {/* colorful sparks */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-[420px] h-[140px]">
                    {[...Array(16)].map((_, i) => {
                      const size = 6 + Math.round(Math.random() * 12)
                      const left = 40 + (Math.random() - 0.5) * 320
                      const top = 20 + (Math.random() - 0.5) * 100
                      const bg = colors[i % colors.length]
                      const delay = Math.round(Math.random() * 600)
                      return (
                        <span
                          key={i}
                          style={{
                            width: size,
                            height: size,
                            left: `${left}px`,
                            top: `${top}px`,
                            backgroundColor: bg,
                            animationDelay: `${delay}ms`,
                          }}
                          className="absolute rounded-full opacity-95 animate-ping"
                        />
                      )
                    })}
                  </div>
                </div>

                <div className="bg-background border p-6 rounded-lg shadow-2xl w-[420px] relative">
                  {/* close button (use icon and accessible placement) */}
                  <button
                    onClick={() => remove(id)}
                    className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/90 border shadow hover:scale-105 transition-transform pointer-events-auto"
                    aria-label="Close notification"
                  >
                    <X className="w-4 h-4 text-gray-700" />
                  </button>

                  <div className="grid gap-1">
                    {title && <ToastTitle>{title}</ToastTitle>}
                    {description && <ToastDescription>{description}</ToastDescription>}
                  </div>
                  {action}
                </div>
              </div>
            </div>
          )
        }

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
