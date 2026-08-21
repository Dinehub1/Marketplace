/**
 * Indore Real Estate — Main JavaScript
 * Handles: mobile nav, dark mode, FAQ accordion, UPI payment modal
 */

// ========== MOBILE NAVIGATION ==========
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Toggle hamburger icon between ☰ and ✕
    hamburger.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
  });
}

// Close mobile nav when a link is clicked
if (navLinks) {
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      if (hamburger) hamburger.textContent = '☰';
    });
  });
}

// ========== NAVBAR SCROLL EFFECT ==========
const navbar = document.getElementById('navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 80) {
    navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
  } else {
    navbar.style.boxShadow = 'none';
  }

  lastScroll = currentScroll;
});

// ========== DARK MODE TOGGLE ==========
const themeToggle = document.getElementById('themeToggle');

// Check for saved preference or system preference
if (themeToggle) {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  }

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
      themeToggle.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    } else {
      themeToggle.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    }
  });
}

// ========== FAQ ACCORDION ==========
function toggleFaq(button) {
  const faqItem = button.parentElement;
  const isActive = faqItem.classList.contains('active');

  // Close all FAQ items
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });

  // Open clicked one if it wasn't already active
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// ========== UPI PAYMENT MODAL ==========
const paymentModal = document.getElementById('paymentModal');

function openPaymentModal() {
  if (paymentModal) {
    paymentModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  }
}

function closePaymentModal() {
  if (paymentModal) {
    paymentModal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close modal when clicking outside
if (paymentModal) {
  paymentModal.addEventListener('click', (e) => {
    if (e.target === paymentModal) {
      closePaymentModal();
    }
  });
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closePaymentModal();
  }
});

// ========== UPI APP SELECTION ==========
function selectUpiApp(button) {
  // Remove selected from all
  document.querySelectorAll('.upi-app').forEach(app => {
    app.classList.remove('selected');
  });
  // Add to clicked
  button.classList.add('selected');
}

// ========== PLAN SELECTION ==========
function selectPlan(button) {
  // Remove active from all
  document.querySelectorAll('.plan-option').forEach(opt => {
    opt.classList.remove('active');
  });
  // Add to clicked
  button.classList.add('active');

  // Update payment amount display
  const amount = parseInt(button.dataset.amount, 10);
  const amountEl = document.getElementById('paymentAmount');
  const payBtn = document.getElementById('payButton');

  if (amountEl) {
    amountEl.textContent = amount === 0 ? 'Free' : '₹' + amount.toLocaleString('en-IN');
  }
  if (payBtn) {
    payBtn.textContent = amount === 0 ? 'Get Started — Free' : 'Pay Now — ₹' + amount.toLocaleString('en-IN');
  }
}

// ========== PAYMENT BUTTON HANDLER ==========
const payButton = document.getElementById('payButton');
if (payButton) {
  payButton.addEventListener('click', () => {
    const upiId = document.getElementById('upiId').value;
    const activePlan = document.querySelector('.plan-option.active');
    const amount = activePlan ? parseInt(activePlan.dataset.amount, 10) : 5000;

    if (amount === 0) {
      alert('🎉 You\'re all set! Our team will contact you shortly to arrange your free site visit.');
      closePaymentModal();
      return;
    }

    if (!upiId || !upiId.includes('@')) {
      alert('⚠️ Please enter a valid UPI ID (e.g., yourname@upi)');
      return;
    }

    // Simulate payment processing
    payButton.textContent = 'Processing...';
    payButton.disabled = true;

    setTimeout(() => {
      alert('✅ Payment request sent to ' + upiId + '!\n\nPlease approve the UPI request in your app. Our team will contact you within 24 hours.');
      payButton.textContent = 'Pay Now — ₹' + amount.toLocaleString('en-IN');
      payButton.disabled = false;
      closePaymentModal();
    }, 2000);
  });
}

// ========== SMOOTH SCROLL FOR ANCHOR LINKS ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const navHeight = navbar ? navbar.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// ========== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS ==========
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Apply scroll animation to cards
document.querySelectorAll('.feature-card, .step-card, .pricing-card, .testimonial-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(card);
});
