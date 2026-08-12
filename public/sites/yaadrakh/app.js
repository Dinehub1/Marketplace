/**
 * YaadRakh - Smart Personal Finance & Expense Tracker
 * Main application JavaScript
 * 
 * Features:
 * - Transaction CRUD (add, filter, search, delete)
 * - Budget management with progress tracking
 * - Financial goals with progress visualization
 * - Dashboard charts (category breakdown, weekly trend)
 * - Dark mode toggle
 * - Responsive navigation
 * - Toast notifications
 * - Local storage persistence
 */

// ========== DATA STORE ==========
const STORAGE_KEY = 'yaadrakh_data';

// Default data
const defaultData = {
    transactions: [
        { id: 1, description: 'Salary Credit', amount: 85000, category: 'others', type: 'income', date: '2026-06-01' },
        { id: 2, description: 'Grocery Shopping', amount: 3500, category: 'food', type: 'expense', date: '2026-06-03' },
        { id: 3, description: 'Uber Ride', amount: 450, category: 'transport', type: 'expense', date: '2026-06-04' },
        { id: 4, description: 'Electricity Bill', amount: 2800, category: 'bills', type: 'expense', date: '2026-06-05' },
        { id: 5, description: 'Amazon Purchase', amount: 5200, category: 'shopping', type: 'expense', date: '2026-06-07' },
        { id: 6, description: 'Movie Tickets', amount: 800, category: 'entertainment', type: 'expense', date: '2026-06-08' },
        { id: 7, description: 'Pharmacy', amount: 1200, category: 'health', type: 'expense', date: '2026-06-10' },
        { id: 8, description: 'Online Course', amount: 4500, category: 'education', type: 'expense', date: '2026-06-12' },
        { id: 9, description: 'Restaurant Dinner', amount: 2200, category: 'food', type: 'expense', date: '2026-06-14' },
        { id: 10, description: 'Freelance Project', amount: 15000, category: 'others', type: 'income', date: '2026-06-15' },
        { id: 11, description: 'Petrol', amount: 1800, category: 'transport', type: 'expense', date: '2026-06-16' },
        { id: 12, description: 'Mobile Recharge', amount: 599, category: 'bills', type: 'expense', date: '2026-06-17' },
    ],
    budgets: [
        { category: 'food', amount: 8000 },
        { category: 'transport', amount: 4000 },
        { category: 'shopping', amount: 6000 },
        { category: 'bills', amount: 5000 },
        { category: 'entertainment', amount: 3000 },
        { category: 'health', amount: 3000 },
        { category: 'education', amount: 5000 },
        { category: 'others', amount: 4000 },
    ],
    goals: [
        { id: 1, name: 'Emergency Fund', target: 300000, current: 125000, deadline: '2026-12-31' },
        { id: 2, name: 'Vacation Trip', target: 80000, current: 35000, deadline: '2026-09-30' },
        { id: 3, name: 'New Laptop', target: 65000, current: 42000, deadline: '2026-08-15' },
    ]
};

// Load data from localStorage or use defaults
function loadData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Failed to load from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(defaultData));
}

function saveData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Failed to save to localStorage:', e);
    }
}

let appData = loadData();

// ========== CATEGORY CONFIG ==========
const categories = {
    food: { name: 'Food & Dining', icon: 'fa-utensils', color: 'var(--cat-food)' },
    transport: { name: 'Transport', icon: 'fa-car', color: 'var(--cat-transport)' },
    shopping: { name: 'Shopping', icon: 'fa-bag-shopping', color: 'var(--cat-shopping)' },
    bills: { name: 'Bills & Utilities', icon: 'fa-file-invoice', color: 'var(--cat-bills)' },
    entertainment: { name: 'Entertainment', icon: 'fa-film', color: 'var(--cat-entertainment)' },
    health: { name: 'Health', icon: 'fa-heart-pulse', color: 'var(--cat-health)' },
    education: { name: 'Education', icon: 'fa-graduation-cap', color: 'var(--cat-education)' },
    others: { name: 'Others', icon: 'fa-box', color: 'var(--cat-others)' }
};

// Shared category color map (hex values for canvas/CSS-in-JS usage)
const CATEGORY_COLOR_MAP = {
    food: '#f97316', transport: '#3b82f6', shopping: '#ec4899',
    bills: '#8b5cf6', entertainment: '#06b6d4', health: '#10b981',
    education: '#f59e0b', others: '#6b7280'
};

// ========== UTILITY FUNCTIONS ==========
function formatCurrency(amount) {
    return '&#8377;' + amount.toLocaleString('en-IN');
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getCategorySpent(category) {
    return appData.transactions
        .filter(t => t.type === 'expense' && t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);
}

function getTotalIncome() {
    return appData.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
}

function getTotalExpenses() {
    return appData.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info}" aria-hidden="true"></i>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== NAVIGATION ==========
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('active');
    });
    
    // Close menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });
    
    // Active link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}

