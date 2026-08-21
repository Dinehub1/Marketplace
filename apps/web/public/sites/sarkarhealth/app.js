/**
 * ========== SARKARHEALTH - TELEMEDICINE PORTAL ==========
 * Main JavaScript Application
 * 
 * Features:
 * - Mobile navigation toggle
 * - Dark mode toggle with localStorage
 * - Specialty cards data rendering
 * - Animated counters (hero stats)
 * - FAQ accordion
 * - UPI payment modal with tab switching
 * - AI symptom checker (simulated)
 * - Back to top button
 * - Smooth scroll for anchor links
 * - Form validation
 */

// ========== DOM CONTENT LOADED ==========
document.addEventListener('DOMContentLoaded', function() {
    initNavigation();
    initThemeToggle();
    initSpecialtyCards();
    initCounters();
    initFAQ();
    initPaymentModal();
    initBackToTop();
    initBookingForm();
    initSmoothScroll();
});

// ========== NAVIGATION ==========
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            const isExpanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !isExpanded);
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            }
        });
        
        // Close menu on nav link click
        navMenu.querySelectorAll('.nav-link').forEach(function(link) {
            link.addEventListener('click', function() {
                navToggle.setAttribute('aria-expanded', 'false');
                navMenu.classList.remove('active');
            });
        });
    }
}

// ========== DARK MODE TOGGLE ==========
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const html = document.documentElement;
    const icon = themeToggle.querySelector('i');
    
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('sarkarhealth-theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        html.setAttribute('data-theme', 'dark');
        icon.className = 'fas fa-sun';
    }
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = html.getAttribute('data-theme');
        
        if (currentTheme === 'dark') {
            html.removeAttribute('data-theme');
            icon.className = 'fas fa-moon';
            localStorage.setItem('sarkarhealth-theme', 'light');
        } else {
            html.setAttribute('data-theme', 'dark');
            icon.className = 'fas fa-sun';
            localStorage.setItem('sarkarhealth-theme', 'dark');
        }
    });
}

// ========== SPECIALTY CARDS DATA ==========
function initSpecialtyCards() {
    const specialties = [
        { icon: 'fa-heart-pulse', name: 'Cardiology', desc: 'Heart & blood vessels', color: '#e63946' },
        { icon: 'fa-hand-dots', name: 'Dermatology', desc: 'Skin, hair & nails', color: '#f4a261' },
        { icon: 'fa-baby', name: 'Pediatrics', desc: 'Child healthcare', color: '#2a9d8f' },
        { icon: 'fa-bone', name: 'Orthopedics', desc: 'Bones & joints', color: '#457b9d' },
        { icon: 'fa-brain', name: 'Neurology', desc: 'Brain & nerves', color: '#7209b7' },
        { icon: 'fa-head-side-virus', name: 'Psychiatry', desc: 'Mental wellness', color: '#06d6a0' },
        { icon: 'fa-person-dress', name: 'Gynecology', desc: 'Women\'s health', color: '#ef476f' },
        { icon: 'fa-stethoscope', name: 'General', desc: 'Common ailments', color: '#118ab2' },
        { icon: 'fa-lungs', name: 'Pulmonology', desc: 'Lungs & breathing', color: '#588157' },
        { icon: 'fa-tooth', name: 'Dentistry', desc: 'Dental care', color: '#bc6c25' },
        { icon: 'fa-eye', name: 'Ophthalmology', desc: 'Eye care', color: '#0077b6' },
        { icon: 'fa-ear', name: 'ENT', desc: 'Ear, nose & throat', color: '#9b5de5' }
    ];
    
    const grid = document.querySelector('.specialties-grid');
    if (!grid) return;
    
    grid.innerHTML = specialties.map(function(spec) {
        return '<div class="specialty-card" role="listitem" tabindex="0" onclick="document.getElementById(\'consultation\').scrollIntoView({behavior:\'smooth\'})">' +
            '<div class="specialty-icon" style="background: ' + spec.color + '15; color: ' + spec.color + '">' +
                '<i class="fas ' + spec.icon + '" aria-hidden="true"></i>' +
            '</div>' +
            '<h3>' + spec.name + '</h3>' +
            '<p>' + spec.desc + '</p>' +
        '</div>';
    }).join('');
}

