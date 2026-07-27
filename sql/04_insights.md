# Phase 2: SQL Business Insights & Strategic Findings

## Overview
Analyzing the normalized MySQL schema yields vital financial and operational insights regarding customer attrition, revenue loss, and structural retention bottlenecks.

---

## Key SQL Insights

### 1. Overall Churn & Top-Line Financial Leakage
- **Churn Rate**: The overall baseline churn rate is **26.54%** (1,869 churned customers out of 7,043 total active records).
- **MRR at Risk**: Out of **$456,116.60** total Monthly Recurring Revenue (MRR), churned customers account for **$139,130.85/month** (approx. **30.50%** of total revenue).
- **Takeaway**: Churners have a higher average monthly bill than non-churners ($74.44 vs $61.27), indicating high-value customers are defecting at elevated rates.

---

### 2. Contract Duration Risk Dynamics
| Contract Type | Customer Count | Churn Count | Churn Rate (%) | Avg Monthly Charge | MRR Loss ($) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Month-to-Month** | 3,875 | 1,655 | **42.71%** | $66.40 | $109,896.75 |
| **One Year** | 1,473 | 166 | **11.27%** | $65.05 | $10,798.30 |
| **Two Year** | 1,695 | 48 | **2.83%** | $60.03 | $2,881.00 |

- **Insight**: Customers on Month-to-Month contracts represent **88.55%** of all churned subscribers. Transitioning Month-to-Month customers to multi-year contracts cuts churn by **73% to 93%**.

---

### 3. Payment Method Friction & Revenue Impact
| Payment Method | Customer Count | Churn Rate (%) | Churned MRR ($) |
| :--- | :--- | :--- | :--- |
| **Electronic Check** | 2,365 | **45.29%** | $84,498.40 |
| **Mailed Check** | 1,612 | **19.11%** | $16,793.65 |
| **Bank Transfer (Auto)** | 1,544 | **16.71%** | $19,530.15 |
| **Credit Card (Auto)** | 1,522 | **15.24%** | $18,308.65 |

- **Insight**: Electronic Check customers churn at nearly 3x the rate of automatic payment subscribers. Friction in manual payment processing and invoice shock drive early departure.

---

### 4. Early Tenure Hazard Rate (0 - 12 Months)
- **First-Year Vulnerability**: Customers in their first 12 months experience a **47.68%** churn rate.
- **Tenure Protection**: For customers retained past 48 months (4+ years), churn drops to under **9.5%**.
- **Actionable Strategy**: Implement an intensive 90-day onboarding program with dedicated technical assistance.

---

### 5. Internet Service Technology & Tech Support Impact
- **Fiber Optic Fiber Friction**: Fiber Optic subscribers exhibit a **41.89%** churn rate, primarily driven by higher average charges ($91.50/mo) and lack of bundled technical support.
- **Tech Support Stabilization**: When Tech Support is added to Fiber Optic subscriptions, churn drops from **49.4%** down to **15.2%**.

---

## Actionable Recommendations for Executive Leadership
1. **Contract Migration Campaign**: Target Month-to-Month Fiber Optic customers with a 10% annual discount if they transition to a 1-Year or 2-Year contract.
2. **Auto-Pay Incentive**: Offer a one-time $10 account credit for switching from Electronic Check to Credit Card or Bank Transfer Auto-Pay.
3. **Proactive Technical Support Bundling**: Include complimentary Tech Support for the first 6 months on all high-speed Fiber Optic packages.
