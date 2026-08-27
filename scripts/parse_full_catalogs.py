import re
import json

def clean_val(val_str):
    if not val_str:
        return 0
    cleaned = re.sub(r'[^\d]', '', val_str)
    return int(cleaned) if cleaned else 0

print("Parser initialized")
