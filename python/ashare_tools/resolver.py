from __future__ import annotations

from functools import lru_cache


@lru_cache(maxsize=1)
def _stock_table():
    import akshare as ak  # type: ignore

    return ak.stock_info_a_code_name()


def resolve_stock_input_from_table(raw_value: str, table):
    value = str(raw_value).strip()
    if not value:
        raise ValueError("股票代码或名称不能为空。")

    if value.isdigit() and len(value) == 6:
        exact = table[table["code"].astype(str) == value]
        if not exact.empty:
            row = exact.iloc[0]
            return value, str(row["name"]).strip()
        return value, value

    exact_name = table[table["name"].astype(str) == value]
    if not exact_name.empty:
        row = exact_name.iloc[0]
        return str(row["code"]).strip(), str(row["name"]).strip()

    fuzzy = table[table["name"].astype(str).str.contains(value, na=False, regex=False)]
    if len(fuzzy) == 1:
        row = fuzzy.iloc[0]
        return str(row["code"]).strip(), str(row["name"]).strip()

    if len(fuzzy) > 1:
        candidates = "、".join(
            f"{row['name']}({row['code']})" for _, row in fuzzy.head(5).iterrows()
        )
        raise ValueError(f"股票名称不够明确，请改用代码或更完整名称。候选包括：{candidates}")

    raise ValueError(f"未找到与“{value}”匹配的 A 股股票。")


def resolve_stock_input(raw_value: str):
    return resolve_stock_input_from_table(raw_value, _stock_table())
