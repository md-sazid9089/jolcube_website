import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { STRINGS, type StringKey } from './strings'
import type { Bilingual, Lang } from '@/data/types'

const LANG_KEY = 'jolcube.lang'

interface I18nCtx {
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void
  /** translate a dictionary key */
  t: (key: StringKey) => string
  /** pick the right side of a bilingual data field */
  b: (value: Bilingual | undefined) => string
  /** locale-aware number */
  n: (value: number, digits?: number) => string
  /** ৳ amount */
  money: (value: number, digits?: number) => string
  /** compact litres, e.g. "3,240 L" / "১.২ লক্ষ লি" */
  litres: (value: number) => string
  date: (isoDate: string, opts?: Intl.DateTimeFormatOptions) => string
  time: (isoDateTime: string) => string
  dateTime: (isoDateTime: string) => string
  relative: (isoDateTime: string) => string
}

const Ctx = createContext<I18nCtx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || 'en')

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const toggleLang = useCallback(() => setLangState((l) => (l === 'en' ? 'bn' : 'en')), [])

  const value = useMemo<I18nCtx>(() => {
    const locale = lang === 'bn' ? 'bn-BD' : 'en-GB'
    const nf = (digits: number) =>
      new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })

    const n = (v: number, digits = 0) => nf(digits).format(v)

    return {
      lang,
      setLang,
      toggleLang,
      t: (key) => {
        const pair = STRINGS[key]
        if (!pair) return key
        return lang === 'bn' ? pair[1] : pair[0]
      },
      b: (value) => (!value ? '' : lang === 'bn' ? value.bn : value.en),
      n,
      money: (v, digits = 0) => `৳${n(v, digits)}`,
      litres: (v) => {
        if (v >= 100000) return `${n(v / 100000, 2)} ${lang === 'bn' ? 'লক্ষ লি' : 'lakh L'}`
        if (v >= 10000) return `${n(Math.round(v / 100) / 10, 1)}k ${lang === 'bn' ? 'লি' : 'L'}`
        return `${n(Math.round(v))} ${lang === 'bn' ? 'লি' : 'L'}`
      },
      date: (isoDate, opts) =>
        new Date(isoDate.length === 10 ? isoDate + 'T12:00:00' : isoDate).toLocaleDateString(
          locale,
          opts ?? { day: 'numeric', month: 'short', year: 'numeric' },
        ),
      time: (isoDateTime) =>
        new Date(isoDateTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
      dateTime: (isoDateTime) => {
        const d = new Date(isoDateTime)
        return `${d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString(
          locale,
          { hour: '2-digit', minute: '2-digit' },
        )}`
      },
      relative: (isoDateTime) => {
        const diffMin = Math.round((Date.now() - new Date(isoDateTime).getTime()) / 60000)
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
        if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute')
        const diffH = Math.round(diffMin / 60)
        if (Math.abs(diffH) < 24) return rtf.format(-diffH, 'hour')
        return rtf.format(-Math.round(diffH / 24), 'day')
      },
    }
  }, [lang, setLang, toggleLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
