/* ============================================================
   SarkarGhar — Government Scheme Finder Portal
   Main Application JavaScript
   ============================================================ */

// ========== DATA ==========
const categories = [
  { id: 'agriculture', icon: '🌾', name: 'Agriculture', count: 78 },
  { id: 'education', icon: '📚', name: 'Education & Scholarship', count: 95 },
  { id: 'health', icon: '🏥', name: 'Health & Wellness', count: 62 },
  { id: 'housing', icon: '🏠', name: 'Housing & Shelter', count: 45 },
  { id: 'pension', icon: '👴', name: 'Pension & Retirement', count: 38 },
  { id: 'women', icon: '👩', name: 'Women & Child', count: 72 },
  { id: 'employment', icon: '💼', name: 'Employment & Skill', count: 55 },
  { id: 'financial', icon: '💰', name: 'Financial Inclusion', count: 56 },
];

const schemes = [
  {
    id: 1, name: 'PM Kisan Samman Nidhi', dept: 'Ministry of Agriculture',
    category: 'agriculture', icon: '🌾', benefit: '₹6,000/year',
    desc: 'Direct income support of ₹6,000 per year to farmer families in three equal installments.',
    tags: ['Farmers', 'Direct Benefit', 'Central'],
    deadline: 'Open', match: 98
  },
  {
    id: 2, name: 'Ayushman Bharat Yojana', dept: 'Ministry of Health',
    category: 'health', icon: '🏥', benefit: '₹5 Lakh Health Cover',
    desc: 'World\'s largest health insurance scheme providing ₹5 lakh coverage per family per year.',
    tags: ['Health Insurance', 'BPL Families', 'Hospital'],
    deadline: 'Open', match: 95
  },
  {
    id: 3, name: 'PM Awas Yojana (Gramin)', dept: 'Ministry of Rural Development',
    category: 'housing', icon: '🏠', benefit: '₹1.2 Lakh Assistance',
    desc: 'Financial assistance for construction of pucca houses for rural families without a home.',
    tags: ['Rural', 'Housing', 'BPL'],
    deadline: 'Dec 2026', match: 92
  },
  {
    id: 4, name: 'Sukanya Samriddhi Yojana', dept: 'Ministry of Finance',
    category: 'women', icon: '👧', benefit: '8.2% Interest Rate',
    desc: 'Small deposit scheme for girl child offering high interest rate and tax benefits under 80C.',
    tags: ['Girl Child', 'Savings', 'Tax Benefit'],
    deadline: 'Open', match: 90
  },
  {
    id: 5, name: 'National Scholarship Portal', dept: 'Ministry of Education',
    category: 'education', icon: '🎓', benefit: 'Up to ₹20,000/year',
    desc: 'Central and state government scholarships for students from economically weaker sections.',
    tags: ['Students', 'Merit-based', 'EWS'],
    deadline: 'Oct 2026', match: 88
  },
  {
    id: 6, name: 'PM Shram Yogi Maan-dhan', dept: 'Ministry of Labour',
    category: 'pension', icon: '👴', benefit: '₹3,000/month Pension',
    desc: 'Pension scheme for unorganized workers providing ₹3,000 monthly pension after age 60.',
    tags: ['Unorganized Workers', 'Pension', 'Voluntary'],
    deadline: 'Open', match: 85
  },
  {
    id: 7, name: 'PM Mudra Yojana', dept: 'MUDRA Ltd.',
    category: 'financial', icon: '💰', benefit: 'Loan up to ₹10 Lakh',
    desc: 'Collateral-free loans up to ₹10 lakh for micro and small enterprises under Shishu, Kishore, Tarun categories.',
    tags: ['MSME', 'Loan', 'Collateral-free'],
    deadline: 'Open', match: 87
  },
  {
    id: 8, name: 'Beti Bachao Beti Padhao', dept: 'Ministry of WCD',
    category: 'women', icon: '👩', benefit: 'Education Support',
    desc: 'Scheme to address declining child sex ratio and promote education of girl children across India.',
    tags: ['Girl Child', 'Education', 'Awareness'],
    deadline: 'Open', match: 82
  },
  {
    id: 9, name: 'Skill India Mission', dept: 'MSDE',
    category: 'employment', icon: '💼', benefit: 'Free Skill Training',
    desc: 'Industry-oriented skill training to 40 crore people by 2026. Includes placement assistance.',
    tags: ['Youth', 'Skill Training', 'Placement'],
    deadline: 'Open', match: 80
  },
  {
    id: 10, name: 'PM Jan Dhan Yojana', dept: 'Ministry of Finance',
    category: 'financial', icon: '🏦', benefit: 'Zero Balance Account',
    desc: 'Universal access to banking facilities with at least one basic bank account for every household.',
    tags: ['Banking', 'Financial Inclusion', 'RuPay'],
    deadline: 'Open', match: 94
  },
  {
    id: 11, name: 'Rashtriya Swasthya Bima Yojana', dept: 'Ministry of Health',
    category: 'health', icon: '💊', benefit: '₹30,000 Health Cover',
    desc: 'Health insurance for BPL families providing coverage up to ₹30,000 for hospitalization.',
    tags: ['BPL', 'Hospitalization', 'Insurance'],
    deadline: 'Open', match: 78
  },
  {
    id: 12, name: 'PM Kaushal Vikas Yojana', dept: 'MSDE',
    category: 'employment', icon: '🛠️', benefit: 'Free Certification',
    desc: 'Skill certification scheme providing free training and assessment for youth employability.',
    tags: ['Youth', 'Certification', 'Free'],
    deadline: 'Mar 2027', match: 83
  },
];

