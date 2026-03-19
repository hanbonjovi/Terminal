import { useState, useEffect, useCallback, useRef } from 'react'
import type { StockQuote } from '../types'
import { fetchQuotes } from '../services/stockApi'

const REFRESH_INTERVAL = 60 // seconds
const cache = new Map<string, { quotes: StockQuote[]; timestamp: number }>()

export function useStockData(categoryId: string, tickers: string[]) {
  const [quotes, setQuotes] = useState<StockQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadData = useCallback(
    async (force = false) => {
      const cacheKey = categoryId
      const cached = cache.get(cacheKey)
      const now = Date.now()

      // Use cache if fresh (< 60s) and not forced
      if (!force && cached && now - cached.timestamp < REFRESH_INTERVAL * 1000) {
        setQuotes(cached.quotes)
        setLastUpdated(new Date(cached.timestamp))
        setLoading(false)
        setCountdown(
          Math.max(0, REFRESH_INTERVAL - Math.floor((now - cached.timestamp) / 1000))
        )
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await fetchQuotes(tickers)
        cache.set(cacheKey, { quotes: data, timestamp: now })
        setQuotes(data)
        setLastUpdated(new Date())
        setCountdown(REFRESH_INTERVAL)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [categoryId, tickers]
  )

  // Initial load when category changes
  useEffect(() => {
    loadData()
  }, [loadData])

  // Auto-refresh timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadData(true)
    }, REFRESH_INTERVAL * 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loadData])

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 0 ? REFRESH_INTERVAL : c - 1))
    }, 1000)

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [])

  return { quotes, loading, error, lastUpdated, countdown, refresh: () => loadData(true) }
}
