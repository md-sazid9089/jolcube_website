import { useMemo } from 'react'
import { Droplet } from 'lucide-react'
import { BarChart } from '@/components/ui/charts'
import { Card, EmptyState, SectionHeading } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { dayOffset } from '@/lib/date'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { cubeById, txnsOfUser, userById } from '@/store/selectors'

export function UserUsage() {
  const { t, money, n, date } = useI18n()
  const { state } = useApp()
  const user = userById(state, state.activeUserId)!
  const cube = cubeById(state, user.cubeId)!
  const txns = txnsOfUser(state, user.id)

  const days = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 13; i >= 0; i--) map.set(dayOffset(-i), 0)
    for (const tx of txns) {
      if (tx.type !== 'dispense') continue
      const d = tx.ts.slice(0, 10)
      if (map.has(d)) map.set(d, (map.get(d) ?? 0) + tx.litres)
    }
    return [...map.entries()].map(([d, v]) => ({ label: date(d, { day: 'numeric', month: 'short' }), value: v }))
  }, [txns, date])

  const total14 = days.reduce((a, d) => a + d.value, 0)
  const avg = total14 / 14
  const monthSpend = txns
    .filter((tx) => tx.type === 'topup' && tx.ts.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((a, tx) => a + tx.amountBdt, 0)

  return (
    <div className="animate-in space-y-4">
      <PageHeader title={t('user.usageTitle')} subtitle={t('user.usage14')} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-[12px] font-medium text-ink-500">{t('user.todayUsage')}</p>
          <p className="tnum mt-1 text-xl font-semibold text-ink-900">
            {n(user.todayL)} {t('unit.litre')}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-medium text-ink-500">{t('user.avgPerDay')}</p>
          <p className="tnum mt-1 text-xl font-semibold text-ink-900">
            {n(avg, 1)} {t('unit.litre')}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-medium text-ink-500">{t('user.perPerson')}</p>
          <p className="tnum mt-1 text-xl font-semibold text-ink-900">
            {n(avg / user.householdSize, 1)} {t('unit.litre')}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-medium text-ink-500">{t('user.monthSpend')}</p>
          <p className="tnum mt-1 text-xl font-semibold text-ink-900">{money(monthSpend)}</p>
        </Card>
      </div>

      <Card className="p-4 sm:p-5">
        <SectionHeading title={t('user.usage14')} hint={`${t('user.monthUsage')}: ${n(user.monthL)} ${t('unit.litres')}`} />
        {total14 === 0 ? (
          <EmptyState icon={<Droplet className="size-7" />} title={t('user.usageEmpty')} />
        ) : (
          <BarChart data={days} format={(v) => `${n(v)} ${t('unit.litre')}`} height={180} />
        )}
      </Card>

      <Card className="p-4">
        <p className="text-[12.5px] leading-relaxed text-ink-500">
          {t('user.price')}: <span className="tnum font-medium text-ink-800">{money(cube.pricePerL, 2)}</span>/
          {t('unit.litre')} · {t('user.serviceFee')}:{' '}
          <span className="tnum font-medium text-ink-800">{money(cube.serviceFeeBdt)}</span>
        </p>
      </Card>
    </div>
  )
}