// ========== DARK MODE ==========
function initDarkMode() {
    const toggle = document.getElementById('darkToggle');
    const icon = toggle ? toggle.querySelector('i') : null;
    
    // Check saved preference or system preference
    const isDark = localStorage.getItem('yaadrakh_dark') === 'true' || 
                   (!localStorage.getItem('yaadrakh_dark') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
        document.body.classList.add('dark');
        if (icon) icon.className = 'fas fa-sun';
    }
    
    toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        const nowDark = document.body.classList.contains('dark');
        if (icon) icon.className = nowDark ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('yaadrakh_dark', nowDark);
    });
}

// ========== DASHBOARD ==========
function updateDashboard() {
    const income = getTotalIncome();
    const expenses = getTotalExpenses();
    const savings = income - expenses;
    
    document.getElementById('monthlyIncome').innerHTML = formatCurrency(income);
    document.getElementById('monthlyExpense').innerHTML = formatCurrency(expenses);
    document.getElementById('totalSavings').innerHTML = formatCurrency(savings);
    // Net balance = income - expenses (reflects actual tracked cash flow)
    // No hardcoded legacy balance — all data comes from transactions
    document.getElementById('netBalance').innerHTML = formatCurrency(savings);
    
    // Update category legend and donut chart
    updateCategoryLegend();
    updateDonutChart();

    // Update budget health card
    updateBudgetHealthCard();
    
    // Update weekly chart
    updateWeeklyChart();
}

function updateCategoryLegend() {
    const legend = document.getElementById('categoryLegend');
    legend.innerHTML = '';

    // Use shared color map
    Object.keys(categories).forEach(key => {
        const spent = getCategorySpent(key);
        if (spent > 0) {
            const item = document.createElement('div');
            item.className = 'legend-item';
            const color = CATEGORY_COLOR_MAP[key] || '#6b7280';
            item.innerHTML = `
                <span class="legend-color" style="background: ${color}"></span>
                <span>${categories[key].name}: ${formatCurrency(spent)}</span>
            `;
            legend.appendChild(item);
        }
    });
}

/**
 * Dynamic donut chart rendered on canvas.
 * Builds a conic-gradient from real expense data and draws it with a center hole.
 */
function updateDonutChart() {
    const canvas = document.getElementById('donutCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Set actual size in memory (scaled for retina)
    canvas.width = 180 * dpr;
    canvas.height = 180 * dpr;
    ctx.scale(dpr, dpr);

    // Use shared CATEGORY_COLOR_MAP for segment colors

    // Gather expense data per category
    const catTotals = {};
    let totalSpent = 0;
    appData.transactions.forEach(t => {
        if (t.type === 'expense') {
            catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
            totalSpent += t.amount;
        }
    });

    const cx = 90, cy = 90, outerR = 80, innerR = 50;

    ctx.clearRect(0, 0, 180, 180);

    if (totalSpent === 0) {
        // No data — draw empty grey ring
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
        ctx.fillStyle = '#e5e7eb';
        ctx.fill();
    } else {
        // Draw each segment
        let startAngle = -Math.PI / 2; // Start at top
        Object.keys(categories).forEach(key => {
            const amount = catTotals[key] || 0;
            if (amount === 0) return;
            const sliceAngle = (amount / totalSpent) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;

            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, endAngle);
            ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = CATEGORY_COLOR_MAP[key] || '#6b7280';
            ctx.fill();

            // Add subtle gap between segments
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, startAngle + 0.02);
            ctx.arc(cx, cy, innerR, startAngle + 0.02, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-card').trim() || '#fff';
            ctx.fill();

            startAngle = endAngle;
        });
    }

    // Center hole (already cut out by arc, but draw text)
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-gray-900').trim() || '#111827';
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatCurrency(totalSpent), cx, cy - 8);

    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-gray-500').trim() || '#6b7280';
    ctx.font = '10px "Segoe UI", system-ui, sans-serif';
    ctx.fillText('Total Spent', cx, cy + 10);

    // Update aria-label with actual data
    const labelParts = [];
    Object.keys(categories).forEach(key => {
        const amount = catTotals[key] || 0;
        if (amount > 0) {
            const pct = Math.round((amount / totalSpent) * 100);
            labelParts.push(`${categories[key].name} ${pct}%`);
        }
    });
    canvas.setAttribute('aria-label', 'Spending breakdown: ' + (labelParts.length > 0 ? labelParts.join(', ') : 'No expenses recorded'));
}

/**
 * Updates the Budget Health summary card in the dashboard.
 * Shows total budget vs total spent across all categories with usage percentage.
 * Color-codes the trend: green (under 70%), amber (70-90%), red (90%+).
 */
