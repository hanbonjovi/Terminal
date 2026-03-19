import { useState, useMemo } from 'react'
import { categories } from './data/categories'
import { useStockData } from './hooks/useStockData'
import { Header } from './components/Header'
import { CategoryToggle } from './components/CategoryToggle'
import { SectorSummary } from './components/SectorSummary'
import { StockTable } from './components/StockTable'
import { SettingsModal } from './components/SettingsModal'

function App() {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? categories[0],
    [activeCategoryId]
  )

  const { quotes, loading, error, lastUpdated, countdown, refresh } = useStockData(
    activeCategory.id,
    activeCategory.tickers
  )

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-gray-100">
      <Header
        lastUpdated={lastUpdated}
        countdown={countdown}
        onRefresh={refresh}
        loading={loading}
      />

      <CategoryToggle
        categories={categories}
        activeId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      <SectorSummary quotes={quotes} category={activeCategory} />

      <StockTable
        quotes={quotes}
        loading={loading}
        error={error}
        onRetry={refresh}
      />

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-2 flex items-center justify-between text-[10px] text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            {quotes.length} stocks · {activeCategory.name} sector
          </span>
          <span className="hidden sm:inline">
            Data: Yahoo Finance → Finnhub fallback
          </span>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-gray-600 hover:text-gray-400 transition-colors"
        >
          ⚙ Settings
        </button>
      </footer>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
