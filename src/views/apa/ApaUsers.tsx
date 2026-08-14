import { useMemo, useState } from 'react'
import { Plus, Search, UserX } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Label, cx, inputClass } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { PageHeader } from '@/components/layout/AppShell'
import { TransactionRow } from '@/views/user/UserTransactions'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { cubeById, txnsOfUser, usersOf } from '@/store/selectors'
import type { User } from '@/data/types'

const PAGE = 40
const AMOUNTS = [50, 100, 200, 500]

function AddBalanceModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { t, b, money } = useI18n()
  const { addBalanceAsApa } = useApp()
  const toast = useToast()
  const [amount, setAmount] = useState(100)
  const [custom, setCustom] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  const submit = () => {
    setSaving(true)
    window.setTimeout(() => {
      addBalanceAsApa(user.id, amount)
      toast({ title: t('apa.balanceAdded'), body: `${b(user.name)} · ${money(amount)}` })
      setSaving(false)
      setAmount(100)
      setCustom('')
      onClose()
    }, 500)
  }

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`${t('apa.addBalanceFor')} ${b(user.name)}`}
      subtitle={t('apa.cashReceived')}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('app.cancel')}
          </Button>
          <Button variant="primary" loading={saving} disabled={amount <= 0} onClick={submit}>
            {money(amount)} · {t('app.confirm')}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-center justify-between rounded-xl bg-ink-50 px-4 py-3">
        <span className="text-[13px] text-ink-500">{t('user.balance')}</span>
        <span className="tnum text-[15px] font-semibold text-ink-900">{money(user.balanceBdt)}</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {AMOUNTS.map((a) => (
          <button
            key={a}
            onClick={() => {
              setAmount(a)
              setCustom('')
            }}
            className={cx(
              'tnum rounded-xl border px-4 py-3.5 text-lg font-semibold transition-colors',
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
        <Label htmlFor="apa-amount">{t('user.chooseAmount')}</Label>
        <input
          id="apa-amount"
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
    </Modal>
  )
}

function HistoryModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { t, b, money, n } = useI18n()
  const { state } = useApp()
  const txns = user ? txnsOfUser(state, user.id).slice(0, 30) : []
  if (!user) return null
  return (
    <Modal open={!!user} onClose={onClose} title={b(user.name)} subtitle={user.id} size="md">
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-ink-50 p-3">
          <p className="text-[11.5px] text-ink-500">{t('user.balance')}</p>
          <p className="tnum mt-0.5 text-[15px] font-semibold text-ink-900">{money(user.balanceBdt)}</p>
        </div>
        <div className="rounded-xl bg-ink-50 p-3">
          <p className="text-[11.5px] text-ink-500">{t('user.todayUsage')}</p>
          <p className="tnum mt-0.5 text-[15px] font-semibold text-ink-900">
            {n(user.todayL)} {t('unit.litre')}
          </p>
        </div>
        <div className="rounded-xl bg-ink-50 p-3">
          <p className="text-[11.5px] text-ink-500">{t('user.monthUsage')}</p>
          <p className="tnum mt-0.5 text-[15px] font-semibold text-ink-900">
            {n(user.monthL)} {t('unit.litre')}
          </p>
        </div>
      </div>
      {txns.length === 0 ? (
        <EmptyState title={t('user.noTransactions')} />
      ) : (
        <div className="divide-y divide-ink-100">
          {txns.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </Modal>
  )
}

export function ApaUsers() {
  const { t, b, money, n, relative } = useI18n()
  const { state } = useApp()
  const cube = cubeById(state, state.activeCubeId)!
  const all = usersOf(state, cube.id)
  const [query, setQuery] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const [topUpUser, setTopUpUser] = useState<User | null>(null)
  const [historyUser, setHistoryUser] = useState<User | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((u) => {
      if (lowOnly && u.balanceBdt >= 50) return false
      if (!q) return true
      return u.name.en.toLowerCase().includes(q) || u.name.bn.includes(query) || u.id.toLowerCase().includes(q)
    })
  }, [all, query, lowOnly])

  const lowCount = all.filter((u) => u.balanceBdt < 50).length

  return (
    <div className="animate-in space-y-4">
      <PageHeader
        title={t('apa.usersTitle')}
        subtitle={`${n(all.length)} ${t('team.cube.users').toLowerCase()} · ${b(cube.name)}`}
      />

      <Card className="p-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <input
              className={inputClass + ' pl-9'}
              placeholder={t('apa.searchUsers')}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setLimit(PAGE)
              }}
            />
          </div>
          <Button
            variant={lowOnly ? 'primary' : 'secondary'}
            onClick={() => {
              setLowOnly((v) => !v)
              setLimit(PAGE)
            }}
          >
            {t('apa.lowBalanceOnly')}
            <span className="tnum ml-1 opacity-70">({n(lowCount)})</span>
          </Button>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={<UserX className="size-7" />} title={t('apa.noUsersFound')} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {filtered.slice(0, limit).map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 transition-colors hover:bg-ink-50/70"
              >
                <button onClick={() => setHistoryUser(u)} className="min-w-0 flex-1 text-left">
                  <p className="flex items-center gap-2 truncate text-[13.5px] font-medium text-ink-900">
                    {b(u.name)}
                    {u.balanceBdt < 50 && <Badge tone="warn">{t('status.lowBalance')}</Badge>}
                    {u.flag === 'high' && <Badge tone="bad">{t('apa.unusualHigh')}</Badge>}
                  </p>
                  <p className="tnum truncate text-[12px] text-ink-500">
                    {u.id} · {u.household} · {t('apa.lastActive')} {relative(u.lastActive)}
                  </p>
                </button>

                <div className="tnum flex shrink-0 items-center gap-5 text-right">
                  <div>
                    <p className="text-[11px] text-ink-400">{t('apa.consumption')}</p>
                    <p className="text-[13px] font-medium text-ink-700">
                      {n(u.monthL)} {t('unit.litre')}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-400">{t('user.balance')}</p>
                    <p
                      className={cx(
                        'text-[13.5px] font-semibold',
                        u.balanceBdt < 50 ? 'text-amber-700' : 'text-ink-900',
                      )}
                    >
                      {money(u.balanceBdt, u.balanceBdt % 1 === 0 ? 0 : 2)}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => setTopUpUser(u)}>
                    <Plus className="size-3.5" />
                    <span className="hidden sm:inline">{t('apa.addBalance')}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {filtered.length > limit && (
            <div className="border-t border-ink-100 p-3 text-center">
              <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
                {t('app.viewDetails')} · {n(filtered.length - limit)}
              </Button>
            </div>
          )}
        </Card>
      )}

      <AddBalanceModal user={topUpUser} onClose={() => setTopUpUser(null)} />
      <HistoryModal user={historyUser} onClose={() => setHistoryUser(null)} />
    </div>
  )
}
