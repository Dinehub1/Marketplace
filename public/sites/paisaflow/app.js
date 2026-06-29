/**
 * PaisaFlow - Landing Page JavaScript
 *
 * Features:
 * - Mobile navigation toggle
 * - Navbar scroll effect
 * - Modal management (UPI Payment, Signup, Login)
 * - FAQ accordion
 * - Smooth scrolling
 * - Toast notifications
 * - Form handling
 */

// ========== DOM READY ==========
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all features
    initMobileNav();
    initScrollEffects();
    initFaqAccordion();
    initScrollAnimations();
    initMobileFormatting();
    initLiveTransactionFeed();
    setDynamicYear();
    initDarkMode();
    initAnimatedCounters();
    initDashboard();
    initResourceTabs();
    initComparisonCTA();
    initSendMoney();
    initReferral();
    initResourceCardClicks();
    initLoadMoreArticles();
});

// ========== DYNAMIC YEAR ==========
/**
 * Sets the current year in the footer copyright.
 * Prevents stale copyright years.
 */
function setDynamicYear() {
    const yearEl = document.getElementById('footerYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

// ========== MOBILE NUMBER FORMATTING ==========
/**
 * Formats the signup mobile input in real-time as "XXXXX XXXXX".
 * Strips non-digits, limits to 10 digits, adds space after 5th digit.
 */
function initMobileFormatting() {
    const mobileInput = document.getElementById('signupMobile');
    if (!mobileInput) return;

    mobileInput.addEventListener('input', function(e) {
        // Strip all non-digit characters
        let digits = this.value.replace(/\D/g, '');

        // Limit to 10 digits
        if (digits.length > 10) digits = digits.slice(0, 10);

        // Format as "XXXXX XXXXX" (space after 5th digit)
        let formatted = digits;
        if (digits.length > 5) {
            formatted = digits.slice(0, 5) + ' ' + digits.slice(5);
        }

        // Only update if changed (prevents cursor jumping)
        if (this.value !== formatted) {
            this.value = formatted;
        }
    });

    // Prevent non-numeric paste
    mobileInput.addEventListener('paste', function(e) {
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        if (/\D/.test(pasted.replace(/\s/g, ''))) {
            e.preventDefault();
        }
    });
}

// ========== MOBILE NAVIGATION ==========
/**
 * Toggles the mobile navigation menu open/closed.
 * Adds click listener to the hamburger button.
 */
function initMobileNav() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', function() {
            // Toggle active state on both button and nav
            menuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when any nav link is clicked
        const linkElements = navLinks.querySelectorAll('a');
        linkElements.forEach(function(link) {
            link.addEventListener('click', function() {
                menuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!menuBtn.contains(event.target) && !navLinks.contains(event.target)) {
                menuBtn.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
}

// ========== SCROLL EFFECTS ==========
/**
 * Adds shadow and background opacity to navbar when user scrolls.
 * Uses scrollY position to toggle 'scrolled' class.
 */
function initScrollEffects() {
    const navbar = document.getElementById('navbar');

    function handleScroll() {
        if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Listen for scroll events with performance optimization
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
}

// ========== SMOOTH SCROLLING ==========
/**
 * Scrolls smoothly to a section by its ID.
 * Called by buttons and links throughout the page.
 *
 * @param {string} sectionId - The ID of the target section
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const navbarHeight = 72;
        const sectionTop = section.getBoundingClientRect().top + window.scrollY - navbarHeight;
        window.scrollTo({
            top: sectionTop,
            behavior: 'smooth'
        });
    }
}

// ========== MODAL MANAGEMENT ==========

/** Tracks the element that had focus before a modal opened, so we can restore it on close. */
let lastFocusedElement = null;

/**
 * Opens the UPI payment modal.
 * Adds 'active' class to trigger CSS transition.
 * Saves the currently focused element for restoration on close.
 */
function openUpiModal() {
    closeAllModals();
    lastFocusedElement = document.activeElement;
    var modal = document.getElementById('upiModal');
    if (modal) {
        // Reset modal to form state (in case it was left on success/processing)
        resetUpiModalState();
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Add focus trap listener (generic, scoped to this modal)
        var handler = createTrapFocus(modal);
        modalFocusTraps[modal.id] = handler;
        modal.addEventListener('keydown', handler);

        // Generate QR code after modal is visible (small delay for DOM)
        setTimeout(function() {
            generateUpiQR();
        }, 100);

        // Focus the first focusable element in the modal
        setTimeout(function() {
            var firstInput = modal.querySelector('input, button:not(.modal-close)');
            if (firstInput) firstInput.focus();
        }, 150);
    }
}

/**
 * Closes the UPI payment modal.
 * Restores focus to the element that opened it.
 */
function closeUpiModal() {
    const modal = document.getElementById('upiModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Remove focus trap listener using the stored handler
        if (modalFocusTraps[modal.id]) {
            modal.removeEventListener('keydown', modalFocusTraps[modal.id]);
            delete modalFocusTraps[modal.id];
        }
        // Restore focus to the trigger element
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }
}

/**
 * Resets the UPI modal back to the initial form state.
 * Called when opening the modal to ensure clean state.
 */
function resetUpiModalState() {
    // Show form section, hide processing and success
    document.getElementById('upiFormSection').classList.add('active');
    document.getElementById('upiProcessingSection').classList.remove('active');
    document.getElementById('upiSuccessSection').classList.remove('active');

    // Reset progress steps
    for (var i = 1; i <= 3; i++) {
        var step = document.getElementById('progressStep' + i);
        var line = document.getElementById('progressLine' + i);
        if (step) {
            step.classList.remove('active', 'completed');
            if (i === 1) step.classList.add('active');
        }
        if (line) line.classList.remove('completed');
    }

    // Reset form
    var form = document.getElementById('upiForm');
    if (form) form.reset();

    // Clear validation states
    clearUpiValidation();

    // Restore submit button
    var submitBtn = document.getElementById('payNowBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">⚡</span> Pay Now';
    }
}

/**
 * Clears UPI form validation error states.
 */
function clearUpiValidation() {
    var upiIdInput = document.getElementById('upiId');
    var upiAmountInput = document.getElementById('upiAmount');
    var upiIdError = document.getElementById('upiIdError');
    var upiAmountError = document.getElementById('upiAmountError');

    if (upiIdInput) upiIdInput.classList.remove('error', 'success');
    if (upiAmountInput) upiAmountInput.classList.remove('error', 'success');
    if (upiIdError) { upiIdError.style.display = 'none'; upiIdError.textContent = ''; }
    if (upiAmountError) { upiAmountError.style.display = 'none'; upiAmountError.textContent = ''; }
}

/**
 * Validates a UPI ID string.
 * @param {string} upiId - The UPI ID to validate
 * @returns {boolean} True if valid
 */
function isValidUpiId(upiId) {
    // UPI ID format: username@handle (e.g., name@upi, name@paytm, 9876543210@ybl)
    // Username: 1-50 chars, alphanumeric, dots, hyphens, underscores
    // Handle: 1-20 chars, alphanumeric, dots
    var upiRegex = /^[a-zA-Z0-9._-]{1,50}@[a-zA-Z0-9.]{1,20}$/;
    return upiRegex.test(upiId);
}

/**
 * Shows a validation error on a form field.
 * @param {HTMLElement} input - The input element
 * @param {HTMLElement} errorEl - The error message element
 * @param {string} message - The error message
 */
function showFieldError(input, errorEl, message) {
    input.classList.add('error');
    input.classList.remove('success');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

/**
 * Shows a validation success state on a form field.
 * @param {HTMLElement} input - The input element
 * @param {HTMLElement} errorEl - The error message element
 */
function showFieldSuccess(input, errorEl) {
    input.classList.remove('error');
    input.classList.add('success');
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
}

/**
 * Traps focus within the modal for accessibility.
 * Tab cycles through focusable elements inside the modal.
 * @param {KeyboardEvent} e - The keydown event
 */
/**
 * Creates a focus-trap handler for a specific modal.
 * Returns a function suitable as a keydown listener that traps Tab/Shift+Tab
 * within the given modal element.
 * @param {HTMLElement} modalElement - The modal to trap focus within
 * @returns {Function} keydown event handler
 */
function createTrapFocus(modalElement) {
    return function(e) {
        if (e.key !== 'Tab') return;

        // Get all focusable elements in the modal
        var focusableSelectors = 'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';
        var focusableElements = Array.prototype.slice.call(
            modalElement.querySelectorAll(focusableSelectors)
        ).filter(function(el) {
            return el.offsetParent !== null; // Only visible elements
        });

        if (focusableElements.length === 0) return;

        var firstFocusable = focusableElements[0];
        var lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift+Tab: if on first element, wrap to last
            if (document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            }
        } else {
            // Tab: if on last element, wrap to first
            if (document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        }
    };
}

/**
 * Maps modal-overlay elements to their active trapFocus handler functions.
 * Used by closeAllModals() to properly remove listeners on close.
 */
var modalFocusTraps = {};

/**
 * Opens the signup modal.
 */
function openSignupModal() {
    closeAllModals();
    lastFocusedElement = document.activeElement;
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Add focus trap listener
        var handler = createTrapFocus(modal);
        modalFocusTraps[modal.id] = handler;
        modal.addEventListener('keydown', handler);
        // Focus the first input in the modal
        setTimeout(function() {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 150);
    }
}

/**
 * Closes the signup modal.
 * Restores focus to the element that opened it.
 */
function closeSignupModal() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (modalFocusTraps[modal.id]) {
            modal.removeEventListener('keydown', modalFocusTraps[modal.id]);
            delete modalFocusTraps[modal.id];
        }
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }
}

/**
 * Opens the login modal.
 */
function openLoginModal() {
    closeAllModals();
    lastFocusedElement = document.activeElement;
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Add focus trap listener
        var handler = createTrapFocus(modal);
        modalFocusTraps[modal.id] = handler;
        modal.addEventListener('keydown', handler);
        // Focus the first input in the modal
        setTimeout(function() {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 150);
    }
}

/**
 * Closes the login modal.
 * Restores focus to the element that opened it.
 */
function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (modalFocusTraps[modal.id]) {
            modal.removeEventListener('keydown', modalFocusTraps[modal.id]);
            delete modalFocusTraps[modal.id];
        }
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }
}

/**
 * Closes all open modals.
 * Removes focus trap listeners and restores body scroll.
 * Utility function to ensure only one modal is open at a time.
 */
function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(function(modal) {
        modal.classList.remove('active');
        // Remove any active focus trap listener for this modal
        if (modalFocusTraps[modal.id]) {
            modal.removeEventListener('keydown', modalFocusTraps[modal.id]);
            delete modalFocusTraps[modal.id];
        }
    });
    document.body.style.overflow = '';
    // Restore focus to the element that opened the modal (if any)
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
}

// Close modals when overlay is clicked
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        closeAllModals();
    }
});

// Close modals on Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeAllModals();
    }
});

// ========== UPI QR INPUT LISTENERS (one-time init) ==========
// Register input listeners once at startup instead of inside openUpiModal()
// to prevent listener accumulation (each open was adding duplicate listeners).
document.addEventListener('DOMContentLoaded', function() {
    var amtInput = document.getElementById('upiAmount');
    var noteInput = document.getElementById('upiNote');
    if (amtInput) amtInput.addEventListener('input', generateUpiQR);
    if (noteInput) noteInput.addEventListener('input', generateUpiQR);
});

