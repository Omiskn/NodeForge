import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = 'default' | 'ghost' | 'outline' | 'destructive'
type ButtonSize = 'default' | 'sm' | 'icon'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const buttonVariants: Record<ButtonVariant, string> = {
  default:
    'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] shadow-[var(--shadow-sm-soft)]',
  ghost:
    'text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]',
  outline:
    'border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--secondary)]',
  destructive:
    'bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:opacity-90',
}

const buttonSizes: Record<ButtonSize, string> = {
  default: 'h-9 px-4',
  sm: 'h-7 px-2.5 text-xs',
  icon: 'size-8',
}

function Button({ className, variant = 'default', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium',
        'transition-colors focus-visible:outline-2 focus-visible:outline-[var(--ring)]',
        'disabled:pointer-events-none disabled:opacity-40',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
}

/* ------------------------------------------------------------------ */
/* Tooltip + IconButton                                                */
/* ------------------------------------------------------------------ */

function Tooltip({
  label,
  side = 'bottom',
  children,
}: {
  label: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  children: ReactNode
}) {
  const positions: Record<string, string> = {
    top: 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
    bottom: 'top-full left-1/2 mt-1.5 -translate-x-1/2',
    left: 'right-full top-1/2 mr-1.5 -translate-y-1/2',
    right: 'left-full top-1/2 ml-1.5 -translate-y-1/2',
  }
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md px-2 py-1',
          'bg-[var(--foreground)] text-[11px] font-medium text-[var(--background)]',
          'opacity-0 shadow-[var(--shadow-md-soft)] transition-opacity duration-100',
          'group-hover/tooltip:opacity-100',
          positions[side],
        )}
      >
        {label}
      </span>
    </span>
  )
}

function IconButton({
  label,
  side = 'bottom',
  className,
  ...props
}: ButtonProps & { label: string; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <Tooltip label={label} side={side}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        className={className}
        {...props}
      />
    </Tooltip>
  )
}

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

const inputClass =
  'h-8 w-full rounded-lg border border-[var(--input)] bg-transparent px-2.5 text-sm ' +
  'text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] ' +
  'focus-visible:border-[var(--primary)] focus-visible:outline-none transition-colors'

function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />
}

function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(inputClass, 'h-auto min-h-16 resize-y py-1.5', className)}
      {...props}
    />
  )
}

function Select({
  className,
  children,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={cn(inputClass, 'cursor-pointer pr-6', className)}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </select>
  )
}

/** Row with a label on the left and a control on the right */
function Field({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="w-20 shrink-0 text-xs text-[var(--muted-foreground)]">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
    </div>
  )
}

/** Section heading inside the properties panel */
function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="mb-2 mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
      <span className="h-3 w-0.5 rounded-full bg-[var(--primary)]" />
      {title}
    </h3>
  )
}

export { Button, Tooltip, IconButton, Input, Textarea, Select, Field, SectionTitle, inputClass }
