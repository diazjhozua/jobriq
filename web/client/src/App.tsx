import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ApplicationsPage } from './features/applications/ApplicationsPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { JobriqProvider } from './providers/JobriqProvider'

export default function App() {
  return (
    <JobriqProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="*" element={<Navigate to="/profile" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </JobriqProvider>
  )
}
