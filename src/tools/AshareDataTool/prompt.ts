export const ASHARE_DATA_TOOL_NAME = 'AshareData'

export const DESCRIPTION = 'Read A-share stock profile, code/name mapping, price/technical snapshots, financial summaries, and trading-calendar facts via the built-in Python bridge.'

export const PROMPT = `Use this tool to read structured A-share market data.

## When to Use This Tool

- When the user asks for A-share single-stock analysis
- When a specialist agent needs technical, profile, or fundamental data
- When following up on a previous A-share report and only a partial refresh is needed

## Supported Actions

- \`stock_profile\`: stock name, industry, listing date, and basic identity fields; accepts code or Chinese stock name
- \`price_technical\`: daily-price snapshot, trend view, RSI, MACD, recent high/low
- \`fundamental_summary\`: recent financial analysis indicators such as ROE and growth rates
- \`trading_calendar_summary\`: weekday, whether a date is a trading day, and the next trading day

## Output

Returns structured JSON-like data with:
- \`ok\`
- \`summary\`
- \`payload\`
- optional \`warning\` or \`error\`

Always treat missing data or errors conservatively and do not fabricate market facts.`
