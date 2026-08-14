import { useEffect, useState } from 'react'
import { Button, Label, cx, inputClass } from '@/components/ui/primitives'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useI18n } from '@/i18n/I18nProvider'
import { useApp } from '@/store/AppStore'
import type { ComponentState } from '@/data/types'

const COMPONENTS: ComponentState['key'][] = ['sediment', 'treatment', 'uv', 'pump', 'tank', 'power']

const SUGGESTIONS: Record<ComponentState['key'], string> = {
  sediment: 'Sediment filter replaced',
  treatment: 'Treatment module media replaced',
  uv: 'UV lamp replaced',
  pump: 'Pump serviced, seals replaced',
  tank: 'Storage tank cleaned and sanitised',
  power: 'Solar panels cleaned, battery tested',
}

export function MaintenanceModal({
  open,
  onClose,
  cubeId,
  defaultComponent,
  resolveAlertId,
  operatorName,
}: {
  open: boolean
  onClose: () => void
  cubeId: string
  defaultComponent?: ComponentState['key']
  resolveAlertId?: string
  operatorName?: string
}) {
  const { t, money } = useI18n()
  const { logMaintenance } = useApp()
  const toast = useToast()
  const [component, setComponent] = useState<ComponentState['key']>(defaultComponent ?? 'sediment')
  const [action, setAction] = useState('')
  const [by, setBy] = useState('')
  const [cost, setCost] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const initial = defaultComponent ?? 'sediment'
    setComponent(initial)
    setAction(SUGGESTIONS[initial])
    setBy(operatorName ?? '')
    setCost('')
    setSaving(false)
  }, [open, defaultComponent, operatorName])

  const submit = () => {
    setSaving(true)
    window.setTimeout(() => {
      logMaintenance({
        cubeId,
        component,
        action: action.trim() || SUGGESTIONS[component],
        by: by.trim() || operatorName || '—',
        costBdt: Number(cost) || 0,
        resolveAlertId,
      })
      toast({
        title: t('apa.maintSaved'),
        body: `${t(`comp.${component}` as 'comp.uv')} · ${money(Number(cost) || 0)}`,
      })
      setSaving(false)
      onClose()
    }, 650)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('apa.newRecord')}
      subtitle={t('apa.recordMaint')}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('app.cancel')}
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            {t('app.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <Label>{t('apa.component')}</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {COMPONENTS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setComponent(c)
                  setAction(SUGGESTIONS[c])
                }}
                className={cx(
                  'rounded-xl border px-3 py-2.5 text-left text-[12.5px] font-medium transition-colors',
                  component === c
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                )}
              >
                {t(`comp.${c}` as 'comp.uv')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="m-action">{t('apa.whatWasDone')}</Label>
          <input id="m-action" className={inputClass} value={action} onChange={(e) => setAction(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="m-by">{t('apa.doneBy')}</Label>
            <input id="m-by" className={inputClass} value={by} onChange={(e) => setBy(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="m-cost">{t('apa.cost')}</Label>
            <input
              id="m-cost"
              inputMode="numeric"
              className={inputClass + ' tnum'}
              placeholder="৳ 0"
              value={cost}
              onChange={(e) => setCost(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
