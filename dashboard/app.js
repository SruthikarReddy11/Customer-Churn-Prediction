// Sales Performance Dashboard Logic

// Global Error Handler for Diagnostics
window.onerror = function(message, source, lineno, colno, error) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.innerHTML = `
            <div class="kpi-icon" style="color:var(--accent-danger); font-size: 2.5rem; display:flex; justify-content:center; align-items:center; width:60px; height:60px; border-radius:50%; background:rgba(239,68,68,0.1); margin: 0 auto 20px;"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <h3 style="margin-top: 15px; font-family:'Outfit'; font-size:1.4rem;">Application Error</h3>
            <p style="margin-top: 12px; color:var(--text-secondary); max-width:600px; text-align:center; line-height:1.6; font-size:0.9rem;">
                An uncaught exception occurred:<br>
                <code style="display:block; background:rgba(0,0,0,0.3); padding:10px; border-radius:6px; margin: 10px 0; text-align:left; color:#f43f5e; overflow-x:auto; font-family:monospace; word-break:break-all;">${message}<br>at ${source}:${lineno}:${colno}</code>
                Please send a screenshot or copy this error text to help resolve the issue.
            </p>
        `;
    }
    return false;
};

// Dashboard State
let allData = [];
let filteredData = [];
let tableFilteredData = [];
let chartTrends = null;
let chartRegions = null;
let chartSegments = null;
let chartCategories = null;
let chartProducts = null;

// Table Pagination State
let currentPage = 1;
const pageSize = 100;

function startApp() {
    // Safety check for dependencies
    if (typeof Papa === 'undefined' || typeof Chart === 'undefined') {
        const errorMsg = [];
        if (typeof Papa === 'undefined') errorMsg.push("PapaParse (papaparse.js)");
        if (typeof Chart === 'undefined') errorMsg.push("Chart.js (chart.js)");
        
        document.getElementById('loading-overlay').innerHTML = `
            <div class="kpi-icon" style="color:var(--accent-danger); font-size: 2.5rem; display:flex; justify-content:center; align-items:center; width:60px; height:60px; border-radius:50%; background:rgba(239,68,68,0.1); margin: 0 auto 20px;"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <h3 style="margin-top: 15px; font-family:'Outfit'; font-size:1.4rem;">Dependency Error</h3>
            <p style="margin-top: 12px; color:var(--text-secondary); max-width:600px; text-align:center; line-height:1.6; font-size:0.9rem;">
                Failed to load required library: <strong>${errorMsg.join(' and ')}</strong>.<br><br>
                Please perform a <strong>hard refresh</strong> (press <code>Ctrl + F5</code> or <code>Cmd + Shift + R</code>) to clear the browser cache and load the updated dashboard configuration.
            </p>
        `;
        return;
    }
    
    initTheme();
    loadData();
    setupEventListeners();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// Theme Management
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Re-render charts to update grid lines and font colors if needed
        updateChartsTheme();
    });
}

function updateChartsTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    
    const charts = [chartTrends, chartRegions, chartCategories, chartProducts];
    charts.forEach(chart => {
        if (chart) {
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.y.grid.color = gridColor;
            chart.options.scales.x.ticks.color = textColor;
            chart.options.scales.y.ticks.color = textColor;
            if (chart.options.scales.y1) {
                chart.options.scales.y1.grid.color = gridColor;
                chart.options.scales.y1.ticks.color = textColor;
            }
            chart.options.plugins.legend.labels.color = textColor;
            chart.update();
        }
    });
    
    if (chartSegments) {
        chartSegments.options.plugins.legend.labels.color = textColor;
        chartSegments.update();
    }
}

