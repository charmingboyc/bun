import { describe, expect, test } from 'bun:test'

import {
  convertAnthropicRequestToGemini,
  createGeminiVertexStream,
  fetchGeminiVertexResponse,
} from './geminiLike.js'

describe('Gemini AI Studio URL joining', () => {
  test('preserves /v1beta for streamGenerateContent requests', async () => {
    let requestedUrl = ''

    const reader = await createGeminiVertexStream({
      apiKey: 'test-key',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-flash-latest',
      request: { contents: [] },
      fetch: async input => {
        requestedUrl = String(input)
        return new Response('data: {}\n\n', {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
          },
        })
      },
    })

    expect(requestedUrl).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:streamGenerateContent?alt=sse',
    )
    expect(await reader.read()).toEqual({
      done: false,
      value: new TextEncoder().encode('data: {}\n\n'),
    })
  })

  test('preserves /v1beta for generateContent requests', async () => {
    let requestedUrl = ''

    const response = await fetchGeminiVertexResponse({
      apiKey: 'test-key',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-flash-latest',
      request: { contents: [] },
      fetch: async input => {
        requestedUrl = String(input)
        return new Response(JSON.stringify({ candidates: [] }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      },
    })

    expect(requestedUrl).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    )
    expect(response).toEqual({ candidates: [] })
  })
})

describe('Gemini tool call thought signature forwarding', () => {
  test('forwards tool_use signature into functionCall thoughtSignature', () => {
    const request = convertAnthropicRequestToGemini({
      model: 'gemini-2.5-pro',
      messages: [
        {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_1',
              name: 'default_api:EnterPlanMode',
              input: {},
              signature: 'sig_abc123',
            } as any,
          ],
        } as any,
      ],
    })

    const part = request.contents?.[0]?.parts?.[0]
    expect(part?.functionCall?.name).toBe('default_api:EnterPlanMode')
    expect(part?.thoughtSignature).toBe('sig_abc123')
  })
})
