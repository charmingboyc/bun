import { randomUUID } from 'crypto'
import { dirname } from 'path'
import { z } from 'zod/v4'
import { getParentSessionId, getSessionId } from '../../bootstrap/state.js'
import { buildTool, type ToolDef } from '../../Tool.js'
import {
  buildAshareResearchStatePath,
  clearAshareResearchState,
  loadAshareResearchState,
  mergeActiveAnalysis,
  saveAshareResearchState,
  summarizeActiveAnalysis,
  type AshareAnalysisSnapshot,
} from '../../quant/researchState.js'
import { lazySchema } from '../../utils/lazySchema.js'
import { getTranscriptPathForSession } from '../../utils/sessionStorage.js'
import {
  ASHARE_RESEARCH_STATE_TOOL_NAME,
  DESCRIPTION,
  PROMPT,
} from './prompt.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    action: z.enum([
      'load_active_analysis',
      'save_analysis',
      'clear_active_analysis',
    ]),
    ticker: z.string().trim().optional(),
    stockName: z.string().trim().optional(),
    reportMarkdown: z.string().optional(),
    reportSummary: z.string().optional(),
    finalView: z.string().optional(),
    invalidators: z.array(z.string()).optional(),
    watchItems: z.array(z.string()).optional(),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const analysisSnapshotSchema = z.object({
  analysisId: z.string(),
  ticker: z.string(),
  stockName: z.string(),
  reportMarkdown: z.string(),
  reportSummary: z.string(),
  finalView: z.string(),
  generatedAt: z.string(),
  invalidators: z.array(z.string()),
  watchItems: z.array(z.string()),
})

const outputSchema = lazySchema(() =>
  z.object({
    ok: z.boolean(),
    action: z.enum([
      'load_active_analysis',
      'save_analysis',
      'clear_active_analysis',
    ]),
    message: z.string(),
    activeAnalysis: analysisSnapshotSchema.nullable().optional(),
    historyCount: z.number().int().nonnegative().optional(),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>

function getMainSessionStatePath(): string {
  const rootSessionId = getParentSessionId() ?? getSessionId()
  const transcriptPath = getTranscriptPathForSession(rootSessionId)
  return buildAshareResearchStatePath(dirname(transcriptPath), rootSessionId)
}

function buildSnapshot(
  input: z.infer<InputSchema>,
): AshareAnalysisSnapshot | null {
  if (
    !input.ticker ||
    !input.stockName ||
    !input.reportMarkdown ||
    !input.reportSummary ||
    !input.finalView
  ) {
    return null
  }

  return {
    analysisId: randomUUID(),
    ticker: input.ticker,
    stockName: input.stockName,
    reportMarkdown: input.reportMarkdown,
    reportSummary: input.reportSummary,
    finalView: input.finalView,
    generatedAt: new Date().toISOString(),
    invalidators: input.invalidators ?? [],
    watchItems: input.watchItems ?? [],
  }
}

export const AshareResearchStateTool = buildTool({
  name: ASHARE_RESEARCH_STATE_TOOL_NAME,
  searchHint: 'load or save active A-share analysis state',
  maxResultSizeChars: 100_000,
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  get inputSchema(): InputSchema {
    return inputSchema()
  },
  get outputSchema(): OutputSchema {
    return outputSchema()
  },
  userFacingName() {
    return 'AshareResearchState'
  },
  shouldDefer: true,
  isConcurrencySafe() {
    return false
  },
  isReadOnly() {
    return false
  },
  renderToolUseMessage() {
    return null
  },
  toAutoClassifierInput(input) {
    return input.action
  },
  async call(input) {
    const filePath = getMainSessionStatePath()

    if (input.action === 'clear_active_analysis') {
      await clearAshareResearchState(filePath)
      return {
        data: {
          ok: true,
          action: input.action,
          message: '已清空当前会话的 A 股研究状态。',
          activeAnalysis: null,
          historyCount: 0,
        },
      }
    }

    const state = await loadAshareResearchState(filePath)

    if (input.action === 'load_active_analysis') {
      return {
        data: {
          ok: state.activeAnalysis !== null,
          action: input.action,
          message: summarizeActiveAnalysis(state),
          activeAnalysis: state.activeAnalysis,
          historyCount: state.history.length,
        },
      }
    }

    const snapshot = buildSnapshot(input)
    if (!snapshot) {
      return {
        data: {
          ok: false,
          action: input.action,
          message:
            '保存 A 股研究状态失败：缺少 ticker、stockName、reportMarkdown、reportSummary 或 finalView。',
          activeAnalysis: state.activeAnalysis,
          historyCount: state.history.length,
        },
      }
    }

    const nextState = mergeActiveAnalysis(state, snapshot)
    await saveAshareResearchState(filePath, nextState)

    return {
      data: {
        ok: true,
        action: input.action,
        message: `已保存 ${snapshot.stockName}（${snapshot.ticker}）的 A 股研究状态。`,
        activeAnalysis: nextState.activeAnalysis,
        historyCount: nextState.history.length,
      },
    }
  },
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    const result = content as Output
    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: result.message,
    }
  },
} satisfies ToolDef<InputSchema, Output>)
