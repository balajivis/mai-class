import Anthropic from '@anthropic-ai/sdk'

const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic }

export const anthropic = globalForAnthropic.anthropic ?? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

if (process.env.NODE_ENV !== 'production') {
  globalForAnthropic.anthropic = anthropic
}

export async function llmGenerate(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const block = response.content[0]
  if (block.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic API')
  }
  return block.text
}

export async function llmGenerateJSON<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const text = await llmGenerate(
    systemPrompt + '\n\nReturn valid JSON only. No markdown, no code fences.',
    userPrompt
  )

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned) as T
}
