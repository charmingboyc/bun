const ASHARE_CALENDAR_PATTERN =
  /(交易日|休市|开盘|收盘|周几|星期几|下一个交易日)/

const ASHARE_ANALYSIS_PATTERN =
  /(分析|看看|研究|评估|走势|技术面|基本面|风险|值不值得|能买吗|能不能买|怎么看)/

const SIX_DIGIT_TICKER_PATTERN = /\b\d{6}\b/
const CHINESE_NAME_LIKE_PATTERN = /[\u4e00-\u9fff]{2,8}/
const CODING_PATTERN = /(TypeScript|JavaScript|Python|编译|报错|代码|接口|前端|后端|bug|测试|仓库|文件|函数|脚本|依赖)/

function looksLikeAshareAnalysisPrompt(prompt: string): boolean {
  if (!ASHARE_ANALYSIS_PATTERN.test(prompt)) {
    return false
  }

  if (SIX_DIGIT_TICKER_PATTERN.test(prompt)) {
    return true
  }

  if (
    /(股票|个股|A股|股价|平潭发展|宁德时代|贵州茅台|比亚迪)/.test(prompt)
  ) {
    return true
  }

  if (!CODING_PATTERN.test(prompt) && CHINESE_NAME_LIKE_PATTERN.test(prompt)) {
    return true
  }

  return false
}

export function buildAsharePromptHints(prompt: string): string[] {
  const input = prompt.trim()
  if (!input) {
    return []
  }

  if (ASHARE_CALENDAR_PATTERN.test(input)) {
    return [
      '系统提醒：这是一个 A 股交易日历问题。你必须先调用 AshareData，使用 action="trading_calendar_summary" 查询真实交易日历，再回答。不得凭记忆推断星期或下一个交易日。',
    ]
  }

  if (looksLikeAshareAnalysisPrompt(input)) {
    return [
      '系统提醒：这是一个 A 股单票分析请求。你必须优先走 A 股工作流，并使用 Agent 调用 ashare-chief-analyst 或显式调度 A 股专家链路。技术面、基本面、风控分析在形成结论前必须先调用 AshareData。不得声称工具未激活、未集成、未编译或需要重新构建，除非真实工具调用返回了该类错误。',
    ]
  }

  return []
}
