import type { StockQuote } from '../types'
import type { StockCategory } from '../data/categories'

interface SectorSummaryProps {
  quotes: StockQuote[]
  category: StockCategory
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toLocaleString()}`
}

export function SectorSummary({ quotes, category }: SectorSummaryProps) {
  if (quotes.length === 0) return null

  const gainers = quotes.filter((q) => q.regularMarketChange > 0).length
  const losers = quotes.filter((q) => q.regularMarketChange < 0).length
  const unchanged = quotes.length - gainers - losers

  const avgChange =
    quotes.reduce((sum, q) => sum + q.regularMarketChangePercent, 0) / quotes.length
  const totalMarketCap = quotes.reduce((sum, q) => sum + q.marketCap, 0)
  const totalVolume = quotes.reduce((sum, q) => sum + q.regularMarketVolume, 0)

  const bestPerformer = quotes.reduce((best, q) =>
    q.regularMarketChangePercent > best.regularMarketChangePercent ? q : best
  )
  const worstPerformer = quotes.reduce((worst, q) =>
    q.regularMarketChangePercent < worst.regularMarketChangePercent ? q : worst
  )

  return (
    <div className="border-b border-gray-800 px-4 py-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        <SummaryCard
          label="SECTOR"
          value={`${category.icon} ${category.name}`}
          color={category.color}
        />
        <SummaryCard
          label="AVG CHANGE"
          value={`${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`}
          color={avgChange >= 0 ? '#22c55e' : '#ef4444'}
        />
        <SummaryCard
          label="GAINERS / LOSERS"
          value={`${gainers} ↑  ${losers} ↓  ${unchanged} —`}
          color="#9ca3af"
        />
        <SummaryCard
          label="TOTAL MKT CAP"
          value={formatMarketCap(totalMarketCap)}
          color="#60a5fa"
        />
        <SummaryCard
          label="TOTAL VOLUME"
          value={totalVolume >= 1e6 ? `${(totalVolume / 1e6).toFixed(1)}M` : totalVolume.toLocaleString()}
          color="#a78bfa"
        />
        <SummaryCard
          label="BEST"
          value={`${bestPerformer.symbol} ${bestPerformer.regularMarketChangePercent >= 0 ? '+' : ''}${bestPerformer.regularMarketChangePercent.toFixed(2)}%`}
          color="#22c55e"
        />
        <SummaryCard
          label="WORST"
          value={`${worstPerformer.symbol} ${worstPerformer.regularMarketChangePercent.toFixed(2)}%`}
          color="#ef4444"
        />
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-gray-900/50 rounded px-3 py-2 border border-gray-800/50">
      <div className="text-gray-600 text-[10px] mb-1">{label}</div>
      <div className="font-medium tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  )
}