const testimonials = [
  {
    name: 'Ramesh Kumar', location: 'Varanasi, UP',
    avatar: '👨‍🌾', stars: 5,
    text: 'SarkarGhar helped me find PM Kisan scheme I didn\'t know I was eligible for. Got ₹6,000 directly in my account. The eligibility checker is amazing!'
  },
  {
    name: 'Priya Devi', location: 'Patna, Bihar',
    avatar: '👩', stars: 5,
    text: 'I was able to apply for Sukanya Samriddhi Yojana for my daughter through SarkarGhar. The step-by-step guide made it so easy. Highly recommended!'
  },
  {
    name: 'Mohammed Irfan', location: 'Mumbai, Maharashtra',
    avatar: '👨', stars: 4,
    text: 'Found Ayushman Bharat scheme through the AI recommendation quiz. Got my family health card within 2 weeks. This portal is a lifesaver for common people.'
  },
];

const faqData = [
  {
    q: 'Is SarkarGhar a government website?',
    a: 'SarkarGhar is an independent platform that helps citizens find and apply for government schemes. We are not affiliated with any government department but provide accurate information sourced from official government portals.'
  },
  {
    q: 'Is it free to use SarkarGhar?',
    a: 'Yes! Searching for schemes, checking eligibility, and tracking applications are completely free. We offer optional premium assistance plans for those who need expert help with documentation and application filing.'
  },
  {
    q: 'How does the eligibility checker work?',
    a: 'Our eligibility checker asks you a few simple questions about your profile (category, age, income, location) and matches you with schemes you likely qualify for. It uses the official eligibility criteria from government sources.'
  },
  {
    q: 'Can I apply for schemes directly through SarkarGhar?',
    a: 'We provide direct links to official government portals for application. For premium plan users, our experts handle the entire application process end-to-end, including document preparation and submission.'
  },
  {
    q: 'How accurate is the AI recommendation?',
    a: 'Our AI recommendation engine has a 95% accuracy rate in matching users with eligible schemes. It analyzes your profile against 500+ scheme criteria to provide personalized recommendations.'
  },
  {
    q: 'What is ARN and where do I find it?',
    a: 'ARN stands for Application Reference Number. It is provided to you after you submit a scheme application on the official government portal. You can use this number on our tracker to check your application status.'
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '0',
    period: 'forever',
    features: ['Search all 500+ schemes', 'Basic eligibility check', 'Application tracking', 'Email support'],
    popular: false
  },
  {
    name: 'Pro Assistance',
    price: '499',
    period: 'per scheme',
    features: ['Everything in Free', 'Expert document review', 'End-to-end application filing', 'Priority support', 'Status updates via SMS'],
    popular: true
  },
  {
    name: 'Premium',
    price: '1,999',
    period: 'per year',
    features: ['Everything in Pro', 'Unlimited scheme applications', 'Dedicated relationship manager', 'Document pickup & delivery', 'Legal assistance if needed'],
    popular: false
  },
];

