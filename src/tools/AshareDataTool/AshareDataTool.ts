import { z } from 'zod/v4'
import { buildTool, type ToolDef } from '../../Tool.js'
import {
  type AsharePythonResponse,
  runAsharePython,
} from '../../quant/pythonBridge.js'
import { lazySchema } from '../../utils/lazySchema.js'
import {
  ASHARE_DATA_TOOL_NAME,
  DESCRIPTION,
  PROMPT,
} from './prompt.js'

const inputSchema = lazySchema(() =>
  z.strictObject({
    action: z.enum([
      'stock_profile',
      'price_technical',
      'fundamental_summary',
      'trading_calendar_summary',
    ]),
    ticker: z
      .string()
      .trim()
      .min(1)
      .describe('A-share stock code or Chinese stock name, e.g. 300750, 600519, or 宁德时代'),
    lookbackDays: z
      .number()
      .int()
      .positive()
      .max(720)
      .optional()
      .describe('Optional lookback days for price_technical'),
    analysisDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .describe('Optional date for trading_calendar_summary, formatted as YYYY-MM-DD'),
  }),
)
type InputSchema = ReturnType<typeof inputSchema>

const outputSchema = lazySchema(() =>
  z.object({
    ok: z.boolean(),
    action: z.enum([
      'stock_profile',
      'price_technical',
      'fundamental_summary',
      'trading_calendar_summary',
    ]),
    ticker: z.string(),
    summary: z.string(),
    payload: z.record(z.string(), z.unknown()).optional(),
    warning: z.string().optional(),
    error: z.string().optional(),
  }),
)
type OutputSchema = ReturnType<typeof outputSchema>

export type Output = z.infer<OutputSchema>

export const AshareDataTool = buildTool({
  name: ASHARE_DATA_TOOL_NAME,
  searchHint: 'read A-share market data',
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
    return 'AshareData'
  },
  shouldDefer: true,
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  renderToolUseMessage() {
    return null
  },
  toAutoClassifierInput(input) {
    return `${input.action} ${input.ticker}`
  },
  async call(input) {
    const result = await runAsharePython(input)
    return {
      data: result,
    }
  },
  mapToolResultToToolResultBlockParam(content, toolUseID) {
    const result = content as AsharePythonResponse
    const lines = [result.summary]

    if (result.payload) {
      lines.push(JSON.stringify(result.payload, null, 2))
    }

    if (result.warning) {
      lines.push(`warning: ${result.warning}`)
    }

    if (result.error) {
      lines.push(`error: ${result.error}`)
    }

    return {
      tool_use_id: toolUseID,
      type: 'tool_result',
      content: lines.join('\n\n'),
    }
  },
} satisfies ToolDef<InputSchema, Output>)
