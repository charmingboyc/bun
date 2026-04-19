import { describe, expect, test } from 'bun:test'

import { buildAsharePromptHints } from './promptHints.js'

describe('A-share prompt hints', () => {
  test('injects a strong chief-analyst hint for stock analysis prompts', () => {
    const hints = buildAsharePromptHints('分析平潭发展')
    expect(hints).toHaveLength(1)
    expect(hints[0]).toContain('ashare-chief-analyst')
    expect(hints[0]).toContain('不得声称工具未激活')
  })

  test('injects a trading calendar hint for next-trading-day questions', () => {
    const hints = buildAsharePromptHints('下一个交易日是什么时候，我应该做些什么吗')
    expect(hints).toHaveLength(1)
    expect(hints[0]).toContain('trading_calendar_summary')
  })

  test('does not inject A-share hints for unrelated coding prompts', () => {
    expect(buildAsharePromptHints('帮我修一下 TypeScript 编译报错')).toEqual([])
  })
})
