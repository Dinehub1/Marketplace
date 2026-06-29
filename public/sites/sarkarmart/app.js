/**
 * ============================================
 * SarkarMart - E-Commerce Marketplace
 * Main JavaScript Application
 * ============================================
 *
 * Features:
 * - Mobile navigation toggle
 * - Dark mode toggle with localStorage persistence
 * - FAQ accordion
 * - UPI payment modal
 * - Smooth scroll behavior
 * - Navbar scroll effect
 *
 * @author SarkarMart Team
 * @version 1.0.0
 */

(function () {
    'use strict';

    /* ============================================
       DARK MODE TOGGLE
       ============================================ */

    /**
     * Initialize dark mode based on user preference.
     * Checks localStorage first, then system preference.
     */
    function initDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        if (!toggle) return;

        // Check for saved preference or system preference
        const savedTheme = localStorage.getItem('sarkarmart-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }

        // Toggle on click
        toggle.addEventListener('click', function () {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('sarkarmart-theme', newTheme);
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem('sarkarmart-theme')) {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    }

    /* ============================================
       MOBILE NAVIGATION
       ============================================ */

    /**
     * Toggle mobile menu open/close state.
     */
    function initMobileNav() {
        const hamburger = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        if (!hamburger || !mobileMenu) return;

        hamburger.addEventListener('click', function () {
            const isOpen = mobileMenu.classList.contains('active');

            if (isOpen) {
                // Close menu
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            } else {
                // Open menu
                mobileMenu.classList.add('active');
                hamburger.classList.add('active');
                hamburger.setAttribute('aria-expanded', 'true');
                mobileMenu.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
            }
        });

        // Close mobile menu when a link is clicked
        const mobileLinks = mobileMenu.querySelectorAll('.navbar__mobile-link');
        mobileLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            });
        });

        // Close mobile menu on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function (e) {
            if (mobileMenu.classList.contains('active') &&
                !mobileMenu.contains(e.target) &&
                !hamburger.contains(e.target)) {
                mobileMenu.classList.remove('active');
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });
    }

    /* ============================================
       FAQ ACCORDION
       ============================================ */

    /**
     * Initialize FAQ accordion functionality.
     * Only one item can be open at a time.
     */
    function initFAQ() {
        const faqItems = document.querySelectorAll('.faq__item');

        faqItems.forEach(function (item) {
            const question = item.querySelector('.faq__question');
            if (!question) return;

            question.addEventListener('click', function () {
                const isActive = item.classList.contains('active');

                // Close all FAQ items
                faqItems.forEach(function (otherItem) {
                    otherItem.classList.remove('active');
                    const btn = otherItem.querySelector('.faq__question');
                    if (btn) btn.setAttribute('aria-expanded', 'false');
                });

                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                    question.setAttribute('aria-expanded', 'true');
                }
            });
        });
    }

    /* ============================================
       UPI PAYMENT MODAL
       ============================================ */

    // Plan details for the payment modal
    var planDetails = {
        free: { name: 'Free Plan', price: '₹0/forever' },
        prime: { name: 'Prime Plan', price: '₹99/month' },
        business: { name: 'Business Plan', price: '₹499/month' }
    };

    var currentPlan = 'prime';

    /**
     * Open the UPI payment modal with plan details.
     * @param {string} plan - The plan type: 'free', 'prime', or 'business'
     */
    function openPaymentModal(plan) {
        currentPlan = plan || 'prime';
        var modal = document.getElementById('paymentModal');
        if (!modal) return;

        // Update plan summary in modal
        var planName = document.getElementById('modalPlanName');
        var planPrice = document.getElementById('modalPlanPrice');
        if (planName && planPrice && planDetails[currentPlan]) {
            planName.textContent = planDetails[currentPlan].name;
            planPrice.textContent = planDetails[currentPlan].price;
        }

        // Show modal
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus on UPI input for accessibility
        setTimeout(function () {
            var upiInput = document.getElementById('upiId');
            if (upiInput) upiInput.focus();
        }, 100);
    }

    /**
     * Close the UPI payment modal.
     */
    function closePaymentModal() {
        var modal = document.getElementById('paymentModal');
        if (!modal) return;

        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    /**
     * Process the UPI payment (demo).
     */
    function processPayment() {
        var upiId = document.getElementById('upiId');
        var upiValue = upiId ? upiId.value.trim() : '';

        if (!upiValue) {
            alert('Please enter your UPI ID or select a UPI app to proceed.');
            if (upiId) upiId.focus();
            return;
        }

        // Basic UPI ID validation
        if (upiValue.indexOf('@') === -1) {
            alert('Please enter a valid UPI ID (e.g., yourname@paytm)');
            if (upiId) upiId.focus();
            return;
        }

        // Simulate payment processing
        alert('Payment request sent to ' + upiValue + '.\n\nPlease approve the request in your UPI app.\n\n(This is a demo — no actual payment will be processed.)');
        closePaymentModal();
    }

    /**
     * Simulate paying with a specific UPI app.
     * @param {string} app - The UPI app: 'gpay', 'phonepe', 'paytm', 'bhim'
     */
    function payWithApp(app) {
        var appNames = {
            gpay: 'Google Pay',
            phonepe: 'PhonePe',
            paytm: 'Paytm',
            bhim: 'BHIM'
        };

        var appName = appNames[app] || app;
        alert('Opening ' + appName + '...\n\nPlease approve the payment request in the ' + appName + ' app.\n\n(This is a demo — no actual payment will be processed.)');
    }

    // Close modal on overlay click
    function initModalClose() {
        var modal = document.getElementById('paymentModal');
        if (!modal) return;

        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                closePaymentModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closePaymentModal();
            }
        });
    }

    /* ============================================
       NAVBAR SCROLL EFFECT
       ============================================ */

    /**
     * Add shadow to navbar on scroll for visual depth.
     */
    function initNavbarScroll() {
        var navbar = document.querySelector('.navbar');
        if (!navbar) return;

        var scrollThreshold = 10;

        function onScroll() {
            if (window.scrollY > scrollThreshold) {
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.boxShadow = 'none';
            }
        }

        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ============================================
       SMOOTH SCROLL FOR ANCHOR LINKS
       ============================================ */

    /**
     * Smooth scroll to anchor links with offset for fixed navbar.
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var targetId = this.getAttribute('href');
                if (targetId === '#') return;

                var target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();

                    var navbarHeight = document.querySelector('.navbar') ? document.querySelector('.navbar').offsetHeight : 70;
                    var targetPosition = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    /* ============================================
       SEARCH BAR INTERACTION
       ============================================ */

    /**
     * Handle search form submission (demo).
     */
    function initSearch() {
        var searchInput = document.querySelector('.hero__search-input');
        var searchBtn = document.querySelector('.hero__search-btn');

        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', function () {
                var query = searchInput.value.trim();
                if (query) {
                    alert('Searching for: "' + query + '"\n\n(This is a demo — search functionality would connect to the backend.)');
                } else {
                    searchInput.focus();
                }
            });

            searchInput.addEventListener('keypress', function (e) {
                if (e.key === 'Enter') {
                    searchBtn.click();
                }
            });
        }
    }

    /* ============================================
       INITIALIZE ALL MODULES
       ============================================ */

    /**
     * Initialize all application modules when DOM is ready.
     */
    function init() {
        initDarkMode();
        initMobileNav();
        initFAQ();
        initModalClose();
        initNavbarScroll();
        initSmoothScroll();
        initSearch();
    }

    // Run initialization when DOM is fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ============================================
       EXPOSE GLOBAL FUNCTIONS
       (for inline onclick handlers in HTML)
       ============================================ */
    window.openPaymentModal = openPaymentModal;
    window.closePaymentModal = closePaymentModal;
    window.processPayment = processPayment;
    window.payWithApp = payWithApp;

})();
