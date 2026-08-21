/**
 * ============================================================
 * SarkarFinance — app.js
 * Interactivity: dark mode, mobile nav, FAQ, payment modal,
 * animated counters, scroll effects
 * ============================================================
 */

(function () {
    'use strict';

    /* --------------------------------------------------
       1. Dark Mode Toggle
       -------------------------------------------------- */
    const darkToggle = document.getElementById('darkToggle');
    const toggleIcon = darkToggle.querySelector('.toggle-icon');

    // Check for saved preference or system preference
    function initDarkMode() {
        const saved = localStorage.getItem('sarkar-dark-mode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (saved === 'true' || (saved === null && prefersDark)) {
            document.body.classList.add('dark');
            toggleIcon.textContent = '☀️';
        }
    }

    darkToggle.addEventListener('click', function () {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        toggleIcon.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('sarkar-dark-mode', isDark);
    });

    /* --------------------------------------------------
       2. Mobile Navigation
       -------------------------------------------------- */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = mobileMenu.querySelectorAll('a');

    hamburger.addEventListener('click', function () {
        const isOpen = hamburger.classList.contains('active');
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', !isOpen);
    });

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // Close mobile menu on outside click
    document.addEventListener('click', function (e) {
        if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });

    /* --------------------------------------------------
       3. Navbar Scroll Effect
       -------------------------------------------------- */
    const navbar = document.getElementById('navbar');

    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    /* --------------------------------------------------
       4. Animated Counter (Hero Stats)
       -------------------------------------------------- */
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');
        const speed = 200; // lower = faster

        counters.forEach(function (counter) {
            const target = parseInt(counter.getAttribute('data-count'), 10);
            const suffix = counter.nextElementSibling ? counter.nextElementSibling.textContent : '';
            let current = 0;
            const increment = Math.max(1, Math.floor(target / speed));

            const timer = setInterval(function () {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }

                // Format number with Indian locale
                if (target >= 100000) {
                    counter.textContent = (current / 100000).toFixed(0) + ' Lakh';
                } else if (target >= 10000000) {
                    counter.textContent = (current / 10000000).toFixed(0) + ' Cr';
                } else {
                    counter.textContent = current.toLocaleString('en-IN');
                }
            }, 20);
        });
    }

    // Trigger counter animation when hero is in view
    let countersAnimated = false;
    function checkCounterVisibility() {
        if (countersAnimated) return;
        const hero = document.getElementById('hero');
        const rect = hero.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            animateCounters();
            countersAnimated = true;
        }
    }

    window.addEventListener('scroll', checkCounterVisibility, { passive: true });
    // Check on load too
    checkCounterVisibility();

    /* --------------------------------------------------
       5. FAQ Accordion
       -------------------------------------------------- */
    window.toggleFaq = function (button) {
        const item = button.parentElement;
        const isActive = item.classList.contains('active');

        // Close all other FAQ items
        document.querySelectorAll('.faq-item.active').forEach(function (openItem) {
            if (openItem !== item) {
                openItem.classList.remove('active');
                openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            }
        });

        // Toggle current item
        item.classList.toggle('active');
        button.setAttribute('aria-expanded', !isActive);
    };

    /* --------------------------------------------------
       6. UPI Payment Modal
       -------------------------------------------------- */
    const paymentModal = document.getElementById('paymentModal');
    const paymentAmount = document.getElementById('paymentAmount');
    const paymentPlan = document.getElementById('paymentPlan');
    const payButtonText = document.getElementById('payButtonText');

    // Plan details
    const plans = {
        starter: { name: 'Starter Plan — Free', amount: 0, display: '₹0' },
        pro: { name: 'Pro Plan — Yearly', amount: 199, display: '₹199' },
        premium: { name: 'Premium Plan — Yearly', amount: 499, display: '₹499' }
    };

    let currentPlan = null;

    window.openPaymentModal = function (planKey, amount) {
        currentPlan = planKey;
        const plan = plans[planKey];

        paymentAmount.textContent = plan.display;
        paymentPlan.textContent = plan.name;
        payButtonText.textContent = plan.display;

        paymentModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll

        // Focus trap: focus the close button
        paymentModal.querySelector('.modal-close').focus();
    };

    window.closePaymentModal = function () {
        paymentModal.classList.remove('active');
        document.body.style.overflow = '';
        currentPlan = null;
    };

    // Close modal on overlay click
    paymentModal.addEventListener('click', function (e) {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && paymentModal.classList.contains('active')) {
            closePaymentModal();
        }
    });

    /* --------------------------------------------------
       7. UPI App Selection
       -------------------------------------------------- */
    window.selectUpiApp = function (app) {
        const upiInput = document.getElementById('upiId');
        const handle = upiInput.value.split('@')[0] || 'yourname';
        const domains = {
            gpay: 'oksbi',
            phonepe: 'ybl',
            paytm: 'paytm',
            bhim: 'upi'
        };
        upiInput.value = handle + '@' + (domains[app] || 'upi');
        upiInput.focus();
    };

    /* --------------------------------------------------
       8. Process Payment (Simulation)
       -------------------------------------------------- */
    window.processPayment = function () {
        const upiId = document.getElementById('upiId').value.trim();
        const payButton = document.getElementById('payButton');

        if (!upiId && currentPlan !== 'starter') {
            alert('Please enter your UPI ID or select a UPI app to proceed.');
            document.getElementById('upiId').focus();
            return;
        }

        if (currentPlan === 'starter') {
            alert('🎉 Welcome to SarkarFinance Starter! Your free account is ready.');
            closePaymentModal();
            return;
        }

        // Simulate payment processing
        const originalText = payButton.innerHTML;
        payButton.innerHTML = '⏳ Processing...';
        payButton.disabled = true;

        setTimeout(function () {
            alert('✅ Payment of ' + plans[currentPlan].display + ' successful! Welcome to ' + plans[currentPlan].name + '!');
            payButton.innerHTML = originalText;
            payButton.disabled = false;
            closePaymentModal();
        }, 2000);
    };

    /* --------------------------------------------------
       9. Smooth Scroll for Anchor Links
       -------------------------------------------------- */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = document.getElementById('navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* --------------------------------------------------
       10. Intersection Observer for Scroll Animations
       -------------------------------------------------- */
    function initScrollAnimations() {
        // Only run if IntersectionObserver is supported
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe feature cards, step cards, pricing cards, testimonials
        document.querySelectorAll('.feature-card, .step-card, .pricing-card, .testimonial-card').forEach(function (el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
    }

    /* --------------------------------------------------
       Initialize everything when DOM is ready
       -------------------------------------------------- */
    initDarkMode();
    initScrollAnimations();

})();
