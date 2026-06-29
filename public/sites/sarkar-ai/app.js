/**
 * SARKAR AI - Government Services Portal
 * Main Application JavaScript
 * Features: Service rendering, Eligibility checker, Application tracker, FAQ accordion, Animations
 */

// ========== SERVICE DATA ==========
const servicesData = [
    {
        icon: 'fa-house',
        title: 'Housing Schemes',
        description: 'PM Awas Yojana, Pradhan Mantri Gramin Awas Yojana, and state housing benefits.',
        count: 45,
        color: '#3b82f6'
    },
    {
        icon: 'fa-graduation-cap',
        title: 'Education Scholarships',
        description: 'National Scholarship Portal, PM Vidyalaxmi, and merit-based scholarships.',
        count: 78,
        color: '#8b5cf6'
    },
    {
        icon: 'fa-wheat-awn',
        title: 'Agriculture Benefits',
        description: 'PM-KISAN, crop insurance, fertilizer subsidies, and farm equipment loans.',
        count: 62,
        color: '#059669'
    },
    {
        icon: 'fa-heart-pulse',
        title: 'Healthcare Schemes',
        description: 'Ayushman Bharat, PM-JAY, state health insurance, and free camps.',
        count: 55,
        color: '#ef4444'
    },
    {
        icon: 'fa-briefcase',
        title: 'Employment & Skill',
        description: 'PMKVY, MGNREGA, Startup India, and skill development programs.',
        count: 89,
        color: '#f59e0b'
    },
    {
        icon: 'fa-wheelchair',
        title: 'Social Welfare',
        description: 'Disability pensions, senior citizen schemes, and widow pensions.',
        count: 34,
        color: '#06b6d4'
    },
    {
        icon: 'fa-bolt',
        title: 'Energy & Utilities',
        description: 'Ujjwala Yojana, solar subsidies, and electricity bill waivers.',
        count: 28,
        color: '#eab308'
    },
    {
        icon: 'fa-scale-balanced',
        title: 'Legal & Financial Aid',
        description: 'Free legal aid, financial inclusion, and microfinance schemes.',
        count: 41,
        color: '#6366f1'
    }
];

// ========== TESTIMONIALS DATA ==========
const testimonialsData = [
    {
        text: 'I applied for PM Awas Yojana through Sarkar AI and got approved in just 18 days! The AI guided me through every step. Truly revolutionary.',
        name: 'Rajesh Kumar',
        location: 'Bihar',
        scheme: 'PM Awas Yojana',
        initials: 'RK'
    },
    {
        text: 'As a farmer, I didn\'t know about 5 schemes I was eligible for. Sarkar AI found them all and helped me apply. Got &#8377;6,000 from PM-KISAN within weeks.',
        name: 'Sunita Devi',
        location: 'Madhya Pradesh',
        scheme: 'PM-KISAN',
        initials: 'SD'
    },
    {
        text: 'The eligibility checker is amazing! It found scholarship schemes for my daughter that I never knew existed. Application was seamless.',
        name: 'Amit Patel',
        location: 'Gujarat',
        scheme: 'National Scholarship',
        initials: 'AP'
    },
    {
        text: 'I was skeptical at first, but Sarkar AI helped my village get 12 Ayushman Bharat cards in one day. The AI assistant speaks Hindi too!',
        name: 'Priya Sharma',
        location: 'Uttar Pradesh',
        scheme: 'Ayushman Bharat',
        initials: 'PS'
    },
    {
        text: 'Applied for Startup India through Sarkar AI. The auto-fill feature saved me hours of paperwork. Got my recognition number in 3 days!',
        name: 'Vikram Singh',
        location: 'Karnataka',
        scheme: 'Startup India',
        initials: 'VS'
    },
    {
        text: 'My elderly parents needed pension schemes. Sarkar AI identified the right schemes and even helped with document uploads. Lifesaver!',
        name: 'Deepak Joshi',
        location: 'Rajasthan',
        scheme: 'Senior Citizen Pension',
        initials: 'DJ'
    }
];

