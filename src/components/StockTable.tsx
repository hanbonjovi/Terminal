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
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`
  if (value === 0) return '—'
  return value.toLocaleString()
}

// Generate a fake sparkline path from available data points
function Sparkline({ quote }: { quote: StockQuote }) {
  const points = [
    quote.regularMarketPreviousClose,
    quote.regularMarketOpen,
    quote.regularMarketDayLow,
    quote.regularMarketDayHigh,
    quote.regularMarketPrice,
  ].filter(p => p > 0)

  if (points.length < 2) return <span className="text-gray-700">—</span>

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 48
  const h = 16
  const step = w / (points.length - 1)

  const pathD = points
    .map((p, i) => {
      const x = i * step
      const y = h - ((p - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  const isUp = points[points.length - 1] >= points[0]

  return (
    <svg width={w} height={h} className="inline-block">
      <path
        d={pathD}
        fill="none"
        stroke={isUp ? '#22c55e' : '#ef4444'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const columns: { key: SortField; label: string; align: 'left' | 'right'; hideOnMobile?: boolean }[] = [
  { key: 'symbol', label: 'TICKER', align: 'left' },
  { key: 'regularMarketPrice', label: 'LAST', align: 'right' },
  { key: 'regularMarketChange', label: 'CHG', align: 'right' },
  { key: 'regularMarketChangePercent', label: 'CHG%', align: 'right' },
  { key: 'marketCap', label: 'MCAP', align: 'right', hideOnMobile: true },
  { key: 'regularMarketVolume', label: 'VOL', align: 'right', hideOnMobile: true },
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
          <div className="text-red-400 text-sm mb-3 font-mono">ERROR: {error}</div>
          <button
            onClick={onRetry}
            className="px-4 py-1.5 border border-amber-800/50 rounded text-xs text-amber-400 hover:bg-amber-900/20 transition-colors"
          >
            RETRY
          </button>
        </div>
      </div>
    )
  }

  if (loading && quotes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-amber-500 text-xs font-mono">
          <span className="cursor-blink">█</span> LOADING MARKET DATA...
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-[11px]">
        <thead className="sticky top-0 bg-[#0a0e17] z-10">
          <tr className="border-b-2 border-amber-500/20">
            <th className="px-2 py-1.5 text-left text-[10px] font-bold text-gray-600 w-4">#</th>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-2 py-1.5 font-bold text-[10px] text-gray-500 cursor-pointer hover:text-amber-400 transition-colors select-none ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                } ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                onClick={() => handleSort(col.key)}
              >
                {col.label}
                {sortField === col.key && (
                  <span className="ml-0.5 text-amber-500">
                    {sortDir === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
            ))}
            <th className="px-2 py-1.5 font-bold text-[10px] text-gray-500 text-center hidden sm:table-cell">
              OPEN
            </th>
            <th className="px-2 py-1.5 font-bold text-[10px] text-gray-500 text-center hidden lg:table-cell">
              HIGH
            </th>
            <th className="px-2 py-1.5 font-bold text-[10px] text-gray-500 text-center hidden lg:table-cell">
              LOW
            </th>
            <th className="px-2 py-1.5 font-bold text-[10px] text-gray-500 text-right hidden sm:table-cell">
              CHART
            </th>
            <th className="px-2 py-1.5 font-bold text-[10px] text-gray-500 text-right hidden xl:table-cell">
              DAY RANGE
            </th>
            <th className="px-2 py-1.5 font-bold text-[10px] text-gray-500 text-right hidden xl:table-cell">
              52W RANGE
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((quote, idx) => (
            <StockRow key={quote.symbol} quote={quote} rank={idx + 1} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StockRow({ quote, rank }: { quote: StockQuote; rank: number }) {
  const isPositive = quote.regularMarketChange >= 0
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400'
  const rowBg = rank % 2 === 0 ? 'bg-gray-900/20' : ''

  // Day range
  const dayRange = quote.regularMarketDayHigh - quote.regularMarketDayLow
  const dayPosition =
    dayRange > 0
      ? ((quote.regularMarketPrice - quote.regularMarketDayLow) / dayRange) * 100
      : 50

  // 52-week range
  const yearRange = quote.fiftyTwoWeekHigh - quote.fiftyTwoWeekLow
  const yearPosition =
    yearRange > 0
      ? ((quote.regularMarketPrice - quote.fiftyTwoWeekLow) / yearRange) * 100
      : 50

  return (
    <tr className={`border-b border-gray-800/30 ${rowBg} hover:bg-amber-500/5 transition-colors group`}>
      <td className="px-2 py-1.5 text-[10px] text-gray-700 tabular-nums">{rank}</td>
      <td className="px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`inline-block w-0.5 h-4 rounded-full ${isPositive ? 'bg-green-500' : 'bg-red-500'}`} />
          <div>
            <div className="font-bold text-white text-[11px] group-hover:text-amber-300 transition-colors">
              {quote.symbol}
            </div>
            <div className="text-[9px] text-gray-600 truncate max-w-[100px]">
              {quote.shortName}
            </div>
          </div>
        </div>
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-white font-bold">
        {formatPrice(quote.regularMarketPrice)}
      </td>
      <td className={`px-2 py-1.5 text-right tabular-nums ${changeColor}`}>
        {isPositive ? '+' : ''}{formatPrice(quote.regularMarketChange)}
      </td>
      <td className="px-2 py-1.5 text-right">
        <span
          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${
            isPositive
              ? 'bg-green-500/15 text-green-400 border border-green-500/20'
              : 'bg-red-500/15 text-red-400 border border-red-500/20'
          }`}
        >
          {isPositive ? '+' : ''}{quote.regularMarketChangePercent.toFixed(2)}%
        </span>
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-gray-400 hidden md:table-cell">
        {formatMarketCap(quote.marketCap)}
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-gray-400 hidden md:table-cell">
        {formatVolume(quote.regularMarketVolume)}
      </td>
      <td className="px-2 py-1.5 text-right tabular-nums text-gray-500 hidden sm:table-cell">
        {quote.regularMarketOpen > 0 ? formatPrice(quote.regularMarketOpen) : '—'}
      </td>
      <td className="px-2 py-1.5 text-center tabular-nums text-gray-500 hidden lg:table-cell">
        {quote.regularMarketDayHigh > 0 ? (
          <span className="text-green-500/70">{formatPrice(quote.regularMarketDayHigh)}</span>
        ) : '—'}
      </td>
      <td className="px-2 py-1.5 text-center tabular-nums text-gray-500 hidden lg:table-cell">
        {quote.regularMarketDayLow > 0 ? (
          <span className="text-red-500/70">{formatPrice(quote.regularMarketDayLow)}</span>
        ) : '—'}
      </td>
      <td className="px-2 py-1.5 text-right hidden sm:table-cell">
        <Sparkline quote={quote} />
      </td>
      <td className="px-2 py-1.5 text-right hidden xl:table-cell">
        <RangeBar
          low={quote.regularMarketDayLow}
          high={quote.regularMarketDayHigh}
          position={dayPosition}
        />
      </td>
      <td className="px-2 py-1.5 text-right hidden xl:table-cell">
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
    return <span className="text-gray-800">—</span>
  }

  const clampedPos = Math.min(100, Math.max(0, position))
  const isLow = clampedPos < 30
  const isHigh = clampedPos > 70

  return (
    <div className="inline-flex flex-col items-end gap-0.5 min-w-[70px]">
      <div className="w-full h-[3px] bg-gray-800 rounded-full relative">
        <div
          className="absolute top-0 left-0 h-full rounded-full"
          style={{
            width: `${clampedPos}%`,
            background: isLow
              ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
              : isHigh
                ? 'linear-gradient(90deg, #f59e0b, #22c55e)'
                : '#f59e0b',
          }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white border border-gray-600"
          style={{ left: `${clampedPos}%`, transform: 'translate(-50%, -50%)' }}
        />
      </div>
      <div className="flex justify-between w-full text-[8px] text-gray-700 tabular-nums">
        <span>{low.toFixed(0)}</span>
        <span>{high.toFixed(0)}</span>
      </div>
    </div>
  )
}