// Data Fetching and Loading
function loadData() {
    const csvPath = '../data/cleaned_sales.csv';
    
    Papa.parse(csvPath, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (results.errors.length > 0 && results.data.length === 0) {
                console.error("PapaParse errors:", results.errors);
                document.getElementById('loading-overlay').innerHTML = `
                    <div class="kpi-icon" style="color:var(--accent-danger); font-size: 2rem;"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <p style="margin-top: 10px;">Failed to load sales data. Make sure run_sql_analysis.py or sales_analysis.py has run successfully.</p>
                `;
                return;
            }
            
            // Format data rows
            allData = results.data.map(row => {
                const sales = parseFloat(row['Sales']) || 0.0;
                const profit = parseFloat(row['Profit']) || 0.0;
                const qty = parseInt(row['Quantity']) || 0;
                const disc = parseFloat(row['Discount']) || 0.0;
                
                // Calculate shipping delay
                let shippingDelay = 0;
                try {
                    const orderDate = new Date(row['Order Date']);
                    const shipDate = new Date(row['Ship Date']);
                    if (!isNaN(orderDate) && !isNaN(shipDate)) {
                        shippingDelay = Math.max(0, Math.round((shipDate - orderDate) / (1000 * 60 * 60 * 24)));
                    }
                } catch (e) {}

                return {
                    ...row,
                    'Sales': sales,
                    'Profit': profit,
                    'Quantity': qty,
                    'Discount': disc,
                    'Year': parseInt(row['Year']) || new Date(row['Order Date']).getFullYear() || 0,
                    'Month_Num': parseInt(row['Month_Num']) || 0,
                    'Profit Margin': parseFloat(row['Profit Margin']) || 0.0,
                    'Shipping Delay': shippingDelay
                };
            });
            
            // Populate Year filter dropdown
            populateYearFilter();
            
            // Initial filter (All data)
            applyFilters();
            
            // Hide loading overlay
            document.getElementById('loading-overlay').style.display = 'none';
        },
        error: function(err) {
            console.error("Error loading CSV:", err);
            document.getElementById('loading-overlay').innerHTML = `
                <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:var(--accent-danger)"></i>
                <p style="margin-top:10px;">Error loading CSV file: ${err.message}</p>
            `;
        }
    });
}

function populateYearFilter() {
    const yearSelect = document.getElementById('filter-year');
    const years = [...new Set(allData.map(row => row.Year))].sort((a, b) => b - a);
    
    years.forEach(year => {
        if (year) {
            const opt = document.createElement('option');
            opt.value = year;
            opt.textContent = year;
            yearSelect.appendChild(opt);
        }
    });
}

// Interactive Filters Setup
function setupEventListeners() {
    const filters = ['filter-year', 'filter-region', 'filter-segment', 'filter-category'];
    filters.forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            applyFilters();
        });
    });
    
    document.getElementById('reset-filters').addEventListener('click', () => {
        filters.forEach(id => {
            document.getElementById(id).value = 'all';
        });
        applyFilters();
    });
    
    document.getElementById('table-search').addEventListener('input', () => {
        applyTableSearch();
    });
    
    document.getElementById('btn-export').addEventListener('click', () => {
        exportFilteredCSV();
    });
}

// Filter and Process Data
function applyFilters() {
    const yearVal = document.getElementById('filter-year').value;
    const regionVal = document.getElementById('filter-region').value;
    const segmentVal = document.getElementById('filter-segment').value;
    const catVal = document.getElementById('filter-category').value;
    
    filteredData = allData.filter(row => {
        const yearMatch = yearVal === 'all' || row.Year.toString() === yearVal;
        const regionMatch = regionVal === 'all' || row.Region === regionVal;
        const segmentMatch = segmentVal === 'all' || row.Segment === segmentVal;
        const catMatch = catVal === 'all' || row.Category === catVal;
        
        return yearMatch && regionMatch && segmentMatch && catMatch;
    });
    
    // Update dashboard elements
    document.getElementById('record-count').textContent = filteredData.length.toLocaleString();
    updateKPIs();
    updateCharts();
    generateAIInsights();
    
    // Reset table explorer search and page
    document.getElementById('table-search').value = '';
    tableFilteredData = [...filteredData];
    currentPage = 1;
    updateTableExplorer();
}

