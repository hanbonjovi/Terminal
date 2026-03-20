import type { StockQuote } from '../types'
import type { StockCategory } from '../data/categories'

interface SectorSummaryProps {
  quotes: StockQuote[]
  category: StockCategory
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  return `$${value.toLocaleString()}`
}

function formatVolume(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`
  return value.toLocaleString()
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

  // Performance bar data
  const maxAbsChange = Math.max(
    ...quotes.map(q => Math.abs(q.regularMarketChangePercent)),
    0.01
  )

  return (
    <div className="border-b border-gray-800 bg-[#060a12]">
      {/* Stats row */}
      <div className="px-3 py-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] border-b border-gray-800/50">
        <div className="flex items-center gap-1.5">
          <span className="font-bold" style={{ color: category.color }}>
            {category.icon} {category.name.toUpperCase()}
          </span>
        </div>
        <div>
          <span className="text-gray-600">AVG </span>
          <span className={`font-bold tabular-nums ${avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-green-500 font-bold">{gainers}</span>
          <span className="text-gray-600">↑ </span>
          <span className="text-red-500 font-bold">{losers}</span>
          <span className="text-gray-600">↓ </span>
          <span className="text-gray-500">{unchanged}</span>
          <span className="text-gray-600">—</span>
        </div>
        {totalMarketCap > 0 && (
          <div>
            <span className="text-gray-600">MCAP </span>
            <span className="text-blue-400 tabular-nums">{formatMarketCap(totalMarketCap)}</span>
          </div>
        )}
        {totalVolume > 0 && (
          <div>
            <span className="text-gray-600">VOL </span>
            <span className="text-purple-400 tabular-nums">{formatVolume(totalVolume)}</span>
          </div>
        )}
        <div>
          <span className="text-gray-600">BEST </span>
          <span className="text-green-400 font-bold">{bestPerformer.symbol}</span>
          <span className="text-green-400 tabular-nums"> +{bestPerformer.regularMarketChangePercent.toFixed(2)}%</span>
        </div>
        <div>
          <span className="text-gray-600">WORST </span>
          <span className="text-red-400 font-bold">{worstPerformer.symbol}</span>
          <span className="text-red-400 tabular-nums"> {worstPerformer.regularMarketChangePercent.toFixed(2)}%</span>
        </div>
      </div>

      {/* Performance bars */}
      <div className="px-3 py-2 overflow-x-auto">
        <div className="flex gap-0.5 min-w-max">
          {[...quotes]
            .sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent)
            .map(q => {
              const isPositive = q.regularMarketChangePercent >= 0
              const barWidth = Math.max(2, (Math.abs(q.regularMarketChangePercent) / maxAbsChange) * 100)
              return (
                <div key={q.symbol} className="flex flex-col items-center gap-0.5 min-w-[36px]">
                  <div className="h-[20px] w-full flex items-end justify-center relative">
                    {isPositive ? (
                      <div
                        className="w-full rounded-t-sm bg-green-500/60"
                        style={{ height: `${barWidth}%`, minHeight: '2px' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-start justify-center absolute top-0">
                        <div
                          className="w-full rounded-b-sm bg-red-500/60"
                          style={{ height: `${barWidth}%`, minHeight: '2px' }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-gray-500 font-bold">{q.symbol}</span>
                  <span className={`text-[8px] tabular-nums font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{q.regularMarketChangePercent.toFixed(1)}
                  </span>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