function updateBudgetHealthCard() {
    const valueEl = document.getElementById('budgetHealthValue');
    const trendEl = document.getElementById('budgetHealthTrend');
    if (!valueEl || !trendEl) return;

    // Sum all budget amounts
    const totalBudget = appData.budgets.reduce((sum, b) => sum + b.amount, 0);

    // Sum all expenses across budgeted categories
    const totalSpent = appData.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    // Calculate usage percentage
    const usagePct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Update display
    valueEl.innerHTML = `${formatCurrency(totalSpent)} / ${formatCurrency(totalBudget)}`;
    trendEl.textContent = `${usagePct}% used`;

    // Color-code the trend based on budget health
    trendEl.className = 'card-trend'; // Reset
    if (totalBudget === 0) {
        trendEl.textContent = 'No budget set';
        trendEl.classList.add('neutral');
    } else if (usagePct >= 90) {
        trendEl.classList.add('negative'); // Over budget / danger
    } else if (usagePct >= 70) {
        trendEl.classList.add('warning');   // Approaching limit
    } else {
        trendEl.classList.add('positive');  // Healthy
    }
}

function updateWeeklyChart() {
    const chart = document.getElementById('weeklyChart');
    chart.innerHTML = '';

    // Aggregate real transaction data by day of week (last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayKeys = [0, 1, 2, 3, 4, 5, 6]; // JS Date.getDay() values
    const weeklyData = dayKeys.map(() => 0);

    // Sum up expenses for each day of the current week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start from Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    appData.transactions.forEach(t => {
        if (t.type !== 'expense') return;
        const txnDate = new Date(t.date);
        // Only include transactions from the current week
        if (txnDate >= startOfWeek && txnDate <= now) {
            const dayIndex = txnDate.getDay(); // 0=Sun, 1=Mon, ...
            weeklyData[dayIndex] += t.amount;
        }
    });

    // If no real data exists for this week, show all zeros (honest representation)
    const maxAmount = Math.max(...weeklyData, 1); // Avoid division by zero

    // Reorder to Mon-Sun for display (matches the original labels)
    const displayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const displayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    displayOrder.forEach((dayIdx, i) => {
        const amount = weeklyData[dayIdx];
        const barHeight = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
        const item = document.createElement('div');
        item.className = 'bar-item';
        item.innerHTML = `
            <span class="bar-value">${amount > 0 ? '₹' + (amount / 1000).toFixed(1) + 'k' : '₹0'}</span>
            <div class="bar-fill" style="height: ${barHeight}%"></div>
            <span class="bar-label">${displayLabels[i]}</span>
        `;
        chart.appendChild(item);
    });
}

// ========== DYNAMIC AI INSIGHTS ==========
/**
 * Generates dynamic insights based on actual transaction data.
 * Analyzes spending patterns, budget health, and savings opportunities.
 */
function generateInsights() {
    const insights = [];
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0;

    // 1. Spending pattern: find the highest expense category
    const catTotals = {};
    appData.transactions.forEach(t => {
        if (t.type === 'expense') {
            catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
        }
    });
    let topCat = null, topAmt = 0;
    Object.keys(catTotals).forEach(k => {
        if (catTotals[k] > topAmt) { topCat = k; topAmt = catTotals[k]; }
    });
    if (topCat && totalExpenses > 0) {
        const pct = Math.round((topAmt / totalExpenses) * 100);
        const catName = categories[topCat].name;
        insights.push({
            icon: 'fa-brain',
            title: 'Top Spending Category',
            text: `${catName} accounts for ${pct}% of your total spending at ${formatCurrency(topAmt)}. Consider setting a specific budget for this category.`,
            tag: pct > 40 ? 'Needs Attention' : 'Insight',
            tagClass: pct > 40 ? 'warning' : 'neutral'
        });
    }

    // 2. Budget health: check which budgets are over/close to limit
    const overBudgets = [];
    const nearBudgets = [];
    appData.budgets.forEach(b => {
        const spent = getCategorySpent(b.category);
        const pct = (spent / b.amount) * 100;
        if (pct >= 100) overBudgets.push({ name: categories[b.category].name, pct: Math.round(pct) });
        else if (pct >= 75) nearBudgets.push({ name: categories[b.category].name, pct: Math.round(pct) });
    });
    if (overBudgets.length > 0) {
        const names = overBudgets.map(b => `${b.name} (${b.pct}%)`).join(', ');
        insights.push({
            icon: 'fa-triangle-exclamation',
            title: 'Over Budget Alert',
            text: `You've exceeded your budget for: ${names}. Review spending in these categories to stay on track.`,
            tag: 'Action Required',
            tagClass: 'warning'
        });
    } else if (nearBudgets.length > 0) {
        const names = nearBudgets.map(b => `${b.name} (${b.pct}%)`).join(', ');
        insights.push({
            icon: 'fa-chart-bar',
            title: 'Budget Health',
            text: `You're within budget! Watch these categories approaching limit: ${names}.`,
            tag: 'On Track',
            tagClass: 'neutral'
        });
    } else {
        insights.push({
            icon: 'fa-chart-bar',
            title: 'Budget Health',
            text: 'Great job! All your categories are well within budget this month. Keep it up!',
            tag: 'On Track',
            tagClass: 'positive'
        });
    }

    // 3. Savings rate insight
    if (savingsRate >= 30) {
        insights.push({
            icon: 'fa-piggy-bank',
            title: 'Excellent Savings Rate',
            text: `You're saving ${Math.round(savingsRate)}% of your income. Consider investing ${formatCurrency(Math.round((totalIncome - totalExpenses) * 0.5))} monthly in mutual funds or SIPs for long-term growth.`,
            tag: 'Recommended',
            tagClass: 'positive'
        });
    } else if (savingsRate >= 15) {
        insights.push({
            icon: 'fa-lightbulb',
            title: 'Savings Opportunity',
            text: `Your savings rate is ${Math.round(savingsRate)}%. Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Small cuts to discretionary spending could boost your savings significantly.`,
            tag: 'Actionable',
            tagClass: 'neutral'
        });
    } else if (savingsRate > 0) {
        insights.push({
            icon: 'fa-shield-halved',
            title: 'Build Your Safety Net',
            text: `Your savings rate is ${Math.round(savingsRate)}%. Focus on building an emergency fund of 3-6 months expenses (${formatCurrency(totalExpenses * 3)} - ${formatCurrency(totalExpenses * 6)}).`,
            tag: 'Priority',
            tagClass: 'warning'
        });
    } else if (totalExpenses > totalIncome) {
        insights.push({
            icon: 'fa-circle-exclamation',
            title: 'Spending Exceeds Income',
            text: `Your expenses (${formatCurrency(totalExpenses)}) exceed your income (${formatCurrency(totalIncome)}). Review non-essential spending and create a stricter budget immediately.`,
            tag: 'Urgent',
            tagClass: 'warning'
        });
    }

    // 4. Goal progress insight
    if (appData.goals.length > 0) {
        const goal = appData.goals[0];
        const pct = Math.round((goal.current / goal.target) * 100);
        const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)));
        const remaining = goal.target - goal.current;
        const monthlyNeeded = daysLeft > 0 ? Math.round(remaining / (daysLeft / 30)) : remaining;
        insights.push({
            icon: 'fa-bullseye',
            title: `Goal: ${goal.name}`,
            text: `You're ${pct}% there (${formatCurrency(goal.current)} of ${formatCurrency(goal.target)}). ${daysLeft > 0 ? `Save ~${formatCurrency(monthlyNeeded)}/month to reach your goal in ${daysLeft} days.` : 'Deadline has passed — consider updating the target date.'}`,
            tag: pct >= 75 ? 'Almost There!' : 'In Progress',
            tagClass: pct >= 75 ? 'positive' : 'neutral'
        });
    }

    return insights;
}

