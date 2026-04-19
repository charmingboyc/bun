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
        "action": "stock_profile",
        "ticker": ticker,
        "summary": "暂时无法读取该股票的基础信息。",
        "error": message,
    }


def fetch_stock_profile(ticker: str) -> dict:
    ak, import_error = _load_akshare()
    if ak is None:
        return _error_result(
            ticker,
            f"AkShare 不可用，请先安装依赖后重试: {import_error}",
        )

    try:
        resolved_code, resolved_name = resolve_stock_input(ticker)
    except Exception as exc:
        return _error_result(ticker, str(exc))

    try:
        df = ak.stock_profile_cninfo(symbol=resolved_code)
    except Exception as exc:  # pragma: no cover - network/runtime guard
        return _error_result(ticker, str(exc))

    if df is None or df.empty:
        return _error_result(ticker, "未返回个股基础信息。")

    row = df.iloc[0].to_dict()

    stock_name = str(row.get("A股简称", resolved_name)).strip()
    industry = str(row.get("所属行业", "未知行业")).strip()
    listing_date = str(row.get("上市日期", "未知")).strip()

    summary = (
        f"{stock_name}（{resolved_code}）属于{industry}。"
        f"上市时间为{listing_date}。"
    )

    return {
        "ok": True,
        "action": "stock_profile",
        "ticker": resolved_code,
        "summary": summary,
        "payload": {
            "stock_name": stock_name,
            "industry": industry,
            "listing_date": listing_date,
            "company_name": row.get("公司名称"),
            "legal_representative": row.get("法人代表"),
            "registered_capital": row.get("注册资金"),
            "website": row.get("官方网站"),
            "main_business": row.get("主营业务"),
        },
    }
