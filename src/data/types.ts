export type Lang = 'en' | 'bn'
export type Role = 'user' | 'apa' | 'team'

/** Health vocabulary shared by components, sensors and whole systems. */
export type Health = 'healthy' | 'warning' | 'attention' | 'offline'

export type TreatmentKey = 'salinity' | 'arsenic' | 'microbial' | 'sediment'

export type PaymentMethod = 'bkash' | 'nagad' | 'cash'

export type TxnType = 'topup' | 'dispense'

export interface Bilingual {
  en: string
  bn: string
}

export interface Operator {
  id: string
  cubeId: string
  name: Bilingual
  phone: string
  since: string // ISO date
  trainedBy: string
}

export interface ComponentState {
  key: 'sediment' | 'treatment' | 'uv' | 'pump' | 'tank' | 'power'
  status: Health
  /** 0–100 remaining service life, prototype estimate */
  life: number
  lastService: string // ISO date
  nextService: string // ISO date
}

export interface SensorState {
  /** litres currently in the safe-water tank */
  tankL: number
  tankCapacityL: number
  /** live flow through the dispensing flow meter, L/min */
  flowLpm: number
  pumpOn: boolean
  pumpPressureBar: number
  solarW: number
  solarPeakW: number
  batteryPct: number
  batteryHoursLeft: number
  treatmentPressureBar: number
  uvIntensityPct: number
  uvLampHours: number
  uvLampRatedHours: number
  tds: number
  ph: number
  turbidityNtu: number
  lastSync: string // ISO datetime
}

export interface JolCube {
  id: string
  code: string
  name: Bilingual
  district: Bilingual
  hostSite: Bilingual
  /** short human label for the treatment configuration, e.g. "Salinity + UV" */
  configuration: Bilingual
  modules: TreatmentKey[]
  hazard: Bilingual
  status: Health
  commissioned: string
  capexBdt: number
  pricePerL: number
  serviceFeeBdt: number
  monthlyOpexBdt: number
  operatingBalanceBdt: number
  lat: number
  lon: number
  sensors: SensorState
  components: ComponentState[]
}

export interface User {
  id: string
  cubeId: string
  name: Bilingual
  household: string
  phone: string
  balanceBdt: number
  /** litres taken today */
  todayL: number
  /** litres taken so far this month */
  monthL: number
  householdSize: number
  joined: string
  lastActive: string
  /** flagged by the Jol Apa / system as unusual consumption */
  flag?: 'high' | 'low'
}

export interface Transaction {
  id: string
  userId: string
  cubeId: string
  ts: string // ISO datetime
  type: TxnType
  /** BDT paid in (topup) or BDT deducted from balance (dispense) */
  amountBdt: number
  litres: number
  method?: PaymentMethod
  /** true for entries created live during the demo session */
  demo?: boolean
}

export interface DayStat {
  date: string // YYYY-MM-DD
  producedL: number
  dispensedL: number
  revenueBdt: number
  bkashBdt: number
  nagadBdt: number
  cashBdt: number
  activeUsers: number
  uptimePct: number
}

export interface MaintenanceRecord {
  id: string
  cubeId: string
  component: ComponentState['key']
  date: string
  action: Bilingual
  by: string
  costBdt: number
  demo?: boolean
}

export type AlertKind =
  | 'low_tank'
  | 'module_due'
  | 'unusual_consumption'
  | 'pump'
  | 'sensor'
  | 'maintenance_overdue'
  | 'offline'
  | 'low_production'
  | 'quality_test_due'

export interface Alert {
  id: string
  cubeId: string
  kind: AlertKind
  severity: 'critical' | 'warning' | 'info'
  createdAt: string
  status: 'open' | 'resolved'
  resolvedAt?: string
  /** optional component the alert points at, used by "Mark maintenance" */
  component?: ComponentState['key']
  detail?: Bilingual
}

export interface TreatmentModule {
  key: TreatmentKey
  name: Bilingual
  targets: Bilingual
  method: Bilingual
  addlCapexBdt: number
  pricePerL: number
  note: Bilingual
}

export interface AppState {
  version: number
  seededOn: string
  cubes: JolCube[]
  operators: Operator[]
  users: User[]
  transactions: Transaction[]
  usage: Record<string, DayStat[]>
  maintenance: MaintenanceRecord[]
  alerts: Alert[]
  activeUserId: string
  activeCubeId: string
}
