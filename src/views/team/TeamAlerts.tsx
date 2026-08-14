import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellOff } from 'lucide-react'
import { Card, EmptyState, cx } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { AlertCard } from '@/components/domain/AlertCard'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import type { Alert } from '@/data/types'

type Sev = Alert['severity'] | 'all'
type Stat = Alert['status'] | 'all'

function FilterRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ key: string; label: string; count?: number }>
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11.5px] font-medium tracking-wide text-ink-400 uppercase">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cx(
              'rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors',
              value === o.key
                ? 'border-ink-900 bg-ink-900 text-white'
                : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
            )}
          >
            {o.label}
            {o.count !== undefined && <span className="tnum ml-1 opacity-60">{o.count}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TeamAlerts() {
  const { t, b, n } = useI18n()
  const { state, resolveAlert, setActiveCube } = useApp()
  const toast = useToast()
  const navigate = useNavigate()
  const [sev, setSev] = useState<Sev>('all')
  const [loc, setLoc] = useState<string>('all')
  const [status, setStatus] = useState<Stat>('open')

  const filtered = useMemo(
    () =>
      state.alerts
        .filter((a) => (sev === 'all' || a.severity === sev) && (loc === 'all' || a.cubeId === loc) && (status === 'all' || a.status === status))
        .sort((a, x) => x.createdAt.localeCompare(a.createdAt)),
    [state.alerts, sev, loc, status],
  )

  const cubeName = (id: string) => b(state.cubes.find((c) => c.id === id)?.name)
  const countBy = (fn: (a: Alert) => boolean) => state.alerts.filter(fn).length

  return (
    <div className="animate-in space-y-4">
      <PageHeader
        title={t('team.remoteAlerts')}
        subtitle={`${n(countBy((a) => a.status === 'open'))} ${t('status.open').toLowerCase()} · ${t('team.subtitle')}`}
      />

      <Card className="space-y-3 p-4">
        <FilterRow
          label={t('team.filter.severity')}
          value={sev}
          onChange={(v) => setSev(v as Sev)}
          options={[
            { key: 'all', label: t('app.all') },
            { key: 'critical', label: t('alert.severity.critical'), count: countBy((a) => a.severity === 'critical') },
            { key: 'warning', label: t('alert.severity.warning'), count: countBy((a) => a.severity === 'warning') },
            { key: 'info', label: t('alert.severity.info'), count: countBy((a) => a.severity === 'info') },
          ]}
        />
        <FilterRow
          label={t('team.filter.location')}
          value={loc}
          onChange={setLoc}
          options={[
            { key: 'all', label: t('app.all') },
            ...state.cubes.map((c) => ({
              key: c.id,
              label: b(c.district),
              count: countBy((a) => a.cubeId === c.id),
            })),
          ]}
        />
        <FilterRow
          label={t('team.filter.status')}
          value={status}
          onChange={(v) => setStatus(v as Stat)}
          options={[
            { key: 'open', label: t('status.open'), count: countBy((a) => a.status === 'open') },
            { key: 'resolved', label: t('status.resolved'), count: countBy((a) => a.status === 'resolved') },
            { key: 'all', label: t('app.all') },
          ]}
        />
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<BellOff className="size-7" />} title={t('team.noAlerts')} />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a) => (
            <AlertCard
              key={a.id}
              alert={a}
              location={cubeName(a.cubeId)}
              onOpen={() => navigate(`/team/cubes/${a.cubeId}`)}
              onMaintenance={
                a.component
                  ? () => {
                      setActiveCube(a.cubeId)
                      navigate('/apa/maintenance')
                    }
                  : undefined
              }
              onResolve={() => {
                resolveAlert(a.id)
                toast({ title: t('apa.alertResolved'), body: cubeName(a.cubeId), tone: 'info' })
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
