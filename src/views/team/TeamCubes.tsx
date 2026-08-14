import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Card, EmptyState, cx, inputClass } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { CubeCard } from '@/components/domain/CubeCard'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { maintenanceOf, summariseNetwork } from '@/store/selectors'
import type { Health } from '@/data/types'

const FILTERS: Array<Health | 'all'> = ['all', 'healthy', 'warning', 'attention']

export function TeamCubes() {
  const { t, b, n, money } = useI18n()
  const { state } = useApp()
  const net = useMemo(() => summariseNetwork(state), [state])
  const [status, setStatus] = useState<Health | 'all'>('all')
  const [query, setQuery] = useState('')

  const list = net.perCube.filter((s) => {
    if (status !== 'all' && s.cube.status !== status) return false
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      s.cube.name.en.toLowerCase().includes(q) ||
      s.cube.district.en.toLowerCase().includes(q) ||
      s.cube.name.bn.includes(query) ||
      s.cube.code.toLowerCase().includes(q)
    )
  })

  return (
    <div className="animate-in space-y-4">
      <PageHeader
        title={t('team.network')}
        subtitle={`${n(state.cubes.length)} ${t('team.deployments')} · ${t('team.subtitle')}`}
      />

      <Card className="flex flex-col gap-2.5 p-3.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
          <input
            className={inputClass + ' pl-9'}
            placeholder={t('app.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cx(
                'rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors',
                status === f
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
              )}
            >
              {f === 'all' ? t('app.all') : t(`status.${f}` as 'status.healthy')}
            </button>
          ))}
        </div>
      </Card>

      {list.length === 0 ? (
        <Card>
          <EmptyState title={t('app.noResults')} />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((s) => (
            <CubeCard key={s.cube.id} summary={s} lastMaintenance={maintenanceOf(state, s.cube.id)[0]?.date} />
          ))}
        </div>
      )}

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-ink-200 text-[11.5px] tracking-wide text-ink-500 uppercase">
              <th className="px-4 py-3 font-medium">{t('team.nav.cubes')}</th>
              <th className="px-4 py-3 font-medium">{t('team.cube.treatment')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('team.cube.users')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('team.cube.today')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('team.cube.revenue')}</th>
              <th className="px-4 py-3 text-right font-medium">{t('team.kpi.uptime')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {list.map((s) => (
              <tr key={s.cube.id} className="text-[13px] transition-colors hover:bg-ink-50/70">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{b(s.cube.name)}</p>
                  <p className="text-[12px] text-ink-500">{b(s.cube.district)}</p>
                </td>
                <td className="px-4 py-3 text-ink-600">{b(s.cube.configuration)}</td>
                <td className="tnum px-4 py-3 text-right text-ink-800">{n(s.users.length)}</td>
                <td className="tnum px-4 py-3 text-right text-ink-800">{n(s.today.dispensedL)}</td>
                <td className="tnum px-4 py-3 text-right text-ink-800">{money(s.month.revenueBdt)}</td>
                <td className="tnum px-4 py-3 text-right text-ink-800">{n(s.uptime30, 1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
