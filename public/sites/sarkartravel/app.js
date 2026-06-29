/**
 * SarkarTravel - Main Application JavaScript
 * Handles: dark mode, mobile menu, search tabs, FAQ accordion,
 * payment modal, smooth scrolling, navbar scroll effect,
 * animated counters, and form interactions.
 */

// ==================== //
// DOM READY            //
// ==================== //
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initMobileMenu();
    initNavbarScroll();
    initSearchTabs();
    initPaymentTabs();
    initFAQAccordion();
    initPaymentModal();
    initSmoothScroll();
    initAnimatedCounters();
    initSearchForms();
    initSwapButtons();
});

// ==================== //
// DARK MODE TOGGLE     //
// ==================== //
function initDarkMode() {
    const toggle = document.getElementById('darkModeToggle');
    const icon = toggle.querySelector('.toggle-icon');

    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('sarkartravel-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.textContent = '☀️';
    }

    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            icon.textContent = '🌙';
            localStorage.setItem('sarkartravel-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            icon.textContent = '☀️';
            localStorage.setItem('sarkartravel-theme', 'dark');
        }
    });
}

// ==================== //
// MOBILE MENU          //
// ==================== //
function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('mobileMenu');
    const links = menu.querySelectorAll('.mobile-nav-link');

    toggle.addEventListener('click', () => {
        const isOpen = menu.classList.contains('open');
        menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', !isOpen);

        // Animate hamburger
        const hamburgers = toggle.querySelectorAll('.hamburger');
        hamburgers.forEach((h, i) => {
            if (!isOpen) {
                h.style.transform = i === 0 ? 'rotate(45deg) translate(5px, 5px)' :
                                    i === 1 ? 'opacity(0)' :
                                    'rotate(-45deg) translate(5px, -5px)';
            } else {
                h.style.transform = '';
            }
        });
    });

    // Close menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.querySelectorAll('.hamburger').forEach(h => h.style.transform = '');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && !toggle.contains(e.target) && menu.classList.contains('open')) {
            menu.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.querySelectorAll('.hamburger').forEach(h => h.style.transform = '');
        }
    });
}

// ==================== //
// NAVBAR SCROLL EFFECT //
// ==================== //
function initNavbarScroll() {
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ==================== //
// SEARCH TABS          //
// ==================== //
function initSearchTabs() {
    const tabs = document.querySelectorAll('.search-tab');
    const forms = document.querySelectorAll('.search-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update tab active state
            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            // Show corresponding form
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetTab}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });
}

// ==================== //
// PAYMENT TABS         //
// ==================== //
function initPaymentTabs() {
    const tabs = document.querySelectorAll('.payment-tab');
    const forms = document.querySelectorAll('.payment-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.paytab;

            tabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${targetTab}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });
}

// ==================== //
// FAQ ACCORDION        //
// ==================== //
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                    otherItem.querySelector('.faq-answer').setAttribute('aria-hidden', 'true');
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                question.setAttribute('aria-expanded', 'false');
                answer.setAttribute('aria-hidden', 'true');
            } else {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
                answer.setAttribute('aria-hidden', 'false');
            }
        });
    });
}

// ==================== //
// PAYMENT MODAL        //
// ==================== //
function initPaymentModal() {
    const modal = document.getElementById('paymentModal');
    const closeBtn = document.getElementById('modalClose');
    const payBtn = document.getElementById('payBtn');
    const cardPayBtn = document.getElementById('cardPayBtn');
    const netBankPayBtn = document.getElementById('netBankPayBtn');

    // Close button
    closeBtn.addEventListener('click', closePaymentModal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closePaymentModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closePaymentModal();
        }
    });

    // UPI Pay button
    if (payBtn) {
        payBtn.addEventListener('click', () => {
            const upiId = document.getElementById('upi-id').value;
            if (!upiId) {
                alert('Please enter your UPI ID');
                return;
            }
            showPaymentSuccess();
        });
    }

    // Card Pay button
    if (cardPayBtn) {
        cardPayBtn.addEventListener('click', () => {
            const cardNum = document.getElementById('card-number').value;
            if (!cardNum) {
                alert('Please enter your card number');
                return;
            }
            showPaymentSuccess();
        });
    }

    // Net Banking Pay button
    if (netBankPayBtn) {
        netBankPayBtn.addEventListener('click', () => {
            const bank = document.getElementById('bank-select').value;
            if (!bank) {
                alert('Please select your bank');
                return;
            }
            showPaymentSuccess();
        });
    }
}

// Open payment modal with amount and plan name
function openPaymentModal(amount, planName) {
    const modal = document.getElementById('paymentModal');
    const amountEl = document.getElementById('paymentAmount');

    amountEl.textContent = `₹${amount}`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Store amount for success message
    modal.dataset.amount = amount;
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Reset forms after a delay
    setTimeout(() => {
        document.querySelectorAll('.payment-form input').forEach(input => input.value = '');
        document.getElementById('bank-select').selectedIndex = 0;
        document.getElementById('paymentSuccess').style.display = 'none';
        document.querySelectorAll('.payment-form').forEach(f => f.style.display = '');
    }, 300);
}

// Show payment success message
function showPaymentSuccess() {
    const amount = document.getElementById('paymentModal').dataset.amount || '499';
    document.getElementById('successAmount').textContent = `₹${amount}`;

    // Hide all forms
    document.querySelectorAll('.payment-form').forEach(f => f.style.display = 'none');
    document.querySelector('.payment-tabs').style.display = 'none';

    // Show success
    document.getElementById('paymentSuccess').style.display = 'block';
}

// ==================== //
// SMOOTH SCROLLING     //
// ==================== //
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                const navHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ==================== //
// ANIMATED COUNTERS    //
// ==================== //
function initAnimatedCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.dataset.target);
                const suffix = counter.textContent.replace(/[0-9]/g, '');
                animateCounter(counter, target, suffix);
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target, suffix) {
    let current = 0;
    const increment = Math.max(1, Math.floor(target / 60));
    const duration = 1500;
    const stepTime = duration / (target / increment);

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = current + suffix;
    }, stepTime);
}

// ==================== //
// SEARCH FORMS         //
// ==================== //
function initSearchForms() {
    const forms = document.querySelectorAll('.search-form');

    forms.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get all form values
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                data[key] = value;
            });

            // Show a simulated search result
            const btn = form.querySelector('.btn-search');
            const originalText = btn.textContent;
            btn.textContent = '⏳ Searching...';
            btn.disabled = true;

            setTimeout(() => {
                btn.textContent = originalText;
                btn.disabled = false;
                alert('🔍 Search completed! In a real app, results would be displayed here.\n\nThis is a demo of the search functionality.');
            }, 1500);
        });
    });
}

// ==================== //
// SWAP BUTTONS         //
// ==================== //
function initSwapButtons() {
    document.querySelectorAll('.swap-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const row = btn.closest('.search-row');
            const fields = row.querySelectorAll('.search-field');
            if (fields.length >= 2) {
                const input1 = fields[0].querySelector('input');
                const input2 = fields[1].querySelector('input');
                const temp = input1.value;
                input1.value = input2.value;
                input2.value = temp;
            }
        });
    });
}

// ==================== //
// SET MIN DATE         //
// ==================== //
// Set minimum date for all date inputs to today
document.querySelectorAll('input[type="date"]').forEach(input => {
    const today = new Date().toISOString().split('T')[0];
    input.setAttribute('min', today);
});
