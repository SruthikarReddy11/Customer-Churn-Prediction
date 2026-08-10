-- Top Performers Report
-- Analyzes sales and profit contributions by Products, Categories, and Customers.

-- Section 1: Top 10 Best Selling Products
SELECT 
    product_name,
    category,
    ROUND(SUM(sales), 2) AS total_sales,
    SUM(quantity) AS units_sold,
    ROUND(SUM(profit), 2) AS total_profit,
    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
FROM 
    sales_records
GROUP BY 
    product_name, category
ORDER BY 
    total_sales DESC
LIMIT 10;


-- Section 2: Sales and Profitability by Product Category & Sub-Category
SELECT 
    category,
    sub_category,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
FROM 
    sales_records
GROUP BY 
    category, sub_category
ORDER BY 
    category, total_sales DESC;


-- Section 3: Top 10 Customers by Revenue
SELECT 
    customer_id,
    customer_name,
    segment,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(sales), 2) AS total_spend,
    ROUND(SUM(profit), 2) AS total_profit_contribution
FROM 
    sales_records
GROUP BY 
    customer_id, customer_name, segment
ORDER BY 
    total_spend DESC
LIMIT 10;
