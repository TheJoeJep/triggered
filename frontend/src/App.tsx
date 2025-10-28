import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import TriggersPage from './pages/TriggersPage'
import TriggerDetailPage from './pages/TriggerDetailPage'
import ApiKeysPage from './pages/ApiKeysPage'
import McpPage from './pages/McpPage'
import Layout from './components/Layout'

function App() {
  const { token } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={token ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route
          path="/*"
          element={
            token ? (
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/triggers" element={<TriggersPage />} />
                  <Route path="/triggers/:id" element={<TriggerDetailPage />} />
                  <Route path="/api-keys" element={<ApiKeysPage />} />
                  <Route path="/mcp" element={<McpPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

