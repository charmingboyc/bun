from __future__ import annotations

import math
from datetime import datetime, timedelta

from resolver import resolve_stock_input


def _load_akshare():
    try:
        import akshare as ak  # type: ignore
        import pandas as pd  # type: ignore

        return ak, pd, None
    except Exception as exc:  # pragma: no cover - dependency/runtime guard
        return None, None, str(exc)


def _error_result(ticker: str, message: str) -> dict:
    return {
        "ok": False,
        "action": "price_technical",
        "ticker": ticker,
        "summary": "暂时无法读取该股票的行情与技术指标。",
        "error": message,
    }


def _safe_number(value):
    if value is None:
        return None
    try:
        if math.isnan(value):
            return None
    except Exception:
        pass
    try:
        return float(value)
    except Exception:
        return value


def _rsi(series, period=14):
    delta = series.diff()
    up = delta.clip(lower=0)
    down = -delta.clip(upper=0)
    avg_gain = up.rolling(window=period, min_periods=period).mean()
    avg_loss = down.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss.replace(0, float("nan"))
    return 100 - (100 / (1 + rs))


def fetch_price_technical(ticker: str, lookback_days: int = 120) -> dict:
    ak, pd, import_error = _load_akshare()
    if ak is None:
        return _error_result(
            ticker,
            f"AkShare 不可用，请先安装依赖后重试: {import_error}",
        )

    try:
        resolved_code, _ = resolve_stock_input(ticker)
    except Exception as exc:
        return _error_result(ticker, str(exc))

    end_date = datetime.now().strftime("%Y%m%d")
    start_date = (datetime.now() - timedelta(days=lookback_days)).strftime("%Y%m%d")
    market_prefix = "sh" if resolved_code.startswith(("6", "9")) else "sz"
    tx_symbol = f"{market_prefix}{resolved_code}"

    try:
        df = ak.stock_zh_a_hist_tx(
            symbol=tx_symbol,
            start_date=start_date,
            end_date=end_date,
            adjust="qfq",
        )
    except Exception as exc:  # pragma: no cover - network/runtime guard
        return _error_result(ticker, str(exc))

    if df is None or df.empty:
        return _error_result(ticker, "未返回历史行情数据。")

    close = pd.to_numeric(df["close"], errors="coerce")
    high = pd.to_numeric(df["high"], errors="coerce")
    low = pd.to_numeric(df["low"], errors="coerce")
    volume = pd.to_numeric(df["amount"], errors="coerce")

    df = df.assign(
        ma5=close.rolling(window=5, min_periods=5).mean(),
        ma10=close.rolling(window=10, min_periods=10).mean(),
        ma20=close.rolling(window=20, min_periods=20).mean(),
        ema12=close.ewm(span=12, adjust=False).mean(),
        ema26=close.ewm(span=26, adjust=False).mean(),
        rsi14=_rsi(close, 14),
        volume_ma5=volume.rolling(window=5, min_periods=5).mean(),
        recent_high=high.rolling(window=20, min_periods=1).max(),
        recent_low=low.rolling(window=20, min_periods=1).min(),
    )
    df["macd_diff"] = df["ema12"] - df["ema26"]
    df["macd_dea"] = df["macd_diff"].ewm(span=9, adjust=False).mean()
    df["macd_hist"] = (df["macd_diff"] - df["macd_dea"]) * 2

    latest = df.iloc[-1]
    latest_close = _safe_number(latest["close"])
    ma5 = _safe_number(latest["ma5"])
    ma20 = _safe_number(latest["ma20"])
    rsi14 = _safe_number(latest["rsi14"])
    macd_hist = _safe_number(latest["macd_hist"])
    recent_high = _safe_number(latest["recent_high"])
    recent_low = _safe_number(latest["recent_low"])

    trend = "震荡"
    if latest_close is not None and ma5 is not None and ma20 is not None:
        if latest_close > ma5 > ma20:
            trend = "偏强"
        elif latest_close < ma5 < ma20:
            trend = "偏弱"

    momentum = "中性"
    if rsi14 is not None:
        if rsi14 >= 70:
            momentum = "偏热"
        elif rsi14 <= 30:
            momentum = "偏冷"

    macd_view = "动能中性"
    if macd_hist is not None:
        if macd_hist > 0:
            macd_view = "MACD 柱体为正，短线动能偏强"
        elif macd_hist < 0:
            macd_view = "MACD 柱体为负，短线动能偏弱"

    summary = (
        f"{resolved_code} 当前技术面{trend}，"
        f"RSI 显示{momentum}，"
        f"{macd_view}。"
    )

    return {
        "ok": True,
        "action": "price_technical",
        "ticker": resolved_code,
        "summary": summary,
        "payload": {
            "latest_close": latest_close,
            "ma5": ma5,
            "ma10": _safe_number(latest["ma10"]),
            "ma20": ma20,
            "rsi14": rsi14,
            "macd_diff": _safe_number(latest["macd_diff"]),
            "macd_dea": _safe_number(latest["macd_dea"]),
            "macd_hist": macd_hist,
            "recent_high_20d": recent_high,
            "recent_low_20d": recent_low,
            "trend": trend,
            "momentum": momentum,
        },
    }
