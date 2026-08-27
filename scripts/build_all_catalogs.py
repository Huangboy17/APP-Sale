# -*- coding: utf-8 -*-
# Complete master build script for all 5 product catalogs
import json
import os
import re

from data_axor_base import parse_axor_hansgrohe
from data_axor_hansgrohe_more import parse_axor_hg_more
from data_axent_blanco import AXENT_DATA, BLANCO_DATA
from data_kaldewei import KALDEWEI_DATA
from data_geesa_partial import GEESA_RAW
from data_geberit_base import GEBERIT_RAW

def clean_num(val):
    if not val:
        return 0
    s = str(val).strip()
    if s in ['-', '#N/A', 'n.a', 'Chưa xác định', '', 'None']:
        return 0
    cleaned = re.sub(r'[^\d]', '', s)
    return int(cleaned) if cleaned else 0

all_products = []
seen_skus = set()

def add_item(item):
    sku = str(item['sku']).strip()
    if not sku:
        return
    unique_sku = sku
    idx = 1
    while unique_sku in seen_skus:
        idx += 1
        unique_sku = f"{sku}-{idx}"
    seen_skus.add(unique_sku)
    
    item['sku'] = unique_sku
    item['listPrice'] = clean_num(item.get('listPrice', 0))
    item['dpPrice'] = clean_num(item.get('dpPrice', 0))
    if item['dpPrice'] == 0 and item['listPrice'] > 0:
        item['dpPrice'] = int(item['listPrice'] * 0.65)
    item['status'] = 'active'
        
    all_products.append(item)

# 1. Add AXOR & Hansgrohe Base
for it in parse_axor_hansgrohe():
    add_item(it)

# 2. Add AXOR & Hansgrohe More
for it in parse_axor_hg_more():
    add_item(it)

# 3. Add AXENT
for it in AXENT_DATA:
    add_item(it)

# 4. Add BLANCO
for it in BLANCO_DATA:
    add_item(it)

# 5. Add KALDEWEI
for it in KALDEWEI_DATA:
    add_item(it)

# 6. Add GEESA
for g in GEESA_RAW:
    sku, name, cat, brand, col, sz, unit, lp, dp, desc = g
    add_item({
        "sku": sku,
        "name": name,
        "category": cat,
        "brand": brand,
        "color": col,
        "size": sz,
        "unit": unit,
        "listPrice": clean_num(lp),
        "dpPrice": clean_num(dp),
        "description": desc,
        "status": "active"
    })

# 7. Add GEBERIT
for gb in GEBERIT_RAW:
    sku, name, cat, brand, col, sz, unit, lp, dp, desc = gb
    add_item({
        "sku": sku,
        "name": name,
        "category": cat,
        "brand": brand,
        "color": col,
        "size": sz,
        "unit": unit,
        "listPrice": clean_num(lp),
        "dpPrice": clean_num(dp),
        "description": desc,
        "status": "active"
    })

print(f"Total compiled products across all 5 catalogs: {len(all_products)}")

# Write to src/data/importedProducts.ts
out_ts = "src/data/importedProducts.ts"
os.makedirs(os.path.dirname(out_ts), exist_ok=True)
with open(out_ts, "w", encoding="utf-8") as f:
    f.write("import { ProductPriceItem } from '../types';\n\n")
    f.write("export const IMPORTED_PRODUCTS: ProductPriceItem[] = ")
    f.write(json.dumps(all_products, ensure_ascii=False, indent=2))
    f.write(";\n")

print(f"Successfully generated {out_ts} with {len(all_products)} products.")
