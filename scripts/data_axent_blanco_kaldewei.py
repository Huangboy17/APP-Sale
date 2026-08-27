# -*- coding: utf-8 -*-
from data_axent_blanco import AXENT_DATA, BLANCO_DATA
from data_kaldewei import KALDEWEI_DATA

def get_axent_blanco_kaldewei():
    items = []
    items.extend(AXENT_DATA)
    items.extend(BLANCO_DATA)
    items.extend(KALDEWEI_DATA)
    return items

if __name__ == '__main__':
    data = get_axent_blanco_kaldewei()
    print(f"Loaded {len(data)} items from AXENT, BLANCO, KALDEWEI")
