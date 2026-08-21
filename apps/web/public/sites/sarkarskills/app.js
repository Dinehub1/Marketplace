/**
 * ============================================================
 * SarkarSkills - AI Skills Marketplace
 * Main JavaScript Application
 * ============================================================
 *
 * Features:
 * - Dark mode toggle with localStorage persistence
 * - Mobile menu toggle
 * - FAQ accordion
 * - UPI payment modal
 * - Scroll animations (Intersection Observer)
 * - Navbar scroll effect
 * - Pricing toggle (monthly/annual)
 * - Counter animations
 * - Smooth scroll behavior
 * ============================================================
 */

(function () {
    'use strict';

    // ============================================================
    // DARK MODE TOGGLE
    // ============================================================

    /**
     * Initialize dark mode based on user preference or localStorage.
     * Checks localStorage first, then falls back to system preference.
     */
    function initDarkMode() {
        const toggle = document.getElementById('darkModeToggle');
        if (!toggle) return;

        // Check for saved preference or system preference
        const savedTheme = localStorage.getItem('sarkarskills-theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

        // Apply theme
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }

        // Toggle click handler
        toggle.addEventListener('click', function () {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            if (currentTheme === 'dark') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('sarkarskills-theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('sarkarskills-theme', 'dark');
            }
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
            if (!localStorage.getItem('sarkarskills-theme')) {
                if (e.matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
            }
        });
    }

    // ============================================================
    // MOBILE MENU TOGGLE
    // ============================================================

    /**
     * Handle mobile menu open/close with animation.
     * Closes menu when a nav link is clicked.
     */
    function initMobileMenu() {
        const menuToggle = document.getElementById('mobileMenuToggle');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileLinks = document.querySelectorAll('.mobile-nav-link');

        if (!menuToggle || !mobileMenu) return;

        menuToggle.addEventListener('click', function () {
            const isOpen = mobileMenu.classList.contains('open');

            if (isOpen) {
                mobileMenu.classList.remove('open');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            } else {
                mobileMenu.classList.add('open');
                menuToggle.classList.add('active');
                menuToggle.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
            }
        });

        // Close menu when a link is clicked
        mobileLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                mobileMenu.classList.remove('open');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });

        // Close menu on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
                mobileMenu.classList.remove('open');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (e) {
            if (mobileMenu.classList.contains('open') &&
                !mobileMenu.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                mobileMenu.classList.remove('open');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            }
        });
    }

    // ============================================================
    // NAVBAR SCROLL EFFECT
    // ============================================================

    /**
     * Adds 'scrolled' class to navbar when page is scrolled past 50px.
     * Uses requestAnimationFrame for performance.
     */
    function initNavbarScroll() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        let ticking = false;

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    if (window.scrollY > 50) {
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ============================================================
    // FAQ ACCORDION
    // ============================================================

    /**
     * FAQ accordion: clicking a question opens/closes its answer.
     * Only one item can be open at a time.
     */
    function initFAQAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');

        faqItems.forEach(function (item) {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');

            if (!question || !answer) return;

            question.addEventListener('click', function () {
                const isOpen = question.getAttribute('aria-expanded') === 'true';

                // Close all other items
                faqItems.forEach(function (otherItem) {
                    const otherQuestion = otherItem.querySelector('.faq-question');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    if (otherQuestion && otherAnswer && otherQuestion !== question) {
                        otherQuestion.setAttribute('aria-expanded', 'false');
                        otherAnswer.classList.remove('open');
                        otherAnswer.setAttribute('aria-hidden', 'true');
                    }
                });

                // Toggle current item
                if (isOpen) {
                    question.setAttribute('aria-expanded', 'false');
                    answer.classList.remove('open');
                    answer.setAttribute('aria-hidden', 'true');
                } else {
                    question.setAttribute('aria-expanded', 'true');
                    answer.classList.add('open');
                    answer.setAttribute('aria-hidden', 'false');
                }
            });
        });
    }

    // ============================================================
    // UPI PAYMENT MODAL
    // ============================================================

    let currentPlan = { name: 'Pro Creator', price: 499 };

    /**
     * Open the UPI payment modal with plan details.
     * @param {string} planName - Name of the selected plan
     * @param {number} planPrice - Price of the selected plan
     */
    window.openUPIModal = function (planName, planPrice) {
        currentPlan = { name: planName, price: planPrice };

        const overlay = document.getElementById('upiModalOverlay');
        const modal = document.getElementById('upiModal');
        const planNameEl = document.getElementById('modalPlanName');
        const planPriceEl = document.getElementById('modalPlanPrice');
        const payAmountEl = document.getElementById('payAmount');

        if (planNameEl) planNameEl.textContent = planName;
        if (planPriceEl) planPriceEl.textContent = '₹' + planPrice + '/month';
        if (payAmountEl) payAmountEl.textContent = '₹' + planPrice;

        if (overlay) {
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            // Focus trap: focus the close button
            const closeBtn = document.getElementById('modalClose');
            if (closeBtn) closeBtn.focus();
        }
    };

    /**
     * Close the UPI payment modal.
     */
    window.closeUPIModal = function () {
        const overlay = document.getElementById('upiModalOverlay');
        if (overlay) {
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    };

    /**
     * Initialize modal event listeners.
     */
    function initUPIModal() {
        const overlay = document.getElementById('upiModalOverlay');
        const closeBtn = document.getElementById('modalClose');

        // Close on overlay click
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    closeUPIModal();
                }
            });
        }

        // Close on close button click
        if (closeBtn) {
            closeBtn.addEventListener('click', closeUPIModal);
        }

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const overlay = document.getElementById('upiModalOverlay');
                if (overlay && overlay.classList.contains('open')) {
                    closeUPIModal();
                }
            }
        });
    }

    /**
     * Select a UPI app for payment.
     * @param {string} app - The UPI app identifier
     */
    window.selectUPIApp = function (app) {
        const buttons = document.querySelectorAll('.upi-app-btn');
        buttons.forEach(function (btn) {
            btn.classList.remove('selected');
        });

        // Find and highlight the clicked button
        event.target.closest('.upi-app-btn').classList.add('selected');
    };

    /**
     * Verify UPI ID (mock function).
     */
    window.verifyUPI = function () {
        const upiInput = document.getElementById('upiId');
        if (!upiInput) return;

        const upiId = upiInput.value.trim();
        if (!upiId) {
            upiInput.style.borderColor = 'var(--color-error)';
            upiInput.setAttribute('placeholder', 'Please enter a UPI ID');
            return;
        }

        // Basic UPI ID validation
        if (upiId.includes('@')) {
            upiInput.style.borderColor = 'var(--color-success)';
            // Show a brief success indication
            const originalPlaceholder = upiInput.getAttribute('placeholder');
            upiInput.value = '';
            upiInput.setAttribute('placeholder', '✓ UPI ID verified!');
            setTimeout(function () {
                upiInput.setAttribute('placeholder', 'yourname@upi');
                upiInput.style.borderColor = '';
            }, 2000);
        } else {
            upiInput.style.borderColor = 'var(--color-error)';
            upiInput.setAttribute('placeholder', 'Invalid format. Use name@upi');
            setTimeout(function () {
                upiInput.setAttribute('placeholder', 'yourname@upi');
                upiInput.style.borderColor = '';
            }, 2000);
        }
    };

    /**
     * Process payment (mock function).
     */
    window.processPayment = function () {
        const payButton = document.getElementById('payButton');
        if (!payButton) return;

        // Show loading state
        payButton.innerHTML = 'Processing...';
        payButton.style.opacity = '0.7';
        payButton.disabled = true;

        // Simulate payment processing
        setTimeout(function () {
            payButton.innerHTML = '✓ Payment Successful!';
            payButton.style.background = 'var(--color-success)';
            payButton.style.opacity = '1';

            setTimeout(function () {
                closeUPIModal();
                // Reset button
                setTimeout(function () {
                    payButton.innerHTML = 'Pay <span id="payAmount">₹' + currentPlan.price + '</span>';
                    payButton.style.background = '';
                    payButton.disabled = false;
                }, 300);
            }, 1500);
        }, 2000);
    };

    // ============================================================
    // PRICING TOGGLE (Monthly/Annual)
    // ============================================================

    /**
     * Toggle between monthly and annual pricing display.
     */
    function initPricingToggle() {
        const toggle = document.getElementById('pricingToggle');
        if (!toggle) return;

        toggle.addEventListener('change', function () {
            const isAnnual = toggle.checked;
            const priceAmounts = document.querySelectorAll('.price-amount');
            const toggleLabels = document.querySelectorAll('.toggle-label');

            // Update active label
            toggleLabels.forEach(function (label) {
                if (isAnnual && label.dataset.period === 'annual') {
                    label.classList.add('active');
                } else if (!isAnnual && label.dataset.period === 'monthly') {
                    label.classList.add('active');
                } else {
                    label.classList.remove('active');
                }
            });

            // Update prices
            priceAmounts.forEach(function (el) {
                const monthly = el.dataset.monthly;
                const annual = el.dataset.annual;
                if (isAnnual) {
                    el.textContent = annual;
                    // Update period text
                    const periodEl = el.parentElement.querySelector('.price-period');
                    if (periodEl) periodEl.textContent = '/month (billed annually)';
                } else {
                    el.textContent = monthly;
                    const periodEl = el.parentElement.querySelector('.price-period');
                    if (periodEl) periodEl.textContent = '/month';
                }
            });
        });
    }

    // ============================================================
    // SCROLL ANIMATIONS (Intersection Observer)
    // ============================================================

    /**
     * Animate elements when they scroll into view.
     * Uses IntersectionObserver for performance.
     */
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('[data-animate]');

        if (!animatedElements.length) return;

        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            // Show all elements immediately
            animatedElements.forEach(function (el) {
                el.classList.add('animated');
            });
            return;
        }

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.dataset.delay) || 0;

                    setTimeout(function () {
                        el.classList.add('animated');
                    }, delay);

                    // Stop observing once animated
                    observer.unobserve(el);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(function (el) {
            observer.observe(el);
        });
    }

    // ============================================================
    // COUNTER ANIMATIONS
    // ============================================================

    /**
     * Animate counting up for stat numbers.
     */
    function initCounterAnimations() {
        const counters = document.querySelectorAll('[data-count]');

        if (!counters.length) return;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count);
                    const duration = 2000; // 2 seconds
                    const startTime = performance.now();

                    function updateCounter(currentTime) {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);

                        // Ease out cubic
                        const eased = 1 - Math.pow(1 - progress, 3);
                        const current = Math.round(eased * target);

                        el.textContent = current.toLocaleString();

                        if (progress < 1) {
                            requestAnimationFrame(updateCounter);
                        }
                    }

                    requestAnimationFrame(updateCounter);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(function (counter) {
            observer.observe(counter);
        });
    }

    // ============================================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ============================================================

    /**
     * Enhanced smooth scroll for anchor links with offset for fixed navbar.
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;

                const targetEl = document.querySelector(targetId);
                if (targetEl) {
                    e.preventDefault();
                    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 72;
                    const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navbarHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // ============================================================
    // ACTIVE NAV LINK HIGHLIGHTING
    // ============================================================

    /**
     * Highlight the active navigation link based on scroll position.
     */
    function initActiveNavHighlight() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');

        if (!sections.length || !navLinks.length) return;

        let ticking = false;

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    const scrollPos = window.scrollY + 120;

                    sections.forEach(function (section) {
                        const top = section.offsetTop;
                        const height = section.offsetHeight;
                        const id = section.getAttribute('id');

                        if (scrollPos >= top && scrollPos < top + height) {
                            navLinks.forEach(function (link) {
                                link.classList.remove('active');
                                if (link.getAttribute('href') === '#' + id) {
                                    link.classList.add('active');
                                }
                            });
                        }
                    });

                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ============================================================
    // INITIALIZE ALL MODULES
    // ============================================================

    /**
     * Initialize all application modules when DOM is ready.
     */
    function init() {
        initDarkMode();
        initMobileMenu();
        initNavbarScroll();
        initFAQAccordion();
        initUPIModal();
        initPricingToggle();
        initScrollAnimations();
        initCounterAnimations();
        initSmoothScroll();
        initActiveNavHighlight();
    }

    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