// ========== FAQ DATA ==========
const faqData = [
    {
        question: 'Is Sarkar AI an official government platform?',
        answer: 'Sarkar AI is a citizen assistance platform that helps you navigate government schemes. We are partnered with various state and central departments to provide accurate, up-to-date information and streamlined application processes.'
    },
    {
        question: 'Is it free to use Sarkar AI?',
        answer: 'Yes! Sarkar AI is completely free for all citizens. We believe every citizen deserves easy access to government benefits. There are no hidden charges or premium tiers.'
    },
    {
        question: 'How does the AI eligibility checker work?',
        answer: 'Our AI asks you a few simple questions about your income, category, and needs. It then cross-references your profile against 500+ government schemes and shows you only those you qualify for, with direct application links.'
    },
    {
        question: 'How long does it take to get a scheme approved?',
        answer: 'Approval times vary by scheme. Our AI provides real-time estimated timelines based on historical data. Most schemes are processed within 15-45 days. You can track your application status anytime.'
    },
    {
        question: 'Is my personal data safe on Sarkar AI?',
        answer: 'Absolutely. We use bank-grade encryption (256-bit SSL) and comply with India\'s data protection laws. Your data is never shared with third parties without consent. We only use it to help you apply for schemes.'
    },
    {
        question: 'Can I apply for multiple schemes at once?',
        answer: 'Yes! You can apply for as many schemes as you are eligible for. Our AI will guide you through each application and help you manage all your applications from a single dashboard.'
    },
    {
        question: 'What documents do I need to apply?',
        answer: 'Common documents include Aadhaar card, income certificate, bank account details, and passport photos. Sarkar AI tells you exactly which documents are needed for each scheme and helps you fetch them from DigiLocker.'
    },
    {
        question: 'I don\'t have internet access. Can I still use Sarkar AI?',
        answer: 'Sarkar AI works on basic mobile networks (2G/3G) and has a lightweight version for feature phones. You can also visit your nearest CSC center where operators can help you apply through Sarkar AI.'
    }
];

// ========== APPLICATION TRACKER DATA ==========
const trackerData = {
    'SA-2026-001234': {
        scheme: 'PM Awas Yojana',
        status: 'processing',
        appliedDate: '2026-05-15',
        steps: [
            { label: 'Applied', completed: true },
            { label: 'Document Verification', completed: true },
            { label: 'Field Inspection', completed: false, current: true },
            { label: 'Approval', completed: false },
            { label: 'Disbursement', completed: false }
        ]
    },
    'SA-2026-005678': {
        scheme: 'PM-KISAN',
        status: 'approved',
        appliedDate: '2026-04-10',
        steps: [
            { label: 'Applied', completed: true },
            { label: 'Document Verification', completed: true },
            { label: 'Aadhaar Verification', completed: true },
            { label: 'Approval', completed: true },
            { label: 'Disbursement', completed: true }
        ]
    },
    'SA-2026-009999': {
        scheme: 'Ayushman Bharat',
        status: 'pending',
        appliedDate: '2026-06-01',
        steps: [
            { label: 'Applied', completed: true },
            { label: 'Document Verification', completed: false },
            { label: 'Approval', completed: false },
            { label: 'Card Generation', completed: false }
        ]
    }
};