// ========== ANIMATED COUNTERS ==========
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const observerOptions = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    counters.forEach(function(counter) {
        observer.observe(counter);
    });
}

function animateCounter(element) {
    var target = parseInt(element.getAttribute('data-count'), 10);
    var duration = 2000; // 2 seconds
    var step = target / (duration / 16); // 60fps
    var current = 0;
    
    function updateCounter() {
        current += step;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString('en-IN');
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target.toLocaleString('en-IN');
        }
    }
    
    updateCounter();
}

// ========== FAQ ACCORDION ==========
function initFAQ() {
    var faqButtons = document.querySelectorAll('.faq-question');
    
    faqButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            var isExpanded = this.getAttribute('aria-expanded') === 'true';
            var answer = this.nextElementSibling;
            
            // Close all other FAQs
            faqButtons.forEach(function(btn) {
                if (btn !== this) {
                    btn.setAttribute('aria-expanded', 'false');
                    btn.nextElementSibling.classList.remove('open');
                }
            }.bind(this));
            
            // Toggle current
            this.setAttribute('aria-expanded', !isExpanded);
            answer.classList.toggle('open');
        });
    });
}

// ========== PAYMENT MODAL ==========
function openPaymentModal(planName, amount) {
    var modal = document.getElementById('payment-modal');
    document.getElementById('payment-plan-name').textContent = planName;
    document.getElementById('payment-amount-display').textContent = '₹' + amount;
    document.getElementById('pay-button-amount').textContent = '₹' + amount;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus trap
    setTimeout(function() {
        var closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.focus();
    }, 100);
}

function closePaymentModal() {
    var modal = document.getElementById('payment-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closePaymentModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closePaymentModal();
    }
});

// Payment tab switching
function switchPaymentTab(method) {
    var tabs = document.querySelectorAll('.payment-tab');
    var panels = document.querySelectorAll('.payment-method');
    
    tabs.forEach(function(tab) {
        var isActive = tab.getAttribute('data-method') === method;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive);
    });
    
    panels.forEach(function(panel) {
        panel.classList.toggle('active', panel.id === method + '-panel');
    });
}

// Process payment (simulated)
function processPayment() {
    var button = document.getElementById('pay-button');
    var originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Processing...';
    button.disabled = true;
    
    setTimeout(function() {
        button.innerHTML = '<i class="fas fa-check-circle" aria-hidden="true"></i> Payment Successful!';
        button.style.background = '#2d6a4f';
        
        setTimeout(function() {
            closePaymentModal();
            showToast('Payment confirmed! Your consultation has been booked.');
            button.innerHTML = originalText;
            button.style.background = '';
            button.disabled = false;
        }, 1500);
    }, 2000);
}

