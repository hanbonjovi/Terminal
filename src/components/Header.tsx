interface HeaderProps {
  lastUpdated: Date | null
  countdown: number
  onRefresh: () => void
  loading: boolean
}

export function Header({ lastUpdated, countdown, onRefresh, loading }: HeaderProps) {
  return (
    <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-green-400 tracking-wider">
          STOCK<span className="text-gray-400">TERMINAL</span>
        </h1>
        <span className="text-xs text-gray-600 hidden sm:inline">
          Multi-Sector Market Dashboard
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {lastUpdated && (
          <span className="hidden sm:inline">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <span className="tabular-nums">
          {loading ? (
            <span className="text-yellow-500">LOADING...</span>
          ) : (
            <span>
              Refresh in <span className="text-gray-300">{countdown}s</span>
            </span>
          )}
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-2 py-1 border border-gray-700 rounded text-gray-400 hover:text-green-400 hover:border-green-800 transition-colors disabled:opacity-50"
        >
          ↻
        </button>
      </div>
    </header>
  )
}
