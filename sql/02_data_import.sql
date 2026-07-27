-- ============================================================================
-- Phase 2: SQL Data Import & Data Staging Script
-- Project: Customer Churn Prediction & Customer Lifetime Value (LTV) Engine
-- Description: MySQL commands to import CSV raw data into relational tables.
-- ============================================================================

USE telco_churn_db;

-- 1. Create Staging Table for Raw File Import
DROP TABLE IF EXISTS raw_telco_churn;

CREATE TABLE raw_telco_churn (
    customerID VARCHAR(50),
    gender VARCHAR(10),
    SeniorCitizen INT,
    Partner VARCHAR(5),
    Dependents VARCHAR(5),
    tenure INT,
    PhoneService VARCHAR(5),
    MultipleLines VARCHAR(25),
    InternetService VARCHAR(25),
    OnlineSecurity VARCHAR(25),
    OnlineBackup VARCHAR(25),
    DeviceProtection VARCHAR(25),
    TechSupport VARCHAR(25),
    StreamingTV VARCHAR(25),
    StreamingMovies VARCHAR(25),
    Contract VARCHAR(25),
    PaperlessBilling VARCHAR(5),
    PaymentMethod VARCHAR(50),
    MonthlyCharges DECIMAL(10, 2),
    TotalCharges VARCHAR(50), -- Read as string to handle empty ' ' values cleanly
    Churn VARCHAR(5)
);

-- 2. Load Raw CSV File (Adjust file path for local environment)
-- Note: LOCAL INFILE requires system privilege local_infile=1
LOAD DATA LOCAL INFILE '../data_raw/WA_Fn-UseC_-Telco-Customer-Churn.csv'
INTO TABLE raw_telco_churn
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS;

-- 3. Populate Normalized Relational Tables

-- Customers Table
INSERT INTO customers (customer_id, gender, senior_citizen, partner, dependents, tenure)
SELECT customerID, gender, SeniorCitizen, Partner, Dependents, tenure
FROM raw_telco_churn;

-- Customer Services Table
INSERT INTO customer_services (customer_id, phone_service, multiple_lines, internet_service, 
                                online_security, online_backup, device_protection, 
                                tech_support, streaming_tv, streaming_movies)
SELECT customerID, PhoneService, MultipleLines, InternetService, 
       OnlineSecurity, OnlineBackup, DeviceProtection, 
       TechSupport, StreamingTV, StreamingMovies
FROM raw_telco_churn;

-- Billing Info Table (Converting whitespace TotalCharges to NULL)
INSERT INTO billing_info (customer_id, contract, paperless_billing, payment_method, monthly_charges, total_charges, churn)
SELECT 
    customerID, 
    Contract, 
    PaperlessBilling, 
    PaymentMethod, 
    MonthlyCharges, 
    CASE WHEN TRIM(TotalCharges) = '' THEN NULL ELSE CAST(TotalCharges AS DECIMAL(10,2)) END,
    Churn
FROM raw_telco_churn;

-- 4. Verification Check
SELECT 
    (SELECT COUNT(*) FROM customers) AS total_customers,
    (SELECT COUNT(*) FROM customer_services) AS total_services,
    (SELECT COUNT(*) FROM billing_info) AS total_billing_records;