// ========== UPI PAYMENT FUNCTIONS ==========

/** PaisaFlow's merchant UPI ID for receiving payments */
const MERCHANT_UPI_ID = 'paisaflow@hdfcbank';
const MERCHANT_NAME = 'PaisaFlow';

/**
 * Copies the merchant UPI ID to clipboard.
 * Shows visual feedback on the copy button.
 */
function copyPayeeUPI() {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(MERCHANT_UPI_ID).then(function() {
            showCopyFeedback();
        }).catch(function() {
            fallbackCopyUPI();
        });
    } else {
        fallbackCopyUPI();
    }
}

/**
 * Fallback copy method for browsers without clipboard API.
 */
function fallbackCopyUPI() {
    const textArea = document.createElement('textarea');
    textArea.value = MERCHANT_UPI_ID;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showCopyFeedback();
    } catch (err) {
        showToast('Press Ctrl+C to copy: ' + MERCHANT_UPI_ID);
    }
    document.body.removeChild(textArea);
}

/**
 * Shows visual feedback after copying UPI ID.
 * Temporarily changes the copy button text/icon.
 */
function showCopyFeedback() {
    const copyIcon = document.getElementById('copyIcon');
    const copyBtn = document.querySelector('.upi-copy-btn');
    if (copyIcon) copyIcon.textContent = '✅';
    if (copyBtn) copyBtn.classList.add('copied');
    showToast('UPI ID copied to clipboard!');
    setTimeout(function() {
        if (copyIcon) copyIcon.textContent = '📋';
        if (copyBtn) copyBtn.classList.remove('copied');
    }, 2000);
}

/**
 * Opens a UPI app with a pre-filled payment intent.
 * Constructs the UPI deep link for the selected app.
 *
 * @param {string} app - The UPI app identifier ('gpay', 'phonepe', 'paytm', 'bhim')
 */
function openUpiApp(app) {
    // Null-safety: elements may not exist if modal was closed
    var amountEl = document.getElementById('upiAmount');
    var noteEl = document.getElementById('upiNote');
    var amount = (amountEl && amountEl.value) ? amountEl.value : '99';
    var note = (noteEl && noteEl.value) ? noteEl.value : 'PaisaFlow Payment';

    // Validate amount before opening app
    var parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 1) {
        showToast('Please enter a valid amount (₹1 minimum).', 'error');
        if (amountEl) amountEl.focus();
        return;
    }
    if (parsedAmount > 100000) {
        showToast('Maximum UPI transaction amount is ₹1,00,000.', 'error');
        if (amountEl) amountEl.focus();
        return;
    }

    // Build UPI URI (universal format)
    // Note: UPI deep links use pa= (payee address), pn= (payee name),
    // am= (amount), cu= (currency), tn= (transaction note), tr= (transaction ref)
    // The sender's UPI ID is NOT included — the opening app determines the sender.
    var txnRef = 'PF' + Date.now();
    var upiUri = 'upi://pay?pa=' + encodeURIComponent(MERCHANT_UPI_ID) +
        '&pn=' + encodeURIComponent(MERCHANT_NAME) +
        '&am=' + encodeURIComponent(amount) +
        '&cu=INR' +
        '&tn=' + encodeURIComponent(note) +
        '&tr=' + encodeURIComponent(txnRef);

    // App-specific deep links (all use standard UPI parameters)
    var appLinks = {
        gpay: 'gpay://upi/pay?pa=' + encodeURIComponent(MERCHANT_UPI_ID) +
              '&pn=' + encodeURIComponent(MERCHANT_NAME) +
              '&am=' + encodeURIComponent(amount) +
              '&cu=INR&tn=' + encodeURIComponent(note) +
              '&tr=' + encodeURIComponent(txnRef),
        phonepe: 'phonepe://pay?pa=' + encodeURIComponent(MERCHANT_UPI_ID) +
                 '&pn=' + encodeURIComponent(MERCHANT_NAME) +
                 '&am=' + encodeURIComponent(amount) +
                 '&cu=INR&tn=' + encodeURIComponent(note) +
                 '&tr=' + encodeURIComponent(txnRef),
        paytm: 'paytmmp://pay?pa=' + encodeURIComponent(MERCHANT_UPI_ID) +
               '&pn=' + encodeURIComponent(MERCHANT_NAME) +
               '&am=' + encodeURIComponent(amount) +
               '&cu=INR&tn=' + encodeURIComponent(note) +
               '&tr=' + encodeURIComponent(txnRef),
        bhim: upiUri
    };

    // Open the app deep link
    if (appLinks[app]) {
        // Show toast with amount being sent
        showToast('Opening ' + getAppName(app) + ' for ₹' + parsedAmount.toLocaleString('en-IN') + '...', 'info');
        window.location.href = appLinks[app];
        // Fallback toast in case app is not installed
        setTimeout(function() {
            showToast('If the app didn\'t open, please try another payment method or use the UPI form below.');
        }, 3000);
    }
}

/**
 * Returns a human-readable app name for toast messages.
 * @param {string} app - The app identifier
 * @returns {string} Display name
 */
function getAppName(app) {
    var names = { gpay: 'Google Pay', phonepe: 'PhonePe', paytm: 'Paytm', bhim: 'BHIM' };
    return names[app] || app;
}

/**
 * Generates a real, scannable QR code using the qrcode.js library.
 * Encodes the full UPI payment URI so any UPI app can scan and pay.
 */
function generateUpiQR() {
    const canvas = document.getElementById('upiQrCanvas');
    if (!canvas || typeof QRCode === 'undefined') return;

    // Null-safety: elements may not exist if modal was closed
    const amountEl = document.getElementById('upiAmount');
    const noteEl = document.getElementById('upiNote');
    const amount = (amountEl && amountEl.value) ? amountEl.value : '99';
    const note = (noteEl && noteEl.value) ? noteEl.value : 'PaisaFlow Payment';

    // Build UPI URI — this is the standard format all UPI apps understand
    const upiUri = 'upi://pay?pa=' + encodeURIComponent(MERCHANT_UPI_ID) +
        '&pn=' + encodeURIComponent(MERCHANT_NAME) +
        '&am=' + encodeURIComponent(amount) +
        '&cu=INR&tn=' + encodeURIComponent(note);

    // Clear canvas first
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 200, 200);

    // Generate real QR code
    QRCode.toCanvas(canvas, upiUri, {
        width: 200,
        margin: 2,
        color: {
            dark: '#1A1A2E',
            light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction = more reliable scanning
    }, function(error) {
        if (error) {
            console.error('QR code generation failed:', error);
            // Fallback: draw error message on canvas
            ctx.fillStyle = '#FF6B6B';
            ctx.font = '12px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('QR unavailable', 100, 100);
        }
    });
}

// ========== FORM LOADING STATE ==========

/**
 * Sets a submit button's loading state (disabled + spinner text).
 * @param {HTMLButtonElement} btn - The submit button
 * @param {string} loadingText - Text to show while loading (default: 'Processing...')
 */
function setButtonLoading(btn, loadingText) {
    if (!btn) return;
    btn.dataset.originalText = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('btn-loading');
    btn.innerHTML = '<span class="btn-spinner"></span> ' + (loadingText || 'Processing...');
}

/**
 * Restores a submit button to its normal state.
 * @param {HTMLButtonElement} btn - The submit button
 */
function restoreButton(btn) {
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('btn-loading');
    if (btn.dataset.originalText) {
        btn.innerHTML = btn.dataset.originalText;
    }
}

// ========== UPI PAYMENT FORM ==========
/**
 * Processes the UPI payment form submission.
 * Validates inputs and shows success toast.
 *
 * @param {Event} event - The form submit event
 */
function processUpiPayment(event) {
    event.preventDefault();

    // Get form values (trim whitespace)
    var upiIdInput = document.getElementById('upiId');
    var upiAmountInput = document.getElementById('upiAmount');
    var upiIdError = document.getElementById('upiIdError');
    var upiAmountError = document.getElementById('upiAmountError');
    var upiId = upiIdInput.value.trim();
    var amount = parseFloat(upiAmountInput.value);
    var note = document.getElementById('upiNote').value.trim();

    // Clear previous validation
    clearUpiValidation();

    // Track validation state
    var isValid = true;

    // Validate UPI ID
    if (!upiId) {
        showFieldError(upiIdInput, upiIdError, 'Please enter your UPI ID.');
        isValid = false;
    } else if (!isValidUpiId(upiId)) {
        showFieldError(upiIdInput, upiIdError, 'Invalid format. Use: name@upi (e.g., 9876543210@ybl)');
        isValid = false;
    } else {
        showFieldSuccess(upiIdInput, upiIdError);
    }

    // Validate amount
    if (isNaN(amount) || upiAmountInput.value === '') {
        showFieldError(upiAmountInput, upiAmountError, 'Please enter an amount.');
        isValid = false;
    } else if (amount < 1) {
        showFieldError(upiAmountInput, upiAmountError, 'Minimum amount is ₹1.');
        isValid = false;
    } else if (amount > 100000) {
        showFieldError(upiAmountInput, upiAmountError, 'Maximum amount is ₹1,00,000 per transaction.');
        isValid = false;
    } else {
        showFieldSuccess(upiAmountInput, upiAmountError);
    }

    if (!isValid) return;

    // --- Payment flow: Form -> Processing -> Success ---
    var submitBtn = document.getElementById('payNowBtn');

    // Step 1: Update progress to "Processing"
    updatePaymentProgress(2);
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Processing...';

    // Step 2: Switch to processing view after brief delay
    setTimeout(function() {
        document.getElementById('upiFormSection').classList.remove('active');
        document.getElementById('upiProcessingSection').classList.add('active');
        updatePaymentProgress(2);

        // Update processing text with amount
        var processingText = document.getElementById('processingText');
        if (processingText) {
            processingText.textContent = 'Processing ₹' + amount.toLocaleString('en-IN') + '...';
        }
    }, 400);

    // Step 3: Simulate payment processing (2 seconds)
    setTimeout(function() {
        // Generate transaction ID
        var txnId = 'PF' + Date.now().toString().slice(-10);

        // Switch to success view
        document.getElementById('upiProcessingSection').classList.remove('active');
        document.getElementById('upiSuccessSection').classList.add('active');
        updatePaymentProgress(3);

        // Populate success details
        var successAmount = document.getElementById('upiSuccessAmount');
        var successDetail = document.getElementById('successDetail');
        var successTxnId = document.getElementById('successTxnId');

        if (successAmount) successAmount.textContent = '₹' + amount.toLocaleString('en-IN');
        if (successDetail) successDetail.textContent = 'Paid from ' + upiId;
        if (successTxnId) successTxnId.textContent = txnId;

        // Focus the success title for screen readers
        var successTitle = document.querySelector('.payment-success .success-title');
        if (successTitle) {
            successTitle.setAttribute('tabindex', '-1');
            successTitle.focus();
        }

        // Show toast notification
        showToast('Payment successful! ₹' + amount.toLocaleString('en-IN') + ' sent.', 'success');
    }, 2400);
}

/**
 * Updates the payment progress indicator steps.
 * @param {number} currentStep - The current step (1, 2, or 3)
 */
