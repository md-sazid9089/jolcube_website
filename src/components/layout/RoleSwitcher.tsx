import { useLocation, useNavigate } from 'react-router-dom'
import { Building2, HardHat, User as UserIcon } from 'lucide-react'
import { cx } from '@/components/ui/primitives'
import { useI18n } from '@/i18n/I18nProvider'
import type { Role } from '@/data/types'

const ROLES: Array<{ role: Role; path: string; icon: typeof UserIcon; key: 'role.user' | 'role.apa' | 'role.team' }> = [
  { role: 'user', path: '/user', icon: UserIcon, key: 'role.user' },
  { role: 'apa', path: '/apa', icon: HardHat, key: 'role.apa' },
  { role: 'team', path: '/team', icon: Building2, key: 'role.team' },
]

export function RoleSwitcher() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const current = pathname.startsWith('/apa') ? 'apa' : pathname.startsWith('/team') ? 'team' : 'user'

  return (
    <div
      className="flex items-center rounded-lg border border-ink-200 bg-white p-0.5"
      role="group"
      aria-label={t('app.viewAs')}
    >
      <span className="hidden px-2 text-[11px] font-medium tracking-wide text-ink-400 uppercase xl:block">
        {t('app.viewAs')}
      </span>
      {ROLES.map(({ role, path, icon: Icon, key }) => {
        const active = current === role
        return (
          <button
            key={role}
            onClick={() => navigate(path)}
            aria-pressed={active}
            title={t(key)}
            className={cx(
              'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors duration-150',
              active ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-900',
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">{t(role === 'user' ? 'role.user.short' : key)}</span>
          </button>
        )
      })}
    </div>
  )
}
