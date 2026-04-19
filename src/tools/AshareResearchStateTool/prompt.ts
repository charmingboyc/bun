export const ASHARE_RESEARCH_STATE_TOOL_NAME = 'AshareResearchState'

export const DESCRIPTION =
  'Load, save, or clear the active A-share analysis state for the current conversation.'

export const PROMPT = `Use this tool to persist the active A-share analysis inside the current conversation.

## When to Use This Tool

- After producing a full A-share report, save the final report and core thesis
- Before answering a follow-up on an earlier A-share report, load the active analysis
- When the user explicitly wants to reset the current A-share context, clear it

## Supported Actions

- \`load_active_analysis\`
- \`save_analysis\`
- \`clear_active_analysis\`

## Important

- This tool is per-conversation state, not a global market database
- Save only the final thesis, report summary, watch items, and invalidation conditions
- If no active analysis exists, say so plainly and continue conservatively`
