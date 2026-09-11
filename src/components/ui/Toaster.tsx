import { CheckCircle2, Info, XCircle } from 'lucide-react'
import type { Toast } from '@/hooks/useTreeEditor'
import { cn } from '@/lib/utils'

const kindIcons = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
}

const kindColors = {
  info: 'text-[var(--muted-foreground)]',
  success: 'text-[var(--primary)]',
  error: 'text-[var(--destructive)]',
}

/** Bottom-right toast notifications stack. */
function Toaster({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[110] flex flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = kindIcons[toast.kind]
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-center gap-2 rounded-xl border border-[var(--border)] px-3.5 py-2.5',
              'bg-[var(--card)] text-sm text-[var(--foreground)] shadow-[var(--shadow-lg-soft)] animate-pop',
            )}
          >
            <Icon size={16} className={cn('shrink-0', kindColors[toast.kind])} />
            {toast.message}
          </div>
        )
      })}
    </div>
  )
}

export { Toaster }
