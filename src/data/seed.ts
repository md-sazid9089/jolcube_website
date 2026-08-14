import { dayOffset, daysBetween, stamp, today } from '@/lib/date'
import { FEMALE_FIRST, FEMALE_LAST, MALE_FIRST, MALE_LAST } from './names'
import type {
  Alert,
  AppState,
  ComponentState,
  DayStat,
  JolCube,
  MaintenanceRecord,
  Operator,
  PaymentMethod,
  TreatmentModule,
  Transaction,
  User,
} from './types'

export const STATE_VERSION = 4
export const HISTORY_DAYS = 60

/* ------------------------------------------------------------------ *
 * Deterministic RNG — the demo must look identical on every machine.
 * ------------------------------------------------------------------ */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)]
const between = (r: () => number, a: number, b: number) => a + r() * (b - a)
const intBetween = (r: () => number, a: number, b: number) => Math.round(between(r, a, b))

/* ------------------------------------------------------------------ *
 * Treatment module catalogue
 * ------------------------------------------------------------------ */
export const TREATMENT_MODULES: TreatmentModule[] = [
  {
    key: 'salinity',
    name: { en: 'Salinity module', bn: 'লবণাক্ততা মডিউল' },
    targets: { en: 'Salinity, high TDS, chloride', bn: 'লবণাক্ততা, উচ্চ টিডিএস, ক্লোরাইড' },
    method: { en: 'Reverse osmosis (RO) stage + brine handling', bn: 'রিভার্স অসমোসিস (আরও) ধাপ + ব্রাইন ব্যবস্থাপনা' },
    addlCapexBdt: 250000,
    pricePerL: 0.75,
    note: {
      en: 'Selected for coastal sites where salinity has reached deep tubewells.',
      bn: 'উপকূলীয় এলাকায় নির্বাচিত, যেখানে গভীর নলকূপেও লবণাক্ততা পৌঁছেছে।',
    },
  },
  {
    key: 'arsenic',
    name: { en: 'Arsenic module', bn: 'আর্সেনিক মডিউল' },
    targets: { en: 'Arsenic in groundwater', bn: 'ভূগর্ভস্থ পানির আর্সেনিক' },
    method: { en: 'Adsorption / ion-exchange media stage', bn: 'অ্যাডসরপশন / আয়ন-এক্সচেঞ্জ মিডিয়া ধাপ' },
    addlCapexBdt: 100000,
    pricePerL: 0.6,
    note: {
      en: 'Selected only where source testing confirms arsenic above the national limit.',
      bn: 'শুধু তখনই নির্বাচিত, যখন উৎস পরীক্ষায় জাতীয় সীমার উপরে আর্সেনিক পাওয়া যায়।',
    },
  },
  {
    key: 'microbial',
    name: { en: 'Microbial module', bn: 'জীবাণু মডিউল' },
    targets: { en: 'Bacteria, protozoa, turbidity', bn: 'ব্যাকটেরিয়া, প্রোটোজোয়া, ঘোলাত্ব' },
    method: { en: 'Clarification + ultrafiltration stage ahead of UV', bn: 'ইউভির আগে ক্ল্যারিফিকেশন + আল্ট্রাফিল্ট্রেশন ধাপ' },
    addlCapexBdt: 75000,
    pricePerL: 0.65,
    note: {
      en: 'Selected for haor, pond and surface-water sources.',
      bn: 'হাওর, পুকুর ও ভূ-উপরিস্থ পানির উৎসের জন্য নির্বাচিত।',
    },
  },
  {
    key: 'sediment',
    name: { en: 'Iron & sediment module', bn: 'আয়রন ও পলি মডিউল' },
    targets: { en: 'Iron, sand, suspended solids', bn: 'আয়রন, বালি, ভাসমান কণা' },
    method: { en: 'Aeration + multimedia pre-filtration', bn: 'অ্যারেশন + মাল্টিমিডিয়া প্রি-ফিল্ট্রেশন' },
    addlCapexBdt: 40000,
    pricePerL: 0.5,
    note: {
      en: 'Placeholder configuration — indicative only, pending site survey.',
      bn: 'প্লেসহোল্ডার কনফিগারেশন — শুধু ইঙ্গিতমূলক, সাইট জরিপ বাকি।',
    },
  },
]

/* ------------------------------------------------------------------ *
 * Deployments
 * ------------------------------------------------------------------ */