function updatePaymentProgress(currentStep) {
    for (var i = 1; i <= 3; i++) {
        var step = document.getElementById('progressStep' + i);
        var line = document.getElementById('progressLine' + i);
        if (!step) continue;

        step.classList.remove('active', 'completed');
        if (i < currentStep) {
            step.classList.add('completed');
            if (line) line.classList.add('completed');
        } else if (i === currentStep) {
            step.classList.add('active');
            if (line) line.classList.remove('completed');
        } else {
            if (line) line.classList.remove('completed');
        }
    }
}

/**
 * Downloads a payment receipt as a text file.
 * Called from the success state "Download Receipt" button.
 */
function downloadReceipt() {
    // Null-safety: elements may not exist if modal state changed
    var amountEl = document.getElementById('upiSuccessAmount');
    var detailEl = document.getElementById('successDetail');
    var txnIdEl = document.getElementById('successTxnId');

    var amount = amountEl ? amountEl.textContent : 'N/A';
    var detail = detailEl ? detailEl.textContent : 'PaisaFlow Payment';
    var txnId = txnIdEl ? txnIdEl.textContent : 'UNKNOWN';
    var date = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    var receiptContent = '================================\n' +
        '       PAYMENT RECEIPT\n' +
        '       PaisaFlow\n' +
        '================================\n\n' +
        'Transaction ID: ' + txnId + '\n' +
        'Date: ' + date + '\n' +
        'Amount: ' + amount + '\n' +
        'Status: SUCCESS\n' +
        detail + '\n\n' +
        '================================\n' +
        'Thank you for using PaisaFlow!\n' +
        'For support: support@paisaflow.in\n' +
        '================================\n';

    var blob = new Blob([receiptContent], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'PaisaFlow_Receipt_' + txnId + '.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Receipt downloaded!', 'success');
}

// ========== SIGNUP FORM ==========
/**
 * Processes the signup form submission.
 *
 * @param {Event} event - The form submit event
 */
function processSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signupName').value;
    const mobile = document.getElementById('signupMobile').value;
    const email = document.getElementById('signupEmail').value;
    const pin = document.getElementById('signupPin').value;
    const pinConfirm = document.getElementById('signupPinConfirm').value;

    if (!name || !mobile || !email || !pin || !pinConfirm) {
        showToast('Please fill in all fields.');
        return;
    }

    // Validate mobile number (10 digits, digits only)
    const mobileDigits = mobile.replace(/\D/g, '');
    if (mobileDigits.length !== 10 || !/^[6-9]/.test(mobileDigits)) {
        showToast('Please enter a valid 10-digit Indian mobile number.');
        return;
    }

    // Validate PIN: must be exactly 4 digits
    if (!/^[0-9]{4}$/.test(pin)) {
        showToast('PIN must be exactly 4 digits.');
        return;
    }

    // Validate PIN confirmation match
    if (pin !== pinConfirm) {
        showToast('PINs do not match. Please re-enter.');
        document.getElementById('signupPinConfirm').value = '';
        document.getElementById('signupPinConfirm').focus();
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#signupForm button[type="submit"]');
    setButtonLoading(submitBtn, 'Creating account...');

    setTimeout(function() {
        restoreButton(submitBtn);
        showToast('Account created successfully! Welcome, ' + name + ' (+91 ' + mobileDigits + ')');
        document.getElementById('signupForm').reset();
        closeSignupModal();
    }, 1500);
}

// ========== LOGIN FORM ==========
/**
 * Processes the login form submission.
 *
 * @param {Event} event - The form submit event
 */
function processLogin(event) {
    event.preventDefault();

    const mobile = document.getElementById('loginMobile').value;
    const pin = document.getElementById('loginPin').value;

    if (!mobile || !pin) {
        showToast('Please enter your mobile number and PIN.');
        return;
    }

    if (!/^[0-9]{4}$/.test(pin)) {
        showToast('PIN must be 4 digits.');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('#loginForm button[type="submit"]');
    setButtonLoading(submitBtn, 'Logging in...');

    setTimeout(function() {
        restoreButton(submitBtn);
        showToast('Login successful! Welcome back.');
        document.getElementById('loginForm').reset();
        closeLoginModal();
    }, 1500);
}

// ========== FAQ ACCORDION ==========
/**
 * Toggles FAQ item open/closed state.
 * Only one item can be open at a time (accordion behavior).
 *
 * @param {HTMLElement} button - The FAQ question button that was clicked
 */
function toggleFaq(button) {
    const faqItem = button.parentElement;
    const isActive = faqItem.classList.contains('active');

    // Close all FAQ items first
    const allFaqItems = document.querySelectorAll('.faq-item');
    allFaqItems.forEach(function(item) {
        item.classList.remove('active');
    });

    // Open clicked item if it wasn't already active
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

// ========== TOAST NOTIFICATIONS ==========

/** Holds the auto-hide timeout ID so we can clear it before showing a new toast */
let toastTimeoutId = null;

/**
 * Shows a toast notification at the bottom-right corner.
 * Auto-dismisses after 3 seconds (4s for error toasts).
 * Properly clears any pending toast timeout to prevent stacking issues.
 *
 * @param {string} message - The message to display in the toast
 * @param {string} [type='info'] - Toast variant: 'success', 'error', or 'info'
 */
function showToast(message, type) {
    var toast = document.getElementById('toast');
    var toastMessage = document.getElementById('toastMessage');

    if (toast && toastMessage) {
        // Clear any existing toast timeout to prevent premature dismissal
        if (toastTimeoutId !== null) {
            clearTimeout(toastTimeoutId);
            toastTimeoutId = null;
        }

        // Set message
        toastMessage.textContent = message;

        // Apply variant class
        toast.className = 'toast';
        if (type === 'success') {
            toast.classList.add('toast-success');
        } else if (type === 'error') {
            toast.classList.add('toast-error');
        } else {
            toast.classList.add('toast-info');
        }

        toast.classList.add('show');

        // Auto-hide: 4s for errors, 3s for others
        var duration = (type === 'error') ? 4000 : 3000;
        toastTimeoutId = setTimeout(function() {
            toast.classList.remove('show');
            toastTimeoutId = null;
        }, duration);
    }
}

// ========== SCROLL ANIMATIONS ==========
/**
 * Adds scroll-triggered animations to elements.
 * Uses Intersection Observer for performance.
 */
function initScrollAnimations() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
        return;
    }

    const observer = new IntersectionObserver(
        function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    // Observe feature cards for animation
    const animateElements = document.querySelectorAll(
        '.feature-card, .step, .pricing-card, .testimonial-card'
    );

    animateElements.forEach(function(el) {
        // Start hidden, will be revealed on scroll
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ========== DARK MODE TOGGLE ==========
/**
 * Initializes dark mode toggle functionality.
 * Reads preference from localStorage, sets initial theme,
 * and handles toggle button click to switch between light/dark.
 */
function initDarkMode() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;

    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem('paisaflow_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    // Apply initial theme
    if (initialTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        html.removeAttribute('data-theme');
        if (themeIcon) themeIcon.textContent = '🌙';
    }

    // Toggle on click
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const isDark = html.getAttribute('data-theme') === 'dark';
            if (isDark) {
                html.removeAttribute('data-theme');
                localStorage.setItem('paisaflow_theme', 'light');
                if (themeIcon) themeIcon.textContent = '🌙';
            } else {
                html.setAttribute('data-theme', 'dark');
                localStorage.setItem('paisaflow_theme', 'dark');
                if (themeIcon) themeIcon.textContent = '☀️';
            }
        });
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        if (!localStorage.getItem('paisaflow_theme')) {
            if (e.matches) {
                html.setAttribute('data-theme', 'dark');
                if (themeIcon) themeIcon.textContent = '☀️';
            } else {
                html.removeAttribute('data-theme');
                if (themeIcon) themeIcon.textContent = '🌙';
            }
        }
    });
}

// ========== ANIMATED NUMBER COUNTERS ==========
/**
 * Animates hero stat numbers from 0 to their target values.
 * Uses Intersection Observer to trigger animation when stats enter viewport.
 * Respects prefers-reduced-motion preference.
 */
function initAnimatedCounters() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    if (statNumbers.length === 0) return;

    const counterObserver = new IntersectionObserver(
        function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    statNumbers.forEach(function(el) {
        counterObserver.observe(el);
    });
}

/**
 * Animates a single counter element from 0 to its data-target value.
 * Parses the data-target attribute to determine the final number and suffix.
 *
 * @param {HTMLElement} el - The .stat-number element to animate
 */
function animateCounter(el) {
    const targetStr = el.getAttribute('data-target');
    if (!targetStr) return;

    // Parse the target: extract numeric part and suffix
    // Supports formats: "10M+", "₹500Cr+", "4.7★", "99%", "1000"
    const match = targetStr.match(/^([^0-9]*)([0-9.]+)(.*)$/);
    if (!match) return;

    const prefix = match[1] || '';
    const targetNum = parseFloat(match[2]);
    const suffix = match[3] || '';
    const duration = 2000; // 2 seconds
    const startTime = performance.now();

    /**
     * Easing function: ease-out cubic for smooth deceleration.
     * @param {number} t - Current time progress (0 to 1)
     * @returns {number} Eased value (0 to 1)
     */
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Animation loop using requestAnimationFrame.
     * Calculates elapsed time, applies easing, updates text.
     *
     * @param {number} currentTime - Current timestamp from rAF
     */
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);
        const currentNum = targetNum * easedProgress;

        // Format the number based on magnitude
        let displayNum;
        if (targetNum >= 100) {
            displayNum = Math.round(currentNum).toLocaleString('en-IN');
        } else {
            displayNum = currentNum.toFixed(1);
        }

        el.textContent = prefix + displayNum + suffix;

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            // Ensure final value is exact
            el.textContent = targetStr;
        }
    }

    requestAnimationFrame(updateCounter);
}

// ========== LIVE TRANSACTION FEED ==========
/**
 * Generates and animates a live transaction feed in the hero section.
 * Simulates real-time UPI transactions from Indian users for social proof.
 * Adds a new transaction every 3-5 seconds with slide-in animation.
 */

/** Indian names for transaction senders */
const TXN_NAMES = [
    'Priya S.', 'Rahul K.', 'Anita G.', 'Vikram P.', 'Sneha M.',
    'Amit R.', 'Deepa N.', 'Rajesh S.', 'Kavita P.', 'Suresh K.',
    'Meera R.', 'Arjun S.', 'Pooja M.', 'Kiran D.', 'Neha G.',
    'Sanjay V.', 'Anjali T.', 'Ravi P.', 'Divya S.', 'Manish K.',
    'Shweta R.', 'Gaurav S.', 'Ishita A.', 'Nikhil R.', 'Tanvi M.'
];

/**avatar background colors for transaction senders */
const TXN_COLORS = [
    '#6C5CE7', '#00D2D3', '#FF6B6B', '#FDCB6E', '#00B894',
    '#E17055', '#0984E3', '#6C5CE7', '#00CEC9', '#E84393',
    '#6C5CE7', '#00D2D3', '#FF6B6B', '#FDCB6E', '#00B894'
];

/** Transaction description templates */
const TXN_ACTIONS = ['paid via UPI', 'sent money', 'paid bill', 'recharged phone', 'paid at store', 'sent to friend'];

/**
 * Generates a random Indian-sounding name with initial.
 * @returns {string} Random name like "Priya S."
 */
function getRandomName() {
    return TXN_NAMES[Math.floor(Math.random() * TXN_NAMES.length)];
}

