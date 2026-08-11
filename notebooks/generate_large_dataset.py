import csv
import datetime
import random

def parse_date(date_str):
    # Formats are usually M/D/YYYY
    for fmt in ('%m/%d/%Y', '%Y-%m-%d'):
        try:
            return datetime.datetime.strptime(date_str, fmt)
        except ValueError:
            pass
    raise ValueError(f"Unknown date format: {date_str}")

def shift_date(dt, years):
    try:
        return dt.replace(year=dt.year + years)
    except ValueError:
        # Handle February 29 on non-leap years
        return dt.replace(year=dt.year + years, day=28)

def main():
    raw_path = "data/Sales.csv.csv"
    output_path = "data/Sales_large.csv"
    
    print(f"Reading original file: {raw_path}")
    
    records = []
    with open(raw_path, 'r', encoding='latin1') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            records.append(row)
            
    print(f"Original record count: {len(records)}")
    
    # We will create 6 versions of the dataset:
    # 0: Original (2014-2017)
    # 1: Shifted by 2 years (2016-2019)
    # 2: Shifted by 4 years (2018-2021)
    # 3: Shifted by 6 years (2020-2023)
    # 4: Shifted by 8 years (2022-2025)
    # 5: Shifted by 9 years (2023-2026)
    
    shifts = [0, 2, 4, 6, 8, 9]
    expanded_records = []
    
    # Seed the random number generator for reproducibility
    random.seed(42)
    
    for shift in shifts:
        for row in records:
            new_row = row.copy()
            
            # Parse dates
            order_date = parse_date(row['Order Date'])
            ship_date = parse_date(row['Ship Date'])
            
            if shift > 0:
                # Shift dates
                new_order_date = shift_date(order_date, shift)
                new_ship_date = shift_date(ship_date, shift)
                
                # Apply growth and noise
                growth_factor = (1.05) ** shift
                noise = random.uniform(0.92, 1.08)
                scale = growth_factor * noise
                
                # Update Sales and Profit
                try:
                    sales = float(row['Sales'])
                    profit = float(row['Profit'])
                    new_row['Sales'] = f"{round(sales * scale, 2):.2f}"
                    new_row['Profit'] = f"{round(profit * scale, 4):.4f}"
                except ValueError:
                    pass
                
                # Update Order ID year (e.g. CA-2016-152156 -> CA-2018-152156)
                parts = row['Order ID'].split('-')
                if len(parts) == 3:
                    new_row['Order ID'] = f"{parts[0]}-{new_order_date.year}-{parts[2]}"
                
                # Update customer ID and name for 15% of records
                if random.random() < 0.15:
                    new_row['Customer ID'] = row['Customer ID'] + "-B"
                    new_row['Customer Name'] = row['Customer Name'] + " II"
            else:
                new_order_date = order_date
                new_ship_date = ship_date
                
            # Add datetime object temporarily for sorting
            new_row['_sort_date'] = new_order_date
            new_row['Order Date'] = new_order_date.strftime('%m/%d/%Y')
            new_row['Ship Date'] = new_ship_date.strftime('%m/%d/%Y')
            
            expanded_records.append(new_row)
            
    print("Sorting records by date...")
    expanded_records.sort(key=lambda x: x['_sort_date'])
    
    # Assign Row ID
    for idx, row in enumerate(expanded_records):
        row['Row ID'] = str(idx + 1)
        del row['_sort_date']
        
    print(f"Expanded record count: {len(expanded_records)}")
    
    with open(output_path, 'w', newline='', encoding='latin1') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(expanded_records)
        
    print(f"Expanded dataset saved to: {output_path}")

if __name__ == "__main__":
    main()
