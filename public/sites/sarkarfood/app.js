/**
 * ============================================================
 * SarkarFood — Main JavaScript
 * Features: Dark mode, mobile menu, FAQ accordion,
 * UPI payment modal, smooth scroll, navbar scroll effect,
 * back-to-top button, intersection observer animations.
 * ============================================================
 */

(function () {
  'use strict';

  // ========== DOM ELEMENTS ==========
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const navbar = $('#navbar');
  const hamburger = $('#hamburger');
  const mobileMenu = $('#mobileMenu');
  const themeToggle = $('#themeToggle');
  const backToTop = $('#backToTop');
  const paymentModal = $('#paymentModal');
  const modalClose = $('#modalClose');
  const faqItems = $$('.faq-item');

  // ========== DARK MODE TOGGLE ==========
  function initTheme() {
    // Check saved preference or system preference
    const savedTheme = localStorage.getItem('sarkarfood-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sarkarfood-theme', next);
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // ========== MOBILE MENU ==========
  function toggleMobileMenu() {
    const isOpen = mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', !isOpen);
    mobileMenu.setAttribute('aria-hidden', isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (hamburger) {
    hamburger.addEventListener('click', toggleMobileMenu);
  }

  // Close mobile menu when a link is clicked
  $$('.mobile-nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      closeMobileMenu();
    });
  });

  // Close mobile menu on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closePaymentModal();
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function (e) {
    if (
      mobileMenu &&
      mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeMobileMenu();
    }
  });

  // ========== NAVBAR SCROLL EFFECT ==========
  function handleNavbarScroll() {
    if (!navbar) return;
    const scrollY = window.scrollY;
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // ========== BACK TO TOP BUTTON ==========
  function handleBackToTop() {
    if (!backToTop) return;
    if (window.scrollY > 500) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }

  // Combined scroll handler
  function onScroll() {
    handleNavbarScroll();
    handleBackToTop();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ========== FAQ ACCORDION ==========
  faqItems.forEach(function (item) {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!question || !answer) return;

    question.addEventListener('click', function () {
      const isActive = item.classList.contains('active');

      // Close all other FAQ items
      faqItems.forEach(function (otherItem) {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
          const otherQuestion = otherItem.querySelector('.faq-question');
          const otherAnswer = otherItem.querySelector('.faq-answer');
          if (otherQuestion) otherQuestion.setAttribute('aria-expanded', 'false');
          if (otherAnswer) otherAnswer.setAttribute('aria-hidden', 'true');
        }
      });

      // Toggle current item
      item.classList.toggle('active');
      question.setAttribute('aria-expanded', !isActive);
      answer.setAttribute('aria-hidden', isActive);
    });
  });

  // ========== UPI PAYMENT MODAL ==========
  let currentPlan = 'pro';

  // Plan pricing data
  var planPricing = {
    free: { name: 'Free', amount: '0' },
    pro: { name: 'Pro', amount: '99' },
    family: { name: 'Family', amount: '249' }
  };

  // Open modal with plan info
  window.openPaymentModal = function (plan) {
    currentPlan = plan || 'pro';
    var pricing = planPricing[currentPlan] || planPricing.pro;

    var summaryPlan = $('#summaryPlan');
    var summaryAmount = $('#summaryAmount');

    if (summaryPlan) summaryPlan.textContent = pricing.name;
    if (summaryAmount.textContent = pricing.amount);

    if (paymentModal) {
      paymentModal.classList.add('open');
      paymentModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // Focus the close button for accessibility
      if (modalClose) modalClose.focus();
    }
  };

  function closePaymentModal() {
    if (paymentModal) {
      paymentModal.classList.remove('open');
      paymentModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (modalClose) {
    modalClose.addEventListener('click', closePaymentModal);
  }

  // Close modal when clicking overlay
  if (paymentModal) {
    paymentModal.addEventListener('click', function (e) {
      if (e.target === paymentModal) {
        closePaymentModal();
      }
    });
  }

  // UPI app selection
  window.selectUPI = function (app) {
    // Visual feedback
    $$('.upi-app').forEach(function (el) {
      el.classList.remove('selected');
    });
    // Find the clicked button
    var buttons = $$('.upi-app');
    buttons.forEach(function (btn) {
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').indexOf(app) !== -1) {
        btn.classList.add('selected');
      }
    });

    // Simulate payment flow
    showPaymentStatus('Opening ' + app + '...', 'info');
    setTimeout(function () {
      showPaymentStatus('Payment request sent to ' + app + '. Please approve.', 'success');
    }, 1500);
  };

  // Other payment method selection
  window.selectPayment = function (method) {
    var methodNames = {
      card: 'Credit/Debit Card',
      netbanking: 'Net Banking',
      wallet: 'Wallet'
    };
    showPaymentStatus('Redirecting to ' + (methodNames[method] || method) + '...', 'info');
  };

  // UPI ID verify button
  var upiVerifyBtn = $('#upiVerifyBtn');
  var upiInput = $('#upiId');

  if (upiVerifyBtn && upiInput) {
    upiVerifyBtn.addEventListener('click', function () {
      var upiId = upiInput.value.trim();
      if (!upiId) {
        showPaymentStatus('Please enter a UPI ID', 'error');
        upiInput.focus();
        return;
      }
      // Basic UPI ID validation
      if (upiId.indexOf('@') === -1) {
        showPaymentStatus('Please enter a valid UPI ID (e.g., name@paytm)', 'error');
        upiInput.focus();
        return;
      }
      showPaymentStatus('Sending payment request to ' + upiId + '...', 'info');
      setTimeout(function () {
        showPaymentStatus('Payment request sent! Please approve in your UPI app.', 'success');
      }, 2000);
    });
  }

  // Payment status message
  function showPaymentStatus(message, type) {
    // Remove existing status
    var existing = $('.payment-status');
    if (existing) existing.remove();

    var statusEl = document.createElement('div');
    statusEl.className = 'payment-status payment-status-' + type;
    statusEl.textContent = message;
    statusEl.style.cssText = [
      'padding: 12px 16px',
      'border-radius: 8px',
      'font-size: 14px',
      'font-weight: 500',
      'margin-top: 16px',
      'text-align: center',
      'animation: fadeInUp 0.3s ease',
      type === 'error' ? 'background: #FFEBEE; color: #C62828;' : '',
      type === 'success' ? 'background: #E8F5E9; color: #2E7D32;' : '',
      type === 'info' ? 'background: #E3F2FD; color: #1565C0;' : ''
    ].join(';');

    var modalBody = $('.modal-body');
    if (modalBody) {
      modalBody.appendChild(statusEl);

      // Auto-remove after 5 seconds
      setTimeout(function () {
        if (statusEl.parentNode) {
          statusEl.style.opacity = '0';
          statusEl.style.transition = 'opacity 0.3s ease';
          setTimeout(function () {
            if (statusEl.parentNode) statusEl.remove();
          }, 300);
        }
      }, 5000);
    }
  }

  // ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
  $$('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var targetEl = $(targetId);
      if (targetEl) {
        e.preventDefault();
        var offset = 80; // navbar height
        var targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ========== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS ==========
  function initScrollAnimations() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe sections and cards
    var animatedElements = $$(
      '.feature-card, .category-card, .step-card, .testimonial-card, .pricing-card, .faq-item'
    );
    animatedElements.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // ========== KEYBOARD ACCESSIBILITY FOR MODAL ==========
  if (paymentModal) {
    paymentModal.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        // Trap focus within modal
        var focusable = paymentModal.querySelectorAll(
          'button, input, [tabindex]:not([tabindex="-1"])'
        );
        var firstFocusable = focusable[0];
        var lastFocusable = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });
  }

  // ========== RESIZE HANDLER ==========
  var resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      // Close mobile menu on resize to desktop
      if (window.innerWidth > 768) {
        closeMobileMenu();
      }
    }, 250);
  });

  // ========== INITIALIZATION ==========
  function init() {
    initTheme();
    onScroll(); // Set initial scroll state
    initScrollAnimations();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
