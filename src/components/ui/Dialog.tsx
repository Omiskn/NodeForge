import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './primitives'
import { cn } from '@/lib/utils'

/** Generic modal dialog with overlay. */
function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          'w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)]',
          'p-5 shadow-[var(--shadow-lg-soft)] animate-pop',
          className,
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">
            {title}
          </h2>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        <div className="text-sm text-[var(--muted-foreground)]">{children}</div>
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  )
}

/** Confirmation dialog for destructive actions. */
function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="bg-[var(--destructive)] text-white hover:opacity-90"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description}
    </Dialog>
  )
}

export { Dialog, ConfirmDialog }
