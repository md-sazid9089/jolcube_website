import { useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { ScanLine, Search } from 'lucide-react'
import { Button, EmptyState, inputClass } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/Modal'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import { usersOf } from '@/store/selectors'
import type { User } from '@/data/types'

export const qrValue = (user: User) => `jolcube://account/${user.cubeId}/${user.id}`

export function QrCodeCard({ user, size = 176 }: { user: User; size?: number }) {
  const { t, b } = useI18n()
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-2xl border border-ink-200 bg-white p-4">
        <QRCodeSVG value={qrValue(user)} size={size} level="M" fgColor="#141a25" bgColor="#ffffff" />
      </div>
      <p className="mt-3 text-[15px] font-semibold text-ink-900">{b(user.name)}</p>
      <p className="tnum text-[12.5px] text-ink-500">{user.id}</p>
      <p className="mt-3 max-w-[16rem] text-center text-[12.5px] leading-relaxed text-ink-500">{t('user.qrHelp')}</p>
    </div>
  )
}

/** Simulated QR scanner — lets the demo jump between household accounts. */
export function ScanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, b, money } = useI18n()
  const { state, setActiveUser } = useApp()
  const [query, setQuery] = useState('')

  const candidates = useMemo(() => {
    const pool = state.cubes.flatMap((c) => usersOf(state, c.id).slice(0, 12))
    const q = query.trim().toLowerCase()
    if (!q) return pool.slice(0, 8)
    return pool
      .filter((u) => u.name.en.toLowerCase().includes(q) || u.name.bn.includes(query) || u.id.toLowerCase().includes(q))
      .slice(0, 8)
  }, [state, query])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('user.scanned')}
      subtitle={t('app.simulatedNote')}
      size="md"
    >
      <div className="mb-4 grid place-items-center rounded-2xl border border-dashed border-ink-300 bg-ink-50 py-7">
        <div className="relative grid size-28 place-items-center overflow-hidden rounded-xl border-2 border-water-500/40">
          <ScanLine className="size-9 text-water-600" />
          <span className="absolute inset-x-0 h-0.5 animate-[scan_1.8s_ease-in-out_infinite] bg-water-500/70" />
        </div>
        <style>{`@keyframes scan{0%,100%{top:8%}50%{top:88%}}`}</style>
      </div>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
        <input
          className={inputClass + ' pl-9'}
          placeholder={t('app.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {candidates.length === 0 ? (
        <EmptyState title={t('app.noResults')} />
      ) : (
        <ul className="divide-y divide-ink-100">
          {candidates.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => {
                  setActiveUser(u.id)
                  onClose()
                }}
                className="flex w-full items-center justify-between gap-3 py-2.5 text-left transition-colors hover:bg-ink-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] font-medium text-ink-900">{b(u.name)}</span>
                  <span className="tnum block text-[12px] text-ink-500">{u.id}</span>
                </span>
                <span className="tnum shrink-0 text-[13px] font-medium text-ink-700">{money(u.balanceBdt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-center">
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t('app.close')}
        </Button>
      </p>
    </Modal>
  )
}
