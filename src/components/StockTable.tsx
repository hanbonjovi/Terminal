import { useState } from 'react'
import type { StockQuote, SortField, SortDirection } from '../types'

interface StockTableProps {
  quotes: StockQuote[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

function formatPrice(value: number): string {
  return value.toFixed(2)
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value === 0) return '—'
  return value.toLocaleString()
}

function formatVolume(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  if (value === 0) return '—'
  return value.toLocaleString()
}

const columns: { key: SortField; label: string; align: 'left' | 'right' }[] = [
  { key: 'symbol', label: 'TICKER', align: 'left' },
  { key: 'regularMarketPrice', label: 'PRICE', align: 'right' },
  { key: 'regularMarketChange', label: 'CHG', align: 'right' },
  { key: 'regularMarketChangePercent', label: 'CHG %', align: 'right' },
  { key: 'marketCap', label: 'MKT CAP', align: 'right' },
  { key: 'regularMarketVolume', label: 'VOLUME', align: 'right' },
]

export function StockTable({ quotes, loading, error, onRetry }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>('regularMarketChangePercent')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir(field === 'symbol' ? 'asc' : 'desc')
    }
  }

  const sorted = [...quotes].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
    }
    return sortDir === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number)
  })

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-red-400 text-sm mb-2">⚠ {error}</div>
          <button
            onClick={onRetry}
            className="px-4 py-2 border border-gray-700 rounded text-sm text-gray-300 hover:text-green-400 hover:border-green-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (loading && quotes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-green-500 text-sm">
          <span className="cursor-blink">█</span> Fetching market data...
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-gray-950 z-10">
          <tr className="border-b border-gray-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-2 font-medium text-gray-500 cursor-pointer hover:text-gray-300 transition-colors select-none ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                {sortField === col.key && (
                  <span className="ml-1 text-green-500">
                    {sortDir === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
            ))}
            <th className="px-4 py-2 font-medium text-gray-500 text-right">
              DAY RANGE
            </th>
            <th className="px-4 py-2 font-medium text-gray-500 text-right hidden lg:table-cell">
              52W RANGE
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((quote) => (
            <StockRow key={quote.symbol} quote={quote} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StockRow({ quote }: { quote: StockQuote }) {
  const isPositive = quote.regularMarketChange >= 0
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400'
  const bgHover = isPositive ? 'hover:bg-green-950/20' : 'hover:bg-red-950/20'

  // Day range bar
  const dayRange = quote.regularMarketDayHigh - quote.regularMarketDayLow
  const dayPosition =
    dayRange > 0
      ? ((quote.regularMarketPrice - quote.regularMarketDayLow) / dayRange) * 100
      : 50

  // 52-week range bar
  const yearRange = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow
  const yearPosition =
    yearRange > 0
      ? ((quote.regularMarketPrice - quote.fiftyTwoWeekLow) / yearRange) * 100
      : 50

  return (
    <tr
      className={`border-b border-gray-900/50 ${bgHover} transition-colors`}
    >
      <td className="px-4 py-2.5">
        <div className="font-bold text-white">{quote.symbol}</div>
        <div className="text-[10px] text-gray-600 truncate max-w-[120px]">
          {quote.shortName}
        </div>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-white font-medium">
        ${formatPrice(quote.regularMarketPrice)}
      </td>
      <td className={`px-4 py-2.5 text-right tabular-nums ${changeColor}`}>
        {isPositive ? '+' : ''}
        {formatPrice(quote.regularMarketChange)}
      </td>
      <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${changeColor}`}>
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
            isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
          }`}
        >
          {isPositive ? '+' : ''}
          {quote.regularMarketChangePercent.toFixed(2)}%
        </span>
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">
        {formatMarketCap(quote.marketCap)}
      </td>
      <td className="px-4 py-2.5 text-right tabular-nums text-gray-400">
        {formatVolume(quote.regularMarketVolume)}
      </td>
      <td className="px-4 py-2.5 text-right">
        <RangeBar
          low={quote.regularMarketDayLow}
          high={quote.regularMarketDayHigh}
          position={dayPosition}
        />
      </td>
      <td className="px-4 py-2.5 text-right hidden lg:table-cell">
        <RangeBar
          low={quote.fiftyTwoWeekLow}
          high={quote.fiftyTwoWeekHigh}
          position={yearPosition}
        />
      </td>
    </tr>
  )
}

function RangeBar({
  low,
  high,
  position,
}: {
  low: number
  high: number
  position: number
}) {
  if (low === 0 && high === 0) {
    return <span className="text-gray-700">—</span>
  }
  return (
    <div className="inline-flex flex-col items-end gap-0.5 min-w-[80px]">
      <div className="w-full h-1 bg-gray-800 rounded-full relative">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-400"
          style={{ left: `${Math.min(100, Math.max(0, position))}%` }}
        />
      </div>
      <div className="flex justify-between w-full text-[9px] text-gray-600 tabular-nums">
        <span>{low.toFixed(0)}</span>
        <span>{high.toFixed(0)}</span>
      </div>
    </div>
  )
}
