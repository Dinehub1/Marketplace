/* ============================================
   SARKARED - AI-POWERED EDUCATION PORTAL
   Main JavaScript Application
   ============================================ */

(function () {
    'use strict';

    // ==================== //
    // DOM REFERENCES       //
    // ==================== //
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const navToggle = $('#navToggle');
    const navMenu = $('#navMenu');
    const navLinks = $$('.nav-link');
    const themeToggle = $('#themeToggle');
    const themeIcon = $('#themeIcon');
    const paymentModal = $('#paymentModal');
    const closePaymentModal = $('#closePaymentModal');
    const toast = $('#toast');
    const faqQuestions = $$('.faq-question');
    const findScholarshipBtn = $('#findScholarshipBtn');
    const heroSearchBtn = $('#heroSearchBtn');
    const heroSearchInput = $('#heroSearchInput');
    const suggestionTags = $$('.suggestion-tag');

    // ==================== //
    // NAVBAR SCROLL        //
    // ==================== //
    const navbar = $('#navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 80) {
            navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = 'none';
        }

        // Active nav link based on scroll position
        const sections = $$('section[id]');
        sections.forEach((section) => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (currentScroll >= sectionTop && currentScroll < sectionTop + sectionHeight) {
                navLinks.forEach((link) => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });

        lastScroll = currentScroll;
    });

    // ==================== //
    // MOBILE NAV TOGGLE    //
    // ==================== //
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', !isExpanded);
        });
    }

    // Close mobile nav on link click
    navLinks.forEach((link) => {
        link.addEventListener('click', () => {
            if (navToggle) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // ==================== //
    // DARK MODE TOGGLE     //
    // ==================== //
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('sarkared-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

            if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                themeIcon.className = 'fas fa-moon';
                localStorage.setItem('sarkared-theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                themeIcon.className = 'fas fa-sun';
                localStorage.setItem('sarkared-theme', 'dark');
            }
        });
    }

    // ==================== //
    // TYPING EFFECT        //
    // ==================== //
    const typingTexts = [
        "Hi! I'm your AI learning assistant. What would you like to learn today? 🎓",
        "I can help you find the perfect course, check scholarship eligibility, or create a personalized learning path. Try asking me!",
    ];

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingElement = $('#typingText');
    const typingSpeed = 50;
    const deletingSpeed = 30;
    const pauseDuration = 3000;

    function typeEffect() {
        if (!typingElement) return;

        const currentText = typingTexts[textIndex];

        if (isDeleting) {
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }

        let speed = isDeleting ? deletingSpeed : typingSpeed;

        if (!isDeleting && charIndex === currentText.length) {
            speed = pauseDuration;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % typingTexts.length;
            speed = 500;
        }

        setTimeout(typeEffect, speed);
    }

    // Start typing effect after page load
    window.addEventListener('load', () => {
        setTimeout(typeEffect, 1000);
    });

    // ==================== //
    // HERO SEARCH          //
    // ==================== //
    if (heroSearchBtn && heroSearchInput) {
        heroSearchBtn.addEventListener('click', () => {
            const query = heroSearchInput.value.trim();
            if (query) {
                showToast(`Searching AI-powered results for "${query}"...`);
                // Simulate search
                setTimeout(() => {
                    showToast(`Found 42 courses matching "${query}"!`);
                }, 1500);
            } else {
                heroSearchInput.focus();
                heroSearchInput.style.borderColor = '#EF4444';
                setTimeout(() => {
                    heroSearchInput.style.borderColor = '';
                }, 2000);
            }
        });

        heroSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                heroSearchBtn.click();
            }
        });
    }

    // Search suggestion tags
    suggestionTags.forEach((tag) => {
        tag.addEventListener('click', () => {
            if (heroSearchInput) {
                heroSearchInput.value = tag.textContent;
                heroSearchBtn.click();
            }
        });
    });

    // ==================== //
    // CATEGORY CARDS       //
    // ==================== //
    const categoryCards = $$('.category-card');
    categoryCards.forEach((card) => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            const categoryName = card.querySelector('h3').textContent;
            showToast(`Loading ${categoryName} courses...`);
        });
    });

    // ==================== //
    // SCHOLARSHIP FINDER    //
    // ==================== //
    const scholarshipData = [
        {
            name: "National Scholarship Portal (NSP)",
            description: "Central government scholarship for SC/ST/OBC/Minority students",
            amount: "₹20,000 - ₹50,000/year",
            deadline: "31 Oct 2026"
        },
        {
            name: "PM Vidyalaxmi Scheme",
            description: "Interest subsidy on education loans for meritorious students",
            amount: "Up to ₹10 Lakh loan",
            deadline: "Rolling"
        },
        {
            name: "AICTE Pragati Scholarship",
            description: "For girls pursuing technical education",
            amount: "₹50,000/year",
            deadline: "30 Sep 2026"
        },
        {
            name: "State Merit Scholarship",
            description: "State government scholarship for top-performing students",
            amount: "₹12,000 - ₹36,000/year",
            deadline: "15 Nov 2026"
        },
        {
            name: "INSPIRE Scholarship",
            description: "DST scholarship for students pursuing science & research",
            amount: "₹80,000/year",
            deadline: "31 Dec 2026"
        },
        {
            name: "Central Sector Scholarship",
            description: "For students with family income below ₹4.5 lakh",
            amount: "₹20,000/year",
            deadline: "31 Oct 2026"
        }
    ];

    if (findScholarshipBtn) {
        findScholarshipBtn.addEventListener('click', () => {
            const category = $('#scholarCategory').value;
            const level = $('#scholarClass').value;
            const income = $('#scholarIncome').value;
            const resultsContainer = $('#scholarshipResults');

            if (!category && !level && !income) {
                showToast('Please select at least one filter to search.');
                return;
            }

            // Show loading state
            findScholarshipBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            findScholarshipBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                // Filter results (simplified)
                let results = scholarshipData;
                if (category === 'sc' || category === 'st' || category === 'obc' || category === 'minority') {
                    results = scholarshipData.slice(0, 4);
                } else if (category === 'ews') {
                    results = scholarshipData.slice(1, 5);
                }

                // Render results
                resultsContainer.innerHTML = results.map((s) => `
                    <div class="scholarship-card">
                        <h4>${s.name}</h4>
                        <p>${s.description}</p>
                        <span class="scholarship-amount">${s.amount}</span>
                        <span class="scholarship-deadline">⏰ ${s.deadline}</span>
                    </div>
                `).join('');

                showToast(`Found ${results.length} matching scholarships!`);

                // Reset button
                findScholarshipBtn.innerHTML = '<i class="fas fa-search"></i> Find Scholarships';
                findScholarshipBtn.disabled = false;
            }, 1200);
        });
    }

    // ==================== //
    // FAQ ACCORDION        //
    // ==================== //
    faqQuestions.forEach((question) => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = question.getAttribute('aria-expanded') === 'true';

            // Close all other FAQs
            faqQuestions.forEach((q) => {
                q.setAttribute('aria-expanded', 'false');
                q.nextElementSibling.classList.remove('open');
            });

            // Toggle current
            if (!isOpen) {
                question.setAttribute('aria-expanded', 'true');
                answer.classList.add('open');
            }
        });
    });

    // ==================== //
    // PAYMENT MODAL        //
    // ==================== //
    window.openPaymentModal = function (planName, amount) {
        const planNameEl = $('#paymentPlanName');
        const planAmountEl = $('#paymentPlanAmount');
        const upiPayAmountEl = $('#upiPayAmount');
        const cardPayAmountEl = $('#cardPayAmount');
        const netbankingPayAmountEl = $('#netbankingPayAmount');

        if (planNameEl) planNameEl.textContent = planName;
        if (planAmountEl) planAmountEl.textContent = amount;
        if (upiPayAmountEl) upiPayAmountEl.textContent = amount;
        if (cardPayAmountEl) cardPayAmountEl.textContent = amount;
        if (netbankingPayAmountEl) netbankingPayAmountEl.textContent = amount;

        paymentModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    function closePaymentModalFn() {
        paymentModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (closePaymentModal) {
        closePaymentModal.addEventListener('click', closePaymentModalFn);
    }

    // Close modal on overlay click
    paymentModal.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            closePaymentModalFn();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && paymentModal.classList.contains('active')) {
            closePaymentModalFn();
        }
    });

    // ==================== //
    // PAYMENT TABS         //
    // ==================== //
    const paymentTabs = $$('.payment-tab');
    const paymentTabContents = $$('.payment-tab-content');

    paymentTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Remove active from all
            paymentTabs.forEach((t) => t.classList.remove('active'));
            paymentTabContents.forEach((c) => c.classList.remove('active'));

            // Add active to clicked
            tab.classList.add('active');
            const targetContent = $(`${targetTab}Tab`);
            if (targetContent) targetContent.classList.add('active');
        });
    });

    // ==================== //
    // UPI APP SELECTION    //
    // ==================== //
    const upiApps = $$('.upi-app');
    upiApps.forEach((app) => {
        app.addEventListener('click', () => {
            upiApps.forEach((a) => a.classList.remove('selected'));
            app.classList.add('selected');
        });
    });

    // ==================== //
    // BANK SELECTION       //
    // ==================== //
    const bankOptions = $$('.bank-option');
    bankOptions.forEach((bank) => {
        bank.addEventListener('click', () => {
            bankOptions.forEach((b) => b.classList.remove('selected'));
            bank.classList.add('selected');
        });
    });

    // ==================== //
    // PAYMENT BUTTONS      //
    // ==================== //
    const upiPayBtn = $('#upiPayBtn');
    const cardPayBtn = $('#cardPayBtn');
    const netbankingPayBtn = $('#netbankingPayBtn');

    if (upiPayBtn) {
        upiPayBtn.addEventListener('click', () => {
            const upiId = $('#upiId').value.trim();
            if (!upiId) {
                showToast('Please enter a valid UPI ID');
                return;
            }
            showToast('Processing UPI payment...');
            setTimeout(() => {
                closePaymentModalFn();
                showToast('🎉 Payment successful! Welcome to SarkarEd Pro!');
            }, 2000);
        });
    }

    if (cardPayBtn) {
        cardPayBtn.addEventListener('click', () => {
            const cardNumber = $('#cardNumber').value.trim();
            if (!cardNumber) {
                showToast('Please enter card details');
                return;
            }
            showToast('Processing card payment...');
            setTimeout(() => {
                closePaymentModalFn();
                showToast('🎉 Payment successful! Welcome to SarkarEd Pro!');
            }, 2000);
        });
    }

    if (netbankingPayBtn) {
        netbankingPayBtn.addEventListener('click', () => {
            const selectedBank = $('.bank-option.selected');
            if (!selectedBank) {
                showToast('Please select a bank');
                return;
            }
            showToast('Redirecting to net banking...');
            setTimeout(() => {
                closePaymentModalFn();
                showToast('🎉 Payment successful! Welcome to SarkarEd Pro!');
            }, 2000);
        });
    }

    // ==================== //
    // CARD NUMBER FORMATTING //
    // ==================== //
    const cardNumberInput = $('#cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formatted;
        });
    }

    // ==================== //
    // EXPIRY FORMATTING    //
    // ==================== //
    const cardExpiryInput = $('#cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            e.target.value = value;
        });
    }

    // ==================== //
    // TOAST NOTIFICATION   //
    // ==================== //
    let toastTimeout;

    window.showToast = function (message) {
        const toastEl = $('#toast');
        const toastMsg = $('#toastMessage');
        if (!toastEl || !toastMsg) return;

        toastMsg.textContent = message;
        toastEl.classList.add('show');

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3500);
    };

    // ==================== //
    // SMOOTH SCROLL        //
    // ==================== //
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = document.querySelector('.navbar')?.offsetHeight || 70;
                const targetPosition = target.offsetTop - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==================== //
    // INTERSECTION OBSERVER //
    // Animate elements on scroll
    // ==================== //
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe cards for scroll animation
    document.querySelectorAll('.category-card, .feature-card, .step-card, .testimonial-card, .pricing-card').forEach((el) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });

    // ==================== //
    // ANIMATED COUNTERS    //
    // ==================== //
    const statNumbers = $$('.stat-number');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.count);
                const duration = 2000;
                const step = target / (duration / 16);
                let current = 0;

                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        el.textContent = Math.floor(current).toLocaleString('en-IN') + (target >= 100000 ? '+' : target >= 100 ? '+' : '%');
                        requestAnimationFrame(updateCounter);
                    } else {
                        el.textContent = target.toLocaleString('en-IN') + (target >= 100000 ? '+' : target >= 100 ? '+' : '%');
                    }
                };

                updateCounter();
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach((stat) => counterObserver.observe(stat));

    // ==================== //
    // CONSOLE WELCOME      //
    // ==================== //
    console.log('%c🎓 SarkarEd - AI-Powered Education Portal', 'color: #6C3CE1; font-size: 16px; font-weight: bold;');
    console.log('%cBuilt with ❤️ for Indian learners', 'color: #888; font-size: 12px;');

})();
