export interface StockCategory {
  id: string
  name: string
  icon: string
  tickers: string[]
  color: string
}

export const categories: StockCategory[] = [
  {
    id: 'defense',
    name: 'Defense',
    icon: '🛡️',
    color: '#ef4444',
    tickers: ['LMT', 'RTX', 'NOC', 'GD', 'BA', 'LHX', 'HII', 'LDOS'],
  },
  {
    id: 'big-tech',
    name: 'Big Tech',
    icon: '💻',
    color: '#3b82f6',
    tickers: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'],
  },
  {
    id: 'semiconductors',
    name: 'Semis',
    icon: '🔲',
    color: '#8b5cf6',
    tickers: ['NVDA', 'AMD', 'INTC', 'TSM', 'AVGO', 'QCOM', 'MU', 'ASML'],
  },
  {
    id: 'energy',
    name: 'Energy',
    icon: '⚡',
    color: '#f59e0b',
    tickers: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'OXY', 'PSX', 'VLO'],
  },
  {
    id: 'healthcare',
    name: 'Health',
    icon: '🏥',
    color: '#10b981',
    tickers: ['JNJ', 'UNH', 'PFE', 'ABBV', 'MRK', 'LLY', 'TMO', 'ABT'],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '🏦',
    color: '#06b6d4',
    tickers: ['JPM', 'BAC', 'GS', 'MS', 'WFC', 'BRK-B', 'C', 'SCHW'],
  },
  {
    id: 'consumer',
    name: 'Consumer',
    icon: '🛒',
    color: '#ec4899',
    tickers: ['WMT', 'COST', 'PG', 'KO', 'PEP', 'MCD', 'NKE', 'SBUX'],
  },
  {
    id: 'ai-cloud',
    name: 'AI & Cloud',
    icon: '🤖',
    color: '#a855f7',
    tickers: ['MSFT', 'GOOGL', 'AMZN', 'CRM', 'SNOW', 'PLTR', 'NOW', 'DDOG'],
  },
  {
    id: 'crypto',
    name: 'Crypto',
    icon: '₿',
    color: '#f97316',
    tickers: ['COIN', 'MARA', 'RIOT', 'MSTR', 'HUT', 'BITF', 'CLSK', 'SQ'],
  },
]
