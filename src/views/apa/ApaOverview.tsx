import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Droplet, Droplets, TrendingUp, Users, Wallet } from 'lucide-react'
import { Button, Card, SectionHeading, Stat, cx } from '@/components/ui/primitives'
import { AreaChart } from '@/components/ui/charts'
import { SensorGrid } from '@/components/domain/SensorGrid'
import { AlertCard } from '@/components/domain/AlertCard'
import { MaintenanceModal } from '@/components/domain/MaintenanceModal'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { alertsOf, cubeById, lastNDays, operatorOf, summarise } from '@/store/selectors'
import { CubePicker } from './ApaLayout'
import type { ComponentState } from '@/data/types'

export function ApaOverview() {
  const { t, b, money, n, date } = useI18n()
  const { state, resolveAlert } = useApp()
  const toast = useToast()
  const cube = cubeById(state, state.activeCubeId)!
  const s = summarise(state, cube.id)!
  const apa = operatorOf(state, cube.id)
  const open = alertsOf(state, cube.id).filter((a) => a.status === 'open')
  const [maint, setMaint] = useState<{ component?: ComponentState['key']; alertId?: string } | null>(null)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'apa.goodMorning' : hour < 17 ? 'apa.goodAfternoon' : 'apa.goodEvening'
  const headline =
    cube.status === 'healthy'
      ? 'apa.systemWorking'
      : cube.status === 'warning'
        ? 'apa.systemWarning'
        : 'apa.systemAttention'

  const trend = lastNDays(s.usage, 14).map((d) => ({
    label: date(d.date, { day: 'numeric', month: 'short' }),
    value: d.dispensedL,
  }))

  const activeToday = s.users.filter((u) => u.todayL > 0).length

  return (
    <div className="animate-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-ink-500">
            {t(greeting)}
            {apa ? `, ${b(apa.name)}` : ''}
          </p>
          <h1
            className={cx(
              'mt-0.5 text-xl font-semibold tracking-tight sm:text-[23px]',
              cube.status === 'healthy'
                ? 'text-ink-900'
                : cube.status === 'warning'
                  ? 'text-amber-700'
                  : 'text-rose-700',
            )}
          >
            {t(headline)}
          </h1>
          <p className="mt-1 text-[13px] text-ink-500">
            {b(cube.name)} · {b(cube.hostSite)}
          </p>
        </div>
        <div className="w-full sm:w-56 md:hidden">
          <CubePicker />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat
          label={t('apa.tankLevel')}
          value={`${Math.round((cube.sensors.tankL / cube.sensors.tankCapacityL) * 100)}%`}
          sub={`${n(cube.sensors.tankL)} / ${n(cube.sensors.tankCapacityL)} ${t('unit.litre')}`}
          icon={<Droplets className="size-4" />}
          tone={cube.sensors.tankL / cube.sensors.tankCapacityL < 0.2 ? 'alert' : 'water'}
        />
        <Stat
          label={t('apa.producedToday')}
          value={n(s.today.producedL)}
          sub={t('unit.litres')}
          icon={<TrendingUp className="size-4" />}
        />
        <Stat
          label={t('apa.dispensedToday')}
          value={n(s.today.dispensedL)}
          sub={t('unit.litres')}
          icon={<Droplet className="size-4" />}
        />
        <Stat
          label={t('apa.usersServed')}
          value={n(activeToday)}
          sub={`${t('app.of')} ${n(s.users.length)}`}
          icon={<Users className="size-4" />}
        />
        <Stat
          label={t('apa.revenueToday')}
          value={money(s.today.revenueBdt)}
          sub={`${t('app.week')}: ${money(s.week.revenueBdt)}`}
          icon={<Wallet className="size-4" />}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <SensorGrid cube={cube} />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-4 sm:p-5 lg:col-span-3">
          <SectionHeading
            title={t('apa.dispensing')}
            hint={t('apa.trend')}
            action={
              <Link to="/apa/water">
                <Button size="sm" variant="ghost">
                  {t('app.viewDetails')}
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          />
          <AreaChart data={trend} format={(v) => `${n(v)} ${t('unit.litre')}`} />
        </Card>

        <Card className="p-4 sm:p-5 lg:col-span-2">
          <SectionHeading
            title={t('apa.alertsTitle')}
            action={
              <Link to="/apa/alerts">
                <Button size="sm" variant="ghost">
                  {t('app.viewDetails')}
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          />
          {open.length === 0 ? (
            <p className="rounded-xl bg-emerald-50 p-4 text-[13px] leading-relaxed text-emerald-800">
              {t('apa.noAlerts')}
            </p>
          ) : (
            <div className="space-y-2.5">
              {open.slice(0, 3).map((a) => (
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
                  compact
                />
              ))}
            </div>
          )}
        </Card>
      </div>

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
