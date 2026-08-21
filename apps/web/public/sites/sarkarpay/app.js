/**
 * SarkarPay — Main JavaScript
 * Mobile menu, dark mode, payment modal, FAQ, animations
 */

// ============================================
// DOM ELEMENTS
// ============================================
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const themeToggle = document.getElementById('themeToggle');
const paymentModal = document.getElementById('paymentModal');
const modalClose = document.getElementById('modalClose');
const toast = document.getElementById('toast');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const faqItems = document.querySelectorAll('.faq-item');
const toggleBtns = document.querySelectorAll('.toggle-btn');
const priceElements = document.querySelectorAll('.price');
const statNumbers = document.querySelectorAll('.stat-number');
const mobileLinks = document.querySelectorAll('.mobile-link');

// ============================================
// NAVBAR — Scroll Effect
// ============================================
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 50) {
    navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
  } else {
    navbar.style.boxShadow = 'none';
  }

  lastScroll = currentScroll;
});

// ============================================
// MOBILE MENU
// ============================================
function toggleMobileMenu() {
  const isOpen = mobileMenu.classList.contains('active');
  mobileMenu.classList.toggle('active');
  hamburger.classList.toggle('active');
  hamburger.setAttribute('aria-expanded', !isOpen);

  // Animate hamburger bars
  const bars = hamburger.querySelectorAll('.bar');
  if (!isOpen) {
    bars[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    bars[1].style.opacity = '0';
    bars[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    bars[0].style.transform = 'none';
    bars[1].style.opacity = '1';
    bars[2].style.transform = 'none';
  }
}

hamburger.addEventListener('click', toggleMobileMenu);

// Close mobile menu when a link is clicked
mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    const bars = hamburger.querySelectorAll('.bar');
    bars[0].style.transform = 'none';
    bars[1].style.opacity = '1';
    bars[2].style.transform = 'none';
  });
});

// Close mobile menu on outside click
document.addEventListener('click', (e) => {
  if (!navbar.contains(e.target) && mobileMenu.classList.contains('active')) {
    toggleMobileMenu();
  }
});

// ============================================
// DARK MODE TOGGLE
// ============================================
function initTheme() {
  const savedTheme = localStorage.getItem('sarkarpay-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
  }
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
    localStorage.setItem('sarkarpay-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = '☀️';
    localStorage.setItem('sarkarpay-theme', 'dark');
  }
}

themeToggle.addEventListener('click', toggleTheme);
initTheme();

// ============================================
// PAYMENT MODAL
// ============================================
function openPaymentModal(plan) {
  paymentModal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Focus trap: focus the close button
  modalClose.focus();

  // Update modal title based on plan
  const modalTitle = document.getElementById('modalTitle');
  if (plan === 'starter') {
    modalTitle.textContent = 'Get Started with Starter — Free';
  } else if (plan === 'growth') {
    modalTitle.textContent = 'Start Growth Plan — ₹499/month';
  } else if (plan === 'enterprise') {
    modalTitle.textContent = 'Contact Sales — Enterprise Plan';
  }
}

function closePaymentModal() {
  paymentModal.classList.remove('active');
  document.body.style.overflow = '';
}

// Open modal from hero CTA
document.getElementById('heroCtaBtn')?.addEventListener('click', () => openPaymentModal('growth'));
document.getElementById('ctaSignupBtn')?.addEventListener('click', () => openPaymentModal('growth'));

// Close modal
modalClose.addEventListener('click', closePaymentModal);

// Close on overlay click
paymentModal.addEventListener('click', (e) => {
  if (e.target === paymentModal) {
    closePaymentModal();
  }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && paymentModal.classList.contains('active')) {
    closePaymentModal();
  }
});

// ============================================
// PAYMENT TABS
// ============================================
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetTab = btn.dataset.tab;

    // Update tab buttons
    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    // Update tab content
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    const targetContent = document.getElementById(`content${targetTab.charAt(0).toUpperCase() + targetTab.slice(1)}`);
    if (targetContent) {
      targetContent.classList.add('active');
    }
  });
});

// ============================================
// PAYMENT FORM HANDLING
// ============================================
// UPI Pay Button
document.getElementById('upiPayBtn')?.addEventListener('click', () => {
  const upiId = document.getElementById('upiId').value.trim();
  if (!upiId || !upiId.includes('@')) {
    alert('Please enter a valid UPI ID (e.g., yourname@upi)');
    return;
  }
  closePaymentModal();
  showToast('Payment request sent to ' + upiId);
});