// ========== DOM ELEMENTS ==========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ========== THEME TOGGLE ==========
const themeToggle = $('#themeToggle');
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.querySelector('.theme-icon').textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('sargahar-theme', theme);
}
function initTheme() {
  const saved = localStorage.getItem('sargahar-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  setTheme(saved || (prefersDark ? 'dark' : 'light'));
}
themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// ========== NAVBAR ==========
const hamburger = $('#hamburger');
const navLinks = $('#navLinks');
hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', isOpen);
});

// Close mobile menu on link click
$$('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

// Navbar scroll effect
const navbar = $('#navbar');
window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 50 ? 'var(--shadow-md)' : 'none';
});

// ========== RENDER CATEGORIES ==========
function renderCategories() {
  const grid = $('#categoriesGrid');
  grid.innerHTML = categories.map(cat => `
    <div class="category-card" data-category="${cat.id}" role="button" tabindex="0">
      <span class="category-icon">${cat.icon}</span>
      <div class="category-name">${cat.name}</div>
      <div class="category-count">${cat.count} schemes</div>
    </div>
  `).join('');

  // Click handler
  $$('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category;
      filterSchemesByCategory(cat);
      document.getElementById('schemes').scrollIntoView({ behavior: 'smooth' });
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') card.click();
    });
  });
}

// ========== RENDER SCHEMES ==========
let currentFilter = 'all';
function renderSchemes(filter = 'all') {
  const grid = $('#schemesGrid');
  const filtered = filter === 'all' ? schemes : schemes.filter(s => s.category === filter);
  grid.innerHTML = filtered.map(s => `
    <div class="scheme-card" data-id="${s.id}" role="button" tabindex="0">
      <div class="scheme-header">
        <span class="scheme-icon">${s.icon}</span>
        <div class="scheme-meta">
          <div class="scheme-name">${s.name}</div>
          <div class="scheme-dept">${s.dept}</div>
        </div>
      </div>
      <div class="scheme-benefit">${s.benefit}</div>
      <p class="scheme-desc">${s.desc}</p>
      <div class="scheme-tags">
        ${s.tags.map(t => `<span class="scheme-tag">${t}</span>`).join('')}
      </div>
      <div class="scheme-footer">
        <span class="scheme-deadline">⏰ ${s.deadline}</span>
        <button class="btn btn-primary btn-sm" onclick="openSchemeModal(${s.id})">View Details</button>
      </div>
    </div>
  `).join('');
}

function filterSchemesByCategory(category) {
  currentFilter = category;
  $$('.filter-tab').forEach(t => t.classList.toggle('active', t.dataset.filter === category));
  renderSchemes(category);
}

// Filter tabs
$$('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.filter-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.filter;
    renderSchemes(currentFilter);
  });
});

// ========== SCHEME DETAIL MODAL ==========
const schemeModal = $('#schemeModal');
const modalBody = $('#modalBody');