// KPI Computations
function updateKPIs() {
    if (filteredData.length === 0) {
        setKPIValues(0, 0, 0, 0, 0, 0, 0, 0, 0, '-');
        return;
    }
    
    let totalSales = 0;
    let totalProfit = 0;
    let totalQty = 0;
    let totalDiscountSum = 0;
    let totalShippingDelaySum = 0;
    
    const ordersSet = new Set();
    const customersSet = new Set();
    const regionSales = {};
    
    filteredData.forEach(row => {
        totalSales += row.Sales;
        totalProfit += row.Profit;
        totalQty += row.Quantity;
        totalDiscountSum += row.Discount;
        totalShippingDelaySum += row['Shipping Delay'];
        
        ordersSet.add(row['Order ID']);
        customersSet.add(row['Customer ID']);
        
        regionSales[row.Region] = (regionSales[row.Region] || 0) + row.Sales;
    });
    
    const margin = totalSales !== 0 ? (totalProfit / totalSales) * 100 : 0;
    const aov = ordersSet.size > 0 ? totalSales / ordersSet.size : 0;
    const avgDiscount = totalDiscountSum / filteredData.length * 100;
    const avgDelay = totalShippingDelaySum / filteredData.length;
    
    // Find best region
    let bestRegion = '-';
    let maxRegionSales = -1;
    for (const [reg, sales] of Object.entries(regionSales)) {
        if (sales > maxRegionSales) {
            maxRegionSales = sales;
            bestRegion = reg;
        }
    }
    
    setKPIValues(
        totalSales, 
        totalProfit, 
        margin, 
        ordersSet.size, 
        customersSet.size, 
        aov, 
        totalQty, 
        avgDiscount, 
        avgDelay, 
        bestRegion
    );
}

function setKPIValues(sales, profit, margin, orders, customers, aov, qty, discount, delay, bestRegion) {
    document.getElementById('kpi-sales').textContent = formatCurrency(sales);
    document.getElementById('kpi-profit').textContent = formatCurrency(profit);
    document.getElementById('kpi-margin').textContent = `${margin.toFixed(2)}%`;
    document.getElementById('kpi-orders').textContent = orders.toLocaleString();
    document.getElementById('kpi-customers').textContent = customers.toLocaleString();
    document.getElementById('kpi-aov').textContent = formatCurrency(aov);
    document.getElementById('kpi-quantity').textContent = qty.toLocaleString();
    document.getElementById('kpi-discount').textContent = `${discount.toFixed(2)}%`;
    document.getElementById('kpi-delay').textContent = `${delay.toFixed(1)} days`;
    document.getElementById('kpi-best-region').textContent = bestRegion;
    
    // Visual indicators for negative margins
    const marginKPI = document.querySelector('.margin-kpi');
    if (margin < 0) {
        marginKPI.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        document.getElementById('kpi-margin').style.color = 'var(--accent-danger)';
    } else {
        marginKPI.style.borderColor = 'var(--border-color)';
        document.getElementById('kpi-margin').style.color = 'var(--text-primary)';
    }
}

