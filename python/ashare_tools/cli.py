from __future__ import annotations

import argparse
import json
import os
import sys
import warnings

from fundamental_summary import fetch_fundamental_summary
from price_technical import fetch_price_technical
from stock_profile import fetch_stock_profile
from trade_calendar import fetch_trading_calendar_summary


def suppress_noisy_warnings() -> None:
    warnings.filterwarnings(
        "ignore",
        message="urllib3 v2 only supports OpenSSL 1.1.1+",
    )


def configure_proxy_behavior() -> None:
    if os.environ.get("CLAUDE_CODE_ASHARE_USE_ENV_PROXY") == "1":
        return

    for key in (
        "http_proxy",
        "https_proxy",
        "all_proxy",
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "ALL_PROXY",
    ):
        os.environ.pop(key, None)

    os.environ.setdefault("NO_PROXY", "*")
    os.environ.setdefault("no_proxy", "*")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="A-share data tools for doge")
    parser.add_argument(
        "--action",
        required=True,
        choices=[
            "stock_profile",
            "price_technical",
            "fundamental_summary",
            "trading_calendar_summary",
        ],
    )
    parser.add_argument("--ticker", required=True)
    parser.add_argument("--lookback-days", type=int, default=120)
    parser.add_argument("--date")
    return parser.parse_args()


def main() -> int:
    suppress_noisy_warnings()
    configure_proxy_behavior()
    args = parse_args()

    if args.action == "stock_profile":
        result = fetch_stock_profile(args.ticker)
    elif args.action == "price_technical":
        result = fetch_price_technical(args.ticker, lookback_days=args.lookback_days)
    elif args.action == "trading_calendar_summary":
        result = fetch_trading_calendar_summary(args.ticker, analysis_date=args.date)
    else:
        result = fetch_fundamental_summary(args.ticker)

    json.dump(result, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0 if result.get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())