function openSchemeModal(id) {
  const scheme = schemes.find(s => s.id === id);
  if (!scheme) return;

  modalBody.innerHTML = `
    <div class="modal-scheme-header">
      <span class="modal-scheme-icon">${scheme.icon}</span>
      <div>
        <div class="modal-scheme-title">${scheme.name}</div>
        <div class="modal-scheme-dept">${scheme.dept}</div>
      </div>
    </div>
    <div class="modal-scheme-benefit">💰 Benefit: ${scheme.benefit}</div>

    <div class="modal-section">
      <h4>📋 Description</h4>
      <p>${scheme.desc}</p>
    </div>

    <div class="modal-section">
      <h4>✅ Eligibility Criteria</h4>
      <ul>
        <li>Indian citizen</li>
        <li>Category: ${scheme.category.charAt(0).toUpperCase() + scheme.category.slice(1)}</li>
        <li>Valid Aadhaar card required</li>
        <li>Bank account linked with Aadhaar</li>
      </ul>
    </div>

    <div class="modal-section">
      <h4>📄 Required Documents</h4>
      <ul>
        <li>Aadhaar Card</li>
        <li>Bank Account Details (Passbook)</li>
        <li>Passport Size Photograph</li>
        <li>Income Certificate (if applicable)</li>
        <li>Caste Certificate (if applicable)</li>
      </ul>
    </div>

    <div class="modal-section">
      <h4>📝 How to Apply</h4>
        <ol>
          <li>Visit the official government portal</li>
          <li>Register with your Aadhaar number</li>
          <li>Fill the application form</li>
          <li>Upload required documents</li>
          <li>Submit and note your ARN</li>
        </ol>
    </div>

    <div style="margin-top:24px; display:flex; gap:12px;">
      <button class="btn btn-primary" onclick="alert('Redirecting to official portal...')">Apply Now 🚀</button>
      <button class="btn btn-outline" onclick="closeModal('schemeModal')">Close</button>
    </div>
  `;

  schemeModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

$('#modalClose').addEventListener('click', () => closeModal('schemeModal'));
schemeModal.addEventListener('click', (e) => {
  if (e.target === schemeModal) closeModal('schemeModal');
});

// ========== ELIGIBILITY CHECKER ==========
let currentStep = 1;
const totalSteps = 5;
const eligibilityAnswers = {};

function updateProgress() {
  const pct = (currentStep / totalSteps) * 100;
  $('#progressFill').style.width = pct + '%';
  $$('.progress-step').forEach(s => {
    const step = parseInt(s.dataset.step);
    s.classList.toggle('active', step === currentStep);
    s.classList.toggle('completed', step < currentStep);
  });
}

function showStep(n) {
  $$('.form-step').forEach(s => s.classList.remove('active'));
  $(`.form-step[data-step="${n}"]`).classList.add('active');
  $('#prevStep').disabled = n === 1;

  if (n === totalSteps) {
    $('#nextStep').textContent = 'Start Over 🔄';
    generateEligibilityResults();
  } else {
    $('#nextStep').textContent = n === totalSteps - 1 ? 'See Results →' : 'Next →';
  }
}

function generateEligibilityResults() {
  const container = $('#eligibilityResults');
  const category = eligibilityAnswers.category || 'all';

  let matched;
  if (category === 'all') {
    matched = schemes.slice(0, 5);
  } else {
    matched = schemes.filter(s => s.category === category).slice(0, 5);
    if (matched.length < 3) matched = schemes.slice(0, 5);
  }

  container.innerHTML = `
    <div class="results-title">🎉 You're eligible for ${matched.length} schemes!</div>
    <div class="results-subtitle">Based on your profile, here are the best matches:</div>
    ${matched.map(s => `
      <div class="result-scheme">
        <span class="result-icon">${s.icon}</span>
        <div class="result-info">
          <div class="result-name">${s.name}</div>
          <div class="result-benefit">${s.benefit}</div>
        </div>
        <span class="result-match">${s.match}% match</span>
      </div>
    `).join('')}
    <button class="btn btn-primary" style="margin-top:20px;" onclick="closeEligibilityResults()">View All Schemes →</button>
  `;
}

function closeEligibilityResults() {
  currentStep = 1;
  updateProgress();
  showStep(1);
  document.getElementById('schemes').scrollIntoView({ behavior: 'smooth' });
}

$('#nextStep').addEventListener('click', () => {
  // Save answer from current step
  const activeStep = $(`.form-step[data-step="${currentStep}"]`);
  const selected = activeStep.querySelector('input:checked');
  if (selected) {
    eligibilityAnswers[selected.name] = selected.value;
  }
  // Also save select
  const select = activeStep.querySelector('select');
  if (select) {
    eligibilityAnswers[select.name] = select.value;
  }

  if (currentStep === totalSteps) {
    // Reset
    currentStep = 1;
    Object.keys(eligibilityAnswers).forEach(k => delete eligibilityAnswers[k]);
    $$('input[type="radio"]').forEach(r => r.checked = false);
    $('#stateSelect').value = '';
  } else {
    currentStep++;
  }
  updateProgress();
  showStep(currentStep);
});

$('#prevStep').addEventListener('click', () => {
  if (currentStep > 1) {
    currentStep--;
    updateProgress();
    showStep(currentStep);
  }
});

// ========== APPLICATION TRACKER ==========
const trackerData = {
  'SG-2024-12345678': {
    scheme: 'PM Kisan Samman Nidhi',
    steps: [
      { title: 'Application Submitted', desc: 'Your application has been received', date: '15 Jan 2026', completed: true },
      { title: 'Document Verification', desc: 'Documents verified by district office', date: '22 Jan 2026', completed: true },
      { title: 'Aadhaar Authentication', desc: 'Aadhaar linked successfully', date: '25 Jan 2026', completed: true },
      { title: 'Bank Account Validation', desc: 'Bank account verified', date: '28 Jan 2026', completed: true },
      { title: 'Payment Processing', desc: 'First installment being processed', date: 'Pending', completed: false, current: true },
      { title: 'Payment Disbursed', desc: 'Amount credited to your account', date: 'Pending', completed: false },
    ]
  },
  'SG-2024-87654321': {
    scheme: 'Ayushman Bharat Yojana',
    steps: [
      { title: 'Application Submitted', desc: 'Application received at CSC', date: '10 Feb 2026', completed: true },
      { title: 'Eligibility Verification', desc: 'SECC data matched successfully', date: '14 Feb 2026', completed: true },
      { title: 'e-Card Generation', desc: 'Ayushman e-Card generated', date: '18 Feb 2026', completed: true },
      { title: 'Card Dispatched', desc: 'Physical card sent to your address', date: '20 Feb 2026', completed: true },
    ]
  }
};

$('#trackBtn').addEventListener('click', () => {
  const arn = $('#trackerInput').value.trim().toUpperCase();
  const resultDiv = $('#trackerResult');

  if (!arn) {
    resultDiv.innerHTML = '<p style="color:var(--color-danger);text-align:center;">Please enter a valid ARN</p>';
    resultDiv.classList.add('visible');
    return;
  }

  const data = trackerData[arn];
  if (!data) {
    resultDiv.innerHTML = `
      <div style="text-align:center;padding:20px;">
        <p style="font-size:2rem;margin-bottom:8px;">🔍</p>
        <p style="font-weight:600;margin-bottom:4px;">No record found for "${arn}"</p>
        <p style="color:var(--text-secondary);font-size:0.9rem;">Try demo ARNs: <strong>SG-2024-12345678</strong> or <strong>SG-2024-87654321</strong></p>
      </div>
    `;
    resultDiv.classList.add('visible');
    return;
  }

  resultDiv.innerHTML = `
    <h3 style="margin-bottom:4px;">${data.scheme}</h3>
    <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:20px;">ARN: ${arn}</p>
    <div class="tracker-timeline">
      ${data.steps.map(step => `
        <div class="timeline-item ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <h4>${step.title}</h4>
            <p>${step.desc}</p>
            <span class="timeline-date">${step.date}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  resultDiv.classList.add('visible');
});

// ========== RENDER TESTIMONIALS ==========
function renderTestimonials() {
  const grid = $('#testimonialsGrid');
  grid.innerHTML = testimonials.map(t => `
    <div class="testimonial-card">
      <div class="testimonial-stars">${'★'.repeat(t.stars)}${'☆'.repeat(5 - t.stars)}</div>
      <p class="testimonial-text">"${t.text}"</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.avatar}</div>
        <div>
          <div class="testimonial-name">${t.name}</div>
          <div class="testimonial-location">${t.location}</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ========== RENDER PRICING ==========
function renderPricing() {
  const grid = $('#pricingGrid');
  grid.innerHTML = pricingPlans.map(p => `
    <div class="pricing-card ${p.popular ? 'popular' : ''}">
      ${p.popular ? '<span class="popular-badge">Most Popular</span>' : ''}
      <div class="pricing-name">${p.name}</div>
      <div class="pricing-price">
        <span class="pricing-amount">₹${p.price}</span>
        <span class="pricing-period">/ ${p.period}</span>
      </div>
      <ul class="pricing-features">
        ${p.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <button class="btn ${p.popular ? 'btn-primary' : 'btn-outline'} btn-block" onclick="openPaymentModal('${p.name}', ${p.price})">
        ${p.price === '0' ? 'Get Started Free' : 'Choose Plan'}
      </button>
    </div>
  `).join('');
}

// ========== RENDER FAQ ==========
function renderFAQ() {
  const list = $('#faqList');
  list.innerHTML = faqData.map((f, i) => `
    <div class="faq-item" data-faq="${i}">
      <button class="faq-question" aria-expanded="false">
        <span>${f.q}</span>
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer">
        <p>${f.a}</p>
      </div>
    </div>
  `).join('');

  $$('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isActive = item.classList.contains('active');
      // Close all
      $$('.faq-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      // Toggle current
      if (!isActive) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// ========== PAYMENT MODAL ==========
const paymentModal = $('#paymentModal');

function openPaymentModal(planName, price) {
  $('#paymentPlanInfo').textContent = `${planName} Plan — ₹${price}`;
  $('#payAmount').textContent = price;
  paymentModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  $(`#${id}`).classList.remove('active');
  document.body.style.overflow = '';
}

$('#paymentModalClose').addEventListener('click', () => closeModal('paymentModal'));
paymentModal.addEventListener('click', (e) => {
  if (e.target === paymentModal) closeModal('paymentModal');
});

// Payment tabs
$$('.payment-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    $$('.payment-tab').forEach(t => t.classList.remove('active'));
    $$('.payment-tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    $(`.payment-tab-content[data-content="${tab.dataset.tab}"]`).classList.add('active');
  });
});

// UPI app selection
$$('.upi-app').forEach(app => {
  app.addEventListener('click', () => {
    $$('.upi-app').forEach(a => a.classList.remove('selected'));
    app.classList.add('selected');
  });
});

// Bank selection
$$('.bank-option').forEach(bank => {
  bank.addEventListener('click', () => {
    $$('.bank-option').forEach(b => b.classList.remove('selected'));
    bank.classList.add('selected');
  });
});

// Pay button
$('#payNowBtn').addEventListener('click', () => {
  const btn = $('#payNowBtn');
  btn.textContent = 'Processing...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '✓ Payment Successful!';
    btn.style.background = 'var(--color-success)';
    setTimeout(() => {
      closeModal('paymentModal');
      btn.textContent = `Pay Now ₹${$('#payAmount').textContent}`;
      btn.style.background = '';
      btn.disabled = false;
    }, 2000);
  }, 2000);
});

