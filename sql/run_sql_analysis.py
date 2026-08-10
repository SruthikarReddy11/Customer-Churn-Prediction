import os
import sqlite3
import csv
import datetime

def run_query_file(cursor, file_path):
    print(f"\nRunning SQL file: {file_path}")
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return []
        
    with open(file_path, 'r') as f:
        sql_content = f.read()
        
    # Split by semicolon, but ignore comments and empty statements
    statements = []
    current_statement = []
    
    for line in sql_content.split('\n'):
        # Remove comments
        clean_line = line.split('--')[0].strip()
        if not clean_line:
            continue
        current_statement.append(clean_line)
        if clean_line.endswith(';'):
            statements.append(' '.join(current_statement))
            current_statement = []
            
    results_list = []
    for stmt in statements:
        if not stmt.strip():
            continue
        print(f"Executing: {stmt[:100]}...")
        cursor.execute(stmt)
        # Check if it was a SELECT query
        if stmt.strip().upper().startswith('SELECT') or stmt.strip().upper().startswith('WITH'):
            headers = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            results_list.append((stmt, headers, rows))
            
    return results_list

def print_table(title, headers, rows, file_out=None):
    output = []
    output.append(f"\n=== {title} ===")
    
    if not rows:
        output.append("No results.")
        out_str = '\n'.join(output)
        print(out_str)
        if file_out:
            file_out.write(out_str + '\n')
        return
        
    # Calculate column widths
    widths = [len(h) for h in headers]
    for row in rows:
        for idx, val in enumerate(row):
            val_str = str(val) if val is not None else "NULL"
            if len(val_str) > widths[idx]:
                widths[idx] = len(val_str)
                
    # Max column width is 45 to keep it readable
    widths = [min(w, 45) for w in widths]
    
    # Header format
    header_line = " | ".join(f"{h:<{widths[idx]}}"[:widths[idx]] for idx, h in enumerate(headers))
    separator = "-+-".join("-" * w for w in widths)
    
    output.append(header_line)
    output.append(separator)
    
    for row in rows:
        row_cells = []
        for idx, val in enumerate(row):
            val_str = str(val) if val is not None else "NULL"
            if len(val_str) > widths[idx]:
                val_str = val_str[:widths[idx] - 3] + "..."
            row_cells.append(f"{val_str:<{widths[idx]}}")
        output.append(" | ".join(row_cells))
        
    out_str = '\n'.join(output)
    print(out_str)
    if file_out:
        file_out.write(out_str + '\n')

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(base_dir, "../data/sales.db")
    csv_path = os.path.join(base_dir, "../data/cleaned_sales.csv")
    report_path = os.path.join(base_dir, "../data/sql_analysis_report.txt")
    
    print(f"Connecting to SQLite database: {db_path}")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Run schema
    schema_path = os.path.join(base_dir, "schema.sql")
    run_query_file(cursor, schema_path)
    conn.commit()
    print("Schema created successfully.")
    
    # 2. Import CSV data into SQL
    print(f"Importing data from {csv_path}...")
    if not os.path.exists(csv_path):
        print(f"Cleaned CSV not found at: {csv_path}. Please run sales_analysis.py first!")
        return
        
    with open(csv_path, 'r', encoding='latin1') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        # Columns in schema:
        # row_id, order_id, order_date, ship_date, ship_mode, customer_id, customer_name, segment, country, city, state, postal_code, region, product_id, category, sub_category, product_name, sales, quantity, discount, profit, year, month, month_num, profit_margin
        
        # We construct the INSERT query
        placeholders = ', '.join(['?'] * len(header))
        columns = ', '.join([col.replace(' ', '_').replace('-', '_').lower() for col in header])
        insert_query = f"INSERT INTO sales_records ({columns}) VALUES ({placeholders})"
        
        row_count = 0
        batch = []
        for row in reader:
            # Map data types where necessary
            # row_id (int), sales (float), quantity (int), discount (float), profit (float), year (int), month_num (int), profit_margin (float)
            processed_row = list(row)
            try:
                processed_row[0] = int(row[0]) # Row ID
                processed_row[17] = float(row[17]) # Sales
                processed_row[18] = int(row[18]) # Quantity
                processed_row[19] = float(row[19]) # Discount
                processed_row[20] = float(row[20]) # Profit
                processed_row[21] = int(row[21]) # Year
                processed_row[23] = int(row[23]) # Month Num
                processed_row[24] = float(row[24]) # Profit Margin
            except (ValueError, IndexError) as e:
                pass
                
            batch.append(processed_row)
            row_count += 1
            
            if len(batch) >= 1000:
                cursor.executemany(insert_query, batch)
                batch = []
                
        if batch:
            cursor.executemany(insert_query, batch)
            
        conn.commit()
        print(f"Successfully imported {row_count:,} records into sales_records table.")
        
    # 3. Run analysis query files
    query_files = [
        ("KPI Metrics Report", "kpis.sql"),
        ("Sales and Profit Growth Trends", "sales_growth.sql"),
        ("Top Performers Report", "top_performers.sql"),
        ("Regional Performance Analysis", "regional_analysis.sql"),
        ("Customer Insights and Shipping Analysis", "customer_insights.sql")
    ]
    
    with open(report_path, 'w') as report_file:
        report_file.write("=== Sales Performance SQL Analysis Report ===\n")
        report_file.write(f"Generated on: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        report_file.write(f"Database file: {db_path}\n")
        report_file.write(f"Total sales records analyzed: {row_count:,}\n\n")
        
        for idx, (title, sql_file) in enumerate(query_files):
            file_path = os.path.join(base_dir, sql_file)
            results = run_query_file(cursor, file_path)
            
            for section_idx, (stmt, headers, rows) in enumerate(results):
                section_title = f"Report {idx+1}.{section_idx+1}: {title} (Section {section_idx+1})"
                print_table(section_title, headers, rows, report_file)
                
    conn.close()
    print(f"\nSQL analysis completed! Full text report saved to: {report_path}")

if __name__ == "__main__":
    main()
