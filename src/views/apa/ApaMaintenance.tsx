import { useState } from 'react'
import { Plus, Wrench } from 'lucide-react'
import { Badge, Button, Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { ComponentHealthList } from '@/components/domain/ComponentHealth'
import { MaintenanceModal } from '@/components/domain/MaintenanceModal'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { cubeById, maintenanceOf, operatorOf } from '@/store/selectors'
import type { ComponentState } from '@/data/types'

export function ApaMaintenance() {
  const { t, b, money, date } = useI18n()
  const { state } = useApp()
  const cube = cubeById(state, state.activeCubeId)!
  const apa = operatorOf(state, cube.id)
  const records = maintenanceOf(state, cube.id)
  const [open, setOpen] = useState<{ component?: ComponentState['key'] } | null>(null)

  return (
    <div className="animate-in space-y-4">
      <PageHeader
        title={t('apa.maintTitle')}
        subtitle={b(cube.name)}
        action={
          <Button variant="primary" onClick={() => setOpen({})}>
            <Plus className="size-4" />
            {t('apa.newRecord')}
          </Button>
        }
      />

      <Card className="p-4 sm:p-5">
        <SectionHeading title={t('apa.componentHealth')} hint={t('app.simulatedNote')} />
        <ComponentHealthList cube={cube} onRecord={(component) => setOpen({ component })} />
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionHeading title={t('apa.history')} hint={`${records.length}`} />
        {records.length === 0 ? (
          <EmptyState icon={<Wrench className="size-7" />} title={t('apa.noMaint')} />
        ) : (
          <ol className="relative space-y-0 border-l border-ink-200 pl-5">
            {records.map((r) => (
              <li key={r.id} className="relative py-3">
                <span className="absolute top-5 -left-[1.4rem] size-2 rounded-full bg-ink-300 ring-4 ring-white" />
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-ink-900">
                      {b(r.action)}
                      {r.demo && <Badge tone="water">{t('app.demoEntry')}</Badge>}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-500">
                      {t(`comp.${r.component}` as 'comp.uv')} · {r.by}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[12.5px] font-medium text-ink-700">{date(r.date)}</p>
                    <p className="tnum text-[12px] text-ink-500">{money(r.costBdt)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <MaintenanceModal
        open={!!open}
        onClose={() => setOpen(null)}
        cubeId={cube.id}
        defaultComponent={open?.component}
        operatorName={apa ? apa.name.en : undefined}
      />
    </div>
  )
}
