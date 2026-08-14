import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeft,
  Boxes,
  ClipboardList,
  Droplets,
  HardHat,
  Landmark,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react'
import { Badge, Card, SectionHeading, cx } from '@/components/ui/primitives'
import { LangToggle, Logo } from '@/components/layout/AppShell'
import { RoleSwitcher } from '@/components/layout/RoleSwitcher'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { TREATMENT_MODULES } from '@/data/seed'
import type { TreatmentKey } from '@/data/types'
import type { StringKey } from '@/i18n/strings'

const OWNERSHIP: Array<{ title: StringKey; body: StringKey; icon: typeof HardHat }> = [
  { title: 'story.own1', body: 'story.own1b', icon: HardHat },
  { title: 'story.own2', body: 'story.own2b', icon: Users },
  { title: 'story.own3', body: 'story.own3b', icon: Wallet },
  { title: 'story.own4', body: 'story.own4b', icon: ClipboardList },
  { title: 'story.own5', body: 'story.own5b', icon: ShieldCheck },
]

const BUSINESS: Array<{ title: StringKey; body: StringKey; icon: typeof Landmark }> = [
  { title: 'story.biz1', body: 'story.biz1b', icon: Landmark },
  { title: 'story.biz2', body: 'story.biz2b', icon: Boxes },
  { title: 'story.biz3', body: 'story.biz3b', icon: Droplets },
  { title: 'story.biz4', body: 'story.biz4b', icon: Wallet },
  { title: 'story.biz5', body: 'story.biz5b', icon: Wrench },
  { title: 'story.biz6', body: 'story.biz6b', icon: RefreshCw },
]