interface CubeSeed {
  cube: Omit<JolCube, 'sensors' | 'components'>
  userCount: number
  tankCapacityL: number
  tankFillPct: number
  batteryPct: number
  solarPct: number
  uptimeBase: number
  operator: Omit<Operator, 'cubeId'>
  components: Array<{
    key: ComponentState['key']
    status: ComponentState['status']
    life: number
    lastServiceDaysAgo: number
    nextServiceInDays: number
  }>
}

const CUBE_SEEDS: CubeSeed[] = [
  {
    cube: {
      id: 'JC-STK-01',
      code: 'STK',
      name: { en: 'Shyamnagar JolCube', bn: 'শ্যামনগর জলকিউব' },
      district: { en: 'Satkhira', bn: 'সাতক্ষীরা' },
      hostSite: {
        en: 'Munshiganj Cyclone Shelter, Shyamnagar',
        bn: 'মুন্সিগঞ্জ সাইক্লোন শেল্টার, শ্যামনগর',
      },
      configuration: { en: 'Salinity (RO) + UV', bn: 'লবণাক্ততা (আরও) + ইউভি' },
      modules: ['sediment', 'salinity'],
      hazard: { en: 'Coastal salinity intrusion', bn: 'উপকূলীয় লবণাক্ততার অনুপ্রবেশ' },
      status: 'healthy',
      commissioned: dayOffset(-412),
      capexBdt: 500000,
      pricePerL: 0.75,
      serviceFeeBdt: 25,
      monthlyOpexBdt: 50000,
      operatingBalanceBdt: 184300,
      lat: 22.32,
      lon: 89.1,
    },
    userCount: 214,
    tankCapacityL: 5000,
    tankFillPct: 0.74,
    batteryPct: 86,
    solarPct: 0.62,
    uptimeBase: 99.4,
    operator: {
      id: 'op-stk',
      name: { en: 'Shirin Akter', bn: 'শিরিন আক্তার' },
      phone: '01712-004821',
      since: dayOffset(-400),
      trainedBy: 'UNDP Pani Apa curriculum',
    },
    components: [
      { key: 'sediment', status: 'healthy', life: 68, lastServiceDaysAgo: 24, nextServiceInDays: 36 },
      { key: 'treatment', status: 'healthy', life: 71, lastServiceDaysAgo: 96, nextServiceInDays: 84 },
      { key: 'uv', status: 'healthy', life: 62, lastServiceDaysAgo: 130, nextServiceInDays: 65 },
      { key: 'pump', status: 'healthy', life: 80, lastServiceDaysAgo: 41, nextServiceInDays: 49 },
      { key: 'tank', status: 'healthy', life: 91, lastServiceDaysAgo: 18, nextServiceInDays: 72 },
      { key: 'power', status: 'healthy', life: 77, lastServiceDaysAgo: 60, nextServiceInDays: 120 },
    ],
  },
  {
    cube: {
      id: 'JC-KHL-02',
      code: 'KHL',
      name: { en: 'Dacope JolCube', bn: 'ডাকোপ জলকিউব' },
      district: { en: 'Khulna', bn: 'খুলনা' },
      hostSite: { en: 'Upazila Complex, Dacope', bn: 'উপজেলা কমপ্লেক্স, ডাকোপ' },
      configuration: { en: 'Salinity + Microbial + UV', bn: 'লবণাক্ততা + জীবাণু + ইউভি' },
      modules: ['sediment', 'salinity', 'microbial'],
      hazard: {
        en: 'Salinity with microbial contamination',
        bn: 'লবণাক্ততার সঙ্গে জীবাণু দূষণ',
      },
      status: 'warning',
      commissioned: dayOffset(-286),
      capexBdt: 545000,
      pricePerL: 0.75,
      serviceFeeBdt: 25,
      monthlyOpexBdt: 52000,
      operatingBalanceBdt: 121750,
      lat: 22.57,
      lon: 89.51,
    },
    userCount: 186,
    tankCapacityL: 5000,
    tankFillPct: 0.58,
    batteryPct: 74,
    solarPct: 0.48,
    uptimeBase: 98.1,
    operator: {
      id: 'op-khl',
      name: { en: 'Rokeya Begum', bn: 'রোকেয়া বেগম' },
      phone: '01819-337204',
      since: dayOffset(-280),
      trainedBy: 'UNDP Pani Apa curriculum',
    },
    components: [
      { key: 'sediment', status: 'healthy', life: 55, lastServiceDaysAgo: 31, nextServiceInDays: 29 },
      { key: 'treatment', status: 'attention', life: 9, lastServiceDaysAgo: 171, nextServiceInDays: -4 },
      { key: 'uv', status: 'healthy', life: 58, lastServiceDaysAgo: 120, nextServiceInDays: 75 },
      { key: 'pump', status: 'healthy', life: 73, lastServiceDaysAgo: 52, nextServiceInDays: 38 },
      { key: 'tank', status: 'healthy', life: 88, lastServiceDaysAgo: 26, nextServiceInDays: 64 },
      { key: 'power', status: 'warning', life: 41, lastServiceDaysAgo: 88, nextServiceInDays: 11 },
    ],
  },
  {
    cube: {
      id: 'JC-SIR-03',
      code: 'SIR',
      name: { en: 'Chauhali JolCube', bn: 'চৌহালী জলকিউব' },
      district: { en: 'Sirajganj', bn: 'সিরাজগঞ্জ' },
      hostSite: {
        en: 'Union Parishad Complex, Chauhali',
        bn: 'ইউনিয়ন পরিষদ কমপ্লেক্স, চৌহালী',
      },
      configuration: { en: 'Arsenic + UV', bn: 'আর্সেনিক + ইউভি' },
      modules: ['sediment', 'arsenic'],
      hazard: {
        en: 'Arsenic in groundwater · flood-prone char',
        bn: 'ভূগর্ভস্থ পানিতে আর্সেনিক · বন্যাপ্রবণ চর',
      },
      status: 'healthy',
      commissioned: dayOffset(-198),
      capexBdt: 350000,
      pricePerL: 0.6,
      serviceFeeBdt: 25,
      monthlyOpexBdt: 46000,
      operatingBalanceBdt: 94200,
      lat: 24.06,
      lon: 89.72,
    },
    userCount: 158,
    tankCapacityL: 4000,
    tankFillPct: 0.81,
    batteryPct: 92,
    solarPct: 0.7,
    uptimeBase: 99.1,
    operator: {
      id: 'op-sir',
      name: { en: 'Taslima Khatun', bn: 'তাসলিমা খাতুন' },
      phone: '01911-562903',
      since: dayOffset(-190),
      trainedBy: 'UNDP Pani Apa curriculum',
    },
    components: [
      { key: 'sediment', status: 'healthy', life: 74, lastServiceDaysAgo: 15, nextServiceInDays: 45 },
      { key: 'treatment', status: 'healthy', life: 64, lastServiceDaysAgo: 74, nextServiceInDays: 106 },
      { key: 'uv', status: 'warning', life: 22, lastServiceDaysAgo: 160, nextServiceInDays: 9 },
      { key: 'pump', status: 'healthy', life: 85, lastServiceDaysAgo: 33, nextServiceInDays: 57 },
      { key: 'tank', status: 'healthy', life: 94, lastServiceDaysAgo: 12, nextServiceInDays: 78 },
      { key: 'power', status: 'healthy', life: 82, lastServiceDaysAgo: 45, nextServiceInDays: 135 },
    ],
  },
  {
    cube: {
      id: 'JC-SUN-04',
      code: 'SUN',
      name: { en: 'Tahirpur JolCube', bn: 'তাহিরপুর জলকিউব' },
      district: { en: 'Sunamganj', bn: 'সুনামগঞ্জ' },
      hostSite: { en: 'Haor Cyclone Shelter, Tahirpur', bn: 'হাওর সাইক্লোন শেল্টার, তাহিরপুর' },
      configuration: { en: 'Surface / haor pretreatment + UV', bn: 'ভূ-উপরিস্থ / হাওর প্রি-ট্রিটমেন্ট + ইউভি' },
      modules: ['sediment', 'microbial'],
      hazard: {
        en: 'Haor surface water · turbidity + microbial',
        bn: 'হাওরের ভূ-উপরিস্থ পানি · ঘোলাত্ব + জীবাণু',
      },
      status: 'attention',
      commissioned: dayOffset(-121),
      capexBdt: 325000,
      pricePerL: 0.65,
      serviceFeeBdt: 25,
      monthlyOpexBdt: 44000,
      operatingBalanceBdt: 51900,
      lat: 25.07,
      lon: 91.34,
    },
    userCount: 132,
    tankCapacityL: 4000,
    tankFillPct: 0.17,
    batteryPct: 38,
    solarPct: 0.21,
    uptimeBase: 94.6,
    operator: {
      id: 'op-sun',
      name: { en: 'Amena Khatun', bn: 'আমেনা খাতুন' },
      phone: '01737-118450',
      since: dayOffset(-115),
      trainedBy: 'UNDP Pani Apa curriculum',
    },
    components: [
      { key: 'sediment', status: 'warning', life: 19, lastServiceDaysAgo: 58, nextServiceInDays: 2 },
      { key: 'treatment', status: 'healthy', life: 61, lastServiceDaysAgo: 44, nextServiceInDays: 136 },
      { key: 'uv', status: 'healthy', life: 70, lastServiceDaysAgo: 62, nextServiceInDays: 118 },
      { key: 'pump', status: 'attention', life: 12, lastServiceDaysAgo: 96, nextServiceInDays: -6 },
      { key: 'tank', status: 'healthy', life: 90, lastServiceDaysAgo: 20, nextServiceInDays: 70 },
      { key: 'power', status: 'warning', life: 34, lastServiceDaysAgo: 70, nextServiceInDays: 20 },
    ],
  },
]

