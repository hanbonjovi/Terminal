export interface StockQuote {
  symbol: string
  shortName: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  marketCap: number
  regularMarketVolume: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  regularMarketOpen: number
  regularMarketPreviousClose: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
}

export type SortField = keyof Pick<
  StockQuote,
  | 'symbol'
  | 'regularMarketPrice'
  | 'regularMarketChange'
  | 'regularMarketChangePercent'
  | 'marketCap'
  | 'regularMarketVolume'
>

export type SortDirection = 'asc' | 'desc'
