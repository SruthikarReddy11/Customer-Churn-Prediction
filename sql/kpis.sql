-- KPI Metrics Report
-- Calculates key performance indicators for sales, profit, orders, and customer activity.

SELECT 
    ROUND(SUM(sales), 2) AS total_sales,
    ROUND(SUM(profit), 2) AS total_profit,
    ROUND((SUM(profit) / SUM(sales)) * 100, 2) AS overall_profit_margin_pct,
    COUNT(DISTINCT order_id) AS total_orders,
    COUNT(DISTINCT customer_id) AS total_customers,
    SUM(quantity) AS total_quantity_sold,
    ROUND(SUM(sales) / COUNT(DISTINCT order_id), 2) AS average_order_value_aov,
    ROUND(AVG(discount) * 100, 2) AS average_discount_pct,
    ROUND(SUM(profit) / COUNT(DISTINCT order_id), 2) AS average_profit_per_order,
    COUNT(DISTINCT product_id) AS unique_products_sold
FROM 
    sales_records;
