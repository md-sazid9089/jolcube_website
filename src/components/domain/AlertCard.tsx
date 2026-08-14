import { AlertOctagon, AlertTriangle, Info, Wrench } from 'lucide-react'
import { Badge, Button, cx } from '@/components/ui/primitives'
import { useI18n } from '@/i18n/I18nProvider'
import type { Alert } from '@/data/types'

const SEVERITY = {
  critical: { icon: AlertOctagon, cls: 'text-rose-600 bg-rose-50', border: 'border-rose-200', tone: 'bad' },
  warning: { icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50', border: 'border-amber-200', tone: 'warn' },
  info: { icon: Info, cls: 'text-sky-600 bg-sky-50', border: 'border-sky-200', tone: 'info' },
} as const

export function AlertCard({
  alert,
  location,
  onResolve,
  onMaintenance,
  onOpen,
  compact,
}: {
  alert: Alert
  location?: string
  onResolve?: () => void
  onMaintenance?: () => void
  onOpen?: () => void
  compact?: boolean
}) {
  const { t, b, relative } = useI18n()
  const sev = SEVERITY[alert.severity]
  const Icon = sev.icon
  const resolved = alert.status === 'resolved'

  return (
    <div
      className={cx(
        'rounded-xl border bg-white p-3.5 transition-colors',
        resolved ? 'border-ink-200 opacity-70' : sev.border,
      )}
    >
      <div className="flex items-start gap-3">
        <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg', resolved ? 'bg-ink-100 text-ink-400' : sev.cls)}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[13.5px] font-semibold text-ink-900">
              {t(`alert.${alert.kind}` as 'alert.low_tank')}
            </p>
            {!resolved && (
              <Badge tone={sev.tone}>{t(`alert.severity.${alert.severity}` as 'alert.severity.info')}</Badge>
            )}
            {resolved && <Badge tone="neutral">{t('status.resolved')}</Badge>}
          </div>
          {!compact && alert.detail && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-600">{b(alert.detail)}</p>
          )}
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-ink-400">
            {location && <span className="font-medium text-ink-500">{location}</span>}
            {location && <span>·</span>}
            <span>{relative(resolved && alert.resolvedAt ? alert.resolvedAt : alert.createdAt)}</span>
          </p>

          {!resolved && (onResolve || onMaintenance || onOpen) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onOpen && (
                <Button size="sm" variant="secondary" onClick={onOpen}>
                  {t('app.viewDetails')}
                </Button>
              )}
              {onMaintenance && (
                <Button size="sm" variant="primary" onClick={onMaintenance}>
                  <Wrench className="size-3.5" />
                  {t('apa.markMaint')}
                </Button>
              )}
              {onResolve && (
                <Button size="sm" variant="ghost" onClick={onResolve}>
                  {t('apa.dismiss')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