/**
 * Generates a random transaction amount between ₹50 and ₹15,000.
 * Uses realistic distribution: skewed towards smaller amounts.
 * @returns {number} Amount in rupees
 */
function getRandomAmount() {
    // Skewed distribution: 60% under ₹500, 30% ₹500-2000, 10% ₹2000+
    const rand = Math.random();
    if (rand < 0.6) {
        return Math.floor(50 + Math.random() * 450);
    } else if (rand < 0.9) {
        return Math.floor(500 + Math.random() * 1500);
    } else {
        return Math.floor(2000 + Math.random() * 13000);
    }
}

/**
 * Formats amount with Indian comma separators (e.g., "₹1,250").
 * @param {number} amount
 * @returns {string}
 */
function formatIndianAmount(amount) {
    return '₹' + amount.toLocaleString('en-IN');
}

/**
 * Creates a transaction DOM element and prepends it to the feed.
 * Animates the new item sliding in, removes oldest if > 5 items.
 */
function addTransaction() {
    const list = document.getElementById('liveTxnList');
    if (!list) return;

    const name = getRandomName();
    const amount = getRandomAmount();
    const action = TXN_ACTIONS[Math.floor(Math.random() * TXN_ACTIONS.length)];
    const colorIndex = Math.floor(Math.random() * TXN_COLORS.length);
    const initials = name.split(' ').map(n => n[0]).join('');

    // Create transaction item
    const item = document.createElement('div');
    item.className = 'live-txn-item';
    item.setAttribute('role', 'listitem');
    item.innerHTML =
        '<span class="live-txn-avatar" style="background:' + TXN_COLORS[colorIndex] + ';" aria-hidden="true">' + initials + '</span>' +
        '<span class="live-txn-info">' +
            '<span class="live-txn-name">' + name + '</span>' +
            '<span class="live-txn-detail">' + action + '</span>' +
        '</span>' +
        '<span class="live-txn-amount">' + formatIndianAmount(amount) + '</span>';

    // Prepend (newest first)
    list.insertBefore(item, list.firstChild);

    // Keep max 5 items in DOM (3 visible + 2 buffer for animation)
    while (list.children.length > 5) {
        list.removeChild(list.lastChild);
    }

    // Schedule removal of the animation class
    setTimeout(function() {
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
    }, 500);
}

/**
 * Initializes the live transaction feed.
 * Populates initial transactions, then adds new ones every 3-5 seconds.
 */
function initLiveTransactionFeed() {
    const feed = document.getElementById('liveTxnFeed');
    if (!feed) return;

    // Add initial 3 transactions with staggered timing
    setTimeout(function() { addTransaction(); }, 800);
    setTimeout(function() { addTransaction(); }, 1600);
    setTimeout(function() { addTransaction(); }, 2400);

    // Then add a new transaction every 3-5 seconds (randomized)
    function scheduleNext() {
        const delay = 3000 + Math.random() * 2000; // 3-5 seconds
        setTimeout(function() {
            addTransaction();
            scheduleNext();
        }, delay);
    }
    scheduleNext();
}

// ========== DASHBOARD FUNCTIONS ==========

/**
 * Initializes the dashboard section including notifications, charts, and transactions.
 * Called on DOMContentLoaded.
 */
function initDashboard() {
    initDashboardDate();
    initNotifications();
    initDonutChart();
    initBarChart();
    initTransactions();
}

/**
 * Sets the current date in the dashboard greeting.
 */
function initDashboardDate() {
    const dateEl = document.getElementById('dashboardDate');
    if (!dateEl) return;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-IN', options);
}

/**
 * Initializes notification panel toggle and dismiss functionality.
 */
function initNotifications() {
    const btn = document.getElementById('notificationBtn');
    const panel = document.getElementById('notificationPanel');
    const clearBtn = document.getElementById('clearAllNotifications');
    const badge = document.getElementById('notificationBadge');

    if (!btn || !panel) return;

    // Toggle panel visibility
    btn.addEventListener('click', function() {
        const isActive = panel.classList.contains('active');
        if (isActive) {
            panel.classList.remove('active');
        } else {
            panel.classList.add('active');
        }
    });

    // Close panel when clicking outside
    document.addEventListener('click', function(event) {
        if (!btn.contains(event.target) && !panel.contains(event.target)) {
            panel.classList.remove('active');
        }
    });

    // Dismiss individual notifications
    const dismissBtns = panel.querySelectorAll('.notification-dismiss');
    dismissBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const item = btn.closest('.notification-item');
            if (item) {
                item.style.opacity = '0';
                item.style.transform = 'translateX(20px)';
                item.style.transition = 'all 0.3s ease';
                setTimeout(function() {
                    item.remove();
                    updateNotificationBadge();
                }, 300);
            }
        });
    });

    // Clear all notifications
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            const items = panel.querySelectorAll('.notification-item');
            items.forEach(function(item, index) {
                setTimeout(function() {
                    item.style.opacity = '0';
                    setTimeout(function() { item.remove(); }, 300);
                }, index * 100);
            });
            setTimeout(function() {
                updateNotificationBadge();
            }, items.length * 100 + 300);
        });
    }

    /**
     * Updates the notification badge count based on remaining items.
     */
    function updateNotificationBadge() {
        const remaining = panel.querySelectorAll('.notification-item').length;
        if (badge) {
            badge.textContent = remaining;
            badge.style.display = remaining > 0 ? 'flex' : 'none';
        }
    }
}

/**
 * Renders an SVG donut chart showing spending by category.
 * Uses pure SVG with calculated arc paths.
 */
function initDonutChart() {
    const container = document.getElementById('donutChart');
    if (!container) return;

    // Category data for the donut chart
    const data = [
        { label: 'Dining', value: 4800, color: '#FF6B6B' },
        { label: 'Shopping', value: 8200, color: '#6C5CE7' },
        { label: 'Transport', value: 3500, color: '#00D2D3' },
        { label: 'Bills', value: 6800, color: '#FDCB6E' },
        { label: 'Entertainment', value: 1150, color: '#00B894' },
        { label: 'Others', value: 4000, color: '#A29BFE' }
    ];

    const total = data.reduce(function(sum, d) { return sum + d.value; }, 0);
    const size = 200;
    const radius = 70;
    const cx = size / 2;
    const cy = size / 2;
    const strokeWidth = 28;

    // Build SVG content
    let svgContent = '';
    let currentAngle = 0;

    data.forEach(function(segment, index) {
        const percentage = segment.value / total;
        const angle = percentage * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        // Convert to radians
        const startRad = (startAngle - 90) * Math.PI / 180;
        const endRad = (endAngle - 90) * Math.PI / 180;

        // Calculate path coordinates
        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        // Large arc flag for segments > 180 degrees
        const largeArc = angle > 180 ? 1 : 0;

        // Create SVG arc path
        const pathData = 'M ' + x1 + ' ' + y1 + ' A ' + radius + ' ' + radius + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2;

        svgContent += '<path d="' + pathData + '" fill="none" stroke="' + segment.color + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" opacity="0.9"/>';

        currentAngle = endAngle;
    });

    container.innerHTML = '<svg viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Spending by category donut chart">' + svgContent + '</svg>';

    // Render legend
    const legendContainer = document.getElementById('donutLegend');
    if (legendContainer) {
        let legendHtml = '';
        data.forEach(function(segment) {
            const percentage = Math.round((segment.value / total) * 100);
            legendHtml += '<div class="legend-item"><span class="legend-color" style="background:' + segment.color + '"></span>' + segment.label + ' (' + percentage + '%)</div>';
        });
        legendContainer.innerHTML = legendHtml;
    }
}

/**
 * Renders a bar chart showing weekly spending.
 * Uses CSS-styled div bars with animated heights.
 */
