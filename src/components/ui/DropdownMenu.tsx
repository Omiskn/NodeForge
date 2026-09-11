import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Minimal dropdown menu: trigger + floating panel that closes on
 * outside click or Escape. No external dependency needed.
 */
function DropdownMenu({
  trigger,
  children,
  align = 'end',
  side = 'bottom',
}: {
  trigger: ReactNode
  children: (close: () => void) => ReactNode
  align?: 'start' | 'end'
  side?: 'top' | 'bottom'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            'absolute z-50 min-w-44 rounded-xl border border-[var(--border)] bg-[var(--popover)] p-1',
            'shadow-[var(--shadow-lg-soft)] animate-pop',
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

function MenuItem({
  icon: Icon,
  children,
  danger,
  disabled,
  onClick,
}: {
  icon?: LucideIcon
  children: ReactNode
  danger?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px]',
        'transition-colors disabled:pointer-events-none disabled:opacity-40',
        danger
          ? 'text-[var(--destructive)] hover:bg-[var(--destructive)]/10'
          : 'text-[var(--popover-foreground)] hover:bg-[var(--secondary)]',
      )}
    >
      {Icon ? <Icon size={15} className="shrink-0 opacity-70" /> : null}
      <span className="truncate">{children}</span>
    </button>
  )
}

function MenuSeparator() {
  return <div className="mx-2 my-1 h-px bg-[var(--border)]" />
}

function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
      {children}
    </div>
  )
}

export { DropdownMenu, MenuItem, MenuSeparator, MenuLabel }
