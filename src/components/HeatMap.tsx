import type { StockQuote } from '../types'

interface HeatMapProps {
  quotes: StockQuote[]
}

function getHeatColor(changePercent: number): string {
  if (changePercent >= 3) return 'bg-green-500'
  if (changePercent >= 2) return 'bg-green-500/80'
  if (changePercent >= 1) return 'bg-green-600/70'
  if (changePercent >= 0.5) return 'bg-green-700/60'
  if (changePercent > 0) return 'bg-green-800/50'
  if (changePercent === 0) return 'bg-gray-700/50'
  if (changePercent > -0.5) return 'bg-red-800/50'
  if (changePercent > -1) return 'bg-red-700/60'
  if (changePercent > -2) return 'bg-red-600/70'
  if (changePercent > -3) return 'bg-red-500/80'
  return 'bg-red-500'
}

function getTextColor(changePercent: number): string {
  const abs = Math.abs(changePercent)
  if (abs >= 2) return 'text-white'
  if (abs >= 1) return 'text-gray-100'
  return 'text-gray-200'
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(0)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`
  if (value === 0) return ''
  return value.toLocaleString()
}

export function HeatMap({ quotes }: HeatMapProps) {
  if (quotes.length === 0) return null

  // Sort by market cap for sizing (larger = bigger tile)
  const sorted = [...quotes].sort((a, b) => b.marketCap - a.marketCap)
  const maxCap = Math.max(...sorted.map(q => q.marketCap), 1)

  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 auto-rows-fr" style={{ minHeight: '100%' }}>
        {sorted.map(q => {
          const isPositive = q.regularMarketChangePercent >= 0
          const capRatio = q.marketCap > 0 ? q.marketCap / maxCap : 0.3
          const span = capRatio > 0.5 ? 2 : 1

          return (
            <div
              key={q.symbol}
              className={`${getHeatColor(q.regularMarketChangePercent)} rounded-sm p-2 flex flex-col justify-between border border-white/5 transition-all hover:border-white/20 hover:brightness-110 cursor-default`}
              style={{
                gridColumn: span > 1 ? 'span 2' : 'span 1',
                minHeight: span > 1 ? '90px' : '70px',
              }}
            >
              <div>
                <div className={`font-bold text-sm ${getTextColor(q.regularMarketChangePercent)}`}>
                  {q.symbol}
                </div>
                <div className="text-[9px] text-white/50 truncate">{q.shortName}</div>
              </div>
              <div>
                <div className={`text-lg font-bold tabular-nums ${getTextColor(q.regularMarketChangePercent)}`}>
                  {isPositive ? '+' : ''}{q.regularMarketChangePercent.toFixed(2)}%
                </div>
                <div className="flex items-center justify-between text-[9px] text-white/60 tabular-nums">
                  <span>${q.regularMarketPrice.toFixed(2)}</span>
                  {q.marketCap > 0 && <span>{formatMarketCap(q.marketCap)}</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
