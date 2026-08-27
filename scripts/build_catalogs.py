import re
import json

def parse_price(val_str):
    if not val_str or val_str.strip() in ['-', '#N/A', 'n.a', 'Chưa xác định']:
        return 0
    # Remove VND, spaces, dots, commas
    cleaned = re.sub(r'[^\d]', '', val_str)
    if not cleaned:
        return 0
    return int(cleaned)

print("Helper ready")
