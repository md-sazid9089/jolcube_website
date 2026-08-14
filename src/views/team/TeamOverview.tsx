import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, ArrowRight, Boxes, Droplet, MapPinned, Users, Wallet } from 'lucide-react'
import { AreaChart } from '@/components/ui/charts'
import { Button, Card, SectionHeading, Stat } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { CubeCard } from '@/components/domain/CubeCard'
import { AlertCard } from '@/components/domain/AlertCard'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { lastNDays, maintenanceOf, networkSeries, openAlerts, summariseNetwork } from '@/store/selectors'

export function TeamOverview() {
  const { t, b, money, n, litres, date } = useI18n()
  const { state } = useApp()
  const net = useMemo(() => summariseNetwork(state), [state])
  const series = useMemo(
    () =>
      lastNDays(networkSeries(state), 30).map((d) => ({
        label: date(d.date, { day: 'numeric', month: 'short' }),
        value: d.dispensedL,
      })),
    [state, date],
  )
  const allOpen = openAlerts(state)
  const alerts = allOpen
    .slice()
    .sort((a, x) => (a.severity === x.severity ? 0 : a.severity === 'critical' ? -1 : 1))
    .slice(0, 4)

  const cubeName = (id: string) => b(state.cubes.find((c) => c.id === id)?.name)

  return (
    <div className="animate-in space-y-5">
      <PageHeader title={t('team.title')} subtitle={t('team.subtitle')} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Stat
          label={t('team.kpi.active')}
          value={`${n(net.activeCubes)}/${n(net.totalCubes)}`}
          icon={<Boxes className="size-4" />}
          tone="water"
        />
        <Stat label={t('team.kpi.communities')} value={n(net.communities)} icon={<MapPinned className="size-4" />} />
        <Stat label={t('team.kpi.users')} value={n(net.users)} icon={<Users className="size-4" />} />
        <Stat
          label={t('team.kpi.litres')}
          value={litres(net.litresTotal)}
          sub={`${t('app.today')}: ${n(net.litresToday)} ${t('unit.litre')}`}
          icon={<Droplet className="size-4" />}
        />
        <Stat
          label={t('team.kpi.revenue')}
          value={money(net.revenueMonth)}
          sub={`${t('app.today')}: ${money(net.revenueToday)}`}
          icon={<Wallet className="size-4" />}
        />
        <Stat
          label={t('team.kpi.attention')}
          value={n(net.needsAttention)}
          sub={`${n(allOpen.length)} ${t('apa.alertsTitle').toLowerCase()}`}
          icon={<AlertTriangle className="size-4" />}
          tone={net.needsAttention > 0 ? 'alert' : 'default'}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-4 sm:p-5 xl:col-span-2">
          <SectionHeading
            title={t('team.waterOverTime')}
            hint={`${t('apa.trend30')} · ${t('team.network')}`}
            action={
              <Link to="/team/analytics">
                <Button size="sm" variant="ghost">
                  {t('team.nav.analytics')}
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          />
          <AreaChart data={series} format={(v) => `${n(v)} ${t('unit.litre')}`} height={210} />
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeading
            title={t('team.remoteAlerts')}
            action={
              <Link to="/team/alerts">
                <Button size="sm" variant="ghost">
                  {t('app.viewDetails')}
                  <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          />
          <div className="space-y-2.5">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} location={cubeName(a.cubeId)} compact />
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[12px] text-ink-400">
            <Activity className="size-3.5" />
            {t('team.kpi.uptime')}: <span className="tnum font-medium text-ink-600">{n(net.uptime30, 1)}%</span>
          </p>
        </Card>
      </div>

      <div>
        <SectionHeading
          title={t('team.network')}
          hint={`${n(state.cubes.length)} ${t('team.deployments')}`}
          action={
            <Link to="/team/cubes">
              <Button size="sm" variant="ghost">
                {t('app.viewDetails')}
                <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {net.perCube.map((s) => (
            <CubeCard key={s.cube.id} summary={s} lastMaintenance={maintenanceOf(state, s.cube.id)[0]?.date} />
          ))}
        </div>
      </div>
    </div>
  )
}