export function StoryModel() {
  const { t, b, money } = useI18n()
  const { state } = useApp()
  const [selected, setSelected] = useState<TreatmentKey>('salinity')

  const mod = TREATMENT_MODULES.find((m) => m.key === selected)!
  const deployedAt = state.cubes.filter((c) => c.modules.includes(selected))

  return (
    <div className="min-h-dvh bg-ink-50">
      <header className="sticky top-0 z-50 border-b border-ink-200 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Logo compact />
          <Link
            to="/user"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12.5px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
          >
            <ArrowLeft className="size-3.5" />
            {t('app.back')}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <RoleSwitcher />
            <LangToggle />
          </div>
        </div>
      </header>

      <main className="animate-in mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-ink-900 sm:text-[24px]">{t('story.title')}</h1>
            <Badge tone="water">{t('app.prototype')}</Badge>
          </div>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">{t('story.subtitle')}</p>
        </div>

        {/* ---- Modular treatment ---------------------------------------- */}
        <Card className="p-4 sm:p-6">
          <SectionHeading title={t('story.modular')} hint={t('story.modularNote')} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* Diagram */}
            <div className="flex flex-col items-stretch">
              <div className="rounded-2xl border border-ink-200 bg-ink-900 p-5 text-white">
                <p className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
                  <Droplets className="size-4 text-water-300" />
                  {t('story.core')}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-300">{t('story.coreItems')}</p>
              </div>
              <div className="flex justify-center py-2 text-ink-400">
                <ArrowDown className="size-5" />
              </div>
              <div className="rounded-2xl border-2 border-dashed border-water-400 bg-water-50 p-5">
                <p className="text-[11px] font-medium tracking-wide text-water-700 uppercase">
                  {t('story.moduleSlot')}
                </p>
                <p className="mt-1 text-[15px] font-semibold tracking-tight text-ink-900">{b(mod.name)}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-ink-600">{b(mod.method)}</p>
              </div>
              <p className="mt-4 text-center text-[12.5px] text-ink-500">
                <span className="font-semibold text-ink-800">{t('story.sameCore')}</span>
                <span className="mx-1.5 inline-grid size-4 place-items-center rounded-full bg-ink-100 align-middle text-ink-500">
                  <Plus className="size-3" />
                </span>
                {t('story.plusModule')}
              </p>
            </div>

            {/* Module picker + details */}
            <div>
              <div className="flex flex-wrap gap-1.5">
                {TREATMENT_MODULES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setSelected(m.key)}
                    aria-pressed={selected === m.key}
                    className={cx(
                      'rounded-lg border px-3 py-2 text-[12.5px] font-medium transition-colors',
                      selected === m.key
                        ? 'border-ink-900 bg-ink-900 text-white'
                        : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300',
                    )}
                  >
                    {b(m.name)}
                  </button>
                ))}
              </div>

              <dl className="mt-4 divide-y divide-ink-100 rounded-xl border border-ink-200 bg-white">
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 p-3.5">
                  <dt className="text-[12.5px] font-medium text-ink-500">{t('story.targets')}</dt>
                  <dd className="text-[13px] text-ink-800">{b(mod.targets)}</dd>
                </div>
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 p-3.5">
                  <dt className="text-[12.5px] font-medium text-ink-500">{t('story.method')}</dt>
                  <dd className="text-[13px] text-ink-800">{b(mod.method)}</dd>
                </div>
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 p-3.5">
                  <dt className="text-[12.5px] font-medium text-ink-500">{t('story.addlCapex')}</dt>
                  <dd className="tnum text-[13px] text-ink-800">
                    {money(mod.addlCapexBdt)}
                    <span className="ml-1.5 text-[11.5px] text-ink-400">({t('story.assumption')})</span>
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 p-3.5">
                  <dt className="text-[12.5px] font-medium text-ink-500">{t('story.indicativePrice')}</dt>
                  <dd className="tnum text-[13px] text-ink-800">
                    {money(mod.pricePerL, 2)} {t('app.perLitre')}
                  </dd>
                </div>
                <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 p-3.5">
                  <dt className="text-[12.5px] font-medium text-ink-500">{t('story.deployedAt')}</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {deployedAt.length === 0 ? (
                      <span className="text-[13px] text-ink-500">{t('story.notDeployed')}</span>
                    ) : (
                      deployedAt.map((c) => (
                        <Badge key={c.id} tone="water">
                          {b(c.district)}
                        </Badge>
                      ))
                    )}
                  </dd>
                </div>
              </dl>

              <p className="mt-3 text-[12.5px] leading-relaxed text-ink-500">{b(mod.note)}</p>
            </div>
          </div>
        </Card>

        {/* ---- Community ownership --------------------------------------- */}
        <Card className="p-4 sm:p-6">
          <SectionHeading title={t('story.ownership')} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {OWNERSHIP.map(({ title, body, icon: Icon }) => (
              <div key={title} className="rounded-xl border border-ink-100 bg-ink-50/60 p-4">
                <span className="grid size-8 place-items-center rounded-lg bg-water-50 text-water-700">
                  <Icon className="size-4" />
                </span>
                <p className="mt-2.5 text-[13.5px] font-semibold text-ink-900">{t(title)}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">{t(body)}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ---- Business model -------------------------------------------- */}
        <Card className="p-4 sm:p-6">
          <SectionHeading
            title={t('story.business')}
            hint={
              <>
                <Badge tone="earth" className="mr-1.5">
                  {t('story.assumption')}
                </Badge>
                {t('story.businessNote')}
              </>
            }
          />
          <ol className="mx-auto max-w-md">
            {BUSINESS.map(({ title, body, icon: Icon }, i) => (
              <li key={title}>
                <div className="flex items-center gap-3.5 rounded-xl border border-ink-200 bg-white p-4">
                  <span
                    className={cx(
                      'grid size-9 shrink-0 place-items-center rounded-lg',
                      i === BUSINESS.length - 1 ? 'bg-water-600 text-white' : 'bg-ink-100 text-ink-600',
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink-900">{t(title)}</p>
                    <p className="text-[12.5px] leading-snug text-ink-500">{t(body)}</p>
                  </div>
                </div>
                {i < BUSINESS.length - 1 && (
                  <div className="flex justify-center py-1 text-ink-300">
                    <ArrowDown className="size-4" />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </Card>

        <p className="pb-4 text-center text-[11.5px] text-ink-400">{t('app.simulatedNote')}</p>
      </main>
    </div>
  )
}
