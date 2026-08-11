-- Regional Performance Analysis
-- Analyzes sales, profit, and margins across different Regions, States, and Cities.

-- Section 1: Regional Sales Summary
SELECT 
    region,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
FROM 
    sales_records
GROUP BY 
    region
ORDER BY 
    total_sales DESC;


-- Section 2: Top 10 States by Revenue
SELECT 
    state,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
FROM 
    sales_records
GROUP BY 
    state
ORDER BY 
    total_sales DESC
LIMIT 10;


-- Section 3: Cities with Highest Sales & Profits
SELECT 
    city,
    state,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
FROM 
    sales_records
GROUP BY 
    city, state
ORDER BY 
    total_sales DESC
LIMIT 10;