// Card Pay Button
document.getElementById('cardPayBtn')?.addEventListener('click', () => {
  const cardNumber = document.getElementById('cardNumber').value.trim();
  const cardExpiry = document.getElementById('cardExpiry').value.trim();
  const cardCvv = document.getElementById('cardCvv').value.trim();
  const cardName = document.getElementById('cardName').value.trim();

  if (!cardNumber || !cardExpiry || !cardCvv || !cardName) {
    alert('Please fill in all card details.');
    return;
  }
  closePaymentModal();
  showToast('Card payment processed successfully!');
});

// Card number formatting (add spaces every 4 digits)
document.getElementById('cardNumber')?.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
  let formatted = '';
  for (let i = 0; i < value.length && i < 16; i++) {
    if (i > 0 && i % 4 === 0) formatted += ' ';
    formatted += value[i];
  }
  e.target.value = formatted;
});

// Expiry date formatting (MM/YY)
document.getElementById('cardExpiry')?.addEventListener('input', (e) => {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  e.target.value = value;
});

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message) {
  const toastMessage = toast.querySelector('.toast-message');
  toastMessage.textContent = message;
  toast.classList.add('active');

  setTimeout(() => {
    toast.classList.remove('active');
  }, 4000);
}

// ============================================
// FAQ ACCORDION
// ============================================
faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');

  question.addEventListener('click', () => {
    const isActive = item.classList.contains('active');

    // Close all other items
    faqItems.forEach(otherItem => {
      otherItem.classList.remove('active');
      otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
    });

    // Toggle current item
    if (!isActive) {
      item.classList.add('active');
      question.setAttribute('aria-expanded', 'true');
    }
  });
});

// ============================================
// PRICING TOGGLE (Monthly / Yearly)
// ============================================
toggleBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const period = btn.dataset.period;

    // Update toggle buttons
    toggleBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update prices
    priceElements.forEach(priceEl => {
      const newPrice = period === 'yearly'
        ? priceEl.dataset.yearly
        : priceEl.dataset.monthly;

      // Animate price change
      priceEl.style.opacity = '0';
      priceEl.style.transform = 'translateY(-10px)';
      priceEl.style.transition = 'all 0.3s ease';

      setTimeout(() => {
        priceEl.textContent = newPrice;
        priceEl.style.opacity = '1';
        priceEl.style.transform = 'translateY(0)';
      }, 150);
    });
  });
});

// ============================================
// ANIMATED COUNTERS (Hero Stats)
// ============================================
function animateCounters() {
  statNumbers.forEach(stat => {
    const target = parseInt(stat.dataset.target, 10);
    const suffix = stat.nextElementSibling?.textContent || '';
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);

      stat.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  });
}

// Trigger counter animation when hero stats are in view
const heroStats = document.querySelector('.hero-stats');
if (heroStats && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  observer.observe(heroStats);
} else {
  // Fallback: animate after a short delay
  setTimeout(animateCounters, 500);
}

// ============================================
// SMOOTH SCROLL for anchor links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const offsetTop = target.offsetTop - 80; // Account for navbar
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// ============================================
// PARTICLE BACKGROUND (Hero)
// ============================================
function createParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;

  const particleCount = 20;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: absolute;
      width: ${Math.random() * 6 + 2}px;
      height: ${Math.random() * 6 + 2}px;
      background: rgba(108, 58, 237, ${Math.random() * 0.3 + 0.1});
      border-radius: 50%;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation: particle-float ${Math.random() * 10 + 10}s linear infinite;
      animation-delay: ${Math.random() * 5}s;
    `;
    container.appendChild(particle);
  }
}

// Add particle float animation
const particleStyle = document.createElement('style');
particleStyle.textContent = `
  @keyframes particle-float {
    0% { transform: translateY(0) translateX(0); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
  }
`;
document.head.appendChild(particleStyle);

createParticles();

// ============================================
// INTERSECTION OBSERVER — Scroll Animations
// ============================================
const animateOnScroll = document.querySelectorAll('.feature-card, .step-card, .pricing-card, .testimonial-card');

if ('IntersectionObserver' in window) {
  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger animation
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  animateOnScroll.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    scrollObserver.observe(el);
  });
}

// ============================================
// KEYBOARD NAVIGATION — Modal focus trap
// ============================================
paymentModal.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;

  const focusableElements = paymentModal.querySelectorAll(
    'button, input, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstFocusable) {
      lastFocusable.focus();
      e.preventDefault();
    }
  } else {
    if (document.activeElement === lastFocusable) {
      firstFocusable.focus();
      e.preventDefault();
    }
  }
});

// ============================================
// CONSOLE WELCOME MESSAGE
// ============================================
console.log('%c💳 SarkarPay — Payment Gateway', 'font-size: 20px; font-weight: bold; color: #6C3AED;');
console.log('%cBuilt with ❤️ by ZOO Company', 'font-size: 12px; color: #94A3B8;');
