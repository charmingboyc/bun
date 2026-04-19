from __future__ import annotations

from datetime import datetime, timedelta


WEEKDAY_CN = {
    0: "周一",
    1: "周二",
    2: "周三",
    3: "周四",
    4: "周五",
    5: "周六",
    6: "周日",
}


def _load_akshare():
    try:
        import akshare as ak  # type: ignore

        return ak, None
    except Exception as exc:  # pragma: no cover - dependency/runtime guard
        return None, str(exc)


def _error_result(reference: str, message: str) -> dict:
    return {
        "ok": False,
        "action": "trading_calendar_summary",
        "ticker": reference,
        "summary": "暂时无法读取交易日历。",
        "error": message,
    }


def _normalize_trade_date(value):
    if hasattr(value, "date"):
        return value.date()
    return value


def fetch_trading_calendar_summary(reference: str, analysis_date: str | None = None) -> dict:
    ak, import_error = _load_akshare()
    if ak is None:
        return _error_result(
            reference,
            f"AkShare 不可用，请先安装依赖后重试: {import_error}",
        )

    try:
        calendar = ak.tool_trade_date_hist_sina()
    except Exception as exc:  # pragma: no cover - network/runtime guard
        return _error_result(reference, str(exc))

    if calendar is None or calendar.empty:
        return _error_result(reference, "未返回交易日历数据。")

    if analysis_date:
        current_date = datetime.strptime(analysis_date, "%Y-%m-%d").date()
    else:
        current_date = datetime.now().date()

    trade_dates = {_normalize_trade_date(value) for value in calendar["trade_date"].tolist()}
    next_trade_date = None
    probe = current_date + timedelta(days=1)
    while next_trade_date is None:
        if probe in trade_dates:
            next_trade_date = probe
            break
        probe += timedelta(days=1)

    summary = (
        f"今天是{current_date.year}年{current_date.month}月{current_date.day}日"
        f"（{WEEKDAY_CN[current_date.weekday()]}），"
        f"下一个交易日是{next_trade_date.year}年{next_trade_date.month}月{next_trade_date.day}日"
        f"（{WEEKDAY_CN[next_trade_date.weekday()]}）。"
    )

    return {
        "ok": True,
        "action": "trading_calendar_summary",
        "ticker": reference,
        "summary": summary,
        "payload": {
            "analysis_date": current_date.isoformat(),
            "analysis_weekday": WEEKDAY_CN[current_date.weekday()],
            "is_trading_day": current_date in trade_dates,
            "next_trading_date": next_trade_date.isoformat(),
            "next_trading_weekday": WEEKDAY_CN[next_trade_date.weekday()],
        },
    }
