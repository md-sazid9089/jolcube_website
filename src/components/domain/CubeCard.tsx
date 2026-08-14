import { Link } from 'react-router-dom'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { Badge, Card, StatusPill } from '@/components/ui/primitives'
import { Sparkline } from '@/components/ui/charts'
import { useI18n } from '@/i18n/I18nProvider'
import type { CubeSummary } from '@/store/selectors'

export function CubeCard({ summary, lastMaintenance }: { summary: CubeSummary; lastMaintenance?: string }) {
  const { t, b, money, n, date } = useI18n()
  const { cube, users, usage, today, month } = summary
  const spark = usage.slice(-14).map((d) => d.dispensedL)

  return (
    <Link
      to={`/team/cubes/${cube.id}`}
      className="group block focus-visible:outline-none"
      aria-label={`${cube.name.en} — ${t('app.viewDetails')}`}
    >
      <Card className="h-full p-4 transition-all duration-150 group-hover:-translate-y-0.5 group-hover:border-ink-300 group-hover:shadow-md group-hover:shadow-ink-900/5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold tracking-tight text-ink-900">
              {b(cube.name)}
              <ArrowUpRight className="size-3.5 shrink-0 text-ink-300 transition-colors group-hover:text-ink-600" />
            </p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-[12.5px] text-ink-500">
              <MapPin className="size-3 shrink-0" />
              {b(cube.district)} · {cube.code}
            </p>
          </div>
          <StatusPill status={cube.status} />
        </div>

        <div className="mt-3.5 flex items-center gap-2">
          <Badge tone="water">{b(cube.configuration)}</Badge>
          {summary.openAlerts.length > 0 && (
            <Badge tone={summary.openAlerts.some((a) => a.severity === 'critical') ? 'bad' : 'warn'}>
              {n(summary.openAlerts.length)} {t('apa.alertsTitle').toLowerCase()}
            </Badge>
          )}
        </div>

        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-ink-100 pt-3.5">
          <div>
            <dt className="text-[11.5px] text-ink-500">{t('team.cube.users')}</dt>
            <dd className="tnum mt-0.5 text-[15px] font-semibold text-ink-900">{n(users.length)}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-ink-500">{t('team.cube.today')}</dt>
            <dd className="tnum mt-0.5 text-[15px] font-semibold text-ink-900">
              {n(today.dispensedL)} {t('unit.litre')}
            </dd>
          </div>
          <div>
            <dt className="text-[11.5px] text-ink-500">{t('team.cube.revenue')}</dt>
            <dd className="tnum mt-0.5 text-[15px] font-semibold text-ink-900">{money(month.revenueBdt)}</dd>
          </div>
        </dl>

        <div className="mt-3.5 flex items-end justify-between gap-3">
          <p className="text-[11.5px] text-ink-500">
            {t('team.cube.lastMaint')}
            <br />
            <span className="font-medium text-ink-700">{lastMaintenance ? date(lastMaintenance) : '—'}</span>
          </p>
          <Sparkline values={spark} tone={cube.status === 'attention' ? 'amber' : 'water'} />
        </div>
      </Card>
    </Link>
  )
}
