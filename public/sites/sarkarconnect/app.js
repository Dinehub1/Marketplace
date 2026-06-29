/**
 * ============================================
 * SarkarConnect - Citizen Services Portal
 * Main JavaScript
 * ============================================
 * Features:
 * - Dark mode toggle with localStorage persistence
 * - Mobile menu toggle
 * - Navbar scroll effect
 * - Scroll-triggered animations (Intersection Observer)
 * - Testimonials carousel
 * - FAQ accordion with search
 * - UPI payment modal
 * - Back to top button
 * - Language toggle (Hindi/English)
 * - Counter animation
 * ============================================
 */

(function () {
    'use strict';

    /* ============================================
       1. DARK MODE TOGGLE
       ============================================ */
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    // Check for saved theme preference or respect OS preference
    function getPreferredTheme() {
        const saved = localStorage.getItem('sarkarconnect-theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function setTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('sarkarconnect-theme', theme);
    }

    // Initialize theme
    setTheme(getPreferredTheme());

    themeToggle.addEventListener('click', function () {
        const current = html.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });

    /* ============================================
       2. MOBILE MENU TOGGLE
       ============================================ */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    hamburger.addEventListener('click', function () {
        const isOpen = mobileMenu.classList.contains('active');
        mobileMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', !isOpen);
        document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.mobile-nav-link').forEach(function (link) {
        link.addEventListener('click', function () {
            mobileMenu.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });

    // Close mobile menu on resize to desktop
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) {
            mobileMenu.classList.remove('active');
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
    });

    /* ============================================
       3. NAVBAR SCROLL EFFECT
       ============================================ */
    const navbar = document.getElementById('navbar');

    function handleNavbarScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll(); // Initial check

    /* ============================================
       4. SCROLL-TRIGGERED ANIMATIONS
       ============================================ */
    const animatedElements = document.querySelectorAll('[data-animate]');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const delay = parseInt(entry.target.getAttribute('data-delay')) || 0;
                    setTimeout(function () {
                        entry.target.classList.add('animated');
                    }, delay);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(function (el) {
            observer.observe(el);
        });
    } else {
        // Fallback: show all elements immediately
        animatedElements.forEach(function (el) {
            el.classList.add('animated');
        });
    }

    /* ============================================
       5. COUNTER ANIMATION
       ============================================ */
    const counters = document.querySelectorAll('[data-count]');

    function animateCounter(el) {
        const target = el.getAttribute('data-count');
        const isFloat = target.includes('.');
        const isStar = target.includes('★');
        const suffix = isStar ? '★' : (target.includes('M') ? 'M+' : (target.includes('+') ? '+' : ''));

        let numTarget = parseFloat(target.replace(/[^0-9.]/g, ''));
        let current = 0;
        const increment = numTarget / 40;
        const duration = 1500;
        const stepTime = duration / 40;

        const timer = setInterval(function () {
            current += increment;
            if (current >= numTarget) {
                current = numTarget;
                clearInterval(timer);
            }

            if (isFloat) {
                el.textContent = current.toFixed(1) + suffix;
            } else {
                el.textContent = Math.floor(current) + suffix;
            }
        }, stepTime);
    }

    // Trigger counter animation when stats are visible
    if ('IntersectionObserver' in window && counters.length > 0) {
        const statsSection = document.querySelector('.hero-stats');
        if (statsSection) {
            const statsObserver = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) {
                    counters.forEach(animateCounter);
                    statsObserver.unobserve(entries[0].target);
                }
            }, { threshold: 0.5 });
            statsObserver.observe(statsSection);
        }
    }

    /* ============================================
       6. TESTIMONIALS CAROUSEL
       ============================================ */
    const track = document.querySelector('.testimonials-track');
    const dotsContainer = document.getElementById('testimonialDots');
    const prevBtn = document.getElementById('testimonialPrev');
    const nextBtn = document.getElementById('testimonialNext');
    const testimonialCards = document.querySelectorAll('.testimonial-card');

    if (track && testimonialCards.length > 0) {
        let currentIndex = 0;
        const totalSlides = testimonialCards.length;

        // Create dots
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.classList.add('carousel-dot');
            dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', function () {
                goToSlide(i);
            });
            dotsContainer.appendChild(dot);
        }

        const dots = dotsContainer.querySelectorAll('.carousel-dot');

        function goToSlide(index) {
            if (index < 0) index = totalSlides - 1;
            if (index >= totalSlides) index = 0;
            currentIndex = index;

            // Move track
            const cardWidth = testimonialCards[0].offsetWidth + parseInt(getComputedStyle(testimonialCards[0]).marginLeft) * 2;
            track.style.transform = 'translateX(-' + (currentIndex * cardWidth) + 'px)';

            // Update dots
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === currentIndex);
            });
        }

        prevBtn.addEventListener('click', function () {
            goToSlide(currentIndex - 1);
        });

        nextBtn.addEventListener('click', function () {
            goToSlide(currentIndex + 1);
        });

        // Auto-advance every 5 seconds
        let autoAdvance = setInterval(function () {
            goToSlide(currentIndex + 1);
        }, 5000);

        // Pause on hover
        const carousel = document.getElementById('testimonialsCarousel');
        carousel.addEventListener('mouseenter', function () {
            clearInterval(autoAdvance);
        });
        carousel.addEventListener('mouseleave', function () {
            autoAdvance = setInterval(function () {
                goToSlide(currentIndex + 1);
            }, 5000);
        });

        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        track.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        track.addEventListener('touchend', function (e) {
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    goToSlide(currentIndex + 1);
                } else {
                    goToSlide(currentIndex - 1);
                }
            }
        }, { passive: true });

        // Handle resize
        window.addEventListener('resize', function () {
            goToSlide(currentIndex);
        });
    }

    /* ============================================
       7. FAQ ACCORDION
       ============================================ */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function (item) {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', function () {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(function (otherItem) {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                    otherItem.querySelector('.faq-answer').style.maxHeight = '0';
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                question.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = '0';
            } else {
                item.classList.add('active');
                question.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    /* ============================================
       8. FAQ SEARCH
       ============================================ */
    const faqSearch = document.getElementById('faqSearch');

    if (faqSearch) {
        faqSearch.addEventListener('input', function () {
            const query = this.value.toLowerCase().trim();

            faqItems.forEach(function (item) {
                const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();

                if (question.includes(query) || answer.includes(query)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }

    /* ============================================
       9. UPI PAYMENT MODAL
       ============================================ */
    const paymentModal = document.getElementById('paymentModal');
    const modalClose = document.getElementById('modalClose');
    const payBtn = document.getElementById('payBtn');
    const upiApps = document.querySelectorAll('.upi-app');

    // Plan details
    const planDetails = {
        starter: { name: 'Starter', amount: 0 },
        pro: { name: 'Pro', amount: 99 },
        enterprise: { name: 'Enterprise', amount: 499 }
    };

    // Expose openPaymentModal to global scope for onclick handlers
    window.openPaymentModal = function (plan, amount) {
        const details = planDetails[plan] || { name: plan, amount: amount };

        document.getElementById('orderPlan').textContent = details.name;
        document.getElementById('orderAmount').textContent = '₹' + details.amount;
        document.getElementById('orderTotal').textContent = '₹' + details.amount;

        paymentModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        paymentModal.focus();
    };

    function closePaymentModal() {
        paymentModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closePaymentModal);

    // Close on overlay click
    paymentModal.addEventListener('click', function (e) {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && paymentModal.classList.contains('active')) {
            closePaymentModal();
        }
    });

    // UPI app selection
    upiApps.forEach(function (app) {
        app.addEventListener('click', function () {
            const appName = this.getAttribute('data-app');
            // Simulate opening UPI app
            alert('Opening ' + appName + '...\n\nIn production, this would trigger the UPI deep link for payment.');
        });
    });

    // Pay button handler
    payBtn.addEventListener('click', function () {
        const upiId = document.getElementById('upiId').value.trim();

        if (!upiId) {
            alert('Please enter a valid UPI ID');
            return;
        }

        // Basic UPI ID validation
        if (!upiId.includes('@')) {
            alert('Please enter a valid UPI ID (e.g., yourname@paytm)');
            return;
        }

        // Simulate payment processing
        payBtn.textContent = 'Processing...';
        payBtn.disabled = true;

        setTimeout(function () {
            alert('Payment request sent to ' + upiId + '!\n\nPlease approve the request in your UPI app.');
            payBtn.textContent = 'Pay Now';
            payBtn.disabled = false;
            closePaymentModal();
        }, 2000);
    });

    /* ============================================
       10. BACK TO TOP BUTTON
       ============================================ */
    const backToTop = document.getElementById('backToTop');

    function handleBackToTop() {
        if (window.scrollY > 500) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    }

    window.addEventListener('scroll', handleBackToTop, { passive: true });

    backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    /* ============================================
       11. LANGUAGE TOGGLE (Hindi/English)
       ============================================ */
    const langToggle = document.getElementById('langToggle');
    let isHindi = false;

    // Simple translations for demo
    const translations = {
        'Services': 'सेवाएं',
        'How It Works': 'यैसे काम करता है',
        'Pricing': 'मूल्य निर्धारण',
        'Testimonials': 'प्रशंसापत्र',
        'FAQ': 'अक्सर पूछे जाने वाले प्रश्न',
        'Contact': 'संपर्क',
        'Get Started': 'शुरू हो जाओ',
        'Your Gateway to': 'आपका गेटवे',
        'Government Services': 'सरकारी सेवाएं',
        'All in One Place': 'सब एक जगह',
        'Explore Services': 'सेवाएं खोजें',
        'Watch Demo': 'डेमो देखें'
    };

    langToggle.addEventListener('click', function () {
        isHindi = !isHindi;
        this.textContent = isHindi ? 'English' : 'हिंदी';

        // Toggle language on nav links
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(function (link) {
            const text = link.textContent.trim();
            if (isHindi && translations[text]) {
                link.textContent = translations[text];
            } else if (!isHindi) {
                // Reverse lookup
                for (const [eng, hin] of Object.entries(translations)) {
                    if (hin === text) {
                        link.textContent = eng;
                        break;
                    }
                }
            }
        });

        // Toggle CTA buttons
        document.querySelectorAll('.btn-nav, .hero-cta .btn-primary').forEach(function (btn) {
            const text = btn.textContent.trim();
            if (isHindi && translations[text]) {
                btn.childNodes[0].textContent = translations[text] + ' ';
            } else if (!isHindi) {
                for (const [eng, hin] of Object.entries(translations)) {
                    if (text.includes(hin)) {
                        btn.childNodes[0].textContent = eng + ' ';
                        break;
                    }
                }
            }
        });
    });

    /* ============================================
       12. SMOOTH SCROLL FOR ANCHOR LINKS
       ============================================ */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    /* ============================================
       13. AD BANNER ROTATION (Simple)
       ============================================ */
    const adBanners = document.querySelectorAll('.ad-banner');
    if (adBanners.length > 0) {
        // Add subtle animation to ad banners
        adBanners.forEach(function (banner, index) {
            banner.style.animationDelay = (index * 0.5) + 's';
        });
    }

    /* ============================================
       14. CONSOLE WELCOME MESSAGE
       ============================================ */
    console.log('%c🏛️ SarkarConnect - Citizen Services Portal', 'font-size: 16px; font-weight: bold; color: #1a56db;');
    console.log('%cConnecting citizens to government services seamlessly.', 'font-size: 12px; color: #475569;');

})();
