#!/usr/bin/env python3
import csv
import json
from collections import defaultdict

def convert_csv_to_json():
    provinces_data = defaultdict(lambda: {
        'name': '',
        'units': [],
        'total_units': 0,
        'merged_units': 0,
        'unchanged_units': 0
    })
    
    all_units = []
    
    with open('data.csv', 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            province = row['Tỉnh']
            new_unit = row['Phường, xã mới']
            old_units = row['Phường, xã trước sáp nhập']
            
            # Initialize province data
            if not provinces_data[province]['name']:
                provinces_data[province]['name'] = province
            
            # Determine if it's a merger or no change
            is_unchanged = old_units == 'Không sáp nhập'
            
            unit_data = {
                'new_name': new_unit,
                'old_units': [] if is_unchanged else [u.strip() for u in old_units.split(',')],
                'is_unchanged': is_unchanged,
                'province': province
            }
            
            provinces_data[province]['units'].append(unit_data)
            provinces_data[province]['total_units'] += 1
            
            if is_unchanged:
                provinces_data[province]['unchanged_units'] += 1
            else:
                provinces_data[province]['merged_units'] += 1
            
            all_units.append(unit_data)
    
    # Calculate statistics
    statistics = {
        'total_units': len(all_units),
        'total_provinces': len(provinces_data),
        'total_merged': sum(p['merged_units'] for p in provinces_data.values()),
        'total_unchanged': sum(p['unchanged_units'] for p in provinces_data.values()),
        'merger_distribution': defaultdict(int)
    }
    
    # Calculate merger distribution
    for unit in all_units:
        if not unit['is_unchanged']:
            merger_size = len(unit['old_units'])
            statistics['merger_distribution'][merger_size] += 1
    
    # Convert defaultdict to regular dict for JSON serialization
    statistics['merger_distribution'] = dict(statistics['merger_distribution'])
    
    # Sort provinces by total units (descending)
    provinces_list = sorted(
        [{'id': k, **v} for k, v in provinces_data.items()],
        key=lambda x: x['total_units'],
        reverse=True
    )
    
    # Create final JSON structure
    json_data = {
        'metadata': {
            'source': 'VnExpress - Tra cứu 3.321 phường, xã trên cả nước sau sắp xếp',
            'url': 'https://vnexpress.net/tra-cuu-3-321-phuong-xa-tren-ca-nuoc-sau-sap-xep-4903454.html',
            'last_updated': '2025-07-04'
        },
        'statistics': statistics,
        'provinces': provinces_list,
        'units': all_units
    }
    
    # Write to JSON file
    with open('data.json', 'w', encoding='utf-8') as jsonfile:
        json.dump(json_data, jsonfile, ensure_ascii=False, indent=2)
    
    print(f"Conversion complete!")
    print(f"Total units: {statistics['total_units']}")
    print(f"Total provinces: {statistics['total_provinces']}")
    print(f"Merged units: {statistics['total_merged']}")
    print(f"Unchanged units: {statistics['total_unchanged']}")

if __name__ == '__main__':
    convert_csv_to_json()