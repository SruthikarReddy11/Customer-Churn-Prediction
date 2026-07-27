/**
 * Customer Churn & LTV Dashboard Application Logic.
 * Manages Chart.js visual charts, global filter state, interactive CRM data table,
 * and live REST API integration with FastAPI backend.
 */

// Global State
const API_BASE_URL = "http://localhost:8000/api/v1";

// Dataset Baseline Metrics
const baseMetrics = {
    totalCustomers: 7043,
    churnedCustomers: 1869,
    churnRate: 26.54,
    totalMRR: 456116.60,
    atRiskMRR: 139130.85,
    avgLTV: 2280.50
};

// High-Value At-Risk Sample Dataset
const sampleCustomers = [
    { id: "7590-VHVEG", tenure: 1, contract: "Month-to-month", internet: "DSL", payment: "Electronic check", monthly: 29.85, ltv: 29.85, churn: "No", risk: 0.68 },
    { id: "9237-HQITU", tenure: 2, contract: "Month-to-month", internet: "Fiber optic", payment: "Electronic check", monthly: 70.70, ltv: 141.40, churn: "Yes", risk: 0.85 },
    { id: "9305-CDSKC", tenure: 8, contract: "Month-to-month", internet: "Fiber optic", payment: "Electronic check", monthly: 99.65, ltv: 797.20, churn: "Yes", risk: 0.82 },
    { id: "1452-KIOVK", tenure: 22, contract: "Month-to-month", internet: "Fiber optic", payment: "Credit card (automatic)", monthly: 89.10, ltv: 1960.20, churn: "No", risk: 0.44 },
    { id: "7892-POOKP", tenure: 28, contract: "Month-to-month", internet: "Fiber optic", payment: "Electronic check", monthly: 104.80, ltv: 2934.40, churn: "Yes", risk: 0.76 },
    { id: "6388-TABGU", tenure: 62, contract: "One year", internet: "DSL", payment: "Bank transfer (automatic)", monthly: 56.15, ltv: 3481.30, churn: "No", risk: 0.12 },
    { id: "9763-GRSKD", tenure: 13, contract: "Month-to-month", internet: "DSL", payment: "Mailed check", monthly: 49.95, ltv: 649.35, churn: "No", risk: 0.51 },
    { id: "4183-MYFRB", tenure: 16, contract: "Month-to-month", internet: "Fiber optic", payment: "Electronic check", monthly: 90.05, ltv: 1440.80, churn: "No", risk: 0.73 }
];

let charts = {};

// Initialization on DOM Load
document.addEventListener("DOMContentLoaded", () => {
    initCharts();
    populateTable(sampleCustomers);
    checkApiHealth();
});

// Check FastAPI Connection
async function checkApiHealth() {
    const statusText = document.getElementById("api-status-text");
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            const data = await response.json();
            statusText.innerText = `Connected (${data.version})`;
            statusText.style.color = "#10b981";
        } else {
            statusText.innerText = "Offline (Local Fallback)";
            statusText.style.color = "#f59e0b";
        }
    } catch (err) {
        statusText.innerText = "Offline (Local Fallback)";
        statusText.style.color = "#f59e0b";
    }
}

// Chart.js Setup
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
                data: [42.71, 11.27, 2.83],
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
                data: [45.29, 19.11, 16.71, 15.24],
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
                data: [47.68, 28.57, 18.20, 9.45],
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
                    data: [49.37, 27.81],
                    backgroundColor: "#ef4444",
                    borderRadius: 6
                },
                {
                    label: "With Tech Support",
                    data: [15.20, 10.45],
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

// Populate At-Risk Customer Data Table
function populateTable(data) {
    const tbody = document.getElementById("at-risk-table-body");
    tbody.innerHTML = "";

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

// Search Table
function searchTable() {
    const query = document.getElementById("table-search-input").value.toLowerCase();
    const filtered = sampleCustomers.filter(c => 
        c.id.toLowerCase().includes(query) || 
        c.contract.toLowerCase().includes(query) ||
        c.internet.toLowerCase().includes(query)
    );
    populateTable(filtered);
}

// Quick Load from Table to Form
function loadCustomerToCalc(id) {
    const cust = sampleCustomers.find(c => c.id === id);
    if (cust) {
        document.getElementById("input-customer-id").value = cust.id;
        document.getElementById("input-tenure").value = cust.tenure;
        document.getElementById("input-monthly-charges").value = cust.monthly;
        document.getElementById("input-contract").value = cust.contract;
        document.getElementById("input-internet").value = cust.internet;
        document.getElementById("input-payment").value = cust.payment;
        
        document.getElementById("calculator").scrollIntoView({ behavior: "smooth" });
    }
}

// Scroll Helper
function scrollToCalculator() {
    document.getElementById("calculator").scrollIntoView({ behavior: "smooth" });
}

// Apply Global Filters
function applyFilters() {
    const contract = document.getElementById("filter-contract").value;
    const payment = document.getElementById("filter-payment").value;
    const internet = document.getElementById("filter-internet").value;
    const risk = document.getElementById("filter-risk").value;

    let filteredList = [...sampleCustomers];

    if (contract !== "All") filteredList = filteredList.filter(c => c.contract === contract);
    if (payment !== "All") filteredList = filteredList.filter(c => c.payment === payment);
    if (internet !== "All") filteredList = filteredList.filter(c => c.internet === internet);
    if (risk !== "All") {
        if (risk === "High Risk") filteredList = filteredList.filter(c => c.risk >= 0.70);
        else if (risk === "Medium Risk") filteredList = filteredList.filter(c => c.risk >= 0.40 && c.risk < 0.70);
        else if (risk === "Low Risk") filteredList = filteredList.filter(c => c.risk < 0.40);
    }

    populateTable(filteredList);
}

function resetFilters() {
    document.getElementById("filter-contract").value = "All";
    document.getElementById("filter-payment").value = "All";
    document.getElementById("filter-internet").value = "All";
    document.getElementById("filter-risk").value = "All";
    populateTable(sampleCustomers);
}

// Form Submit Handler (Live REST API Call or Local ML Fallback)
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
        console.warn("API offline, utilizing local ML inference engine.");
    }

    // Local ML Simulation Engine Fallback
    runLocalInferenceFallback(payload);
}

// Render Results to UI
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

// Local Fallback Simulation
function runLocalInferenceFallback(p) {
    let prob = 0.20;

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
    if (p.Contract === "Month-to-month") drivers.push("Month-to-Month Contract (High Risk)");
    if (p.tenure <= 12) drivers.push("Early Tenure Lifecycle (<= 12 Months)");
    if (p.InternetService === "Fiber optic" && p.TechSupport === "No") drivers.push("Fiber Optic without Technical Support");

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
