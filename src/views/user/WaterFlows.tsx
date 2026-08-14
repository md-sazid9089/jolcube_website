import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Banknote, Check, Droplet, Loader2, Smartphone, Wallet } from 'lucide-react'
import { Button, Label, cx, inputClass } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { cubeById, operatorOf } from '@/store/selectors'
import type { PaymentMethod, User } from '@/data/types'

const AMOUNTS = [50, 100, 200, 500]
const LITRES = [10, 20, 30, 50]

const METHODS: Array<{
  key: PaymentMethod
  label: 'user.pay.bkash' | 'user.pay.nagad' | 'user.pay.cash'
  sub: 'user.pay.bkashSub' | 'user.pay.nagadSub' | 'user.pay.cashSub'
  color: string
  icon: typeof Smartphone
}> = [
  { key: 'bkash', label: 'user.pay.bkash', sub: 'user.pay.bkashSub', color: '#E2136E', icon: Smartphone },
  { key: 'nagad', label: 'user.pay.nagad', sub: 'user.pay.nagadSub', color: '#EE7623', icon: Smartphone },
  { key: 'cash', label: 'user.pay.cash', sub: 'user.pay.cashSub', color: '#0d8071', icon: Banknote },
]

/* ------------------------------------------------------------------ Buy */
type BuyStep = 'amount' | 'method' | 'auth' | 'processing' | 'done'

