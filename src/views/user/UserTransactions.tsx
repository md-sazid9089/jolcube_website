import { useMemo } from 'react'
import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react'
import { Badge, Card, EmptyState } from '@/components/ui/primitives'
import { PageHeader } from '@/components/layout/AppShell'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { txnsOfUser, userById } from '@/store/selectors'
import type { Transaction } from '@/data/types'

export function TransactionRow({ tx }: { tx: Transaction }) {
  const { t, money, n, time } = useI18n()
  const topup = tx.type === 'topup'
  return (
    <div className="flex items-center gap-3 py-3">
      <span
        className={
          'grid size-9 shrink-0 place-items-center rounded-full ' +
          (topup ? 'bg-emerald-50 text-emerald-600' : 'bg-water-50 text-water-600')
        }
      >
        {topup ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[13.5px] font-medium text-ink-900">
          {t(topup ? 'user.txn.topup' : 'user.txn.dispense')}
          {tx.demo && (
            <Badge tone="water" className="px-1.5 py-0">
              {t('app.demoEntry')}
            </Badge>
          )}
        </p>
        <p className="tnum text-[12px] text-ink-500">
          {time(tx.ts)}
          {topup
            ? ` · ${t(`user.pay.${tx.method ?? 'cash'}` as 'user.pay.bkash')}`
            : ` · ${n(tx.litres)} ${t('unit.litres')}`}
        </p>
      </div>
      <p className={'tnum shrink-0 text-[14px] font-semibold ' + (topup ? 'text-emerald-600' : 'text-ink-800')}>
        {topup ? '+' : '−'}
        {money(tx.amountBdt, tx.amountBdt % 1 === 0 ? 0 : 2)}
      </p>
    </div>
  )
}

export function UserTransactions() {
  const { t, date } = useI18n()
  const { state } = useApp()
  const user = userById(state, state.activeUserId)!
  const txns = txnsOfUser(state, user.id)

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const tx of txns) {
      const d = tx.ts.slice(0, 10)
      const list = map.get(d) ?? []
      list.push(tx)
      map.set(d, list)
    }
    return [...map.entries()].sort((a, bb) => bb[0].localeCompare(a[0]))
  }, [txns])

  return (
    <div className="animate-in space-y-4">
      <PageHeader title={t('user.nav.transactions')} subtitle={t('app.simulatedNote')} />

      {groups.length === 0 ? (
        <Card>
          <EmptyState icon={<Receipt className="size-7" />} title={t('user.noTransactions')} />
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map(([day, list]) => (
            <Card key={day} className="px-4 py-1">
              <p className="border-b border-ink-100 py-2.5 text-[12px] font-medium text-ink-500">{date(day)}</p>
              <div className="divide-y divide-ink-100">
                {list.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
