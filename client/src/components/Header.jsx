import { useState, useEffect } from 'react'
import { Search, FileText, Clock, Menu } from 'lucide-react'

export default function Header({ toggleSidebar }) {
  const [time, setTime] = useState(formatTime())

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="h-16 border-b border-dash-border flex items-center justify-between px-8 shrink-0 bg-dash-bg/80 backdrop-blur-md">
      {/* Search */}
      <div className="flex-1 max-w-xl flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 -ml-4 text-gray-400 hover:text-white transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-dash-accent transition-colors" />
          <input
            type="text"
            placeholder="Search shipments, ports, or alerts..."
            className="w-full bg-dash-card border border-dash-border text-sm rounded-full pl-10 pr-4 py-2 text-gray-200 placeholder:text-gray-600 focus:ring-1 focus:ring-dash-accent focus:border-dash-accent transition-all outline-none"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-6">
        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-dash-card border border-dash-border hover:border-dash-accent transition-colors">
          <FileText className="w-4 h-4 text-dash-accent" />
          <span className="text-xs font-medium text-gray-300">Reports</span>
        </button>

        <div className="flex items-center gap-3 px-4 py-2 bg-dash-card border border-dash-border rounded-full text-xs">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-white">{time}</span>
        </div>

        <div className="w-10 h-10 rounded-full border border-dash-border overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
          JD
        </div>
      </div>
    </header>
  )
}

function formatTime() {
  const now = new Date()
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
  })
}