// ========== AI QUIZ MODAL ==========
const aiQuizModal = $('#aiQuizModal');
let aiQuizStep = 0;
const aiQuizQuestions = [
  { q: 'What is your primary need?', options: ['Financial Support', 'Education', 'Healthcare', 'Housing'] },
  { q: 'What is your employment status?', options: ['Employed', 'Self-Employed', 'Unemployed', 'Student'] },
  { q: 'Do you have a valid Aadhaar card?', options: ['Yes', 'No', 'Applied', 'Not Sure'] },
];

function typeWriter(text, element, speed = 50) {
  return new Promise(resolve => {
    let i = 0;
    element.textContent = '';
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        resolve();
      }
    }
    type();
  });
}

// AI typing animation
async function runAITyping() {
  const textEl = $('#aiTypingText');
  const messages = [
    'Analyzing your profile...',
    'Matching with 500+ schemes...',
    'Found 12 eligible schemes!',
    'Top 3 recommendations ready ↓'
  ];
  for (const msg of messages) {
    await typeWriter(msg, textEl, 40);
    await new Promise(r => setTimeout(r, 1200));
  }
}

$('#startAiQuiz').addEventListener('click', () => {
  aiQuizStep = 0;
  renderAiQuizStep();
  aiQuizModal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

$('#aiQuizClose').addEventListener('click', () => closeModal('aiQuizModal'));
aiQuizModal.addEventListener('click', (e) => {
  if (e.target === aiQuizModal) closeModal('aiQuizModal');
});

function renderAiQuizStep() {
  const form = $('#aiQuizForm');
  if (aiQuizStep >= aiQuizQuestions.length) {
    // Show results
    form.innerHTML = `
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:3rem;margin-bottom:12px;">🎉</div>
        <h3 style="margin-bottom:8px;">AI Analysis Complete!</h3>
        <p style="color:var(--text-secondary);margin-bottom:20px;">Based on your answers, we found 8 matching schemes.</p>
        <div style="display:flex;flex-direction:column;gap:10px;text-align:left;">
          <div class="result-scheme"><span class="result-icon">🌾</span><div class="result-info"><div class="result-name">PM Kisan Samman Nidhi</div><div class="result-benefit">₹6,000/year</div></div><span class="result-match">96%</span></div>
          <div class="result-scheme"><span class="result-icon">💰</span><div class="result-info"><div class="result-name">PM Mudra Yojana</div><div class="result-benefit">Loan up to ₹10L</div></div><span class="result-match">91%</span></div>
          <div class="result-scheme"><span class="result-icon">💼</span><div class="result-info"><div class="result-name">Skill India Mission</div><div class="result-benefit">Free Training</div></div><span class="result-match">88%</span></div>
        </div>
        <button class="btn btn-primary" style="margin-top:20px;" onclick="closeModal('aiQuizModal');document.getElementById('schemes').scrollIntoView({behavior:'smooth'})">View All Schemes →</button>
      </div>
    `;
    return;
  }

  const question = aiQuizQuestions[aiQuizStep];
  form.innerHTML = `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.85rem;color:var(--text-muted);">
        <span>Question ${aiQuizStep + 1} of ${aiQuizQuestions.length}</span>
        <span>${Math.round(((aiQuizStep + 1) / aiQuizQuestions.length) * 100)}%</span>
      </div>
      <div class="progress-bar" style="margin-bottom:20px;">
        <div class="progress-fill" style="width:${((aiQuizStep + 1) / aiQuizQuestions.length) * 100}%;"></div>
      </div>
      <h3 style="margin-bottom:16px;">${question.q}</h3>
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${question.options.map((opt, i) => `
          <button class="btn btn-outline" style="justify-content:flex-start;padding:14px 18px;" onclick="aiQuizAnswer(this, '${opt}')">${String.fromCharCode(65 + i)}. ${opt}</button>
        `).join('')}
      </div>
    </div>
  `;
}

function aiQuizAnswer(btn, answer) {
  // Visual feedback
  btn.style.borderColor = 'var(--color-primary)';
  btn.style.background = 'rgba(26,86,219,0.08)';
  setTimeout(() => {
    aiQuizStep++;
    renderAiQuizStep();
  }, 400);
}

// ========== HERO SEARCH ==========
const searchSuggestions = {
  'pm kisan': ['PM Kisan Samman Nidhi', 'PM Kisan Credit Card'],
  'ayushman': ['Ayushman Bharat Yojana', 'Ayushman Health Account'],
  'education': ['National Scholarship Portal', 'PM Vidya Lakshmi', 'AICTE Scholarship'],
  'housing': ['PM Awas Yojana (Gramin)', 'PM Awas Yojana (Urban)', 'Rajiv Awas Yojana'],
  'pension': ['PM Shram Yogi Maan-dhan', 'Atal Pension Yojana', 'Indira Gandhi National Pension'],
  'scholarship': ['National Scholarship Portal', 'PM YASASVI', 'Central Sector Scheme'],
  'loan': ['PM Mudra Yojana', 'Stand Up India', 'PM SVANidhi'],
  'health': ['Ayushman Bharat', 'RSBY', 'PM Jan Arogya'],
};

$('#heroSearchBtn').addEventListener('click', performSearch);
$('#heroSearch').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') performSearch();
});

