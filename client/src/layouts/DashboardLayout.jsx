import { useState } from 'react'
import { Outlet } from 'react-router'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-dash-bg">
      <Sidebar isOpen={isSidebarOpen} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 transition-all duration-300">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
