/**
 * SarkarDukaan — Local Business Directory Platform v1.0
 * Main JavaScript | Built by Loop Agent | ZOO Company
 * Features: Dark Mode, Mobile Menu, UPI Payment Modal, FAQ Accordion,
 * Testimonial Carousel, Hero Stats Counter, Toast Notifications,
 * Navbar Scroll Effect, Smooth Scrolling
 */

(function() {
  'use strict';

  /* ========================================
     DARK MODE TOGGLE
     ======================================== */
  const darkToggle = document.getElementById('darkToggle');
  const html = document.documentElement;

  // Check for saved preference or system preference
  function initDarkMode() {
    const saved = localStorage.getItem('sarkardukaan-dark');
    if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      html.setAttribute('data-theme', 'dark');
      updateDarkIcon(true);
    }
  }

  function updateDarkIcon(isDark) {
    const icon = darkToggle.querySelector('.dark-icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
  }

  darkToggle.addEventListener('click', function() {
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('sarkardukaan-dark', 'false');
      updateDarkIcon(false);
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('sarkardukaan-dark', 'true');
      updateDarkIcon(true);
    }
  });

  /* ========================================
     MOBILE MENU TOGGLE
     ======================================== */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', function() {
    const isOpen = mobileMenu.classList.contains('open');
    if (isOpen) {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    } else {
      mobileMenu.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
    }
  });

  // Close mobile menu when a link is clicked
  mobileMenu.querySelectorAll('.mobile-link').forEach(function(link) {
    link.addEventListener('click', function() {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ========================================
     NAVBAR SCROLL EFFECT
     ======================================== */
  const navbar = document.getElementById('navbar');

  function onScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Initial check

  /* ========================================
     HERO STATS COUNTER ANIMATION
     ======================================== */
  const statNumbers = document.querySelectorAll('.stat-number');
  let statsAnimated = false;

  function animateStats() {
    if (statsAnimated) return;
    const hero = document.getElementById('hero');
    const rect = hero.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      statsAnimated = true;
      statNumbers.forEach(function(el) {
        const target = parseFloat(el.getAttribute('data-target'));
        const hasDecimal = el.hasAttribute('data-decimal');
        const duration = 2000;
        const start = performance.now();

        function update(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;
          if (hasDecimal) {
            el.textContent = current.toFixed(1);
          } else {
            el.textContent = Math.floor(current);
          }
          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = hasDecimal ? target.toFixed(1) : target;
          }
        }

        requestAnimationFrame(update);
      });
    }
  }

  window.addEventListener('scroll', animateStats, { passive: true });
  // Also try after a short delay in case hero is already visible
  setTimeout(animateStats, 500);

  /* ========================================
     UPI PAYMENT MODAL
     ======================================== */
  const modalOverlay = document.getElementById('upiModalOverlay');
  const modalClose = document.getElementById('upiModalClose');
  const payNowBtn = document.getElementById('payNowBtn');
  const upiIdInput = document.getElementById('upiId');
  const upiApps = document.querySelectorAll('.upi-app');

  let selectedApp = null;

  function openUPIModal(amount, plan) {
    document.getElementById('planName').textContent = plan;
    document.getElementById('orderPlan').textContent = plan;
    document.getElementById('orderAmount').textContent = '₹' + amount + '/month';
    document.getElementById('orderTotal').textContent = '₹' + amount;
    document.getElementById('payAmount').textContent = amount;

    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Focus trap: focus the close button
    modalClose.focus();
  }

  function closeUPIModal() {
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    selectedApp = null;
    upiApps.forEach(function(app) { app.classList.remove('selected'); });
    upiIdInput.value = '';
  }

  modalClose.addEventListener('click', closeUPIModal);

  // Close on overlay click
  modalOverlay.addEventListener('click', function(e) {
    if (e.target === modalOverlay) closeUPIModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
      closeUPIModal();
    }
  });

  // UPI app selection
  upiApps.forEach(function(app) {
    app.addEventListener('click', function() {
      upiApps.forEach(function(a) { a.classList.remove('selected'); });
      app.classList.add('selected');
      selectedApp = app.getAttribute('data-app');
    });
  });

  // Pay now button
  payNowBtn.addEventListener('click', function() {
    const upiId = upiIdInput.value.trim();
    if (!selectedApp && !upiId) {
      showToast('Please select a UPI app or enter your UPI ID', 'error');
      return;
    }
    if (upiId && !upiId.includes('@')) {
      showToast('Please enter a valid UPI ID (e.g., yourname@upi)', 'error');
      return;
    }
    // Simulate payment
    showToast('Processing payment...', 'info');
    setTimeout(function() {
      showToast('🎉 Payment successful! Welcome to ' + document.getElementById('orderPlan').textContent + ' plan!', 'success');
      closeUPIModal();
    }, 2000);
  });

  // Expose openUPIModal globally for pricing buttons
  window.openUPIModal = openUPIModal;

  /* ========================================
     FAQ ACCORDION
     ======================================== */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function(item) {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', function() {
      const isOpen = item.classList.contains('open');
      // Close all other items
      faqItems.forEach(function(other) {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });
      // Toggle current
      if (isOpen) {
        item.classList.remove('open');
        question.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ========================================
     TESTIMONIAL CAROUSEL
     ======================================== */
  const track = document.getElementById('testimonialTrack');
  const cards = document.querySelectorAll('.testimonial-card');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');
  const dotsContainer = document.getElementById('testimonialDots');
  let currentSlide = 0;
  const totalSlides = cards.length;

  // Create dots
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.classList.add('carousel-dot');
    dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
    if (i === 0) dot.classList.add('active');
    (function(index) {
      dot.addEventListener('click', function() { goToSlide(index); });
    })(i);
    dotsContainer.appendChild(dot);
  }

  const dots = dotsContainer.querySelectorAll('.carousel-dot');

  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentSlide = index;
    track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
    dots.forEach(function(d, i) {
      d.classList.toggle('active', i === currentSlide);
    });
  }

  prevBtn.addEventListener('click', function() { goToSlide(currentSlide - 1); });
  nextBtn.addEventListener('click', function() { goToSlide(currentSlide + 1); });

  // Auto-advance every 5 seconds
  let autoAdvance = setInterval(function() {
    goToSlide(currentSlide + 1);
  }, 5000);

  // Pause on hover
  const carousel = document.getElementById('testimonialCarousel');
  carousel.addEventListener('mouseenter', function() {
    clearInterval(autoAdvance);
  });
  carousel.addEventListener('mouseleave', function() {
    autoAdvance = setInterval(function() {
      goToSlide(currentSlide + 1);
    }, 5000);
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToSlide(currentSlide + 1);
      } else {
        goToSlide(currentSlide - 1);
      }
    }
  }, { passive: true });

  /* ========================================
     TOAST NOTIFICATIONS
     ======================================== */
  const toastContainer = document.getElementById('toastContainer');

  function showToast(message, type) {
    type = type || 'info';
    const toast = document.createElement('div');
    toast.classList.add('toast', 'toast-' + type);
    toast.textContent = message;
    toastContainer.appendChild(toast);
    // Remove after animation
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Expose globally
  window.showToast = showToast;

  /* ========================================
     CTA & LISTING BUTTONS
     ======================================== */
  const heroListBtn = document.getElementById('heroListBtn');
  const ctaListBtn = document.getElementById('ctaListBtn');
  const openPricing = document.getElementById('openPricing');
  const openPricingMobile = document.getElementById('openPricingMobile');

  function scrollToPricing() {
    document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
  }

  if (heroListBtn) heroListBtn.addEventListener('click', scrollToPricing);
  if (ctaListBtn) ctaListBtn.addEventListener('click', scrollToPricing);
  if (openPricing) openPricing.addEventListener('click', scrollToPricing);
  if (openPricingMobile) openPricingMobile.addEventListener('click', scrollToPricing);

  /* ========================================
     SMOOTH SCROLL FOR ANCHOR LINKS
     ======================================== */
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = navbar.offsetHeight;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });

  /* ========================================
     INTERSECTION OBSERVER — Fade In on Scroll
     ======================================== */
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Apply to feature cards, step cards, pricing cards
  document.querySelectorAll('.feature-card, .step-card, .pricing-card, .testimonial-card').forEach(function(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  /* ========================================
     INITIALIZATION
     ======================================== */
  initDarkMode();

  console.log('%c🏪 SarkarDukaan v1.0 — Local Business Directory', 'color: #7c3aed; font-size: 16px; font-weight: bold;');
  console.log('%cBuilt by Loop Agent | ZOO Company', 'color: #94a3b8; font-size: 12px;');

})();