function initBarChart() {
    const container = document.getElementById('barChart');
    const labelsContainer = document.getElementById('barChartLabels');
    if (!container) return;

    // Weekly spending data
    const data = [
        { label: 'Mon', value: 2800, day: 'Monday' },
        { label: 'Tue', value: 4200, day: 'Tuesday' },
        { label: 'Wed', value: 1900, day: 'Wednesday' },
        { label: 'Thu', value: 5600, day: 'Thursday' },
        { label: 'Fri', value: 3800, day: 'Friday' },
        { label: 'Sat', value: 7200, day: 'Saturday' },
        { label: 'Sun', value: 3100, day: 'Sunday' }
    ];

    const maxValue = Math.max.apply(null, data.map(function(d) { return d.value; }));
    const chartHeight = 180;

    let barsHtml = '';
    let labelsHtml = '';

    data.forEach(function(bar, index) {
        const heightPercent = (bar.value / maxValue) * 100;
        const barHeight = Math.max((heightPercent / 100) * (chartHeight - 30), 8);

        barsHtml += '<div class="bar-chart-bar-wrapper">';
        barsHtml += '<div class="bar-chart-bar" style="height: 0; background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-secondary) 100%);" data-height="' + barHeight + '" title="' + bar.day + ': &#8377;' + bar.value.toLocaleString('en-IN') + '">';
        barsHtml += '<span class="bar-chart-bar-value">&#8377;' + (bar.value / 1000).toFixed(1) + 'k</span>';
        barsHtml += '</div>';
        barsHtml += '</div>';

        labelsHtml += '<span class="bar-chart-label">' + bar.label + '</span>';
    });

    container.innerHTML = barsHtml;
    if (labelsContainer) {
        labelsContainer.innerHTML = labelsHtml;
    }

    // Animate bars on scroll into view
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const bars = entry.target.querySelectorAll('.bar-chart-bar');
                    bars.forEach(function(bar, index) {
                        setTimeout(function() {
                            bar.style.height = bar.getAttribute('data-height') + 'px';
                        }, index * 100);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        observer.observe(container);
    } else {
        // Fallback: animate immediately
        const bars = container.querySelectorAll('.bar-chart-bar');
        bars.forEach(function(bar) {
            bar.style.height = bar.getAttribute('data-height') + 'px';
        });
    }
}

/**
 * Renders the transaction history table with search, filter, and pagination.
 */
function initTransactions() {
    const tbody = document.getElementById('transactionTableBody');
    const searchInput = document.getElementById('transactionSearch');
    const filterSelect = document.getElementById('transactionFilter');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const paginationInfo = document.getElementById('paginationInfo');

    if (!tbody) return;

    // Sample transaction data
    const transactions = [
        { date: '2026-06-21', desc: 'UPI Payment to Priya Sharma', category: 'transfer', type: 'debit', amount: 1200, status: 'success' },
        { date: '2026-06-20', desc: 'Swiggy Order - Dinner', category: 'food', type: 'debit', amount: 485, status: 'success' },
        { date: '2026-06-20', desc: 'Salary Credit - June', category: 'transfer', type: 'credit', amount: 45000, status: 'success' },
        { date: '2026-06-19', desc: 'Amazon Purchase - Electronics', category: 'shopping', type: 'debit', amount: 3299, status: 'success' },
        { date: '2026-06-19', desc: 'Uber Ride - Airport', category: 'transport', type: 'debit', amount: 750, status: 'success' },
        { date: '2026-06-18', desc: 'Electricity Bill - MSEB', category: 'bills', type: 'debit', amount: 1850, status: 'success' },
        { date: '2026-06-18', desc: 'Netflix Subscription', category: 'entertainment', type: 'debit', amount: 649, status: 'success' },
        { date: '2026-06-17', desc: 'Zomato Order - Lunch', category: 'food', type: 'debit', amount: 320, status: 'pending' },
        { date: '2026-06-17', desc: 'Freelance Payment Received', category: 'transfer', type: 'credit', amount: 8500, status: 'success' },
        { date: '2026-06-16', desc: 'Petrol Pump - HP Fuel', category: 'transport', type: 'debit', amount: 2200, status: 'success' },
        { date: '2026-06-16', desc: 'Flipkart - Mobile Cover', category: 'shopping', type: 'debit', amount: 599, status: 'success' },
        { date: '2026-06-15', desc: 'Airtel Recharge - Data', category: 'bills', type: 'debit', amount: 299, status: 'success' },
        { date: '2026-06-15', desc: 'Movie PVR - Weekend', category: 'entertainment', type: 'debit', amount: 500, status: 'success' },
        { date: '2026-06-14', desc: 'Grocery - BigBasket', category: 'food', type: 'debit', amount: 1850, status: 'success' },
        { date: '2026-06-14', desc: 'Cashback Credited', category: 'transfer', type: 'credit', amount: 45, status: 'success' },
        { date: '2026-06-13', desc: 'Ola Ride - Office', category: 'transport', type: 'debit', amount: 320, status: 'success' },
        { date: '2026-06-13', desc: 'Myntra - Clothing', category: 'shopping', type: 'debit', amount: 2499, status: 'pending' },
        { date: '2026-06-12', desc: 'Water Bill - Corporation', category: 'bills', type: 'debit', amount: 650, status: 'success' },
        { date: '2026-06-12', desc: 'Spotify Premium', category: 'entertainment', type: 'debit', amount: 119, status: 'success' },
        { date: '2026-06-11', desc: 'UPI Payment to Rahul', category: 'transfer', type: 'debit', amount: 2500, status: 'success' },
        { date: '2026-06-11', desc: 'Dominos Pizza', category: 'food', type: 'debit', amount: 899, status: 'success' },
        { date: '2026-06-10', desc: 'Bonus Received', category: 'transfer', type: 'credit', amount: 5000, status: 'success' },
        { date: '2026-06-10', desc: 'Metro Card Recharge', category: 'transport', type: 'debit', amount: 500, status: 'success' },
        { date: '2026-06-09', desc: 'Amazon - Books', category: 'shopping', type: 'debit', amount: 1299, status: 'success' },
        { date: '2026-06-09', desc: 'Gas Bill - Indane', category: 'bills', type: 'debit', amount: 980, status: 'success' }
    ];

    let currentPage = 1;
    const itemsPerPage = 8;
    let filteredData = transactions.slice();

    /**
     * Category display name mapping.
     */
    function getCategoryLabel(cat) {
        var labels = {
            food: 'Food & Dining',
            shopping: 'Shopping',
            transport: 'Transport',
            bills: 'Bills',
            entertainment: 'Entertainment',
            transfer: 'Transfer'
        };
        return labels[cat] || cat;
    }

    /**
     * Renders the current page of transactions.
     * Shows an empty state message when no transactions match the current filter.
     */
    function renderTransactions() {
        var totalPages = Math.max(Math.ceil(filteredData.length / itemsPerPage), 1);

        // Clamp currentPage to valid range
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        var start = (currentPage - 1) * itemsPerPage;
        var end = start + itemsPerPage;
        var pageData = filteredData.slice(start, end);

        // Empty state: no transactions match the filter
        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="txn-empty-state">' +
                '<span class="txn-empty-icon">&#128269;</span>' +
                '<span class="txn-empty-text">No transactions found matching your search.</span>' +
                '<span class="txn-empty-hint">Try adjusting your search or filter criteria.</span>' +
                '</td></tr>';
            if (paginationInfo) paginationInfo.textContent = 'No results';
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
            return;
        }

        var html = '';
        pageData.forEach(function(txn) {
            var amountClass = txn.type === 'credit' ? 'amount-credit' : 'amount-debit';
            var amountPrefix = txn.type === 'credit' ? '+' : '-';
            var statusClass = txn.status === 'success' ? 'status-success' : 'status-pending';
            var statusLabel = txn.status === 'success' ? 'Completed' : 'Pending';

            html += '<tr>';
            html += '<td>' + txn.date + '</td>';
            html += '<td>' + txn.desc + '</td>';
            html += '<td><span class="category-tag">' + getCategoryLabel(txn.category) + '</span></td>';
            html += '<td>' + txn.type.charAt(0).toUpperCase() + txn.type.slice(1) + '</td>';
            html += '<td class="amount ' + amountClass + '">' + amountPrefix + '&#8377;' + txn.amount.toLocaleString('en-IN') + '</td>';
            html += '<td><span class="status ' + statusClass + '">' + statusLabel + '</span></td>';
            html += '</tr>';
        });

        tbody.innerHTML = html;

        // Update pagination info
        if (paginationInfo) {
            paginationInfo.textContent = 'Page ' + currentPage + ' of ' + totalPages;
        }
        if (prevBtn) prevBtn.disabled = currentPage === 1;
        if (nextBtn) nextBtn.disabled = currentPage === totalPages;
    }

    /**
     * Filters transaction data based on search query and category filter.
     */
    function filterTransactions() {
        var query = searchInput ? searchInput.value.toLowerCase() : '';
        var category = filterSelect ? filterSelect.value : 'all';

        filteredData = transactions.filter(function(txn) {
            var matchesSearch = !query || txn.desc.toLowerCase().includes(query);
            var matchesCategory = category === 'all' || txn.category === category;
            return matchesSearch && matchesCategory;
        });

        currentPage = 1;
        renderTransactions();
    }

    // Event listeners
    if (searchInput) {
        searchInput.addEventListener('input', filterTransactions);
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterTransactions);
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderTransactions();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            var totalPages = Math.ceil(filteredData.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderTransactions();
            }
        });
    }

    // Initial render
    renderTransactions();
}


// ========== RESOURCE TABS ==========
/**
 * Initializes resource category tab filtering.
 * Clicking a tab filters the resource cards to show only matching categories.
 */
