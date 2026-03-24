import { useState, useEffect } from 'react'

interface IndexData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', name: 'DOW' },
  { symbol: '^IXIC', name: 'NASDAQ' },
  { symbol: '^VIX', name: 'VIX' },
  { symbol: '^RUT', name: 'R2000' },
  { symbol: 'GC=F', name: 'GOLD' },
  { symbol: 'CL=F', name: 'OIL' },
  { symbol: 'BTC-USD', name: 'BTC' },
]

const WORKER_URL = 'https://stonks.hanbonjovi.workers.dev'

const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

export function MarketIndices() {
  const [indices, setIndices] = useState<IndexData[]>([])

  useEffect(() => {
    async function fetchIndices() {
      const symbols = INDICES.map(i => i.symbol).join(',')
      const fields = 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,shortName'

      // Try worker first
      try {
        const res = await fetch(`${WORKER_URL}/quote?symbols=${encodeURIComponent(symbols)}&fields=${encodeURIComponent(fields)}`)
        if (res.ok) {
          const data = await res.json()
          const results = data?.quoteResponse?.result
          if (results) {
            const parsed: IndexData[] = INDICES.map(idx => {
              const r = results.find((r: { symbol: string }) => r.symbol === idx.symbol)
              return {
                symbol: idx.symbol,
                name: idx.name,
                price: r?.regularMarketPrice ?? 0,
                change: r?.regularMarketChange ?? 0,
                changePercent: r?.regularMarketChangePercent ?? 0,
              }
            }).filter(d => d.price > 0)
            setIndices(parsed)
            return
          }
        }
      } catch (err) {
        console.warn('Worker failed for indices, trying CORS proxies:', err)
      }

      // Fallback to CORS proxies
      const rawUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=${fields}`
      for (const makeProxy of CORS_PROXIES) {
        try {
          const res = await fetch(makeProxy(rawUrl))
          if (!res.ok) continue
          const data = await res.json()
          const results = data?.quoteResponse?.result
          if (!results) continue

          const parsed: IndexData[] = INDICES.map(idx => {
            const r = results.find((r: { symbol: string }) => r.symbol === idx.symbol)
            return {
              symbol: idx.symbol,
              name: idx.name,
              price: r?.regularMarketPrice ?? 0,
              change: r?.regularMarketChange ?? 0,
              changePercent: r?.regularMarketChangePercent ?? 0,
            }
          }).filter(d => d.price > 0)

          setIndices(parsed)
          return
        } catch {
          continue
        }
      }
    }

    fetchIndices()
    const interval = setInterval(fetchIndices, 120_000) // refresh every 2 min
    return () => clearInterval(interval)
  }, [])

  if (indices.length === 0) return null

  return (
    <div className="border-b border-gray-800 bg-[#060a12] px-2 py-1 overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {indices.map(idx => {
          const isPositive = idx.change >= 0
          const isVix = idx.name === 'VIX'
          return (
            <div
              key={idx.symbol}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded bg-gray-900/50"
            >
              <span className="font-bold text-amber-500/80">{idx.name}</span>
              <span className="text-white tabular-nums">
                {idx.price >= 10000
                  ? idx.price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  : idx.price >= 100
                    ? idx.price.toFixed(1)
                    : idx.price.toFixed(2)}
              </span>
              <span className={`tabular-nums font-medium ${
                isVix
                  ? (isPositive ? 'text-red-400' : 'text-green-400')
                  : (isPositive ? 'text-green-400' : 'text-red-400')
              }`}>
                {isPositive ? '+' : ''}{idx.changePercent.toFixed(2)}%
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
