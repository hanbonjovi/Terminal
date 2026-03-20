import type { StockQuote } from '../types'

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v7/finance/quote'
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

// Finnhub requires an API key — user can set it in localStorage
function getFinnhubKey(): string | null {
  return localStorage.getItem('finnhub_api_key')
}

interface YahooQuoteResult {
  symbol: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  marketCap?: number
  regularMarketVolume?: number
  regularMarketDayHigh?: number
  regularMarketDayLow?: number
  regularMarketOpen?: number
  regularMarketPreviousClose?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
}

function parseYahooQuote(q: YahooQuoteResult): StockQuote {
  return {
    symbol: q.symbol,
    shortName: q.shortName || q.longName || q.symbol,
    regularMarketPrice: q.regularMarketPrice ?? 0,
    regularMarketChange: q.regularMarketChange ?? 0,
    regularMarketChangePercent: q.regularMarketChangePercent ?? 0,
    marketCap: q.marketCap ?? 0,
    regularMarketVolume: q.regularMarketVolume ?? 0,
    regularMarketDayHigh: q.regularMarketDayHigh ?? 0,
    regularMarketDayLow: q.regularMarketDayLow ?? 0,
    regularMarketOpen: q.regularMarketOpen ?? 0,
    regularMarketPreviousClose: q.regularMarketPreviousClose ?? 0,
    fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? 0,
  }
}

async function fetchFromYahoo(symbols: string[]): Promise<StockQuote[]> {
  const symbolStr = symbols.join(',')
  const rawUrl = `${YAHOO_BASE}?symbols=${symbolStr}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,marketCap,regularMarketVolume,regularMarketDayHigh,regularMarketDayLow,regularMarketOpen,regularMarketPreviousClose,fiftyTwoWeekHigh,fiftyTwoWeekLow,shortName,longName`

  let lastError: Error | null = null
  for (const makeProxy of CORS_PROXIES) {
    try {
      const url = makeProxy(rawUrl)
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Yahoo Finance API error: ${res.status}`)

      const data = await res.json()
      const results = data?.quoteResponse?.result
      if (!results || !Array.isArray(results)) {
        throw new Error('Invalid Yahoo Finance response')
      }

      return results.map(parseYahooQuote)
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      console.warn('CORS proxy failed, trying next:', lastError.message)
    }
  }
  throw lastError ?? new Error('All Yahoo Finance proxies failed')
}

interface FinnhubQuote {
  c: number  // current price
  d: number  // change
  dp: number // percent change
  h: number  // high
  l: number  // low
  o: number  // open
  pc: number // previous close
}

async function fetchFromFinnhub(symbols: string[]): Promise<StockQuote[]> {
  const apiKey = getFinnhubKey()
  if (!apiKey) throw new Error('No Finnhub API key configured')

  const quotes = await Promise.all(
    symbols.map(async (symbol) => {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`
      )
      if (!res.ok) throw new Error(`Finnhub error for ${symbol}: ${res.status}`)
      const q: FinnhubQuote = await res.json()
      return {
        symbol,
        shortName: symbol,
        regularMarketPrice: q.c,
        regularMarketChange: q.d,
        regularMarketChangePercent: q.dp,
        marketCap: 0, // Finnhub quote endpoint doesn't include market cap
        regularMarketVolume: 0,
        regularMarketDayHigh: q.h,
        regularMarketDayLow: q.l,
        regularMarketOpen: q.o,
        regularMarketPreviousClose: q.pc,
        fiftyTwoWeekHigh: 0,
        fiftyTwoWeekLow: 0,
      } satisfies StockQuote
    })
  )
  return quotes
}

export async function fetchQuotes(symbols: string[]): Promise<StockQuote[]> {
  // Try Yahoo Finance first, fall back to Finnhub
  try {
    return await fetchFromYahoo(symbols)
  } catch (yahooError) {
    console.warn('Yahoo Finance failed, trying Finnhub fallback:', yahooError)
    try {
      return await fetchFromFinnhub(symbols)
    } catch (finnhubError) {
      console.error('Both data sources failed:', { yahooError, finnhubError })
      throw new Error(
        'Failed to fetch stock data. Check your connection or configure a Finnhub API key in settings.'
      )
    }
  }
}
