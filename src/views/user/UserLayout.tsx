import { Outlet } from 'react-router-dom'
import { Droplet, History, Home, UserCircle } from 'lucide-react'
import { AppShell, type NavItem } from '@/components/layout/AppShell'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { cubeById, userById } from '@/store/selectors'
import { QrCodeCard } from './QrPanel'

export function UserLayout() {
  const { t, b } = useI18n()
  const { state } = useApp()
  const user = userById(state, state.activeUserId)
  const cube = user ? cubeById(state, user.cubeId) : undefined

  const items: NavItem[] = [
    { to: '/user', label: t('user.nav.home'), icon: <Home className="size-[18px]" />, end: true },
    { to: '/user/usage', label: t('user.nav.usage'), icon: <Droplet className="size-[18px]" /> },
    { to: '/user/transactions', label: t('user.nav.transactions'), icon: <History className="size-[18px]" /> },
    { to: '/user/account', label: t('user.nav.account'), icon: <UserCircle className="size-[18px]" /> },
  ]

  return (
    <AppShell
      items={items}
      sidebarFooter={
        user && cube ? (
          <div className="rounded-xl border border-ink-200 bg-white p-3">
            <p className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">{t('user.servicePoint')}</p>
            <p className="mt-1 text-[13px] font-medium text-ink-800">{b(cube.name)}</p>
            <p className="text-[12px] text-ink-500">{b(cube.district)}</p>
          </div>
        ) : null
      }
    >
      <div className="mx-auto max-w-2xl">
        <Outlet />
      </div>
    </AppShell>
  )
}

export { QrCodeCard }
