-- ============================================================================
-- Phase 2: MySQL Database Schema Creation
-- Project: Customer Churn Prediction & Customer Lifetime Value (LTV) Engine
-- Description: DDL scripts for creating database tables, primary keys, 
-- foreign key relationships, and performance indexes.
-- ============================================================================

CREATE DATABASE IF NOT EXISTS telco_churn_db;
USE telco_churn_db;

-- Drop existing tables if re-running script
DROP TABLE IF EXISTS billing_info;
DROP TABLE IF EXISTS customer_services;
DROP TABLE IF EXISTS customers;

-- 1. Main Customers Table
CREATE TABLE customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    gender VARCHAR(10) NOT NULL,
    senior_citizen TINYINT NOT NULL CHECK (senior_citizen IN (0, 1)),
    partner VARCHAR(5) NOT NULL,
    dependents VARCHAR(5) NOT NULL,
    tenure INT NOT NULL CHECK (tenure >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customer Services Table
CREATE TABLE customer_services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    phone_service VARCHAR(5) NOT NULL,
    multiple_lines VARCHAR(25) NOT NULL,
    internet_service VARCHAR(25) NOT NULL,
    online_security VARCHAR(25) NOT NULL,
    online_backup VARCHAR(25) NOT NULL,
    device_protection VARCHAR(25) NOT NULL,
    tech_support VARCHAR(25) NOT NULL,
    streaming_tv VARCHAR(25) NOT NULL,
    streaming_movies VARCHAR(25) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- 3. Billing & Churn Information Table
CREATE TABLE billing_info (
    billing_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    contract VARCHAR(25) NOT NULL,
    paperless_billing VARCHAR(5) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    monthly_charges DECIMAL(10, 2) NOT NULL CHECK (monthly_charges >= 0),
    total_charges DECIMAL(10, 2) DEFAULT NULL,
    churn VARCHAR(5) NOT NULL,
    churn_numeric TINYINT GENERATED ALWAYS AS (IF(churn = 'Yes', 1, 0)) STORED,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Database Indexes for Query Optimization
CREATE INDEX idx_customer_tenure ON customers(tenure);
CREATE INDEX idx_billing_contract ON billing_info(contract);
CREATE INDEX idx_billing_payment ON billing_info(payment_method);
CREATE INDEX idx_billing_churn ON billing_info(churn_numeric);
CREATE INDEX idx_services_internet ON customer_services(internet_service);
