/**
 * ============================================================
 * SarkarWellness — Main JavaScript
 * Handles: dark mode, mobile menu, FAQ accordion,
 *          payment modal, scroll effects, smooth animations
 * ============================================================
 */

(function () {
    'use strict';

    // ============================================================
    // 1. DARK MODE TOGGLE
    // ============================================================
    const darkModeToggle = document.getElementById('darkModeToggle');
    const toggleIcon = document.getElementById('toggleIcon');
    const html = document.documentElement;

    // Check for saved preference or system preference
    function initDarkMode() {
        const savedTheme = localStorage.getItem('sarkarwellness-theme');
        if (savedTheme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            toggleIcon.textContent = '☀️';
        } else if (savedTheme === 'light') {
            html.removeAttribute('data-theme');
            toggleIcon.textContent = '🌙';
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            html.setAttribute('data-theme', 'dark');
            toggleIcon.textContent = '☀️';
        }
    }

    function toggleDarkMode() {
        if (html.getAttribute('data-theme') === 'dark') {
            html.removeAttribute('data-theme');
            toggleIcon.textContent = '🌙';
            localStorage.setItem('sarkarwellness-theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            toggleIcon.textContent = '☀️';
            localStorage.setItem('sarkarwellness-theme', 'dark');
        }
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    // ============================================================
    // 2. MOBILE MENU TOGGLE
    // ============================================================
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');

    function toggleMobileMenu() {
        const isOpen = navLinks.classList.contains('active');
        if (isOpen) {
            navLinks.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        } else {
            navLinks.classList.add('active');
            mobileMenuToggle.classList.add('active');
            mobileMenuToggle.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeMobileMenu() {
        navLinks.classList.remove('active');
        mobileMenuToggle.classList.remove('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when a nav link is clicked
    if (navLinks) {
        navLinks.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                closeMobileMenu();
            });
        });
    }

    // Close mobile menu on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeMobileMenu();
            closePaymentModal();
        }
    });

    // ============================================================
    // 3. NAVBAR SCROLL EFFECT
    // ============================================================
    const navbar = document.getElementById('navbar');
    let lastScrollY = 0;

    function handleNavbarScroll() {
        const scrollY = window.scrollY;

        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide/show navbar on scroll direction
        if (scrollY > lastScrollY && scrollY > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScrollY = scrollY;
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });

    // ============================================================
    // 4. ACTIVE NAV LINK HIGHLIGHTING
    // ============================================================
    const sections = document.querySelectorAll('section[id]');
    const navLinkEls = document.querySelectorAll('.nav-link');

    function highlightActiveNav() {
        const scrollY = window.scrollY + 100;

        sections.forEach(function (section) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinkEls.forEach(function (link) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightActiveNav, { passive: true });

    // ============================================================
    // 5. FAQ ACCORDION
    // ============================================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function (item) {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', function () {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(function (otherItem) {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                question.setAttribute('aria-expanded', 'false');
            } else {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // ============================================================
    // 6. UPI PAYMENT MODAL
    // ============================================================
    const paymentModal = document.getElementById('paymentModal');
    const modalClose = document.getElementById('modalClose');
    const modalPlanName = document.getElementById('modalPlanName');
    const modalPlanPrice = document.getElementById('modalPlanPrice');
    const payAmount = document.getElementById('payAmount');
    let currentPlan = { name: 'Sampoorna', price: 7999 };

    window.openPaymentModal = function (planName, planPrice) {
        currentPlan = { name: planName, price: planPrice };
        modalPlanName.textContent = planName + ' Plan';
        modalPlanPrice.textContent = '₹' + planPrice.toLocaleString('en-IN') + '/month';
        payAmount.textContent = '₹' + planPrice.toLocaleString('en-IN');
        paymentModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus trap for accessibility
        setTimeout(function () {
            if (modalClose) modalClose.focus();
        }, 100);
    };

    window.closePaymentModal = function () {
        paymentModal.classList.remove('active');
        document.body.style.overflow = '';
    };

    if (modalClose) {
        modalClose.addEventListener('click', closePaymentModal);
    }

    // Close modal on overlay click
    if (paymentModal) {
        paymentModal.addEventListener('click', function (e) {
            if (e.target === paymentModal) {
                closePaymentModal();
            }
        });
    }

    // UPI App Selection
    window.selectUPI = function (app) {
        document.querySelectorAll('.upi-app').forEach(function (btn) {
            btn.classList.remove('selected');
        });
        // Find the button that was clicked
        event.target.closest('.upi-app').classList.add('selected');
    };

    // Process Payment
    window.processPayment = function () {
        const upiId = document.getElementById('upiId').value.trim();
        const payButton = document.getElementById('payButton');

        if (!upiId || !upiId.includes('@')) {
            alert('Please enter a valid UPI ID (e.g., yourname@paytm)');
            document.getElementById('upiId').focus();
            return;
        }

        // Simulate payment processing
        payButton.textContent = 'Processing...';
        payButton.disabled = true;

        setTimeout(function () {
            alert('Payment of ₹' + currentPlan.price.toLocaleString('en-IN') + ' for ' + currentPlan.name + ' plan initiated!\n\nYou will receive a UPI payment request on your app. Please approve it to complete the transaction.');
            payButton.textContent = 'Pay ₹' + currentPlan.price.toLocaleString('en-IN');
            payButton.disabled = false;
            closePaymentModal();
        }, 2000);
    };

    // ============================================================
    // 7. BACK TO TOP BUTTON
    // ============================================================
    const backToTop = document.getElementById('backToTop');

    function handleBackToTop() {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', handleBackToTop, { passive: true });

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ============================================================
    // 8. SMOOTH SCROLL FOR ANCHOR LINKS
    // ============================================================
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                const navHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = targetEl.offsetTop - navHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ============================================================
    // 9. INTERSECTION OBSERVER — SCROLL ANIMATIONS
    // ============================================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card, .step, .faq-item').forEach(function (el) {
        observer.observe(el);
    });

    // ============================================================
    // 10. STATS COUNTER ANIMATION
    // ============================================================
    function animateCounter(el, target) {
        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(eased * target);

            // Preserve the suffix (e.g., +, ★)
            const text = el.textContent;
            const suffix = text.replace(/[0-9,]/g, '');
            el.textContent = current.toLocaleString('en-IN') + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = text; // Restore original text
            }
        }

        requestAnimationFrame(update);
    }

    // Trigger counter animation when stats are visible
    const statsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const counters = entry.target.querySelectorAll('.stat-number[data-count]');
                counters.forEach(function (counter) {
                    const target = parseInt(counter.getAttribute('data-count'), 10);
                    animateCounter(counter, target);
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }

    // ============================================================
    // 11. INITIALIZATION
    // ============================================================
    initDarkMode();

    // Add loaded class for any CSS transitions on page load
    window.addEventListener('load', function () {
        document.body.classList.add('loaded');
    });

})();
