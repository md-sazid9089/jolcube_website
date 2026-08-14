import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createSeedState, STATE_VERSION } from '@/data/seed'
import { dayOffset, today } from '@/lib/date'
import type {
  Alert,
  AppState,
  ComponentState,
  MaintenanceRecord,
  PaymentMethod,
  Transaction,
} from '@/data/types'

const STORAGE_KEY = 'jolcube.demo.state'

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      // Re-seed on a new day or a new data model so the demo is never stale.
      if (parsed.version === STATE_VERSION && parsed.seededOn === today()) return parsed
    }
  } catch {
    /* corrupted or unavailable storage — fall through to a fresh seed */
  }
  return createSeedState()
}

/** Component service intervals, in days, used when a maintenance record is logged. */
const SERVICE_INTERVAL: Record<ComponentState['key'], number> = {
  sediment: 60,
  treatment: 180,
  uv: 195,
  pump: 90,
  tank: 90,
  power: 180,
}

interface Ctx {
  state: AppState
  topUp: (userId: string, amountBdt: number, method: PaymentMethod) => Transaction
  dispense: (userId: string, litres: number) => Transaction
  addBalanceAsApa: (userId: string, amountBdt: number) => Transaction
  logMaintenance: (input: {
    cubeId: string
    component: ComponentState['key']
    action: string
    by: string
    costBdt: number
    resolveAlertId?: string
  }) => void
  resolveAlert: (alertId: string) => void
  setActiveUser: (userId: string) => void
  setActiveCube: (cubeId: string) => void
  resetDemo: () => void
}

const AppContext = createContext<Ctx | null>(null)

let txnCounter = 0
const nextTxnId = () => `LIVE-${Date.now().toString(36)}-${(++txnCounter).toString(36)}`

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load)
  const saveTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        /* quota exceeded — the prototype keeps working from memory */
      }
    }, 250)
    return () => window.clearTimeout(saveTimer.current)
  }, [state])

  /** Apply a delta to today's row of a cube's usage series. */
  const patchToday = useCallback((s: AppState, cubeId: string, delta: Partial<Record<string, number>>) => {
    const series = s.usage[cubeId]
    if (!series?.length) return s.usage
    const last = series[series.length - 1]
    const patched = { ...last }
    for (const [k, v] of Object.entries(delta)) {
      // @ts-expect-error — keys are checked by callers, all values are numeric
      patched[k] = (patched[k] ?? 0) + (v ?? 0)
    }
    return { ...s.usage, [cubeId]: [...series.slice(0, -1), patched] }
  }, [])

  const topUpInternal = useCallback(
    (userId: string, amountBdt: number, method: PaymentMethod): Transaction => {
      const user = state.users.find((u) => u.id === userId)!
      const txn: Transaction = {
        id: nextTxnId(),
        userId,
        cubeId: user.cubeId,
        ts: new Date().toISOString(),
        type: 'topup',
        amountBdt,
        litres: 0,
        method,
        demo: true,
      }
      setState((s) => {
        const methodKey = method === 'bkash' ? 'bkashBdt' : method === 'nagad' ? 'nagadBdt' : 'cashBdt'
        return {
          ...s,
          users: s.users.map((u) =>
            u.id === userId
              ? { ...u, balanceBdt: u.balanceBdt + amountBdt, lastActive: txn.ts }
              : u,
          ),
          transactions: [txn, ...s.transactions],
          usage: patchToday(s, user.cubeId, { revenueBdt: amountBdt, [methodKey]: amountBdt }),
          cubes: s.cubes.map((c) =>
            c.id === user.cubeId
              ? { ...c, operatingBalanceBdt: c.operatingBalanceBdt + amountBdt }
              : c,
          ),
        }
      })
      return txn
    },
    [state.users, patchToday],
  )

  const topUp = useCallback(
    (userId: string, amountBdt: number, method: PaymentMethod) => topUpInternal(userId, amountBdt, method),
    [topUpInternal],
  )

  const addBalanceAsApa = useCallback(
    (userId: string, amountBdt: number) => topUpInternal(userId, amountBdt, 'cash'),
    [topUpInternal],
  )

  const dispense = useCallback(
    (userId: string, litres: number): Transaction => {
      const user = state.users.find((u) => u.id === userId)!
      const cube = state.cubes.find((c) => c.id === user.cubeId)!
      const cost = Number((litres * cube.pricePerL).toFixed(2))
      const txn: Transaction = {
        id: nextTxnId(),
        userId,
        cubeId: cube.id,
        ts: new Date().toISOString(),
        type: 'dispense',
        amountBdt: cost,
        litres,
        demo: true,
      }
      setState((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === userId
            ? {
                ...u,
                balanceBdt: Number((u.balanceBdt - cost).toFixed(2)),
                todayL: u.todayL + litres,
                monthL: u.monthL + litres,
                lastActive: txn.ts,
              }
            : u,
        ),
        transactions: [txn, ...s.transactions],
        usage: patchToday(s, cube.id, { dispensedL: litres }),
        cubes: s.cubes.map((c) =>
          c.id === cube.id
            ? { ...c, sensors: { ...c.sensors, tankL: Math.max(0, c.sensors.tankL - litres) } }
            : c,
        ),
      }))
      return txn
    },
    [state.users, state.cubes, patchToday],
  )

  const logMaintenance = useCallback<Ctx['logMaintenance']>((input) => {
    const record: MaintenanceRecord = {
      id: `LIVE-M-${Date.now().toString(36)}`,
      cubeId: input.cubeId,
      component: input.component,
      date: today(),
      action: { en: input.action, bn: input.action },
      by: input.by,
      costBdt: input.costBdt,
      demo: true,
    }
    setState((s) => {
      const cubes = s.cubes.map((c) => {
        if (c.id !== input.cubeId) return c
        const components = c.components.map((comp) =>
          comp.key === input.component
            ? {
                ...comp,
                status: 'healthy' as const,
                life: 100,
                lastService: today(),
                nextService: dayOffset(SERVICE_INTERVAL[input.component]),
              }
            : comp,
        )
        const worst = components.some((x) => x.status === 'attention')
          ? ('attention' as const)
          : components.some((x) => x.status === 'warning')
            ? ('warning' as const)
            : ('healthy' as const)
        return { ...c, components, status: c.status === 'offline' ? c.status : worst }
      })
      const alerts = s.alerts.map((a) =>
        (input.resolveAlertId && a.id === input.resolveAlertId) ||
        (a.status === 'open' && a.cubeId === input.cubeId && a.component === input.component)
          ? { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
          : a,
      )
      return { ...s, cubes, alerts, maintenance: [record, ...s.maintenance] }
    })
  }, [])

  const resolveAlert = useCallback((alertId: string) => {
    setState((s) => ({
      ...s,
      alerts: s.alerts.map((a: Alert) =>
        a.id === alertId ? { ...a, status: 'resolved', resolvedAt: new Date().toISOString() } : a,
      ),
    }))
  }, [])

  const setActiveUser = useCallback((userId: string) => {
    setState((s) => ({ ...s, activeUserId: userId }))
  }, [])

  const setActiveCube = useCallback((cubeId: string) => {
    setState((s) => ({ ...s, activeCubeId: cubeId }))
  }, [])

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(createSeedState())
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      state,
      topUp,
      dispense,
      addBalanceAsApa,
      logMaintenance,
      resolveAlert,
      setActiveUser,
      setActiveCube,
      resetDemo,
    }),
    [
      state,
      topUp,
      dispense,
      addBalanceAsApa,
      logMaintenance,
      resolveAlert,
      setActiveUser,
      setActiveCube,
      resetDemo,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}
