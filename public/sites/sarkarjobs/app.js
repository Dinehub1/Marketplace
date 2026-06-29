/**
 * SarkarJobs — Main JavaScript
 * Handles: dark mode, mobile menu, FAQ accordion,
 * payment modal, search tabs, scroll effects, animations
 */

(function () {
    'use strict';

    // ===== DARK MODE TOGGLE =====
    const darkModeToggle = document.getElementById('darkModeToggle');
    const toggleIcon = document.getElementById('toggleIcon');
    const html = document.documentElement;

    // Check for saved preference or system preference
    function getInitialTheme() {
        const saved = localStorage.getItem('sarkarjobs-theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            toggleIcon.textContent = '☀️';
        } else {
            html.removeAttribute('data-theme');
            toggleIcon.textContent = '🌙';
        }
        localStorage.setItem('sarkarjobs-theme', theme);
    }

    // Initialize theme
    applyTheme(getInitialTheme());

    darkModeToggle.addEventListener('click', function () {
        const isDark = html.getAttribute('data-theme') === 'dark';
        applyTheme(isDark ? 'light' : 'dark');
    });

    // ===== MOBILE MENU =====
    const navHamburger = document.getElementById('navHamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = mobileMenu.querySelectorAll('a');

    function toggleMobileMenu() {
        const isOpen = mobileMenu.classList.contains('active');
        mobileMenu.classList.toggle('active');
        navHamburger.setAttribute('aria-expanded', !isOpen);
        mobileMenu.setAttribute('aria-hidden', isOpen);
    }

    navHamburger.addEventListener('click', toggleMobileMenu);

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            mobileMenu.classList.remove('active');
            navHamburger.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-hidden', 'true');
        });
    });

    // Close mobile menu on outside click
    document.addEventListener('click', function (e) {
        if (!mobileMenu.contains(e.target) && !navHamburger.contains(e.target)) {
            mobileMenu.classList.remove('active');
            navHamburger.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-hidden', 'true');
        }
    });

    // ===== NAVBAR SCROLL EFFECT =====
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', function () {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }

        // Hide/show navbar on scroll
        if (currentScroll > lastScroll && currentScroll > 300) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScroll = currentScroll;
    });

    // ===== FAQ ACCORDION =====
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
            item.classList.toggle('active');
            question.setAttribute('aria-expanded', !isActive);
        });
    });

    // ===== SEARCH TABS =====
    const searchTabs = document.querySelectorAll('.search-tab');

    searchTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            searchTabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');
        });
    });

    // ===== PAYMENT MODAL =====
    const paymentModal = document.getElementById('paymentModal');
    const modalClose = document.getElementById('modalClose');
    const modalPlanName = document.getElementById('modalPlanName');
    const payAmount = document.getElementById('payAmount');
    const payAmounts = document.querySelectorAll('.pay-amount');
    const proPlanBtn = document.getElementById('proPlanBtn');
    const premiumPlanBtn = document.getElementById('premiumPlanBtn');

    function openPaymentModal(plan, amount) {
        modalPlanName.textContent = plan + ' — ₹' + amount + '/month';
        payAmount.textContent = amount;
        payAmounts.forEach(function (el) { el.textContent = amount; });
        paymentModal.classList.add('active');
        paymentModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closePaymentModal() {
        paymentModal.classList.remove('active');
        paymentModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    proPlanBtn.addEventListener('click', function () {
        openPaymentModal('Pro Plan', '299');
    });

    premiumPlanBtn.addEventListener('click', function () {
        openPaymentModal('Premium Plan', '799');
    });

    modalClose.addEventListener('click', closePaymentModal);

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

    // ===== PAYMENT TABS =====
    const paymentTabs = document.querySelectorAll('.payment-tab');
    const paymentForms = document.querySelectorAll('.payment-form');

    paymentTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            const target = tab.getAttribute('data-paytab');

            // Update tab states
            paymentTabs.forEach(function (t) { t.classList.remove('active'); });
            tab.classList.add('active');

            // Show corresponding form
            paymentForms.forEach(function (form) { form.classList.remove('active'); });

            const targetForm = document.getElementById(target + 'Form');
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });

    // ===== UPI APP SELECTION =====
    const upiApps = document.querySelectorAll('.upi-app');

    upiApps.forEach(function (app) {
        app.addEventListener('click', function () {
            upiApps.forEach(function (a) { a.style.borderColor = ''; });
            app.style.borderColor = 'var(--color-primary)';
            app.style.background = 'rgba(79, 70, 229, 0.05)';
        });
    });

    // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe cards for scroll animation
    const animatedElements = document.querySelectorAll(
        '.category-card, .feature-card, .step-card, .testimonial-card, .pricing-card'
    );

    animatedElements.forEach(function (el, index) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.5s ease ' + (index * 0.05) + 's, transform 0.5s ease ' + (index * 0.05) + 's';
        observer.observe(el);
    });

    // ===== COUNTER ANIMATION FOR HERO STATS =====
    function animateCounter(element, target) {
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * eased);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                // Add back the suffix
                const suffix = element.getAttribute('data-count').replace(/[0-9,]/g, '');
                element.textContent = target.toLocaleString() + suffix;
            }
        }

        requestAnimationFrame(update);
    }

    // Trigger counter animation when hero stats are visible
    const statsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(function (stat) {
                    const rawCount = stat.getAttribute('data-count');
                    if (rawCount) {
                        const num = parseInt(rawCount.replace(/[^0-9]/g, ''), 10);
                        if (!isNaN(num)) {
                            animateCounter(stat, num);
                        }
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }

    // ===== PAYMENT FORM HANDLING =====
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
        payBtn.addEventListener('click', function () {
            const upiId = document.getElementById('upiId').value;
            if (!upiId) {
                alert('Please enter your UPI ID');
                return;
            }

            // Simulate payment processing
            payBtn.textContent = 'Processing...';
            payBtn.disabled = true;

            setTimeout(function () {
                alert('Payment successful! Welcome to SarkarJobs Pro. 🎉');
                closePaymentModal();
                payBtn.textContent = 'Pay ₹' + (payAmount ? payAmount.textContent : '299');
                payBtn.disabled = false;
            }, 2000);
        });
    }

    // ===== CARD NUMBER FORMATTING =====
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formatted = '';
            for (let i = 0; i < value.length && i < 16; i++) {
                if (i > 0 && i % 4 === 0) formatted += ' ';
                formatted += value[i];
            }
            e.target.value = formatted;
        });
    }

    // ===== CARD EXPIRY FORMATTING =====
    const cardExpiry = document.getElementById('cardExpiry');
    if (cardExpiry) {
        cardExpiry.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }

    // ===== KEYBOARD ACCESSIBILITY FOR CARDS =====
    const focusableCards = document.querySelectorAll('.category-card, .feature-card, .step-card, .testimonial-card');

    focusableCards.forEach(function (card) {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                const link = card.querySelector('a');
                if (link) link.click();
            }
        });
    });

    console.log('💼 SarkarJobs loaded successfully!');

})();
