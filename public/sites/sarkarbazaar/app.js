/* ============================================
   SarkarBazaar — app.js
   Interactivity: dark mode, mobile menu, FAQ,
   payment modal, animated counters, cart
   ============================================ */

(function () {
  'use strict';

  /* ----------------------------------------
     1. DARK MODE TOGGLE
     ---------------------------------------- */
  const darkToggle = document.getElementById('darkToggle');
  const html = document.documentElement;

  // Check for saved preference or system preference
  function initDarkMode() {
    const saved = localStorage.getItem('sarkarbazaar-theme');
    if (saved === 'dark') {
      html.setAttribute('data-theme', 'dark');
      updateDarkIcon(true);
    } else if (saved === 'light') {
      html.removeAttribute('data-theme');
      updateDarkIcon(false);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      html.setAttribute('data-theme', 'dark');
      updateDarkIcon(true);
    }
  }

  function updateDarkIcon(isDark) {
    if (darkToggle) {
      darkToggle.querySelector('.dark-toggle-icon').textContent = isDark ? '☀️' : '🌙';
    }
  }

  if (darkToggle) {
    darkToggle.addEventListener('click', function () {
      const isDark = html.getAttribute('data-theme') === 'dark';
      if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('sarkarbazaar-theme', 'light');
        updateDarkIcon(false);
      } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('sarkarbazaar-theme', 'dark');
        updateDarkIcon(true);
      }
    });
  }

  /* ----------------------------------------
     2. MOBILE MENU TOGGLE
     ---------------------------------------- */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', function () {
      const isOpen = mobileNav.classList.contains('active');
      if (isOpen) {
        mobileNav.classList.remove('active');
        mobileNav.setAttribute('aria-hidden', 'true');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Open menu');
      } else {
        mobileNav.classList.add('active');
        mobileNav.setAttribute('aria-hidden', 'false');
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileMenuBtn.setAttribute('aria-label', 'Close menu');
      }
    });

    // Close mobile menu when a link is clicked
    mobileNav.querySelectorAll('.mobile-nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('active');
        mobileNav.setAttribute('aria-hidden', 'true');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.setAttribute('aria-label', 'Open menu');
      });
    });
  }

  /* ----------------------------------------
     3. FAQ ACCORDION
     ---------------------------------------- */
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

  /* ----------------------------------------
     4. PAYMENT MODAL
     ---------------------------------------- */
  const paymentModal = document.getElementById('paymentModal');
  const modalClose = document.getElementById('modalClose');
  const payButton = document.getElementById('payButton');
  const summaryPlan = document.getElementById('summaryPlan');
  const summaryAmount = document.getElementById('summaryAmount');
  const payAmount = document.getElementById('payAmount');

  // Open modal from pricing buttons
  document.querySelectorAll('.plan-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const plan = this.getAttribute('data-plan') || 'Professional';
      const price = this.getAttribute('data-price') || '499';

      if (summaryPlan) summaryPlan.textContent = plan;
      if (summaryAmount) summaryAmount.textContent = '₹' + price + '/month';
      if (payAmount) payAmount.textContent = '₹' + price;

      openModal();
    });
  });

  // Open modal from "Add to Cart" buttons
  document.querySelectorAll('.btn-add-cart').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const productName = this.getAttribute('aria-label') || 'Item';
      if (summaryPlan) summaryPlan.textContent = productName;
      if (summaryAmount) summaryAmount.textContent = 'Added to cart';
      if (payAmount) payAmount.textContent = 'Proceed';

      // Visual feedback
      this.textContent = '✓ Added!';
      this.style.background = '#10B981';
      var self = this;
      setTimeout(function () {
        self.textContent = 'Add to Cart';
        self.style.background = '';
      }, 1500);
    });
  });

  function openModal() {
    if (paymentModal) {
      paymentModal.classList.add('active');
      paymentModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // Focus trap: focus the close button
      if (modalClose) modalClose.focus();
    }
  }

  function closeModal() {
    if (paymentModal) {
      paymentModal.classList.remove('active');
      paymentModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  // Close on overlay click
  if (paymentModal) {
    paymentModal.addEventListener('click', function (e) {
      if (e.target === paymentModal) {
        closeModal();
      }
    });
  }

  // Close on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && paymentModal && paymentModal.classList.contains('active')) {
      closeModal();
    }
  });

  /* ----------------------------------------
     5. PAYMENT METHOD TABS
     ---------------------------------------- */
  const paymentTabs = document.querySelectorAll('.payment-tab');
  const paymentContents = document.querySelectorAll('.payment-content');

  paymentTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var targetTab = this.getAttribute('data-tab');

      // Update tab states
      paymentTabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      // Update content visibility
      paymentContents.forEach(function (content) {
        content.classList.remove('active');
      });
      var targetContent = document.getElementById(targetTab + 'Content');
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });

  /* ----------------------------------------
     6. PAY BUTTON (simulated)
     ---------------------------------------- */
  if (payButton) {
    payButton.addEventListener('click', function () {
      var originalText = this.innerHTML;
      this.innerHTML = '⏳ Processing...';
      this.disabled = true;

      var self = this;
      setTimeout(function () {
        self.innerHTML = '✅ Payment Successful!';
        self.style.background = '#10B981';

        setTimeout(function () {
          closeModal();
          // Reset button after modal closes
          setTimeout(function () {
            self.innerHTML = originalText;
            self.style.background = '';
            self.disabled = false;
          }, 300);
        }, 1200);
      }, 1500);
    });
  }

  /* ----------------------------------------
     7. ANIMATED COUNTERS (Hero Stats)
     ---------------------------------------- */
  function animateCounters() {
    var counters = document.querySelectorAll('.stat-number[data-count]');

    counters.forEach(function (counter) {
      var target = parseInt(counter.getAttribute('data-count'), 10);
      var duration = 2000; // 2 seconds
      var start = 0;
      var startTime = null;

      function easeOutQuad(t) {
        return t * (2 - t);
      }

      function update(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var eased = easeOutQuad(progress);
        counter.textContent = Math.round(eased * target);
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          counter.textContent = target;
        }
      }

      requestAnimationFrame(update);
    });
  }

  // Trigger counter animation when hero is in view
  var heroSection = document.getElementById('hero');
  if (heroSection && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounters();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(heroSection);
  } else {
    // Fallback: animate on load
    window.addEventListener('load', animateCounters);
  }

  /* ----------------------------------------
     8. SMOOTH SCROLL FOR ANCHOR LINKS
     ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var offset = 80; // Account for sticky nav
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  /* ----------------------------------------
     9. NAVBAR SCROLL EFFECT
     ---------------------------------------- */
  var navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
      } else {
        navbar.style.boxShadow = 'none';
      }
    });
  }

  /* ----------------------------------------
     10. UPI APP BUTTON FEEDBACK
     ---------------------------------------- */
  document.querySelectorAll('.upi-app').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var original = this.innerHTML;
      this.style.borderColor = '#10B981';
      this.style.background = '#D1FAE5';
      var self = this;
      setTimeout(function () {
        self.style.borderColor = '';
        self.style.background = '';
      }, 500);
    });
  });

  /* ----------------------------------------
     11. BANK OPTION FEEDBACK
     ---------------------------------------- */
  document.querySelectorAll('.bank-option').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.bank-option').forEach(function (b) {
        b.style.borderColor = '';
        b.style.background = '';
      });
      this.style.borderColor = '#6C3CE1';
      this.style.background = '#EDE9FE';
    });
  });

  /* ----------------------------------------
     12. CARD NUMBER FORMATTING
     ---------------------------------------- */
  var cardNumber = document.getElementById('cardNumber');
  if (cardNumber) {
    cardNumber.addEventListener('input', function () {
      var value = this.value.replace(/\D/g, '').substring(0, 16);
      var formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
      this.value = formatted;
    });
  }

  /* ----------------------------------------
     13. CARD EXPIRY FORMATTING
     ---------------------------------------- */
  var cardExpiry = document.getElementById('cardExpiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', function () {
      var value = this.value.replace(/\D/g, '').substring(0, 4);
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      }
      this.value = value;
    });
  }

  /* ----------------------------------------
     INITIALIZE
     ---------------------------------------- */
  initDarkMode();

})();
