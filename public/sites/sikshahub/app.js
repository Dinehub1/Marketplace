/**
 * SikshaHub - Online Learning Platform
 * app.js - Main JavaScript
 * 
 * Features:
 * - Mobile navigation toggle
 * - Dark mode toggle
 * - Scroll animations & counter
 * - FAQ accordion
 * - Payment modal with tab switching
 * - Toast notifications
 * - Navbar scroll effect
 */

(function() {
    'use strict';

    // ========== DOM READY ==========
    document.addEventListener('DOMContentLoaded', function() {
        initNavigation();
        initTheme();
        initScrollEffects();
        initCounters();
        initFAQ();
        initPaymentModal();
        initSmoothScroll();
    });

    // ========== MOBILE NAVIGATION ==========
    function initNavigation() {
        var toggle = document.getElementById('navToggle');
        var menu = document.getElementById('navMenu');

        if (!toggle || !menu) return;

        toggle.addEventListener('click', function() {
            var isActive = toggle.classList.toggle('active');
            menu.classList.toggle('active');
            toggle.setAttribute('aria-expanded', isActive);
        });

        // Close menu when clicking a link
        var links = menu.querySelectorAll('.nav-link');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function() {
                toggle.classList.remove('active');
                menu.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            });
        }

        // Close menu on outside click
        document.addEventListener('click', function(e) {
            if (!toggle.contains(e.target) && !menu.contains(e.target)) {
                toggle.classList.remove('active');
                menu.classList.remove('active');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // ========== DARK MODE ==========
    function initTheme() {
        var btn = document.getElementById('themeToggle');
        if (!btn) return;

        // Check saved preference or system preference
        var saved = localStorage.getItem('sikshahub-theme');
        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            btn.innerHTML = '<i class="fas fa-sun"></i>';
        }

        btn.addEventListener('click', function() {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                btn.innerHTML = '<i class="fas fa-moon"></i>';
                localStorage.setItem('sikshahub-theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                btn.innerHTML = '<i class="fas fa-sun"></i>';
                localStorage.setItem('sikshahub-theme', 'dark');
            }
        });
    }

    // ========== SCROLL EFFECTS ==========
    function initScrollEffects() {
        var navbar = document.getElementById('navbar');
        if (!navbar) return;

        var ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    if (window.scrollY > 50) {
                        navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                    } else {
                        navbar.style.boxShadow = 'none';
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ========== ANIMATED COUNTERS ==========
    function initCounters() {
        var counters = document.querySelectorAll('.stat-number[data-target]');
        if (counters.length === 0) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        for (var i = 0; i < counters.length; i++) {
            observer.observe(counters[i]);
        }
    }

    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-target'), 10);
        var duration = 2000;
        var start = 0;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out quad
            var eased = 1 - (1 - progress) * (1 - progress);
            var current = Math.floor(eased * target);
            el.textContent = current.toLocaleString('en-IN');
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = target.toLocaleString('en-IN');
            }
        }

        requestAnimationFrame(step);
    }

    // ========== FAQ ACCORDION ==========
    function initFAQ() {
        var items = document.querySelectorAll('.faq-item');
        if (items.length === 0) return;

        for (var i = 0; i < items.length; i++) {
            (function(item) {
                var btn = item.querySelector('.faq-question');
                if (!btn) return;

                btn.addEventListener('click', function() {
                    var isActive = item.classList.contains('active');

                    // Close all
                    for (var j = 0; j < items.length; j++) {
                        items[j].classList.remove('active');
                        items[j].querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                    }

                    // Open clicked (if wasn't already open)
                    if (!isActive) {
                        item.classList.add('active');
                        btn.setAttribute('aria-expanded', 'true');
                    }
                });
            })(item);
        }
    }

    // ========== PAYMENT MODAL ==========
    function initPaymentModal() {
        var modal = document.getElementById('paymentModal');
        if (!modal) return;

        // Close on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePaymentModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closePaymentModal();
            }
        });
    }

    // Open payment modal (global scope for onclick)
    window.openPaymentModal = function(plan) {
        var modal = document.getElementById('paymentModal');
        var planName = document.getElementById('modalPlanName');
        var payAmount = document.getElementById('payAmount');

        if (!modal) return;

        var prices = {
            'Free': '₹0',
            'Pro': '₹999',
            'Career': '₹2,499'
        };

        if (planName) planName.textContent = plan + ' Plan';
        if (payAmount) payAmount.textContent = prices[plan] || '₹999';

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // Close payment modal (global scope)
    window.closePaymentModal = function() {
        var modal = document.getElementById('paymentModal');
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Tab switching (global scope)
    window.switchTab = function(tabName) {
        var tabs = document.querySelectorAll('.tab-btn');
        var contents = document.querySelectorAll('.tab-content');

        for (var i = 0; i < tabs.length; i++) {
            tabs[i].classList.toggle('active', tabs[i].getAttribute('data-tab') === tabName);
        }

        for (var j = 0; j < contents.length; j++) {
            contents[j].classList.toggle('active', contents[j].id === 'tab-' + tabName);
        }
    };

    // Process payment (global scope)
    window.processPayment = function() {
        showToast('Payment initiated! You will receive a confirmation shortly.');
        setTimeout(closePaymentModal, 2000);
    };

    // ========== TOAST NOTIFICATION ==========
    function showToast(message) {
        var toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add('show');

        setTimeout(function() {
            toast.classList.remove('show');
        }, 4000);
    }

    // ========== SMOOTH SCROLL ==========
    function initSmoothScroll() {
        var links = document.querySelectorAll('a[href^="#"]');
        for (var i = 0; i < links.length; i++) {
            links[i].addEventListener('click', function(e) {
                var href = this.getAttribute('href');
                if (href === '#') return;

                var target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    var offset = 80; // navbar height
                    var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                    window.scrollTo({
                        top: top,
                        behavior: 'smooth'
                    });
                }
            });
        }
    }

})();
