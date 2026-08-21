/**
 * SarkarSarkar — Government Services Portal v3.0
 * Ultra-Enhanced JavaScript | Mobile-First Interactivity
 * New in v3: Notification system, Chat widget with bot responses,
 * Document upload wizard with drag-and-drop, Service comparison,
 * Toast notifications, Accessibility panel, Application wizard navigation,
 * Dashboard chart interactions, PWA service worker registration
 */

(function() {
  'use strict';

  // ===== DOM READY =====
  document.addEventListener('DOMContentLoaded', function() {
    initNavbar();
    initDarkMode();
    initLanguageToggle();
    initMobileMenu();
    initAnimatedCounters();
    initFAQ();
    initFAQSearch();
    initUPIModal();
    initBackToTop();
    initTestimonials();
    initEligibilityChecker();
    initSmoothScroll();
    // v3 new features
    initNotifications();
    initChatWidget();
    initDocumentUpload();
    initServiceComparison();
    initAccessibilityPanel();
    initApplicationWizard();
    initDashboardChart();
    initToastSystem();
    registerServiceWorker();
  });

  // ===== NAVBAR SCROLL EFFECT =====
  function initNavbar() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // ===== DARK MODE TOGGLE =====
  function initDarkMode() {
    var toggle = document.getElementById('darkToggle');
    var icon = toggle ? toggle.querySelector('.dark-icon') : null;

    var savedTheme = localStorage.getItem('sarkarsarkar-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      if (icon) icon.textContent = '\u2600\uFE0F';
    }

    toggle.addEventListener('click', function() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';

      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        icon.textContent = '\uD83C\uDF19';
        localStorage.setItem('sarkarsarkar-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        icon.textContent = '\u2600\uFE0F';
        localStorage.setItem('sarkarsarkar-theme', 'dark');
      }
    });
  }

  // ===== LANGUAGE TOGGLE (Hindi/English) with full i18n =====
  var I18N = {
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.services': 'Services',
      'nav.eligibility': 'Eligibility',
      'nav.track': 'Track Application',
      'nav.dashboard': 'Dashboard',
      'nav.login': 'Login / Register',
      // Hero
      'hero.badge': 'Trusted by 10 Million+ Citizens',
      'hero.title': 'All Government Services,',
      'hero.titleHighlight': 'One Portal',
      'hero.subtitle': 'Apply for Aadhaar, PAN, passports, track applications, check eligibility, and pay fees — all from one secure platform. Available in 15+ Indian languages.',
      'hero.cta': 'Get Started Free',
      'hero.ctaSecondary': 'Explore Services',
      // Stats
      'stat.services': 'Services',
      'stat.users': 'Users',
      'stat.applications': 'Applications',
      'stat.rating': 'Rating',
      // Features
      'features.title': 'Why Choose SarkarSarkar?',
      'features.subtitle': 'We make government services accessible, fast, and transparent.',
      // How it works
      'how.title': 'How It Works',
      'how.subtitle': 'Get your work done in 4 simple steps.',
      'how.step1': 'Select Service',
      'how.step1desc': 'Choose from 500+ government services',
      'how.step2': 'Fill & Upload',
      'how.step2desc': 'Complete the form and upload documents',
      'how.step3': 'Pay Securely',
      'how.step3desc': 'Pay fees via UPI, card, or net banking',
      'how.step4': 'Track & Receive',
      'how.step4desc': 'Track status and receive your document',
      // Pricing
      'pricing.title': 'Transparent Pricing',
      'pricing.subtitle': 'No hidden charges. Pay only government fees.',
      'pricing.free': 'Free',
      'pricing.select': 'Select Plan',
      'pricing.popular': 'Most Popular',
      // FAQ
      'faq.title': 'Frequently Asked Questions',
      'faq.subtitle': 'Find answers to common questions about our services.',
      'faq.search': 'Search questions...',
      // Footer
      'footer.tagline': 'Making government services accessible to every citizen.',
      'footer.services': 'Services',
      'footer.company': 'Company',
      'footer.support': 'Support',
      'footer.legal': 'Legal',
      'footer.rights': 'All rights reserved.',
      // Chat
      'chat.title': 'SarkarSarkar Assistant',
      'chat.subtitle': 'Ask me anything about government services',
      'chat.placeholder': 'Type your message...',
      'chat.welcome': 'Hello! 👋 I\'m your SarkarSarkar assistant. How can I help you today?',
      // Eligibility
      'eligibility.title': 'Check Your Eligibility',
      'eligibility.select': 'Select a service',
      'eligibility.age': 'Enter your age',
      'eligibility.check': 'Check Eligibility',
      'eligibility.resultEligible': '✅ Eligible!',
      'eligibility.resultNotEligible': '❌ Not Eligible',
      // Tracker
      'tracker.title': 'Track Your Application',
      'tracker.placeholder': 'Enter Application ID (e.g., ABC123456)',
      'tracker.mobile': 'Registered Mobile Number',
      'tracker.trackBtn': 'Track Status',
      'tracker.errorId': '⚠️ Please enter a valid Application ID.',
      'tracker.errorMobile': '⚠️ Please enter a valid 10-digit mobile number.',
      // Notifications
      'notif.title': 'Notifications',
      'notif.markRead': 'Mark all read',
      // Accessibility
      'a11y.title': 'Accessibility',
      'a11y.fontSize': 'Font Size',
      'a11y.contrast': 'High Contrast',
      'a11y.reset': 'Reset All',
      // Common
      'loading': 'Loading...',
      'error.generic': 'Something went wrong. Please try again.',
      'error.network': 'Network error. Please check your connection.',
      'error.offline': 'You are offline. Some features may be limited.'
    },
    hi: {
      // Navigation
      'nav.home': 'होम',
      'nav.services': 'सेवाएं',
      'nav.eligibility': 'पात्रता',
      'nav.track': 'आवेदन ट्रैक करें',
      'nav.dashboard': 'डैशबोर्ड',
      'nav.login': 'लॉगिन / रजिस्टर',
      // Hero
      'hero.badge': '10 मिलियन+ नागरिकों द्वारा विश्वसनीय',
      'hero.title': 'सभी सरकारी सेवाएं,',
      'hero.titleHighlight': 'एक पोर्टल',
      'hero.subtitle': 'आधार, पैन, पासपोर्ट के लिए आवेदन करें, आवेदनों को ट्रैक करें, पात्रता जांचें और शुल्क का भुगतान करें — सब एक सुरक्षित प्लेटफॉर्म पर। 15+ भारतीय भाषाओं में उपलब्ध।',
      'hero.cta': 'मुफ्त शुरू करें',
      'hero.ctaSecondary': 'सेवाएं देखें',
      // Stats
      'stat.services': 'सेवाएं',
      'stat.users': 'उपयोगकर्ता',
      'stat.applications': 'आवेदन',
      'stat.rating': 'रेटिंग',
      // Features
      'features.title': 'SarkarSarkar क्यों चुनें?',
      'features.subtitle': 'हम सरकारी सेवाओं को सुलभ, तेज और पारदर्शी बनाते हैं।',
      // How it works
      'how.title': 'यैसे काम करता है',
      'how.subtitle': '4 सरल चरणों में अपना काम पूरा करें।',
      'how.step1': 'सेवा चुनें',
      'how.step1desc': '500+ सरकारी सेवाओं में से चुनें',
      'how.step2': 'भरें और अपलोड करें',
      'how.step2desc': 'फॉर्म भरें और दस्तावेज़ अपलोड करें',
      'how.step3': 'सुरक्षित भुगतान',
      'how.step3desc': 'UPI, कार्ड या नेट बैंकिंग से शुल्क का भुगतान करें',
      'how.step4': 'ट्रैक करें और प्राप्त करें',
      'how.step4desc': 'स्थिति ट्रैक करें और अपना दस्तावेज़ प्राप्त करें',
      // Pricing
      'pricing.title': 'पारदर्शी मूल्य निर्धारण',
      'pricing.subtitle': 'कोई छुपा हुआ शुल्क नहीं। केवल सरकारी शुल्क का भुगतान करें।',
      'pricing.free': 'मुफ्त',
      'pricing.select': 'योजना चुनें',
      'pricing.popular': 'सबसे लोकप्रिय',
      // FAQ
      'faq.title': 'अक्सर पूछे जाने वाले प्रश्न',
      'faq.subtitle': 'हमारी सेवाओं के बारे में सामान्य प्रश्नों के उत्तर खोजें।',
      'faq.search': 'प्रश्न खोजें...',
      // Footer
      'footer.tagline': 'हर नागरिक के लिए सरकारी सेवाओं को सुलभ बनाना।',
      'footer.services': 'सेवाएं',
      'footer.company': 'कंपनी',
      'footer.support': 'सहायता',
      'footer.legal': 'कानूनी',
      'footer.rights': 'सर्वाधिकार सुरक्षित।',
      // Chat
      'chat.title': 'SarkarSarkar सहायक',
      'chat.subtitle': 'सरकारी सेवाओं के बारे में कुछ भी पूछें',
      'chat.placeholder': 'अपना संदेश लिखें...',
      'chat.welcome': 'नमस्ते! 👋 मैं आपका SarkarSarkar सहायक हूं। मैं आज आपकी कैसे मदद कर सकता हूं?',
      // Eligibility
      'eligibility.title': 'अपनी पात्रता जांचें',
      'eligibility.select': 'एक सेवा चुनें',
      'eligibility.age': 'अपनी उम्र दर्ज करें',
      'eligibility.check': 'पात्रता जांचें',
      'eligibility.resultEligible': '✅ पात्र हैं!',
      'eligibility.resultNotEligible': '❌ पात्र नहीं हैं',
      // Tracker
      'tracker.title': 'अपना आवेदन ट्रैक करें',
      'tracker.placeholder': 'आवेदन ID दर्ज करें (जैसे, ABC123456)',
      'tracker.mobile': 'पंजीकृत मोबाइल नंबर',
      'tracker.trackBtn': 'स्थिति ट्रैक करें',
      'tracker.errorId': '⚠️ कृपया एक मान्य आवेदन ID दर्ज करें।',
      'tracker.errorMobile': '⚠️ कृपया एक मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।',
      // Notifications
      'notif.title': 'सूचनाएं',
      'notif.markRead': 'सभी पढ़ा हुआ चिह्नित करें',
      // Accessibility
      'a11y.title': 'पहुंच',
      'a11y.fontSize': 'फ़ॉन्ट आकार',
      'a11y.contrast': 'उच्च विषमता',
      'a11y.reset': 'सभी रीसेट करें',
      // Common
      'loading': 'लोड हो रहा है...',
      'error.generic': 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।',
      'error.network': 'नेटवर्क त्रुटि। कृपया अपना कनेक्शन जांचें।',
      'error.offline': 'आप ऑफ़लाइन हैं। कुछ सुविधाएं सीमित हो सकती हैं।'
    }
  };

  function initLanguageToggle() {
    var toggle = document.getElementById('langToggle');
    var langText = document.getElementById('langText');
    var savedLang = localStorage.getItem('sarkarsarkar-lang');
    var isHindi = savedLang === 'hi';

    function applyTranslations(lang) {
      var strings = I18N[lang];
      if (!strings) return;

      // Update all elements with data-i18n attribute
      document.querySelectorAll('[data-i118n]').forEach(function(el) {
        var key = el.getAttribute('data-i118n');
        if (strings[key]) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = strings[key];
          } else {
            el.textContent = strings[key];
          }
        }
      });

      // Also update elements with data-i18n attribute (correct spelling)
      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        if (strings[key]) {
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = strings[key];
          } else {
            el.textContent = strings[key];
          }
        }
      });

      // Update chat welcome message
      var chatWelcome = document.getElementById('chatWelcome');
      if (chatWelcome && strings['chat.welcome']) {
        chatWelcome.textContent = strings['chat.welcome'];
      }
    }

    // Apply saved language on load
    if (isHindi) {
      langText.textContent = 'En';
      document.body.classList.add('lang-hindi');
      applyTranslations('hi');
    }

    toggle.addEventListener('click', function() {
      isHindi = !isHindi;
      var lang = isHindi ? 'hi' : 'en';
      langText.textContent = isHindi ? 'En' : '\u0939\u093F\u0902';
      document.body.classList.toggle('lang-hindi', isHindi);
      localStorage.setItem('sarkarsarkar-lang', lang);
      applyTranslations(lang);
      showToast('success', isHindi ? 'भाषा बदली गई' : 'Language Changed', isHindi ? 'हिंदी में अनुवादित' : 'Translated to English');
    });
  }

  // Expose translation function globally
  window.__ = function(key) {
    var lang = localStorage.getItem('sarkarsarkar-lang') || 'en';
    return (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  };

  // ===== MOBILE MENU =====
  function initMobileMenu() {
    var hamburger = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobileMenu');

    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function() {
      var isOpen = mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open');

      var spans = hamburger.querySelectorAll('span');
      if (!isOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    mobileMenu.querySelectorAll('.mobile-link').forEach(function(link) {
      link.addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        var spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      });
    });
  }

  // ===== ANIMATED COUNTERS =====
  function initAnimatedCounters() {
    var counters = document.querySelectorAll('.stat-number[data-target]');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var target = parseInt(entry.target.getAttribute('data-target'));
          animateCounter(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function(counter) {
      observer.observe(counter);
    });
  }

  function animateCounter(element, target) {
    var duration = 2000;
    var startTime = performance.now();

    function update(currentTime) {
      var elapsed = currentTime - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(eased * target);
      element.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  // ===== FAQ ACCORDION =====
  function initFAQ() {
    var faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function(item) {
      var question = item.querySelector('.faq-question');

      question.addEventListener('click', function() {
        var isOpen = item.classList.contains('open');

        // Close all other items
        faqItems.forEach(function(otherItem) {
          if (otherItem !== item) {
            otherItem.classList.remove('open');
          }
        });

        item.classList.toggle('open', !isOpen);
      });
    });
  }

  // ===== FAQ SEARCH =====
  function initFAQSearch() {
    var searchInput = document.getElementById('faqSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
      var query = this.value.toLowerCase().trim();
      var faqItems = document.querySelectorAll('.faq-item');

      faqItems.forEach(function(item) {
        var questionEl = item.querySelector('.faq-question span');
        var answerEl = item.querySelector('.faq-answer p');
        if (!questionEl || !answerEl) return;

        var question = questionEl.textContent.toLowerCase();
        var answer = answerEl.textContent.toLowerCase();

        if (question.indexOf(query) !== -1 || answer.indexOf(query) !== -1) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // ===== UPI PAYMENT MODAL =====
  function initUPIModal() {
    var modal = document.getElementById('upiModal');
    var closeBtn = document.getElementById('modalClose');
    var form = document.getElementById('upiForm');
    var upiApps = document.querySelectorAll('.upi-app');

    if (!modal) return;

    // Open modal function (exposed globally)
    window.openUPIModal = function(amount) {
      var amountEl = document.getElementById('upiAmount');
      var displayAmount = (amount === 0 || amount === '0') ? '0' : (amount || '500');
      if (amountEl) amountEl.textContent = '\u20B9' + displayAmount;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    };

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
      }
    });

    upiApps.forEach(function(app) {
      app.addEventListener('click', function() {
        var appName = this.getAttribute('data-app');
        showToast('success', 'Redirecting...', 'Opening ' + appName + ' for payment.');
      });
    });

    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var upiId = document.getElementById('upiId').value;

        if (!upiId || upiId.indexOf('@') === -1) {
          showToast('error', 'Invalid UPI ID', 'Please enter a valid UPI ID (e.g., yourname@upi)');
          return;
        }

        showToast('success', 'Payment Initiated', 'Payment request sent to ' + upiId + '. Please approve in your UPI app.');
        closeModal();
      });
    }
  }

  // ===== BACK TO TOP BUTTON =====
  function initBackToTop() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== TESTIMONIALS CAROUSEL =====
  function initTestimonials() {
    var dots = document.querySelectorAll('.testimonial-dot');
    var cards = document.querySelectorAll('.testimonial-card');
    if (!dots.length || !cards.length) return;

    var currentIndex = 0;

    function showTestimonial(index) {
      cards.forEach(function(card, i) {
        card.style.display = i === index ? '' : 'none';
      });
      dots.forEach(function(dot, i) {
        dot.classList.toggle('active', i === index);
      });
      currentIndex = index;
    }

    dots.forEach(function(dot, index) {
      dot.addEventListener('click', function() {
        showTestimonial(index);
      });
    });

    // Auto-rotate testimonials every 5 seconds
    setInterval(function() {
      var nextIndex = (currentIndex + 1) % cards.length;
      showTestimonial(nextIndex);
    }, 5000);
  }

  // ===== ELIGIBILITY CHECKER =====
  function initEligibilityChecker() {
    var form = document.getElementById('quickEligibilityForm');
    var result = document.getElementById('eligibilityResult');
    if (!form || !result) return;

    var rules = {
      aadhaar: { minAge: 0, maxAge: 120, name: 'Aadhaar Card' },
      pan: { minAge: 0, maxAge: 120, name: 'PAN Card' },
      passport: { minAge: 0, maxAge: 120, name: 'Passport' },
      voter: { minAge: 18, maxAge: 120, name: 'Voter ID' },
      driving: { minAge: 18, maxAge: 120, name: 'Driving License' }
    };

    form.addEventListener('submit', function(e) {
      e.preventDefault();

      var service = document.getElementById('serviceSelect').value;
      var age = parseInt(document.getElementById('ageInput').value);

      if (!service) {
        result.className = 'eligibility-result show not-eligible';
        result.innerHTML = '<strong>\u26A0\uFE0F</strong> Please select a service first.';
        return;
      }

      if (isNaN(age) || age < 1 || age > 120) {
        result.className = 'eligibility-result show not-eligible';
        result.innerHTML = '<strong>\u26A0\uFE0F</strong> Please enter a valid age (1-120).';
        return;
      }

      var rule = rules[service];
      result.classList.add('show');

      if (age >= rule.minAge) {
        result.className = 'eligibility-result show eligible';
        result.innerHTML = '<strong>\u2705 Eligible!</strong> You qualify for ' + rule.name + '. <a href="services.html">Apply now \u2192</a>';
      } else {
        result.className = 'eligibility-result show not-eligible';
        result.innerHTML = '<strong>\u274C Not Eligible</strong> for ' + rule.name + '. Minimum age required: ' + rule.minAge + ' years.';
      }
    });
  }

  // ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener('click', function(e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;

        var target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          var navbarHeight = 0;
          var navbar = document.getElementById('navbar');
          if (navbar) navbarHeight = navbar.offsetHeight;
          var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ===== NOTIFICATION SYSTEM (v3) =====
  function initNotifications() {
    var bell = document.getElementById('notifBell');
    var dropdown = document.getElementById('notifDropdown');
    var markReadBtn = document.getElementById('markAllRead');
    var badge = document.getElementById('notifBadge');

    if (!bell || !dropdown) return;

    bell.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    // Mark all as read
    if (markReadBtn) {
      markReadBtn.addEventListener('click', function() {
        var unreadItems = dropdown.querySelectorAll('.notif-item.unread');
        unreadItems.forEach(function(item) {
          item.classList.remove('unread');
        });
        if (badge) {
          badge.style.display = 'none';
        }
        showToast('success', 'All Caught Up!', 'All notifications marked as read.');
      });
    }

    // Simulate a new notification after 10 seconds
    setTimeout(function() {
      showToast('info', 'New Application Update', 'Your Passport application has moved to the next stage.');
      if (badge) {
        var count = parseInt(badge.textContent) || 0;
        badge.textContent = count + 1;
        badge.style.display = 'flex';
      }
    }, 10000);
  }

  // ===== LIVE CHAT WIDGET (v3) =====
  function initChatWidget() {
    var toggle = document.getElementById('chatToggle');
    var windowEl = document.getElementById('chatWindow');
    var closeBtn = document.getElementById('chatClose');
    var sendBtn = document.getElementById('chatSend');
    var input = document.getElementById('chatInput');
    var messagesContainer = document.getElementById('chatMessages');
    var unreadBadge = document.getElementById('chatUnreadBadge');
    var toggleIcon = document.getElementById('chatToggleIcon');

    if (!toggle || !windowEl) return;

    var isOpen = false;

    function openChat() {
      windowEl.classList.add('open');
      isOpen = true;
      if (unreadBadge) unreadBadge.style.display = 'none';
      if (input) input.focus();
    }

    function closeChat() {
      windowEl.classList.remove('open');
      isOpen = false;
    }

    toggle.addEventListener('click', function() {
      if (isOpen) {
        closeChat();
      } else {
        openChat();
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeChat);

    // Bot responses based on keywords
    var botResponses = {
      apply: "To apply for any service:\n1. Go to Services page\n2. Select your service\n3. Fill the application form\n4. Upload documents\n5. Pay the fee\n\nWould you like me to guide you to a specific service?",
      track: "To track your application:\n1. Go to Track Application page\n2. Enter your Application ID\n3. Enter your registered mobile number\n4. Click 'Track'\n\nYou can also check your Dashboard for all active applications.",
      documents: "Common documents needed:\n\u2022 Aadhaar Card\n\u2022 Passport-size photo\n\u2022 Address proof\n\u2022 Date of birth proof\n\u2022 Income certificate (if applicable)\n\nSpecific services may need additional documents. Which service are you applying for?",
      fees: "Payment options available:\n\u2022 UPI (GPay, PhonePe, Paytm, BHIM)\n\u2022 Credit/Debit Cards\n\u2022 Net Banking\n\u2022 EMI (for select services)\n\nAll payments are secured with 256-bit SSL encryption.",
      default: "I understand you need help. Here are some things I can assist with:\n\u2022 How to apply for services\n\u2022 Track your application\n\u2022 Documents required\n\u2022 Fees and payment\n\nOr type your question and I'll do my best to help!"
    };

    function addMessage(text, isUser) {
      if (!messagesContainer) return;

      var messageDiv = document.createElement('div');
      messageDiv.className = 'chat-message ' + (isUser ? 'user' : 'bot');

      var contentDiv = document.createElement('div');
      contentDiv.className = 'chat-message-content';

      var p = document.createElement('p');
      p.textContent = text;
      contentDiv.appendChild(p);

      var timeSpan = document.createElement('span');
      timeSpan.className = 'chat-message-time';
      timeSpan.textContent = 'Just now';

      messageDiv.appendChild(contentDiv);
      messageDiv.appendChild(timeSpan);
      messagesContainer.appendChild(messageDiv);

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function getBotResponse(message) {
      var lowerMsg = message.toLowerCase();
      if (lowerMsg.indexOf('apply') !== -1 || lowerMsg.indexOf('application') !== -1) {
        return botResponses.apply;
      }
      if (lowerMsg.indexOf('track') !== -1 || lowerMsg.indexOf('status') !== -1) {
        return botResponses.track;
      }
      if (lowerMsg.indexOf('document') !== -1 || lowerMsg.indexOf('upload') !== -1) {
        return botResponses.documents;
      }
      if (lowerMsg.indexOf('fee') !== -1 || lowerMsg.indexOf('pay') !== -1 || lowerMsg.indexOf('cost') !== -1) {
        return botResponses.fees;
      }
      return botResponses.default;
    }

    function sendMessage() {
      if (!input) return;
      var message = input.value.trim();
      if (!message) return;

      addMessage(message, true);
      input.value = '';

      // Simulate bot typing delay
      setTimeout(function() {
        var response = getBotResponse(message);
        addMessage(response, false);
      }, 800);
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendMessage();
      });
    }

    // Quick reply buttons
    document.querySelectorAll('.chat-quick-reply').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var reply = this.getAttribute('data-reply');
        var response = botResponses[reply] || botResponses.default;
        addMessage(this.textContent, true);
        setTimeout(function() {
          addMessage(response, false);
        }, 800);
      });
    });

    // Simulate unread message after 30 seconds
    setTimeout(function() {
      if (!isOpen && unreadBadge) {
        unreadBadge.style.display = 'flex';
        unreadBadge.textContent = '2';
      }
    }, 30000);
  }

  // ===== DOCUMENT UPLOAD WIZARD (v3) =====
  function initDocumentUpload() {
    var uploadZone = document.getElementById('uploadZone');
    var fileInput = document.getElementById('fileInput');
    var browseLink = document.getElementById('browseLink');
    var preview = document.getElementById('uploadPreview');
    var actions = document.getElementById('uploadActions');
    var clearBtn = document.getElementById('clearUploads');
    var submitBtn = document.getElementById('submitUploads');

    if (!uploadZone || !fileInput) return;

    var uploadedFiles = [];

    // Click to browse
    if (browseLink) {
      browseLink.addEventListener('click', function() {
        fileInput.click();
      });
    }

    uploadZone.addEventListener('click', function(e) {
      if (e.target !== browseLink) {
        fileInput.click();
      }
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      this.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', function() {
      this.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', function(e) {
      e.preventDefault();
      this.classList.remove('drag-over');
      var files = e.dataTransfer.files;
      handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
      handleFiles(this.files);
    });

    function handleFiles(files) {
      if (!files.length) return;

      Array.from(files).forEach(function(file) {
        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
          showToast('error', 'File Too Large', file.name + ' exceeds 5MB limit.');
          return;
        }

        // Validate file type
        var validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (validTypes.indexOf(file.type) === -1) {
          showToast('error', 'Invalid File Type', file.name + ' is not a supported format.');
          return;
        }

        uploadedFiles.push(file);
        renderFilePreview(file);
      });

      if (uploadedFiles.length > 0 && actions) {
        actions.style.display = 'flex';
      }
    }

    function renderFilePreview(file) {
      if (!preview) return;

      var fileItem = document.createElement('div');
      fileItem.className = 'upload-file-item';

      var icon = document.createElement('span');
      icon.className = 'upload-file-icon';
      icon.textContent = file.type.indexOf('pdf') !== -1 ? '\uD83D\uDCC4' : '\uD83D\uDDBC\uFE0F';

      var info = document.createElement('div');
      info.className = 'upload-file-info';

      var name = document.createElement('div');
      name.className = 'upload-file-name';
      name.textContent = file.name;

      var size = document.createElement('div');
      size.className = 'upload-file-size';
      size.textContent = formatFileSize(file.size);

      var progressBar = document.createElement('div');
      progressBar.className = 'upload-file-progress';

      var progressFill = document.createElement('div');
      progressFill.className = 'upload-file-progress-fill';
      progressFill.style.width = '0%';

      progressBar.appendChild(progressFill);
      info.appendChild(name);
      info.appendChild(size);
      info.appendChild(progressBar);

      var removeBtn = document.createElement('button');
      removeBtn.className = 'upload-file-remove';
      removeBtn.innerHTML = '\u2715';
      removeBtn.addEventListener('click', function() {
        var index = uploadedFiles.indexOf(file);
        if (index > -1) uploadedFiles.splice(index, 1);
        fileItem.remove();
        if (uploadedFiles.length === 0 && actions) {
          actions.style.display = 'none';
        }
      });

      fileItem.appendChild(icon);
      fileItem.appendChild(info);
      fileItem.appendChild(removeBtn);
      preview.appendChild(fileItem);

      // Simulate upload progress
      var progress = 0;
      var interval = setInterval(function() {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }
        progressFill.style.width = progress + '%';
      }, 300);
    }

    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        uploadedFiles = [];
        if (preview) preview.innerHTML = '';
        if (actions) actions.style.display = 'none';
        fileInput.value = '';
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        if (uploadedFiles.length === 0) {
          showToast('error', 'No Files', 'Please upload at least one document.');
          return;
        }
        showToast('success', 'Documents Submitted', uploadedFiles.length + ' document(s) uploaded successfully!');
        uploadedFiles = [];
        if (preview) preview.innerHTML = '';
        if (actions) actions.style.display = 'none';
        fileInput.value = '';
      });
    }
  }

  // ===== SERVICE COMPARISON TOOL (v3) =====
  function initServiceComparison() {
    var compareBtn = document.getElementById('compareBtn');
    var resultContainer = document.getElementById('comparisonResult');

    if (!compareBtn || !resultContainer) return;

    var serviceData = {
      aadhaar: { name: 'Aadhaar Card', fee: 'Free', time: '15-30 days', documents: '3-4', online: 'Partial' },
      pan: { name: 'PAN Card', fee: '\u20B9107', time: '10-15 days', documents: '2-3', online: 'Full' },
      passport: { name: 'Passport', fee: '\u20B91,500', time: '30-45 days', documents: '5-7', online: 'Partial' },
      driving: { name: 'Driving License', fee: '\u20B9200', time: '7-15 days', documents: '3-4', online: 'Partial' },
      voter: { name: 'Voter ID', fee: 'Free', time: '30-45 days', documents: '3-4', online: 'Partial' },
      gst: { name: 'GST Registration', fee: 'Free', time: '7-15 days', documents: '4-6', online: 'Full' }
    };

    compareBtn.addEventListener('click', function() {
      var s1 = document.getElementById('compareService1').value;
      var s2 = document.getElementById('compareService2').value;

      if (s1 === s2) {
        showToast('error', 'Same Service', 'Please select two different services to compare.');
        return;
      }

      var d1 = serviceData[s1];
      var d2 = serviceData[s2];

      var html = '<table class="comparison-table"><thead><tr><th>Feature</th><th>' + d1.name + '</th><th>' + d2.name + '</th></tr></thead><tbody>';
      html += '<tr><td>Application Fee</td><td>' + d1.fee + '</td><td>' + d2.fee + '</td></tr>';
      html += '<tr><td>Processing Time</td><td>' + d1.time + '</td><td>' + d2.time + '</td></tr>';
      html += '<tr><td>Documents Needed</td><td>' + d1.documents + '</td><td>' + d2.documents + '</td></tr>';
      html += '<tr><td>Online Process</td><td>' + d1.online + '</td><td>' + d2.online + '</td></tr>';
      html += '</tbody></table>';

      resultContainer.innerHTML = html;
      resultContainer.classList.add('show');

      showToast('success', 'Comparison Ready', 'Side-by-side comparison generated.');
    });
  }

  // ===== ACCESSIBILITY PANEL (v3) =====
  function initAccessibilityPanel() {
    var toggle = document.getElementById('accessibilityToggle');
    var menu = document.getElementById('accessibilityMenu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', function() {
      menu.classList.toggle('open');
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    // Font size controls
    var fontIncrease = document.getElementById('fontIncrease');
    var fontDecrease = document.getElementById('fontDecrease');
    var fontReset = document.getElementById('fontReset');
    var currentFontSize = 16;

    if (fontIncrease) {
      fontIncrease.addEventListener('click', function() {
        currentFontSize = Math.min(currentFontSize + 2, 24);
        document.documentElement.style.fontSize = currentFontSize + 'px';
        localStorage.setItem('sarkarsarkar-fontsize', currentFontSize);
      });
    }

    if (fontDecrease) {
      fontDecrease.addEventListener('click', function() {
        currentFontSize = Math.max(currentFontSize - 2, 12);
        document.documentElement.style.fontSize = currentFontSize + 'px';
        localStorage.setItem('sarkarsarkar-fontsize', currentFontSize);
      });
    }

    if (fontReset) {
      fontReset.addEventListener('click', function() {
        currentFontSize = 16;
        document.documentElement.style.fontSize = '16px';
        localStorage.removeItem('sarkarsarkar-fontsize');
      });
    }

    // Restore saved font size
    var savedFontSize = localStorage.getItem('sarkarsarkar-fontsize');
    if (savedFontSize) {
      currentFontSize = parseInt(savedFontSize);
      document.documentElement.style.fontSize = currentFontSize + 'px';
    }

    // High contrast
    var highContrast = document.getElementById('highContrast');
    if (highContrast) {
      highContrast.addEventListener('click', function() {
        var isHigh = document.documentElement.getAttribute('data-contrast') === 'high';
        if (isHigh) {
          document.documentElement.removeAttribute('data-contrast');
          this.classList.remove('active');
        } else {
          document.documentElement.setAttribute('data-contrast', 'high');
          this.classList.add('active');
        }
      });
    }

    // Negative contrast
    var negativeContrast = document.getElementById('negativeContrast');
    if (negativeContrast) {
      negativeContrast.addEventListener('click', function() {
        var isNeg = document.body.getAttribute('data-negative') === 'true';
        document.body.setAttribute('data-negative', !isNeg);
        this.classList.toggle('active');
      });
    }

    // Highlight links
    var highlightLinks = document.getElementById('highlightLinks');
    if (highlightLinks) {
      highlightLinks.addEventListener('click', function() {
        var isHighlighted = document.documentElement.getAttribute('data-links-highlighted') === 'true';
        document.documentElement.setAttribute('data-links-highlighted', !isHighlighted);
        this.classList.toggle('active');
      });
    }

    // Big cursor
    var bigCursor = document.getElementById('bigCursor');
    if (bigCursor) {
      bigCursor.addEventListener('click', function() {
        var isBig = document.documentElement.getAttribute('data-big-cursor') === 'true';
        document.documentElement.setAttribute('data-big-cursor', !isBig);
        this.classList.toggle('active');
      });
    }

    // Reset all
    var resetAll = document.getElementById('accessibilityReset');
    if (resetAll) {
      resetAll.addEventListener('click', function() {
        document.documentElement.style.fontSize = '16px';
        document.documentElement.removeAttribute('data-contrast');
        document.documentElement.removeAttribute('data-links-highlighted');
        document.documentElement.removeAttribute('data-big-cursor');
        document.body.removeAttribute('data-negative');
        localStorage.removeItem('sarkarsarkar-fontsize');
        // Remove active classes
        document.querySelectorAll('.accessibility-btn.active').forEach(function(btn) {
          btn.classList.remove('active');
        });
        showToast('success', 'Accessibility Reset', 'All accessibility settings have been reset.');
      });
    }
  }

  // ===== APPLICATION WIZARD NAVIGATION (v3) =====
  function initApplicationWizard() {
    var steps = document.querySelectorAll('.wizard-step');
    var progressFill = document.getElementById('wizardProgressFill');
    var currentStep = 1;
    var totalSteps = steps.length;

    steps.forEach(function(step) {
      step.addEventListener('click', function() {
        var stepNum = parseInt(this.getAttribute('data-step'));
        if (stepNum <= currentStep + 1) {
          goToStep(stepNum);
        }
      });
    });

    function goToStep(stepNum) {
      currentStep = stepNum;

      // Update step indicators
      steps.forEach(function(s, i) {
        var num = i + 1;
        s.classList.remove('active', 'completed');
        if (num === stepNum) {
          s.classList.add('active');
        } else if (num < stepNum) {
          s.classList.add('completed');
        }
      });

      // Update progress bar
      if (progressFill) {
        var progress = (stepNum / totalSteps) * 100;
        progressFill.style.width = progress + '%';
      }
    }

    // Auto-advance wizard for demo
    var wizardInterval = setInterval(function() {
      if (currentStep < totalSteps) {
        goToStep(currentStep + 1);
      } else {
        clearInterval(wizardInterval);
        // Reset after a pause
        setTimeout(function() {
          goToStep(1);
        }, 3000);
      }
    }, 3000);
  }

  // ===== DASHBOARD CHART INTERACTIONS (v3) =====
  function initDashboardChart() {
    var bars = document.querySelectorAll('.chart-bar');

    bars.forEach(function(bar) {
      bar.addEventListener('mouseenter', function() {
        var value = this.getAttribute('data-value');
        var label = this.getAttribute('data-label');
        showToast('info', label + ' Applications', value + ' applications processed in ' + label + '.');
      });
    });
  }

  // ===== TOAST NOTIFICATION SYSTEM (v3) =====
  function initToastSystem() {
    // Show welcome toast after 3 seconds
    setTimeout(function() {
      showToast('info', 'Welcome to SarkarSarkar v3.0!', 'New: Live chat, document upload, service comparison & more.');
    }, 3000);
  }

  function showToast(type, title, message) {
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast';

    var icons = {
      success: '\u2705',
      error: '\u274C',
      info: '\u2139\uFE0F',
      warning: '\u26A0\uFE0F'
    };

    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
      '<div class="toast-content">' +
        '<div class="toast-title">' + title + '</div>' +
        '<div class="toast-message">' + message + '</div>' +
      '</div>' +
      '<button class="toast-close">\u2715</button>';

    container.appendChild(toast);

    // Close button
    var closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function() {
      removeToast(toast);
    });

    // Auto-remove after 5 seconds
    setTimeout(function() {
      removeToast(toast);
    }, 5000);
  }

  function removeToast(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('hiding');
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }

  // Expose showToast globally
  window.showToast = showToast;

  // ===== OFFLINE / ONLINE DETECTION =====
  function initOfflineDetection() {
    var banner = document.getElementById('offlineBanner');
    if (!banner) {
      // Create banner if it doesn't exist
      banner = document.createElement('div');
      banner.id = 'offlineBanner';
      banner.className = 'offline-banner';
      banner.setAttribute('role', 'alert');
      banner.textContent = '⚠️ You are offline. Some features may be limited.';
      document.body.appendChild(banner);
    }

    function handleOffline() {
      banner.classList.add('show');
      if (typeof showToast === 'function') {
        showToast('warning', 'Offline Mode', 'You are currently offline. Some features may be limited.');
      }
    }

    function handleOnline() {
      banner.classList.remove('show');
      if (typeof showToast === 'function') {
        showToast('success', 'Back Online', 'Your connection has been restored.');
      }
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }
  }

  // ===== GLOBAL ERROR HANDLING =====
  function initErrorHandling() {
    // Catch unhandled errors
    window.addEventListener('error', function(event) {
      console.error('[SarkarSarkar] Unhandled error:', event.error || event.message);
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      console.error('[SarkarSarkar] Unhandled promise rejection:', event.reason);
    });
  }

  // Initialize offline detection and error handling
  initOfflineDetection();
  initErrorHandling();

  // ===== PWA SERVICE WORKER REGISTRATION (v3) =====
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
        .then(function(registration) {
          console.log('[SW] Registered successfully. Scope:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', function() {
            var newWorker = registration.installing;
            newWorker.addEventListener('statechange', function() {
              if (newWorker.state === 'activated') {
                showToast('info', 'App Updated', 'A new version of SarkarSarkar is available!');
              }
            });
          });
        })
        .catch(function(error) {
          console.log('[SW] Registration failed:', error);
        });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        console.log('[SW] New service worker activated');
      });
    }
  }

})();