/**
 * Renders the AI insights section with dynamic content.
 */
function renderInsights() {
    const grid = document.getElementById('insightsGrid');
    if (!grid) return;
    const insights = generateInsights();

    grid.innerHTML = '';
    insights.forEach(insight => {
        const card = document.createElement('div');
        card.className = 'insight-card';
        card.innerHTML = `
            <div class="insight-icon"><i class="fas ${insight.icon}" aria-hidden="true"></i></div>
            <h3>${insight.title}</h3>
            <p>${insight.text}</p>
            <span class="insight-tag ${insight.tagClass}">${insight.tag}</span>
        `;
        grid.appendChild(card);
    });
}

// ========== TRANSACTIONS ==========
function renderTransactions() {
    const list = document.getElementById('transactionsList');
    const filterCategory = document.getElementById('filterCategory').value;
    const filterMonth = document.getElementById('filterMonth').value;
    const searchTerm = document.getElementById('searchTransactions').value.toLowerCase();
    
    let filtered = appData.transactions;
    
    if (filterCategory !== 'all') {
        filtered = filtered.filter(t => t.category === filterCategory);
    }
    
    // Filter by month (format: YYYY-MM)
    if (filterMonth !== 'all') {
        filtered = filtered.filter(t => t.date && t.date.startsWith(filterMonth));
    }
    
    if (searchTerm) {
        filtered = filtered.filter(t => t.description.toLowerCase().includes(searchTerm));
    }
    
    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    list.innerHTML = '';
    
    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding: 2rem; color: var(--color-gray-500);">No transactions found.</p>';
        return;
    }
    
    filtered.forEach(txn => {
        const cat = categories[txn.category] || categories.others;
        // Use shared color map
        const color = CATEGORY_COLOR_MAP[txn.category] || '#6b7280';
        const item = document.createElement('div');
        item.className = 'transaction-item';
        item.setAttribute('role', 'listitem');
        item.innerHTML = `
            <div class="txn-icon" style="background: ${color}20; color: ${color}">
                <i class="fas ${cat.icon}" aria-hidden="true"></i>
            </div>
            <div class="txn-details">
                <span class="txn-name">${txn.description}</span>
                <span class="txn-meta">${cat.name} &bull; ${formatDate(txn.date)}</span>
            </div>
            <span class="txn-amount ${txn.type}">${txn.type === 'income' ? '+' : '-'}${formatCurrency(txn.amount)}</span>
            <div class="txn-actions">
                <button class="edit-btn" onclick="openEditTransactionModal(${txn.id})" aria-label="Edit ${txn.description}">
                    <i class="fas fa-edit" aria-hidden="true"></i>
                </button>
                <button class="delete-btn" onclick="deleteTransaction(${txn.id})" aria-label="Delete ${txn.description}">
                    <i class="fas fa-trash-alt" aria-hidden="true"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

function addTransaction(e) {
    e.preventDefault();
    
    const description = document.getElementById('txnDescription').value.trim();
    const amount = parseFloat(document.getElementById('txnAmount').value);
    const category = document.getElementById('txnCategory').value;
    const type = document.getElementById('txnType').value;
    const date = document.getElementById('txnDate').value;
    
    if (!description || !amount || !category || !date) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    const newTxn = {
        id: Date.now(),
        description,
        amount,
        category,
        type,
        date
    };
    
    appData.transactions.push(newTxn);
    saveData(appData);
    
    // Reset form
    e.target.reset();
    document.getElementById('txnDate').valueAsDate = new Date();
    
    renderTransactions();
    updateDashboard();
    renderInsights();
    showToast('Transaction added successfully!', 'success');
}

// ========== CONFIRMATION MODAL ==========
let confirmCallback = null;

/**
 * Shows a styled confirmation modal instead of browser confirm().
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 * @param {string} confirmText - Text for confirm button (default: "Delete")
 * @param {function} onConfirm - Callback when user confirms
 */
function showConfirmModal(title, message, confirmText, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    const okBtn = document.getElementById('confirmOkBtn');
    okBtn.textContent = confirmText || 'Delete';
    confirmCallback = onConfirm;
    document.getElementById('confirmModal').classList.add('active');
    // Focus the cancel button for safety (prevent accidental delete)
    document.getElementById('confirmCancelBtn').focus();
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    confirmCallback = null;
}

// Confirm modal button handlers
document.getElementById('confirmCancelBtn').addEventListener('click', closeConfirmModal);
document.getElementById('confirmOkBtn').addEventListener('click', () => {
    if (confirmCallback) confirmCallback();
    closeConfirmModal();
});

// Close modal on overlay click
document.getElementById('confirmModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeConfirmModal();
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeConfirmModal();
        closeEditTransactionModal();
        closeEditGoalModal();
    }
});

function deleteTransaction(id) {
    const txn = appData.transactions.find(t => t.id === id);
    if (!txn) return;
    showConfirmModal(
        'Delete Transaction',
        `Are you sure you want to delete "${txn.description}" (${formatCurrency(txn.amount)})? This action cannot be undone.`,
        'Delete',
        () => {
            appData.transactions = appData.transactions.filter(t => t.id !== id);
            saveData(appData);
            renderTransactions();
            updateDashboard();
            renderInsights();
            showToast('Transaction deleted', 'info');
        }
    );
}

// ========== BUDGETS ==========
function renderBudgets() {
    const container = document.getElementById('budgetCards');
    container.innerHTML = '';
    
    appData.budgets.forEach(budget => {
        const spent = getCategorySpent(budget.category);
        const percentage = Math.min((spent / budget.amount) * 100, 100);
        const cat = categories[budget.category];
        // Use shared color map
        const color = CATEGORY_COLOR_MAP[budget.category] || '#6b7280';

        let progressClass = 'safe';
        if (percentage >= 90) progressClass = 'danger';
        else if (percentage >= 70) progressClass = 'warning';

        const card = document.createElement('div');
        card.className = 'budget-card';
        card.innerHTML = `
            <div class="budget-header">
                <span class="budget-category">
                    <i class="fas ${cat.icon}" style="color: ${color}" aria-hidden="true"></i>
                    ${cat.name}
                </span>
                <span class="budget-percentage">${Math.round(percentage)}%</span>
            </div>
            <div class="budget-progress" role="progressbar" aria-valuenow="${Math.round(percentage)}" aria-valuemin="0" aria-valuemax="100">
                <div class="budget-progress-bar ${progressClass}" style="width: ${percentage}%"></div>
            </div>
            <div class="budget-footer">
                <span>Spent: ${formatCurrency(spent)}</span>
                <span>Budget: ${formatCurrency(budget.amount)}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

function addBudget() {
    const category = document.getElementById('budgetCategory').value;
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    
    if (!amount || amount < 100) {
        showToast('Please enter a valid budget amount', 'error');
        return;
    }
    
    // Check if budget exists for this category
    const existing = appData.budgets.find(b => b.category === category);
    if (existing) {
        existing.amount = amount;
        showToast('Budget updated!', 'success');
    } else {
        appData.budgets.push({ category, amount });
        showToast('Budget set!', 'success');
    }
    
    saveData(appData);
    document.getElementById('budgetAmount').value = '';
    renderBudgets();
}

// ========== GOALS ==========
function renderGoals() {
    const grid = document.getElementById('goalsGrid');
    grid.innerHTML = '';
    
    appData.goals.forEach(goal => {
        const percentage = Math.min((goal.current / goal.target) * 100, 100);
        const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)));
        
        const card = document.createElement('div');
        card.className = 'goal-card';
        card.innerHTML = `
            <div class="goal-actions">
                <button onclick="openEditGoalModal(${goal.id})" aria-label="Edit ${goal.name}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" onclick="deleteGoal(${goal.id})" aria-label="Delete ${goal.name}"><i class="fas fa-trash-alt"></i></button>
            </div>
            <span class="goal-percentage">${Math.round(percentage)}%</span>
            <h3 class="goal-name">${goal.name}</h3>
            <div class="goal-progress" role="progressbar" aria-valuenow="${Math.round(percentage)}" aria-valuemin="0" aria-valuemax="100">
                <div class="goal-progress-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="goal-stats">
                <span class="goal-current">${formatCurrency(goal.current)}</span>
                <span class="goal-target">of ${formatCurrency(goal.target)}</span>
            </div>
            <span class="goal-deadline">
                <i class="fas fa-calendar" aria-hidden="true"></i>
                ${daysLeft} days left (${formatDate(goal.deadline)})
            </span>
        `;
        grid.appendChild(card);
    });
}