export const CUBE_IDS = CUBE_SEEDS.map((c) => c.cube.id)
export const DEMO_USER_ID = 'STK-0001'

/* ------------------------------------------------------------------ *
 * Builders
 * ------------------------------------------------------------------ */
function buildCube(s: CubeSeed): JolCube {
  const r = rng(hash(s.cube.id))
  const uvRated = 9000
  const uvComp = s.components.find((c) => c.key === 'uv')!
  return {
    ...s.cube,
    sensors: {
      tankL: Math.round(s.tankCapacityL * s.tankFillPct),
      tankCapacityL: s.tankCapacityL,
      flowLpm: s.cube.status === 'attention' ? 0 : Number(between(r, 4.2, 9.6).toFixed(1)),
      pumpOn: s.cube.status !== 'attention',
      pumpPressureBar: Number(between(r, 1.8, 2.6).toFixed(2)),
      solarW: Math.round(1100 * s.solarPct),
      solarPeakW: 1100,
      batteryPct: s.batteryPct,
      batteryHoursLeft: Math.round((s.batteryPct / 100) * 52),
      treatmentPressureBar: Number(between(r, 2.1, 3.4).toFixed(2)),
      uvIntensityPct: Math.max(52, Math.round(60 + uvComp.life * 0.4)),
      uvLampHours: Math.round(uvRated * (1 - uvComp.life / 100)),
      uvLampRatedHours: uvRated,
      tds: s.cube.modules.includes('salinity') ? intBetween(r, 180, 320) : intBetween(r, 240, 480),
      ph: Number(between(r, 6.8, 7.6).toFixed(1)),
      turbidityNtu: Number(between(r, 0.2, 0.9).toFixed(2)),
      lastSync: new Date(Date.now() - Math.round(between(r, 1, 9)) * 60000).toISOString(),
    },
    components: s.components.map((c) => ({
      key: c.key,
      status: c.status,
      life: c.life,
      lastService: dayOffset(-c.lastServiceDaysAgo),
      nextService: dayOffset(c.nextServiceInDays),
    })),
  }
}

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function buildUsers(s: CubeSeed): User[] {
  const r = rng(hash(s.cube.id + ':users'))
  const combos: Array<{ en: string; bn: string }> = []
  for (const [fe, fb] of MALE_FIRST)
    for (const [le, lb] of MALE_LAST) combos.push({ en: `${fe} ${le}`, bn: `${fb} ${lb}` })
  for (const [fe, fb] of FEMALE_FIRST)
    for (const [le, lb] of FEMALE_LAST) combos.push({ en: `${fe} ${le}`, bn: `${fb} ${lb}` })

  // Fisher–Yates with the seeded RNG so the roster is stable but not alphabetical
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[combos[i], combos[j]] = [combos[j], combos[i]]
  }

  const users: User[] = []
  for (let i = 0; i < s.userCount; i++) {
    const id = `${s.cube.code}-${String(i + 1).padStart(4, '0')}`
    const size = intBetween(r, 3, 7)
    const perDay = Math.max(6, Math.round(size * between(r, 3.2, 5.4)))
    const monthDay = new Date().getDate()
    const roll = r()
    const balance =
      roll < 0.12 ? intBetween(r, 0, 45) : roll < 0.5 ? intBetween(r, 60, 180) : intBetween(r, 190, 620)
    const flag: User['flag'] | undefined =
      roll > 0.955 ? 'high' : roll > 0.925 ? 'low' : undefined
    users.push({
      id,
      cubeId: s.cube.id,
      name: combos[i % combos.length],
      household: `Ward ${intBetween(r, 1, 9)} · House ${intBetween(r, 1, 240)}`,
      phone: `01${pick(r, ['7', '8', '9', '6'])}${String(intBetween(r, 10000000, 99999999))}`.slice(0, 11),
      balanceBdt: balance,
      todayL: r() < 0.55 ? Math.round(perDay * between(r, 0.4, 1.1)) : 0,
      monthL: Math.round(perDay * monthDay * between(r, 0.78, 1.12)),
      householdSize: size,
      joined: dayOffset(-intBetween(r, 20, daysBetween(s.cube.commissioned, today()))),
      lastActive: stamp(intBetween(r, 0, 6), intBetween(r, 7, 18), intBetween(r, 0, 59)),
      flag: flag === 'high' ? 'high' : flag === 'low' ? 'low' : undefined,
    })
  }

  // The scripted demo account — fixed so the competition walkthrough is identical every time.
  if (s.cube.id === 'JC-STK-01') {
    users[0] = {
      ...users[0],
      id: DEMO_USER_ID,
      name: { en: 'Rahim Uddin', bn: 'রহিম উদ্দিন' },
      household: 'Ward 3 · House 41',
      phone: '01719-460233',
      balanceBdt: 50,
      todayL: 0,
      monthL: 386,
      householdSize: 5,
      flag: undefined,
    }
  }
  return users
}

