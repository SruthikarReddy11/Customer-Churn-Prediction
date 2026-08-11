-- Sales and Profit Growth Trends
-- Analyzes sales and profit changes over years and months, calculating MoM and YoY growth.

-- Section 1: Annual Performance and YoY Growth
WITH annual_sales AS (
    SELECT 
        year,
        SUM(sales) AS sales,
        SUM(profit) AS profit
    FROM 
        sales_records
    GROUP BY 
        year
)
SELECT 
    year,
    ROUND(sales, 2) AS yearly_sales,
    ROUND(profit, 2) AS yearly_profit,
    ROUND((profit / sales) * 100, 2) AS profit_margin_pct,
    ROUND(
        ((sales - LAG(sales) OVER (ORDER BY year)) / LAG(sales) OVER (ORDER BY year)) * 100, 
        2
    ) AS yoy_sales_growth_pct,
    ROUND(
        ((profit - LAG(profit) OVER (ORDER BY year)) / LAG(profit) OVER (ORDER BY year)) * 100, 
        2
    ) AS yoy_profit_growth_pct
FROM 
    annual_sales
ORDER BY 
    year;


-- Section 2: Monthly Trends and Month-over-Month (MoM) Growth (for the last 2 years of data, e.g. 2025 and 2026)
WITH monthly_sales AS (
    SELECT 
        year,
        month_num,
        month,
        SUM(sales) AS sales,
        SUM(profit) AS profit
    FROM 
        sales_records
    GROUP BY 
        year, month_num, month
)
SELECT 
    year,
    month,
    ROUND(sales, 2) AS monthly_sales,
    ROUND(profit, 2) AS monthly_profit,
    ROUND(
        ((sales - LAG(sales) OVER (ORDER BY year, month_num)) / LAG(sales) OVER (ORDER BY year, month_num)) * 100, 
        2
    ) AS mom_sales_growth_pct
FROM 
    monthly_sales
ORDER BY 
    year, month_num;
