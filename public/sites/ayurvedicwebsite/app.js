/* ============================================================
   Mera Ayurvedic — Main JavaScript
   Features: Dark mode, UPI modal, FAQ accordion, Forms,
               Mobile menu, Toast notifications
   ============================================================ */

// ============================================================
// DARK MODE TOGGLE
// ============================================================
(function initDarkMode() {
  const toggle = document.getElementById('darkToggle');
  const body = document.body;

  // Check for saved preference or system preference
  const savedTheme = localStorage.getItem('meraAyurvedicTheme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    body.classList.add('dark');
    updateDarkToggleIcon(true);
  }

  toggle.addEventListener('click', function () {
    body.classList.toggle('dark');
    const isDark = body.classList.contains('dark');
    localStorage.setItem('meraAyurvedicTheme', isDark ? 'dark' : 'light');
    updateDarkToggleIcon(isDark);
  });

  function updateDarkToggleIcon(isDark) {
    const icon = toggle.querySelector('i');
    if (icon) {
      icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
  }
})();

// ============================================================
// MOBILE MENU
// ============================================================
(function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileMenuOverlay');
  const closeBtn = document.getElementById('mobileMenuClose');

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      mobileMenu.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeMobileMenu);
  }

  if (overlay) {
    overlay.addEventListener('click', closeMobileMenu);
  }

  // Close menu on Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileMenu();
  });
})();

function closeMobileMenu() {
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileMenuOverlay');
  if (mobileMenu) mobileMenu.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
// UPI PAYMENT MODAL
// ============================================================
function openUpiModal() {
  const modal = document.getElementById('upiModal');
  const overlay = document.getElementById('upiModalOverlay');
  if (modal) modal.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeUpiModal() {
  const modal = document.getElementById('upiModal');
  const overlay = document.getElementById('upiModalOverlay');
  if (modal) modal.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') closeUpiModal();
});

// Payment Tab Switching
function switchPaymentTab(tabName) {
  // Remove active class from all tabs and contents
  document.querySelectorAll('.payment-tab').forEach(function (tab) {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.payment-content').forEach(function (content) {
    content.classList.remove('active');
  });

  // Activate selected tab
  document.querySelectorAll('.payment-tab').forEach(function (tab) {
    if (tab.getAttribute('onclick').includes(tabName)) {
      tab.classList.add('active');
    }
  });
  var tabContent = document.getElementById('tab-' + tabName);
  if (tabContent) tabContent.classList.add('active');
}

// UPI Payment Processing
function payWithUpi(app) {
  showToast('Opening ' + app + '... Please complete payment in the app.');
  // In production, this would trigger the UPI deep link
}

function processUpiPayment() {
  var upiId = document.getElementById('upiId').value.trim();
  if (!upiId) {
    showToast('Please enter a valid UPI ID');
    return;
  }
  showToast('Processing UPI payment to ' + upiId + '...');
  // Simulate payment processing
  setTimeout(function () {
    showToast('Payment successful! Order confirmed.');
    closeUpiModal();
  }, 2000);
}

// Card Payment Processing
function processCardPayment() {
  var cardNum = document.getElementById('cardNumber').value.trim();
  var expiry = document.getElementById('cardExpiry').value.trim();
  var cvv = document.getElementById('cardCvv').value.trim();
  var name = document.getElementById('cardName').value.trim();

  if (!cardNum || !expiry || !cvv || !name) {
    showToast('Please fill all card details');
    return;
  }
  showToast('Processing card payment...');
  setTimeout(function () {
    showToast('Payment successful! Order confirmed.');
    closeUpiModal();
  }, 2000);
}

// Net Banking Payment
function payWithBank(bank) {
  showToast('Redirecting to ' + bank + ' net banking...');
  setTimeout(function () {
    showToast('Payment initiated. Complete on bank page.');
    closeUpiModal();
  }, 1500);
}

// ============================================================
// FAQ ACCORDION
// ============================================================
function toggleFaq(button) {
  var faqItem = button.parentElement;
  var isActive = faqItem.classList.contains('active');

  // Close all FAQ items
  document.querySelectorAll('.faq-item').forEach(function (item) {
    item.classList.remove('active');
  });

  // Toggle clicked item (open if it was closed)
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// ============================================================
// ORDER NOW — Scroll to contact with product pre-filled
// ============================================================
function orderNow(product) {
  var productInput = document.getElementById('cProduct');
  if (productInput) {
    productInput.value = product;
  }
  var contactSection = document.getElementById('contact');
  if (contactSection) {
    contactSection.scrollIntoView({ behavior: 'smooth' });
  }
  showToast('Please fill your details to order ' + product);
}

// ============================================================
// CONTACT FORM SUBMISSION
// ============================================================
function submitContact(event) {
  if (event) event.preventDefault();

  var name = document.getElementById('cName').value.trim();
  var phone = document.getElementById('cPhone').value.trim();
  var product = document.getElementById('cProduct').value.trim();
  var msg = document.getElementById('cMsg').value.trim();

  if (!name || !phone) {
    showToast('Please fill name and phone number');
    return;
  }

  // Build WhatsApp message
  var message = 'Name: ' + name + '\nPhone: ' + phone;
  if (product) message += '\nProduct: ' + product;
  if (msg) message += '\nMessage: ' + msg;

  var whatsapp = 'https://wa.me/919876543210?text=' + encodeURIComponent(message);
  window.open(whatsapp, '_blank');
  showToast('Opening WhatsApp...');
}

// ============================================================
// CONSULTATION FORM SUBMISSION
// ============================================================
function submitConsultation(event) {
  if (event) event.preventDefault();

  var name = document.getElementById('consName').value.trim();
  var phone = document.getElementById('consPhone').value.trim();
  var issue = document.getElementById('consIssue').value;

  if (!name || !phone || !issue) {
    showToast('Please fill all required fields');
    return;
  }

  showToast('Consultation booked! We will call you shortly.');
  document.getElementById('consultationForm').reset();
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg) {
  // Remove existing toast if any
  var existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--primary-dark);color:#fff;padding:12px 24px;border-radius:8px;font-size:0.9rem;z-index:2000;box-shadow:var(--shadow-lg);white-space:nowrap;max-width:90vw;text-align:center;animation:toastSlideUp 0.3s ease;';
  toast.textContent = msg;
  document.body.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(function () {
      toast.remove();
    }, 300);
  }, 3000);
}

// Add toast animation keyframes
var style = document.createElement('style');
style.textContent = '@keyframes toastSlideUp{from{opacity:0;transform:translateX(-50%) translateY(20px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}';
document.head.appendChild(style);

// ============================================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    var targetId = this.getAttribute('href');
    if (targetId === '#') return;
    var target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ============================================================
// HEADER SCROLL EFFECT
// ============================================================
(function initHeaderScroll() {
  var header = document.getElementById('header');
  var lastScroll = 0;

  window.addEventListener('scroll', function () {
    var currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    } else {
      header.style.boxShadow = '';
    }

    lastScroll = currentScroll;
  });
})();

// ============================================================
// CARD NUMBER FORMATTING (for payment modal)
// ============================================================
(function initCardFormatting() {
  var cardInput = document.getElementById('cardNumber');
  if (cardInput) {
    cardInput.addEventListener('input', function (e) {
      var value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
      var formatted = value.match(/.{1,4}/g)?.join(' ') || value;
      e.target.value = formatted;
    });
  }

  var expiryInput = document.getElementById('cardExpiry');
  if (expiryInput) {
    expiryInput.addEventListener('input', function (e) {
      var value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      }
      e.target.value = value;
    });
  }
})();