function buildUsage(s: CubeSeed, users: User[]): DayStat[] {
  const r = rng(hash(s.cube.id + ':usage'))
  const out: DayStat[] = []
  const base = users.length * 18.6 + 900 // households + institutional offtake
  for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
    const date = dayOffset(-d)
    const weekday = new Date(date + 'T12:00:00').getDay()
    const weekly = weekday === 5 ? 0.88 : weekday === 6 ? 0.94 : 1
    const drift = 1 + (HISTORY_DAYS - d) * 0.0018 // slow growth as households join
    let factor = weekly * drift * between(r, 0.93, 1.07)

    // The Tahirpur unit has been degrading for the past fortnight.
    if (s.cube.id === 'JC-SUN-04' && d < 14) factor *= 1 - (14 - d) * 0.035
    // Dacope's treatment module is at end of life — output has been slipping.
    if (s.cube.id === 'JC-KHL-02' && d < 9) factor *= 1 - (9 - d) * 0.014

    const dispensed = Math.round((base * factor) / 10) * 10
    const produced = Math.round((dispensed * between(r, 1.03, 1.14)) / 10) * 10
    const revenue = Math.round(dispensed * s.cube.pricePerL + (users.length * s.cube.serviceFeeBdt) / 30)
    const bkash = Math.round(revenue * between(r, 0.42, 0.5))
    const nagad = Math.round(revenue * between(r, 0.16, 0.22))
    const uptime = Number(
      Math.min(100, Math.max(78, s.uptimeBase - (r() < 0.12 ? between(r, 1, 9) : between(r, 0, 0.6)))).toFixed(1),
    )
    out.push({
      date,
      producedL: produced,
      dispensedL: dispensed,
      revenueBdt: revenue,
      bkashBdt: bkash,
      nagadBdt: nagad,
      cashBdt: revenue - bkash - nagad,
      activeUsers: Math.round(users.length * between(r, 0.52, 0.71)),
      uptimePct: uptime,
    })
  }

  // Today is partial — it is still in progress when the demo is running.
  const t = out[out.length - 1]
  const share = Math.min(0.95, Math.max(0.25, new Date().getHours() / 22))
  t.producedL = Math.round((t.producedL * share) / 10) * 10
  t.dispensedL = Math.round((t.dispensedL * share) / 10) * 10
  t.revenueBdt = Math.round(t.revenueBdt * share)
  t.bkashBdt = Math.round(t.bkashBdt * share)
  t.nagadBdt = Math.round(t.nagadBdt * share)
  t.cashBdt = t.revenueBdt - t.bkashBdt - t.nagadBdt
  t.activeUsers = Math.round(t.activeUsers * share)
  return out
}

