import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Background from './Background'

export default function Layout() {
  return (
    <div className="flex min-h-screen relative overflow-hidden bg-black">
      <Background />
      <Sidebar />
      <main className="flex-1 pl-64 relative z-10 min-h-screen">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
