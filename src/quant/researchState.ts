import { mkdir, readFile, writeFile } from 'fs/promises'
import { dirname, join } from 'path'

export type AshareAnalysisSnapshot = {
  analysisId: string
  ticker: string
  stockName: string
  reportMarkdown: string
  reportSummary: string
  finalView: string
  generatedAt: string
  invalidators: string[]
  watchItems: string[]
}

export type AshareResearchState = {
  activeAnalysis: AshareAnalysisSnapshot | null
  history: AshareAnalysisSnapshot[]
  updatedAt: string | null
}

export function buildAshareResearchStatePath(
  projectDir: string,
  sessionId: string,
): string {
  return join(projectDir, sessionId, 'ashare', 'research-state.json')
}

export function createEmptyAshareResearchState(): AshareResearchState {
  return {
    activeAnalysis: null,
    history: [],
    updatedAt: null,
  }
}

export function mergeActiveAnalysis(
  state: AshareResearchState,
  snapshot: AshareAnalysisSnapshot,
): AshareResearchState {
  return {
    activeAnalysis: snapshot,
    history: [...state.history, snapshot],
    updatedAt: snapshot.generatedAt,
  }
}

export function summarizeActiveAnalysis(state: AshareResearchState): string {
  const active = state.activeAnalysis
  if (!active) {
    return '当前没有激活的 A 股分析记录。'
  }

  const watchItems =
    active.watchItems.length > 0
      ? `关注点：${active.watchItems.join('；')}`
      : '关注点：暂无。'
  const invalidators =
    active.invalidators.length > 0
      ? `失效条件：${active.invalidators.join('；')}`
      : '失效条件：暂无。'

  return [
    `当前激活分析：${active.stockName}（${active.ticker}）`,
    `核心判断：${active.finalView}`,
    `摘要：${active.reportSummary}`,
    watchItems,
    invalidators,
  ].join('\n')
}

export async function saveAshareResearchState(
  filePath: string,
  state: AshareResearchState,
): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(state, null, 2), 'utf-8')
}

export async function loadAshareResearchState(
  filePath: string,
): Promise<AshareResearchState> {
  try {
    const content = await readFile(filePath, 'utf-8')
    return JSON.parse(content) as AshareResearchState
  } catch {
    return createEmptyAshareResearchState()
  }
}

export async function clearAshareResearchState(filePath: string): Promise<void> {
  await saveAshareResearchState(filePath, createEmptyAshareResearchState())
}