function addGoal(e) {
    e.preventDefault();
    
    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalTarget').value);
    const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
    const deadline = document.getElementById('goalDeadline').value;
    
    if (!name || !target || !deadline) {
        showToast('Please fill all fields', 'error');
        return;
    }
    
    const newGoal = {
        id: Date.now(),
        name,
        target,
        current,
        deadline
    };
    
    appData.goals.push(newGoal);
    saveData(appData);
    
    e.target.reset();
    renderGoals();
    renderInsights();
    showToast('Goal created!', 'success');
}

// ========== EDIT TRANSACTION ==========
/**
 * Opens the edit transaction modal and fills it with the transaction's data.
 */
function openEditTransactionModal(id) {
    const txn = appData.transactions.find(t => t.id === id);
    if (!txn) return;

    document.getElementById('editTxnId').value = txn.id;
    document.getElementById('editTxnDescription').value = txn.description;
    document.getElementById('editTxnAmount').value = txn.amount;
    document.getElementById('editTxnCategory').value = txn.category;
    document.getElementById('editTxnType').value = txn.type;
    document.getElementById('editTxnDate').value = txn.date;

    document.getElementById('editTransactionModal').classList.add('active');
    document.getElementById('editTxnDescription').focus();
}

function closeEditTransactionModal() {
    document.getElementById('editTransactionModal').classList.remove('active');
}