// Chart Renderings
function updateCharts() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#475569';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    
    // Custom Tooltip Styling for Premium Look
    const customTooltipConfig = {
        enabled: true,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDark ? '#ffffff' : '#0f172a',
        bodyColor: isDark ? '#94a3b8' : '#475569',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        cornerRadius: 8,
        titleFont: { family: 'Outfit', size: 13, weight: '600' },
        bodyFont: { family: 'Inter', size: 12 }
    };

    // --- 1. Line Chart: Sales & Profit Trend over Time ---
    const monthlyData = {};
    filteredData.forEach(row => {
        const key = `${row.Year}-${row.Month_Num.toString().padStart(2, '0')}`;
        if (!monthlyData[key]) {
            monthlyData[key] = { key, year: row.Year, monthNum: row.Month_Num, month: row.Month, sales: 0, profit: 0 };
        }
        monthlyData[key].sales += row.Sales;
        monthlyData[key].profit += row.Profit;
    });
    
    const sortedMonths = Object.values(monthlyData).sort((a, b) => a.key.localeCompare(b.key));
    const finalMonths = document.getElementById('filter-year').value === 'all' 
        ? sortedMonths.slice(-36) 
        : sortedMonths;
        
    const labelsTrend = finalMonths.map(m => `${m.month.substring(0, 3)} '${m.year.toString().substring(2)}`);
    const salesTrend = finalMonths.map(m => Math.round(m.sales));
    const profitTrend = finalMonths.map(m => Math.round(m.profit));
    
    if (chartTrends) chartTrends.destroy();
    
    const canvasTrends = document.getElementById('chart-trends');
    const ctxTrends = canvasTrends.getContext('2d');
    
    // Create Line Gradients
    const salesGradFill = ctxTrends.createLinearGradient(0, 0, 0, 300);
    salesGradFill.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    salesGradFill.addColorStop(1, 'rgba(59, 130, 246, 0.00)');

    const profitGradFill = ctxTrends.createLinearGradient(0, 0, 0, 300);
    profitGradFill.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    profitGradFill.addColorStop(1, 'rgba(16, 185, 129, 0.00)');

    chartTrends = new Chart(ctxTrends, {
        type: 'line',
        data: {
            labels: labelsTrend,
            datasets: [
                {
                    label: 'Monthly Sales',
                    data: salesTrend,
                    borderColor: '#3b82f6',
                    backgroundColor: salesGradFill,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: isDark ? '#030712' : '#ffffff',
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Monthly Profit',
                    data: profitTrend,
                    borderColor: '#10b981',
                    backgroundColor: profitGradFill,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: isDark ? '#030712' : '#ffffff',
                    pointHoverRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { labels: { color: textColor, font: { family: 'Outfit', weight: '500' } } },
                tooltip: customTooltipConfig
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor,
                        font: { family: 'Inter' },
                        callback: value => '$' + formatCompactNumber(value)
                    },
                    title: { display: true, text: 'Sales ($)', color: textColor, font: { family: 'Outfit', weight: '600' } }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { 
                        color: textColor,
                        font: { family: 'Inter' },
                        callback: value => '$' + formatCompactNumber(value)
                    },
                    title: { display: true, text: 'Profit ($)', color: textColor, font: { family: 'Outfit', weight: '600' } }
                }
            }
        }
    });
    
    // --- 2. Bar Chart: Regional Sales vs Profit ---
    const regionalSummary = { 'West': { sales: 0, profit: 0 }, 'East': { sales: 0, profit: 0 }, 'Central': { sales: 0, profit: 0 }, 'South': { sales: 0, profit: 0 } };
    filteredData.forEach(row => {
        if (regionalSummary[row.Region]) {
            regionalSummary[row.Region].sales += row.Sales;
            regionalSummary[row.Region].profit += row.Profit;
        }
    });
    
    const regions = Object.keys(regionalSummary);
    const regionSalesData = regions.map(r => Math.round(regionalSummary[r].sales));
    const regionProfitData = regions.map(r => Math.round(regionalSummary[r].profit));
    
    if (chartRegions) chartRegions.destroy();
    
    const canvasRegions = document.getElementById('chart-regions');
    const ctxRegions = canvasRegions.getContext('2d');
    
    const regSalesGrad = ctxRegions.createLinearGradient(0, 0, 0, 300);
    regSalesGrad.addColorStop(0, '#3b82f6');
    regSalesGrad.addColorStop(1, '#a78bfa');

    const regProfitGrad = ctxRegions.createLinearGradient(0, 0, 0, 300);
    regProfitGrad.addColorStop(0, '#10b981');
    regProfitGrad.addColorStop(1, '#059669');

    chartRegions = new Chart(ctxRegions, {
        type: 'bar',
        data: {
            labels: regions,
            datasets: [
                {
                    label: 'Sales',
                    data: regionSalesData,
                    backgroundColor: regSalesGrad,
                    borderRadius: 8
                },
                {
                    label: 'Profit',
                    data: regionProfitData,
                    backgroundColor: regProfitGrad,
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor, font: { family: 'Outfit', weight: '500' } } },
                tooltip: customTooltipConfig
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Outfit', weight: '500' } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor, 
                        callback: value => '$' + formatCompactNumber(value)
                    }
                }
            }
        }
    });
    
    // --- 3. Doughnut Chart: Segment Sales ---
    const segmentSales = {};
    filteredData.forEach(row => {
        segmentSales[row.Segment] = (segmentSales[row.Segment] || 0) + row.Sales;
    });
    
    const segmentsList = Object.keys(segmentSales);
    const segmentValues = segmentsList.map(s => Math.round(segmentSales[s]));
    
    if (chartSegments) chartSegments.destroy();
    chartSegments = new Chart(document.getElementById('chart-segments').getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: segmentsList,
            datasets: [{
                data: segmentValues,
                backgroundColor: [
                    'rgba(167, 139, 250, 0.85)', // Consumer (Vibrant Purple)
                    'rgba(34, 211, 238, 0.85)',   // Corporate (Vibrant Cyan)
                    'rgba(251, 191, 36, 0.85)'    // Home Office (Vibrant Amber)
                ],
                borderColor: isDark ? '#0c1222' : '#ffffff',
                borderWidth: 3,
                hoverOffset: 12
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { color: textColor, font: { family: 'Outfit', weight: '500' }, padding: 18 } 
                },
                tooltip: customTooltipConfig
            },
            cutout: '70%'
        }
    });
    
    // --- 4. Bar Chart: Category Revenue ---
    const categorySummary = {};
    filteredData.forEach(row => {
        if (!categorySummary[row.Category]) {
            categorySummary[row.Category] = { sales: 0, profit: 0 };
        }
        categorySummary[row.Category].sales += row.Sales;
        categorySummary[row.Category].profit += row.Profit;
    });
    
    const categories = Object.keys(categorySummary);
    const catSalesData = categories.map(c => Math.round(categorySummary[c].sales));
    const catProfitData = categories.map(c => Math.round(categorySummary[c].profit));
    
    if (chartCategories) chartCategories.destroy();
    
    const canvasCategories = document.getElementById('chart-categories');
    const ctxCategories = canvasCategories.getContext('2d');
    
    const catSalesGrad = ctxCategories.createLinearGradient(0, 0, 0, 300);
    catSalesGrad.addColorStop(0, '#6366f1');
    catSalesGrad.addColorStop(1, '#a78bfa');

    const catProfitGrad = ctxCategories.createLinearGradient(0, 0, 0, 300);
    catProfitGrad.addColorStop(0, '#14b8a6');
    catProfitGrad.addColorStop(1, '#34d399');

    chartCategories = new Chart(ctxCategories, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Sales',
                    data: catSalesData,
                    backgroundColor: catSalesGrad,
                    borderRadius: 8
                },
                {
                    label: 'Profit',
                    data: catProfitData,
                    backgroundColor: catProfitGrad,
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: textColor, font: { family: 'Outfit', weight: '500' } } },
                tooltip: customTooltipConfig
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Outfit', weight: '500' } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor,
                        callback: value => '$' + formatCompactNumber(value)
                    }
                }
            }
        }
    });
    
    // --- 5. Horizontal Bar Chart: Top 10 Products by Sales ---
    const productSales = {};
    filteredData.forEach(row => {
        productSales[row['Product Name']] = (productSales[row['Product Name']] || 0) + row.Sales;
    });
    
    const top10Products = Object.entries(productSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
        
    const labelsProducts = top10Products.map(p => p[0].length > 40 ? p[0].substring(0, 38) + '...' : p[0]);
    const salesProducts = top10Products.map(p => Math.round(p[1]));
    
    if (chartProducts) chartProducts.destroy();
    
    const canvasProducts = document.getElementById('chart-products');
    const ctxProducts = canvasProducts.getContext('2d');
    
    const prodSalesGrad = ctxProducts.createLinearGradient(0, 0, 500, 0); // horizontal
    prodSalesGrad.addColorStop(0, '#a78bfa');
    prodSalesGrad.addColorStop(1, '#22d3ee');

    chartProducts = new Chart(ctxProducts, {
        type: 'bar',
        data: {
            labels: labelsProducts,
            datasets: [{
                label: 'Sales',
                data: salesProducts,
                backgroundColor: prodSalesGrad,
                borderRadius: 6,
                barThickness: 16
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: customTooltipConfig
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor,
                        callback: value => '$' + formatCompactNumber(value)
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'Inter', size: 10 } }
                }
            }
        }
    });
}

