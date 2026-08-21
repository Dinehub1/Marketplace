/**
 * Sarkar AI — Main JavaScript
 * 
 * Features:
 * - Typing effect for hero section
 * - Animated number counters
 * - Dark mode toggle with localStorage
 * - Mobile menu toggle
 * - Modal management (UPI, Signup, Login)
 * - Intersection Observer for scroll animations
 * - AI search simulation
 * - Navbar scroll effect
 * - Toast notifications
 * - Accessibility: prefers-reduced-motion support
 */

(function () {
    'use strict';

    // ========== DOM Ready ==========
    document.addEventListener('DOMContentLoaded', function () {
        initTheme();
        initTypingEffect();
        initCounters();
        initMobileMenu();
        initNavbarScroll();
        initScrollAnimations();
        initSearchSuggestions();
        initFooterYear();
        renderRecentSearches();
    });

    // ========== Theme Toggle ==========
    function initTheme() {
        var themeToggle = document.getElementById('themeToggle');
        var themeIcon = document.getElementById('themeIcon');
        var savedTheme = localStorage.getItem('sarkar-theme');

        // Apply saved theme or default
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeIcon.textContent = '☀️';
        } else {
            themeIcon.textContent = '🌙';
        }

        if (themeToggle) {
            themeToggle.addEventListener('click', function () {
                var currentTheme = document.documentElement.getAttribute('data-theme');

                if (currentTheme === 'dark') {
                    document.documentElement.removeAttribute('data-theme');
                    themeIcon.textContent = '🌙';
                    localStorage.setItem('sarkar-theme', 'light');
                } else {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    themeIcon.textContent = '☀️';
                    localStorage.setItem('sarkar-theme', 'dark');
                }
            });
        }
    }

    // ========== Typing Effect ==========
    function initTypingEffect() {
        var typingText = document.getElementById('typingText');
        if (!typingText) return;

        // Respect user's motion preference — skip animation entirely if reduced
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            // Show the first phrase statically
            typingText.textContent = 'Seconds';
            return;
        }

        var phrases = [
            'Seconds',
            'Hindi',
            'Tamil',
            'English',
            'Hinglish',
            'Any Language'
        ];

        var phraseIndex = 0;
        var charIndex = 0;
        var isDeleting = false;
        var typeSpeed = 100;
        var deleteSpeed = 50;
        var pauseTime = 2000;

        function type() {
            var currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                typingText.textContent = currentPhrase.substring(0, charIndex - 1);
                charIndex--;
            } else {
                typingText.textContent = currentPhrase.substring(0, charIndex + 1);
                charIndex++;
            }

            var speed = isDeleting ? deleteSpeed : typeSpeed;

            if (!isDeleting && charIndex === currentPhrase.length) {
                speed = pauseTime;
                isDeleting = true;
            } else if (isDeleting && charIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % phrases.length;
                speed = 500;
            }

            setTimeout(type, speed);
        }

        type();
    }

    // ========== Animated Counters ==========
    function initCounters() {
        var counters = document.querySelectorAll('.stat-number[data-target]');
        if (counters.length === 0) return;

        var observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        counters.forEach(function (counter) {
            observer.observe(counter);
        });
    }

    function animateCounter(element) {
        var target = parseInt(element.getAttribute('data-target'), 10);
        var suffix = element.getAttribute('data-suffix') || '';
        var duration = 2000;
        var start = 0;
        var startTime = null;

        function easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }

        function update(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var easedProgress = easeOutQuart(progress);
            var current = Math.floor(easedProgress * target);

            element.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target + suffix;
            }
        }

        requestAnimationFrame(update);
    }

    // ========== Mobile Menu ==========
    function initMobileMenu() {
        var menuBtn = document.getElementById('mobileMenuBtn');
        var navLinks = document.getElementById('navLinks');

        if (menuBtn && navLinks) {
            menuBtn.addEventListener('click', function () {
                menuBtn.classList.toggle('active');
                navLinks.classList.toggle('active');
            });

            // Close menu when clicking a link
            var links = navLinks.querySelectorAll('a');
            links.forEach(function (link) {
                link.addEventListener('click', function () {
                    menuBtn.classList.remove('active');
                    navLinks.classList.remove('active');
                });
            });
        }
    }

    // ========== Navbar Scroll Effect ==========
    function initNavbarScroll() {
        var navbar = document.getElementById('navbar');
        if (!navbar) return;

        var ticking = false;

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    if (window.scrollY > 50) {
                        navbar.classList.add('scrolled');
                    } else {
                        navbar.classList.remove('scrolled');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    // ========== Scroll Animations (Intersection Observer) ==========
    function initScrollAnimations() {
        var animatedElements = document.querySelectorAll(
            '.feature-card, .category-card, .step, .pricing-card, .testimonial-card, .lb-benefit, .lb-form-card'
        );

        // Add fade-in class to elements
        animatedElements.forEach(function (el) {
            el.classList.add('fade-in');
        });

        var observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        animatedElements.forEach(function (el) {
            observer.observe(el);
        });
    }

    // ========== Search Suggestions ==========
    function initSearchSuggestions() {
        var searchInput = document.getElementById('aiSearchInput');
        if (!searchInput) return;

        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                performAiSearch();
            }
        });
    }

    // ========== RECENT SEARCHES (localStorage) ==========
    var RECENT_SEARCHES_KEY = 'sarkar-recent-searches';
    var MAX_RECENT_SEARCHES = 8;

    /**
     * Saves a search query to localStorage as a recent search.
     * Deduplicates: moves existing query to top.
     * Caps at MAX_RECENT_SEARCHES entries.
     * Each entry: { query: string, timestamp: number }
     */
    function saveRecentSearch(query) {
        if (!query || query.length === 0) return;

        var searches = getRecentSearches();

        // Remove duplicate if exists
        searches = searches.filter(function (item) {
            return item.query.toLowerCase() !== query.toLowerCase();
        });

        // Add to front
        searches.unshift({ query: query, timestamp: Date.now() });

        // Cap at max
        if (searches.length > MAX_RECENT_SEARCHES) {
            searches = searches.slice(0, MAX_RECENT_SEARCHES);
        }

        try {
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
        } catch (e) {
            // localStorage full or unavailable — fail silently
        }
    }

    /**
     * Returns array of recent searches from localStorage.
     * Safely handles corrupted data.
     */
    function getRecentSearches() {
        try {
            var raw = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (!raw) return [];
            var parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return [];
            // Validate each entry has a query string
            return parsed.filter(function (item) {
                return item && typeof item.query === 'string' && item.query.length > 0;
            });
        } catch (e) {
            return [];
        }
    }

    /**
     * Clears all recent searches from localStorage and re-renders.
     */
    window.clearRecentSearches = function () {
        try {
            localStorage.removeItem(RECENT_SEARCHES_KEY);
        } catch (e) {}
        renderRecentSearches();
        showToast('Recent searches cleared');
    };

    /**
     * Renders the recent searches section in the DOM.
     * Shows/hides the section based on whether there are searches.
     * Formats timestamps as relative time (e.g., "2 min ago").
     */
    function renderRecentSearches() {
        var container = document.getElementById('recentSearches');
        if (!container) return;

        var searches = getRecentSearches();
        var listEl = document.getElementById('recentSearchesList');
        var countEl = document.getElementById('recentSearchesCount');
        var clearBtn = document.getElementById('recentSearchesClear');

        if (searches.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';

        if (countEl) {
            countEl.textContent = searches.length + ' recent search' + (searches.length !== 1 ? 'es' : '');
        }

        if (clearBtn) {
            clearBtn.style.display = 'inline-flex';
        }

        if (listEl) {
            listEl.innerHTML = '';
            searches.forEach(function (item) {
                var chip = document.createElement('button');
                chip.className = 'recent-search-chip';
                chip.setAttribute('aria-label', 'Search for ' + item.query);
                chip.setAttribute('title', item.query);

                // Icon
                var icon = document.createElement('span');
                icon.className = 'recent-search-icon';
                icon.textContent = '🕐';
                icon.setAttribute('aria-hidden', 'true');
                chip.appendChild(icon);

                // Query text (truncated)
                var text = document.createElement('span');
                text.className = 'recent-search-text';
                text.textContent = item.query.length > 30 ? item.query.substring(0, 30) + '…' : item.query;
                chip.appendChild(text);

                // Relative time badge
                var timeBadge = document.createElement('span');
                timeBadge.className = 'recent-search-time';
                timeBadge.textContent = getRelativeTime(item.timestamp);
                chip.appendChild(timeBadge);

                // Click to re-search
                chip.addEventListener('click', function () {
                    setSearch(item.query);
                    performAiSearch();
                });

                listEl.appendChild(chip);
            });
        }
    }

    /**
     * Returns a human-readable relative time string.
     * e.g., "just now", "2 min ago", "1 hr ago", "yesterday", "3 days ago"
     */
    function getRelativeTime(timestamp) {
        var now = Date.now();
        var diff = now - timestamp;
        var seconds = Math.floor(diff / 1000);
        var minutes = Math.floor(seconds / 60);
        var hours = Math.floor(minutes / 60);
        var days = Math.floor(hours / 24);

        if (seconds < 30) return 'just now';
        if (seconds < 60) return seconds + 's ago';
        if (minutes < 60) return minutes + 'm ago';
        if (hours < 24) return hours + 'h ago';
        if (days === 1) return 'yesterday';
        if (days < 7) return days + 'd ago';
        return '1w+ ago';
    }

    // ========== AI SEARCH RESULTS PANEL ==========
    // Live search against the real Supabase `businesses` table (read-only
    // publishable key — safe to expose client-side, matches the RLS policy
    // used by the rest of the site).
    var SUPABASE_URL = 'https://xpfmqpmhmcouwzebfwhb.supabase.co';
    var SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XN_U25XfcBdLbXVJhraMsQ_1RQtM_Nc';

    var CATEGORY_EMOJI = {
        'restaurant': '🍽️', 'cafe': '☕', 'hospital': '🏥', 'dentist': '🦷',
        'pharmacy': '💊', 'gynecologist': '🩺', 'plumber': '🔧', 'electrician': '💡',
        'real estate agent': '🏠', 'furniture store': '🛋️', 'home decor': '🛋️',
        'interior designer': '🛋️', 'architect': '🏗️', 'ac repairing service': '❄️',
        'salon': '💇', 'gym': '💪'
    };
    function emojiForCategory(cat) {
        return CATEGORY_EMOJI[(cat || '').toLowerCase()] || '🏢';
    }

    /**
     * Detects a category keyword in the query (used to widen the search to
     * the whole category, e.g. "ac repair near me" -> category ilike ac%).
     */
    var CATEGORY_KEYWORDS = {
        'restaurant': 'restaurant', 'food': 'restaurant', 'cafe': 'cafe',
        'hospital': 'hospital', 'doctor': 'hospital', 'clinic': 'hospital',
        'dentist': 'dentist', 'pharmacy': 'pharmacy', 'chemist': 'pharmacy',
        'gynecologist': 'gynecologist', 'plumber': 'plumber',
        'electrician': 'electrician', 'real estate': 'real estate agent',
        'property': 'real estate agent', 'furniture': 'furniture store',
        'salon': 'salon', 'gym': 'gym', 'ac repair': 'ac repairing service',
        'ac': 'ac repairing service'
    };
    function detectCategory(q) {
        for (var kw in CATEGORY_KEYWORDS) {
            if (q.indexOf(kw) !== -1) return CATEGORY_KEYWORDS[kw];
        }
        return null;
    }

    /**
     * Queries the live `businesses` table (status=active) by name/category/
     * area/city, returning up to 8 matches sorted by rating.
     */
    function searchBusinesses(query) {
        var q = query.toLowerCase().trim();
        var category = detectCategory(q);
        var like = '*' + q.replace(/[*,()]/g, ' ').trim() + '*';
        var orFilter = 'name.ilike.' + like + ',category.ilike.' + like +
            ',area.ilike.' + like + ',city.ilike.' + like;

        var params = new URLSearchParams({
            select: 'id,name,category,phone,website,address,area,city,rating,google_maps,slug,status',
            or: '(' + orFilter + ')',
            order: 'rating.desc.nullslast',
            limit: '8'
        });
        if (category) params.set('category', 'ilike.*' + category + '*');

        return fetch(SUPABASE_URL + '/rest/v1/businesses?' + params.toString(), {
            headers: { apikey: SUPABASE_PUBLISHABLE_KEY }
        }).then(function (res) {
            if (!res.ok) throw new Error('Search failed (' + res.status + ')');
            return res.json();
        });
    }

    /**
     * Renders the AI search results panel below the search bar.
     * Creates an overlay card with business cards showing ratings, tags, and status.
     */
    function showSearchResults(query, results) {
        // Remove existing results panel
        var existing = document.getElementById('aiSearchResults');
        if (existing) existing.remove();

        // Create results panel
        var panel = document.createElement('div');
        panel.id = 'aiSearchResults';
        panel.className = 'ai-search-results';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'Search results');

        // Header
        var header = document.createElement('div');
        header.className = 'ai-results-header';
        header.innerHTML = '<span class="ai-results-count">' + results.length + ' results for "<span class="ai-results-query">' + escapeHtml(query) + '</span>"</span>' +
            '<button class="ai-results-close" onclick="closeSearchResults()" aria-label="Close results">✕</button>';
        panel.appendChild(header);

        // AI insight banner
        var insight = document.createElement('div');
        insight.className = 'ai-results-insight';
        insight.innerHTML = '<span class="ai-insight-icon">🤖</span><span class="ai-insight-text">' + generateInsight(query, results) + '</span>';
        panel.appendChild(insight);

        // Results list
        var list = document.createElement('div');
        list.className = 'ai-results-list';

        results.forEach(function (biz) {
            var card = document.createElement('div');
            card.className = 'ai-result-card';
            if (biz.id) {
                card.style.cursor = 'pointer';
                card.addEventListener('click', function (e) {
                    if (e.target.closest('a')) return; // let call/map/site buttons work
                    window.location.href = '/business/' + biz.id;
                });
            }

            var rating = biz.rating ? Number(biz.rating) : null;
            var stars = rating ? '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') : '';
            var ratingHtml = rating ? '<span class="ai-result-rating">' + stars + ' ' + rating + '</span>' : '';
            var verifiedHtml = '<span class="ai-result-status open">✓ Verified listing</span>';
            var tagHtml = '<span class="ai-result-tag">' + escapeHtml(biz.category || '') + '</span>';

            var callBtn = biz.phone ? '<a class="ai-result-btn call" href="tel:' + escapeHtml(biz.phone) + '" aria-label="Call">📞</a>' : '';
            var dirBtn = biz.google_maps ? '<a class="ai-result-btn dir" href="' + escapeHtml(biz.google_maps) + '" target="_blank" rel="noopener" aria-label="Directions">🧭</a>' : '';
            var webBtn = biz.website ? '<a class="ai-result-btn share" href="' + escapeHtml(biz.website) + '" target="_blank" rel="noopener" aria-label="Website">↗</a>' : '';
            var viewBtn = biz.id ? '<a class="ai-result-btn view" href="/business/' + biz.id + '" aria-label="View details">→</a>' : '';

            card.innerHTML =
                '<div class="ai-result-left">' +
                    '<span class="ai-result-emoji">' + emojiForCategory(biz.category) + '</span>' +
                '</div>' +
                '<div class="ai-result-info">' +
                    '<div class="ai-result-name">' + escapeHtml(biz.name) + '</div>' +
                    '<div class="ai-result-meta">' + ratingHtml + verifiedHtml + '</div>' +
                    '<div class="ai-result-area">📍 ' + escapeHtml(biz.area || biz.city || '') + '</div>' +
                    '<div class="ai-result-tags">' + tagHtml + '</div>' +
                '</div>' +
                '<div class="ai-result-actions">' + callBtn + dirBtn + webBtn + viewBtn + '</div>';

            list.appendChild(card);
        });

        panel.appendChild(list);

        // Footer
        var footer = document.createElement('div');
        footer.className = 'ai-results-footer';
        footer.innerHTML = '<span>Powered by Sarkar AI · Live data — <a href="/marketplace" style="color:inherit;text-decoration:underline">browse the full directory</a></span>';
        panel.appendChild(footer);

        // Insert after the search suggestions
        var searchSuggestions = document.querySelector('.search-suggestions');
        if (searchSuggestions && searchSuggestions.parentNode) {
            searchSuggestions.parentNode.insertBefore(panel, searchSuggestions.nextSibling);
        } else {
            // Fallback: append after search bar
            var searchBar = document.querySelector('.ai-search-bar');
            if (searchBar && searchBar.parentNode) {
                searchBar.parentNode.insertBefore(panel, searchBar.nextSibling);
            }
        }
    }

    /** Closes the search results panel */
    window.closeSearchResults = function () {
        var panel = document.getElementById('aiSearchResults');
        if (panel) {
            panel.style.opacity = '0';
            panel.style.transform = 'translateY(-8px)';
            setTimeout(function () { panel.remove(); }, 300);
        }
    };

    /** Generates a contextual AI insight based on the query and results */
    function generateInsight(query, results) {
        if (results.length === 0) return "No results found. Try a different search term.";
        var q = query.toLowerCase();
        var topResult = results[0];
        var insights = [];
        var rated = results.filter(function (r) { return r.rating; });

        if (q.indexOf('best') !== -1 || q.indexOf('top') !== -1 || q.indexOf('achha') !== -1) {
            insights.push(topResult.rating ? "Top rated: " + topResult.name + " (" + topResult.rating + "★)" : "Top match: " + topResult.name);
        } else {
            insights.push("Found " + results.length + " matching businesses");
        }

        if (rated.length) {
            var avgRating = (rated.reduce(function (s, r) { return s + Number(r.rating); }, 0) / rated.length).toFixed(1);
            insights.push("Avg rating: " + avgRating + "★");
        }

        return insights.join(' · ');
    }

    /** Simple HTML escape to prevent XSS in search results */
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Global function for search
    window.performAiSearch = function () {
        var searchInput = document.getElementById('aiSearchInput');
        if (!searchInput) return;

        var query = searchInput.value.trim();
        if (query.length === 0) {
            showToast('Please enter a search query');
            return;
        }

        // Save to recent searches
        saveRecentSearch(query);
        renderRecentSearches();

        // Show loading state on search button
        var searchBtn = document.querySelector('.ai-search-bar .btn-search');
        var originalBtnText = '';
        if (searchBtn) {
            originalBtnText = searchBtn.innerHTML;
            searchBtn.innerHTML = '⏳ Searching...';
            searchBtn.disabled = true;
        }

        showToast('🔍 Searching "' + query + '"...');

        searchBusinesses(query).then(function (results) {
            if (searchBtn) {
                searchBtn.innerHTML = originalBtnText;
                searchBtn.disabled = false;
            }
            if (results.length > 0) {
                showSearchResults(query, results);
                showToast('✅ Found ' + results.length + ' results!');
            } else {
                showToast('No results found. Try: "furniture store", "plumber", or "restaurant"');
            }
        }).catch(function (err) {
            if (searchBtn) {
                searchBtn.innerHTML = originalBtnText;
                searchBtn.disabled = false;
            }
            showToast('Search unavailable right now — please try again shortly.');
            console.error('Business search failed:', err);
        });
    };

    // Global function for setting search text
    window.setSearch = function (text) {
        var searchInput = document.getElementById('aiSearchInput');
        if (searchInput) {
            searchInput.value = text;
            searchInput.focus();
        }
    };

    // ========== Modal Management ==========
    /** Tracks the element that had focus before a modal opened, for restoration on close */
    var lastFocusedElement = null;

    /**
     * Returns a selector string for all focusable elements within a container.
     * Used for focus trapping inside modals.
     */
    function getFocusableSelector() {
        return 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    }

    /**
     * Traps focus within a modal container.
     * When Tab is pressed on the last focusable element, wraps to first.
     * When Shift+Tab is pressed on the first focusable element, wraps to last.
     *
     * @param {HTMLElement} modalContainer - The modal element to trap focus within
     * @returns {Function} Cleanup function to remove the keydown listener
     */
    function trapFocus(modalContainer) {
        var focusableElements = modalContainer.querySelectorAll(getFocusableSelector());
        if (focusableElements.length === 0) return function () {};

        var firstFocusable = focusableElements[0];
        var lastFocusable = focusableElements[focusableElements.length - 1];

        function handleTabKey(e) {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift+Tab on first element → wrap to last
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                // Tab on last element → wrap to first
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }

        modalContainer.addEventListener('keydown', handleTabKey);

        // Return cleanup function
        return function () {
            modalContainer.removeEventListener('keydown', handleTabKey);
        };
    }

    /**
     * Opens a modal by ID with focus trapping and body scroll lock.
     * @param {string} modalId - The ID of the modal overlay element
     */
    function openModal(modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) return;

        // Close any other open modals first
        closeAllModals();

        lastFocusedElement = document.activeElement;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus the first focusable element in the modal
        setTimeout(function () {
            var focusable = modal.querySelector(getFocusableSelector());
            if (focusable) focusable.focus();
        }, 100);

        // Set up focus trapping
        modal._cleanupFocusTrap = trapFocus(modal);
    }

    /**
     * Closes a specific modal by ID and restores focus.
     * @param {string} modalId - The ID of the modal overlay element
     */
    function closeModal(modalId) {
        var modal = document.getElementById(modalId);
        if (!modal) return;

        modal.classList.remove('active');

        // Clean up focus trap listener
        if (modal._cleanupFocusTrap) {
            modal._cleanupFocusTrap();
            modal._cleanupFocusTrap = null;
        }

        // Restore focus to the element that opened the modal
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus();
        }
    }

    /**
     * Closes all open modals and restores body scroll.
     */
    function closeAllModals() {
        var activeModals = document.querySelectorAll('.modal-overlay.active');
        activeModals.forEach(function (modal) {
            modal.classList.remove('active');
            if (modal._cleanupFocusTrap) {
                modal._cleanupFocusTrap();
                modal._cleanupFocusTrap = null;
            }
        });
        document.body.style.overflow = '';
    }

    // Global modal open functions
    window.openUpiModal = function () {
        openModal('upiModal');
        // Generate QR code after modal is visible (small delay for DOM)
        setTimeout(function () {
            generateUpiQR();
        }, 150);

        // Regenerate QR when amount or note changes
        setTimeout(function () {
            var amtInput = document.getElementById('upiAmount');
            var noteInput = document.getElementById('upiNote');
            if (amtInput) amtInput.addEventListener('input', generateUpiQR);
            if (noteInput) noteInput.addEventListener('input', generateUpiQR);
        }, 200);
    };

    window.closeUpiModal = function () {
        closeModal('upiModal');
    };

    window.openSignupModal = function () {
        window.location.href = '/register';
        return;
        openModal('signupModal');
    };

    window.closeSignupModal = function () {
        closeModal('signupModal');
    };

    window.openLoginModal = function () {
        window.location.href = '/login';
        return;
        openModal('loginModal');
    };

    window.closeLoginModal = function () {
        closeModal('loginModal');
    };

    // Close modals on overlay click
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-overlay')) {
            closeAllModals();
        }
    });

    // Close modals on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });

    // ========== UPI Functions ==========
    window.copyPayeeUPI = function () {
        var upiId = document.getElementById('payeeUpiId');
        if (!upiId) return;

        var textToCopy = upiId.textContent;
        var copyIcon = document.getElementById('copyIcon');

        // Try modern clipboard API first (requires HTTPS or localhost)
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(function () {
                showCopyFeedback();
            }).catch(function () {
                // Fallback for older browsers or non-HTTPS contexts
                fallbackCopyText(textToCopy);
            });
        } else {
            fallbackCopyText(textToCopy);
        }

        /**
         * Fallback copy method using execCommand for older browsers.
         * Creates a temporary textarea, selects it, and copies.
         */
        function fallbackCopyText(text) {
            var textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            textArea.style.top = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                showCopyFeedback();
            } catch (err) {
                showToast('Press Ctrl+C to copy: ' + text);
            }
            document.body.removeChild(textArea);
        }

        /** Shows visual feedback after successful copy */
        function showCopyFeedback() {
            if (copyIcon) copyIcon.textContent = '✅';
            showToast('UPI ID copied to clipboard!');
            setTimeout(function () {
                if (copyIcon) copyIcon.textContent = '📋';
            }, 2000);
        }
    };

    window.openUpiApp = function (app) {
        var amount = document.getElementById('upiAmount').value || '499';
        var note = document.getElementById('upiNote').value || 'Sarkar AI Business Pro';
        var upiId = 'sarkarai@hdfcbank';
        var merchantName = 'Sarkar AI';
        var txnRef = 'SA' + Date.now();

        // Build UPI URI (universal format all UPI apps understand)
        var upiUri = 'upi://pay?pa=' + encodeURIComponent(upiId) +
            '&pn=' + encodeURIComponent(merchantName) +
            '&am=' + encodeURIComponent(amount) +
            '&cu=INR' +
            '&tn=' + encodeURIComponent(note) +
            '&tr=' + encodeURIComponent(txnRef);

        // App-specific deep links for better compatibility
        var appLinks = {
            gpay: 'gpay://upi/pay?pa=' + encodeURIComponent(upiId) +
                  '&pn=' + encodeURIComponent(merchantName) +
                  '&am=' + encodeURIComponent(amount) +
                  '&cu=INR&tn=' + encodeURIComponent(note),
            phonepe: 'phonepe://pay?pa=' + encodeURIComponent(upiId) +
                     '&pn=' + encodeURIComponent(merchantName) +
                     '&am=' + encodeURIComponent(amount) +
                     '&cu=INR&tn=' + encodeURIComponent(note),
            paytm: 'paytmmp://pay?pa=' + encodeURIComponent(upiId) +
                   '&pn=' + encodeURIComponent(merchantName) +
                   '&am=' + encodeURIComponent(amount) +
                   '&cu=INR&tn=' + encodeURIComponent(note),
            bhim: upiUri
        };

        if (appLinks[app]) {
            window.location.href = appLinks[app];
            // Fallback toast in case app is not installed
            setTimeout(function () {
                showToast("If the app didn't open, please try another payment method.");
            }, 3000);
        } else {
            showToast('Opening ' + app + '... (Demo mode)');
        }
    };

    /**
     * Generates a real, scannable QR code using the qrcode.js library.
     * Encodes the full UPI payment URI so any UPI app can scan and pay.
     * Reacts to amount/note input changes for a live payment experience.
     */
    function generateUpiQR() {
        var canvas = document.getElementById('upiQrCanvas');
        if (!canvas || typeof QRCode === 'undefined') return;

        var amount = document.getElementById('upiAmount').value || '499';
        var note = document.getElementById('upiNote').value || 'Sarkar AI Business Pro';
        var upiId = 'sarkarai@hdfcbank';
        var merchantName = 'Sarkar AI';

        // Build UPI URI — this is the standard format all UPI apps understand
        var upiUri = 'upi://pay?pa=' + encodeURIComponent(upiId) +
            '&pn=' + encodeURIComponent(merchantName) +
            '&am=' + encodeURIComponent(amount) +
            '&cu=INR&tn=' + encodeURIComponent(note);

        // Clear canvas first
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 180, 180);

        // Generate real QR code
        QRCode.toCanvas(canvas, upiUri, {
            width: 180,
            margin: 2,
            color: {
                dark: '#0f172a',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H' // High error correction = more reliable scanning
        }, function (error) {
            if (error) {
                console.error('QR code generation failed:', error);
                // Fallback: draw error message on canvas
                ctx.fillStyle = '#ef4444';
                ctx.font = '11px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('QR unavailable', 90, 90);
            }
        });
    }

    window.processUpiPayment = function (e) {
        e.preventDefault();
        var amount = document.getElementById('upiAmount').value;
        showToast('Processing ₹' + amount + ' payment...');
        setTimeout(function () {
            showToast('✅ Payment successful! (Demo)');
            closeUpiModal();
        }, 2000);
    };

    // ========== Form Handlers ==========
    window.processSignup = function (e) {
        e.preventDefault();
        var name = document.getElementById('signupName').value;
        showToast('Welcome, ' + name + '! Account created.');
        closeSignupModal();
    };

    window.processLogin = function (e) {
        e.preventDefault();
        showToast('Welcome back! Login successful.');
        closeLoginModal();
    };

    // ========== Toast Notifications ==========
    /** Holds the auto-hide timeout ID so we can clear it before showing a new toast */
    var toastTimeoutId = null;

    function showToast(message) {
        var toast = document.getElementById('toast');
        var toastMessage = document.getElementById('toastMessage');

        if (toast && toastMessage) {
            // Clear any existing toast timeout to prevent premature dismissal
            if (toastTimeoutId !== null) {
                clearTimeout(toastTimeoutId);
                toastTimeoutId = null;
            }

            toastMessage.textContent = message;
            toast.classList.add('show');

            // Auto-hide after 3 seconds
            toastTimeoutId = setTimeout(function () {
                toast.classList.remove('show');
                toastTimeoutId = null;
            }, 3000);
        }
    }

    // ========== Footer Year ==========
    function initFooterYear() {
        var footerYear = document.getElementById('footerYear');
        if (footerYear) {
            footerYear.textContent = new Date().getFullYear();
        }
    }

    // ========== Smooth Scroll ==========
    window.scrollToSection = function (sectionId) {
        var section = document.getElementById(sectionId);
        if (section) {
            var offset = 80; // navbar height
            var top = section.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({
                top: top,
                behavior: 'smooth'
            });
        }
    };

    // ========== LIST YOUR BUSINESS FORM ==========
    window.processListBusiness = function (e) {
        e.preventDefault();

        var businessName = document.getElementById('lbBusinessName').value.trim();
        var category = document.getElementById('lbCategory').value;
        var city = document.getElementById('lbCity').value.trim();
        var ownerName = document.getElementById('lbOwnerName').value.trim();
        var mobile = document.getElementById('lbMobile').value.trim();
        var email = document.getElementById('lbEmail').value.trim();
        var plan = document.getElementById('lbPlan').value;

        // Validation
        if (!businessName || !category || !city || !ownerName || !mobile) {
            showToast('Please fill in all required fields.');
            return;
        }

        // Validate mobile (10 digits)
        var mobileDigits = mobile.replace(/\D/g, '');
        if (mobileDigits.length !== 10 || !/^[6-9]/.test(mobileDigits)) {
            showToast('Please enter a valid 10-digit Indian mobile number.');
            return;
        }

        // Validate email if provided
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address.');
            return;
        }

        // Show loading state
        var submitBtn = document.querySelector('#listBusinessForm button[type="submit"]');
        var originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '&#9203; Submitting...';
        submitBtn.classList.add('btn-loading');

        // Simulate submission
        setTimeout(function () {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            submitBtn.classList.remove('btn-loading');

            var planLabel = plan === 'free' ? 'Free' : plan === 'pro' ? 'Business Pro' : 'Enterprise';
            showToast('&#127881; Listing request submitted for "' + businessName + '" (' + planLabel + '). We\'ll contact you within 24 hours!');

            document.getElementById('listBusinessForm').reset();
        }, 2000);
    };

    // Mobile number formatting for LB form
    var lbMobileInput = document.getElementById('lbMobile');
    if (lbMobileInput) {
        lbMobileInput.addEventListener('input', function () {
            var digits = this.value.replace(/\D/g, '');
            if (digits.length > 10) digits = digits.slice(0, 10);
            var formatted = digits;
            if (digits.length > 5) {
                formatted = digits.slice(0, 5) + ' ' + digits.slice(5);
            }
            if (this.value !== formatted) {
                this.value = formatted;
            }
        });
    }

})();

// Live stats: replace static counter targets with real numbers from the API.
(function () {
    fetch('/api/stats').then(function (r) { return r.json(); }).then(function (s) {
        var el = document.getElementById('statBusinesses');
        if (el && s.businesses) {
            el.setAttribute('data-target', String(s.businesses));
            if (/^[\d,]+\+?$/.test(el.textContent.trim()) && el.textContent.trim() !== '0') {
                el.textContent = s.businesses.toLocaleString() + '+';
            }
        }
    }).catch(function () {});
})();
