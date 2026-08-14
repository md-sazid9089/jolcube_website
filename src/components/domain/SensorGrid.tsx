import {
  Activity,
  BatteryMedium,
  Droplets,
  Gauge as GaugeIcon,
  Layers,
  ShieldCheck,
  Sun,
  Waves,
} from 'lucide-react'
import { Card, SectionHeading, StatusDot, StatusPill, cx } from '@/components/ui/primitives'
import { Gauge } from '@/components/ui/charts'
import { useI18n } from '@/i18n/I18nProvider'
import type { Health, JolCube } from '@/data/types'

export function sensorHealth(cube: JolCube) {
  const s = cube.sensors
  const comp = (k: 'treatment' | 'uv' | 'pump' | 'power') =>
    cube.components.find((c) => c.key === k)?.status ?? 'healthy'
  const tankPct = (s.tankL / s.tankCapacityL) * 100
  const solarPct = (s.solarW / s.solarPeakW) * 100

  return {
    tankPct,
    solarPct,
    tank: (tankPct < 20 ? 'attention' : tankPct < 35 ? 'warning' : 'healthy') as Health,
    flow: (!s.pumpOn ? 'attention' : s.flowLpm <= 0 ? 'warning' : 'healthy') as Health,
    pump: (s.pumpOn ? comp('pump') : 'attention') as Health,
    solar: (solarPct < 12 ? 'warning' : 'healthy') as Health,
    battery: (s.batteryPct < 25 ? 'attention' : s.batteryPct < 45 ? 'warning' : 'healthy') as Health,
    treatment: comp('treatment') as Health,
    uv: comp('uv') as Health,
    power: comp('power') as Health,
  }
}

function Tile({
  icon,
  label,
  value,
  sub,
  status,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  status: Health
}) {
  const ring =
    status === 'attention'
      ? 'border-rose-200 bg-rose-50/40'
      : status === 'warning'
        ? 'border-amber-200 bg-amber-50/40'
        : 'border-ink-200 bg-white'
  return (
    <div className={cx('rounded-xl border p-3.5 transition-colors', ring)}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-ink-500">
          <span className="shrink-0 text-ink-400">{icon}</span>
          <span className="truncate">{label}</span>
        </span>
        <StatusDot status={status} pulse />
      </div>
      <p className="tnum mt-2 text-[19px] leading-none font-semibold text-ink-900">{value}</p>
      {sub && <p className="mt-1.5 truncate text-[11.5px] text-ink-500">{sub}</p>}
    </div>
  )
}

export function SensorGrid({ cube }: { cube: JolCube }) {
  const { t, n, relative } = useI18n()
  const s = cube.sensors
  const h = sensorHealth(cube)

  return (
    <Card className="p-4 sm:p-5">
      <SectionHeading
        title={t('apa.liveStatus')}
        hint={t('apa.sensorNote')}
        action={<StatusPill status={cube.status} />}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Gauge
            value={h.tankPct}
            tone={h.tank === 'attention' ? 'bad' : h.tank === 'warning' ? 'warn' : 'water'}
            label={`${Math.round(h.tankPct)}%`}
            sub={t('sensor.tank')}
          />
          <div>
            <p className="tnum text-[15px] font-semibold text-ink-900">
              {n(s.tankL)} {t('unit.litre')}
            </p>
            <p className="text-[12px] text-ink-500">
              {t('app.of')} {n(s.tankCapacityL)} {t('unit.litres')}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-ink-400">
              <Activity className="size-3" />
              {t('sensor.lastSync')} {relative(s.lastSync)}
            </p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Tile
            icon={<Waves className="size-3.5" />}
            label={t('sensor.flow')}
            value={`${n(s.flowLpm, 1)} L/min`}
            sub={s.pumpOn ? t('sensor.running') : t('sensor.stopped')}
            status={h.flow}
          />
          <Tile
            icon={<GaugeIcon className="size-3.5" />}
            label={t('sensor.pump')}
            value={s.pumpOn ? t('sensor.running') : t('sensor.stopped')}
            sub={`${n(s.pumpPressureBar, 2)} bar`}
            status={h.pump}
          />
          <Tile
            icon={<Sun className="size-3.5" />}
            label={t('sensor.solar')}
            value={`${n(s.solarW)} W`}
            sub={`${Math.round(h.solarPct)}% ${t('app.of')} ${n(s.solarPeakW)} W`}
            status={h.solar}
          />
          <Tile
            icon={<BatteryMedium className="size-3.5" />}
            label={t('sensor.battery')}
            value={`${n(s.batteryPct)}%`}
            sub={`${n(s.batteryHoursLeft)}${t('sensor.hoursLeft')}`}
            status={h.battery}
          />
          <Tile
            icon={<Layers className="size-3.5" />}
            label={t('sensor.treatment')}
            value={`${n(s.treatmentPressureBar, 2)} bar`}
            sub={`TDS ${n(s.tds)} ppm`}
            status={h.treatment}
          />
          <Tile
            icon={<ShieldCheck className="size-3.5" />}
            label={t('sensor.uv')}
            value={`${n(s.uvIntensityPct)}%`}
            sub={`${Math.round((s.uvLampHours / s.uvLampRatedHours) * 100)}% ${t('sensor.lampLife')}`}
            status={h.uv}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-100 pt-3.5 text-[12px] text-ink-500">
        <span className="flex items-center gap-1.5">
          <Droplets className="size-3.5 text-ink-400" />
          {t('sensor.quality')}
        </span>
        <span className="tnum">pH {n(s.ph, 1)}</span>
        <span className="tnum">TDS {n(s.tds)} ppm</span>
        <span className="tnum">Turbidity {n(s.turbidityNtu, 2)} NTU</span>
      </div>
    </Card>
  )
}