// ========== ELIGIBILITY SCHEME DATABASE ==========
const eligibilitySchemes = {
    'below1-housing': [
        { name: 'PM Awas Yojana (Gramin)', benefit: 'Up to &#8377;1,20,000 for house construction', ministry: 'Ministry of Rural Development', badge: 'High Priority' },
        { name: 'PM Awas Yojana (Urban)', benefit: 'Up to &#8377;2,50,000 interest subsidy', ministry: 'Ministry of Housing', badge: 'High Priority' }
    ],
    'below1-education': [
        { name: 'National Scholarship (Pre-Matric)', benefit: '&#8377;10,000 - &#8377;25,000 per year', ministry: 'Ministry of Education', badge: 'High Priority' },
        { name: 'PM Vidyalaxmi', benefit: 'Interest subsidy on education loans', ministry: 'Ministry of Education', badge: 'Popular' }
    ],
    'below1-agriculture': [
        { name: 'PM-KISAN', benefit: '&#8377;6,000 per year', ministry: 'Ministry of Agriculture', badge: 'High Priority' },
        { name: 'Pradhan Mantri Fasal Bima', benefit: 'Crop insurance up to &#8377;2,00,000', ministry: 'Ministry of Agriculture', badge: 'Popular' }
    ],
    'below1-health': [
        { name: 'Ayushman Bharat (PM-JAY)', benefit: 'Health cover up to &#8377;5,00,000', ministry: 'Ministry of Health', badge: 'High Priority' },
        { name: 'Rashtriya Swasthya Bima', benefit: 'Cashless treatment up to &#8377;30,000', ministry: 'Ministry of Labour', badge: 'Popular' }
    ],
    '1to3-housing': [
        { name: 'PM Awas Yojana (Urban)', benefit: 'Up to &#8377;1,00,000 interest subsidy', ministry: 'Ministry of Housing', badge: 'Popular' },
        { stateHousing: 'State Housing Board Scheme', benefit: 'Up to &#8377;50,000 assistance', ministry: 'State Government', badge: 'State' }
    ],
    '1to3-education': [
        { name: 'National Scholarship (Post-Matric)', benefit: '&#8377;25,000 - &#8377;1,00,000 per year', ministry: 'Ministry of Education', badge: 'High Priority' },
        { name: 'PM Vidyalaxmi', benefit: 'Collateral-free loans up to &#8377;7,50,000', ministry: 'Ministry of Education', badge: 'Popular' }
    ],
    '1to3-agriculture': [
        { name: 'PM-KISAN', benefit: '&#8377;6,000 per year', ministry: 'Ministry of Agriculture', badge: 'High Priority' },
        { name: 'Kisan Credit Card', benefit: 'Loan up to &#8377;3,00,000 at 4% interest', ministry: 'Ministry of Agriculture', badge: 'Popular' }
    ],
    '1to3-health': [
        { name: 'Ayushman Bharat (PM-JAY)', benefit: 'Health cover up to &#8377;5,00,000', ministry: 'Ministry of Health', badge: 'High Priority' },
        { name: 'State Health Insurance', benefit: 'State-specific health coverage', ministry: 'State Government', badge: 'State' }
    ],
    '3to5-education': [
        { name: 'PM Vidyalaxmi', benefit: 'Education loans up to &#8377;10,00,000', ministry: 'Ministry of Education', badge: 'Popular' },
        { name: 'Central Sector Scholarship', benefit: '&#8377;20,000 per year', ministry: 'Ministry of Education', badge: 'Merit-based' }
    ],
    '3to5-agriculture': [
        { name: 'Kisan Credit Card', benefit: 'Loan up to &#8377;3,00,000 at 4% interest', ministry: 'Ministry of Agriculture', badge: 'Popular' },
        { name: 'Agriculture Infrastructure Fund', benefit: '&#8377;2 crore for farm infrastructure', ministry: 'Ministry of Agriculture', badge: 'High Value' }
    ],
    '3to5-health': [
        { name: 'Ayushman Bharat (PM-JAY)', benefit: 'Health cover up to &#8377;5,00,000', ministry: 'Ministry of Health', badge: 'High Priority' },
        { name: 'CGHS (if govt employee)', benefit: 'Comprehensive health coverage', ministry: 'Ministry of Health', badge: 'Govt Only' }
    ],
    '3to5-housing': [
        { name: 'Home Loan (CLSS)', benefit: 'Interest subsidy under PMAY', ministry: 'Ministry of Housing', badge: 'Popular' },
        { name: 'State Housing Board Scheme', benefit: 'Up to &#8377;50,000 assistance', ministry: 'State Government', badge: 'State' }
    ],
    'above5-education': [
        { name: 'PM Vidyalaxmi', benefit: 'Education loans up to &#8377;20,00,000', ministry: 'Ministry of Education', badge: 'Popular' },
        { name: 'Education Loan (Interest Subsidy)', benefit: 'Interest subsidy for weaker sections', ministry: 'Ministry of Education', badge: 'Income-based' }
    ],
    'above5-housing': [
        { name: 'Home Loan (CLSS)', benefit: 'Interest subsidy under PMAY', ministry: 'Ministry of Housing', badge: 'Popular' },
        { name: 'State Housing Board Scheme', benefit: 'Up to &#8377;50,000 assistance', ministry: 'State Government', badge: 'State' }
    ],
    'above5-agriculture': [
        { name: 'Kisan Credit Card', benefit: 'Loan up to &#8377;3,00,000 at 4% interest', ministry: 'Ministry of Agriculture', badge: 'Popular' },
        { name: 'Agriculture Infrastructure Fund', benefit: '&#8377;2 crore for farm infrastructure', ministry: 'Ministry of Agriculture', badge: 'High Value' }
    ],
    'above5-health': [
        { name: 'Ayushman Bharat (PM-JAY)', benefit: 'Health cover up to ₹5,00,000 (if eligible)', ministry: 'Ministry of Health', badge: 'Conditional' }
    ],
    // ========== EMPLOYMENT & SKILL SCHEMES ==========
    'below1-employment': [
        { name: 'PMKVY 4.0', benefit: 'Free skill training + ₹8,000 stipend', ministry: 'Ministry of Skill Development', badge: 'High Priority' },
        { name: 'MGNREGA', benefit: '100 days guaranteed wage employment', ministry: 'Ministry of Rural Development', badge: 'High Priority' },
        { name: 'Pradhan Mantri Mudra Yojana', benefit: 'Loan up to ₹10,00,000 for micro enterprises', ministry: 'Ministry of Finance', badge: 'Popular' },
        { name: 'Stand-Up India', benefit: 'Loan ₹10L–₹1Cr for SC/ST & women entrepreneurs', ministry: 'Ministry of Finance', badge: 'Reserved Category' }
    ],
    '1to3-employment': [
        { name: 'PMKVY 4.0', benefit: 'Free skill training + certification', ministry: 'Ministry of Skill Development', badge: 'Popular' },
        { name: 'MGNREGA', benefit: '100 days guaranteed wage employment', ministry: 'Ministry of Rural Development', badge: 'High Priority' },
        { name: 'Pradhan Mantri Mudra Yojana', benefit: 'Loan up to ₹10,00,000 at low interest', ministry: 'Ministry of Finance', badge: 'Popular' }
    ],
    '3to5-employment': [
        { name: 'PMKVY 4.0', benefit: 'Advanced skill training programs', ministry: 'Ministry of Skill Development', badge: 'Popular' },
        { name: 'Startup India', benefit: 'Tax benefits + funding support for startups', ministry: 'Ministry of Commerce', badge: 'High Value' }
    ],
    'above5-employment': [
        { name: 'Startup India', benefit: 'Tax holiday + funding for recognized startups', ministry: 'Ministry of Commerce', badge: 'High Value' },
        { name: 'Atal Innovation Mission', benefit: 'Grants up to ₹20,00,000 for innovation', ministry: 'NITI Aayog', badge: 'Merit-based' }
    ],
    // ========== SOCIAL WELFARE SCHEMES ==========
    'below1-social_welfare': [
        { name: 'Indira Gandhi National Old Age Pension', benefit: '₹500–₹1,000/month for BPL seniors', ministry: 'Ministry of Rural Development', badge: 'High Priority' },
        { name: 'Indira Gandhi National Widow Pension', benefit: '₹500/month for BPL widows', ministry: 'Ministry of Rural Development', badge: 'High Priority' },
        { name: 'Indira Gandhi National Disability Pension', benefit: '₹500/month for BPL disabled', ministry: 'Ministry of Rural Development', badge: 'High Priority' }
    ],
    '1to3-social_welfare': [
        { name: 'National Social Assistance Programme', benefit: 'Pension for elderly, widows, disabled', ministry: 'Ministry of Rural Development', badge: 'Popular' },
        { name: 'State Disability Pension', benefit: 'State-specific disability assistance', ministry: 'State Government', badge: 'State' }
    ],
    'above5-social_welfare': [
        { name: 'National Social Assistance Programme', benefit: 'Pension (if eligible under state rules)', ministry: 'Ministry of Rural Development', badge: 'Conditional' }
    ]
};

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    renderServices();
    renderTestimonials();
    renderFAQ();
    renderStateSelector();
    initTrackerForm();
    initEligibilityForm();
    initAuthForms();
    initScrollAnimations();
    initStatCounters();
});