export function BuyWaterModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const { t, b, money, n } = useI18n()
  const { state, topUp } = useApp()
  const toast = useToast()
  const [step, setStep] = useState<BuyStep>('amount')
  const [amount, setAmount] = useState(100)
  const [custom, setCustom] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('bkash')
  const [pin, setPin] = useState('')
  const [newBalance, setNewBalance] = useState(0)

  const apa = operatorOf(state, user.cubeId)

  useEffect(() => {
    if (!open) return
    setStep('amount')
    setAmount(100)
    setCustom('')
    setMethod('bkash')
    setPin('')
  }, [open])

  const balanceRef = useRef(user.balanceBdt)
  balanceRef.current = user.balanceBdt

  useEffect(() => {
    if (step !== 'processing') return
    const id = window.setTimeout(() => {
      topUp(user.id, amount, method)
      setNewBalance(balanceRef.current + amount)
      setStep('done')
      toast({
        title: method === 'cash' ? t('user.cashConfirmed') : t('user.paymentSuccess'),
        body: `${money(amount)} ${t('user.addedToBalance')}`,
      })
    }, 1500)
    return () => window.clearTimeout(id)
  }, [step, amount, method, user.id, topUp, toast, t, money])

  const brand = METHODS.find((m) => m.key === method)!

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideClose={step === 'processing'}
      title={step === 'done' ? undefined : t('user.buyWater')}
      subtitle={step === 'amount' ? t('user.chooseAmount') : step === 'method' ? t('user.choosePayment') : undefined}
      size="sm"
      footer={
        step === 'amount' ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t('app.cancel')}
            </Button>
            <Button variant="primary" onClick={() => setStep('method')} disabled={amount <= 0}>
              {money(amount)} · {t('app.confirm')}
            </Button>
          </>
        ) : step === 'method' ? (
          <>
            <Button variant="ghost" onClick={() => setStep('amount')}>
              <ArrowLeft className="size-4" />
              {t('app.back')}
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(method === 'cash' ? 'processing' : 'auth')}
            >
              {t('app.confirm')}
            </Button>
          </>
        ) : step === 'auth' ? (
          <>
            <Button variant="ghost" onClick={() => setStep('method')}>
              <ArrowLeft className="size-4" />
              {t('app.back')}
            </Button>
            <Button variant="primary" disabled={pin.length < 4} onClick={() => setStep('processing')}>
              {money(amount)} · {t('app.confirm')}
            </Button>
          </>
        ) : step === 'done' ? (
          <Button variant="primary" className="w-full" onClick={onClose}>
            {t('user.done')}
          </Button>
        ) : undefined
      }
    >
      {step === 'amount' && (
        <div className="animate-fade">
          <div className="grid grid-cols-2 gap-2.5">
            {AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => {
                  setAmount(a)
                  setCustom('')
                }}
                className={cx(
                  'tnum rounded-xl border px-4 py-4 text-lg font-semibold transition-colors',
                  amount === a && !custom
                    ? 'border-water-600 bg-water-50 text-water-800'
                    : 'border-ink-200 bg-white text-ink-800 hover:border-ink-300',
                )}
              >
                {money(a)}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Label htmlFor="custom-amount">{t('user.chooseAmount')}</Label>
            <input
              id="custom-amount"
              inputMode="numeric"
              className={inputClass}
              placeholder="৳ …"
              value={custom}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9]/g, '')
                setCustom(v)
                setAmount(Number(v) || 0)
              }}
            />
          </div>
          <p className="mt-4 rounded-xl bg-ink-50 p-3 text-[12.5px] leading-relaxed text-ink-500">
            {t('user.price')}: {money(cubeById(state, user.cubeId)?.pricePerL ?? 0, 2)}/{t('unit.litre')} ·{' '}
            {money(amount)} ≈ {n(Math.floor(amount / (cubeById(state, user.cubeId)?.pricePerL ?? 1)))}{' '}
            {t('unit.litres')}
          </p>
        </div>
      )}

      {step === 'method' && (
        <div className="animate-fade space-y-2.5">
          {METHODS.map((m) => {
            const active = method === m.key
            return (
              <button
                key={m.key}
                onClick={() => setMethod(m.key)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors',
                  active ? 'border-ink-900 bg-ink-50' : 'border-ink-200 bg-white hover:border-ink-300',
                )}
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-white"
                  style={{ backgroundColor: m.color }}
                >
                  <m.icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink-900">{t(m.label)}</span>
                  <span className="block text-[12px] text-ink-500">
                    {m.key === 'cash' && apa ? b(apa.name) : t(m.sub)}
                  </span>
                </span>
                <span
                  className={cx(
                    'grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
                    active ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-300',
                  )}
                >
                  {active && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {step === 'auth' && (
        <div className="animate-fade">
          <div
            className="mb-4 flex items-center gap-3 rounded-xl p-3.5 text-white"
            style={{ backgroundColor: brand.color }}
          >
            <Wallet className="size-5" />
            <div>
              <p className="text-[14px] font-semibold">{t(brand.label)}</p>
              <p className="text-[12px] opacity-90">{user.phone}</p>
            </div>
            <p className="tnum ml-auto text-lg font-semibold">{money(amount)}</p>
          </div>
          <Label htmlFor="pin">{t('user.enterPin')}</Label>
          <input
            id="pin"
            inputMode="numeric"
            autoFocus
            maxLength={4}
            className={inputClass + ' tnum text-center text-2xl tracking-[0.6em]'}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="••••"
          />
          <p className="mt-2 text-center text-[12px] text-ink-400">{t('user.simulatedPin')}</p>
        </div>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="size-8 animate-spin text-water-600" />
          <p className="mt-4 text-[14px] font-medium text-ink-700">{t('user.processing')}</p>
        </div>
      )}

      {step === 'done' && (
        <div className="animate-pop flex flex-col items-center py-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
            <Check className="size-7" strokeWidth={2.5} />
          </span>
          <p className="mt-4 text-[17px] font-semibold text-ink-900">
            {method === 'cash' ? t('user.cashConfirmed') : t('user.paymentSuccess')}
          </p>
          <p className="mt-1 text-[13.5px] text-ink-500">
            {money(amount)} {t('user.addedToBalance')}
          </p>
          <div className="mt-5 w-full rounded-xl bg-ink-50 p-4">
            <p className="text-[12px] font-medium text-ink-500">{t('user.newBalance')}</p>
            <p className="tnum mt-0.5 text-3xl font-semibold text-ink-900">{money(newBalance)}</p>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ----------------------------------------------------------------- Take */
type TakeStep = 'amount' | 'dispensing' | 'done'

export function TakeWaterModal({ open, onClose, user }: { open: boolean; onClose: () => void; user: User }) {
  const { t, money, n } = useI18n()
  const { state, dispense } = useApp()
  const toast = useToast()
  const cube = cubeById(state, user.cubeId)!
  const [step, setStep] = useState<TakeStep>('amount')
  const [litres, setLitres] = useState(20)
  const [progress, setProgress] = useState(0)

  const cost = useMemo(() => Number((litres * cube.pricePerL).toFixed(2)), [litres, cube.pricePerL])
  const affordable = cost <= user.balanceBdt

  useEffect(() => {
    if (!open) return
    setStep('amount')
    setLitres(20)
    setProgress(0)
  }, [open])

  useEffect(() => {
    if (step !== 'dispensing') return
    const start = Date.now()
    const id = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / 1800)
      setProgress(p)
      if (p >= 1) {
        window.clearInterval(id)
        dispense(user.id, litres)
        setStep('done')
        toast({
          title: t('user.waterTaken'),
          body: `${n(litres)} ${t('unit.litres')} · ${money(cost, 2)}`,
        })
      }
    }, 60)
    return () => window.clearInterval(id)
  }, [step, litres, cost, dispense, user.id, toast, t, money, n])

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideClose={step === 'dispensing'}
      title={step === 'done' ? undefined : t('user.takeWater')}
      subtitle={step === 'amount' ? t('user.howMuchWater') : undefined}
      size="sm"
      footer={
        step === 'amount' ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              {t('app.cancel')}
            </Button>
            <Button variant="subtle" disabled={!affordable || litres <= 0} onClick={() => setStep('dispensing')}>
              {t('user.takeWater')} · {money(cost, 2)}
            </Button>
          </>
        ) : step === 'done' ? (
          <Button variant="primary" className="w-full" onClick={onClose}>
            {t('user.done')}
          </Button>
        ) : undefined
      }
    >
      {step === 'amount' && (
        <div className="animate-fade">
          <div className="grid grid-cols-4 gap-2">
            {LITRES.map((l) => (
              <button
                key={l}
                onClick={() => setLitres(l)}
                className={cx(
                  'tnum rounded-xl border px-2 py-3.5 text-center transition-colors',
                  litres === l
                    ? 'border-water-600 bg-water-50 text-water-800'
                    : 'border-ink-200 bg-white text-ink-800 hover:border-ink-300',
                )}
              >
                <span className="block text-lg font-semibold">{n(l)}</span>
                <span className="block text-[11px] opacity-70">{t('unit.litres')}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
            <span className="text-[13px] text-ink-500">{t('user.willCost')}</span>
            <span className="tnum text-lg font-semibold text-ink-900">{money(cost, 2)}</span>
          </div>

          {!affordable && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3.5">
              <p className="text-[13px] font-semibold text-rose-700">{t('user.notEnoughBalance')}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-rose-600">{t('user.notEnoughBalanceHelp')}</p>
            </div>
          )}
        </div>
      )}

      {step === 'dispensing' && (
        <div className="flex flex-col items-center py-8">
          <div className="relative grid size-24 place-items-center">
            <svg className="absolute -rotate-90" width={96} height={96}>
              <circle cx={48} cy={48} r={42} fill="none" stroke="var(--color-ink-100)" strokeWidth={8} />
              <circle
                cx={48}
                cy={48}
                r={42}
                fill="none"
                stroke="var(--color-water-500)"
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - progress)}
              />
            </svg>
            <Droplet className="size-8 text-water-600" />
          </div>
          <p className="mt-4 text-[14px] font-medium text-ink-700">{t('user.dispensing')}</p>
          <p className="tnum mt-1 text-[13px] text-ink-500">
            {n(Math.round(litres * progress))} / {n(litres)} {t('unit.litres')}
          </p>
        </div>
      )}

      {step === 'done' && (
        <div className="animate-pop flex flex-col items-center py-6 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-water-50 text-water-600">
            <Check className="size-7" strokeWidth={2.5} />
          </span>
          <p className="mt-4 text-[17px] font-semibold text-ink-900">{t('user.waterTaken')}</p>
          <p className="tnum mt-1 text-[13.5px] text-ink-500">
            {n(litres)} {t('unit.litres')} · {money(cost, 2)}
          </p>
          <div className="mt-5 w-full rounded-xl bg-ink-50 p-4">
            <p className="text-[12px] font-medium text-ink-500">{t('user.newBalance')}</p>
            <p className="tnum mt-0.5 text-3xl font-semibold text-ink-900">
              {money(Number((user.balanceBdt).toFixed(2)), 2)}
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
