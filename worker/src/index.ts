interface Env {
  OPENROUTER_API_KEY: string
  ALLOWED_ORIGIN: string
  ASSETS: Fetcher
}

const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const origin = request.headers.get('Origin') || ''
    const allowedOrigins = [env.ALLOWED_ORIGIN, 'http://localhost:5173', 'http://localhost:4173']
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
    const headers = { ...CORS_HEADERS, 'Access-Control-Allow-Origin': corsOrigin }

    // Serve static assets for non-API requests
    if (url.pathname !== '/api') {
      return env.ASSETS.fetch(request)
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers })
    }

    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers })
    }

    try {
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
    } catch {
      return Response.json({ error: 'Internal server error' }, { status: 500, headers })
    }
  },
}
