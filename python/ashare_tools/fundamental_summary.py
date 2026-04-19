from __future__ import annotations

from resolver import resolve_stock_input

def _load_akshare():
    try:
        import akshare as ak  # type: ignore

        return ak, None
    except Exception as exc:  # pragma: no cover - dependency/runtime guard
        return None, str(exc)


def _error_result(ticker: str, message: str) -> dict:
    return {
        "ok": False,
        "action": "fundamental_summary",
        "ticker": ticker,
        "summary": "暂时无法读取该股票的基本面摘要。",
        "error": message,
    }


def _first_existing_value(row, *columns):
    for column in columns:
        value = row.get(column)
        if value is not None:
            return value
    return None


def _latest_report_column(columns):
    period_columns = [
        column
        for column in columns
        if isinstance(column, str) and len(column) == 8 and column.isdigit()
    ]
    return period_columns[0] if period_columns else None


def _metric_value(df, metric_names, latest_period):
    if latest_period is None:
        return None

    metric_column = df["指标"].astype(str)
    for metric_name in metric_names:
        rows = df[metric_column.str.contains(metric_name, na=False, regex=False)]
        if not rows.empty:
            return rows.iloc[0].get(latest_period)
    return None


def fetch_fundamental_summary(ticker: str) -> dict:
    ak, import_error = _load_akshare()
    if ak is None:
        return _error_result(
            ticker,
            f"AkShare 不可用，请先安装依赖后重试: {import_error}",
        )

    try:
        resolved_code, _ = resolve_stock_input(ticker)
    except Exception as exc:
        return _error_result(ticker, str(exc))

    try:
        df = ak.stock_financial_abstract(symbol=resolved_code)
    except Exception as exc:  # pragma: no cover - network/runtime guard
        return _error_result(ticker, str(exc))

    if df is None or df.empty:
        return _error_result(ticker, "未返回财务分析指标数据。")

    latest_period = _latest_report_column(df.columns.tolist())
    if latest_period is None:
        return _error_result(ticker, "未识别到最新财报列。")

    roe = _metric_value(df, ["净资产收益率(ROE)", "净资产收益率"], latest_period)
    revenue_growth = _metric_value(df, ["营业总收入增长率"], latest_period)
    profit_growth = _metric_value(df, ["归属母公司净利润增长率"], latest_period)
    debt_ratio = _metric_value(df, ["资产负债率"], latest_period)
    cashflow_per_share = _metric_value(
        df,
        ["每股经营现金流", "每股现金流"],
        latest_period,
    )
    gross_margin = _metric_value(df, ["毛利率"], latest_period)
    net_margin = _metric_value(df, ["销售净利率"], latest_period)

    summary = (
        f"{resolved_code} 最新财务指标显示："
        f"ROE 约为 {roe}，"
        f"主营收入增长率约为 {revenue_growth}%，"
        f"净利润增长率约为 {profit_growth}%，"
        f"资产负债率约为 {debt_ratio}%。"
    )

    return {
        "ok": True,
        "action": "fundamental_summary",
        "ticker": resolved_code,
        "summary": summary,
        "payload": {
            "report_date": latest_period,
            "roe": roe,
            "revenue_growth_pct": revenue_growth,
            "profit_growth_pct": profit_growth,
            "debt_ratio_pct": debt_ratio,
            "operating_cashflow_per_share": cashflow_per_share,
            "gross_margin_pct": gross_margin,
            "net_margin_pct": net_margin,
        },
    }
