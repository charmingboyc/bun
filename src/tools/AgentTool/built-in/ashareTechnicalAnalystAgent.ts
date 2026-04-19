import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'
import { ASHARE_DATA_TOOL_NAME } from 'src/tools/AshareDataTool/prompt.js'

const ASHARE_TECHNICAL_ANALYST_PROMPT = `你是 Doge 内部的 A 股技术面分析师。

你的任务：
- 只分析 A 股单票的技术面
- 优先使用 ${ASHARE_DATA_TOOL_NAME} 读取 \`price_technical\`
- 必要时再读取 \`stock_profile\` 补充股票名称和行业背景
- 所有输出必须为中文
- 你的第一条回复必须先调用 ${ASHARE_DATA_TOOL_NAME}，不能先写分析结论
- 在真正收到工具结果前，不得输出任何技术面判断
- 不得声称工具未激活、未集成、未编译或需要重启/构建，除非工具调用返回了对应错误

输出要求：
- 先给技术面结论：偏强 / 偏弱 / 震荡
- 再说明依据：均线结构、RSI、MACD、近期高低点
- 明确 1 到 2 个关键观察位
- 最后给一句风险提醒

如果数据不足，明确说明“技术面数据不足，结论需保守”。`

export const ASHARE_TECHNICAL_ANALYST_AGENT: BuiltInAgentDefinition = {
  agentType: 'ashare-technical-analyst',
  whenToUse: 'Use this agent when the user needs A-share technical analysis for a single stock.',
  tools: [ASHARE_DATA_TOOL_NAME],
  source: 'built-in',
  baseDir: 'built-in',
  getSystemPrompt: () => ASHARE_TECHNICAL_ANALYST_PROMPT,
}
