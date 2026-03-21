import { useState, useMemo, useEffect } from 'react'
import { categories } from './data/categories'
import { useStockData } from './hooks/useStockData'
import { Header } from './components/Header'
import { MarketIndices } from './components/MarketIndices'
import { TickerTape } from './components/TickerTape'
import { CategoryToggle } from './components/CategoryToggle'
import { SectorSummary } from './components/SectorSummary'
import { StockTable } from './components/StockTable'
import { HeatMap } from './components/HeatMap'
import { StockAnalysis } from './components/StockAnalysis'
import { SettingsModal } from './components/SettingsModal'

function App() {
  const [activeCategoryId, setActiveCategoryId] = useState(categories[0].id)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'heatmap'>('table')
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [analysisSymbol, setAnalysisSymbol] = useState<string | undefined>()

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === activeCategoryId) ?? categories[0],
    [activeCategoryId]
  )

  const { quotes, loading, error, lastUpdated, countdown, refresh } = useStockData(
    activeCategory.id,
    activeCategory.tickers
  )

  // Open analysis for a specific symbol (from table row click)
  function openAnalysis(symbol?: string) {
    setAnalysisSymbol(symbol)
    setAnalysisOpen(true)
  }

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      // Escape closes analysis modal
      if (e.key === 'Escape' && analysisOpen) {
        setAnalysisOpen(false)
        return
      }
      const num = parseInt(e.key)
      if (!isNaN(num)) {
        const idx = num === 0 ? 9 : num - 1
        if (idx < categories.length) {
          setActiveCategoryId(categories[idx].id)
        }
      }
      if (e.key === 'r' || e.key === 'R') refresh()
      if (e.key === 'v' || e.key === 'V') setViewMode(m => m === 'table' ? 'heatmap' : 'table')
      if (e.key === 'a' || e.key === 'A') openAnalysis()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [refresh, analysisOpen])

  return (
    <div className="h-screen flex flex-col bg-[#030711] text-gray-100">
      {/* Market indices bar */}
      <MarketIndices />

      {/* Header with controls */}
      <Header
        lastUpdated={lastUpdated}
        countdown={countdown}
        onRefresh={refresh}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAnalyze={() => openAnalysis()}
      />

      {/* Category selector */}
      <CategoryToggle
        categories={categories}
        activeId={activeCategoryId}
        onSelect={setActiveCategoryId}
      />

      {/* Sector summary with performance bars */}
      <SectorSummary quotes={quotes} category={activeCategory} />

      {/* Ticker tape */}
      <TickerTape quotes={quotes} />

      {/* Main content: table or heatmap */}
      {viewMode === 'table' ? (
        <StockTable
          quotes={quotes}
          loading={loading}
          error={error}
          onRetry={refresh}
          onAnalyze={openAnalysis}
        />
      ) : (
        <HeatMap quotes={quotes} onAnalyze={openAnalysis} />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#060a12] px-3 py-1.5 flex items-center justify-between text-[9px] text-gray-600">
        <div className="flex items-center gap-3">
          <span className="text-amber-500/60 font-bold">STOCKTERMINAL</span>
          <span>
            {quotes.length} instruments
          </span>
          <span className="hidden sm:inline text-gray-700">
            Yahoo Finance / Finnhub
          </span>
          <span className="hidden md:inline text-gray-700">
            Keys: 1-0 sectors · R refresh · V view · A analyze
          </span>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-gray-600 hover:text-amber-400 transition-colors"
        >
          CONFIG
        </button>
      </footer>

      <StockAnalysis
        isOpen={analysisOpen}
        onClose={() => setAnalysisOpen(false)}
        initialSymbol={analysisSymbol}
      />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default App
