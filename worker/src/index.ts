interface Env {
  OPENROUTER_API_KEY: string
  ALLOWED_ORIGIN: string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function getCorsHeaders(request: Request, env: Env) {
  const origin = request.headers.get('Origin') || ''
  const allowedOrigins = [env.ALLOWED_ORIGIN, 'http://localhost:5173', 'http://localhost:4173']
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return { ...CORS_HEADERS, 'Access-Control-Allow-Origin': corsOrigin }
}

async function handleAi(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = await request.json() as { model?: string; messages?: unknown[] }

  if (!body.model || !body.messages) {
    return Response.json({ error: 'Missing model or messages' }, { status: 400, headers })
  }

  const allowedModels = ['qwen/qwen3-8b', 'deepseek/deepseek-chat-v3-0324']
  if (!allowedModels.includes(body.model)) {
    return Response.json({ error: 'Model not allowed' }, { status: 403, headers })
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: body.model,
      messages: body.messages,
      temperature: 0.3,
      max_tokens: 800,
    }),
  })

  const data = await response.text()
  return new Response(data, {
    status: response.status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

async function fetchChartQuote(symbol: string): Promise<Record<string, unknown> | null> {
  const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d&includePrePost=false`
  const response = await fetch(yahooUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })
  if (!response.ok) return null
  const data = await response.json() as { chart?: { result?: Array<{ meta?: Record<string, unknown>, indicators?: { quote?: Array<{ volume?: number[] }> } }> } }
  const result = data?.chart?.result?.[0]
  if (!result?.meta) return null
  const meta = result.meta as Record<string, unknown>
  const previousClose = (meta.chartPreviousClose ?? meta.previousClose ?? 0) as number
  const price = (meta.regularMarketPrice ?? 0) as number
  const change = price - previousClose
  const changePercent = previousClose ? (change / previousClose) * 100 : 0
  const volumes = result.indicators?.quote?.[0]?.volume
  const lastVolume = volumes?.length ? volumes[volumes.length - 1] ?? 0 : 0

  return {
    symbol: (meta.symbol as string) || symbol,
    shortName: (meta.shortName as string) || (meta.longName as string) || symbol,
    longName: (meta.longName as string) || '',
    regularMarketPrice: price,
    regularMarketChange: change,
    regularMarketChangePercent: changePercent,
    regularMarketVolume: lastVolume,
    regularMarketDayHigh: (meta.regularMarketDayHigh ?? 0) as number,
    regularMarketDayLow: (meta.regularMarketDayLow ?? 0) as number,
    regularMarketOpen: (meta.regularMarketOpen ?? 0) as number,
    regularMarketPreviousClose: previousClose,
    fiftyTwoWeekHigh: (meta.fiftyTwoWeekHigh ?? 0) as number,
    fiftyTwoWeekLow: (meta.fiftyTwoWeekLow ?? 0) as number,
    fiftyDayAverage: (meta.fiftyDayAverage ?? 0) as number,
    twoHundredDayAverage: (meta.twoHundredDayAverage ?? 0) as number,
    fiftyDayAverageChangePercent: (meta.fiftyDayAverageChangePercent ?? 0) as number,
    twoHundredDayAverageChangePercent: (meta.twoHundredDayAverageChangePercent ?? 0) as number,
    marketCap: (meta.marketCap ?? 0) as number,
    exchange: (meta.exchangeName ?? meta.exchange ?? '') as string,
    quoteType: (meta.instrumentType ?? meta.quoteType ?? '') as string,
    currency: (meta.currency ?? 'USD') as string,
  }
}

async function handleQuote(request: Request, headers: Record<string, string>): Promise<Response> {
  const url = new URL(request.url)
  const symbols = url.searchParams.get('symbols')

  if (!symbols) {
    return Response.json({ error: 'Missing symbols parameter' }, { status: 400, headers })
  }

  const symbolList = symbols.split(',').map(s => s.trim()).filter(Boolean)
  const results = await Promise.all(symbolList.map(s => fetchChartQuote(s)))
  const validResults = results.filter(r => r !== null)

  // Return in the same format as the old v7 API so the frontend doesn't need changes
  return Response.json(
    { quoteResponse: { result: validResults, error: null } },
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  )
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = getCorsHeaders(request, env)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    const url = new URL(request.url)

    // GET /quote?symbols=META&fields=... → Yahoo Finance proxy
    if (url.pathname === '/quote' && request.method === 'GET') {
      try {
        return await handleQuote(request, headers)
      } catch {
        return Response.json({ error: 'Failed to fetch quote' }, { status: 502, headers })
      }
    }

    // POST / → AI proxy
    if (request.method === 'POST') {
      try {
        return await handleAi(request, env, headers)
      } catch {
        return Response.json({ error: 'Internal server error' }, { status: 500, headers })
      }
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers })
  },
}
