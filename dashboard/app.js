/**
 * Customer Churn & LTV Dashboard Application Logic.
 * Features: Dynamic multi-filtering, reactive KPI cards, Chart.js updates,
 * searchable CRM table, and live REST API integration with FastAPI backend.
 */

const API_BASE_URL = "http://localhost:8000/api/v1";

// Active dataset reference (uses fullCustomerDataset from dataset.js or sample fallback)
let currentDataset = (typeof fullCustomerDataset !== "undefined") ? fullCustomerDataset : [];
let currentFilteredData = [...currentDataset];
let charts = {};

// DOM Initialization
document.addEventListener("DOMContentLoaded", () => {
    initCharts();
    applyFilters();
    checkApiHealth();
});

// Check FastAPI Health
async function checkApiHealth() {
    const statusText = document.getElementById("api-status-text");
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            statusText.innerText = `Connected (${data.version})`;
            statusText.style.color = "#10b981";
        } else {
            statusText.innerText = "Offline (Local Engine)";
            statusText.style.color = "#f59e0b";
        }
    } catch (err) {
        statusText.innerText = "Offline (Local Engine)";
        statusText.style.color = "#f59e0b";
    }
}

// Chart.js Initialization
function initCharts() {
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.color = "#9ca3af";

    // 1. Contract Churn Rate Donut Chart
    const ctx1 = document.getElementById("chartContractChurn").getContext("2d");
    charts.contract = new Chart(ctx1, {
        type: "doughnut",
        data: {
            labels: ["Month-to-month", "One year", "Two year"],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ["#ef4444", "#f59e0b", "#10b981"],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { boxWidth: 12, padding: 16 } },
                tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.raw}% Churn Rate` } }
            },
            cutout: "70%"
        }
    });

    // 2. Payment Method Friction Horizontal Bar Chart
    const ctx2 = document.getElementById("chartPaymentFriction").getContext("2d");
    charts.payment = new Chart(ctx2, {
        type: "bar",
        data: {
            labels: ["Electronic check", "Mailed check", "Bank transfer", "Credit card"],
            datasets: [{
                label: "Churn Rate (%)",
                data: [0, 0, 0, 0],
                backgroundColor: ["#ef4444", "#f59e0b", "#6366f1", "#10b981"],
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { callback: (v) => v + "%" } },
                y: { grid: { display: false } }
            }
        }
    });

    // 3. Tenure Lifecycle Hazard Curve (Area Chart)
    const ctx3 = document.getElementById("chartTenureHazard").getContext("2d");
    charts.tenure = new Chart(ctx3, {
        type: "line",
        data: {
            labels: ["0-1 Year", "1-2 Years", "2-4 Years", "4+ Years"],
            datasets: [{
                label: "Churn Rate (%)",
                data: [0, 0, 0, 0],
                borderColor: "#6366f1",
                backgroundColor: "rgba(99, 102, 241, 0.2)",
                fill: true,
                tension: 0.4,
                pointBackgroundColor: "#8b5cf6",
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { callback: (v) => v + "%" } }
            }
        }
    });

    // 4. Internet Technology vs Tech Support Grouped Bar Chart
    const ctx4 = document.getElementById("chartTechSupportRisk").getContext("2d");
    charts.techSupport = new Chart(ctx4, {
        type: "bar",
        data: {
            labels: ["Fiber Optic", "DSL"],
            datasets: [
                {
                    label: "No Tech Support",
                    data: [0, 0],
                    backgroundColor: "#ef4444",
                    borderRadius: 6
                },
                {
                    label: "With Tech Support",
                    data: [0, 0],
                    backgroundColor: "#10b981",
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom", labels: { boxWidth: 12 } } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { callback: (v) => v + "%" } }
            }
        }
    });
}

// Global Filter Handler
function applyFilters() {
    const contract = document.getElementById("filter-contract").value;
    const payment = document.getElementById("filter-payment").value;
    const internet = document.getElementById("filter-internet").value;
    const risk = document.getElementById("filter-risk").value;

    let filtered = [...currentDataset];

    if (contract !== "All") filtered = filtered.filter(c => c.contract === contract);
    if (payment !== "All") {
        if (payment.includes("Bank")) filtered = filtered.filter(c => c.payment.toLowerCase().includes("bank"));
        else if (payment.includes("Credit")) filtered = filtered.filter(c => c.payment.toLowerCase().includes("credit"));
        else filtered = filtered.filter(c => c.payment === payment);
    }
    if (internet !== "All") filtered = filtered.filter(c => c.internet === internet);
    if (risk !== "All") {
        if (risk === "High Risk") filtered = filtered.filter(c => c.risk >= 0.70);
        else if (risk === "Medium Risk") filtered = filtered.filter(c => c.risk >= 0.40 && c.risk < 0.70);
        else if (risk === "Low Risk") filtered = filtered.filter(c => c.risk < 0.40);
    }

    currentFilteredData = filtered;

    // Update UI Components
    updateKpiCards(filtered);
    updateCharts(filtered);
    populateTable(filtered.slice(0, 25));
}

// Reset Filters
function resetFilters() {
    document.getElementById("filter-contract").value = "All";
    document.getElementById("filter-payment").value = "All";
    document.getElementById("filter-internet").value = "All";
    document.getElementById("filter-risk").value = "All";
    applyFilters();
}

// Update KPI Cards
function updateKpiCards(data) {
    const total = data.length;
    const churned = data.filter(c => c.churn === "Yes").length;
    const churnRate = total > 0 ? ((churned / total) * 100).toFixed(2) : "0.00";
    
    const totalMRR = data.reduce((acc, c) => acc + c.monthly, 0);
    const atRiskMRR = data.filter(c => c.churn === "Yes").reduce((acc, c) => acc + c.monthly, 0);
    const avgLTV = total > 0 ? (data.reduce((acc, c) => acc + c.ltv, 0) / total).toFixed(0) : "0";

    document.getElementById("kpi-total-customers").innerText = total.toLocaleString();
    document.getElementById("kpi-churn-rate").innerText = `${churnRate}%`;
    document.getElementById("kpi-total-mrr").innerText = totalMRR >= 1000 ? `$${(totalMRR / 1000).toFixed(1)}K` : `$${totalMRR.toFixed(0)}`;
    document.getElementById("kpi-at-risk-mrr").innerText = atRiskMRR >= 1000 ? `$${(atRiskMRR / 1000).toFixed(1)}K` : `$${atRiskMRR.toFixed(0)}`;
    document.getElementById("kpi-avg-ltv").innerText = `$${Number(avgLTV).toLocaleString()}`;
}

// Update Chart.js Datasets Dynamically
function updateCharts(data) {
    const calcRate = (subset) => {
        if (!subset || subset.length === 0) return 0;
        const churned = subset.filter(c => c.churn === "Yes").length;
        return Number(((churned / subset.length) * 100).toFixed(1));
    };

    // 1. Contract Churn
    const m2mRate = calcRate(data.filter(c => c.contract === "Month-to-month"));
    const yr1Rate = calcRate(data.filter(c => c.contract === "One year"));
    const yr2Rate = calcRate(data.filter(c => c.contract === "Two year"));
    if (charts.contract) {
        charts.contract.data.datasets[0].data = [m2mRate, yr1Rate, yr2Rate];
        charts.contract.update();
    }

    // 2. Payment Method Churn
    const echeckRate = calcRate(data.filter(c => c.payment === "Electronic check"));
    const mcheckRate = calcRate(data.filter(c => c.payment === "Mailed check"));
    const bankRate = calcRate(data.filter(c => c.payment.toLowerCase().includes("bank")));
    const cardRate = calcRate(data.filter(c => c.payment.toLowerCase().includes("credit")));
    if (charts.payment) {
        charts.payment.data.datasets[0].data = [echeckRate, mcheckRate, bankRate, cardRate];
        charts.payment.update();
    }

    // 3. Tenure Hazard Rate
    const t1 = calcRate(data.filter(c => c.tenure <= 12));
    const t2 = calcRate(data.filter(c => c.tenure > 12 && c.tenure <= 24));
    const t3 = calcRate(data.filter(c => c.tenure > 24 && c.tenure <= 48));
    const t4 = calcRate(data.filter(c => c.tenure > 48));
    if (charts.tenure) {
        charts.tenure.data.datasets[0].data = [t1, t2, t3, t4];
        charts.tenure.update();
    }

    // 4. Tech Support & Internet Technology
    const foNoTech = calcRate(data.filter(c => c.internet === "Fiber optic" && (c.techSupport === "No")));
    const foWithTech = calcRate(data.filter(c => c.internet === "Fiber optic" && (c.techSupport === "Yes")));
    const dslNoTech = calcRate(data.filter(c => c.internet === "DSL" && (c.techSupport === "No")));
    const dslWithTech = calcRate(data.filter(c => c.internet === "DSL" && (c.techSupport === "Yes")));
    if (charts.techSupport) {
        charts.techSupport.data.datasets[0].data = [foNoTech, dslNoTech];
        charts.techSupport.data.datasets[1].data = [foWithTech, dslWithTech];
        charts.techSupport.update();
    }
}

// Populate At-Risk Customer Data Table
function populateTable(data) {
    const tbody = document.getElementById("at-risk-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px; color:#9ca3af;">No matching customers found. Try relaxing your filter selection.</td></tr>`;
        return;
    }

    data.forEach(item => {
        const tr = document.createElement("tr");
        
        let riskBadge = `<span class="badge badge-success">Low</span>`;
        if (item.risk >= 0.70) riskBadge = `<span class="badge badge-danger">High Risk</span>`;
        else if (item.risk >= 0.40) riskBadge = `<span class="badge badge-warning">Medium Risk</span>`;

        tr.innerHTML = `
            <td><strong>${item.id}</strong></td>
            <td>${item.tenure} m</td>
            <td>${item.contract}</td>
            <td>${item.internet}</td>
            <td>${item.payment}</td>
            <td>$${item.monthly.toFixed(2)}</td>
            <td>$${item.ltv.toFixed(2)}</td>
            <td><span class="badge ${item.churn === 'Yes' ? 'badge-danger' : 'badge-primary'}">${item.churn}</span></td>
            <td>${riskBadge}</td>
            <td>
                <button class="btn btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="loadCustomerToCalc('${item.id}')">
                    <i class="fa-solid fa-play"></i> Score
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Search Table Handler
function searchTable() {
    const query = document.getElementById("table-search-input").value.toLowerCase();
    const searched = currentFilteredData.filter(c => 
        c.id.toLowerCase().includes(query) || 
        c.contract.toLowerCase().includes(query) ||
        c.internet.toLowerCase().includes(query) ||
        c.payment.toLowerCase().includes(query)
    );
    populateTable(searched.slice(0, 25));
}

// Load Customer to Form
function loadCustomerToCalc(id) {
    const cust = currentDataset.find(c => c.id === id);
    if (cust) {
        document.getElementById("input-customer-id").value = cust.id;
        document.getElementById("input-tenure").value = cust.tenure;
        document.getElementById("input-monthly-charges").value = cust.monthly;
        document.getElementById("input-contract").value = cust.contract;
        document.getElementById("input-internet").value = cust.internet;
        document.getElementById("input-payment").value = cust.payment;
        document.getElementById("input-tech-support").value = cust.techSupport === "Yes" ? "Yes" : "No";
        
        scrollToCalculator();
    }
}

function scrollToCalculator() {
    document.getElementById("calculator").scrollIntoView({ behavior: "smooth" });
}

// Form Submit Handler for API / Local Scoring
async function handleFormSubmit(e) {
    e.preventDefault();

    const payload = {
        customer_id: document.getElementById("input-customer-id").value,
        tenure: parseInt(document.getElementById("input-tenure").value),
        MonthlyCharges: parseFloat(document.getElementById("input-monthly-charges").value),
        TotalCharges: parseFloat(document.getElementById("input-monthly-charges").value) * parseInt(document.getElementById("input-tenure").value),
        Contract: document.getElementById("input-contract").value,
        InternetService: document.getElementById("input-internet").value,
        TechSupport: document.getElementById("input-tech-support").value,
        PaymentMethod: document.getElementById("input-payment").value,
        PaperlessBilling: document.getElementById("input-paperless").value,
        gender: "Female",
        SeniorCitizen: 0,
        Partner: "No",
        Dependents: "No",
        PhoneService: "Yes",
        MultipleLines: "No",
        OnlineSecurity: "No",
        OnlineBackup: "No",
        DeviceProtection: "No",
        StreamingTV: "No",
        StreamingMovies: "No"
    };

    try {
        const churnRes = await fetch(`${API_BASE_URL}/predict-churn`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const ltvRes = await fetch(`${API_BASE_URL}/predict-ltv`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (churnRes.ok && ltvRes.ok) {
            const churnData = await churnRes.json();
            const ltvData = await ltvRes.json();
            renderResults(churnData, ltvData);
            return;
        }
    } catch (err) {
        console.warn("FastAPI service offline, falling back to local JS inference engine.");
    }

    runLocalInferenceFallback(payload);
}

function renderResults(churnData, ltvData) {
    const probPct = (churnData.churn_probability * 100).toFixed(1) + "%";
    document.getElementById("res-prob-pct").innerText = probPct;

    const riskBadge = document.getElementById("res-risk-badge");
    riskBadge.innerText = churnData.risk_tier;
    riskBadge.className = `risk-badge ${churnData.risk_tier.toLowerCase().replace(" ", "-")}`;

    document.getElementById("res-historical-ltv").innerText = `$${ltvData.baseline_historical_ltv.toFixed(2)}`;
    document.getElementById("res-predicted-ltv").innerText = `$${ltvData.predicted_lifetime_value.toFixed(2)}`;
    document.getElementById("res-remaining-months").innerText = `${ltvData.expected_remaining_months} Months`;

    const driversList = document.getElementById("res-drivers-list");
    driversList.innerHTML = "";
    churnData.top_risk_drivers.forEach(d => {
        const li = document.createElement("li");
        li.innerText = d;
        driversList.appendChild(li);
    });

    document.getElementById("res-recommendation-text").innerText = churnData.retention_recommendation;
}

function runLocalInferenceFallback(p) {
    let prob = 0.15;

    if (p.Contract === "Month-to-month") prob += 0.35;
    if (p.tenure <= 12) prob += 0.20;
    if (p.InternetService === "Fiber optic" && p.TechSupport === "No") prob += 0.15;
    if (p.PaymentMethod === "Electronic check") prob += 0.10;

    prob = Math.min(0.95, prob);

    let riskTier = "Low Risk";
    if (prob >= 0.70) riskTier = "High Risk";
    else if (prob >= 0.40) riskTier = "Medium Risk";

    const baselineLtv = p.MonthlyCharges * p.tenure;
    const remainingMonths = Math.round(Math.min(36, 1.0 / (prob + 0.05)));
    const predLtv = p.MonthlyCharges * (p.tenure + remainingMonths);

    const drivers = [];
    if (p.Contract === "Month-to-month") drivers.push("Month-to-Month Contract Status (High Vulnerability)");
    if (p.tenure <= 12) drivers.push("Early Lifecycle Tenure (<= 12 Months)");
    if (p.InternetService === "Fiber optic" && p.TechSupport === "No") drivers.push("Fiber Optic without Technical Support Add-on");

    let rec = "No immediate intervention required.";
    if (riskTier === "High Risk") rec = "Offer 15% discount for 1-Year Contract switch + Free Tech Support.";
    else if (riskTier === "Medium Risk") rec = "Send targeted email campaign promoting Auto-Pay and streaming add-ons.";

    renderResults({
        churn_probability: prob,
        risk_tier: riskTier,
        top_risk_drivers: drivers.length > 0 ? drivers : ["Standard Baseline Profile"],
        retention_recommendation: rec
    }, {
        baseline_historical_ltv: baselineLtv,
        predicted_lifetime_value: predLtv,
        expected_remaining_months: remainingMonths
    });
}
