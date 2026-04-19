import { describe, expect, test } from 'bun:test'

import {
  buildAshareResearchStatePath,
  createEmptyAshareResearchState,
  mergeActiveAnalysis,
  summarizeActiveAnalysis,
} from './researchState.js'

describe('A-share research state', () => {
  test('stores active analysis metadata under the session project directory', () => {
    const path = buildAshareResearchStatePath('/tmp/projects/demo', 'session-1')
    expect(path).toBe('/tmp/projects/demo/session-1/ashare/research-state.json')
  })

  test('replaces the active analysis while preserving history entries', () => {
    const initial = createEmptyAshareResearchState()
    const updated = mergeActiveAnalysis(initial, {
      analysisId: 'a1',
      ticker: '300750',
      stockName: '宁德时代',
      reportMarkdown: '# 报告',
      reportSummary: '偏多，但需观察量能',
      finalView: '偏多',
      generatedAt: '2026-04-19T00:00:00.000Z',
      invalidators: ['跌破关键支撑位'],
      watchItems: ['量能是否继续放大'],
    })

    expect(updated.activeAnalysis?.ticker).toBe('300750')
    expect(updated.history).toHaveLength(1)
    expect(updated.history[0]?.reportSummary).toBe('偏多，但需观察量能')
  })

  test('summarizes the active analysis in Chinese for follow-up loading', () => {
    const state = mergeActiveAnalysis(createEmptyAshareResearchState(), {
      analysisId: 'a1',
      ticker: '300750',
      stockName: '宁德时代',
      reportMarkdown: '# 报告',
      reportSummary: '偏多，但需观察量能',
      finalView: '偏多',
      generatedAt: '2026-04-19T00:00:00.000Z',
      invalidators: ['跌破关键支撑位'],
      watchItems: ['量能是否继续放大'],
    })

    expect(summarizeActiveAnalysis(state)).toContain('当前激活分析：宁德时代（300750）')
    expect(summarizeActiveAnalysis(state)).toContain('核心判断：偏多')
  })
})
