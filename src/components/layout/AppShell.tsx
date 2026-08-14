import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Droplets, Languages, Layers, RotateCcw } from 'lucide-react'
import { cx } from '@/components/ui/primitives'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { RoleSwitcher } from './RoleSwitcher'

export interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  badge?: number
}

export function Logo({ compact }: { compact?: boolean }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-water-600 text-white shadow-sm">
        <Droplets className="size-[18px]" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block text-[15px] leading-tight font-semibold tracking-tight text-ink-900">
            {t('app.name')}
          </span>
          <span className="block truncate text-[11px] leading-tight text-ink-500">{t('app.tagline')}</span>
        </span>
      )}
    </div>
  )
}

export function LangToggle() {
  const { lang, setLang } = useI18n()
  return (
    <div className="flex items-center rounded-lg border border-ink-200 bg-white p-0.5">
      <Languages className="mx-1.5 size-3.5 text-ink-400" aria-hidden />
      {(['en', 'bn'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cx(
            'rounded-md px-2 py-1 text-[12px] font-medium transition-colors',
            lang === l ? 'bg-ink-900 text-white' : 'text-ink-500 hover:text-ink-900',
          )}
        >
          {l === 'en' ? 'EN' : 'বাংলা'}
        </button>
      ))}
    </div>
  )
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              'group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150',
              isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={cx('shrink-0', isActive ? 'text-white' : 'text-ink-400 group-hover:text-ink-600')}>
                {item.icon}
              </span>
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {!!item.badge && (
                <span
                  className={cx(
                    'tnum grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-[11px] font-semibold',
                    isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700',
                  )}
                >
                  {item.badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cx(
                'relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[10.5px] font-medium transition-colors',
                isActive ? 'text-water-700' : 'text-ink-400',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  {item.icon}
                  {!!item.badge && (
                    <span className="absolute -top-1 -right-1.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="w-full truncate text-center">{item.label}</span>
                {isActive && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-water-600" />}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function AppShell({
  items,
  children,
  sidebarFooter,
  wide,
}: {
  items: NavItem[]
  children: ReactNode
  sidebarFooter?: ReactNode
  /** team dashboards get the full desktop width; user/apa views stay narrower */
  wide?: boolean
}) {
  const { t } = useI18n()
  const { resetDemo } = useApp()
  const toast = useToast()
  const [confirmReset, setConfirmReset] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="min-h-dvh bg-ink-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/85 backdrop-blur-md">
        <div className={cx('mx-auto flex h-14 items-center gap-3 px-4 sm:px-6', wide ? 'max-w-[1600px]' : 'max-w-7xl')}>
          <div className="md:hidden">
            <Logo compact />
          </div>
          <div className="hidden md:block md:w-56 md:shrink-0">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NavLink
              to="/model"
              className={({ isActive }) =>
                cx(
                  'hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors sm:inline-flex',
                  isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )
              }
            >
              <Layers className="size-3.5" />
              {t('app.story')}
            </NavLink>
            <RoleSwitcher />
            <LangToggle />
            <button
              onClick={() => setConfirmReset(true)}
              title={t('app.resetDemo')}
              aria-label={t('app.resetDemo')}
              className="hidden rounded-lg border border-ink-200 bg-white p-2 text-ink-400 transition-colors hover:text-ink-800 lg:block"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        </div>
      </header>

      <div className={cx('mx-auto flex px-4 sm:px-6', wide ? 'max-w-[1600px]' : 'max-w-7xl')}>
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-56 shrink-0 flex-col justify-between py-6 pr-6 md:flex">
          <NavLinks items={items} />
          <div className="space-y-3">
            {sidebarFooter}
            <p className="text-[11px] leading-relaxed text-ink-400">{t('app.simulatedNote')}</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 py-5 pb-28 md:border-l md:border-ink-200 md:py-6 md:pl-6 md:pb-10">
          {children}
        </main>
      </div>

      <BottomNav items={items} />

      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo()
          toast({ title: t('app.resetDone'), tone: 'info' })
        }}
        title={t('app.resetDemo')}
        body={t('app.resetConfirm')}
        confirmLabel={t('app.resetDemo')}
        tone="danger"
      />
    </div>
  )
}

/** Page title block shared by every view. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-[22px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[13.5px] leading-snug text-ink-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