// ========== NAVIGATION ==========
function initNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navbar = document.getElementById('navbar');

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('open');
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
        });
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(function(link) {
        link.addEventListener('click', function() {
            navToggle.classList.remove('active');
            navMenu.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Login button
    document.getElementById('openLoginBtn').addEventListener('click', function(e) {
        e.preventDefault();
        openModal('loginModal');
    });
}

// ========== RENDER SERVICES ==========
function renderServices() {
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    grid.innerHTML = servicesData.map(function(service) {
        return '<div class="service-card" role="listitem" tabindex="0" aria-label="' + service.title + ' - ' + service.count + ' schemes available">' +
            '<div class="service-icon" style="background: ' + service.color + '">' +
                '<i class="fas ' + service.icon + '" aria-hidden="true"></i>' +
            '</div>' +
            '<h3>' + service.title + '</h3>' +
            '<p>' + service.description + '</p>' +
            '<span class="service-count">' + service.count + ' Schemes</span>' +
        '</div>';
    }).join('');
}

// ========== RENDER TESTIMONIALS ==========
function renderTestimonials() {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;

    grid.innerHTML = testimonialsData.map(function(t) {
        return '<div class="testimonial-card" role="listitem">' +
            '<div class="testimonial-stars" aria-label="5 star rating">' +
                '<i class="fas fa-star" aria-hidden="true"></i>' +
                '<i class="fas fa-star" aria-hidden="true"></i>' +
                '<i class="fas fa-star" aria-hidden="true"></i>' +
                '<i class="fas fa-star" aria-hidden="true"></i>' +
                '<i class="fas fa-star" aria-hidden="true"></i>' +
            '</div>' +
            '<p class="testimonial-text">"' + t.text + '"</p>' +
            '<div class="testimonial-author">' +
                '<div class="author-avatar">' + t.initials + '</div>' +
                '<div class="author-info">' +
                    '<strong>' + t.name + '</strong>' +
                    '<span>' + t.location + ' &bull; ' + t.scheme + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
}

// ========== RENDER FAQ ==========
function renderFAQ() {
    const list = document.getElementById('faqList');
    if (!list) return;

    list.innerHTML = faqData.map(function(faq, index) {
        return '<div class="faq-item">' +
            '<button class="faq-question" aria-expanded="false" aria-controls="faq-answer-' + index + '">' +
                '<span>' + faq.question + '</span>' +
                '<i class="fas fa-chevron-down" aria-hidden="true"></i>' +
            '</button>' +
            '<div class="faq-answer" id="faq-answer-' + index + '">' +
                '<p>' + faq.answer + '</p>' +
            '</div>' +
        '</div>';
    }).join('');

    // Accordion functionality
    document.querySelectorAll('.faq-question').forEach(function(btn) {
        btn.addEventListener('click', function() {
            const item = this.parentElement;
            const isOpen = item.classList.contains('open');

            // Close all
            document.querySelectorAll('.faq-item').forEach(function(fi) {
                fi.classList.remove('open');
                fi.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });

            // Open clicked (if wasn't already open)
            if (!isOpen) {
                item.classList.add('open');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

// ========== STATE-SPECIFIC SCHEMES ==========
var stateSchemes = {
    'up': [
        { name: 'Mukhyamantri Awas Yojana', benefit: '₹1,50,000 for housing', ministry: 'UP State Govt', badge: 'State' },
        { name: 'Kisan Kalyan Yojana', benefit: '₹3,000/year to farmers', ministry: 'UP State Govt', badge: 'State' },
        { name: 'Lok Kalyan Yojana', benefit: 'Free ration for BPL families', ministry: 'UP State Govt', badge: 'State' }
    ],
    'bihar': [
        { name: 'Mukhyamantri Kanya Suraksha Yojana', benefit: '₹2,00,000 for girl child', ministry: 'Bihar State Govt', badge: 'State' },
        { name: 'Bihar Student Credit Card', benefit: 'Education loan up to ₹4,00,000', ministry: 'Bihar State Govt', badge: 'Popular' },
        { name: 'Jal-Jeevan-Hariyali', benefit: 'Free water & irrigation support', ministry: 'Bihar State Govt', badge: 'State' }
    ],
    'mp': [
        { name: 'Ladli Laxmi Yojana', benefit: '₹1,00,000 for girl child', ministry: 'MP State Govt', badge: 'State' },
        { name: 'Mukhyamantri Kisan Kalyan Yojana', benefit: '₹4,000/year to farmers', ministry: 'MP State Govt', badge: 'State' },
        { name: 'Mukhyamantri Jan Kalyan Yojana', benefit: 'Free medical treatment', ministry: 'MP State Govt', badge: 'State' }
    ],
    'rajasthan': [
        { name: 'Rajiv Gandhi Jeevan Jyoti Yojana', benefit: 'Health cover up to ₹3,00,000', ministry: 'Rajasthan State Govt', badge: 'State' },
        { name: 'Mukhyamantri Rajshree Yojana', benefit: '₹50,000 for girl child', ministry: 'Rajasthan State Govt', badge: 'State' },
        { name: 'Indira Gandhi Shahri Wakf Board', benefit: 'Urban housing assistance', ministry: 'Rajasthan State Govt', badge: 'State' }
    ],
    'maharashtra': [
        { name: 'Mahatma Jyotiba Phule Jan Arogya Yojana', benefit: 'Health cover up to ₹1,50,000', ministry: 'Maharashtra State Govt', badge: 'State' },
        { name: 'Mukhyamantri Majhi Ladki Bahin Yojana', benefit: '₹1,500/month for women', ministry: 'Maharashtra State Govt', badge: 'Popular' },
        { name: 'Maharashtra crop insurance', benefit: 'Crop insurance up to ₹50,000', ministry: 'Maharashtra State Govt', badge: 'State' }
    ],
    'gujarat': [
        { name: 'Mukhyamantri Amrutum Yojana', benefit: 'Health cover up to ₹5,00,000', ministry: 'Gujarat State Govt', badge: 'State' },
        { name: 'Vahli Dikri Yojana', benefit: '₹1,00,000 for girl child', ministry: 'Gujarat State Govt', badge: 'State' },
        { name: 'Mukhyamantri Kisan Sahay Yojana', benefit: '₹6,000/year to farmers', ministry: 'Gujarat State Govt', badge: 'State' }
    ],
    'karnataka': [
        { name: 'Gruha Jyothi', benefit: 'Free electricity up to 200 units', ministry: 'Karnataka State Govt', badge: 'Popular' },
        { name: 'Shakti', benefit: 'Free bus travel for women', ministry: 'Karnataka State Govt', badge: 'Popular' },
        { name: 'Anna Bhagya', benefit: 'Free rice for BPL families', ministry: 'Karnataka State Govt', badge: 'State' }
    ],
    'tamil_nadu': [
        { name: 'Amma Two Wheeler Scheme', benefit: 'Subsidy on two-wheelers for women', ministry: 'Tamil Nadu State Govt', badge: 'Popular' },
        { name: 'Kalaignar Magalir Urimai Thogai', benefit: '₹1,000/month for women', ministry: 'Tamil Nadu State Govt', badge: 'Popular' },
        { name: 'Free Laptop Scheme', benefit: 'Free laptop for college students', ministry: 'Tamil Nadu State Govt', badge: 'Education' }
    ],
    'west_bengal': [
        { name: 'Lakshmir Bhandar', benefit: '₹1,000/month for women', ministry: 'West Bengal State Govt', badge: 'Popular' },
        { name: 'Kanyashree Prakalpa', benefit: 'Annual scholarship ₹12,000 for girls', ministry: 'West Bengal State Govt', badge: 'Popular' },
        { name: 'Swasthya Sathi', benefit: 'Health cover up to ₹5,00,000', ministry: 'West Bengal State Govt', badge: 'State' }
    ],
    'telangana': [
        { name: 'Rythu Bandhu', benefit: '₹10,000/year per acre to farmers', ministry: 'Telangana State Govt', badge: 'High Priority' },
        { name: 'Aarogyasri', benefit: 'Health cover up to ₹10,00,000', ministry: 'Telangana State Govt', badge: 'State' },
        { name: 'KCR Kit', benefit: '₹15,000 maternity support', ministry: 'Telangana State Govt', badge: 'State' }
    ],
    'default': [
        { name: 'State-specific schemes available', benefit: 'Check your state portal for more', ministry: 'State Government', badge: 'Explore' }
    ]
};

// ========== STATE SELECTOR RENDER ==========
function renderStateSelector() {
    var container = document.getElementById('stateSelector');
    if (!container) return;

    var states = [
        { value: 'up', label: 'Uttar Pradesh' },
        { value: 'bihar', label: 'Bihar' },
        { value: 'mp', label: 'Madhya Pradesh' },
        { value: 'rajasthan', label: 'Rajasthan' },
        { value: 'maharashtra', label: 'Maharashtra' },
        { value: 'gujarat', label: 'Gujarat' },
        { value: 'karnataka', label: 'Karnataka' },
        { value: 'tamil_nadu', label: 'Tamil Nadu' },
        { value: 'west_bengal', label: 'West Bengal' },
        { value: 'telangana', label: 'Telangana' },
        { value: 'default', label: 'Other / All States' }
    ];

    container.innerHTML = '<option value="">Select your state (optional)</option>' +
        states.map(function(s) {
            return '<option value="' + s.value + '">' + s.label + '</option>';
        }).join('');
}
function initTrackerForm() {
    const form = document.getElementById('trackerForm');
    const result = document.getElementById('trackerResult');

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const appId = document.getElementById('appIdInput').value.trim().toUpperCase();

        if (!appId) {
            showToast('Please enter an Application ID');
            return;
        }

        // Check if ID matches known data
        const data = trackerData[appId];

        if (data) {
            const statusClass = data.status;
            const statusText = data.status === 'approved' ? 'Approved' :
                               data.status === 'processing' ? 'Under Review' : 'Pending Verification';

            let stepsHTML = data.steps.map(function(step) {
                let dotClass = '';
                if (step.completed) dotClass = 'completed';
                if (step.current) dotClass = 'current';

                return '<div class="timeline-step">' +
                    '<div class="timeline-dot ' + dotClass + '"></div>' +
                    '<span class="timeline-label">' + step.label + '</span>' +
                '</div>';
            }).join('');

            result.innerHTML =
                '<div class="result-status">' +
                    '<span class="status-dot ' + statusClass + '"></span>' +
                    '<div class="status-text">' +
                        '<h4>' + data.scheme + '</h4>' +
                        '<p>Status: ' + statusText + ' | Applied: ' + data.appliedDate + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="result-timeline">' + stepsHTML + '</div>';
            result.style.display = 'block';
            showToast('Application found!');
        } else {
            result.innerHTML =
                '<div class="result-status">' +
                    '<span class="status-dot pending"></span>' +
                    '<div class="status-text">' +
                        '<h4>Application Not Found</h4>' +
                        '<p>We couldn\'t find an application with ID "' + appId + '". Please check the ID and try again. Demo IDs: SA-2026-001234, SA-2026-005678, SA-2026-009999</p>' +
                    '</div>' +
                '</div>';
            result.style.display = 'block';
            showToast('Application ID not found');
        }
    });
}

// ========== ELIGIBILITY CHECKER ==========
/**
 * Validates the current step's radio inputs are selected.
 * Returns true if valid, shows toast and returns false otherwise.
 */
function validateStep(stepNum) {
    var stepEl = document.getElementById('step' + stepNum);
    if (!stepEl) return false;
    var selected = stepEl.querySelector('input[type="radio"]:checked');
    if (!selected) {
        var labels = { 1: 'income range', 2: 'category', 3: 'benefit type (Housing, Education, Agriculture, Health, Employment, or Social Welfare)' };
        showToast('Please select ' + (labels[stepNum] || 'an option') + ' before proceeding.');
        return false;
    }
    return true;
}

function nextStep(step) {
    // Validate current step (step - 1) before advancing
    if (!validateStep(step - 1)) return;

    document.querySelectorAll('.eligibility-step').forEach(function(s) {
        s.classList.remove('active');
    });
    document.getElementById('step' + step).classList.add('active');

    // Update progress
    var progress = (step / 3) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = 'Question ' + step + ' of 3';
}

function prevStep(step) {
    nextStep(step);
}

function initEligibilityForm() {
    const form = document.getElementById('eligibilityForm');
    var result = document.getElementById('eligibilityResult');

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        var income = document.querySelector('input[name="income"]:checked');
        var category = document.querySelector('input[name="category"]:checked');
        var benefit = document.querySelector('input[name="benefit"]:checked');

        if (!income || !category || !benefit) {
            showToast('Please answer all questions');
            return;
        }

        // Find matching schemes
        var key = income.value + '-' + benefit.value;
        var schemes = eligibilitySchemes[key] || [];

        // Add category-specific schemes
        if (category.value === 'sc' || category.value === 'st') {
            schemes.push({
                name: 'Post-Matric Scholarship (' + category.value.toUpperCase() + ')',
                benefit: 'Full tuition + &#8377;550/month maintenance',
                ministry: 'Ministry of Social Justice',
                badge: 'Reserved Category'
            });
        }

        // Add state-specific schemes
        var stateSelect = document.getElementById('stateSelector');
        var selectedState = stateSelect ? stateSelect.value : '';
        var stateSchemesList = [];
        if (selectedState && stateSchemes[selectedState]) {
            stateSchemesList = stateSchemes[selectedState];
        }

        // Combine central + state schemes
        var allSchemes = schemes.concat(stateSchemesList);
        var totalCount = allSchemes.length;
        var centralCount = schemes.length;
        var stateCount = stateSchemesList.length;

        if (totalCount > 0) {
            var schemesHTML = allSchemes.map(function(s) {
                var iconColor = s.badge === 'High Priority' ? '#ef4444' :
                                s.badge === 'Popular' ? '#3b82f6' :
                                s.badge === 'State' ? '#8b5cf6' : '#059669';
                var icon = s.badge === 'High Priority' ? 'fa-star' :
                           s.badge === 'Popular' ? 'fa-thumbs-up' :
                           s.badge === 'State' ? 'fa-map-marker-alt' : 'fa-check';

                return '<div class="scheme-match">' +
                    '<div class="scheme-match-icon" style="background: ' + iconColor + '">' +
                        '<i class="fas ' + icon + '" aria-hidden="true"></i>' +
                    '</div>' +
                    '<div class="scheme-match-info">' +
                        '<h4>' + s.name + '</h4>' +
                        '<p>' + s.benefit + '</p>' +
                        '<p><strong>' + s.ministry + '</strong></p>' +
                        '<span class="scheme-match-badge">' + s.badge + '</span>' +
                    '</div>' +
                '</div>';
            }).join('');

            var summaryText = 'You are eligible for ' + totalCount + ' scheme(s)!';
            if (stateCount > 0 && centralCount > 0) {
                summaryText = 'You are eligible for ' + centralCount + ' central + ' + stateCount + ' state scheme(s)!';
            } else if (stateCount > 0 && centralCount === 0) {
                summaryText = 'No central schemes match, but we found ' + stateCount + ' state-specific scheme(s)!';
            }

            var stateNote = '';
            if (!selectedState) {
                stateNote = '<div class="eligibility-state-note"><i class="fas fa-info-circle" aria-hidden="true"></i> Select your state above to see additional state-specific schemes.</div>';
            }

            result.innerHTML = '<h3><i class="fas fa-magic" style="color: var(--color-primary);"></i> ' + summaryText + '</h3>' +
                stateNote + schemesHTML +
                '<div style="margin-top: 1rem; text-align: center;">' +
                    '<a href="#" class="btn btn-primary btn-lg" onclick="showToast(\'Redirecting to application...\'); return false;">' +
                        '<i class="fas fa-file-signature" aria-hidden="true"></i> Apply Now' +
                    '</a>' +
                '</div>';
        } else {
            var stateMsg = '';
            if (selectedState && stateSchemes[selectedState] && stateSchemes[selectedState].length > 0) {
                // This shouldn't happen given the logic above, but just in case
                stateMsg = '<p style="color: var(--color-gray-500); margin-top: 0.5rem;">We found state-specific schemes for your selection. Please try again.</p>';
            } else {
                stateMsg = '<p style="color: var(--color-gray-500); margin-top: 0.5rem;">Based on your inputs, we couldn\'t find exact matches. However, you may still qualify for state-specific schemes — try selecting your state above, or visit your nearest CSC center. Helpline: 1800-XXX-XXXX</p>';
            }
            result.innerHTML = '<h3><i class="fas fa-info-circle" style="color: var(--color-accent);"></i> No exact matches found</h3>' + stateMsg;
        }

        result.style.display = 'block';
        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('Eligibility check complete!');
    });
}

// ========== AUTH FORMS ==========
function initAuthForms() {
    // Login form
    var loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('Login successful! Welcome back.');
            closeModal('loginModal');
            this.reset();
        });
    }

    // Signup form
    var signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('Account created successfully!');
            closeModal('signupModal');
            this.reset();
        });
    }

    // Send OTP button — validate mobile number first
    var sendOtpBtn = document.getElementById('sendOtpBtn');
    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', function() {
            var mobileInput = document.getElementById('loginMobile');
            var mobile = mobileInput ? mobileInput.value.trim() : '';

            // Validate 10-digit Indian mobile number
            if (!/^[6-9]\d{9}$/.test(mobile)) {
                showToast('Please enter a valid 10-digit mobile number');
                if (mobileInput) mobileInput.focus();
                return;
            }

            showToast('OTP sent to +91-' + mobile);
            this.textContent = 'Resend OTP';
        });
    }
}