function initResourceTabs() {
    var tabs = document.querySelectorAll('.resource-tab');
    var grid = document.getElementById('resourcesGrid');
    if (!tabs.length || !grid) return;

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            // Update active tab
            tabs.forEach(function(t) {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');

            // Filter cards
            var selectedCategory = tab.getAttribute('data-tab');
            var cards = grid.querySelectorAll('.resource-card');
            cards.forEach(function(card) {
                var cardCategories = card.getAttribute('data-category') || '';
                if (selectedCategory === 'all' || cardCategories.includes(selectedCategory)) {
                    card.style.display = '';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    setTimeout(function() {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    }, 50);
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/**
 * Wires up click handlers on resource cards to open the article detail modal.
 * Adds cursor-pointer style and keyboard support (Enter/Space) for accessibility.
 */
function initResourceCardClicks() {
    var cards = document.querySelectorAll('.resource-card');
    cards.forEach(function(card) {
        var articleId = card.getAttribute('data-id');
        if (!articleId) return;

        // Make cards look clickable
        card.style.cursor = 'pointer';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', 'Read article: ' + card.querySelector('.resource-card-title').textContent);

        // Click handler
        card.addEventListener('click', function(e) {
            // Don't open modal if a button inside the card was clicked
            if (e.target.closest('button')) return;
            openArticleModal(articleId);
        });

        // Keyboard handler for accessibility
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openArticleModal(articleId);
            }
        });
    });
}

// ========== LOAD MORE ARTICLES ==========
/** Tracks which article IDs have already been rendered in the DOM. */
var renderedArticleIds = [1, 2, 3, 4, 5, 6]; // Initially rendered in HTML

/** Category background color mapping for dynamically-added cards. */
var CATEGORY_BG_CLASSES = {
    'UPI Guide': 'upi-bg',
    'Personal Finance': 'finance-bg',
    'For Business': 'business-bg'
};

/**
 * Creates a resource card DOM element from article data.
 * Mirrors the HTML structure of existing static resource cards.
 * @param {Object} data - Article data from ARTICLE_DATA
 * @param {string|number} articleId - The article ID
 * @returns {HTMLElement} The constructed resource-card element
 */
function createArticleCard(data, articleId) {
    var card = document.createElement('article');
    card.className = 'resource-card';
    card.setAttribute('data-category', getArticleCategorySlug(data.category));
    card.setAttribute('data-id', articleId);

    var bgClass = CATEGORY_BG_CLASSES[data.category] || 'upi-bg';

    card.innerHTML =
        '<div class="resource-card-image">' +
            '<div class="resource-card-image-placeholder ' + bgClass + '">' +
                '<span class="resource-card-emoji">' + data.emoji + '</span>' +
            '</div>' +
            '<span class="resource-card-category">' + data.category + '</span>' +
        '</div>' +
        '<div class="resource-card-content">' +
            '<h3 class="resource-card-title">' + data.title + '</h3>' +
            '<p class="resource-card-excerpt">' + getExcerpt(data.content) + '</p>' +
            '<div class="resource-card-meta">' +
                '<span class="resource-card-date">' + data.date + '</span>' +
                '<span class="resource-card-read">' + data.readTime + '</span>' +
            '</div>' +
        '</div>';

    return card;
}

/**
 * Generates a slug-style category string for data-category attribute.
 * e.g., "UPI Guide" -> "upi", "Personal Finance" -> "finance", "For Business" -> "business"
 * @param {string} category
 * @returns {string}
 */
function getArticleCategorySlug(category) {
    if (category === 'UPI Guide') return 'upi';
    if (category === 'Personal Finance') return 'finance';
    if (category === 'For Business') return 'business';
    return category.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Strips HTML tags and returns a plain-text excerpt (first ~120 chars).
 * @param {string} htmlContent
 * @returns {string}
 */
function getExcerpt(htmlContent) {
    var tmp = document.createElement('div');
    tmp.innerHTML = htmlContent;
    var text = tmp.textContent || tmp.innerText || '';
    text = text.replace(/\s+/g, ' ').trim();
    return text.length > 120 ? text.slice(0, 117) + '...' : text;
}

/**
 * Initializes the "Load More Articles" button.
 * On click, loads the next batch of 3 articles from ARTICLE_DATA.
 * Hides the button when all articles have been loaded.
 */
function initLoadMoreArticles() {
    var btn = document.getElementById('loadMoreArticles');
    var grid = document.getElementById('resourcesGrid');
    if (!btn || !grid) return;

    btn.addEventListener('click', function() {
        // Get all article IDs that haven't been rendered yet
        var allIds = Object.keys(ARTICLE_DATA).map(function(id) { return parseInt(id, 10); });
        var unrendered = allIds.filter(function(id) {
            return renderedArticleIds.indexOf(id) === -1;
        });

        if (unrendered.length === 0) {
            btn.textContent = 'No More Articles';
            btn.disabled = true;
            btn.classList.add('btn-disabled');
            return;
        }

        // Load next 3 articles (or remaining)
        var toLoad = unrendered.slice(0, 3);
        var fragment = document.createDocumentFragment();

        toLoad.forEach(function(id) {
            var data = ARTICLE_DATA[id];
            if (!data) return;

            var card = createArticleCard(data, id);
            // Start hidden for animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            fragment.appendChild(card);
            renderedArticleIds.push(id);
        });

        grid.appendChild(fragment);

        // Animate cards in with staggered delay
        var newCards = grid.querySelectorAll('.resource-card');
        var animatedCount = 0;
        newCards.forEach(function(card) {
            var cardId = parseInt(card.getAttribute('data-id'), 10);
            if (toLoad.indexOf(cardId) !== -1) {
                (function(c, delay) {
                    setTimeout(function() {
                        c.style.opacity = '1';
                        c.style.transform = 'translateY(0)';
                    }, delay);
                })(card, 100 + animatedCount * 150);
                animatedCount++;
            }
        });

        // Re-bind click handlers for new cards
        initResourceCardClicks();

        // Check if all articles are now loaded
        var remaining = allIds.filter(function(id) {
            return renderedArticleIds.indexOf(id) === -1;
        });
        if (remaining.length === 0) {
            btn.textContent = 'All Articles Loaded ✓';
            btn.disabled = true;
            btn.classList.add('btn-disabled');
            showToast('All articles loaded!', 'success');
        } else {
            btn.innerHTML = 'Load More Articles <span class="btn-icon">&#8595;</span>';
        }
    });
}
/**
 * Full article content for resource cards.
 * Each article has a title, category, date, read time, and full HTML content.
 * In production, this would come from a CMS or API.
 */
var ARTICLE_DATA = {
    1: {
        title: "Complete Guide to UPI Payments in India (2026)",
        category: "UPI Guide",
        date: "June 15, 2026",
        readTime: "5 min read",
        emoji: "🔗",
        content: "<p>Unified Payments Interface (UPI) has revolutionized digital payments in India, processing over 12 billion transactions per month. This comprehensive guide covers everything you need to know about using UPI safely and effectively in 2026.</p><h3>What is UPI?</h3><p>UPI is a real-time payment system developed by the National Payments Corporation of India (NPCI). It allows instant fund transfers between bank accounts using a virtual payment address (VPA) — no need to share bank details.</p><h3>How UPI Works</h3><p>When you send money via UPI, the system uses your VPA (like yourname@upi) to identify the recipient. The transaction is processed through the IMPS (Immediate Payment Service) infrastructure, ensuring settlement in under 30 seconds.</p><h3>UPI Transaction Limits</h3><p>As of 2026, the per-transaction limit is ₹1,00,000 for most users. Some banks allow up to ₹2,00,000 for specific merchant transactions. The daily limit varies by bank but is typically ₹1,00,000 to ₹5,00,000.</p><h3>Security Best Practices</h3><ul><li>Never share your UPI PIN with anyone</li><li>Enable biometric authentication for added security</li<li>Verify the recipient's name before confirming payment</li><li>Set up transaction alerts with your bank</li><li>Avoid using public Wi-Fi for UPI transactions</li></ul><h3>UPI Apps Comparison</h3><p>Major UPI apps include Google Pay, PhonePe, Paytm, and BHIM. Each offers unique features like cashback, bill payments, and merchant tools. PaisaFlow works with all UPI apps, giving you flexibility in how you send and receive money.</p>"
    },
    2: {
        title: "10 Smart Budgeting Tips for Young Indians",
        category: "Personal Finance",
        date: "June 10, 2026",
        readTime: "7 min read",
        emoji: "💰",
        content: "<p>Starting your financial journey early is the single biggest advantage you can give yourself. These 10 budgeting tips are specifically tailored for young Indians in their 20s and 30s who want to build wealth while enjoying life.</p><h3>1. Follow the 50/30/20 Rule</h3><p>Allocate 50% of your income to needs (rent, groceries, bills), 30% to wants (entertainment, dining out), and 20% to savings and investments. Adjust these percentages based on your city and lifestyle.</p><h3>2. Automate Your Savings</h3><p>Set up automatic transfers to your savings account on salary day. Even ₹2,000/month invested in a mutual fund SIP can grow to over ₹5 lakhs in 10 years.</p><h3>3. Track Every Rupee</h3><p>Use PaisaFlow's expense tracking feature to automatically categorize your spending. You'll be surprised where your money goes — most people underestimate their food delivery expenses by 40%.</p><h3>4. Build an Emergency Fund</h3><p>Before investing, save 3-6 months of expenses in a liquid fund. This is your safety net for medical emergencies, job loss, or unexpected expenses.</p><h3>5. Start Investing Early</h3><p>Thanks to compound interest, starting at 25 instead of 35 can double your retirement corpus. Even small SIPs of ₹1,000-2,000/month in index funds can create significant wealth over 20-30 years.</p>"
    },
    3: {
        title: "How Small Businesses Can Go Digital with UPI",
        category: "For Business",
        date: "June 5, 2026",
        readTime: "6 min read",
        emoji: "💼",
        content: "<p>India's small business sector is undergoing a digital transformation. With UPI transactions crossing 12 billion monthly, customers increasingly prefer digital payments. Here's how small businesses can leverage UPI to grow.</p><h3>Why Go Digital?</h3><p>Digital payments reduce cash handling costs, eliminate counterfeit currency risk, and provide automatic bookkeeping. Studies show that businesses accepting digital payments see 20-30% higher customer retention.</p><h3>Setting Up UPI for Your Business</h3><ol><li>Open a current account with any bank</li><li>Register for a UPI business ID (e.g., yourbusiness@hdfcbank)</li><li>Generate a QR code and display it at your counter</li><li>Consider a soundbox for instant payment confirmation</li></ol><h3>PaisaFlow for Merchants</h3><p>PaisaFlow offers a complete payment solution for merchants: dynamic QR codes, payment soundbox integration, GST-compliant invoicing, and real-time transaction dashboard. Setup takes under 15 minutes.</p><h3>Best Practices</h3><ul><li>Always verify payment on your app before delivering goods</li><li>Keep your soundbox charged and connected</li><li>Reconcile transactions daily using the dashboard</li><li>Offer small discounts for digital payments to encourage adoption</li></ul>"
    },
    4: {
        title: "UPI Safety: How to Protect Yourself from Fraud",
        category: "UPI Guide",
        date: "May 28, 2026",
        readTime: "4 min read",
        emoji: "🔒",
        content: "<p>As UPI adoption grows, so do fraud attempts. Understanding common scams and following security best practices can keep your money safe.</p><h3>Common UPI Scams</h3><p><strong>Fake UPI IDs:</strong> Scammers create UPI IDs that mimic official handles. Always verify the name shown by your bank before confirming.</p><p><strong>Screen Sharing Scams:</strong> Fraudsters pose as bank officials and ask you to share your screen. Never share your screen or share OTPs with anyone.</p><p><strong>Collect Request Scams:</strong> Someone sends a 'collect request' claiming you owe money. Remember: accepting a collect request sends money FROM your account.</p><h3>Protective Measures</h3><ul><li>Enable app lock and biometric authentication</li><li>Set transaction limits appropriate to your usage</li><li>Never click links in SMS or WhatsApp messages claiming to be from your bank</li><li>Report suspicious transactions immediately to your bank and on the NPCI app</li></ul>"
    },
    5: {
        title: "Tax Saving Tips for Freelancers Using Digital Payments",
        category: "Personal Finance",
        date: "May 20, 2026",
        readTime: "8 min read",
        emoji: "📈",
        content: "<p>Freelancers face unique tax challenges — no TDS, irregular income, and multiple clients. Digital payment tools like PaisaFlow can simplify your tax planning significantly.</p><h3>Track All Income</h3><p>Every payment you receive is taxable income. Use PaisaFlow's dashboard to export a complete transaction history at tax time. This eliminates the stress of reconstructing income from multiple sources.</p><h3>Claim Legitimate Deductions</h3><p>Freelancers can claim deductions for: internet and phone bills (business portion), co-working space rent, software subscriptions, laptop depreciation, and professional development courses.</p><h3>Pay Advance Tax</h3><p>If your tax liability exceeds ₹10,000/year, you must pay advance tax quarterly. Missing deadlines attracts 1% per month interest under Section 234C.</p><h3>Keep Digital Records</h3><p>The Income Tax Department increasingly accepts digital records. Maintain digital copies of invoices, receipts, and bank statements for at least 6 years.</p>"
    },
    6: {
        title: "GST Invoicing Made Easy for Indian Merchants",
        category: "For Business",
        date: "May 12, 2026",
        readTime: "5 min read",
        emoji: "📋",
        content: "<p>GST compliance can be overwhelming for small merchants. PaisaFlow's built-in invoicing feature makes GST-compliant billing simple, fast, and error-free.</p><h3>What Makes an Invoice GST-Compliant?</h3><p>A valid GST invoice must include: supplier's GSTIN, invoice number (sequential), HSN/SAC code, taxable value, GST rate (CGST+SGST or IGST), and place of supply.</p><h3>PaisaFlow Invoicing Features</h3><ul><li>Auto-generates sequential invoice numbers</li><li>Built-in HSN code lookup for common goods and services</li><li>Automatic GST calculation (split into CGST/SGST or IGST)</li><li>Professional invoice templates with your business logo</li><li>PDF download and WhatsApp sharing</li><li>Monthly summary for GSTR-1 filing</li></ul><h3>Getting Started</h3><p>Simply add your business GSTIN in the PaisaFlow dashboard, select your business category, and start creating invoices. The system remembers your most-used items for faster billing.</p>"
    },
    7: {
        title: "Understanding UPI Lite: Small Payments Made Simpler",
        category: "UPI Guide",
        date: "April 30, 2026",
        readTime: "4 min read",
        emoji: "⚡",
        content: "<p>UPI Lite is NPCI's solution for small-value transactions that don't require PIN authentication for every payment. It's perfect for quick purchases under ₹500.</p><h3>How UPI Lite Works</h3><p>UPI Lite creates an 'on-device wallet' linked to your bank account. You load up to ₹2,000 into this wallet, and payments under ₹500 are processed instantly without entering your PIN.</p><h3>Benefits of UPI Lite</h3><ul><li>Instant payments under ₹500 — no PIN required</li><li>Reduces bank server load, improving success rates</li><li>Works offline in areas with poor connectivity</li><li>Perfect for auto-rickshaws, tea stalls, and small vendors</li></ul><h3>How to Enable UPI Lite on PaisaFlow</h3><p>Go to Settings → UPI Lite → Enable. Load money from your linked bank account (min ₹100, max ₹2,000). Once enabled, small payments are automatically routed through UPI Lite.</p>"
    },
    8: {
        title: "Building Credit Score with Digital Payments",
        category: "Personal Finance",
        date: "April 22, 2026",
        readTime: "6 min read",
        emoji: "🏦",
        content: "<p>Your digital payment history can now help build your credit score. Since 2025, RBI has allowed UPI transaction data to be included in credit bureau reports. Here's how to leverage this.</p><h3>Why Credit Score Matters</h3><p>A good credit score (750+) helps you get lower interest rates on home loans, car loans, and credit cards. It can save you lakhs of rupees over a loan's lifetime.</p><h3>How Digital Payments Build Credit</h3><p>Regular UPI transactions show financial discipline. PaisaFlow's expense tracking helps you maintain consistent spending patterns that credit bureaus view favorably.</p><h3>Tips to Improve Your Score</h3><ul><li>Pay all bills on time — set up auto-pay in PaisaFlow</li><li>Keep credit utilization below 30%</li><li>Maintain a mix of secured and unsecured credit</li><li>Check your credit report quarterly for errors</li><li>Don't close old credit card accounts</li></ul>"
    },
    9: {
        title: "Accepting International Payments as an Indian Freelancer",
        category: "For Business",
        date: "April 15, 2026",
        readTime: "7 min read",
        emoji: "🌍",
        content: "<p>India's freelance economy is booming, with over 15 million freelancers serving global clients. Here's how to accept international payments efficiently using PaisaFlow.</p><h3>The Challenge</h3><p>Traditional international payment methods like wire transfers have high fees (₹500-2,000 per transaction) and take 3-5 business days. PaisaFlow offers a better alternative.</p><h3>PaisaFlow International</h3><p>PaisaFlow supports receiving payments in 150+ currencies. Funds are converted at competitive exchange rates and credited to your Indian bank account within 24 hours.</p><h3>How to Get Started</h3><ol><li>Complete KYC verification in the PaisaFlow app</li><li>Generate a unique payment link for each client</li><li>Share the link via email or invoice</li><li>Receive funds directly in your bank account</li></ol><h3>Tax Implications</h3><p>International income is taxable in India. PaisaFlow provides a downloadable transaction summary for easy tax filing. Consult a CA for specific advice on your situation.</p>"
    },
    10: {
        title: "UPI 3.0: What's New in the Latest UPI Update",
        category: "UPI Guide",
        date: "April 8, 2026",
        readTime: "5 min read",
        emoji: "🆕",
        content: "<p>UPI 3.0 introduces several groundbreaking features that make digital payments even more powerful. Here's what's changing and how it affects you.</p><h3>Key Features of UPI 3.0</h3><p><strong>Credit Line on UPI:</strong> Users can now access pre-approved credit lines through UPI, enabling buy-now-pay-later functionality directly within UPI apps.</p><p><strong>UPI for Prepaid Wallets:</strong> Transfer funds between UPI and prepaid wallets seamlessly, making it easier to manage multiple payment instruments.</p><p><strong>International UPI:</strong> Select users can now send money to supported countries including Singapore, UAE, and the UK directly via UPI.</p><p><strong>Offline UPI Payments:</strong> Enhanced NFC-based payments that work even without internet connectivity.</p><h3>How PaisaFlow Supports UPI 3.0</h3><p>PaisaFlow is fully compatible with UPI 3.0 features. Credit line integration will be available in Q3 2026, and international transfers are expected by year-end.</p>"
    },
    11: {
        title: "Emergency Fund Planning: A Step-by-Step Guide",
        category: "Personal Finance",
        date: "March 30, 2026",
        readTime: "6 min read",
        emoji: "🛡️",
        content: "<p>An emergency fund is the foundation of financial security. Yet, 60% of Indians don't have enough savings to cover even one month of expenses. Here's how to build yours.</p><h3>How Much Do You Need?</h3><p>Financial experts recommend 3-6 months of essential expenses. For most Indians, this means ₹1-3 lakhs depending on your city and lifestyle.</p><h3>Where to Keep Your Emergency Fund</h3><ul><li><strong>High-yield savings account:</strong> 4-6% interest, instant access</li><li><strong>liquid mutual funds:</strong> 6-7% returns, withdrawal in 1-2 days</li><li><strong>Short-term FDs:</strong> 5-6% interest, penalty-free premature withdrawal</li></ul><h3>Using PaisaFlow to Build Your Fund</h3><p>Set up an automatic daily transfer of ₹100-500 to your emergency fund. PaisaFlow's 'Round Up' feature rounds up every transaction and saves the difference — painless saving that adds up fast.</p>"
    },
    12: {
        title: "QR Code Payments: The Future of In-Store Shopping",
        category: "For Business",
        date: "March 22, 2026",
        readTime: "5 min read",
        emoji: "📱",
        content: "<p>India has over 50 million QR code payment points, making it the world's largest QR code payment network. Here's what merchants and consumers need to know.</p><h3>Static vs Dynamic QR Codes</h3><p><strong>Static QR:</strong> Fixed code linked to your UPI ID. Customers enter the amount manually. Best for small shops with regular customers.</p><p><strong>Dynamic QR:</strong> Generated per transaction with the amount pre-filled. More secure and convenient. PaisaFlow generates dynamic QR codes automatically.</p><h3>Benefits for Merchants</h3><ul><li>Zero setup cost — just print and display</li><li>Instant settlement to your bank account</li><li>Automatic transaction records for accounting</li><li>No risk of counterfeit currency</li><li>Access to PaisaFlow's merchant dashboard</li></ul><h3>Setting Up QR Payments with PaisaFlow</h3><p>Download the PaisaFlow Merchant app, complete your KYC, and generate your QR code in under 5 minutes. You can print it on paper, stickers, or display it on a screen.</p>"
    }
};

/**
 * Opens the article detail modal with full content for a given article ID.
 * @param {number|string} articleId - The data-id of the clicked article card
 */
function openArticleModal(articleId) {
    var data = ARTICLE_DATA[articleId];
    if (!data) return;

    lastFocusedElement = document.activeElement;

    // Build article HTML
    var html = '<article class="article-detail">';
    html += '<header class="article-detail-header">';
    html += '<span class="article-detail-category">' + data.emoji + ' ' + data.category + '</span>';
    html += '<h2 class="article-detail-title" id="articleModalTitle">' + data.title + '</h2>';
    html += '<div class="article-detail-meta"><time datetime="' + data.date + '">' + data.date + '</time> <span class="article-read-time">' + data.readTime + '</span></div>';
    html += '</header>';
    html += '<div class="article-detail-content">' + data.content + '</div>';
    html += '<footer class="article-detail-footer">';
    html += '<div class="article-author">';
    html += '<div class="article-author-avatar">PF</div>';
    html += '<div class="article-author-info"><span class="article-author-name">PaisaFlow Editorial</span><span class="article-author-role">Finance &amp; Technology</span></div>';
    html += '</div>';
    html += '<div class="article-share">';
    html += '<span class="article-share-label">Share:</span>';
    html += '<button class="share-btn share-whatsapp" onclick="shareArticle(\'whatsapp\',\'' + encodeURIComponent(data.title) + '\')">WhatsApp</button>';
    html += '<button class="share-btn share-twitter" onclick="shareArticle(\'twitter\',\'' + encodeURIComponent(data.title) + '\')">Twitter</button>';
    html += '<button class="share-btn share-linkedin" onclick="shareArticle(\'linkedin\',\'' + encodeURIComponent(data.title) + '\')">LinkedIn</button>';
    html += '</div>';
    html += '</footer>';
    html += '</article>';

    var modal = document.getElementById('articleModal');
    var body = document.getElementById('articleModalBody');
    if (modal && body) {
        body.innerHTML = html;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Add focus trap listener (generic, scoped to this modal)
        var handler = createTrapFocus(modal);
        modalFocusTraps[modal.id] = handler;
        modal.addEventListener('keydown', handler);

        // Focus the title for screen readers
        setTimeout(function() {
            var title = document.getElementById('articleModalTitle');
            if (title) {
                title.setAttribute('tabindex', '-1');
                title.focus();
            }
        }, 100);
    }
}

/**
 * Closes the article detail modal.
 */
function closeArticleModal() {
    var modal = document.getElementById('articleModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Remove focus trap listener using the stored handler
        if (modalFocusTraps[modal.id]) {
            modal.removeEventListener('keydown', modalFocusTraps[modal.id]);
            delete modalFocusTraps[modal.id];
        }
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }
}

/**
 * Shares an article on social media.
 * @param {string} platform - The social platform
 * @param {string} encodedTitle - URL-encoded article title
 */
function shareArticle(platform, encodedTitle) {
    var title = decodeURIComponent(encodedTitle);
    var url = encodeURIComponent(window.location.href);
    var text = encodeURIComponent(title + ' — Read on PaisaFlow');
    var shareUrl = '';

    switch (platform) {
        case 'whatsapp':
            shareUrl = 'https://api.whatsapp.com/send?text=' + text + ' ' + url;
            break;
        case 'twitter':
            shareUrl = 'https://twitter.com/intent/tweet?text=' + text + '&url=' + url;
            break;
        case 'linkedin':
            shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
            break;
    }

    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// ========== COMPARISON CTA BUTTON ==========
/**
 * Wires up the comparison section's CTA button to open the signup modal.
 */
function initComparisonCTA() {
    var ctaBtn = document.querySelector('.comparison-cta .btn-primary');
    if (ctaBtn) {
        ctaBtn.addEventListener('click', function() {
            openSignupModal();
        });
    }
}


// ========== SEND MONEY FLOW ==========
function initSendMoney() {
    const amountInput = document.getElementById('sendAmount');
    const toStep2Btn = document.getElementById('toStep2');
    const amountError = document.getElementById('amountError');
    const quickAmountBtns = document.querySelectorAll('.quick-amount');
    const contactItems = document.querySelectorAll('.contact-item');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const backToStep1Btn = document.getElementById('backToStep1');
    const toStep3Btn = document.getElementById('toStep3');
    const sendAgainBtn = document.getElementById('sendAgain');
    const shareReceiptBtn = document.getElementById('shareReceipt');
    const stepIndicators = document.querySelectorAll('.step-indicator');

    let selectedContact = null;
    let currentStep = 1;

    // Pre-select first contact (active)
    const activeContact = document.querySelector('.contact-item.active');
    if (activeContact) {
        selectedContact = {
            name: activeContact.dataset.name,
            upi: activeContact.dataset.upi,
            bank: activeContact.dataset.bank
        };
    }

    // Amount input validation
    function validateAmount() {
        const val = parseFloat(amountInput.value);
        if (isNaN(val) || val < 1 || val > 100000) {
            amountInput.classList.add('error');
            amountError.classList.add('visible');
            toStep2Btn.disabled = true;
            return false;
        }
        amountInput.classList.remove('error');
        amountError.classList.remove('visible');
        toStep2Btn.disabled = false;
        return true;
    }

    amountInput.addEventListener('input', validateAmount);

    // Quick amount buttons
    quickAmountBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            amountInput.value = this.dataset.amount;
            validateAmount();
            // Visual feedback
            quickAmountBtns.forEach(function(b) { b.style.borderColor = ''; b.style.background = ''; });
            btn.style.borderColor = 'var(--color-primary)';
            btn.style.background = 'rgba(99, 102, 241, 0.05)';
        });
    });

    // Contact selection via EVENT DELEGATION on the contacts list
    // This ensures dynamically-added contacts (via Add Recipient) also work
    const contactsListEl = document.querySelector('.contacts-list');
    if (contactsListEl) {
        contactsListEl.addEventListener('click', function(e) {
            const item = e.target.closest('.contact-item');
            if (!item) return;

            // Remove active class from all contacts
            contactsListEl.querySelectorAll('.contact-item').forEach(function(c) {
                c.classList.remove('active');
                const sel = c.querySelector('.contact-selected');
                if (sel) sel.style.display = 'none';
            });

            // Activate clicked contact
            item.classList.add('active');
            const sel = item.querySelector('.contact-selected');
            if (sel) sel.style.display = '';

            // Update selected contact data
            selectedContact = {
                name: item.dataset.name,
                upi: item.dataset.upi,
                bank: item.dataset.bank
            };
        });
    }

    // Add New Recipient button
    var addRecipientBtn = document.getElementById('addRecipientBtn');
    if (addRecipientBtn) {
        addRecipientBtn.addEventListener('click', function() {
            openAddRecipientModal();
        });
        // Keyboard support (Enter/Space to activate)
        addRecipientBtn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openAddRecipientModal();
            }
        });
    }

    // Step navigation
    function goToStep(stepNum) {
        currentStep = stepNum;
        // Hide all steps
        [step1, step2, step3].forEach(function(s) { s.classList.remove('active'); });
        // Show target step
        document.getElementById('step' + stepNum).classList.add('active');
        // Update indicators
        stepIndicators.forEach(function(ind) {
            var step = parseInt(ind.dataset.step);
            ind.classList.remove('active', 'completed');
            if (step === stepNum) ind.classList.add('active');
            else if (step < stepNum) ind.classList.add('completed');
        });
    }

    // Step 1 -> Step 2
    toStep2Btn.addEventListener('click', function() {
        if (!validateAmount()) return;
        if (!selectedContact) {
            showToast('Please select a recipient from the contacts list.', 'error');
            return;
        }
        // Populate review
        document.getElementById('reviewRecipient').textContent = selectedContact.name;
        document.getElementById('reviewUpi').textContent = selectedContact.upi;
        document.getElementById('reviewBank').textContent = selectedContact.bank;
        document.getElementById('reviewAmount').textContent = '₹' + parseFloat(amountInput.value).toLocaleString('en-IN');
        goToStep(2);
    });

    // Back to Step 1
    backToStep1Btn.addEventListener('click', function() {
        goToStep(1);
    });

    // Step 2 -> Step 3 (Send)
    toStep3Btn.addEventListener('click', function() {
        // Simulate processing
        toStep3Btn.textContent = 'Processing...';
        toStep3Btn.disabled = true;
        setTimeout(function() {
            // Generate fake transaction ID
            var txnId = 'TXN' + Date.now().toString().slice(-8);
            document.getElementById('txnId').textContent = txnId;
            document.getElementById('successAmount').textContent = '₹' + parseFloat(amountInput.value).toLocaleString('en-IN');
            document.getElementById('successRecipient').textContent = 'to ' + selectedContact.name;
            goToStep(3);
            toStep3Btn.textContent = 'Confirm & Send';
            toStep3Btn.disabled = false;
        }, 1500);
    });

    // Send Again
    sendAgainBtn.addEventListener('click', function() {
        amountInput.value = '';
        toStep2Btn.disabled = true;
        goToStep(1);
    });

    // Share Receipt
    shareReceiptBtn.addEventListener('click', function() {
        var amountVal = parseFloat(amountInput.value);
        var amountText = (!isNaN(amountVal) && amountVal > 0)
            ? '₹' + amountVal.toLocaleString('en-IN')
            : document.getElementById('successAmount').textContent;
        var recipientText = selectedContact ? selectedContact.name : 'recipient';
        var txnIdText = document.getElementById('txnId').textContent;
        var text = 'I just sent ' + amountText + ' to ' + recipientText + ' via PaisaFlow! Transaction ID: ' + txnIdText;
        if (navigator.share) {
            navigator.share({ title: 'PaisaFlow Receipt', text: text });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(function() {
                shareReceiptBtn.textContent = 'Copied!';
                setTimeout(function() { shareReceiptBtn.textContent = 'Share Receipt'; }, 2000);
            });
        }
    });
}

