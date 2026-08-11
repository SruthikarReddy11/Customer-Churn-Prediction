-- SQLite Schema definition for Sales Performance Analysis

DROP TABLE IF EXISTS sales_records;

CREATE TABLE sales_records (
    row_id INTEGER PRIMARY KEY,
    order_id TEXT,
    order_date TEXT, -- Format: YYYY-MM-DD
    ship_date TEXT,  -- Format: YYYY-MM-DD
    ship_mode TEXT,
    customer_id TEXT,
    customer_name TEXT,
    segment TEXT,
    country TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    region TEXT,
    product_id TEXT,
    category TEXT,
    sub_category TEXT,
    product_name TEXT,
    sales REAL,
    quantity INTEGER,
    discount REAL,
    profit REAL,
    year INTEGER,
    month TEXT,
    month_num INTEGER,
    profit_margin REAL
);