function buildTransactions(cube: JolCube, users: User[]): Transaction[] {
  const r = rng(hash(cube.id + ':txn'))
  const methods: PaymentMethod[] = ['bkash', 'bkash', 'nagad', 'cash', 'cash']
  const txns: Transaction[] = []
  let n = 0

  for (let d = 4; d >= 0; d--) {
    for (const u of users) {
      if (r() > 0.26) continue
      const hour = intBetween(r, 7, 18)
      const litres = Math.max(10, Math.round((u.householdSize * between(r, 3, 5)) / 5) * 5)
      txns.push({
        id: `${cube.code}-T${String(++n).padStart(5, '0')}`,
        userId: u.id,
        cubeId: cube.id,
        ts: stamp(d, hour, intBetween(r, 0, 59)),
        type: 'dispense',
        amountBdt: Number((litres * cube.pricePerL).toFixed(2)),
        litres,
      })
      if (r() < 0.34) {
        const amount = pick(r, [50, 100, 100, 150, 200, 300])
        txns.push({
          id: `${cube.code}-T${String(++n).padStart(5, '0')}`,
          userId: u.id,
          cubeId: cube.id,
          ts: stamp(d, Math.max(6, hour - 1), intBetween(r, 0, 59)),
          type: 'topup',
          amountBdt: amount,
          litres: 0,
          method: pick(r, methods),
        })
      }
    }
  }

  // A deeper history for the scripted demo account so its ledger looks lived-in.
  const demo = users.find((u) => u.id === DEMO_USER_ID)
  if (demo) {
    for (let d = 28; d >= 1; d--) {
      if (r() > 0.6) continue
      const litres = pick(r, [15, 20, 20, 25, 30])
      txns.push({
        id: `${cube.code}-D${String(d).padStart(3, '0')}`,
        userId: demo.id,
        cubeId: cube.id,
        ts: stamp(d, intBetween(r, 7, 17), intBetween(r, 0, 59)),
        type: 'dispense',
        amountBdt: Number((litres * cube.pricePerL).toFixed(2)),
        litres,
      })
      if (d % 9 === 2) {
        txns.push({
          id: `${cube.code}-DT${String(d).padStart(3, '0')}`,
          userId: demo.id,
          cubeId: cube.id,
          ts: stamp(d, 9, 12),
          type: 'topup',
          amountBdt: pick(r, [100, 150, 200]),
          litres: 0,
          method: pick(r, methods),
        })
      }
    }
  }

  return txns.sort((a, b) => b.ts.localeCompare(a.ts))
}

