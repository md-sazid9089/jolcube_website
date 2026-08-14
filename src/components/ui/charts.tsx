import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cx } from './primitives'

export interface Point {
  label: string
  value: number
  /** optional second series drawn as a faint line behind the first */
  compare?: number
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    setWidth(el.clientWidth)
    return () => ro.disconnect()
  }, [])
  return { ref, width }
}

const TONES = {
  water: { stroke: 'var(--color-water-500)', fill: 'var(--color-water-500)' },
  ink: { stroke: 'var(--color-ink-800)', fill: 'var(--color-ink-800)' },
  amber: { stroke: '#d97706', fill: '#d97706' },
  emerald: { stroke: '#059669', fill: '#059669' },
} as const

export type ChartTone = keyof typeof TONES

/** Smooth line + soft area fill, with a hover readout. Deliberately axis-light. */
export function AreaChart({
  data,
  height = 168,
  tone = 'water',
  format,
  className,
  showCompare,
}: {
  data: Point[]
  height?: number
  tone?: ChartTone
  format: (v: number) => string
  className?: string
  showCompare?: boolean
}) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const id = useRef(`ac-${Math.random().toString(36).slice(2, 8)}`).current

  const padT = 12
  const padB = 22
  const innerH = height - padT - padB

  const values = data.map((d) => d.value)
  const compares = showCompare ? data.map((d) => d.compare ?? 0) : []
  const max = Math.max(1, ...values, ...compares)
  const min = Math.min(...values, ...compares, max * 0.75)
  const span = max - min || 1

  const x = (i: number) => (data.length === 1 ? width / 2 : (i / (data.length - 1)) * width)
  const y = (v: number) => padT + innerH - ((v - min) / span) * innerH

  const path = (vals: number[]) => {
    if (!vals.length || !width) return ''
    // Catmull-Rom-ish smoothing kept mild so spikes stay honest
    let d = `M ${x(0)} ${y(vals[0])}`
    for (let i = 1; i < vals.length; i++) {
      const cx1 = x(i - 1) + (x(i) - x(i - 1)) / 2
      d += ` C ${cx1} ${y(vals[i - 1])}, ${cx1} ${y(vals[i])}, ${x(i)} ${y(vals[i])}`
    }
    return d
  }

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!width || data.length < 2) return
      const rect = e.currentTarget.getBoundingClientRect()
      const rel = (e.clientX - rect.left) / rect.width
      setHover(Math.max(0, Math.min(data.length - 1, Math.round(rel * (data.length - 1)))))
    },
    [width, data.length],
  )

  const active = hover != null ? data[hover] : null
  const c = TONES[tone]

  return (
    <div className={cx('relative select-none', className)}>
      <div
        ref={ref}
        style={{ height }}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="relative w-full touch-pan-y"
      >
        {width > 0 && (
          <svg width={width} height={height} className="overflow-visible">
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.fill} stopOpacity="0.16" />
                <stop offset="100%" stopColor={c.fill} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                x1={0}
                x2={width}
                y1={padT + innerH * f}
                y2={padT + innerH * f}
                stroke="var(--color-ink-100)"
                strokeWidth={1}
              />
            ))}
            {showCompare && (
              <path
                d={path(data.map((d) => d.compare ?? 0))}
                fill="none"
                stroke="var(--color-ink-300)"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            )}
            <path d={`${path(values)} L ${x(data.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`} fill={`url(#${id})`} />
            <path d={path(values)} fill="none" stroke={c.stroke} strokeWidth={2} strokeLinecap="round" />
            {hover != null && (
              <>
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={padT}
                  y2={padT + innerH}
                  stroke="var(--color-ink-300)"
                  strokeWidth={1}
                />
                <circle cx={x(hover)} cy={y(values[hover])} r={4.5} fill="white" stroke={c.stroke} strokeWidth={2} />
              </>
            )}
          </svg>
        )}
        {active && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-center shadow-md"
            style={{ left: Math.max(46, Math.min(width - 46, x(hover!))) }}
          >
            <p className="tnum text-[12.5px] font-semibold text-ink-900">{format(active.value)}</p>
            <p className="mt-0.5 text-[10.5px] whitespace-nowrap text-ink-500">{active.label}</p>
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ink-400">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}

/** Vertical bars — used for revenue and per-deployment comparisons. */
export function BarChart({
  data,
  height = 168,
  tone = 'water',
  format,
  className,
}: {
  data: Point[]
  height?: number
  tone?: ChartTone
  format: (v: number) => string
  className?: string
}) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const padT = 12
  const padB = 20
  const innerH = height - padT - padB
  const max = Math.max(1, ...data.map((d) => d.value))
  const step = data.length ? width / data.length : 0
  const barW = Math.max(3, Math.min(26, step * 0.62))
  const c = TONES[tone]

  return (
    <div className={cx('relative select-none', className)}>
      <div ref={ref} style={{ height }} className="relative w-full" onPointerLeave={() => setHover(null)}>
        {width > 0 && (
          <svg width={width} height={height} className="overflow-visible">
            <line x1={0} x2={width} y1={padT + innerH} y2={padT + innerH} stroke="var(--color-ink-200)" strokeWidth={1} />
            {data.map((d, i) => {
              const h = Math.max(2, (d.value / max) * innerH)
              const bx = step * i + (step - barW) / 2
              return (
                <g key={`${d.label}-${i}`} onPointerEnter={() => setHover(i)}>
                  <rect x={step * i} y={padT} width={step} height={innerH} fill="transparent" />
                  <rect
                    x={bx}
                    y={padT + innerH - h}
                    width={barW}
                    height={h}
                    rx={Math.min(4, barW / 2)}
                    fill={c.fill}
                    opacity={hover == null || hover === i ? 0.9 : 0.32}
                    className="transition-opacity duration-150"
                  />
                </g>
              )
            })}
          </svg>
        )}
        {hover != null && data[hover] && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-center shadow-md"
            style={{ left: Math.max(46, Math.min(width - 46, step * hover + step / 2)) }}
          >
            <p className="tnum text-[12.5px] font-semibold text-ink-900">{format(data[hover].value)}</p>
            <p className="mt-0.5 text-[10.5px] whitespace-nowrap text-ink-500">{data[hover].label}</p>
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-ink-400">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  )
}

/** Tiny inline trend line for cards and table rows. */
export function Sparkline({
  values,
  className,
  tone = 'water',
  width = 84,
  height = 26,
}: {
  values: number[]
  className?: string
  tone?: ChartTone
  width?: number
  height?: number
}) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * width},${height - ((v - min) / span) * (height - 4) - 2}`)
    .join(' ')
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <polyline points={pts} fill="none" stroke={TONES[tone].stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Horizontal split bar — payment mix, module share, etc. */
export function StackBar({
  segments,
  className,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  className?: string
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            className="transition-[width] duration-500"
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[12.5px] text-ink-500">{s.label}</span>
            <span className="tnum text-[12.5px] font-medium text-ink-800">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Radial gauge used for tank level. */
export function Gauge({
  value,
  size = 108,
  tone = 'water',
  label,
  sub,
}: {
  /** 0–100 */
  value: number
  size?: number
  tone?: ChartTone | 'warn' | 'bad'
  label: string
  sub?: string
}) {
  const stroke = 9
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const color =
    tone === 'warn' ? '#d97706' : tone === 'bad' ? '#e11d48' : TONES[(tone as ChartTone) ?? 'water'].stroke
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = window.setTimeout(() => setShown(pct), 60)
    return () => window.clearTimeout(id)
  }, [pct])

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-ink-100)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (shown / 100) * circ}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="tnum text-lg leading-none font-semibold text-ink-900">{label}</p>
        {sub && <p className="mt-1 text-[11px] text-ink-500">{sub}</p>}
      </div>
    </div>
  )
}
