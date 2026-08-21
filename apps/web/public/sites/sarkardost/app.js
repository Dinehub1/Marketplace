/**
 * ============================================================
 * SarkarDost — Main JavaScript
 * Features: Dark mode, mobile nav, FAQ accordion,
 *           testimonial carousel, UPI payment modal,
 *           language toggle, scroll effects
 * ============================================================
 */

(function () {
    'use strict';

    /* ============================================================
       1. DARK MODE TOGGLE
       ============================================================ */
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // Check for saved theme preference or respect OS preference
    function getPreferredTheme() {
        const saved = localStorage.getItem('sarkardost-theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function applyTheme(theme) {
        html.setAttribute('data-theme', theme);
        localStorage.setItem('sarkardost-theme', theme);
    }

    // Initialize theme
    applyTheme(getPreferredTheme());

    themeToggle.addEventListener('click', function () {
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    });

    /* ============================================================
       2. MOBILE NAVIGATION
       ============================================================ */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    function toggleMobileMenu() {
        const isOpen = mobileMenu.classList.contains('active');
        mobileMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', !isOpen);
        document.body.style.overflow = isOpen ? '' : 'hidden';
    }

    hamburger.addEventListener('click', toggleMobileMenu);

    // Close mobile menu when a link is clicked
    mobileLinks.forEach(function (link) {
        link.addEventListener('click', function () {
            if (mobileMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });

    // Close mobile menu on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            toggleMobileMenu();
            hamburger.focus();
        }
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (e) {
        if (mobileMenu.classList.contains('active') &&
            !mobileMenu.contains(e.target) &&
            !hamburger.contains(e.target)) {
            toggleMobileMenu();
        }
    });

    /* ============================================================
       3. NAVBAR SCROLL EFFECT
       ============================================================ */
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    function handleNavbarScroll() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });

    /* ============================================================
       4. FAQ ACCORDION
       ============================================================ */
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

    /* ============================================================
       5. TESTIMONIAL CAROUSEL
       ============================================================ */
    const track = document.querySelector('.testimonials-track');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    let currentSlide = 0;
    const totalSlides = dots.length;
    let autoSlideInterval;

    function goToSlide(index) {
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;

        currentSlide = index;
        track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';

        dots.forEach(function (dot, i) {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    function nextSlide() {
        goToSlide(currentSlide + 1);
    }

    function prevSlide() {
        goToSlide(currentSlide - 1);
    }

    // Auto-advance every 5 seconds
    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
    }

    // Event listeners
    if (nextBtn) nextBtn.addEventListener('click', function () { nextSlide(); startAutoSlide(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prevSlide(); startAutoSlide(); });

    dots.forEach(function (dot, index) {
        dot.addEventListener('click', function () {
            goToSlide(index);
            startAutoSlide();
        });
    });

    // Pause auto-slide on hover
    const carousel = document.getElementById('testimonials-carousel');
    if (carousel) {
        carousel.addEventListener('mouseenter', stopAutoSlide);
        carousel.addEventListener('mouseleave', startAutoSlide);
    }

    // Start auto-slide
    startAutoSlide();

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    if (track) {
        track.addEventListener('touchstart', function (e) {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoSlide();
        }, { passive: true });

        track.addEventListener('touchend', function (e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            startAutoSlide();
        }, { passive: true });
    }

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    }

    /* ============================================================
       6. UPI PAYMENT MODAL
       ============================================================ */
    const modal = document.getElementById('payment-modal');
    const modalClose = document.getElementById('modal-close');
    const payNowBtn = document.getElementById('pay-now-btn');

    // Plan details
    const planDetails = {
        free: { name: 'Free', amount: '₹0', display: '₹0 — Free Forever' },
        pro: { name: 'Pro', amount: '₹99', display: '₹99/month' },
        enterprise: { name: 'Enterprise', amount: '₹299', display: '₹299/month' }
    };

    let selectedPlan = 'pro';

    // Expose to global scope for onclick handlers
    window.openPaymentModal = function (plan) {
        selectedPlan = plan;
        const details = planDetails[plan];

        document.getElementById('summary-plan').textContent = details.name;
        document.getElementById('summary-amount').textContent = details.display;
        document.getElementById('pay-amount').textContent = details.amount;

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Focus the UPI input for accessibility
        setTimeout(function () {
            const upiInput = document.getElementById('upi-id');
            if (upiInput) upiInput.focus();
        }, 100);
    };

    window.closePaymentModal = function () {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    window.selectUpiApp = function (app) {
        const upiInput = document.getElementById('upi-id');
        if (upiInput) {
            upiInput.value = '';
            upiInput.placeholder = 'Opening ' + app + '...';
            // In a real app, this would trigger the UPI deep link
        }
    };

    window.processPayment = function () {
        const upiId = document.getElementById('upi-id').value.trim();

        if (selectedPlan === 'free') {
            alert('Welcome to SarkarDost Free! No payment required.');
            closePaymentModal();
            return;
        }

        if (selectedPlan === 'enterprise') {
            alert('Our sales team will contact you shortly. Thank you for your interest in SarkarDost Enterprise!');
            closePaymentModal();
            return;
        }

        if (!upiId || !upiId.includes('@')) {
            alert('Please enter a valid UPI ID (e.g., yourname@paytm)');
            document.getElementById('upi-id').focus();
            return;
        }

        // Simulate payment processing
        payNowBtn.textContent = 'Processing...';
        payNowBtn.disabled = true;

        setTimeout(function () {
            alert('Payment of ' + planDetails[selectedPlan].display + ' initiated! Please approve the request in your UPI app.');
            payNowBtn.textContent = 'Pay Now ' + planDetails[selectedPlan].amount;
            payNowBtn.disabled = false;
            closePaymentModal();
        }, 1500);
    };

    // Close modal on overlay click
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closePaymentModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closePaymentModal();
        }
    });

    modalClose.addEventListener('click', closePaymentModal);

    /* ============================================================
       7. LANGUAGE TOGGLE (Hindi/English)
       ============================================================ */
    const langToggle = document.getElementById('lang-toggle');
    let currentLang = 'en';

    const translations = {
        en: {
            badge: '🇮🇳 Trusted by 5 Lakh+ Citizens',
            hero_title: 'Your <span class="text-gradient">Friend</span> for Every Government Service',
            hero_subtitle: 'Book appointments, manage documents, track applications, and pay fees — all from your phone. SarkarDost makes government services simple, fast, and friendly.',
            features_badge: 'Features',
            features_title: 'Everything You Need, <span class="text-gradient">All in One App</span>',
            features_subtitle: 'From booking appointments to tracking applications — SarkarDost handles it all so you don\'t have to run from office to office.',
            hiw_badge: 'How It Works',
            hiw_title: 'Get Started in <span class="text-gradient">3 Simple Steps</span>',
            hiw_subtitle: 'No more standing in queues or visiting multiple offices. SarkarDost brings government services to your fingertips.',
            pricing_badge: 'Pricing',
            pricing_title: 'Simple, <span class="text-gradient">Transparent</span> Pricing',
            pricing_subtitle: 'Start free. Upgrade when you need more. No hidden charges, ever.',
            testimonials_badge: 'Testimonials',
            testimonials_title: 'Loved by <span class="text-gradient">Citizens</span> Across India',
            testimonials_subtitle: 'See what our users have to say about their SarkarDost experience.',
            faq_badge: 'FAQ',
            faq_title: 'Frequently Asked <span class="text-gradient">Questions</span>',
            faq_subtitle: 'Got questions? We\'ve got answers. Can\'t find what you\'re looking for? Chat with us.'
        },
        hi: {
            badge: '🇮🇳 5 लाख+ नागरिकों द्वारा विश्वसनीय',
            hero_title: 'हर सरकारी सेवा के लिए आपका <span class="text-gradient">दोस्त</span>',
            hero_subtitle: 'अपॉइंटमेंट बुक करें, दस्तावेज़ प्रबंधित करें, आवेदनों को ट्रैक करें और फीस का भुगतान करें — सब कुछ अपने फोन से। SarkarDost सरकारी सेवाओं को सरल, तेज़ और अनुकूल बनाता है।',
            features_badge: 'विशेषताएं',
            features_title: 'आपको जो चाहिए, <span class="text-gradient">सब एक ऐप में</span>',
            features_subtitle: 'अपॉइंटमेंट बुक करने से लेकर आवेदनों को ट्रैक करने तक — SarkarDost सब कुछ संभालता है।',
            hiw_badge: 'यैसे काम करता है',
            hiw_title: '<span class="text-gradient">3 आसान चरणों</span> में शुरू करें',
            hiw_subtitle: 'अब कतारों में खड़े होने या कई कार्यालयों जाने की जरूरत नहीं।',
            pricing_badge: 'मूल्य निर्धारण',
            pricing_title: 'सरल, <span class="text-gradient">पारदर्शी</span> मूल्य',
            pricing_subtitle: 'मुफ्त शुरू करें। जरूरत पर अपग्रेड करें।',
            testimonials_badge: 'प्रशंसापत्र',
            testimonials_title: 'पूरे भारत के <span class="text-gradient">नागरिकों</span> द्वारा पसंद किया गया',
            testimonials_subtitle: 'हमारे उपयोगकर्ताओं का SarkarDost अनुभव देखें।',
            faq_badge: 'अक्सर पूछे जाने वाले प्रश्न',
            faq_title: 'अक्सर पूछे जाने वाले <span class="text-gradient">प्रश्न</span>',
            faq_subtitle: 'कोई सवाल है? हमारे पास जवाब हैं।'
        }
    };

    langToggle.addEventListener('click', function () {
        currentLang = currentLang === 'en' ? 'hi' : 'en';
        langToggle.textContent = currentLang === 'en' ? 'हि' : 'EN';

        const t = translations[currentLang];
        Object.keys(t).forEach(function (key) {
            const el = document.querySelector('[data-i18n="' + key + '"]');
            if (el) {
                el.innerHTML = t[key];
            }
        });
    });

    /* ============================================================
       8. SMOOTH SCROLL FOR ANCHOR LINKS
       ============================================================ */
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 72;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /* ============================================================
       9. SCROLL-TRIGGERED FADE-IN ANIMATIONS
       ============================================================ */
    // Add fade-in class to major sections
    const animatedElements = document.querySelectorAll(
        '.feature-card, .step, .pricing-card, .testimonial-card, .faq-item, .cta-box'
    );

    animatedElements.forEach(function (el) {
        el.classList.add('fade-in');
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(function (el) {
        observer.observe(el);
    });

    /* ============================================================
       10. ACTIVE NAV LINK HIGHLIGHTING
       ============================================================ */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function highlightNav() {
        const scrollY = window.pageYOffset;

        sections.forEach(function (section) {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(function (link) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', highlightNav, { passive: true });

    /* ============================================================
       CONSOLE WELCOME MESSAGE
       ============================================================ */
    console.log('%c🤝 SarkarDost — Your Government Services Companion', 'color: #4F46E5; font-size: 16px; font-weight: bold;');
    console.log('%cBuilt with ❤️ in India', 'color: #94A3B8; font-size: 12px;');

})();