// ========== REFERRAL SECTION ==========
function initReferral() {
    var copyBtn = document.getElementById('copyReferralCode');
    var referralCode = document.getElementById('referralCode');
    var shareBtns = document.querySelectorAll('.share-btn');

    // Copy referral code
    if (copyBtn && referralCode) {
        copyBtn.addEventListener('click', function() {
            var code = referralCode.textContent;
            navigator.clipboard.writeText(code).then(function() {
                var originalText = copyBtn.textContent;
                copyBtn.textContent = 'Copied!';
                setTimeout(function() {
                    copyBtn.textContent = originalText;
                }, 2000);
            }).catch(function() {
                // Fallback
                var textarea = document.createElement('textarea');
                textarea.value = code;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                copyBtn.textContent = 'Copied!';
                setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
            });
        });
    }

    // Share buttons
    shareBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var shareText = 'Join PaisaFlow using my referral code RAHUL2026 and earn ₹50 cashback on your first UPI transaction!';
            var shareUrl = 'https://paisaflow.in/?ref=RAHUL2026';
            var url = '';
            if (this.classList.contains('share-whatsapp')) {
                url = 'https://wa.me/?text=' + encodeURIComponent(shareText + ' ' + shareUrl);
            } else if (this.classList.contains('share-telegram')) {
                url = 'https://t.me/share/url?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent(shareText);
            } else if (this.classList.contains('share-sms')) {
                url = 'sms:?body=' + encodeURIComponent(shareText + ' ' + shareUrl);
            }
            if (url) window.open(url, '_blank', 'width=600,height=400');
        });
    });

    // Animate referral count on scroll
    var refCountEl = document.getElementById('refCount');
    var refEarnedEl = document.getElementById('refEarned');
    var hasAnimated = false;

    function animateValue(el, start, end, duration) {
        var startTime = null;
        function update(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var current = Math.floor(progress * (end - start) + start);
            el.textContent = current.toLocaleString('en-IN');
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // Intersection observer for referral stats
    var referralSection = document.getElementById('referral');
    if (referralSection && refCountEl && !hasAnimated) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && !hasAnimated) {
                    hasAnimated = true;
                    animateValue(refCountEl, 0, 12, 1500);
                    animateValue(refEarnedEl, 0, 600, 1500);
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });
        observer.observe(referralSection);
    }
}

