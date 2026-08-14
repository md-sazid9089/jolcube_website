import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Check, Info, X } from 'lucide-react'
import { cx } from './primitives'

type Tone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  title: string
  body?: string
  tone: Tone
}

interface ToastCtx {
  toast: (t: { title: string; body?: string; tone?: Tone }) => void
}

const Ctx = createContext<ToastCtx | null>(null)

const ICONS: Record<Tone, ReactNode> = {
  success: <Check className="size-4" />,
  error: <AlertTriangle className="size-4" />,
  info: <Info className="size-4" />,
}

const TONES: Record<Tone, string> = {
  success: 'text-emerald-600 bg-emerald-50',
  error: 'text-rose-600 bg-rose-50',
  info: 'text-water-600 bg-water-50',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])

  const toast = useCallback<ToastCtx['toast']>(
    ({ title, body, tone = 'success' }) => {
      const id = ++idRef.current
      setToasts((ts) => [...ts.slice(-2), { id, title, body, tone }])
      window.setTimeout(() => remove(id), 4200)
    },
    [remove],
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="animate-slide-up pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-ink-200 bg-white p-3.5 shadow-lg shadow-ink-900/5"
          >
            <span className={cx('mt-0.5 grid size-7 shrink-0 place-items-center rounded-full', TONES[t.tone])}>
              {ICONS[t.tone]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-ink-900">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[12.5px] leading-snug text-ink-500">{t.body}</p>}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="rounded-md p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx.toast
}
