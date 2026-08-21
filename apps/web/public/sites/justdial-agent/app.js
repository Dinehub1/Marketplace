/**
 * JustDial Agent — Main JavaScript v2.0
 * Features: Dark mode, mobile menu, testimonial carousel, FAQ accordion,
 * UPI payment modal, live chat widget, scroll animations, search functionality
 */

// ===== DOM Ready =====
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initMobileMenu();
  initScrollAnimations();
  initNavbarScroll();
  initTestimonialCarousel();
  initFAQAccordion();
  initFAQSearch();
  initUPIModal();
  initChatWidget();
  initBackToTop();
  initHeroSearch();
  initSmoothScroll();
  initCounterAnimation();
});

// ===== Dark Mode Toggle =====
function initDarkMode() {
  const toggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

// ===== Mobile Menu =====
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.getElementById('nav-links');

  btn.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('active');
    btn.setAttribute('aria-expanded', isOpen);
    btn.classList.toggle('active');
  });

  // Close menu when clicking a link
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('active');
    }
  });
}

// ===== Scroll Animations (Intersection Observer) =====
function initScrollAnimations() {
  const elements = document.querySelectorAll('[data-animate]');

  if (!('IntersectionObserver' in window)) {
    // Fallback: show all elements
    elements.forEach(el => el.classList.add('animated'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.delay) || 0;
        setTimeout(() => {
          entry.target.classList.add('animated');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

// ===== Navbar Scroll Effect =====
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

// ===== Counter Animation =====
function initCounterAnimation() {
  const counters = document.querySelectorAll('[data-count]');

  if (!('IntersectionObserver' in window)) {
    counters.forEach(counter => {
      counter.textContent = counter.dataset.count;
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.count);
        animateCounter(entry.target, target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, target) {
  const duration = 2000;
  const start = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}

// ===== Testimonial Carousel =====
function initTestimonialCarousel() {
  const track = document.querySelector('.testimonials-track');
  const cards = document.querySelectorAll('.testimonial-card');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dotsContainer = document.getElementById('carousel-dots');

  if (!track || cards.length === 0) return;

  let currentIndex = 0;
  const totalSlides = cards.length;

  // Create dots
  cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = `carousel-dot ${i === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });

  function goToSlide(index) {
    if (index < 0) index = totalSlides - 1;
    if (index >= totalSlides) index = 0;
    currentIndex = index;

    // Move track
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // Update dots
    document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentIndex);
    });
  }

  prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

  // Auto-advance every 5 seconds
  let autoPlay = setInterval(() => goToSlide(currentIndex + 1), 5000);

  // Pause on hover
  const carousel = document.getElementById('testimonials-carousel');
  carousel.addEventListener('mouseenter', () => clearInterval(autoPlay));
  carousel.addEventListener('mouseleave', () => {
    autoPlay = setInterval(() => goToSlide(currentIndex + 1), 5000);
  });

  // Touch/swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
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
}

// ===== FAQ Accordion =====
function initFAQAccordion() {
  const items = document.querySelectorAll('.faq-item');

  items.forEach(item => {
    const question = item.querySelector('.faq-question');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all items
      items.forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      // Open clicked item (if it wasn't already open)
      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// ===== FAQ Search =====
function initFAQSearch() {
  const searchInput = document.getElementById('faq-search-input');
  const items = document.querySelectorAll('.faq-item');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    items.forEach(item => {
      const question = item.querySelector('.faq-question-text').textContent.toLowerCase();
      const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();

      if (question.includes(query) || answer.includes(query)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });
  });
}

// ===== UPI Payment Modal =====
function initUPIModal() {
  const overlay = document.getElementById('upi-modal-overlay');
  const closeBtn = document.getElementById('modal-close');
  const payBtn = document.getElementById('pay-now-btn');

  // Close modal
  closeBtn.addEventListener('click', closeUPIModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeUPIModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeUPIModal();
    }
  });

  // UPI app selection
  document.querySelectorAll('.upi-app').forEach(app => {
    app.addEventListener('click', () => {
      document.querySelectorAll('.upi-app').forEach(a => a.classList.remove('selected'));
      app.classList.add('selected');
    });
  });

  // Pay button
  payBtn.addEventListener('click', () => {
    const upiId = document.getElementById('upi-id').value;
    if (!upiId) {
      alert('Please enter your UPI ID');
      return;
    }
    // Simulate payment processing
    payBtn.textContent = 'Processing...';
    payBtn.disabled = true;
    setTimeout(() => {
      alert('Payment successful! 🎉 Welcome to JustDial Agent Pro.');
      closeUPIModal();
      payBtn.textContent = 'Pay Now';
      payBtn.disabled = false;
    }, 2000);
  });
}

// Global function to open UPI modal (called from pricing buttons)
window.openUPIModal = function(planName, price) {
  const overlay = document.getElementById('upi-modal-overlay');
  const planNameEl = document.getElementById('payment-plan-name');
  const planPriceEl = document.getElementById('payment-plan-price');
  const totalEl = document.getElementById('payment-total-amount');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const payBtn = document.getElementById('pay-now-btn');

  planNameEl.textContent = planName + ' Plan';
  planPriceEl.textContent = '₹' + price.toLocaleString() + '/month';
  totalEl.textContent = '₹' + price.toLocaleString();
  modalSubtitle.textContent = 'Upgrade to ' + planName + ' Plan';
  payBtn.textContent = 'Pay ₹' + price.toLocaleString() + ' Now';

  overlay.classList.add('active');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

function closeUPIModal() {
  const overlay = document.getElementById('upi-modal-overlay');
  overlay.classList.remove('active');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// ===== Live Chat Widget =====
function initChatWidget() {
  const toggle = document.getElementById('chat-toggle');
  const chatBox = document.getElementById('chat-box');
  const closeBtn = document.getElementById('chat-close');
  const sendBtn = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');

  toggle.addEventListener('click', () => {
    chatBox.classList.toggle('active');
    if (chatBox.classList.contains('active')) {
      input.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    chatBox.classList.remove('active');
  });

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    addMessage(text, 'user');
    input.value = '';

    // Simulate bot response
    setTimeout(() => {
      const responses = [
        "Thanks for your message! Our team will get back to you shortly. 😊",
        "Great question! Let me connect you with a specialist who can help.",
        "I understand. Let me look into that for you right away.",
        "Thanks for reaching out! You can also check our FAQ section for quick answers.",
        "I'd be happy to help! Could you provide a bit more detail?"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      addMessage(randomResponse, 'bot');
    }, 1000 + Math.random() * 1000);
  }

  function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-${type}`;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
      <p>${escapeHtml(text)}</p>
      <span class="chat-time">${time}</span>
    `;

    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ===== Back to Top Button =====
function initBackToTop() {
  const btn = document.getElementById('back-to-top');

  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===== Hero Search =====
function initHeroSearch() {
  const searchBtn = document.getElementById('hero-search-btn');
  const searchInput = document.getElementById('hero-search-input');

  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });

  function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
      // Simulate search - in production this would make an API call
      alert(`Searching for "${query}"...\n\nIn production, this would show search results from the JustDial Agent database.`);
    }
  }
}

// ===== Smooth Scroll for Anchor Links =====
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = document.getElementById('navbar').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ===== Performance: Lazy load images when they exist =====
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imageObserver.unobserve(img);
      }
    });
  });

  document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

// ===== Service Worker Registration (PWA Support) =====
if ('serviceWorker' in navigator) {
  // Service worker can be added later for offline support
  // navigator.serviceWorker.register('/sw.js');
}
