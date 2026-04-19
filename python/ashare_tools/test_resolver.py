from unittest import TestCase
import pandas as pd
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from resolver import resolve_stock_input_from_table


class ResolverTests(TestCase):
    def setUp(self):
        self.table = pd.DataFrame(
            [
                {"code": "300750", "name": "宁德时代"},
                {"code": "600519", "name": "贵州茅台"},
            ]
        )

    def test_exact_code_passthrough(self):
        code, name = resolve_stock_input_from_table("300750", self.table)
        self.assertEqual(code, "300750")
        self.assertEqual(name, "宁德时代")

    def test_exact_chinese_name_resolves_to_code(self):
        code, name = resolve_stock_input_from_table("宁德时代", self.table)
        self.assertEqual(code, "300750")
        self.assertEqual(name, "宁德时代")

    def test_empty_input_raises(self):
        with self.assertRaises(ValueError):
            resolve_stock_input_from_table("   ", self.table)