// ========== ADD RECIPIENT MODAL ==========

/**
 * Opens the Add Recipient modal.
 * Resets form and focuses the name input.
 */
function openAddRecipientModal() {
    closeAllModals();
    lastFocusedElement = document.activeElement;
    var modal = document.getElementById('addRecipientModal');
    if (modal) {
        // Reset form
        var form = document.getElementById('addRecipientForm');
        if (form) form.reset();
        clearRecipientValidation();

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus the first input
        setTimeout(function() {
            var firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 150);
    }
}

/**
 * Closes the Add Recipient modal.
 */
function closeAddRecipientModal() {
    var modal = document.getElementById('addRecipientModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }
}

/**
 * Clears recipient form validation states.
 */
function clearRecipientValidation() {
    var fields = ['recipientName', 'recipientUpi', 'recipientBank'];
    fields.forEach(function(id) {
        var input = document.getElementById(id);
        var error = document.getElementById(id + 'Error');
        if (input) input.classList.remove('error', 'success');
        if (error) { error.style.display = 'none'; error.textContent = ''; }
    });
}

/**
 * Validates a UPI ID string.
 * Reuses the same regex as the UPI payment form.
 * @param {string} upiId
 * @returns {boolean}
 */
function isValidUpiIdForRecipient(upiId) {
    var upiRegex = /^[a-zA-Z0-9._-]{1,50}@[a-zA-Z0-9.]{1,20}$/;
    return upiRegex.test(upiId);
}

/**
 * Generates initials from a full name.
 * @param {string} name
 * @returns {string} Up to 2 uppercase initials
 */
function getInitials(name) {
    return name.trim().split(/\s+/).map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2);
}

/**
 * Generates a deterministic pastel background color from a name.
 * @param {string} name
 * @returns {string} CSS color string
 */
function getAvatarColor(name) {
    var colors = [
        '#6C5CE7', '#00D2D3', '#FF6B6B', '#FDCB6E', '#00B894',
        '#E17055', '#0984E3', '#E84393', '#00CEC9', '#A29BFE'
    ];
    var hash = 0;
    for (var i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Processes the Add Recipient form submission.
 * Validates inputs, adds the new contact to the contacts list, and selects it.
 * @param {Event} event
 */
function processAddRecipient(event) {
    event.preventDefault();

    var nameInput = document.getElementById('recipientName');
    var upiInput = document.getElementById('recipientUpi');
    var bankInput = document.getElementById('recipientBank');
    var name = nameInput.value.trim();
    var upi = upiInput.value.trim();
    var bank = bankInput.value;

    clearRecipientValidation();

    var isValid = true;

    // Validate name
    if (!name || name.length < 2) {
        nameInput.classList.add('error');
        var nameError = document.getElementById('recipientNameError');
        if (nameError) { nameError.textContent = 'Please enter a valid name (at least 2 characters).'; nameError.style.display = 'block'; }
        isValid = false;
    } else {
        nameInput.classList.add('success');
    }

    // Validate UPI ID
    if (!upi) {
        upiInput.classList.add('error');
        var upiError = document.getElementById('recipientUpiError');
        if (upiError) { upiError.textContent = 'Please enter a UPI ID.'; upiError.style.display = 'block'; }
        isValid = false;
    } else if (!isValidUpiIdForRecipient(upi)) {
        upiInput.classList.add('error');
        var upiError2 = document.getElementById('recipientUpiError');
        if (upiError2) { upiError2.textContent = 'Invalid format. Use: name@handle (e.g., rahul@hdfcbank)'; upiError2.style.display = 'block'; }
        isValid = false;
    } else {
        // Check for duplicate UPI ID
        var existingContacts = document.querySelectorAll('.contact-item');
        var isDuplicate = false;
        existingContacts.forEach(function(c) {
            if (c.getAttribute('data-upi') === upi) isDuplicate = true;
        });
        if (isDuplicate) {
            upiInput.classList.add('error');
            var dupError = document.getElementById('recipientUpiError');
            if (dupError) { dupError.textContent = 'This UPI ID is already in your contacts.'; dupError.style.display = 'block'; }
            isValid = false;
        } else {
            upiInput.classList.add('success');
        }
    }

    // Validate bank
    if (!bank) {
        bankInput.classList.add('error');
        var bankError = document.getElementById('recipientBankError');
        if (bankError) { bankError.textContent = 'Please select a bank.'; bankError.style.display = 'block'; }
        isValid = false;
    } else {
        bankInput.classList.add('success');
    }

    if (!isValid) return;

    // --- Create new contact element ---
    var contactsList = document.querySelector('.contacts-list');
    if (!contactsList) {
        closeAddRecipientModal();
        return;
    }

    // Generate avatar color and initials
    var initials = getInitials(name);
    var avatarColor = getAvatarColor(name);

    // Create the contact item
    var newContact = document.createElement('div');
    newContact.className = 'contact-item active';
    newContact.setAttribute('data-name', name);
    newContact.setAttribute('data-upi', upi);
    newContact.setAttribute('data-bank', bank);
    newContact.innerHTML =
        '<div class="contact-avatar" style="background: ' + avatarColor + '20; color: ' + avatarColor + ';">' + initials + '</div>' +
        '<div class="contact-info">' +
            '<span class="contact-name">' + name + '</span>' +
            '<span class="contact-upi">' + upi + '</span>' +
        '</div>' +
        '<span class="contact-selected">✓</span>';

    // Remove active class from all existing contacts
    var existingItems = contactsList.querySelectorAll('.contact-item');
    existingItems.forEach(function(item) {
        item.classList.remove('active');
        var sel = item.querySelector('.contact-selected');
        if (sel) sel.style.display = 'none';
    });

    // Prepend new contact (newest first)
    contactsList.insertBefore(newContact, contactsList.firstChild);

    // Manually set selectedContact since event delegation handles visual state
    selectedContact = {
        name: name,
        upi: upi,
        bank: bank
    };

    // Close modal and show success
    closeAddRecipientModal();
    showToast('Recipient ' + name + ' added successfully!', 'success');
}
