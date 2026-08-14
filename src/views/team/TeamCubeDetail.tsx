import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Calendar, MapPin, Users, Wrench } from 'lucide-react'
import { AreaChart, BarChart, StackBar } from '@/components/ui/charts'
import { Badge, Button, Card, EmptyState, SectionHeading, Stat, StatusPill, cx } from '@/components/ui/primitives'
import { SensorGrid } from '@/components/domain/SensorGrid'
import { ComponentHealthList } from '@/components/domain/ComponentHealth'
import { AlertCard } from '@/components/domain/AlertCard'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { alertsOf, lastNDays, maintenanceOf, operatorOf, summarise } from '@/store/selectors'
import { daysBetween, today } from '@/lib/date'

const TABS = ['system', 'water', 'financial', 'maintenance', 'alerts', 'users'] as const
type Tab = (typeof TABS)[number]

export function TeamCubeDetail() {
  const { id = '' } = useParams()
  const { t, b, money, n, date } = useI18n()
  const { state, setActiveCube } = useApp()
  const [tab, setTab] = useState<Tab>('system')

  const summary = summarise(state, id)
  const records = useMemo(() => maintenanceOf(state, id), [state, id])
  const alerts = useMemo(() => alertsOf(state, id), [state, id])

  if (!summary) {
    return (
      <Card>
        <EmptyState
          title={t('app.noResults')}
          action={
            <Link to="/team/cubes">
              <Button variant="secondary">{t('app.back')}</Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const { cube, users, usage, month, week } = summary
  const apa = operatorOf(state, cube.id)
  const waterSeries = lastNDays(usage, 30).map((d) => ({
    label: date(d.date, { day: 'numeric', month: 'short' }),
    value: d.dispensedL,
    compare: d.producedL,
  }))
  const revenueSeries = lastNDays(usage, 14).map((d) => ({
    label: date(d.date, { day: 'numeric', month: 'short' }),
    value: d.revenueBdt,
  }))
  const maint90 = records.filter((r) => daysBetween(r.date, today()) <= 90)
  const maintSpend = maint90.reduce((a, r) => a + r.costBdt, 0)
  const lowBalance = users.filter((u) => u.balanceBdt < 50).length
  const activeToday = users.filter((u) => u.todayL > 0).length
  const openA = alerts.filter((a) => a.status === 'open')
  const resolvedA = alerts.filter((a) => a.status === 'resolved')

  return (
    <div className="animate-in space-y-4">
      <Link
        to="/team/cubes"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-500 transition-colors hover:text-ink-900"
      >
        <ArrowLeft className="size-3.5" />
        {t('team.network')}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-[24px]">
              {t('app.name')} — {b(cube.name)}
            </h1>
            <StatusPill status={cube.status} />
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {b(cube.hostSite)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {t('detail.commissioned')} {date(cube.commissioned)}
            </span>
            {apa && (
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5" />
                {t('team.cube.operator')}: {b(apa.name)}
              </span>
            )}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Badge tone="water">{b(cube.configuration)}</Badge>
            <Badge tone="earth">{b(cube.hazard)}</Badge>
            <Badge tone="neutral">
              {t('detail.capex')}: {money(cube.capexBdt)}
            </Badge>
          </div>
        </div>

        <Link to="/apa" onClick={() => setActiveCube(cube.id)}>
          <Button variant="secondary">{t('team.openDashboard')}</Button>
        </Link>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cx(
              'shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors',
              tab === tb ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100',
            )}
          >
            {t(`detail.${tb}` as 'detail.system')}
            {tb === 'alerts' && openA.length > 0 && (
              <span className="tnum ml-1.5 opacity-70">{n(openA.length)}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'system' && (
        <div className="animate-fade space-y-4">
          <SensorGrid cube={cube} />
          <Card className="p-4 sm:p-5">
            <SectionHeading title={t('apa.componentHealth')} hint={b(cube.configuration)} />
            <ComponentHealthList cube={cube} />
          </Card>
        </div>
      )}

      {tab === 'water' && (
        <div className="animate-fade space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t('apa.litresProduced')} value={n(month.producedL)} sub={t('app.month')} tone="water" />
            <Stat label={t('apa.litresDispensed')} value={n(month.dispensedL)} sub={t('app.month')} />
            <Stat label={t('apa.avgHousehold')} value={n(summary.avgHouseholdL, 1)} sub={`${t('unit.litres')}${t('unit.perDay')}`} />
            <Stat label={t('team.systemUptime')} value={`${n(summary.uptime30, 1)}%`} sub={t('apa.trend30')} />
          </div>
          <Card className="p-4 sm:p-5">
            <SectionHeading title={t('apa.trend')} hint={`${t('apa.production')} ⋯ · ${t('apa.dispensing')} —`} />
            <AreaChart data={waterSeries} showCompare format={(v) => `${n(v)} ${t('unit.litre')}`} height={220} />
          </Card>
        </div>
      )}

      {tab === 'financial' && (
        <div className="animate-fade space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t('app.month')} value={money(month.revenueBdt)} icon={<Banknote className="size-4" />} tone="water" />
            <Stat label={t('app.week')} value={money(week.revenueBdt)} />
            <Stat label={t('detail.maintCost')} value={money(maintSpend)} sub={`${n(maint90.length)} ${t('team.maintFreq').toLowerCase()}`} />
            <Stat label={t('apa.operatingBalance')} value={money(cube.operatingBalanceBdt)} sub={`${t('apa.monthlyOpex')}: ${money(cube.monthlyOpexBdt)}`} />
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="p-4 sm:p-5 lg:col-span-3">
              <SectionHeading title={t('apa.revenueTrend')} hint={t('apa.revenueNote')} />
              <BarChart data={revenueSeries} format={(v) => money(v)} height={200} />
            </Card>
            <Card className="p-4 sm:p-5 lg:col-span-2">
              <SectionHeading title={t('detail.paymentMix')} hint={t('app.month')} />
              <StackBar
                segments={[
                  { label: t('user.pay.bkash'), value: month.bkashBdt, color: '#E2136E' },
                  { label: t('user.pay.nagad'), value: month.nagadBdt, color: '#EE7623' },
                  { label: t('user.pay.cash'), value: month.cashBdt, color: '#0d8071' },
                ]}
              />
              <p className="mt-5 text-[12.5px] leading-relaxed text-ink-500">{t('story.businessNote')}</p>
            </Card>
          </div>
        </div>
      )}

      {tab === 'maintenance' && (
        <Card className="animate-fade p-4 sm:p-5">
          <SectionHeading title={t('apa.history')} hint={`${n(records.length)}`} />
          {records.length === 0 ? (
            <EmptyState icon={<Wrench className="size-7" />} title={t('apa.noMaint')} />
          ) : (
            <ol className="relative border-l border-ink-200 pl-5">
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
      )}

      {tab === 'alerts' && (
        <div className="animate-fade space-y-4">
          <div>
            <SectionHeading title={t('status.open')} hint={`${n(openA.length)}`} />
            {openA.length === 0 ? (
              <Card>
                <EmptyState title={t('apa.noAlerts')} />
              </Card>
            ) : (
              <div className="space-y-2.5">
                {openA.map((a) => (
                  <AlertCard key={a.id} alert={a} location={b(cube.name)} />
                ))}
              </div>
            )}
          </div>
          {resolvedA.length > 0 && (
            <div>
              <SectionHeading title={t('status.resolved')} />
              <div className="space-y-2.5">
                {resolvedA.map((a) => (
                  <AlertCard key={a.id} alert={a} location={b(cube.name)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="animate-fade space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t('team.cube.users')} value={n(users.length)} icon={<Users className="size-4" />} />
            <Stat label={t('detail.activeToday')} value={n(activeToday)} sub={`${Math.round((activeToday / users.length) * 100)}%`} />
            <Stat
              label={t('detail.avgBalance')}
              value={money(Math.round(users.reduce((a, u) => a + u.balanceBdt, 0) / users.length))}
            />
            <Stat label={t('detail.lowBalanceUsers')} value={n(lowBalance)} tone={lowBalance > users.length * 0.2 ? 'alert' : 'default'} />
          </div>
          <Card className="p-4 sm:p-5">
            <SectionHeading title={t('detail.avgHouseholdSize')} hint={t('team.avgConsumption')} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="text-[12px] text-ink-500">{t('detail.avgHouseholdSize')}</p>
                <p className="tnum mt-1 text-xl font-semibold text-ink-900">
                  {n(users.reduce((a, u) => a + u.householdSize, 0) / users.length, 1)}
                </p>
              </div>
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="text-[12px] text-ink-500">{t('team.avgConsumption')}</p>
                <p className="tnum mt-1 text-xl font-semibold text-ink-900">
                  {n(summary.avgHouseholdL, 1)} {t('unit.litre')}
                </p>
              </div>
              <div className="rounded-xl bg-ink-50 p-4">
                <p className="text-[12px] text-ink-500">{t('user.price')}</p>
                <p className="tnum mt-1 text-xl font-semibold text-ink-900">
                  {money(cube.pricePerL, 2)}/{t('unit.litre')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
