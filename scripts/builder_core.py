# -*- coding: utf-8 -*-
# Build AXOR, Hansgrohe, AXENT, BLANCO, GEBERIT, GEESA, KALDEWEI data into TypeScript

import re
import json

def parse_price(val_str):
    if not val_str or str(val_str).strip() in ['-', '#N/A', 'n.a', 'Chưa xác định', '']:
        return 0
    cleaned = re.sub(r'[^\d]', '', str(val_str))
    return int(cleaned) if cleaned else 0

def make_item(sku, name, category, brand, color, size, unit, list_price, dp_price, desc=""):
    return {
        "sku": str(sku).strip(),
        "name": str(name).strip(),
        "category": str(category).strip() or "Thiết bị vệ sinh",
        "brand": str(brand).strip(),
        "color": str(color).strip() or "Tiêu chuẩn",
        "size": str(size).strip() or "Tiêu chuẩn",
        "unit": str(unit).strip() or "Bộ",
        "listPrice": parse_price(list_price),
        "dpPrice": parse_price(dp_price),
        "description": str(desc).strip(),
        "status": "active"
    }

print("Base builder ready")