const MAINTENANCE_ACTIONS: Record<ComponentState['key'], Array<{ en: string; bn: string }>> = {
  sediment: [
    { en: 'Sediment filter replaced', bn: 'পলি ফিল্টার পরিবর্তন করা হয়েছে' },
    { en: 'Sediment filter backwashed', bn: 'পলি ফিল্টার ব্যাকওয়াশ করা হয়েছে' },
  ],
  treatment: [
    { en: 'Treatment module media replaced', bn: 'ট্রিটমেন্ট মডিউলের মিডিয়া পরিবর্তন' },
    { en: 'Treatment module pressure check', bn: 'ট্রিটমেন্ট মডিউলের চাপ পরীক্ষা' },
  ],
  uv: [
    { en: 'UV lamp replaced', bn: 'ইউভি ল্যাম্প পরিবর্তন করা হয়েছে' },
    { en: 'UV quartz sleeve cleaned', bn: 'ইউভি কোয়ার্টজ স্লিভ পরিষ্কার' },
  ],
  pump: [
    { en: 'Pump serviced, seals replaced', bn: 'পাম্প সার্ভিসিং, সিল পরিবর্তন' },
    { en: 'Pump impeller cleaned', bn: 'পাম্পের ইম্পেলার পরিষ্কার' },
  ],
  tank: [
    { en: 'Storage tank cleaned and sanitised', bn: 'স্টোরেজ ট্যাংক পরিষ্কার ও জীবাণুমুক্ত' },
    { en: 'Tank inlet screen replaced', bn: 'ট্যাংকের ইনলেট স্ক্রিন পরিবর্তন' },
  ],
  power: [
    { en: 'Solar panels cleaned', bn: 'সোলার প্যানেল পরিষ্কার' },
    { en: 'Battery bank tested', bn: 'ব্যাটারি ব্যাংক পরীক্ষা' },
  ],
}

