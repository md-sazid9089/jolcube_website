import { monthStart } from '@/lib/date'
import type { Alert, AppState, DayStat, JolCube, MaintenanceRecord, Transaction, User } from '@/data/types'

export const cubeById = (s: AppState, id: string): JolCube | undefined => s.cubes.find((c) => c.id === id)
export const userById = (s: AppState, id: string): User | undefined => s.users.find((u) => u.id === id)
export const operatorOf = (s: AppState, cubeId: string) => s.operators.find((o) => o.cubeId === cubeId)

export const usersOf = (s: AppState, cubeId: string) => s.users.filter((u) => u.cubeId === cubeId)
export const usageOf = (s: AppState, cubeId: string): DayStat[] => s.usage[cubeId] ?? []
export const todayStat = (s: AppState, cubeId: string): DayStat | undefined => {
  const series = usageOf(s, cubeId)
  return series[series.length - 1]
}

export const txnsOfUser = (s: AppState, userId: string): Transaction[] =>
  s.transactions.filter((t) => t.userId === userId)

export const txnsOfCube = (s: AppState, cubeId: string): Transaction[] =>
  s.transactions.filter((t) => t.cubeId === cubeId)

export const maintenanceOf = (s: AppState, cubeId: string): MaintenanceRecord[] =>
  s.maintenance.filter((m) => m.cubeId === cubeId)

export const alertsOf = (s: AppState, cubeId: string): Alert[] => s.alerts.filter((a) => a.cubeId === cubeId)

export const openAlerts = (s: AppState): Alert[] => s.alerts.filter((a) => a.status === 'open')

const sum = (rows: DayStat[], key: keyof DayStat) =>
  rows.reduce((acc, r) => acc + (typeof r[key] === 'number' ? (r[key] as number) : 0), 0)

export interface Totals {
  producedL: number
  dispensedL: number
  revenueBdt: number
  bkashBdt: number
  nagadBdt: number
  cashBdt: number
}

export function totalsFor(rows: DayStat[]): Totals {
  return {
    producedL: sum(rows, 'producedL'),
    dispensedL: sum(rows, 'dispensedL'),
    revenueBdt: sum(rows, 'revenueBdt'),
    bkashBdt: sum(rows, 'bkashBdt'),
    nagadBdt: sum(rows, 'nagadBdt'),
    cashBdt: sum(rows, 'cashBdt'),
  }
}

export const lastNDays = (rows: DayStat[], n: number) => rows.slice(Math.max(0, rows.length - n))
export const thisMonth = (rows: DayStat[]) => {
  const from = monthStart()
  return rows.filter((r) => r.date >= from)
}

export interface CubeSummary {
  cube: JolCube
  users: User[]
  usage: DayStat[]
  today: DayStat
  week: Totals
  month: Totals
  avgHouseholdL: number
  uptime30: number
  openAlerts: Alert[]
}

export function summarise(s: AppState, cubeId: string): CubeSummary | null {
  const cube = cubeById(s, cubeId)
  if (!cube) return null
  const usage = usageOf(s, cubeId)
  const users = usersOf(s, cubeId)
  const t = usage[usage.length - 1]
  const last30 = lastNDays(usage, 30)
  return {
    cube,
    users,
    usage,
    today: t,
    week: totalsFor(lastNDays(usage, 7)),
    month: totalsFor(thisMonth(usage)),
    avgHouseholdL: users.length ? Math.round((t.dispensedL / users.length) * 10) / 10 : 0,
    uptime30: last30.length ? Number((sum(last30, 'uptimePct') / last30.length).toFixed(1)) : 0,
    openAlerts: s.alerts.filter((a) => a.cubeId === cubeId && a.status === 'open'),
  }
}

export interface NetworkSummary {
  activeCubes: number
  totalCubes: number
  communities: number
  users: number
  litresToday: number
  litresTotal: number
  revenueToday: number
  revenueMonth: number
  needsAttention: number
  uptime30: number
  perCube: CubeSummary[]
}

export function summariseNetwork(s: AppState): NetworkSummary {
  const perCube = s.cubes.map((c) => summarise(s, c.id)!).filter(Boolean)
  const litresTotal = perCube.reduce((a, c) => a + totalsFor(c.usage).dispensedL, 0)
  return {
    activeCubes: s.cubes.filter((c) => c.status !== 'offline').length,
    totalCubes: s.cubes.length,
    communities: new Set(s.cubes.map((c) => c.district.en)).size,
    users: s.users.length,
    litresToday: perCube.reduce((a, c) => a + c.today.dispensedL, 0),
    litresTotal,
    revenueToday: perCube.reduce((a, c) => a + c.today.revenueBdt, 0),
    revenueMonth: perCube.reduce((a, c) => a + c.month.revenueBdt, 0),
    needsAttention: s.cubes.filter((c) => c.status === 'attention' || c.status === 'offline').length,
    uptime30: perCube.length
      ? Number((perCube.reduce((a, c) => a + c.uptime30, 0) / perCube.length).toFixed(1))
      : 0,
    perCube,
  }
}

/** Network-wide daily series, summed across every deployment. */
export function networkSeries(s: AppState): DayStat[] {
  const byDate = new Map<string, DayStat>()
  for (const cubeId of Object.keys(s.usage)) {
    for (const row of s.usage[cubeId]) {
      const existing = byDate.get(row.date)
      if (!existing) {
        byDate.set(row.date, { ...row })
      } else {
        existing.producedL += row.producedL
        existing.dispensedL += row.dispensedL
        existing.revenueBdt += row.revenueBdt
        existing.bkashBdt += row.bkashBdt
        existing.nagadBdt += row.nagadBdt
        existing.cashBdt += row.cashBdt
        existing.activeUsers += row.activeUsers
        existing.uptimePct = (existing.uptimePct + row.uptimePct) / 2
      }
    }
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}
