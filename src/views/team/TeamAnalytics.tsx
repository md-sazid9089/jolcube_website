import { useMemo } from 'react'
import { AreaChart, BarChart } from '@/components/ui/charts'
import { Card, Meter, SectionHeading, Stat } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { lastNDays, maintenanceOf, networkSeries, summariseNetwork } from '@/store/selectors'
import { daysBetween, today } from '@/lib/date'

export function TeamAnalytics() {
  const { t, b, money, n, litres, date } = useI18n()
  const { state } = useApp()
  const net = useMemo(() => summariseNetwork(state), [state])
  const series = useMemo(() => lastNDays(networkSeries(state), 30), [state])

  const label = (d: string) => date(d, { day: 'numeric', month: 'short' })
  const water = series.map((d) => ({ label: label(d.date), value: d.dispensedL, compare: d.producedL }))
  const revenue = series.map((d) => ({ label: label(d.date), value: d.revenueBdt }))
  const active = series.map((d) => ({ label: label(d.date), value: d.activeUsers }))

  const avgConsumption =
    net.perCube.reduce((a, c) => a + c.avgHouseholdL, 0) / Math.max(1, net.perCube.length)

  const maintByCube = state.cubes.map((c) => ({
    label: c.code,
    value: maintenanceOf(state, c.id).filter((r) => daysBetween(r.date, today()) <= 90).length,
  }))

  return (
    <div className="animate-in space-y-4">
      <PageHeader title={t('team.analytics')} subtitle={t('team.analyticsNote')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t('team.kpi.litres')} value={litres(net.litresTotal)} sub={t('apa.trend30')} tone="water" />
        <Stat label={t('team.kpi.revenue')} value={money(net.revenueMonth)} sub={t('app.month')} />
        <Stat
          label={t('team.avgConsumption')}
          value={`${n(avgConsumption, 1)} ${t('unit.litre')}`}
          sub={t('team.perHouseholdDay')}
        />
        <Stat label={t('team.systemUptime')} value={`${n(net.uptime30, 1)}%`} sub={t('apa.trend30')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4 sm:p-5">
          <SectionHeading title={t('team.waterOverTime')} hint={`${t('apa.production')} ⋯ · ${t('apa.dispensing')} —`} />
          <AreaChart data={water} showCompare format={(v) => `${n(v)} ${t('unit.litre')}`} height={210} />
        </Card>
        <Card className="p-4 sm:p-5">
          <SectionHeading title={t('team.revenueOverTime')} hint={t('apa.revenueNote')} />
          <BarChart data={revenue} format={(v) => money(v)} height={210} />
        </Card>
        <Card className="p-4 sm:p-5">
          <SectionHeading title={t('team.usersServed')} hint={t('apa.trend30')} />
          <AreaChart data={active} tone="emerald" format={(v) => n(v)} height={190} />
        </Card>
        <Card className="p-4 sm:p-5">
          <SectionHeading title={t('team.maintFreq')} hint={t('team.maintFreqNote')} />
          <BarChart data={maintByCube} tone="ink" format={(v) => n(v)} height={190} />
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <SectionHeading title={t('team.comparison')} hint={t('team.analyticsNote')} />
        <div className="space-y-4">
          {net.perCube.map((s) => {
            const share = (s.month.dispensedL / Math.max(1, net.perCube.reduce((a, c) => a + c.month.dispensedL, 0))) * 100
            return (
              <div key={s.cube.id}>
                <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium text-ink-900">
                    {b(s.cube.name)}
                    <span className="ml-2 text-[12px] font-normal text-ink-500">{b(s.cube.configuration)}</span>
                  </p>
                  <p className="tnum text-[12.5px] text-ink-500">
                    {n(s.month.dispensedL)} {t('unit.litre')} · {money(s.month.revenueBdt)} · {n(s.uptime30, 1)}%
                  </p>
                </div>
                <Meter
                  value={share}
                  tone={s.cube.status === 'attention' ? 'bad' : s.cube.status === 'warning' ? 'warn' : 'water'}
                />
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
