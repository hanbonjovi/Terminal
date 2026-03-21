import type { ExtendedQuote } from '../types'

interface AiAnalysisResult {
  summary: string
  signal: string
  reasoning: string
  risks: string
  outlook: string
}

function buildPrompt(symbol: string, q: ExtendedQuote): string {
  const price = q.regularMarketPrice
  const change = q.regularMarketChange
  const changePct = q.regularMarketChangePercent
  const ema50 = q.fiftyDayAverage
  const sma200 = q.twoHundredDayAverage
  const high52 = q.fiftyTwoWeekHigh
  const low52 = q.fiftyTwoWeekLow
  const vol = q.regularMarketVolume
  const avgVol = q.averageDailyVolume3Month
  const pe = q.trailingPE
  const fwdPe = q.forwardPE
  const eps = q.epsTrailingTwelveMonths
  const beta = q.beta
  const divYield = q.trailingAnnualDividendYield
  const mktCap = q.marketCap
  const shortPct = q.shortPercentOfFloat
  const instHeld = q.heldPercentInstitutions
  const pctFrom52H = high52 > 0 ? ((high52 - price) / high52 * 100).toFixed(1) : 'N/A'
  const pctFrom52L = low52 > 0 ? ((price - low52) / low52 * 100).toFixed(1) : 'N/A'
  const volRatio = avgVol > 0 ? (vol / avgVol).toFixed(2) : 'N/A'

  return `You are a professional stock analyst. Analyze ${symbol} based on this real-time data and provide a concise technical + fundamental assessment.

MARKET DATA FOR ${symbol}:
- Price: $${price.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}, ${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)
- EMA50: $${ema50.toFixed(2)} | SMA200: $${sma200.toFixed(2)}
- Price vs EMA50: ${price > ema50 ? 'ABOVE' : 'BELOW'} | Price vs SMA200: ${price > sma200 ? 'ABOVE' : 'BELOW'}
- 52-Week High: $${high52.toFixed(2)} (-${pctFrom52H}%) | 52-Week Low: $${low52.toFixed(2)} (+${pctFrom52L}%)
- Volume: ${(vol / 1e6).toFixed(1)}M | Avg Volume: ${(avgVol / 1e6).toFixed(1)}M | Vol Ratio: ${volRatio}x
- Market Cap: $${(mktCap / 1e9).toFixed(1)}B
- P/E (TTM): ${pe > 0 ? pe.toFixed(1) : 'N/A'} | P/E (FWD): ${fwdPe > 0 ? fwdPe.toFixed(1) : 'N/A'}
- EPS (TTM): ${eps ? '$' + eps.toFixed(2) : 'N/A'} | Beta: ${beta > 0 ? beta.toFixed(2) : 'N/A'}
- Dividend Yield: ${divYield > 0 ? (divYield * 100).toFixed(2) + '%' : 'None'}
- Short % of Float: ${shortPct > 0 ? (shortPct * 100).toFixed(1) + '%' : 'N/A'}
- Institutional Ownership: ${instHeld > 0 ? (instHeld * 100).toFixed(1) + '%' : 'N/A'}

Respond in EXACTLY this JSON format (no markdown, no code blocks, just raw JSON):
{
  "signal": "BUY or SELL or HOLD or WATCH",
  "summary": "2-3 sentence overall assessment",
  "reasoning": "3-4 bullet points explaining the signal (use • for bullets, one per line)",
  "risks": "2-3 key risks (use • for bullets, one per line)",
  "outlook": "1-2 sentence near-term outlook"
}`
}

export async function fetchAiAnalysis(
  symbol: string,
  quote: ExtendedQuote,
  apiKey: string
): Promise<AiAnalysisResult> {
  const prompt = buildPrompt(symbol, quote)

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen/qwen3-8b',
      messages: [
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    if (response.status === 401) {
      throw new Error('Invalid API key. Get a free key at openrouter.ai')
    }
    throw new Error(`AI API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // Strip any markdown code fences and thinking tags
  let cleaned = content
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim()

  // Try to extract JSON object if there's surrounding text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }

  try {
    const parsed = JSON.parse(cleaned)
    return {
      signal: parsed.signal || 'HOLD',
      summary: parsed.summary || 'Analysis unavailable',
      reasoning: parsed.reasoning || '',
      risks: parsed.risks || '',
      outlook: parsed.outlook || '',
    }
  } catch {
    // If JSON parsing fails, return the raw text as summary
    return {
      signal: 'HOLD',
      summary: cleaned.slice(0, 500),
      reasoning: '',
      risks: '',
      outlook: '',
    }
  }
}
