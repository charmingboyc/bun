import { describe, expect, test } from 'bun:test'

import {
  applyAshareErrorGuidance,
  buildAsharePythonArgs,
  parseAsharePythonResult,
} from './pythonBridge.js'

describe('A-share python bridge', () => {
  test('builds deterministic CLI arguments for price_technical requests', () => {
    expect(
      buildAsharePythonArgs({
        action: 'price_technical',
        ticker: '300750',
        lookbackDays: 120,
      }),
    ).toEqual([
      'python/ashare_tools/cli.py',
      '--action',
      'price_technical',
      '--ticker',
      '300750',
      '--lookback-days',
      '120',
    ])
  })

  test('builds deterministic CLI arguments for trading calendar requests', () => {
    expect(
      buildAsharePythonArgs({
        action: 'trading_calendar_summary',
        ticker: '000001',
        analysisDate: '2026-04-19',
      }),
    ).toEqual([
      'python/ashare_tools/cli.py',
      '--action',
      'trading_calendar_summary',
      '--ticker',
      '000001',
      '--date',
      '2026-04-19',
    ])
  })

  test('adds proxy troubleshooting guidance for network-flavored failures', () => {
    expect(
      applyAshareErrorGuidance({
        ok: false,
        action: 'stock_profile',
        ticker: '300750',
        summary: '暂时无法读取该股票的基础信息。',
        error: "('Connection aborted.', RemoteDisconnected('Remote end closed connection without response'))",
      }).warning,
    ).toContain('CLAUDE_CODE_ASHARE_USE_ENV_PROXY=1')
  })

  test('prefers structured stdout over stderr when the python CLI exits non-zero', () => {
    const result = parseAsharePythonResult(
      {
        action: 'stock_profile',
        ticker: '300750',
      },
      1,
      '{"ok": false, "action": "stock_profile", "ticker": "300750", "summary": "暂时无法读取该股票的基础信息。", "error": "RemoteDisconnected"}',
      'urllib3 warning',
    )

    expect(result.summary).toBe('暂时无法读取该股票的基础信息。')
    expect(result.error).toContain('RemoteDisconnected')
    expect(result.warning).toContain('CLAUDE_CODE_ASHARE_USE_ENV_PROXY=1')
  })
})
