-- Customer Insights and Shipping Analysis
-- Analyzes customer segments, purchase size, shipping modes, and delivery times.

-- Section 1: Customer Segment Analysis
SELECT 
    segment,
    COUNT(DISTINCT customer_id) AS unique_customers,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    ROUND(SUM(sales) / COUNT(DISTINCT customer_id), 2) AS average_spend_per_customer,
    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS profit_margin_pct
FROM 
    sales_records
GROUP BY 
    segment
ORDER BY 
    total_sales DESC;


-- Section 2: Shipping Mode Efficiency and Financial Performance
SELECT 
    ship_mode,
    COUNT(DISTINCT order_id) AS total_orders,
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    -- Compute average shipping delay in days
    ROUND(AVG(julianday(ship_date) - julianday(order_date)), 1) AS avg_shipping_delay_days,
    ROUND(AVG(discount) * 100, 2) AS avg_discount_pct
FROM 
    sales_records
GROUP BY 
    ship_mode
ORDER BY 
    total_sales DESC;


-- Section 3: High-Frequency Buyers (Top 10 Customers by Order Count)
SELECT 
    customer_id,
    customer_name,
    COUNT(DISTINCT order_id) AS order_count,
    SUM(quantity) AS total_items_bought,
    ROUND(SUM(sales), 2) AS total_spend,
    ROUND(AVG(sales), 2) AS avg_order_value
FROM 
    sales_records
GROUP BY 
    customer_id, customer_name
ORDER BY 
    order_count DESC
LIMIT 10;
