import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, CalendarClock, ExternalLink, Wrench } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Meter, SectionHeading, Stat, StatusPill } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { daysBetween, daysUntil, today } from '@/lib/date'
import type { ComponentState, JolCube } from '@/data/types'

interface DueRow {
  cube: JolCube
  component: ComponentState
  due: number
}

export function TeamMaintenance() {
  const { t, b, n, money, date } = useI18n()
  const { state, setActiveCube } = useApp()
  const navigate = useNavigate()

  const dueRows = useMemo<DueRow[]>(
    () =>
      state.cubes
        .flatMap((cube) => cube.components.map((component) => ({ cube, component, due: daysUntil(component.nextService) })))
        .filter((r) => r.due <= 30 || r.component.status !== 'healthy')
        .sort((a, x) => a.due - x.due),
    [state.cubes],
  )

  const recent = useMemo(
    () => [...state.maintenance].sort((a, x) => x.date.localeCompare(a.date)).slice(0, 30),
    [state.maintenance],
  )

  const last90 = state.maintenance.filter((r) => daysBetween(r.date, today()) <= 90)
  const spend90 = last90.reduce((a, r) => a + r.costBdt, 0)
  const overdueCount = dueRows.filter((r) => r.due < 0).length

  const openApa = (cubeId: string) => {
    setActiveCube(cubeId)
    navigate('/apa/maintenance')
  }

  const cubeLabel = (id: string) => {
    const c = state.cubes.find((x) => x.id === id)
    return c ? `${b(c.name)} · ${b(c.district)}` : id
  }

  return (
    <div className="animate-in space-y-4">
      <PageHeader title={t('team.maintTitle')} subtitle={t('team.subtitle')} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label={t('team.maintFreq')}
          value={n(last90.length)}
          sub={t('team.maintFreqNote')}
          icon={<Wrench className="size-4" />}
        />
        <Stat
          label={t('detail.maintCost')}
          value={money(spend90)}
          sub={t('app.simulated')}
          icon={<Banknote className="size-4" />}
        />
        <Stat
          label={t('alert.maintenance_overdue')}
          value={n(overdueCount)}
          sub={t('team.upcoming')}
          icon={<CalendarClock className="size-4" />}
          tone={overdueCount > 0 ? 'alert' : 'default'}
        />
      </div>

      <Card className="p-4 sm:p-5">
        <SectionHeading title={t('team.upcoming')} hint={t('app.simulatedNote')} />
        {dueRows.length === 0 ? (
          <EmptyState icon={<CalendarClock className="size-7" />} title={t('app.noResults')} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {dueRows.map(({ cube, component, due }) => (
              <li
                key={`${cube.id}-${component.key}`}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold text-ink-900">
                      {t(`comp.${component.key}` as 'comp.uv')}
                    </p>
                    <StatusPill status={component.status} />
                    {due < 0 ? (
                      <Badge tone="bad">
                        {t('apa.overdueBy')} {n(Math.abs(due))} {t('apa.days')}
                      </Badge>
                    ) : (
                      <Badge tone={due <= 14 ? 'warn' : 'neutral'}>
                        {t('apa.dueIn')} {n(due)} {t('apa.days')}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[12px] text-ink-500">
                    {b(cube.name)} · {b(cube.district)} · {t('apa.nextMaint')}: {date(component.nextService)}
                  </p>
                  <div className="mt-2 flex items-center gap-2.5">
                    <Meter
                      value={component.life}
                      tone={component.life < 20 ? 'bad' : component.life < 45 ? 'warn' : 'good'}
                      className="max-w-56 flex-1"
                    />
                    <span className="tnum shrink-0 text-[11.5px] text-ink-500">
                      {n(component.life)}% {t('apa.serviceLife')}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="shrink-0" onClick={() => openApa(cube.id)}>
                  <ExternalLink className="size-3.5" />
                  {t('team.openDashboard')}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionHeading title={t('team.recentWork')} hint={`${n(recent.length)}`} />
        {recent.length === 0 ? (
          <EmptyState icon={<Wrench className="size-7" />} title={t('app.noResults')} />
        ) : (
          <ol className="relative space-y-0 border-l border-ink-200 pl-5">
            {recent.map((r) => (
              <li key={r.id} className="relative py-3">
                <span className="absolute top-5 -left-[1.4rem] size-2 rounded-full bg-ink-300 ring-4 ring-white" />
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-medium text-ink-900">
                      {b(r.action)}
                      {r.demo && <Badge tone="water">{t('app.demoEntry')}</Badge>}
                    </p>
                    <p className="mt-0.5 text-[12px] text-ink-500">
                      {cubeLabel(r.cubeId)} · {t(`comp.${r.component}` as 'comp.uv')} · {r.by}
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
    </div>
  )
}
