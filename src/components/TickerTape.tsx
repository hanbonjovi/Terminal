import type { StockQuote } from '../types'

interface TickerTapeProps {
  quotes: StockQuote[]
}

export function TickerTape({ quotes }: TickerTapeProps) {
  if (quotes.length === 0) return null

  // Double the items for seamless loop
  const items = [...quotes, ...quotes]

  return (
    <div className="ticker-tape-container border-b border-gray-800 bg-[#0a0e17] overflow-hidden">
      <div className="ticker-tape-track flex">
        {items.map((q, i) => {
          const isPositive = q.regularMarketChange >= 0
          return (
            <div
              key={`${q.symbol}-${i}`}
              className="flex items-center gap-2 px-4 py-1 whitespace-nowrap text-[11px]"
            >
              <span className="font-bold text-amber-400">{q.symbol}</span>
              <span className="text-white tabular-nums">${q.regularMarketPrice.toFixed(2)}</span>
              <span className={`tabular-nums ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '+' : ''}{q.regularMarketChange.toFixed(2)}
              </span>
              <span className={`tabular-nums ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                ({isPositive ? '+' : ''}{q.regularMarketChangePercent.toFixed(2)}%)
              </span>
              <span className="text-gray-700">|</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
