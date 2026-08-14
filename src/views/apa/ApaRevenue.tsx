import { useMemo } from 'react'
import { Banknote, Smartphone, Wallet } from 'lucide-react'
import { BarChart, StackBar } from '@/components/ui/charts'
import { Card, SectionHeading, Stat } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { cubeById, lastNDays, summarise } from '@/store/selectors'

export function ApaRevenue() {
  const { t, b, money, n, date } = useI18n()
  const { state } = useApp()
  const cube = cubeById(state, state.activeCubeId)!
  const s = summarise(state, cube.id)!

  const series = useMemo(
    () =>
      lastNDays(s.usage, 14).map((d) => ({
        label: date(d.date, { day: 'numeric', month: 'short' }),
        value: d.revenueBdt,
      })),
    [s.usage, date],
  )

  const mix = [
    { label: t('user.pay.bkash'), value: s.month.bkashBdt, color: '#E2136E' },
    { label: t('user.pay.nagad'), value: s.month.nagadBdt, color: '#EE7623' },
    { label: t('user.pay.cash'), value: s.month.cashBdt, color: '#0d8071' },
  ]

  return (
    <div className="animate-in space-y-4">
      <PageHeader title={t('apa.revenueTitle')} subtitle={t('apa.revenueNote')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t('app.today')} value={money(s.today.revenueBdt)} icon={<Wallet className="size-4" />} tone="water" />
        <Stat label={t('app.week')} value={money(s.week.revenueBdt)} />
        <Stat label={t('app.month')} value={money(s.month.revenueBdt)} />
        <Stat
          label={t('apa.waterSold')}
          value={money(Math.round(s.month.dispensedL * cube.pricePerL))}
          sub={`${n(s.month.dispensedL)} ${t('unit.litres')} · ${money(cube.pricePerL, 2)}/${t('unit.litre')}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="p-4 sm:p-5 lg:col-span-3">
          <SectionHeading title={t('apa.revenueTrend')} hint={b(cube.name)} />
          <BarChart data={series} format={(v) => money(v)} height={190} />
        </Card>

        <Card className="p-4 sm:p-5 lg:col-span-2">
          <SectionHeading title={t('apa.byMethod')} hint={t('app.month')} />
          <StackBar segments={mix} />
          <ul className="mt-5 divide-y divide-ink-100">
            {[
              { icon: <Smartphone className="size-4" />, label: t('user.pay.bkash'), value: s.month.bkashBdt },
              { icon: <Smartphone className="size-4" />, label: t('user.pay.nagad'), value: s.month.nagadBdt },
              { icon: <Banknote className="size-4" />, label: t('user.pay.cash'), value: s.month.cashBdt },
            ].map((row) => (
              <li key={row.label} className="flex items-center gap-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-500">
                  {row.icon}
                </span>
                <span className="flex-1 text-[13.5px] text-ink-700">{row.label}</span>
                <span className="tnum text-[13.5px] font-semibold text-ink-900">{money(row.value)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <SectionHeading title={t('apa.operatingBalance')} hint={t('story.businessNote')} />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-ink-50 p-4">
            <p className="text-[12px] text-ink-500">{t('apa.operatingBalance')}</p>
            <p className="tnum mt-1 text-xl font-semibold text-ink-900">{money(cube.operatingBalanceBdt)}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4">
            <p className="text-[12px] text-ink-500">{t('apa.monthlyOpex')}</p>
            <p className="tnum mt-1 text-xl font-semibold text-ink-900">{money(cube.monthlyOpexBdt)}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-4">
            <p className="text-[12px] text-ink-500">{t('user.serviceFee')}</p>
            <p className="tnum mt-1 text-xl font-semibold text-ink-900">
              {money(cube.serviceFeeBdt)}
              <span className="text-[13px] font-medium text-ink-400"> × {n(s.users.length)}</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
