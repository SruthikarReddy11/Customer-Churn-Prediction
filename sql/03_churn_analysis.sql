-- ============================================================================
-- Phase 2: Comprehensive SQL Business Analytics
-- Project: Customer Churn Prediction & Customer Lifetime Value (LTV) Engine
-- Description: Business analytics queries answering key executive questions regarding
-- churn rate, revenue impact, tenure cohorts, payment friction, and LTV distribution.
-- ============================================================================

USE telco_churn_db;

-- ----------------------------------------------------------------------------
-- QUERY 1: Overall Customer Churn & Revenue Exposure
-- PURPOSE: Calculate macro KPIs for executive leadership—overall churn rate and 
-- monthly revenue lost due to churn.
-- BUSINESS MEANING: Establishes baseline retention baseline and quantifies direct 
-- top-line financial leakage.
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_customers,
    SUM(CASE WHEN b.churn = 'Yes' THEN 1 ELSE 0 END) AS total_churned_customers,
    ROUND(AVG(CASE WHEN b.churn = 'Yes' THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_percentage,
    ROUND(SUM(b.monthly_charges), 2) AS total_monthly_mrr,
    ROUND(SUM(CASE WHEN b.churn = 'Yes' THEN b.monthly_charges ELSE 0 END), 2) AS churned_monthly_mrr,
    ROUND((SUM(CASE WHEN b.churn = 'Yes' THEN b.monthly_charges ELSE 0 END) / SUM(b.monthly_charges)) * 100, 2) AS mrr_loss_percentage
FROM customers c
JOIN billing_info b ON c.customer_id = b.customer_id;


-- ----------------------------------------------------------------------------
-- QUERY 2: Churn Analysis by Contract Type
-- PURPOSE: Determine how contract duration (Month-to-month, 1 Year, 2 Year) 
-- influences churn probability and revenue loss.
-- BUSINESS MEANING: Identifies if short-term commitments are driving customer defection 
-- and quantifies contract lock-in value.
-- ----------------------------------------------------------------------------
SELECT 
    b.contract,
    COUNT(c.customer_id) AS total_customers,
    SUM(CASE WHEN b.churn = 'Yes' THEN 1 ELSE 0 END) AS churned_customers,
    ROUND(AVG(CASE WHEN b.churn = 'Yes' THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
    ROUND(AVG(b.monthly_charges), 2) AS avg_monthly_charges,
    ROUND(SUM(CASE WHEN b.churn = 'Yes' THEN b.monthly_charges ELSE 0 END), 2) AS mrr_at_risk
FROM customers c
JOIN billing_info b ON c.customer_id = b.customer_id
GROUP BY b.contract
ORDER BY churn_rate_pct DESC;


-- ----------------------------------------------------------------------------
-- QUERY 3: Payment Method Friction & Revenue Impact
-- PURPOSE: Evaluate churn rate across payment channels (Electronic Check, Mailed Check, Automatic Bank Transfer, Credit Card).
-- BUSINESS MEANING: Discovers whether manual payment methods (e.g. Electronic check) suffer higher payment failures or churn friction compared to automated billing.
-- ----------------------------------------------------------------------------
SELECT 
    b.payment_method,
    COUNT(c.customer_id) AS total_customers,
    SUM(CASE WHEN b.churn = 'Yes' THEN 1 ELSE 0 END) AS churned_customers,
    ROUND(AVG(CASE WHEN b.churn = 'Yes' THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
    ROUND(SUM(b.monthly_charges), 2) AS total_mrr
FROM customers c
JOIN billing_info b ON c.customer_id = b.customer_id
GROUP BY b.payment_method
ORDER BY churn_rate_pct DESC;


-- ----------------------------------------------------------------------------
-- QUERY 4: Tenure Cohort Segmentation & Hazard Rate
-- PURPOSE: Group customers by tenure brackets (0-12m, 13-24m, 25-48m, 49-72m) to locate critical drop-off points.
-- BUSINESS MEANING: Pinpoints early tenure onboarding failure vs late-stage long-term churn.
-- ----------------------------------------------------------------------------
SELECT 
    CASE 
        WHEN c.tenure <= 12 THEN '01. 0 - 1 Year'
        WHEN c.tenure <= 24 THEN '02. 1 - 2 Years'
        WHEN c.tenure <= 48 THEN '03. 2 - 4 Years'
        ELSE '04. 4+ Years'
    END AS tenure_cohort,
    COUNT(c.customer_id) AS customer_count,
    SUM(CASE WHEN b.churn = 'Yes' THEN 1 ELSE 0 END) AS churn_count,
    ROUND(AVG(CASE WHEN b.churn = 'Yes' THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
    ROUND(AVG(b.monthly_charges), 2) AS avg_monthly_bill
FROM customers c
JOIN billing_info b ON c.customer_id = b.customer_id
GROUP BY tenure_cohort
ORDER BY tenure_cohort;


-- ----------------------------------------------------------------------------
-- QUERY 5: Internet Service Package Breakdown & Technical Support Add-ons
-- PURPOSE: Examine churn across Internet Service types (DSL vs Fiber Optic vs No Internet) and presence of Tech Support.
-- BUSINESS MEANING: Determines if specific internet technologies (Fiber Optic) experience customer dissatisfaction or pricing friction when Tech Support is absent.
-- ----------------------------------------------------------------------------
SELECT 
    s.internet_service,
    s.tech_support,
    COUNT(c.customer_id) AS customer_count,
    SUM(CASE WHEN b.churn = 'Yes' THEN 1 ELSE 0 END) AS churned_count,
    ROUND(AVG(CASE WHEN b.churn = 'Yes' THEN 1.0 ELSE 0.0 END) * 100, 2) AS churn_rate_pct,
    ROUND(AVG(b.monthly_charges), 2) AS avg_monthly_bill
FROM customers c
JOIN customer_services s ON c.customer_id = s.customer_id
JOIN billing_info b ON c.customer_id = b.customer_id
GROUP BY s.internet_service, s.tech_support
ORDER BY churn_rate_pct DESC;


-- ----------------------------------------------------------------------------
-- QUERY 6: Customer Lifetime Value (LTV) & Top At-Risk Revenue Customers
-- PURPOSE: Calculate historical LTV (Tenure * Monthly Charges) and rank top 10 highest-value active month-to-month customers.
-- BUSINESS MEANING: Generates high-priority targeted retention outreach lists for Customer Relationship Management (CRM).
-- ----------------------------------------------------------------------------
SELECT 
    c.customer_id,
    c.tenure,
    b.contract,
    b.payment_method,
    b.monthly_charges,
    ROUND(c.tenure * b.monthly_charges, 2) AS historical_ltv,
    b.churn
FROM customers c
JOIN billing_info b ON c.customer_id = b.customer_id
WHERE b.churn = 'No' AND b.contract = 'Month-to-month'
ORDER BY historical_ltv DESC
LIMIT 10;
