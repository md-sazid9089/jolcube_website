import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import type { Health } from '@/data/types'
import { useI18n } from '@/i18n/I18nProvider'

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ Button */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 shadow-sm',
  secondary: 'bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 hover:border-ink-300',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  subtle: 'bg-water-600 text-white hover:bg-water-700 shadow-sm',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-5 text-base gap-2.5 rounded-2xl',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={cx(
        'inline-flex items-center justify-center font-medium transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

/* -------------------------------------------------------------------- Card */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cx('card', className)}>
      {children}
    </div>
  )
}

export function SectionHeading({
  title,
  hint,
  action,
  className,
}: {
  title: ReactNode
  hint?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('mb-3 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink-900">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] leading-snug text-ink-500">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------- Badge */
export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'neutral' | 'water' | 'good' | 'warn' | 'bad' | 'info' | 'earth'
  children: ReactNode
  className?: string
}) {
  const tones = {
    neutral: 'bg-ink-100 text-ink-600',
    water: 'bg-water-50 text-water-700',
    good: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-700',
    bad: 'bg-rose-50 text-rose-700',
    info: 'bg-sky-50 text-sky-700',
    earth: 'bg-earth-50 text-earth-700',
  }
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ------------------------------------------------------------- StatusPill */
export const healthTone: Record<Health, 'good' | 'warn' | 'bad' | 'neutral'> = {
  healthy: 'good',
  warning: 'warn',
  attention: 'bad',
  offline: 'neutral',
}

const DOT: Record<Health, string> = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-500',
  attention: 'bg-rose-500',
  offline: 'bg-ink-400',
}

export function StatusDot({ status, pulse }: { status: Health; pulse?: boolean }) {
  return (
    <span className="relative inline-flex size-2 shrink-0">
      {pulse && status !== 'healthy' && (
        <span className={cx('absolute inline-flex size-full animate-ping rounded-full opacity-60', DOT[status])} />
      )}
      <span className={cx('relative inline-flex size-2 rounded-full', DOT[status])} />
    </span>
  )
}

export function StatusPill({ status, className }: { status: Health; className?: string }) {
  const { t } = useI18n()
  const label = t(`status.${status}` as 'status.healthy')
  return (
    <Badge tone={healthTone[status]} className={className}>
      <StatusDot status={status} pulse />
      {label}
    </Badge>
  )
}

/* -------------------------------------------------------------------- Stat */
export function Stat({
  label,
  value,
  sub,
  icon,
  tone,
  className,
}: {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'water' | 'alert'
  className?: string
}) {
  return (
    <div
      className={cx(
        'card p-4 transition-colors duration-150 hover:border-ink-300',
        tone === 'alert' && 'border-rose-200 bg-rose-50/40',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12.5px] font-medium text-ink-500">{label}</p>
        {icon && (
          <span className={cx('text-ink-300', tone === 'water' && 'text-water-500', tone === 'alert' && 'text-rose-400')}>
            {icon}
          </span>
        )}
      </div>
      <p className="tnum mt-1.5 text-[26px] leading-none font-semibold tracking-tight text-ink-900">{value}</p>
      {sub && <p className="mt-1.5 text-[12.5px] leading-snug text-ink-500">{sub}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------- Meter */
export function Meter({
  value,
  tone = 'water',
  className,
}: {
  /** 0–100 */
  value: number
  tone?: 'water' | 'good' | 'warn' | 'bad' | 'ink'
  className?: string
}) {
  const colors = {
    water: 'bg-water-500',
    good: 'bg-emerald-500',
    warn: 'bg-amber-500',
    bad: 'bg-rose-500',
    ink: 'bg-ink-800',
  }
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-ink-100', className)}>
      <div
        className={cx('h-full rounded-full transition-[width] duration-500 ease-out', colors[tone])}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ Empty */
export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  body?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {icon && <div className="mb-3 text-ink-300">{icon}</div>}
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {body && <p className="mt-1 max-w-xs text-[13px] leading-relaxed text-ink-500">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/* --------------------------------------------------------------- Skeleton */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-lg bg-ink-100', className)} />
}

/* ------------------------------------------------------------- Field bits */
export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-medium text-ink-600">
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:border-water-500 focus:outline-none'
