import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Droplet, Plus, QrCode, ScanLine, TriangleAlert } from 'lucide-react'
import { Badge, Button, Card, EmptyState, StatusDot } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/Modal'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { cubeById, operatorOf, txnsOfUser, userById } from '@/store/selectors'
import { BuyWaterModal, TakeWaterModal } from './WaterFlows'
import { QrCodeCard, ScanModal } from './QrPanel'

export function UserHome() {
  const { t, b, money, n, dateTime } = useI18n()
  const { state } = useApp()
  const user = userById(state, state.activeUserId)!
  const cube = cubeById(state, user.cubeId)!
  const apa = operatorOf(state, user.cubeId)
  const txns = txnsOfUser(state, user.id)
  const last = txns[0]

  const [buy, setBuy] = useState(false)
  const [take, setTake] = useState(false)
  const [qr, setQr] = useState(false)
  const [scan, setScan] = useState(false)

  const creditLitres = Math.floor(user.balanceBdt / cube.pricePerL)
  const low = user.balanceBdt < 50

  return (
    <div className="animate-in space-y-4">
      {/* Scan context */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="water">
          <ScanLine className="size-3" />
          {t('user.scanned')}
        </Badge>
        <button
          onClick={() => setScan(true)}
          className="text-[12px] font-medium text-ink-500 underline underline-offset-2 transition-colors hover:text-ink-900"
        >
          {user.id}
        </button>
      </div>

      <header>
        <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-ink-900">
          {b(user.name)}
          <span className="text-ink-400">{t('user.accountOf')}</span>
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-ink-500">
          <span>{user.household}</span>
          <span className="text-ink-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <StatusDot status={cube.status} />
            {b(cube.name)}
          </span>
        </p>
      </header>

      {/* Balance */}
      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6">
          <p className="text-[13px] font-medium text-ink-500">{t('user.balance')}</p>
          <p className="tnum mt-1 text-5xl leading-none font-semibold tracking-tight text-ink-900">
            {money(user.balanceBdt, user.balanceBdt % 1 === 0 ? 0 : 2)}
          </p>
          <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-water-50 px-2.5 py-1.5 text-[13px] font-medium text-water-800">
            <Droplet className="size-3.5" />
            {t('user.creditLitres')}: {n(creditLitres)} {t('unit.litres')}
          </p>
        </div>

        {low && (
          <div className="flex items-start gap-2.5 border-t border-amber-200 bg-amber-50 px-5 py-3">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p className="text-[12.5px] leading-snug text-amber-800">{t('user.notEnoughBalanceHelp')}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-ink-100 p-4 sm:p-5">
          <Button variant="primary" size="lg" onClick={() => setBuy(true)} className="col-span-2">
            <Plus className="size-4" />
            {t('user.buyWater')}
          </Button>
          <Button variant="subtle" size="lg" onClick={() => setTake(true)}>
            <Droplet className="size-4" />
            {t('user.takeWater')}
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setQr(true)}>
            <QrCode className="size-4" />
            {t('user.showQR')}
          </Button>
        </div>
      </Card>

      {/* Usage today / month */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-[12.5px] font-medium text-ink-500">{t('user.todayUsage')}</p>
          <p className="tnum mt-1.5 text-2xl leading-none font-semibold text-ink-900">
            {n(user.todayL)} <span className="text-base font-medium text-ink-400">{t('unit.litre')}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12.5px] font-medium text-ink-500">{t('user.monthUsage')}</p>
          <p className="tnum mt-1.5 text-2xl leading-none font-semibold text-ink-900">
            {n(user.monthL)} <span className="text-base font-medium text-ink-400">{t('unit.litre')}</span>
          </p>
        </Card>
      </div>

      {/* Last transaction */}
      <Card className="p-4">
        <p className="mb-2.5 text-[12.5px] font-medium text-ink-500">{t('user.lastTransaction')}</p>
        {last ? (
          <div className="flex items-center gap-3">
            <span
              className={
                'grid size-9 shrink-0 place-items-center rounded-full ' +
                (last.type === 'topup' ? 'bg-emerald-50 text-emerald-600' : 'bg-water-50 text-water-600')
              }
            >
              {last.type === 'topup' ? (
                <ArrowDownLeft className="size-4" />
              ) : (
                <ArrowUpRight className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium text-ink-900">
                {t(last.type === 'topup' ? 'user.txn.topup' : 'user.txn.dispense')}
                {last.type === 'dispense' && (
                  <span className="tnum text-ink-500">
                    {' '}
                    · {n(last.litres)} {t('unit.litre')}
                  </span>
                )}
              </p>
              <p className="text-[12px] text-ink-500">
                {dateTime(last.ts)}
                {last.method && ` · ${t(`user.pay.${last.method}` as 'user.pay.bkash')}`}
              </p>
            </div>
            <p
              className={
                'tnum shrink-0 text-[14px] font-semibold ' +
                (last.type === 'topup' ? 'text-emerald-600' : 'text-ink-800')
              }
            >
              {last.type === 'topup' ? '+' : '−'}
              {money(last.amountBdt, last.amountBdt % 1 === 0 ? 0 : 2)}
            </p>
          </div>
        ) : (
          <EmptyState title={t('user.noTransactions')} className="py-6" />
        )}
      </Card>

      {/* Help */}
      <Card className="bg-ink-900 p-4 text-white">
        <p className="text-[13.5px] font-semibold">{t('user.help')}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-300">{t('user.helpBody')}</p>
        {apa && (
          <p className="mt-2.5 text-[12.5px] text-ink-200">
            {t('user.operator')}: <span className="font-medium text-white">{b(apa.name)}</span> · {apa.phone}
          </p>
        )}
      </Card>

      <BuyWaterModal open={buy} onClose={() => setBuy(false)} user={user} />
      <TakeWaterModal open={take} onClose={() => setTake(false)} user={user} />
      <ScanModal open={scan} onClose={() => setScan(false)} />
      <Modal open={qr} onClose={() => setQr(false)} title={t('user.myQR')} size="sm">
        <QrCodeCard user={user} />
      </Modal>
    </div>
  )
}
