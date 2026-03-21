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

async function handleQuote(request: Request, headers: Record<string, string>): Promise<Response> {
  const url = new URL(request.url)
  const symbols = url.searchParams.get('symbols')
  const fields = url.searchParams.get('fields') || ''

  if (!symbols) {
    return Response.json({ error: 'Missing symbols parameter' }, { status: 400, headers })
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}${fields ? `&fields=${encodeURIComponent(fields)}` : ''}`

  const response = await fetch(yahooUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  })

  const data = await response.text()
  return new Response(data, {
    status: response.status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
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
