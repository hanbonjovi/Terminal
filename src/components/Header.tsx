import { useState, useEffect } from 'react'

interface HeaderProps {
  lastUpdated: Date | null
  countdown: number
  onRefresh: () => void
  loading: boolean
  viewMode: 'table' | 'heatmap'
  onViewModeChange: (mode: 'table' | 'heatmap') => void
  onAnalyze: () => void
}

function getMarketStatus(): { status: string; color: string; label: string } {
  const now = new Date()
  const et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = et.getDay()
  const hours = et.getHours()
  const minutes = et.getMinutes()
  const time = hours * 60 + minutes

  // Weekend
  if (day === 0 || day === 6) {
    return { status: 'CLOSED', color: 'text-red-500', label: 'MARKET CLOSED' }
  }
  // Pre-market: 4:00 AM - 9:30 AM ET
  if (time >= 240 && time < 570) {
    return { status: 'PRE', color: 'text-amber-400', label: 'PRE-MARKET' }
  }
  // Regular: 9:30 AM - 4:00 PM ET
  if (time >= 570 && time < 960) {
    return { status: 'OPEN', color: 'text-green-400', label: 'MARKET OPEN' }
  }
  // After-hours: 4:00 PM - 8:00 PM ET
  if (time >= 960 && time < 1200) {
    return { status: 'AFTER', color: 'text-amber-400', label: 'AFTER HOURS' }
  }
  return { status: 'CLOSED', color: 'text-red-500', label: 'MARKET CLOSED' }
}

function NYClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    function tick() {
      setTime(
        new Date().toLocaleTimeString('en-US', {
          timeZone: 'America/New_York',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return <span className="tabular-nums">{time}</span>
}

export function Header({
  lastUpdated,
  countdown,
  onRefresh,
  loading,
  viewMode,
  onViewModeChange,
  onAnalyze,
}: HeaderProps) {
  const market = getMarketStatus()

  return (
    <header className="border-b border-gray-800 bg-[#060a12] px-3 py-2">
      {/* Top row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold tracking-wider">
            <span className="text-amber-500">STOCK</span>
            <span className="text-gray-400">TERMINAL</span>
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-[10px]">
            <span className={`font-bold ${market.color}`}>
              <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{
                backgroundColor: market.status === 'OPEN' ? '#22c55e' : market.status === 'CLOSED' ? '#ef4444' : '#f59e0b',
                boxShadow: market.status === 'OPEN' ? '0 0 6px #22c55e' : 'none'
              }} />
              {market.label}
            </span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-500">
              NY <NYClock />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          {/* Analyze button */}
          <button
            onClick={onAnalyze}
            className="px-2.5 py-1 bg-cyan-900/30 border border-cyan-700/50 rounded text-[10px] text-cyan-400 hover:bg-cyan-800/40 hover:border-cyan-600 transition-colors font-bold"
          >
            ANALYZE
          </button>

          {/* View mode toggle */}
          <div className="flex border border-gray-700 rounded overflow-hidden">
            <button
              onClick={() => onViewModeChange('table')}
              className={`px-2 py-1 text-[10px] transition-colors ${
                viewMode === 'table'
                  ? 'bg-amber-500/20 text-amber-400 border-r border-gray-700'
                  : 'text-gray-500 hover:text-gray-300 border-r border-gray-700'
              }`}
            >
              TABLE
            </button>
            <button
              onClick={() => onViewModeChange('heatmap')}
              className={`px-2 py-1 text-[10px] transition-colors ${
                viewMode === 'heatmap'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              HEATMAP
            </button>
          </div>

          {lastUpdated && (
            <span className="hidden sm:inline text-gray-600 tabular-nums">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <span className="tabular-nums text-gray-500">
            {loading ? (
              <span className="text-amber-400 animate-pulse">LOADING</span>
            ) : (
              <span>{countdown}s</span>
            )}
          </span>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-1.5 py-0.5 border border-gray-700 rounded text-gray-500 hover:text-amber-400 hover:border-amber-800 transition-colors disabled:opacity-30 text-xs"
          >
            ↻
          </button>
        </div>
      </div>
    </header>
  )
}