// ========== AI SYMPTOM CHECKER (Simulated) ==========
function runSymptomCheck() {
    var input = document.getElementById('symptom-checker');
    var resultDiv = document.getElementById('symptom-result');
    var symptoms = input.value.trim().toLowerCase();
    
    if (!symptoms) {
        showToast('Please describe your symptoms first.');
        input.focus();
        return;
    }
    
    // Simulated AI analysis based on keywords
    var results = [];
    
    if (symptoms.includes('fever') || symptoms.includes('temperature')) {
        results.push({
            condition: 'Viral Fever',
            recommendation: 'Consult a General Physician. Stay hydrated and rest.',
            confidence: 'High'
        });
    }
    if (symptoms.includes('headache') || symptoms.includes('head pain')) {
        results.push({
            condition: 'Tension Headache / Migraine',
            recommendation: 'Consult a Neurologist if persistent. Avoid screen time.',
            confidence: 'Medium'
        });
    }
    if (symptoms.includes('chest') || symptoms.includes('heart')) {
        results.push({
            condition: 'Cardiac Concern',
            recommendation: 'URGENT: Consult a Cardiologist immediately.',
            confidence: 'High'
        });
    }
    if (symptoms.includes('skin') || symptoms.includes('rash') || symptoms.includes('acne')) {
        results.push({
            condition: 'Dermatological Issue',
            recommendation: 'Consult a Dermatologist for proper diagnosis.',
            confidence: 'Medium'
        });
    }
    if (symptoms.includes('stomach') || symptoms.includes('abdominal') || symptoms.includes('digestion')) {
        results.push({
            condition: 'Gastrointestinal Issue',
            recommendation: 'Consult a Gastroenterologist. Avoid spicy food.',
            confidence: 'Medium'
        });
    }
    if (symptoms.includes('anxiety') || symptoms.includes('depression') || symptoms.includes('stress')) {
        results.push({
            condition: 'Mental Health Concern',
            recommendation: 'Consult a Psychiatrist or Psychologist. You are not alone.',
            confidence: 'High'
        });
    }
    if (symptoms.includes('bone') || symptoms.includes('joint') || symptoms.includes('knee')) {
        results.push({
            condition: 'Orthopedic Issue',
            recommendation: 'Consult an Orthopedist. Get X-rays if needed.',
            confidence: 'Medium'
        });
    }
    
    // Default result if no keywords matched
    if (results.length === 0) {
        results.push({
            condition: 'General Health Concern',
            recommendation: 'Consult a General Physician for a proper checkup.',
            confidence: 'Low'
        });
    }
    
    // Render results
    var html = '<h3><i class="fas fa-robot" aria-hidden="true"></i> AI Analysis Results</h3>';
    results.forEach(function(r) {
        html += '<div class="ai-result-item">' +
            '<h4>' + r.condition + ' <span class="ai-result-confidence">' + r.confidence + ' confidence</span></h4>' +
            '<p>' + r.recommendation + '</p>' +
        '</div>';
    });
    html += '<button class="btn btn-primary btn-block" onclick="document.getElementById(\'consultation\').scrollIntoView({behavior:\'smooth\'})">' +
        '<i class="fas fa-video" aria-hidden="true"></i> Book Consultation Now' +
    '</button>';
    
    resultDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ========== BACK TO TOP BUTTON ==========
function initBackToTop() {
    var backToTopBtn = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });
}

// ========== BOOKING FORM ==========
function initBookingForm() {
    var form = document.getElementById('booking-form');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            var name = document.getElementById('patient-name').value.trim();
            var phone = document.getElementById('patient-phone').value.trim();
            var symptoms = document.getElementById('consult-symptoms').value.trim();
            
            if (!name || !phone || !symptoms) {
                showToast('Please fill in all required fields.');
                return;
            }
            
            if (!/^[0-9+\- ]{10,15}$/.test(phone)) {
                showToast('Please enter a valid phone number.');
                return;
            }
            
            // Simulate booking
            showToast('Booking confirmed! A doctor will call you within 15 minutes.');
            form.reset();
        });
    }
}

// ========== SMOOTH SCROLL ==========
function initSmoothScroll() {
    var links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(function(link) {
        link.addEventListener('click', function(e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var navHeight = document.querySelector('.navbar').offsetHeight;
                var targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message) {
    // Remove existing toast
    var existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    var toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.innerHTML = '<i class="fas fa-check-circle" aria-hidden="true"></i> ' + message;
    
    // Toast styles
    toast.style.cssText = 
        'position: fixed;' +
        'bottom: 24px;' +
        'left: 50%;' +
        'transform: translateX(-50%);' +
        'background: #1d3557;' +
        'color: white;' +
        'padding: 12px 24px;' +
        'border-radius: 8px;' +
        'font-size: 0.9375rem;' +
        'font-weight: 500;' +
        'z-index: 3000;' +
        'box-shadow: 0 8px 24px rgba(0,0,0,0.2);' +
        'animation: toastSlideIn 0.3s ease;' +
        'display: flex;' +
        'align-items: center;' +
        'gap: 8px;' +
        'max-width: 90vw;' +
        'text-align: center;';
    
    document.body.appendChild(toast);
    
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(function() {
            toast.remove();
        }, 300);
    }, 4000);
}

// Add toast animation keyframes dynamically
var style = document.createElement('style');
style.textContent = '@keyframes toastSlideIn { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }';
document.head.appendChild(style);
