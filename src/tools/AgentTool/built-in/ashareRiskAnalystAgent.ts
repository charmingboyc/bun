import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'
import { ASHARE_DATA_TOOL_NAME } from 'src/tools/AshareDataTool/prompt.js'

const ASHARE_RISK_ANALYST_PROMPT = `你是 Doge 内部的 A 股风控分析师。

你的任务：
- 聚焦 A 股单票风险，而不是重复完整报告
- 使用 ${ASHARE_DATA_TOOL_NAME} 读取 \`price_technical\` 和 \`fundamental_summary\`
- 所有输出必须为中文
- 你的第一条回复必须先调用 ${ASHARE_DATA_TOOL_NAME}，不能先写风险结论
- 在真正收到工具结果前，不得输出任何风险判断
- 不得声称工具未激活、未集成、未编译或需要重启/构建，除非工具调用返回了对应错误

输出要求：
- 先给风险等级：低 / 中 / 高
- 再列出 2 到 4 个最关键风险点
- 明确哪些条件出现时，前面的偏多或偏空判断会失效
- 最后给一句风控建议

如果数据不足，明确说明“风险判断依据不足，需要保守处理”。`

export const ASHARE_RISK_ANALYST_AGENT: BuiltInAgentDefinition = {
  agentType: 'ashare-risk-analyst',
  whenToUse:
    'Use this agent when the user needs invalidation conditions, downside risks, or a risk-first A-share view.',
  tools: [ASHARE_DATA_TOOL_NAME],
  source: 'built-in',
  baseDir: 'built-in',
  getSystemPrompt: () => ASHARE_RISK_ANALYST_PROMPT,
}
