import { describe, expect, test } from 'bun:test'
import {
  createOpenAICompatStream,
  createOpenAIResponsesStream,
  createOpenAICodexStream,
  createCopilotChatStream
} from './openaiCompat.js'
import { APIError } from '@anthropic-ai/sdk'

describe('OpenAI compat APIError conversion', () => {
  test('createOpenAICompatStream converts failed response to APIError', async () => {
    try {
      await createOpenAICompatStream(
        { apiKey: 'test', baseURL: 'https://test.local', fetch: async () => new Response('Bad Gateway', { status: 502, statusText: 'Bad Gateway' }) },
        { model: 'gpt-4', messages: [] }
      )
      expect().fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(APIError)
      expect((e as APIError).status).toBe(502)
      expect((e as APIError).message).toContain('OpenAI compatible request failed')
      expect((e as APIError).message).toContain('Bad Gateway')
    }
  })

  test('createOpenAIResponsesStream converts failed response to APIError', async () => {
    try {
      await createOpenAIResponsesStream(
        { apiKey: 'test', baseURL: 'https://test.local', fetch: async () => new Response('Internal Server Error', { status: 500 }) },
        { model: 'gpt-4', input: [], store: false, stream: true } as any
      )
      expect().fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(APIError)
      expect((e as APIError).status).toBe(500)
    }
  })
  
  test('createOpenAICodexStream converts failed response to APIError', async () => {
    try {
      await createOpenAICodexStream(
        { apiKey: 'test', baseURL: 'https://test.local', fetch: async () => new Response('Timeout', { status: 408 }) },
        { model: 'gpt-4', input: [], store: false, stream: true } as any
      )
      expect().fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(APIError)
      expect((e as APIError).status).toBe(408)
    }
  })
  
  test('createCopilotChatStream converts failed response to APIError', async () => {
    try {
      await createCopilotChatStream(
        { apiKey: 'test', baseURL: 'https://test.local', fetch: async () => new Response('Rate limit', { status: 429 }) },
        { model: 'gpt-4', messages: [] } as any
      )
      expect().fail('Should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(APIError)
      expect((e as APIError).status).toBe(429)
    }
  })
})

describe('OpenAI compat stream parse errors', () => {
  test('createAnthropicStreamFromOpenAI throws specific error on malformed JSON', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {malformed json}\n\n'))
        controller.close()
      }
    })
    
    const generator = createAnthropicStreamFromOpenAI({
      reader: stream.getReader(),
      model: 'gpt-4'
    })
    
    try {
      await generator.next()
      expect().fail('Should have thrown')
    } catch (e) {
      expect((e as Error).message).toContain('[openaiCompat] failed to parse JSON')
    }
  })

  test('createAnthropicStreamFromOpenAIResponses throws specific error on malformed JSON', async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {malformed json}\n\n'))
        controller.close()
      }
    })
    
    const generator = createAnthropicStreamFromOpenAIResponses({
      reader: stream.getReader(),
      model: 'gpt-4'
    })
    
    try {
      await generator.next()
      expect().fail('Should have thrown')
    } catch (e) {
      expect((e as Error).message).toContain('[openaiCompat] failed to parse JSON')
    }
  })
})