// Automated Narrative Insights Generator
function generateAIInsights() {
    const container = document.getElementById('ai-insights-content');
    if (filteredData.length === 0) {
        container.innerHTML = `<div class="insight-item info">No transactions found matching current filters.</div>`;
        return;
    }
    
    const insights = [];
    
    // 1. Calculate top categories by revenue and margin
    const catStats = {};
    let totalSales = 0;
    let totalProfit = 0;
    filteredData.forEach(row => {
        totalSales += row.Sales;
        totalProfit += row.Profit;
        if (!catStats[row.Category]) {
            catStats[row.Category] = { sales: 0, profit: 0 };
        }
        catStats[row.Category].sales += row.Sales;
        catStats[row.Category].profit += row.Profit;
    });
    
    // General Profit Margin Insight
    const overallMargin = (totalProfit / totalSales) * 100;
    if (overallMargin > 15) {
        insights.push({
            type: 'success',
            icon: 'fa-circle-check',
            text: `High net profitability: The business operates at a healthy <strong>${overallMargin.toFixed(1)}% profit margin</strong> under current parameters.`
        });
    } else if (overallMargin >= 5) {
        insights.push({
            type: 'info',
            icon: 'fa-circle-info',
            text: `Stable operations: Net profit margin stands at <strong>${overallMargin.toFixed(1)}%</strong>, indicating stable cash flows but moderate margins.`
        });
    } else {
        insights.push({
            type: 'danger',
            icon: 'fa-triangle-exclamation',
            text: `Margin pressure: Profit margin is suppressed at <strong>${overallMargin.toFixed(1)}%</strong>. High discount ratios or shipping overheads may be affecting profits.`
        });
    }
    
    // Category Margins
    let topCat = '';
    let topCatMargin = -100;
    let highestCatSalesName = '';
    let highestCatSalesVal = 0;
    
    for (const [cat, stats] of Object.entries(catStats)) {
        const margin = (stats.profit / stats.sales) * 100;
        if (margin > topCatMargin) {
            topCatMargin = margin;
            topCat = cat;
        }
        if (stats.sales > highestCatSalesVal) {
            highestCatSalesVal = stats.sales;
            highestCatSalesName = cat;
        }
    }
    
    insights.push({
        type: 'success',
        icon: 'fa-award',
        text: `Top performing category: <strong>${topCat}</strong> leads with a profit margin of <strong>${topCatMargin.toFixed(1)}%</strong>, whereas <strong>${highestCatSalesName}</strong> drives the most volume at <strong>${formatCurrency(highestCatSalesVal)}</strong>.`
    });
    
    // Regional performance
    const stateSales = {};
    const stateProfit = {};
    filteredData.forEach(row => {
        stateSales[row.State] = (stateSales[row.State] || 0) + row.Sales;
        stateProfit[row.State] = (stateProfit[row.State] || 0) + row.Profit;
    });
    
    const topState = Object.entries(stateSales).sort((a, b) => b[1] - a[1])[0];
    const worstStateProfit = Object.entries(stateProfit).sort((a, b) => a[1] - b[1])[0];
    
    if (topState) {
        insights.push({
            type: 'info',
            icon: 'fa-map-pin',
            text: `Geographic anchor: <strong>${topState[0]}</strong> is the primary revenue-driving state, generating <strong>${formatCurrency(topState[1])}</strong> in transactions.`
        });
    }
    
    if (worstStateProfit && worstStateProfit[1] < 0) {
        insights.push({
            type: 'danger',
            icon: 'fa-face-frown',
            text: `Geographic leak: Operations in <strong>${worstStateProfit[0]}</strong> are currently operating at a net loss of <strong>${formatCurrency(Math.abs(worstStateProfit[1]))}</strong>, requiring review.`
        });
    }
    
    // Shipping delay insight
    let totalDelay = 0;
    const shipModeCounts = {};
    filteredData.forEach(row => {
        totalDelay += row['Shipping Delay'];
        shipModeCounts[row['Ship Mode']] = (shipModeCounts[row['Ship Mode']] || 0) + 1;
    });
    const avgDelay = totalDelay / filteredData.length;
    const topShipMode = Object.entries(shipModeCounts).sort((a, b) => b[1] - a[1])[0];
    
    insights.push({
        type: 'info',
        icon: 'fa-truck',
        text: `Logistics footprint: Average delivery delay is <strong>${avgDelay.toFixed(1)} days</strong>, with <strong>${topShipMode ? topShipMode[0] : 'Standard Class'}</strong> being the most selected shipping method.`
    });
    
    // Populate in HTML
    container.innerHTML = insights.map(ins => `
        <div class="insight-item ${ins.type}">
            <i class="fa-solid ${ins.icon} insight-icon"></i>
            <div>${ins.text}</div>
        </div>
    `).join('');
}