const TECHNICIANS = ['Nazrul (Tech-01)', 'Sohel (Tech-02)', 'Jamal (Tech-03)']

function buildMaintenance(s: CubeSeed): MaintenanceRecord[] {
  const r = rng(hash(s.cube.id + ':maint'))
  const out: MaintenanceRecord[] = []
  let n = 0
  const span = daysBetween(s.cube.commissioned, today())

  for (const c of s.components) {
    // The most recent service is the one shown on the component card.
    out.push({
      id: `${s.cube.code}-M${String(++n).padStart(3, '0')}`,
      cubeId: s.cube.id,
      component: c.key,
      date: dayOffset(-c.lastServiceDaysAgo),
      action: MAINTENANCE_ACTIONS[c.key][0],
      by: pick(r, TECHNICIANS),
      costBdt: intBetween(r, 4, 60) * 100,
    })
    // Plus one or two earlier visits, where the unit is old enough to have them.
    const earlier = span > 200 ? 2 : 1
    for (let i = 1; i <= earlier; i++) {
      const daysAgo = c.lastServiceDaysAgo + intBetween(r, 45, 90) * i
      if (daysAgo >= span) continue
      out.push({
        id: `${s.cube.code}-M${String(++n).padStart(3, '0')}`,
        cubeId: s.cube.id,
        component: c.key,
        date: dayOffset(-daysAgo),
        action: pick(r, MAINTENANCE_ACTIONS[c.key]),
        by: pick(r, TECHNICIANS),
        costBdt: intBetween(r, 3, 40) * 100,
      })
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date))
}

