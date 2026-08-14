import { useState } from 'react'
import { MapPin, Phone, ScanLine, Users } from 'lucide-react'
import { Badge, Button, Card, SectionHeading, StatusPill } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { cubeById, operatorOf, userById } from '@/store/selectors'
import { QrCodeCard, ScanModal } from './QrPanel'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="text-[13px] text-ink-500">{label}</span>
      <span className="text-right text-[13.5px] font-medium text-ink-900">{value}</span>
    </div>
  )
}

export function UserAccount() {
  const { t, b, money, n, date, lang, setLang } = useI18n()
  const { state } = useApp()
  const user = userById(state, state.activeUserId)!
  const cube = cubeById(state, user.cubeId)!
  const apa = operatorOf(state, user.cubeId)
  const [scan, setScan] = useState(false)

  return (
    <div className="animate-in space-y-4">
      <PageHeader
        title={t('user.nav.account')}
        action={
          <Button variant="secondary" size="sm" onClick={() => setScan(true)}>
            <ScanLine className="size-3.5" />
            {t('user.scanned')}
          </Button>
        }
      />

      <Card className="p-5">
        <QrCodeCard user={user} />
      </Card>

      <Card className="px-4 py-1">
        <div className="divide-y divide-ink-100">
          <Row label={t('user.household')} value={user.household} />
          <Row label={t('user.householdSize')} value={`${n(user.householdSize)}`} />
          <Row label={t('user.memberSince')} value={date(user.joined)} />
          <Row label={t('user.price')} value={`${money(cube.pricePerL, 2)} / ${t('unit.litre')}`} />
          <Row label={t('user.serviceFee')} value={money(cube.serviceFeeBdt)} />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionHeading title={t('user.servicePoint')} action={<StatusPill status={cube.status} />} />
        <p className="text-[15px] font-semibold text-ink-900">{b(cube.name)}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-500">
          <MapPin className="size-3.5 shrink-0" />
          {b(cube.hostSite)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone="water">{b(cube.configuration)}</Badge>
          <Badge tone="neutral">{b(cube.district)}</Badge>
        </div>

        {apa && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-ink-50 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-earth-100 text-earth-700">
              <Users className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium tracking-wide text-ink-400 uppercase">{t('user.operator')}</p>
              <p className="text-[13.5px] font-medium text-ink-900">{b(apa.name)}</p>
            </div>
            <a
              href={`tel:${apa.phone}`}
              className="tnum inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-ink-700 transition-colors hover:border-ink-300"
            >
              <Phone className="size-3.5" />
              {apa.phone}
            </a>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <SectionHeading title={t('app.language')} />
        <div className="flex gap-2">
          {(['en', 'bn'] as const).map((l) => (
            <Button
              key={l}
              variant={lang === l ? 'primary' : 'secondary'}
              size="md"
              className="flex-1"
              onClick={() => setLang(l)}
            >
              {l === 'en' ? 'English' : 'বাংলা'}
            </Button>
          ))}
        </div>
      </Card>

      <ScanModal open={scan} onClose={() => setScan(false)} />
    </div>
  )
}