// Live suggestions
$('#heroSearch').addEventListener('input', (e) => {
  const val = e.target.value.toLowerCase().trim();
  const sugDiv = $('#searchSuggestions');
  if (!val) { sugDiv.innerHTML = ''; return; }

  const matches = [];
  Object.entries(searchSuggestions).forEach(([key, vals]) => {
    if (key.includes(val) || val.includes(key)) matches.push(...vals);
  });

  if (matches.length) {
    sugDiv.innerHTML = matches.slice(0, 5).map(m => `
      <div class="search-suggestion-item" style="padding:10px 16px;cursor:pointer;border-bottom:1px solid var(--border-color);font-size:0.9rem;color:var(--text-secondary);" onclick="document.getElementById('heroSearch').value='${m}';performSearch()">🔍 ${m}</div>
    `).join('');
  } else {
    sugDiv.innerHTML = '';
  }
});

function performSearch() {
  const query = $('#heroSearch').value.toLowerCase().trim();
  if (!query) return;

  // Filter schemes
  const matched = schemes.filter(s =>
    s.name.toLowerCase().includes(query) ||
    s.category.includes(query) ||
    s.tags.some(t => t.toLowerCase().includes(query)) ||
    s.dept.toLowerCase().includes(query)
  );

  // Scroll to schemes
  document.getElementById('schemes').scrollIntoView({ behavior: 'smooth' });

  if (matched.length) {
    const grid = $('#schemesGrid');
    grid.innerHTML = matched.map(s => `
      <div class="scheme-card" data-id="${s.id}" role="button" tabindex="0">
        <div class="scheme-header">
          <span class="scheme-icon">${s.icon}</span>
          <div class="scheme-meta">
            <div class="scheme-name">${s.name}</div>
            <div class="scheme-dept">${s.dept}</div>
          </div>
        </div>
        <div class="scheme-benefit">${s.benefit}</div>
        <p class="scheme-desc">${s.desc}</p>
        <div class="scheme-tags">
          ${s.tags.map(t => `<span class="scheme-tag">${t}</span>`).join('')}
        </div>
        <div class="scheme-footer">
          <span class="scheme-deadline">⏰ ${s.deadline}</span>
          <button class="btn btn-primary btn-sm" onclick="openSchemeModal(${s.id})">View Details</button>
        </div>
      </div>
    `).join('');

    // Reset filter tabs
    $$('.filter-tab').forEach(t => t.classList.remove('active'));
    $$('.filter-tab[data-filter="all"]')[0]?.classList.add('active');
  } else {
    $('#schemesGrid').innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:40px;">
        <p style="font-size:2rem;margin-bottom:8px;">🔍</p>
        <p style="font-weight:600;">No schemes found for "${query}"</p>
        <p style="color:var(--text-secondary);font-size:0.9rem;">Try different keywords or browse categories above.</p>
      </div>
    `;
  }
}

// ========== ANIMATED COUNTERS ==========
function animateCounters() {
  $$('.stat-number').forEach(el => {
    const target = parseInt(el.dataset.count);
    const duration = 2000;
    const start = performance.now();
    const suffix = el.nextElementSibling?.textContent || '';

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

// Intersection Observer for counters
const heroSection = document.getElementById('hero');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });
observer.observe(heroSection);

// ========== BACK TO TOP ==========
const backToTop = $('#backToTop');
window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 500);
});
backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ========== CTA BUTTONS ==========
$('#navCta').addEventListener('click', () => {
  document.getElementById('eligibility').scrollIntoView({ behavior: 'smooth' });
});
$('#ctaSearch').addEventListener('click', () => {
  document.getElementById('hero').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#heroSearch').focus(), 500);
});
$('#ctaEligibility').addEventListener('click', () => {
  document.getElementById('eligibility').scrollIntoView({ behavior: 'smooth' });
});

// ========== LOAD MORE ==========
$('#loadMoreSchemes').addEventListener('click', function() {
  this.textContent = 'Loading...';
  setTimeout(() => {
    // Add more scheme cards
    const grid = $('#schemesGrid');
    const extraSchemes = [
      { id: 13, name: 'PM Ujjwala Yojana', dept: 'Ministry of Petroleum', category: 'women', icon: '🔥', benefit: 'Free LPG Connection', desc: 'Free LPG connection to women from BPL families with support of ₹1,600 per connection.', tags: ['Women', 'BPL', 'LPG'], deadline: 'Open', match: 90 },
      { id: 14, name: 'PM Fasal Bima Yojana', dept: 'Ministry of Agriculture', category: 'agriculture', icon: '🌿', benefit: 'Crop Insurance', desc: 'Crop insurance scheme providing financial support to farmers in case of crop failure due to natural calamities.', tags: ['Farmers', 'Insurance', 'Crops'], deadline: 'Open', match: 86 },
      { id: 15, name: 'Atal Pension Yojana', dept: 'PFRDA', category: 'pension', icon: '🏛️', benefit: '₹1,000-5,000/month', desc: 'Pension scheme for unorganized sector workers providing guaranteed pension of ₹1,000 to ₹5,000 per month.', tags: ['Pension', 'Unorganized', 'Guaranteed'], deadline: 'Open', match: 84 },
    ];

    const html = extraSchemes.map(s => `
      <div class="scheme-card" data-id="${s.id}" role="button" tabindex="0" style="animation: slideUp 0.4s ease;">
        <div class="scheme-header">
          <span class="scheme-icon">${s.icon}</span>
          <div class="scheme-meta">
            <div class="scheme-name">${s.name}</div>
            <div class="scheme-dept">${s.dept}</div>
          </div>
        </div>
        <div class="scheme-benefit">${s.benefit}</div>
        <p class="scheme-desc">${s.desc}</p>
        <div class="scheme-tags">
          ${s.tags.map(t => `<span class="scheme-tag">${t}</span>`).join('')}
        </div>
        <div class="scheme-footer">
          <span class="scheme-deadline">⏰ ${s.deadline}</span>
          <button class="btn btn-primary btn-sm" onclick="openSchemeModal(${s.id})">View Details</button>
        </div>
      </div>
    `).join('');

    grid.insertAdjacentHTML('beforeend', html);
    this.textContent = 'No More Schemes';
    this.disabled = true;
    this.style.opacity = '0.6';
  }, 800);
});

// ========== KEYBOARD ACCESSIBILITY FOR MODALS ==========
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal('schemeModal');
    closeModal('paymentModal');
    closeModal('aiQuizModal');
  }
});

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderCategories();
  renderSchemes();
  renderTestimonials();
  renderPricing();
  renderFAQ();
  runAITyping();
  updateProgress();
  showStep(1);

  console.log('🏛️ SarkarGhar initialized successfully!');
});
