# Script to compile all catalogs into src/data/importedProducts.ts
import json
import re

def parse_num(val):
    if not val:
        return 0
    s = str(val).strip()
    if s in ['-', '#N/A', 'n.a', 'Chưa xác định', '']:
        return 0
    cleaned = re.sub(r'[^\d]', '', s)
    return int(cleaned) if cleaned else 0

def format_ts_file(products, out_path):
    ts_content = "import { ProductPriceItem } from '../types';\n\n"
    ts_content += "export const IMPORTED_PRODUCTS: ProductPriceItem[] = "
    ts_content += json.dumps(products, ensure_ascii=False, indent=2)
    ts_content += ";\n"
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(ts_content)
    print(f"Wrote {len(products)} products to {out_path}")

print("Helper ready")