// ========== MODAL FUNCTIONS ==========
function openModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function switchToSignup() {
    closeModal('loginModal');
    openModal('signupModal');
}

function switchToLogin() {
    closeModal('signupModal');
    openModal('loginModal');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(function(modal) {
            if (modal.style.display === 'flex') {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
});

// ========== TOAST NOTIFICATIONS ==========
function showToast(message) {
    var toast = document.getElementById('toast');
    var toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.style.display = 'block';
        setTimeout(function() {
            toast.style.display = 'none';
        }, 3000);
    }
}

// ========== SCROLL ANIMATIONS ==========
function initScrollAnimations() {
    // Intersection Observer for fade-in animations
    var observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe service cards, step cards, testimonial cards
    document.querySelectorAll('.service-card, .step-card, .testimonial-card').forEach(function(el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ========== STAT COUNTER ANIMATION ==========
function initStatCounters() {
    var counters = document.querySelectorAll('.stat-number[data-count]');
    var observerOptions = { threshold: 0.5 };

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var el = entry.target;
                var target = parseInt(el.getAttribute('data-count'));
                var duration = 2000;
                var step = target / (duration / 16);
                var current = 0;

                var timer = setInterval(function() {
                    current += step;
                    if (current >= target) {
                        el.textContent = target;
                        clearInterval(timer);
                    } else {
                        el.textContent = Math.floor(current);
                    }
                }, 16);

                observer.unobserve(el);
            }
        });
    }, observerOptions);

    counters.forEach(function(counter) {
        observer.observe(counter);
    });
}

// ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        var href = this.getAttribute('href');
        if (href === '#') return;

        var target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            var offset = 70; // navbar height
            var position = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: position,
                behavior: 'smooth'
            });
        }
    });
});
