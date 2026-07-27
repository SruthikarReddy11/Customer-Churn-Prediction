# Phase 8: Power BI Business Intelligence Dashboard Blueprint

## Overview
This document provides the complete architecture, visualization layout guidelines, and step-by-step construction instructions for building an interactive **Customer Churn & LTV Executive Dashboard** in Power BI Desktop.

---

## Data Source & Connection
1. Open **Power BI Desktop**.
2. Select **Get Data** $\rightarrow$ **Text/CSV**.
3. Load `data_processed/cleaned_churn_data.csv` (or connect directly to the MySQL database `telco_churn_db`).
4. Ensure data types are formatted correctly:
   - `tenure`: Whole Number
   - `MonthlyCharges`: Fixed Decimal Number ($)
   - `TotalCharges`: Fixed Decimal Number ($)
   - `Churn`: Text ("Yes" / "No")

---

## Executive Dashboard Page Layouts

### Page 1: Executive Summary & Financial Overview
**Target Audience**: C-Suite & VP of Revenue

#### 1. Top KPI Summary Cards
- **Total Customers**: Count of Customer IDs (`[Total Customers]`)
- **Overall Churn Rate (%)**: Percentage of churned customers (`[Churn Rate %]`)
- **Total Monthly Recurring Revenue (MRR)**: Sum of `MonthlyCharges` (`[Total MRR]`)
- **At-Risk Monthly Revenue**: Sum of `MonthlyCharges` for churners (`[At Risk MRR]`)
- **Average Customer Lifetime (Months)**: Mean tenure (`[Avg Tenure Months]`)

#### 2. Visual Layout Blueprint
- **Visual 1 (Donut Chart)**: *Churn Distribution by Contract Type*
  - Legend: `Contract` (Month-to-month, One year, Two year)
  - Values: `[Churned Customers Count]`
- **Visual 2 (Stacked Bar Chart)**: *Churn Rate (%) by Payment Method*
  - Y-Axis: `PaymentMethod`
  - X-Axis: `[Churn Rate %]`
- **Visual 3 (Line Chart)**: *Hazard Curve - Churn Rate vs Tenure (Months)*
  - X-Axis: `tenure` (Grouped into 6-month bins)
  - Y-Axis: `[Churn Rate %]`
- **Visual 4 (Card / Table)**: *Top 10 High-Value At-Risk Customers*
  - Columns: `customerID`, `Contract`, `MonthlyCharges`, `tenure`, `Historical_LTV`
  - Filter: `Churn = "No"` & `Contract = "Month-to-month"`, Sorted by `Historical_LTV` DESC.

---

### Page 2: Service & Risk Driver Analysis
**Target Audience**: Customer Success & Operations Managers

#### 1. Service Breakdown Heatmap
- **Matrix Visual**:
  - Rows: `InternetService` (DSL, Fiber optic, No)
  - Columns: `TechSupport` (Yes, No, No internet service)
  - Values: `[Churn Rate %]` (Conditional formatting background color: Red gradient for high risk)

#### 2. Demographic & Pricing Risk Scatter
- **Scatter Plot**: *Monthly Charges vs Tenure by Churn*
  - X-Axis: `tenure`
  - Y-Axis: `MonthlyCharges`
  - Legend: `Churn`
  - Tooltips: `customerID`, `Contract`, `TotalCharges`

---

## Interactive Slicers & Filters
- **Contract Type**: Multi-select slicer (Month-to-month, One year, Two year)
- **Payment Method**: Multi-select dropdown
- **Internet Service**: Radio button slicer (DSL, Fiber Optic, None)
- **Senior Citizen Status**: Toggle (All, Non-Senior, Senior)