// Close edit transaction modal on overlay click
document.getElementById('editTransactionModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeEditTransactionModal();
});

// Save edited transaction
document.getElementById('saveEditTxnBtn').addEventListener('click', () => {
    const id = parseInt(document.getElementById('editTxnId').value);
    const description = document.getElementById('editTxnDescription').value.trim();
    const amount = parseFloat(document.getElementById('editTxnAmount').value);
    const category = document.getElementById('editTxnCategory').value;
    const type = document.getElementById('editTxnType').value;
    const date = document.getElementById('editTxnDate').value;

    if (!description || !amount || amount <= 0 || !category || !date) {
        showToast('Please fill all fields with valid values', 'error');
        return;
    }

    const txn = appData.transactions.find(t => t.id === id);
    if (!txn) {
        showToast('Transaction not found', 'error');
        return;
    }

    txn.description = description;
    txn.amount = amount;
    txn.category = category;
    txn.type = type;
    txn.date = date;

    saveData(appData);
    renderTransactions();
    updateDashboard();
    renderBudgets();
    renderInsights();
    closeEditTransactionModal();
    showToast('Transaction updated successfully!', 'success');
});

// ========== EDIT GOAL ==========
/**
 * Opens the edit goal modal and fills it with the goal's data.
 */
function openEditGoalModal(id) {
    const goal = appData.goals.find(g => g.id === id);
    if (!goal) return;

    document.getElementById('editGoalId').value = goal.id;
    document.getElementById('editGoalName').value = goal.name;
    document.getElementById('editGoalTarget').value = goal.target;
    document.getElementById('editGoalCurrent').value = goal.current;
    document.getElementById('editGoalDeadline').value = goal.deadline;

    document.getElementById('editGoalModal').classList.add('active');
    document.getElementById('editGoalName').focus();
}

function closeEditGoalModal() {
    document.getElementById('editGoalModal').classList.remove('active');
}

// Close edit goal modal on overlay click
document.getElementById('editGoalModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeEditGoalModal();
});

// Save edited goal
document.getElementById('saveEditGoalBtn').addEventListener('click', () => {
    const id = parseInt(document.getElementById('editGoalId').value);
    const name = document.getElementById('editGoalName').value.trim();
    const target = parseFloat(document.getElementById('editGoalTarget').value);
    const current = parseFloat(document.getElementById('editGoalCurrent').value) || 0;
    const deadline = document.getElementById('editGoalDeadline').value;

    if (!name || !target || target <= 0 || !deadline) {
        showToast('Please fill all fields with valid values', 'error');
        return;
    }

    const goal = appData.goals.find(g => g.id === id);
    if (!goal) {
        showToast('Goal not found', 'error');
        return;
    }

    goal.name = name;
    goal.target = target;
    goal.current = current;
    goal.deadline = deadline;

    saveData(appData);
    renderGoals();
    renderInsights();
    closeEditGoalModal();
    showToast('Goal updated successfully!', 'success');
});

