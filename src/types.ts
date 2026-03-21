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

// Extended quote data for stock analysis panel
export interface ExtendedQuote extends StockQuote {
  fiftyDayAverage: number
  twoHundredDayAverage: number
  fiftyDayAverageChangePercent: number
  twoHundredDayAverageChangePercent: number
  averageDailyVolume3Month: number
  averageDailyVolume10Day: number
  trailingPE: number
  forwardPE: number
  epsTrailingTwelveMonths: number
  epsForward: number
  bookValue: number
  priceToBook: number
  trailingAnnualDividendYield: number
  beta: number
  sharesOutstanding: number
  shortPercentOfFloat: number
  heldPercentInstitutions: number
  exchange: string
  quoteType: string
  currency: string
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
