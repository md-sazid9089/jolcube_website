import { Outlet } from 'react-router-dom'
import { Bell, Droplet, LayoutDashboard, Users, Wallet, Wrench } from 'lucide-react'
import { AppShell, type NavItem } from '@/components/layout/AppShell'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { alertsOf, cubeById, operatorOf } from '@/store/selectors'

/** Which JolCube the operator is standing at — a demo affordance, not a real feature. */
export function CubePicker() {
  const { b } = useI18n()
  const { state, setActiveCube } = useApp()
  return (
    <label className="block rounded-xl border border-ink-200 bg-white p-3">
      <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-ink-400 uppercase">JolCube</span>
      <select
        value={state.activeCubeId}
        onChange={(e) => setActiveCube(e.target.value)}
        className="w-full bg-transparent text-[13px] font-medium text-ink-900 focus:outline-none"
      >
        {state.cubes.map((c) => (
          <option key={c.id} value={c.id}>
            {b(c.name)} · {b(c.district)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ApaLayout() {
  const { t, b } = useI18n()
  const { state } = useApp()
  const cube = cubeById(state, state.activeCubeId)!
  const apa = operatorOf(state, cube.id)
  const openCount = alertsOf(state, cube.id).filter((a) => a.status === 'open').length

  const items: NavItem[] = [
    { to: '/apa', label: t('apa.nav.overview'), icon: <LayoutDashboard className="size-[18px]" />, end: true },
    { to: '/apa/water', label: t('apa.nav.water'), icon: <Droplet className="size-[18px]" /> },
    { to: '/apa/users', label: t('apa.nav.users'), icon: <Users className="size-[18px]" /> },
    { to: '/apa/revenue', label: t('apa.nav.revenue'), icon: <Wallet className="size-[18px]" /> },
    { to: '/apa/maintenance', label: t('apa.nav.maintenance'), icon: <Wrench className="size-[18px]" /> },
    { to: '/apa/alerts', label: t('apa.nav.alerts'), icon: <Bell className="size-[18px]" />, badge: openCount },
  ]

  return (
    <AppShell
      items={items}
      sidebarFooter={
        <div className="space-y-3">
          <CubePicker />
          {apa && (
            <div className="rounded-xl border border-ink-200 bg-white p-3">
              <p className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">{t('role.apa')}</p>
              <p className="mt-1 text-[13px] font-medium text-ink-800">{b(apa.name)}</p>
              <p className="tnum text-[12px] text-ink-500">{apa.phone}</p>
            </div>
          )}
        </div>
      }
    >
      <Outlet />
    </AppShell>
  )
}
