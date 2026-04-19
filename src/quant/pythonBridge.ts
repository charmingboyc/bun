import { fileURLToPath } from 'url'

export type AshareDataAction =
  | 'stock_profile'
  | 'price_technical'
  | 'fundamental_summary'
  | 'trading_calendar_summary'

export type AsharePythonRequest = {
  action: AshareDataAction
  ticker: string
  lookbackDays?: number
  analysisDate?: string
}

export type AsharePythonResponse = {
  ok: boolean
  action: AshareDataAction
  ticker: string
  summary: string
  payload?: Record<string, unknown>
  warning?: string
  error?: string
}

const NETWORK_ERROR_PATTERNS = [
  'Connection aborted',
  'ProxyError',
  'NameResolutionError',
  'Failed to resolve',
  'RemoteDisconnected',
  'Remote end closed connection',
  'Max retries exceeded',
]

const repoRoot = fileURLToPath(new URL('../../', import.meta.url))
const pythonCliRelativePath = 'python/ashare_tools/cli.py'
const pythonCliAbsolutePath = fileURLToPath(
  new URL('../../python/ashare_tools/cli.py', import.meta.url),
)

export function buildAsharePythonArgs(
  request: AsharePythonRequest,
): string[] {
  const args = [
    pythonCliRelativePath,
    '--action',
    request.action,
    '--ticker',
    request.ticker,
  ]

  if (request.lookbackDays !== undefined) {
    args.push('--lookback-days', String(request.lookbackDays))
  }

  if (request.analysisDate) {
    args.push('--date', request.analysisDate)
  }

  return args
}

function getPythonExecutable(): string {
  return process.env.CLAUDE_CODE_ASHARE_PYTHON?.trim() || 'python3'
}

export function applyAshareErrorGuidance(
  response: AsharePythonResponse,
): AsharePythonResponse {
  if (response.ok || !response.error) {
    return response
  }

  const isLikelyNetworkError = NETWORK_ERROR_PATTERNS.some(pattern =>
    response.error?.includes(pattern),
  )

  if (!isLikelyNetworkError) {
    return response
  }

  return {
    ...response,
    warning:
      '当前环境到 A 股数据源的网络链路异常。若你依赖代理，请设置 CLAUDE_CODE_ASHARE_USE_ENV_PROXY=1 后重试；若不走代理，请检查当前网络是否可直连数据源。',
  }
}

export function parseAsharePythonResult(
  request: AsharePythonRequest,
  exitCode: number,
  stdout: string,
  stderr: string,
): AsharePythonResponse {
  const trimmedStdout = stdout.trim()
  const trimmedStderr = stderr.trim()

  if (trimmedStdout) {
    try {
      return applyAshareErrorGuidance(
        JSON.parse(trimmedStdout) as AsharePythonResponse,
      )
    } catch {
      // Fall through and shape a generic error below.
    }
  }

  if (exitCode !== 0) {
    return applyAshareErrorGuidance({
      ok: false,
      action: request.action,
      ticker: request.ticker,
      summary: 'A 股数据工具执行失败，未能返回有效结果。',
      error:
        trimmedStderr ||
        trimmedStdout ||
        `Python exited with code ${exitCode}`,
    })
  }

  if (!trimmedStdout) {
    return applyAshareErrorGuidance({
      ok: false,
      action: request.action,
      ticker: request.ticker,
      summary: 'A 股数据工具未返回任何内容。',
      error: trimmedStderr || 'Python process produced no stdout.',
    })
  }

  return applyAshareErrorGuidance({
    ok: false,
    action: request.action,
    ticker: request.ticker,
    summary: 'A 股数据工具返回了无法解析的结果。',
    error: trimmedStdout,
  })
}

export async function runAsharePython(
  request: AsharePythonRequest,
): Promise<AsharePythonResponse> {
  const args = buildAsharePythonArgs(request)
  const proc = Bun.spawn({
    cmd: [getPythonExecutable(), pythonCliAbsolutePath, ...args.slice(1)],
    cwd: repoRoot,
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  const exitCode = await proc.exited
  return parseAsharePythonResult(request, exitCode, stdout, stderr)
}