// Data Table Explorer Logic
function applyTableSearch() {
    const q = document.getElementById('table-search').value.toLowerCase().trim();
    
    if (q === '') {
        tableFilteredData = [...filteredData];
    } else {
        tableFilteredData = filteredData.filter(row => {
            return (
                row['Order ID'].toLowerCase().includes(q) ||
                row['Customer Name'].toLowerCase().includes(q) ||
                row['Product Name'].toLowerCase().includes(q) ||
                row['Category'].toLowerCase().includes(q) ||
                row['Sub-Category'].toLowerCase().includes(q) ||
                row['Segment'].toLowerCase().includes(q) ||
                row['Region'].toLowerCase().includes(q) ||
                row['State'].toLowerCase().includes(q) ||
                row['City'].toLowerCase().includes(q)
            );
        });
    }
    
    currentPage = 1;
    updateTableExplorer();
}

function updateTableExplorer() {
    const tableBody = document.getElementById('table-body');
    const totalCount = tableFilteredData.length;
    
    if (totalCount === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center">No transactions match the search queries.</td>
            </tr>
        `;
        document.getElementById('page-start').textContent = '0';
        document.getElementById('page-end').textContent = '0';
        document.getElementById('total-filtered').textContent = '0';
        document.getElementById('pagination-buttons').innerHTML = '';
        return;
    }
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCount);
    const paginatedRows = tableFilteredData.slice(startIndex, endIndex);
    
    tableBody.innerHTML = paginatedRows.map(row => {
        const marginVal = parseFloat(row['Profit Margin']) || 0.0;
        const marginColor = marginVal < 0 ? 'var(--accent-danger)' : 'var(--accent-success)';
        
        // Map segment to badge styling
        const seg = row['Segment'];
        const segmentBadgeClass = seg === 'Consumer' ? 'badge-consumer' : seg === 'Corporate' ? 'badge-corporate' : 'badge-homeoffice';
        
        // Format profit color
        const profitVal = row['Profit'];
        const profitColor = profitVal < 0 ? 'var(--accent-danger)' : profitVal > 100 ? 'var(--accent-success)' : 'var(--text-secondary)';
        const profitWeight = profitVal < 0 || profitVal > 100 ? '600' : '400';

        return `
            <tr>
                <td>${row['Row ID']}</td>
                <td><strong style="color:var(--text-primary); font-size: 0.8rem;">${row['Order ID']}</strong></td>
                <td>${formatDate(row['Order Date'])}</td>
                <td>${row['Customer Name']}</td>
                <td><span class="badge ${segmentBadgeClass}">${seg}</span></td>
                <td>${row['Region']}</td>
                <td>${row['Category']}</td>
                <td title="${row['Product Name']}">${row['Product Name']}</td>
                <td>${formatCurrency(row['Sales'])}</td>
                <td style="color: ${profitColor}; font-weight: ${profitWeight};">${formatCurrency(profitVal)}</td>
                <td style="color: ${marginColor}; font-weight: 600;">${marginVal.toFixed(1)}%</td>
            </tr>
        `;
    }).join('');
    
    // Update labels
    document.getElementById('page-start').textContent = (startIndex + 1).toLocaleString();
    document.getElementById('page-end').textContent = endIndex.toLocaleString();
    document.getElementById('total-filtered').textContent = totalCount.toLocaleString();
    
    renderPaginationButtons(totalCount);
}

function renderPaginationButtons(totalCount) {
    const controls = document.getElementById('pagination-buttons');
    const totalPages = Math.ceil(totalCount / pageSize);
    
    let html = '';
    
    // Prev Button
    html += `
        <button class="page-btn page-btn-wide" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fa-solid fa-chevron-left"></i> Prev
        </button>
    `;
    
    // Limit visible page buttons around current page
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="page-btn" onclick="changePage(1)">1</button>`;
        if (startPage > 2) html += `<span style="padding:4px; color:var(--text-muted)">...</span>`;
    }
    
    for (let p = startPage; p <= endPage; p++) {
        html += `
            <button class="page-btn ${currentPage === p ? 'active' : ''}" onclick="changePage(${p})">
                ${p}
            </button>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span style="padding:4px; color:var(--text-muted)">...</span>`;
        html += `<button class="page-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next Button
    html += `
        <button class="page-btn page-btn-wide" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            Next <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;
    
    controls.innerHTML = html;
}

// Handle Page Changes Globally
window.changePage = function(page) {
    currentPage = page;
    updateTableExplorer();
    // Scroll table explorer header into view gently
    document.querySelector('.explorer-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Export to CSV Function
function exportFilteredCSV() {
    if (tableFilteredData.length === 0) return;
    
    // Prepare headers and contents (omit internal properties if any)
    const exportColumns = [
        'Row ID', 'Order ID', 'Order Date', 'Ship Date', 'Ship Mode', 
        'Customer ID', 'Customer Name', 'Segment', 'Country', 'City', 
        'State', 'Postal Code', 'Region', 'Product ID', 'Category', 
        'Sub-Category', 'Product Name', 'Sales', 'Quantity', 'Discount', 
        'Profit', 'Year', 'Month', 'Month_Num', 'Profit Margin'
    ];
    
    let csvContent = exportColumns.join(',') + '\n';
    
    tableFilteredData.forEach(row => {
        const line = exportColumns.map(col => {
            let val = row[col] !== undefined ? row[col] : '';
            // Quote string if it has commas
            if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                val = '"' + val.replace(/"/g, '""') + '"';
            }
            return val;
        });
        csvContent += line.join(',') + '\n';
    });
    
    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const yearFilter = document.getElementById('filter-year').value;
    const regionFilter = document.getElementById('filter-region').value;
    const filename = `sales_report_${yearFilter}_${regionFilter}.csv`.replace(/all/g, 'all_records');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility Helper Functions
function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatCompactNumber(value) {
    return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short'
    }).format(value);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch(e) {
        return dateStr;
    }
}
