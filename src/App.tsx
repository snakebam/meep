import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PasswordGate } from './components/auth/PasswordGate'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { TaskDetailPage } from './pages/TaskDetailPage'
import { SubjectPage } from './pages/SubjectPage'
import { AssignmentPage } from './pages/AssignmentPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PasswordGate />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/subjects/:subjectId" element={<SubjectPage />} />
            <Route path="/assignments/:id" element={<AssignmentPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
