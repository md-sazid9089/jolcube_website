import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Droplet, Droplets, Gauge, Users } from 'lucide-react'
import { AreaChart } from '@/components/ui/charts'
import { Badge, Card, EmptyState, SectionHeading, Stat, cx } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { cubeById, lastNDays, summarise } from '@/store/selectors'

export function ApaWater() {
  const { t, b, n, date } = useI18n()
  const { state } = useApp()
  const cube = cubeById(state, state.activeCubeId)!
  const s = summarise(state, cube.id)!
  const [range, setRange] = useState<7 | 30>(7)

  const series = useMemo(
    () =>
      lastNDays(s.usage, range).map((d) => ({
        label: date(d.date, { day: 'numeric', month: 'short' }),
        value: d.dispensedL,
        compare: d.producedL,
      })),
    [s.usage, range, date],
  )

  // Households whose draw today is far from their own monthly pattern.
  const unusual = useMemo(() => {
    const dayOfMonth = new Date().getDate()
    return s.users
      .map((u) => {
        const baseline = u.monthL / Math.max(1, dayOfMonth)
        const ratio = baseline > 0 ? u.todayL / baseline : 0
        return { user: u, baseline, ratio }
      })
      .filter((x) => x.baseline > 4 && (x.ratio > 2.1 || (x.ratio < 0.25 && x.user.todayL > 0)))
      .sort((a, x) => x.ratio - a.ratio)
      .slice(0, 6)
  }, [s.users])

  return (
    <div className="animate-in space-y-4">
      <PageHeader title={t('apa.waterTitle')} subtitle={`${b(cube.name)} · ${b(cube.configuration)}`} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t('apa.litresProduced')}
          value={n(s.today.producedL)}
          sub={`${t('app.week')}: ${n(s.week.producedL)}`}
          icon={<Droplets className="size-4" />}
          tone="water"
        />
        <Stat
          label={t('apa.litresDispensed')}
          value={n(s.today.dispensedL)}
          sub={`${t('app.week')}: ${n(s.week.dispensedL)}`}
          icon={<Droplet className="size-4" />}
        />
        <Stat
          label={t('apa.avgHousehold')}
          value={n(s.avgHouseholdL, 1)}
          sub={`${t('unit.litres')}${t('unit.perDay')}`}
          icon={<Users className="size-4" />}
        />
        <Stat
          label={t('apa.tankLevel')}
          value={`${Math.round((cube.sensors.tankL / cube.sensors.tankCapacityL) * 100)}%`}
          sub={`${n(cube.sensors.tankL)} ${t('unit.litre')}`}
          icon={<Gauge className="size-4" />}
        />
      </div>

      <Card className="p-4 sm:p-5">
        <SectionHeading
          title={t('apa.trend')}
          hint={`${t('apa.production')} ⋯ · ${t('apa.dispensing')} —`}
          action={
            <div className="flex rounded-lg border border-ink-200 p-0.5">
              {([7, 30] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cx(
                    'rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors',
                    range === r ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-900',
                  )}
                >
                  {t(r === 7 ? 'apa.trend7' : 'apa.trend30')}
                </button>
              ))}
            </div>
          }
        />
        <AreaChart data={series} showCompare format={(v) => `${n(v)} ${t('unit.litre')}`} height={210} />
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionHeading title={t('apa.unusualUse')} hint={t('apa.avgHousehold')} />
        {unusual.length === 0 ? (
          <EmptyState icon={<Droplet className="size-7" />} title={t('apa.unusualEmpty')} />
        ) : (
          <ul className="divide-y divide-ink-100">
            {unusual.map(({ user, baseline, ratio }) => {
              const high = ratio > 1
              return (
                <li key={user.id} className="flex items-center gap-3 py-3">
                  <span
                    className={cx(
                      'grid size-8 shrink-0 place-items-center rounded-lg',
                      high ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600',
                    )}
                  >
                    {high ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium text-ink-900">{b(user.name)}</p>
                    <p className="tnum text-[12px] text-ink-500">
                      {user.id} · {t('apa.avgHousehold')} {n(baseline, 1)} {t('unit.litre')}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-[13.5px] font-semibold text-ink-900">
                      {n(user.todayL)} {t('unit.litre')}
                    </p>
                    <Badge tone={high ? 'warn' : 'info'}>
                      {t(high ? 'apa.unusualHigh' : 'apa.unusualLow')}
                    </Badge>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
