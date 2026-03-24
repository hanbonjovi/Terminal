import type { StockQuote, ExtendedQuote } from '../types'

const YAHOO_BASE = 'https://query1.finance.yahoo.com/v7/finance/quote'
const WORKER_URL = import.meta.env.VITE_AI_PROXY_URL || 'https://stonks.hanbonjovi.workers.dev'
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

const FINNHUB_DEFAULT_KEY = 'd6umno1r01qig5454jd0d6umno1r01qig5454jdg'

function getFinnhubKey(): string {
  return localStorage.getItem('finnhub_api_key') || FINNHUB_DEFAULT_KEY
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

async function fetchYahooViaWorker(symbols: string, fields?: string): Promise<Record<string, unknown>[]> {
  if (!WORKER_URL) throw new Error('No worker URL configured')
  const params = new URLSearchParams({ symbols })
  if (fields) params.set('fields', fields)
  const res = await fetch(`${WORKER_URL}/quote?${params}`)
  if (!res.ok) throw new Error(`Worker quote error: ${res.status}`)
  const data = await res.json()
  const results = data?.quoteResponse?.result
  if (!results || !Array.isArray(results)) throw new Error('Invalid worker response')
  return results
}

async function fetchYahooViaCorsProxy(symbols: string, fields?: string): Promise<Record<string, unknown>[]> {
  const rawUrl = `${YAHOO_BASE}?symbols=${symbols}${fields ? `&fields=${fields}` : ''}`
  for (const makeProxy of CORS_PROXIES) {
    try {
      const url = makeProxy(rawUrl)
      const res = await fetch(url)
      if (!res.ok) continue
      const data = await res.json()
      const results = data?.quoteResponse?.result
      if (!results || !Array.isArray(results)) continue
      return results
    } catch (err) {
      console.warn('CORS proxy failed, trying next:', err)
    }
  }
  throw new Error('All CORS proxies failed')
}

async function fetchYahooQuotes(symbols: string, fields?: string): Promise<Record<string, unknown>[]> {
  try {
    return await fetchYahooViaWorker(symbols, fields)
  } catch (err) {
    console.warn('Worker quote proxy failed, trying CORS proxies:', err)
    return await fetchYahooViaCorsProxy(symbols, fields)
  }
}

async function fetchFromYahoo(symbols: string[]): Promise<StockQuote[]> {
  const fields = 'regularMarketPrice,regularMarketChange,regularMarketChangePercent,marketCap,regularMarketVolume,regularMarketDayHigh,regularMarketDayLow,regularMarketOpen,regularMarketPreviousClose,fiftyTwoWeekHigh,fiftyTwoWeekLow,shortName,longName'
  const results = await fetchYahooQuotes(symbols.join(','), fields)
  return results.map((q) => parseYahooQuote(q as unknown as YahooQuoteResult))
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

// Fetch extended quote data for analysis panel
export async function fetchExtendedQuote(symbol: string): Promise<ExtendedQuote> {
  const fields = [
    'regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent',
    'marketCap', 'regularMarketVolume', 'regularMarketDayHigh', 'regularMarketDayLow',
    'regularMarketOpen', 'regularMarketPreviousClose', 'fiftyTwoWeekHigh', 'fiftyTwoWeekLow',
    'shortName', 'longName', 'fiftyDayAverage', 'twoHundredDayAverage',
    'fiftyDayAverageChangePercent', 'twoHundredDayAverageChangePercent',
    'averageDailyVolume3Month', 'averageDailyVolume10Day',
    'trailingPE', 'forwardPE', 'epsTrailingTwelveMonths', 'epsForward',
    'bookValue', 'priceToBook', 'trailingAnnualDividendYield', 'beta',
    'sharesOutstanding', 'shortPercentOfFloat', 'heldPercentInstitutions',
    'exchange', 'quoteType', 'currency',
  ].join(',')

  const results = await fetchYahooQuotes(symbol, fields)
  const q = results[0]
  if (!q) throw new Error(`Failed to fetch analysis data for ${symbol}`)

  return {
    symbol: (q.symbol as string) ?? symbol,
    shortName: (q.shortName as string) || (q.longName as string) || symbol,
    regularMarketPrice: (q.regularMarketPrice as number) ?? 0,
    regularMarketChange: (q.regularMarketChange as number) ?? 0,
    regularMarketChangePercent: (q.regularMarketChangePercent as number) ?? 0,
    marketCap: (q.marketCap as number) ?? 0,
    regularMarketVolume: (q.regularMarketVolume as number) ?? 0,
    regularMarketDayHigh: (q.regularMarketDayHigh as number) ?? 0,
    regularMarketDayLow: (q.regularMarketDayLow as number) ?? 0,
    regularMarketOpen: (q.regularMarketOpen as number) ?? 0,
    regularMarketPreviousClose: (q.regularMarketPreviousClose as number) ?? 0,
    fiftyTwoWeekHigh: (q.fiftyTwoWeekHigh as number) ?? 0,
    fiftyTwoWeekLow: (q.fiftyTwoWeekLow as number) ?? 0,
    fiftyDayAverage: (q.fiftyDayAverage as number) ?? 0,
    twoHundredDayAverage: (q.twoHundredDayAverage as number) ?? 0,
    fiftyDayAverageChangePercent: (q.fiftyDayAverageChangePercent as number) ?? 0,
    twoHundredDayAverageChangePercent: (q.twoHundredDayAverageChangePercent as number) ?? 0,
    averageDailyVolume3Month: (q.averageDailyVolume3Month as number) ?? 0,
    averageDailyVolume10Day: (q.averageDailyVolume10Day as number) ?? 0,
    trailingPE: (q.trailingPE as number) ?? 0,
    forwardPE: (q.forwardPE as number) ?? 0,
    epsTrailingTwelveMonths: (q.epsTrailingTwelveMonths as number) ?? 0,
    epsForward: (q.epsForward as number) ?? 0,
    bookValue: (q.bookValue as number) ?? 0,
    priceToBook: (q.priceToBook as number) ?? 0,
    trailingAnnualDividendYield: (q.trailingAnnualDividendYield as number) ?? 0,
    beta: (q.beta as number) ?? 0,
    sharesOutstanding: (q.sharesOutstanding as number) ?? 0,
    shortPercentOfFloat: (q.shortPercentOfFloat as number) ?? 0,
    heldPercentInstitutions: (q.heldPercentInstitutions as number) ?? 0,
    exchange: (q.exchange as string) ?? '',
    quoteType: (q.quoteType as string) ?? '',
    currency: (q.currency as string) ?? 'USD',
  }
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
