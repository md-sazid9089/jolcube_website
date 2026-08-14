import { useState } from 'react'
import { BellOff } from 'lucide-react'
import { Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { AlertCard } from '@/components/domain/AlertCard'
import { MaintenanceModal } from '@/components/domain/MaintenanceModal'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { alertsOf, cubeById, operatorOf } from '@/store/selectors'
import type { ComponentState } from '@/data/types'

export function ApaAlerts() {
  const { t, b } = useI18n()
  const { state, resolveAlert } = useApp()
  const toast = useToast()
  const cube = cubeById(state, state.activeCubeId)!
  const apa = operatorOf(state, cube.id)
  const alerts = alertsOf(state, cube.id)
  const open = alerts.filter((a) => a.status === 'open')
  const resolved = alerts.filter((a) => a.status === 'resolved')
  const [maint, setMaint] = useState<{ component?: ComponentState['key']; alertId?: string } | null>(null)

  return (
    <div className="animate-in space-y-4">
      <PageHeader title={t('apa.alertsTitle')} subtitle={b(cube.name)} />

      {open.length === 0 ? (
        <Card>
          <EmptyState icon={<BellOff className="size-7" />} title={t('apa.noAlerts')} />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {open.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              onMaintenance={
                a.component ? () => setMaint({ component: a.component, alertId: a.id }) : undefined
              }
              onResolve={() => {
                resolveAlert(a.id)
                toast({ title: t('apa.alertResolved'), tone: 'info' })
              }}
            />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <SectionHeading title={t('apa.resolvedAlerts')} />
          <div className="space-y-2.5">
            {resolved.map((a) => (
              <AlertCard key={a.id} alert={a} />
            ))}
          </div>
        </div>
      )}

      <MaintenanceModal
        open={!!maint}
        onClose={() => setMaint(null)}
        cubeId={cube.id}
        defaultComponent={maint?.component}
        resolveAlertId={maint?.alertId}
        operatorName={apa ? apa.name.en : undefined}
      />
    </div>
  )
}
