import { Navigate, Route, Routes } from 'react-router-dom'
import { UserLayout } from '@/views/user/UserLayout'
import { UserHome } from '@/views/user/UserHome'
import { UserUsage } from '@/views/user/UserUsage'
import { UserTransactions } from '@/views/user/UserTransactions'
import { UserAccount } from '@/views/user/UserAccount'
import { ApaLayout } from '@/views/apa/ApaLayout'
import { ApaOverview } from '@/views/apa/ApaOverview'
import { ApaWater } from '@/views/apa/ApaWater'
import { ApaUsers } from '@/views/apa/ApaUsers'
import { ApaRevenue } from '@/views/apa/ApaRevenue'
import { ApaMaintenance } from '@/views/apa/ApaMaintenance'
import { ApaAlerts } from '@/views/apa/ApaAlerts'
import { TeamLayout } from '@/views/team/TeamLayout'
import { TeamOverview } from '@/views/team/TeamOverview'
import { TeamCubes } from '@/views/team/TeamCubes'
import { TeamCubeDetail } from '@/views/team/TeamCubeDetail'
import { TeamAnalytics } from '@/views/team/TeamAnalytics'
import { TeamAlerts } from '@/views/team/TeamAlerts'
import { TeamMaintenance } from '@/views/team/TeamMaintenance'
import { StoryModel } from '@/views/story/StoryModel'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/user" replace />} />

      <Route path="/user" element={<UserLayout />}>
        <Route index element={<UserHome />} />
        <Route path="usage" element={<UserUsage />} />
        <Route path="transactions" element={<UserTransactions />} />
        <Route path="account" element={<UserAccount />} />
      </Route>

      <Route path="/apa" element={<ApaLayout />}>
        <Route index element={<ApaOverview />} />
        <Route path="water" element={<ApaWater />} />
        <Route path="users" element={<ApaUsers />} />
        <Route path="revenue" element={<ApaRevenue />} />
        <Route path="maintenance" element={<ApaMaintenance />} />
        <Route path="alerts" element={<ApaAlerts />} />
      </Route>

      <Route path="/team" element={<TeamLayout />}>
        <Route index element={<TeamOverview />} />
        <Route path="cubes" element={<TeamCubes />} />
        <Route path="cubes/:id" element={<TeamCubeDetail />} />
        <Route path="analytics" element={<TeamAnalytics />} />
        <Route path="alerts" element={<TeamAlerts />} />
        <Route path="maintenance" element={<TeamMaintenance />} />
      </Route>

      <Route path="/model" element={<StoryModel />} />

      <Route path="*" element={<Navigate to="/user" replace />} />
    </Routes>
  )
}
