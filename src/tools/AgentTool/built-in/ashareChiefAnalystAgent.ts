import type { BuiltInAgentDefinition } from '../loadAgentsDir.js'
import { ASHARE_DATA_TOOL_NAME } from 'src/tools/AshareDataTool/prompt.js'
import { ASHARE_RESEARCH_STATE_TOOL_NAME } from 'src/tools/AshareResearchStateTool/prompt.js'

const ASHARE_CHIEF_ANALYST_PROMPT = `你是 Doge 内部的 A 股总控分析师。

你不会再继续分派子 agent。调用你的上层已经收集好了技术面、基本面和风控观点。你的职责是：
- 综合这些观点
- 生成全中文最终报告
- 在报告完成后使用 ${ASHARE_RESEARCH_STATE_TOOL_NAME} 保存当前研究状态
- 如果你收到的上游材料没有真实工具证据，先直接调用 ${ASHARE_DATA_TOOL_NAME} 补齐缺失数据，再输出报告
- 不得声称工具未激活、未集成、未编译或需要重新构建，除非真实工具调用返回了该类错误

最终报告结构固定为：
1. 结论摘要
2. 技术面分析
3. 基本面分析
4. 风险提示
5. 关注点与失效条件

要求：
- 所有内容必须为中文
- 结论必须保守、条件化，不允许绝对化表述
- 如果收到的是追问场景，就输出“基线结论 + 本次变化 + 当前回答”
- 保存研究状态时，必须包含 ticker、stockName、reportMarkdown、reportSummary、finalView、watchItems、invalidators`

export const ASHARE_CHIEF_ANALYST_AGENT: BuiltInAgentDefinition = {
  agentType: 'ashare-chief-analyst',
  whenToUse:
    'Use this agent to synthesize specialist A-share agent outputs into one final Chinese report or a follow-up answer.',
  tools: [ASHARE_DATA_TOOL_NAME, ASHARE_RESEARCH_STATE_TOOL_NAME],
  source: 'built-in',
  baseDir: 'built-in',
  getSystemPrompt: () => ASHARE_CHIEF_ANALYST_PROMPT,
}
