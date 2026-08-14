import { Wrench } from 'lucide-react'
import { Badge, Button, Meter, StatusPill } from '@/components/ui/primitives'
import { daysUntil } from '@/lib/date'
import { useI18n } from '@/i18n/I18nProvider'
import type { ComponentState, JolCube } from '@/data/types'

export function ComponentHealthList({
  cube,
  onRecord,
}: {
  cube: JolCube
  onRecord?: (component: ComponentState['key']) => void
}) {
  const { t, n, date } = useI18n()

  return (
    <ul className="divide-y divide-ink-100">
      {cube.components.map((c) => {
        const due = daysUntil(c.nextService)
        const overdue = due < 0
        return (
          <li key={c.key} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[13.5px] font-semibold text-ink-900">{t(`comp.${c.key}` as 'comp.uv')}</p>
                <StatusPill status={c.status} />
                {overdue ? (
                  <Badge tone="bad">
                    {t('apa.overdueBy')} {n(Math.abs(due))} {t('apa.days')}
                  </Badge>
                ) : due <= 14 ? (
                  <Badge tone="warn">
                    {t('apa.dueIn')} {n(due)} {t('apa.days')}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 text-[12px] text-ink-500">
                {t('apa.lastMaint')}: {date(c.lastService)} · {t('apa.nextMaint')}: {date(c.nextService)}
              </p>
              <div className="mt-2 flex items-center gap-2.5">
                <Meter
                  value={c.life}
                  tone={c.life < 20 ? 'bad' : c.life < 45 ? 'warn' : 'good'}
                  className="max-w-56 flex-1"
                />
                <span className="tnum shrink-0 text-[11.5px] text-ink-500">
                  {n(c.life)}% {t('apa.serviceLife')}
                </span>
              </div>
            </div>
            {onRecord && (
              <Button size="sm" variant="secondary" className="shrink-0" onClick={() => onRecord(c.key)}>
                <Wrench className="size-3.5" />
                {t('apa.recordMaint')}
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