function buildAlerts(): Alert[] {
  return [
    {
      id: 'AL-001',
      cubeId: 'JC-KHL-02',
      kind: 'module_due',
      severity: 'critical',
      component: 'treatment',
      createdAt: stamp(2, 8, 14),
      status: 'open',
      detail: {
        en: 'RO membrane stage is past its scheduled replacement date. Output has dropped 9% over nine days.',
        bn: 'আরও মেমব্রেন ধাপের নির্ধারিত পরিবর্তনের তারিখ পার হয়েছে। নয় দিনে উৎপাদন ৯% কমেছে।',
      },
    },
    {
      id: 'AL-002',
      cubeId: 'JC-SUN-04',
      kind: 'pump',
      severity: 'critical',
      component: 'pump',
      createdAt: stamp(1, 6, 40),
      status: 'open',
      detail: {
        en: 'Intake pump stopped drawing. No flow recorded since 06:20 today.',
        bn: 'ইনটেক পাম্প পানি টানছে না। আজ সকাল ৬:২০ থেকে কোনো প্রবাহ রেকর্ড হয়নি।',
      },
    },
    {
      id: 'AL-003',
      cubeId: 'JC-SUN-04',
      kind: 'low_tank',
      severity: 'critical',
      createdAt: stamp(0, 7, 5),
      status: 'open',
      detail: {
        en: 'Safe-water tank at 17%. Below the reserve threshold held for emergency dispensing.',
        bn: 'নিরাপদ পানির ট্যাংক ১৭%-এ। জরুরি বিতরণের জন্য রাখা সংরক্ষিত সীমার নিচে।',
      },
    },
    {
      id: 'AL-004',
      cubeId: 'JC-SUN-04',
      kind: 'low_production',
      severity: 'warning',
      createdAt: stamp(3, 17, 30),
      status: 'open',
      detail: {
        en: 'Daily production has fallen 34% below the 30-day average.',
        bn: '৩০ দিনের গড়ের তুলনায় দৈনিক উৎপাদন ৩৪% কমেছে।',
      },
    },
    {
      id: 'AL-005',
      cubeId: 'JC-SIR-03',
      kind: 'maintenance_overdue',
      severity: 'warning',
      component: 'uv',
      createdAt: stamp(1, 9, 0),
      status: 'open',
      detail: {
        en: 'UV lamp has 9 days of rated life left. Schedule replacement before the monsoon peak.',
        bn: 'ইউভি ল্যাম্পের নির্ধারিত আয়ু আর ৯ দিন। বর্ষার আগে পরিবর্তনের পরিকল্পনা করুন।',
      },
    },
    {
      id: 'AL-006',
      cubeId: 'JC-STK-01',
      kind: 'unusual_consumption',
      severity: 'warning',
      createdAt: stamp(0, 11, 20),
      status: 'open',
      detail: {
        en: '3 households drew more than twice their usual daily volume. Worth a check for a leak or resale.',
        bn: '৩টি পরিবার তাদের স্বাভাবিক দৈনিক পরিমাণের দ্বিগুণের বেশি নিয়েছে। লিক বা পুনঃবিক্রয় হচ্ছে কিনা দেখুন।',
      },
    },
    {
      id: 'AL-007',
      cubeId: 'JC-STK-01',
      kind: 'quality_test_due',
      severity: 'info',
      createdAt: stamp(4, 10, 0),
      status: 'open',
      detail: {
        en: 'Monthly third-party water-quality test is due within 6 days.',
        bn: 'মাসিক তৃতীয়-পক্ষ পানির মান পরীক্ষা ৬ দিনের মধ্যে করতে হবে।',
      },
    },
    {
      id: 'AL-008',
      cubeId: 'JC-KHL-02',
      kind: 'sensor',
      severity: 'warning',
      createdAt: stamp(5, 13, 45),
      status: 'open',
      detail: {
        en: 'Battery bank reporting intermittently. Two sync gaps in the last 24 hours.',
        bn: 'ব্যাটারি ব্যাংক অনিয়মিতভাবে রিপোর্ট করছে। গত ২৪ ঘণ্টায় দুইবার সিঙ্ক বিচ্ছিন্ন হয়েছে।',
      },
    },
    {
      id: 'AL-009',
      cubeId: 'JC-SIR-03',
      kind: 'offline',
      severity: 'warning',
      createdAt: stamp(9, 4, 10),
      status: 'resolved',
      resolvedAt: stamp(9, 11, 25),
      detail: {
        en: 'Unit was offline for 7 hours after a storm knocked out the mobile network.',
        bn: 'ঝড়ে মোবাইল নেটওয়ার্ক বন্ধ হয়ে যাওয়ায় ইউনিটটি ৭ ঘণ্টা অফলাইন ছিল।',
      },
    },
    {
      id: 'AL-010',
      cubeId: 'JC-STK-01',
      kind: 'low_tank',
      severity: 'warning',
      createdAt: stamp(12, 15, 0),
      status: 'resolved',
      resolvedAt: stamp(12, 19, 30),
      detail: {
        en: 'Tank dropped to 22% during a peak collection afternoon. Recovered overnight.',
        bn: 'বিকেলে সর্বোচ্চ সংগ্রহের সময় ট্যাংক ২২%-এ নামে। রাতের মধ্যে পুনরুদ্ধার হয়েছে।',
      },
    },
    {
      id: 'AL-011',
      cubeId: 'JC-KHL-02',
      kind: 'maintenance_overdue',
      severity: 'info',
      component: 'power',
      createdAt: stamp(6, 8, 30),
      status: 'resolved',
      resolvedAt: stamp(5, 16, 0),
      detail: {
        en: 'Solar panel cleaning was 11 days overdue. Completed by the cluster technician.',
        bn: 'সোলার প্যানেল পরিষ্কার ১১ দিন বিলম্বিত ছিল। ক্লাস্টার টেকনিশিয়ান সম্পন্ন করেছেন।',
      },
    },
  ]
}

/* ------------------------------------------------------------------ *
 * Entry point
 * ------------------------------------------------------------------ */
export function createSeedState(): AppState {
  const cubes = CUBE_SEEDS.map(buildCube)
  const operators: Operator[] = CUBE_SEEDS.map((s) => ({ ...s.operator, cubeId: s.cube.id }))
  const users: User[] = []
  const usage: Record<string, DayStat[]> = {}
  const transactions: Transaction[] = []
  const maintenance: MaintenanceRecord[] = []

  CUBE_SEEDS.forEach((s, i) => {
    const cubeUsers = buildUsers(s)
    users.push(...cubeUsers)
    usage[s.cube.id] = buildUsage(s, cubeUsers)
    transactions.push(...buildTransactions(cubes[i], cubeUsers))
    maintenance.push(...buildMaintenance(s))
  })

  return {
    version: STATE_VERSION,
    seededOn: today(),
    cubes,
    operators,
    users,
    transactions: transactions.sort((a, b) => b.ts.localeCompare(a.ts)),
    usage,
    maintenance: maintenance.sort((a, b) => b.date.localeCompare(a.date)),
    alerts: buildAlerts(),
    activeUserId: DEMO_USER_ID,
    activeCubeId: 'JC-STK-01',
  }
}