// ========== DELETE GOAL ==========
/**
 * Deletes a goal after confirmation via styled modal.
 */
function deleteGoal(id) {
    const goal = appData.goals.find(g => g.id === id);
    if (!goal) return;
    showConfirmModal(
        'Delete Goal',
        `Are you sure you want to delete the goal "${goal.name}"? This action cannot be undone.`,
        'Delete',
        () => {
            appData.goals = appData.goals.filter(g => g.id !== id);
            saveData(appData);
            renderGoals();
            renderInsights();
            showToast('Goal deleted', 'info');
        }
    );
}

// ========== SMOOTH SCROLL ==========
function scrollToSection(id) {
    const section = document.getElementById(id);
    if (section) {
        const offset = 80;
        const top = section.offsetTop - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // Initialize date input to today
    document.getElementById('txnDate').valueAsDate = new Date();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize dark mode
    initDarkMode();
    
    // Initialize data export/import
    initDataManagement();
    
    // Render all sections
    renderTransactions();
    renderBudgets();
    renderGoals();
    updateDashboard();
    renderInsights();
    
    // Form handlers
    document.getElementById('transactionForm').addEventListener('submit', addTransaction);
    document.getElementById('goalForm').addEventListener('submit', addGoal);
    document.getElementById('addBudgetBtn').addEventListener('click', addBudget);
    
    // Filter handlers
    document.getElementById('filterCategory').addEventListener('change', renderTransactions);
    document.getElementById('filterMonth').addEventListener('change', renderTransactions);
    document.getElementById('searchTransactions').addEventListener('input', renderTransactions);
    
    // Add some sample transactions if empty
    if (appData.transactions.length === 0) {
        appData.transactions = defaultData.transactions;
        saveData(appData);
        renderTransactions();
        updateDashboard();
    }
});

// Make functions globally available for inline onclick handlers
window.scrollToSection = scrollToSection;
window.deleteTransaction = deleteTransaction;
window.openEditTransactionModal = openEditTransactionModal;
window.deleteGoal = deleteGoal;
window.openEditGoalModal = openEditGoalModal;

// ========== DATA EXPORT / IMPORT ==========
/**
 * Exports all transactions as a CSV file.
 * Columns: Date, Description, Category, Type, Amount
 */
