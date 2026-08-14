import { Outlet } from 'react-router-dom'
import { Bell, BarChart3, Boxes, LayoutDashboard, Wrench } from 'lucide-react'
import { AppShell, type NavItem } from '@/components/layout/AppShell'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { openAlerts } from '@/store/selectors'

export function TeamLayout() {
  const { t, n } = useI18n()
  const { state } = useApp()
  const open = openAlerts(state)

  const items: NavItem[] = [
    { to: '/team', label: t('team.nav.overview'), icon: <LayoutDashboard className="size-[18px]" />, end: true },
    { to: '/team/cubes', label: t('team.nav.cubes'), icon: <Boxes className="size-[18px]" /> },
    { to: '/team/analytics', label: t('team.nav.analytics'), icon: <BarChart3 className="size-[18px]" /> },
    { to: '/team/alerts', label: t('team.nav.alerts'), icon: <Bell className="size-[18px]" />, badge: open.length },
    { to: '/team/maintenance', label: t('team.nav.maintenance'), icon: <Wrench className="size-[18px]" /> },
  ]

  return (
    <AppShell
      items={items}
      wide
      sidebarFooter={
        <div className="rounded-xl border border-ink-200 bg-white p-3">
          <p className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">{t('team.network')}</p>
          <p className="tnum mt-1 text-[13px] font-medium text-ink-800">
            {n(state.cubes.length)} {t('team.deployments')}
          </p>
          <p className="tnum text-[12px] text-ink-500">
            {n(state.users.length)} {t('team.cube.users').toLowerCase()}
          </p>
        </div>
      }
    >
      <Outlet />
    </AppShell>
  )
}
