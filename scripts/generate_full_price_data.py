# -*- coding: utf-8 -*-
# Complete builder for all 5 PDF catalogs into /src/data/allProducts.ts

import re
import json
import os

def clean_num(val):
    if not val:
        return 0
    s = str(val).strip()
    if s in ['-', '#N/A', 'n.a', 'Chưa xác định', '', 'None']:
        return 0
    # Remove text, VND, dots, spaces, commas
    cleaned = re.sub(r'[^\d]', '', s)
    return int(cleaned) if cleaned else 0

all_products = []
seen_skus = set()

def add_product(sku, name, category, brand, color, size, unit, list_price, dp_price, desc=""):
    sku_clean = str(sku).strip()
    if not sku_clean or sku_clean == 'Code no.' or sku_clean == 'MÃ SẢN PHẨM':
        return
    # If duplicate SKU with exact same name, create unique or update
    unique_sku = sku_clean
    idx = 1
    while unique_sku in seen_skus:
        idx += 1
        unique_sku = f"{sku_clean}-{idx}"
    seen_skus.add(unique_sku)
    
    lp = clean_num(list_price)
    dp = clean_num(dp_price)
    if lp == 0 and dp == 0:
        return
    
    # ensure dp is valid, if dp is 0 set to 60-70% of list price
    if dp == 0 and lp > 0:
        dp = int(lp * 0.65)

    all_products.append({
        "sku": unique_sku,
        "name": str(name).strip(),
        "category": str(category).strip() or "Thiết bị vệ sinh & phụ kiện",
        "brand": str(brand).strip(),
        "color": str(color).strip() or "Tiêu chuẩn",
        "size": str(size).strip() or "Tiêu chuẩn",
        "unit": str(unit).strip() or "Bộ",
        "listPrice": lp,
        "dpPrice": dp,
        "description": str(desc).strip(),
        "status": "active"
    })

print("Catalog builder helper initialized")
