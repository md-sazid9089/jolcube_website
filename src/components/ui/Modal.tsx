import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button, cx } from './primitives'
import { useI18n } from '@/i18n/I18nProvider'

/**
 * A centred dialog on desktop, a bottom sheet on mobile — the pattern the
 * Jol Apa and household interfaces use for every confirmation.
 */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  hideClose,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  hideClose?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-md', lg: 'sm:max-w-2xl' }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center sm:items-center">
      <div className="animate-fade absolute inset-0 bg-ink-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cx(
          'animate-slide-up relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl',
          widths[size],
        )}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-ink-200 sm:hidden" />
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 sm:pt-5">
            <div className="min-w-0">
              {title && <h2 className="text-base font-semibold tracking-tight text-ink-900">{title}</h2>}
              {subtitle && <p className="mt-1 text-[13px] leading-snug text-ink-500">{subtitle}</p>}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="-mt-1 -mr-1 shrink-0 rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/** Confirmation dialog used before anything that changes money or state. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  tone = 'primary',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  body?: ReactNode
  confirmLabel?: string
  tone?: 'primary' | 'danger'
}) {
  const { t } = useI18n()
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('app.cancel')}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel ?? t('app.confirm')}
          </Button>
        </>
      }
    >
      {body && <p className="text-[13.5px] leading-relaxed text-ink-600">{body}</p>}
    </Modal>
  )
}