function exportTransactionsCSV() {
    if (appData.transactions.length === 0) {
        showToast('No transactions to export', 'error');
        return;
    }

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = appData.transactions.map(t => {
        const catName = categories[t.category] ? categories[t.category].name : t.category;
        // Escape quotes and wrap fields that contain commas
        const desc = '"' + t.description.replace(/"/g, '""') + '"';
        return [t.date, desc, catName, t.type, t.amount].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    downloadFile(csv, 'yaadrakh_transactions.csv', 'text/csv');
    showToast(`Exported ${appData.transactions.length} transactions as CSV`, 'success');
}

/**
 * Exports the entire app data (transactions, budgets, goals) as a JSON file.
 * Useful for backup and restore.
 */
function exportAllDataJSON() {
    const json = JSON.stringify(appData, null, 2);
    downloadFile(json, 'yaadrakh_backup.json', 'application/json');
    showToast('Full data backup exported as JSON', 'success');
}

/**
 * Generates and exports a monthly summary report as CSV.
 * Includes: category breakdown, budget vs actual, savings rate.
 */
function exportSummaryReport() {
    const totalIncome = getTotalIncome();
    const totalExpenses = getTotalExpenses();
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : '0.0';

    const lines = [];
    lines.push('YaadRakh - Monthly Summary Report');
    lines.push(`Generated on,${new Date().toLocaleDateString('en-IN')}`);
    lines.push('');
    lines.push('Overview');
    lines.push(`Total Income,₹${totalIncome.toLocaleString('en-IN')}`);
    lines.push(`Total Expenses,₹${totalExpenses.toLocaleString('en-IN')}`);
    lines.push(`Net Savings,₹${savings.toLocaleString('en-IN')}`);
    lines.push(`Savings Rate,${savingsRate}%`);
    lines.push('');

    // Category breakdown
    lines.push('Category Breakdown');
    lines.push('Category,Budget,Spent,Remaining,Usage %');
    appData.budgets.forEach(b => {
        const spent = getCategorySpent(b.category);
        const remaining = Math.max(0, b.amount - spent);
        const pct = b.amount > 0 ? ((spent / b.amount) * 100).toFixed(1) : '0.0';
        const catName = categories[b.category] ? categories[b.category].name : b.category;
        lines.push(`"${catName}",₹${b.amount},₹${spent},₹${remaining},${pct}%`);
    });
    lines.push('');

    // Goals summary
    if (appData.goals.length > 0) {
        lines.push('Financial Goals');
        lines.push('Goal,Target,Current,Progress %,Deadline');
        appData.goals.forEach(g => {
            const pct = g.target > 0 ? ((g.current / g.target) * 100).toFixed(1) : '0.0';
            lines.push(`"${g.name}",₹${g.target},₹${g.current},${pct}%,${g.deadline}`);
        });
    }

    const csv = lines.join('\n');
    downloadFile(csv, 'yaadrakh_summary_report.csv', 'text/csv');
    showToast('Summary report exported', 'success');
}

/**
 * Triggers a file download from a string.
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoke after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Handles CSV file import.
 * Expected columns: Date, Description, Category, Type, Amount
 * Skips header row. Validates each row before adding.
 */
function handleImportCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length < 2) {
            showToast('CSV file is empty or missing data rows', 'error');
            return;
        }

        // Detect header: skip first line if it contains non-numeric amount
        let startIdx = 0;
        const firstRowParts = parseCSVLine(lines[0]);
        const lastVal = firstRowParts[firstRowParts.length - 1].trim();
        if (isNaN(parseFloat(lastVal))) {
            startIdx = 1; // Skip header row
        }

        let imported = 0;
        let skipped = 0;

        for (let i = startIdx; i < lines.length; i++) {
            const parts = parseCSVLine(lines[i]);
            if (parts.length < 5) { skipped++; continue; }

            const date = parts[0].trim();
            const description = parts[1].trim().replace(/^"|"$/g, '').replace(/""/g, '"');
            const categoryName = parts[2].trim();
            const type = parts[3].trim().toLowerCase();
            const amount = parseFloat(parts[4].trim());

            // Validate
            if (!date || !description || !amount || amount <= 0) { skipped++; continue; }
            if (type !== 'income' && type !== 'expense') { skipped++; continue; }

            // Reverse-lookup category key from name
            let category = 'others';
            const catKey = Object.keys(categories).find(k =>
                categories[k].name.toLowerCase() === categoryName.toLowerCase()
            );
            if (catKey) category = catKey;

            const newTxn = {
                id: Date.now() + i, // Unique IDs for batch
                description,
                amount,
                category,
                type,
                date
            };

            appData.transactions.push(newTxn);
            imported++;
        }

        if (imported > 0) {
            saveData(appData);
            renderTransactions();
            updateDashboard();
            renderBudgets();
            renderGoals();
            renderInsights();
            showToast(`Imported ${imported} transactions${skipped > 0 ? ` (${skipped} skipped)` : ''}`, 'success');
        } else {
            showToast('No valid transactions found in CSV', 'error');
        }

        // Reset file input so same file can be re-imported
        event.target.value = '';
    };

    reader.onerror = function() {
        showToast('Failed to read file', 'error');
    };

    reader.readAsText(file);
}

/**
 * Parses a single CSV line, handling quoted fields with commas.
 * Simple CSV parser: splits on commas but respects double-quoted fields.
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip escaped quote
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    result.push(current);
    return result;
}

/**
 * Initializes data export/import event listeners.
 */
function initDataManagement() {
    document.getElementById('exportCsvBtn').addEventListener('click', exportTransactionsCSV);
    document.getElementById('exportJsonBtn').addEventListener('click', exportAllDataJSON);
    document.getElementById('exportReportBtn').addEventListener('click', exportSummaryReport);
    document.getElementById('importFileInput').addEventListener('change', handleImportCSV);
}

// ========== UPI PAYMENT MODAL ==========
/**
 * Opens the UPI payment modal for premium upgrade.
 */
function openUpiPaymentModal() {
    document.getElementById('paymentModal').classList.add('active');
    // Close the modal when clicking overlay
}

function closeUpiPaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
}

// Close UPI payment modal on overlay click
document.getElementById('paymentModal').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) closeUpiPaymentModal();
});

// Close UPI payment modal on Escape key (extended existing handler)
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeUpiPaymentModal();
});

/**
 * Copies the UPI ID to clipboard and shows a toast.
 */
function copyUpiId() {
    var paymentUpiId = document.getElementById('paymentUpiId').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(paymentUpiId).then(function() {
            showToast('UPI ID copied to clipboard!', 'success');
        }).catch(function() {
            fallbackCopyUpiId(paymentUpiId);
        });
    } else {
        fallbackCopyUpiId(paymentUpiId);
    }
}

function fallbackCopyUpiId(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('UPI ID copied to clipboard!', 'success');
    } catch (err) {
        showToast('Press Ctrl+C to copy UPI ID: ' + text, 'info');
    }
    document.body.removeChild(textarea);
}

// Expose UPI functions for inline onclick handlers
window.openUpiPaymentModal = openUpiPaymentModal;
window.closeUpiPaymentModal = closeUpiPaymentModal;
window.copyUpiId = copyUpiId;
