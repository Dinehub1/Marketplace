/* ============================================
   SarkarLegal - Legal Services Portal
   Main JavaScript File
   ============================================ */

// ============================================
// DOM ELEMENTS
// ============================================
const navbar = document.getElementById('navbar');
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');
const themeToggle = document.getElementById('themeToggle');
const backToTop = document.getElementById('backToTop');
const paymentModal = document.getElementById('paymentModal');
const faqItems = document.querySelectorAll('.faq-item');

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Add scrolled class to navbar
    if (scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Show/hide back to top button
    if (scrollY > 500) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }

    // Update active nav link based on scroll position
    updateActiveNavLink();
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================
if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', !isExpanded);
    });
}

// Close mobile menu when a link is clicked
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (mobileToggle) {
            mobileToggle.classList.remove('active');
            navLinks.classList.remove('active');
            mobileToggle.setAttribute('aria-expanded', 'false');
        }
    });
});

// ============================================
// ACTIVE NAV LINK ON SCROLL
// ============================================
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// ============================================
// DARK MODE TOGGLE
// ============================================
function initTheme() {
    // Check for saved theme preference or respect OS preference
    const savedTheme = localStorage.getItem('sarkarlegal-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.removeAttribute('data-theme');
        updateThemeIcon(false);
    }
}

function updateThemeIcon(isDark) {
    if (themeToggle) {
        themeToggle.querySelector('.theme-icon').textContent = isDark ? '☀️' : '🌙';
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('sarkarlegal-theme', 'light');
            updateThemeIcon(false);
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('sarkarlegal-theme', 'dark');
            updateThemeIcon(true);
        }
    });
}

// Initialize theme on page load
initTheme();

// ============================================
// BACK TO TOP BUTTON
// ============================================
if (backToTop) {
    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ============================================
// FAQ ACCORDION
// ============================================
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        const isExpanded = question.getAttribute('aria-expanded') === 'true';

        // Close all other FAQ items
        faqItems.forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            }
        });

        // Toggle current item
        item.classList.toggle('active');
        question.setAttribute('aria-expanded', !isExpanded);
    });
});

// ============================================
// UPI PAYMENT MODAL
// ============================================
let selectedPlan = { name: 'professional', amount: 999 };

function openPaymentModal(plan, amount) {
    selectedPlan = { name: plan, amount: amount };

    // Update modal content
    document.getElementById('selectedPlanName').textContent = plan;
    document.getElementById('selectedPlanAmount').textContent = amount;

    // Show modal
    paymentModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling

    // Focus management for accessibility
    setTimeout(() => {
        const closeBtn = paymentModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.focus();
    }, 100);
}

function closePaymentModal() {
    paymentModal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// Close modal on overlay click
paymentModal.addEventListener('click', (e) => {
    if (e.target === paymentModal) {
        closePaymentModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && paymentModal.classList.contains('active')) {
        closePaymentModal();
    }
});

// ============================================
// UPI PAYMENT FUNCTIONS
// ============================================
function verifyUpi() {
    const upiId = document.getElementById('upiId').value.trim();

    if (!upiId) {
        alert('Please enter your UPI ID');
        return;
    }

    // Basic UPI ID validation
    const upiRegex = /^[\w.-]+@[\w]+$/;
    if (!upiRegex.test(upiId)) {
        alert('Please enter a valid UPI ID (e.g., yourname@paytm)');
        return;
    }

    // Simulate payment processing
    alert(`Payment request sent to ${upiId}.\n\nPlease approve the payment in your UPI app.\n\nAmount: ₹${selectedPlan.amount}/month\nPlan: ${selectedPlan.name}`);
}

function payWithApp(app) {
    const appNames = {
        'gpay': 'Google Pay',
        'phonepe': 'PhonePe',
        'paytm': 'Paytm',
        'bhim': 'BHIM'
    };

    alert(`Opening ${appNames[app]}...\n\nAmount: ₹${selectedPlan.amount}/month\nPlan: ${selectedPlan.name}\n\nPlease complete the payment in the ${appNames[app]} app.`);
}

// ============================================
// COUNTER ANIMATION (Hero Stats)
// ============================================
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000; // 2 seconds
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * easeOut);

            counter.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
    });
}

// Trigger counter animation when hero section is visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.3 });

const heroSection = document.getElementById('hero');
if (heroSection) {
    heroObserver.observe(heroSection);
}

// ============================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const navHeight = navbar ? navbar.offsetHeight : 0;
            const targetPosition = targetElement.offsetTop - navHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// INTERSECTION OBSERVER FOR SCROLL ANIMATIONS
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for scroll animations
document.querySelectorAll('.feature-card, .step, .pricing-card, .testimonial-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    scrollObserver.observe(el);
});

// ============================================
// NAVBAR HIDE ON SCROLL DOWN, SHOW ON SCROLL UP
// ============================================
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 200) {
        // Scrolling down - hide navbar
        navbar.style.transform = 'translateY(-100%)';
    } else {
        // Scrolling up - show navbar
        navbar.style.transform = 'translateY(0)';
    }

    lastScrollY = currentScrollY;
});

// Add transition to navbar for smooth hide/show
if (navbar) {
    navbar.style.transition = 'transform 0.3s ease, background-color 0.3s ease';
}

// ============================================
// CONSOLE WELCOME MESSAGE
// ============================================
console.log('%c⚖️ SarkarLegal - Legal Services Portal', 'font-size: 20px; font-weight: bold; color: #1a365d;');
console.log('%cMaking legal services accessible to every Indian.', 'font-size: 14px; color: #c9a84c;');
console.log('%c© 2026 SarkarLegal. All rights reserved.', 'font-size: 12px; color: #718096;');
