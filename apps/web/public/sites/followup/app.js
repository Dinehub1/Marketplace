/**
 * FollowUp CRM - Main Application JavaScript
 * Lead management, pipeline, calendar, analytics, modals, dark mode
 */

// ========== STATE MANAGEMENT ==========
const state = {
  leads: [],
  activities: [],  // Activity log for lead timeline
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  editingId: null,
  selectedPlan: 'pro'
};

// ========== SAMPLE DATA ==========
function loadSampleData() {
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysLater = new Date(today); twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  state.leads = [
    { id: 1, name: 'Rahul Kumar', email: 'rahul@techventures.in', phone: '+91 98765 43210', company: 'TechVentures', source: 'website', status: 'hot', value: 150000, followup: formatDate(tomorrow), notes: 'Interested in enterprise plan. Schedule demo.' },
    { id: 2, name: 'Priya Sharma', email: 'priya@growthhackers.com', phone: '+91 87654 32109', company: 'GrowthHackers', source: 'referral', status: 'warm', value: 75000, followup: formatDate(nextWeek), notes: 'Evaluating competitors. Send comparison sheet.' },
    { id: 3, name: 'Amit Joshi', email: 'amit@startuphub.io', phone: '+91 76543 21098', company: 'StartupHub', source: 'social', status: 'hot', value: 200000, followup: formatDate(twoDaysLater), notes: 'Ready to sign. Needs invoice.' },
    { id: 4, name: 'Sneha Patel', email: 'sneha@digitalfirst.co', phone: '+91 65432 10987', company: 'DigitalFirst', source: 'cold-call', status: 'cold', value: 30000, followup: formatDate(yesterday), notes: 'Budget constraints. Follow up next quarter.' },
    { id: 5, name: 'Vikram Singh', email: 'vikram@megacorp.in', phone: '+91 54321 09876', company: 'MegaCorp', source: 'event', status: 'closed', value: 500000, followup: '', notes: 'Deal closed! Onboard next week.' },
    { id: 6, name: 'Anita Desai', email: 'anita@retailplus.com', phone: '+91 43210 98765', company: 'RetailPlus', source: 'email', status: 'warm', value: 95000, followup: formatDate(tomorrow), notes: 'Wants custom integration. Send proposal.' },
    { id: 7, name: 'Karan Mehta', email: 'karan@fintechlabs.io', phone: '+91 32109 87654', company: 'FinTech Labs', source: 'ads', status: 'hot', value: 350000, followup: formatDate(twoDaysLater), notes: 'CTO approved. Legal review in progress.' },
    { id: 8, name: 'Deepa Nair', email: 'deepa@eduplus.org', phone: '+91 21098 76543', company: 'EduPlus', source: 'website', status: 'cold', value: 45000, followup: formatDate(nextWeek), notes: 'Academic pricing needed.' }
  ];

  // Seed sample activity timeline for demo purposes
  state.activities = [
    { leadId: 1, type: 'create', message: 'Lead created', timestamp: '2026-06-18 09:30' },
    { leadId: 1, type: 'followup', message: 'Follow-up scheduled for ' + formatDisplayDate(formatDate(tomorrow)), timestamp: '2026-06-18 09:31' },
    { leadId: 1, type: 'status', message: 'Status changed from Warm to Hot', timestamp: '2026-06-19 14:20' },
    { leadId: 1, type: 'edit', message: 'Deal value updated to Rs.1,50,000', timestamp: '2026-06-19 14:21' },
    { leadId: 2, type: 'create', message: 'Lead created', timestamp: '2026-06-17 11:00' },
    { leadId: 2, type: 'followup', message: 'Follow-up scheduled for ' + formatDisplayDate(formatDate(nextWeek)), timestamp: '2026-06-17 11:02' },
    { leadId: 3, type: 'create', message: 'Lead created', timestamp: '2026-06-19 16:45' },
    { leadId: 3, type: 'status', message: 'Status changed from Cold to Hot', timestamp: '2026-06-20 10:00' },
    { leadId: 3, type: 'edit', message: 'Deal value updated to Rs.2,00,000', timestamp: '2026-06-20 10:01' },
    { leadId: 5, type: 'create', message: 'Lead created', timestamp: '2026-06-10 08:00' },
    { leadId: 5, type: 'status', message: 'Status changed from Hot to Closed', timestamp: '2026-06-15 17:30' },
    { leadId: 5, type: 'edit', message: 'Deal value updated to Rs.5,00,000', timestamp: '2026-06-15 17:31' },
    { leadId: 7, type: 'create', message: 'Lead created', timestamp: '2026-06-20 12:00' },
    { leadId: 7, type: 'status', message: 'Status changed from Warm to Hot', timestamp: '2026-06-21 09:15' }
  ];
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// ========== LOCALSTORAGE PERSISTENCE ==========
/**
 * Save leads and activities to localStorage so data survives page refreshes.
 * Called automatically after every add/edit/delete mutation.
 */
function saveState() {
  try {
    localStorage.setItem('followup_leads', JSON.stringify(state.leads));
    localStorage.setItem('followup_activities', JSON.stringify(state.activities));
  } catch (e) {
    // localStorage may be full or unavailable in private browsing — fail silently
    console.warn('FollowUp CRM: Could not save state to localStorage', e);
  }
}

/**
 * Load leads and activities from localStorage.
 * If nothing is stored yet (first visit), falls back to sample data.
 * Returns true if restored from localStorage, false if sample data was used.
 */
function loadState() {
  try {
    var savedLeads = localStorage.getItem('followup_leads');
    var savedActivities = localStorage.getItem('followup_activities');
    if (savedLeads) {
      state.leads = JSON.parse(savedLeads);
      if (savedActivities) {
        state.activities = JSON.parse(savedActivities);
      }
      return true;
    }
  } catch (e) {
    console.warn('FollowUp CRM: Could not read state from localStorage, using sample data', e);
  }
  // No saved data or parse error — load sample data for first-time visitors
  loadSampleData();
  return false;
}

// ========== ACTIVITY LOGGING ==========
// Each activity: { leadId, type, message, timestamp }
// Types: 'create', 'edit', 'delete', 'status', 'followup', 'note'
function logActivity(leadId, type, message) {
  var now = new Date();
  var ts = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0');
  state.activities.push({ leadId: leadId, type: type, message: message, timestamp: ts });
  // Keep max 200 activities to avoid memory bloat
  if (state.activities.length > 200) {
    state.activities = state.activities.slice(-200);
  }
}

// ========== DOM ELEMENTS ==========
const els = {
  navToggle: document.getElementById('navToggle'),
  navMenu: document.getElementById('navMenu'),
  themeToggle: document.getElementById('themeToggle'),
  leadSearch: document.getElementById('leadSearch'),
  leadFilter: document.getElementById('leadFilter'),
  leadSort: document.getElementById('leadSort'),
  leadsTableBody: document.getElementById('leadsTableBody'),
  leadsCards: document.getElementById('leadsCards'),
  leadModal: document.getElementById('leadModal'),
  leadForm: document.getElementById('leadForm'),
  modalTitle: document.getElementById('modalTitle'),
  modalClose: document.getElementById('modalClose'),
  modalCancel: document.getElementById('modalCancel'),
  openAddLead: document.getElementById('openAddLead'),
  navAddLead: document.getElementById('navAddLead'),
  paymentModal: document.getElementById('paymentModal'),
  paymentClose: document.getElementById('paymentClose'),
  payNowBtn: document.getElementById('payNowBtn'),
  copyUpiBtn: document.getElementById('copyUpiBtn'),
  totalLeads: document.getElementById('totalLeads'),
  hotLeads: document.getElementById('hotLeads'),
  pendingFollowups: document.getElementById('pendingFollowups'),
  closedDeals: document.getElementById('closedDeals'),
  pipelineBoard: document.getElementById('pipelineBoard'),
  calGrid: document.getElementById('calGrid'),
  calMonth: document.getElementById('calMonth'),
  calPrev: document.getElementById('calPrev'),
  calNext: document.getElementById('calNext'),
  followupItems: document.getElementById('followupItems'),
  funnelChart: document.getElementById('funnelChart'),
  revenueChart: document.getElementById('revenueChart'),
  sourceChart: document.getElementById('sourceChart'),
  teamList: document.getElementById('teamList'),
  ctaSubmit: document.getElementById('ctaSubmit'),
  ctaEmail: document.getElementById('ctaEmail'),
  toastContainer: document.getElementById('toastContainer'),
  fabAddLead: document.getElementById('fabAddLead'),
  totalRevenue: document.getElementById('totalRevenue'),
  avgDealSize: document.getElementById('avgDealSize'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  leadSourceFilter: document.getElementById('leadSourceFilter'),
  // Detail modal elements
  detailModal: document.getElementById('leadDetailModal'),
  detailModalClose: document.getElementById('detailModalClose'),
  detailAvatar: document.getElementById('detailAvatar'),
  detailName: document.getElementById('detailName'),
  detailCompany: document.getElementById('detailCompany'),
  detailStatusBadge: document.getElementById('detailStatusBadge'),
  detailEmail: document.getElementById('detailEmail'),
  detailPhone: document.getElementById('detailPhone'),
  detailValue: document.getElementById('detailValue'),
  detailFollowup: document.getElementById('detailFollowup'),
  detailNotes: document.getElementById('detailNotes'),
  detailSource: document.getElementById('detailSource'),
  detailEditBtn: document.getElementById('detailEditBtn'),
  detailDeleteBtn: document.getElementById('detailDeleteBtn'),
  detailTimeline: document.getElementById('detailTimeline'),
  detailExportTimeline: document.getElementById('detailExportTimeline')
};

// ========== NAVIGATION ==========
function initNavigation() {
  // Null guards: these elements may not exist on all pages
  if (els.navToggle && els.navMenu) {
    els.navToggle.addEventListener('click', function() {
      els.navMenu.classList.toggle('open');
      var isExpanded = els.navMenu.classList.contains('open');
      this.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    });
  }

  var links = document.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function() {
      if (els.navMenu) els.navMenu.classList.remove('open');
      if (els.navToggle) els.navToggle.setAttribute('aria-expanded', 'false');
      var allLinks = document.querySelectorAll('.nav-link');
      for (var j = 0; j < allLinks.length; j++) {
        allLinks[j].classList.remove('active');
      }
      this.classList.add('active');
    });
  }

  window.addEventListener('scroll', function() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// ========== DARK MODE ==========
function initDarkMode() {
  if (!els.themeToggle) return; // Not all pages have the theme toggle
  var saved = localStorage.getItem('followup_theme') || localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.setAttribute('data-theme', 'dark');
    els.themeToggle.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
  }

  els.themeToggle.addEventListener('click', function() {
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      this.innerHTML = '<i class="fas fa-moon" aria-hidden="true"></i>';
      localStorage.setItem('followup_theme', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.innerHTML = '<i class="fas fa-sun" aria-hidden="true"></i>';
      localStorage.setItem('followup_theme', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  });
}

// ========== LEAD MANAGEMENT ==========
function initLeadManagement() {
  // Null guard: these elements only exist on index.html, not on pricing.html
  if (!els.openAddLead || !els.leadModal) return;

  els.openAddLead.addEventListener('click', function() { openLeadModal(); });
  if (els.navAddLead) els.navAddLead.addEventListener('click', function() { openLeadModal(); });
  var filterAddBtn = document.getElementById('openAddLeadFilter');
  if (filterAddBtn) filterAddBtn.addEventListener('click', function() { openLeadModal(); });
  els.modalClose.addEventListener('click', closeLeadModal);
  els.modalCancel.addEventListener('click', closeLeadModal);

  els.leadModal.addEventListener('click', function(e) {
    if (e.target === els.leadModal) closeLeadModal();
  });

  els.leadForm.addEventListener('submit', handleLeadSubmit);

  els.leadSearch.addEventListener('input', renderLeads);
  els.leadFilter.addEventListener('change', renderLeads);
  if (els.leadSourceFilter) els.leadSourceFilter.addEventListener('change', renderLeads);
  els.leadSort.addEventListener('change', renderLeads);
}

function openLeadModal(lead) {
  lead = lead || null;
  state.editingId = lead ? lead.id : null;
  els.modalTitle.textContent = lead ? 'Edit Lead' : 'Add New Lead';

  if (lead) {
    document.getElementById('leadId').value = lead.id;
    document.getElementById('leadName').value = lead.name;
    document.getElementById('leadEmail').value = lead.email;
    document.getElementById('leadPhone').value = lead.phone || '';
    document.getElementById('leadCompany').value = lead.company || '';
    document.getElementById('leadSource').value = lead.source || '';
    document.getElementById('leadStatus').value = lead.status;
    document.getElementById('leadValue').value = lead.value || '';
    document.getElementById('leadFollowup').value = lead.followup || '';
    document.getElementById('leadNotes').value = lead.notes || '';
  } else {
    els.leadForm.reset();
    document.getElementById('leadId').value = '';
  }

  els.leadModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLeadModal() {
  els.leadModal.classList.remove('active');
  document.body.style.overflow = '';
  state.editingId = null;
}

// ========== LEAD DETAIL MODAL ==========
var detailLeadId = null;

function initLeadDetailModal() {
  if (!els.detailModal) return;

  els.detailModalClose.addEventListener('click', closeDetailModal);
  els.detailModal.addEventListener('click', function(e) {
    if (e.target === els.detailModal) closeDetailModal();
  });

  els.detailEditBtn.addEventListener('click', function() {
    if (detailLeadId) {
      closeDetailModal();
      editLead(detailLeadId);
    }
  });

  els.detailDeleteBtn.addEventListener('click', function() {
    if (detailLeadId) {
      closeDetailModal();
      deleteLead(detailLeadId);
    }
  });

  // Export timeline button
  if (els.detailExportTimeline) {
    els.detailExportTimeline.addEventListener('click', function() {
      if (detailLeadId) exportLeadTimeline(detailLeadId);
    });
  }
}

function openDetailModal(id) {
  // Find the lead
  var lead = null;
  for (var i = 0; i < state.leads.length; i++) {
    if (state.leads[i].id === id) {
      lead = state.leads[i];
      break;
    }
  }
  if (!lead) return;

  detailLeadId = lead.id;

  // Avatar initials
  var initials = lead.name.split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2).toUpperCase();
  els.detailAvatar.textContent = initials;

  // Basic info
  els.detailName.textContent = lead.name;
  els.detailCompany.textContent = lead.company || '—';

  // Status badge
  var statusLabel = lead.status.charAt(0).toUpperCase() + lead.status.slice(1);
  els.detailStatusBadge.textContent = statusLabel;
  els.detailStatusBadge.className = 'status-badge status-' + lead.status;

  // Contact info
  els.detailEmail.textContent = lead.email || '—';
  els.detailPhone.textContent = lead.phone || '—';

  // Lead source
  var sourceLabels = {
    'website': 'Website',
    'referral': 'Referral',
    'social': 'Social Media',
    'email': 'Email Campaign',
    'cold-call': 'Cold Call',
    'event': 'Event / Trade Show',
    'ads': 'Paid Ads',
    'other': 'Other'
  };
  if (els.detailSource) {
    els.detailSource.textContent = sourceLabels[lead.source] || lead.source || '—';
  }

  // Value
  els.detailValue.textContent = 'Rs.' + (lead.value || 0).toLocaleString();

  // Follow-up
  els.detailFollowup.textContent = lead.followup ? formatDisplayDate(lead.followup) : 'Not scheduled';

  // Notes
  els.detailNotes.textContent = lead.notes || 'No notes for this lead.';

  // Render activity timeline
  renderActivityTimeline();

  els.detailModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeDetailModal() {
  if (els.detailModal) {
    els.detailModal.classList.remove('active');
    document.body.style.overflow = '';
  }
  detailLeadId = null;
}

/**
 * Export the activity timeline for a specific lead as a CSV file.
 * Gathers all activities for the lead, sorts newest first,
 * and triggers a download with a lead-specific filename.
 */
function exportLeadTimeline(leadId) {
  // Gather activities for this lead
  var leadActivities = [];
  for (var i = 0; i < state.activities.length; i++) {
    if (state.activities[i].leadId === leadId) {
      leadActivities.push(state.activities[i]);
    }
  }

  if (leadActivities.length === 0) {
    showToast('No activities to export for this lead.', 'info');
    return;
  }

  // Sort newest first
  leadActivities.sort(function(a, b) {
    return b.timestamp.localeCompare(a.timestamp);
  });

  // Find lead name for the filename
  var leadName = 'lead';
  for (var j = 0; j < state.leads.length; j++) {
    if (state.leads[j].id === leadId) {
      leadName = state.leads[j].name.replace(/[^a-zA-Z0-9]/g, '_');
      break;
    }
  }

  // CSV header
  var headers = ['Date/Time', 'Type', 'Description'];
  var csvLines = [];
  csvLines.push(headers.join(','));

  // Activity type labels (match those in activityTypeConfig)
  var typeLabels = {
    'create': 'Lead Created',
    'edit': 'Updated',
    'delete': 'Deleted',
    'status': 'Status Change',
    'followup': 'Follow-up',
    'note': 'Note'
  };

  for (var k = 0; k < leadActivities.length; k++) {
    var act = leadActivities[k];
    var row = [
      csvEscape(act.timestamp),
      csvEscape(typeLabels[act.type] || act.type),
      csvEscape(act.message)
    ];
    csvLines.push(row.join(','));
  }

  var csvContent = csvLines.join('\n');

  // Add UTF-8 BOM for Excel compatibility
  var blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);

  // Generate filename with lead name and date
  var now = new Date();
  var dateStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
  var filename = 'followup_timeline_' + leadName + '_' + dateStr + '.csv';

  // Trigger download
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Exported ' + leadActivities.length + ' activities for ' + leadName.replace(/_/g, ' '), 'success');
}

// ========== ACTIVITY TIMELINE ==========
// Activity type config: icon class, color, label suffix
var activityTypeConfig = {
  'create':    { icon: 'fa-user-plus',    color: '#6366f1', label: 'Lead Created' },
  'edit':      { icon: 'fa-edit',         color: '#3b82f6', label: 'Updated' },
  'delete':    { icon: 'fa-trash',        color: '#ef4444', label: 'Deleted' },
  'status':    { icon: 'fa-exchange-alt',  color: '#f59e0b', label: 'Status Change' },
  'followup':  { icon: 'fa-calendar-alt', color: '#10b981', label: 'Follow-up' },
  'note':      { icon: 'fa-sticky-note',  color: '#8b5cf6', label: 'Note' }
};

/**
 * Render the activity timeline for the lead currently shown in the detail modal.
 * Called by openDetailModal() after all other detail fields are populated.
 */
function renderActivityTimeline() {
  var container = els.detailTimeline;
  if (!container) return;

  // Gather activities for this lead, sorted newest first
  var leadActivities = [];
  for (var i = 0; i < state.activities.length; i++) {
    if (state.activities[i].leadId === detailLeadId) {
      leadActivities.push(state.activities[i]);
    }
  }
  leadActivities.sort(function(a, b) {
    return b.timestamp.localeCompare(a.timestamp);
  });

  if (leadActivities.length === 0) {
    container.innerHTML = '<div class="timeline-empty">No activity recorded yet. Edit this lead to see changes here.</div>';
    return;
  }

  var html = '<div class="timeline-list">';
  for (var j = 0; j < leadActivities.length; j++) {
    var act = leadActivities[j];
    var cfg = activityTypeConfig[act.type] || { icon: 'fa-circle', color: '#64748b', label: 'Activity' };
    var msg = escapeHtml(act.message);
    var ts = escapeHtml(formatTimestamp(act.timestamp));

    html += '<div class="timeline-item">';
    html += '<div class="timeline-dot" style="background:' + cfg.color + ';border-color:' + cfg.color + '">';
    html += '<i class="fas ' + cfg.icon + '"></i></div>';
    html += '<div class="timeline-content">';
    html += '<div class="timeline-header"><span class="timeline-type" style="color:' + cfg.color + '">' + cfg.label + '</span>';
    html += '<span class="timeline-time">' + ts + '</span></div>';
    html += '<div class="timeline-message">' + msg + '</div>';
    html += '</div></div>';
  }
  html += '</div>';

  container.innerHTML = html;
}

/**
 * Format a timestamp string (YYYY-MM-DD HH:MM) into a readable format.
 */
function formatTimestamp(ts) {
  if (!ts) return '';
  // Parse "YYYY-MM-DD HH:MM"
  var parts = ts.split(' ');
  if (parts.length < 2) return ts;
  var dateParts = parts[0].split('-');
  var timeParts = parts[1].split(':');
  if (dateParts.length < 3 || timeParts.length < 2) return ts;

  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var monthIdx = parseInt(dateParts[1], 10) - 1;
  var monthName = (monthIdx >= 0 && monthIdx < 12) ? months[monthIdx] : '';
  var day = parseInt(dateParts[2], 10);
  var hour = parseInt(timeParts[0], 10);
  var min = timeParts[1];
  var ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return monthName + ' ' + day + ' at ' + hour + ':' + min + ' ' + ampm;
}

function handleLeadSubmit(e) {
  e.preventDefault();

  var lead = {
    id: state.editingId || Date.now(),
    name: document.getElementById('leadName').value.trim(),
    email: document.getElementById('leadEmail').value.trim(),
    phone: document.getElementById('leadPhone').value.trim(),
    company: document.getElementById('leadCompany').value.trim(),
    source: document.getElementById('leadSource').value,
    status: document.getElementById('leadStatus').value,
    value: parseInt(document.getElementById('leadValue').value) || 0,
    followup: document.getElementById('leadFollowup').value,
    notes: document.getElementById('leadNotes').value.trim()
  };

  if (state.editingId) {
    // Find old lead to detect changes
    var oldLead = null;
    for (var i = 0; i < state.leads.length; i++) {
      if (state.leads[i].id === state.editingId) {
        oldLead = state.leads[i];
        state.leads[i] = lead;
        break;
      }
    }
    // Log activity: track what changed
    if (oldLead) {
      if (oldLead.status !== lead.status) {
        var sFrom = oldLead.status.charAt(0).toUpperCase() + oldLead.status.slice(1);
        var sTo = lead.status.charAt(0).toUpperCase() + lead.status.slice(1);
        logActivity(lead.id, 'status', 'Status changed from ' + sFrom + ' to ' + sTo);
      }
      if (oldLead.value !== lead.value) {
        logActivity(lead.id, 'edit', 'Deal value updated to Rs.' + lead.value.toLocaleString());
      }
      if (oldLead.followup !== lead.followup) {
        var fuDisplay = lead.followup ? formatDisplayDate(lead.followup) : 'none';
        logActivity(lead.id, 'followup', 'Follow-up rescheduled to ' + fuDisplay);
      }
      logActivity(lead.id, 'edit', 'Lead details updated');
    }
    showToast('Lead updated successfully!', 'success');
    saveState();
  } else {
    state.leads.push(lead);
    logActivity(lead.id, 'create', 'Lead created');
    if (lead.followup) {
      logActivity(lead.id, 'followup', 'Follow-up scheduled for ' + formatDisplayDate(lead.followup));
    }
    showToast('Lead added successfully!', 'success');
    saveState();
  }

  closeLeadModal();
  renderAll();
}

function deleteLead(id) {
  // Find lead name before deleting for activity log
  var leadName = '';
  for (var j = 0; j < state.leads.length; j++) {
    if (state.leads[j].id === id) { leadName = state.leads[j].name; break; }
  }
  if (confirm('Are you sure you want to delete this lead?')) {
    var newLeads = [];
    for (var i = 0; i < state.leads.length; i++) {
      if (state.leads[i].id !== id) newLeads.push(state.leads[i]);
    }
    state.leads = newLeads;
    logActivity(id, 'delete', 'Lead "' + leadName + '" was deleted');
    saveState();
    showToast('Lead deleted.', 'info');
    renderAll();
  }
}

function editLead(id) {
  for (var i = 0; i < state.leads.length; i++) {
    if (state.leads[i].id === id) {
      openLeadModal(state.leads[i]);
      return;
    }
  }
}

// ========== RENDERING ==========
function renderAll() {
  // Only render dashboard elements if they exist (not on pricing.html)
  if (els.totalLeads) {
    renderSummary();
    renderLeads();
    renderPipeline();
    renderCalendar();
    renderAnalytics();
  }
}

function renderSummary() {
  var total = state.leads.length;
  var hot = 0, pending = 0, overdue = 0, closed = 0;
  var totalRevenue = 0;
  var today = formatDate(new Date());
  for (var i = 0; i < state.leads.length; i++) {
    if (state.leads[i].status === 'hot') hot++;
    if (state.leads[i].status === 'closed') closed++;
    totalRevenue += state.leads[i].value || 0;
    // Only count follow-ups for non-closed leads
    if (state.leads[i].followup && state.leads[i].status !== 'closed') {
      if (state.leads[i].followup < today) {
        overdue++;  // Follow-up date has passed
      } else {
        pending++;  // Today or future follow-up
      }
    }
  }
  animateNumber(els.totalLeads, total);
  animateNumber(els.hotLeads, hot);
  animateNumber(els.pendingFollowups, pending);
  animateNumber(els.closedDeals, closed);

  // Overdue follow-ups count (if element exists)
  var overdueEl = document.getElementById('overdueFollowups');
  if (overdueEl) animateNumber(overdueEl, overdue);

  // Pipeline value
  if (els.totalRevenue) {
    var revEl = els.totalRevenue;
    var currentRev = parseInt(revEl.textContent.replace(/[^0-9]/g, '')) || 0;
    animateCurrency(revEl, currentRev, totalRevenue, 'Rs.');
  }

  // Average deal size
  if (els.avgDealSize) {
    var avgEl = els.avgDealSize;
    var avg = total > 0 ? Math.round(totalRevenue / total) : 0;
    var currentAvg = parseInt(avgEl.textContent.replace(/[^0-9]/g, '')) || 0;
    animateCurrency(avgEl, currentAvg, avg, 'Rs.');
  }
}

function animateCurrency(el, current, target, prefix) {
  if (current === target) { el.textContent = prefix + target.toLocaleString(); return; }
  var step = Math.max(1000, Math.floor(Math.abs(target - current) / 10));
  var val = current;
  var direction = target > current ? 1 : -1;
  var interval = setInterval(function() {
    val += step * direction;
    if ((direction > 0 && val >= target) || (direction < 0 && val <= target)) {
      val = target;
      clearInterval(interval);
    }
    el.textContent = prefix + val.toLocaleString();
  }, 30);
}

function animateNumber(el, target) {
  var current = parseInt(el.textContent) || 0;
  if (current === target) { el.textContent = target; return; }
  var step = Math.max(1, Math.floor(Math.abs(target - current) / 10));
  var val = current;
  var direction = target > current ? 1 : -1;
  var interval = setInterval(function() {
    val += step * direction;
    if ((direction > 0 && val >= target) || (direction < 0 && val <= target)) {
      val = target;
      clearInterval(interval);
    }
    el.textContent = val;
  }, 30);
}

function getFilteredLeads() {
  var leads = state.leads.slice();

  var query = els.leadSearch.value.toLowerCase();
  if (query) {
    var filtered = [];
    for (var i = 0; i < leads.length; i++) {
      var l = leads[i];
      if (l.name.toLowerCase().indexOf(query) !== -1 ||
          l.email.toLowerCase().indexOf(query) !== -1 ||
          (l.company && l.company.toLowerCase().indexOf(query) !== -1) ||
          (l.source && l.source.toLowerCase().indexOf(query) !== -1)) {
        filtered.push(l);
      }
    }
    leads = filtered;
  }

  var filter = els.leadFilter.value;
  if (filter !== 'all') {
    var filtered2 = [];
    for (var j = 0; j < leads.length; j++) {
      if (leads[j].status === filter) filtered2.push(leads[j]);
    }
    leads = filtered2;
  }

  // Source filter
  var sourceFilter = els.leadSourceFilter ? els.leadSourceFilter.value : 'all';
  if (sourceFilter !== 'all') {
    var filtered3 = [];
    for (var k = 0; k < leads.length; k++) {
      if (leads[k].source === sourceFilter) filtered3.push(leads[k]);
    }
    leads = filtered3;
  }

  var sort = els.leadSort.value;
  if (sort === 'oldest') {
    leads.sort(function(a, b) { return a.id - b.id; });
  } else if (sort === 'name') {
    leads.sort(function(a, b) { return a.name.localeCompare(b.name); });
  } else if (sort === 'value') {
    leads.sort(function(a, b) { return b.value - a.value; });
  } else {
    leads.sort(function(a, b) { return b.id - a.id; });
  }

  return leads;
}

function renderLeads() {
  var leads = getFilteredLeads();

  // Results count display
  var leadsCountEl = document.getElementById('leadsCount');
  if (leadsCountEl) leadsCountEl.textContent = leads.length + ' lead' + (leads.length !== 1 ? 's' : '');

  // Check if any filters are active
  var hasActiveFilters = (els.leadSearch.value) ||
    (els.leadFilter && els.leadFilter.value !== 'all') ||
    (els.leadSourceFilter && els.leadSourceFilter.value !== 'all');

  var clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) clearBtn.style.display = hasActiveFilters ? 'inline-flex' : 'none';

  // Empty state handling
  var emptyState = document.getElementById('leadsEmptyState');
  var tableWrapper = document.getElementById('leadsTableWrapper');

  if (leads.length === 0) {
    // Show empty state, hide table
    if (emptyState) {
      emptyState.style.display = 'block';
      emptyState.style.textAlign = 'center';
      emptyState.style.padding = '3rem 1rem';
    }
    if (tableWrapper) tableWrapper.style.display = 'none';
    if (els.leadsCards) els.leadsCards.style.display = 'none';
    return; // Skip rendering table/cards
  }

  // Hide empty state, show table
  if (emptyState) emptyState.style.display = 'none';
  if (tableWrapper) tableWrapper.style.display = '';

  // Desktop table
  var tableHtml = '';
  for (var i = 0; i < leads.length; i++) {
    var lead = leads[i];
    var initials = escapeHtml(lead.name.split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2));
    var statusText = escapeHtml(lead.status.charAt(0).toUpperCase() + lead.status.slice(1));
    var followupDisplay = lead.followup ? formatDisplayDate(lead.followup) : '-';
    var nameEsc = escapeHtml(lead.name);
    var emailEsc = escapeHtml(lead.email);
    var companyEsc = escapeHtml(lead.company || '-');
    tableHtml += '<tr>';
    tableHtml += '<td><div class="lead-info"><div class="lead-avatar">' + initials + '</div>';
    tableHtml += '<div><div class="lead-name"><a href="#" class="lead-name-link" onclick="openDetailModal(' + lead.id + ');return false;">' + nameEsc + '</a></div><div class="lead-email">' + emailEsc + '</div></div></div></td>';
    tableHtml += '<td>' + companyEsc + '</td>';
    tableHtml += '<td><span class="status-badge status-' + lead.status + '">' + statusText + '</span></td>';
    tableHtml += '<td>Rs.' + lead.value.toLocaleString() + '</td>';
    tableHtml += '<td>' + followupDisplay + '</td>';
    tableHtml += '<td><div class="table-actions">';
    tableHtml += '<button class="btn btn-sm btn-primary" onclick="editLead(' + lead.id + ')" aria-label="Edit"><i class="fas fa-edit"></i></button>';
    tableHtml += '<button class="btn btn-sm btn-danger" onclick="deleteLead(' + lead.id + ')" aria-label="Delete"><i class="fas fa-trash"></i></button>';
    tableHtml += '</div></td></tr>';
  }
  els.leadsTableBody.innerHTML = tableHtml;

  // Mobile cards
  var cardsHtml = '';
  for (var j = 0; j < leads.length; j++) {
    var l = leads[j];
    var init = escapeHtml(l.name.split(' ').map(function(n) { return n[0]; }).join('').substring(0, 2));
    var st = escapeHtml(l.status.charAt(0).toUpperCase() + l.status.slice(1));
    var fu = l.followup ? formatDisplayDate(l.followup) : '-';
    var lNameEsc = escapeHtml(l.name);
    var lEmailEsc = escapeHtml(l.email);
    var lCompanyEsc = escapeHtml(l.company || '-');
    var lSourceEsc = escapeHtml(l.source ? (l.source.charAt(0).toUpperCase() + l.source.slice(1)) : '-');
    cardsHtml += '<div class="lead-card">';
    cardsHtml += '<div class="lead-card-header"><div class="lead-avatar">' + init + '</div>';
    cardsHtml += '<div><div class="lead-name"><a href="#" class="lead-name-link" onclick="openDetailModal(' + l.id + ');return false;">' + lNameEsc + '</a></div><div class="lead-email">' + lEmailEsc + '</div></div></div>';
    cardsHtml += '<div class="lead-card-body">';
    cardsHtml += '<p><strong>Company:</strong> ' + lCompanyEsc + '</p>';
    cardsHtml += '<p><strong>Source:</strong> ' + lSourceEsc + '</p>';
    cardsHtml += '<p><strong>Status:</strong> <span class="status-badge status-' + l.status + '">' + st + '</span></p>';
    cardsHtml += '<p><strong>Value:</strong> Rs.' + l.value.toLocaleString() + '</p>';
    cardsHtml += '<p><strong>Follow-up:</strong> ' + fu + '</p></div>';
    cardsHtml += '<div class="lead-card-actions">';
    cardsHtml += '<button class="btn btn-sm btn-primary" onclick="editLead(' + l.id + ')"><i class="fas fa-edit"></i> Edit</button>';
    cardsHtml += '<button class="btn btn-sm btn-danger" onclick="deleteLead(' + l.id + ')"><i class="fas fa-trash"></i> Delete</button>';
    cardsHtml += '</div></div>';
  }
  els.leadsCards.innerHTML = cardsHtml;
}

// ========== CLEAR FILTERS ==========
function clearAllFilters() {
  els.leadSearch.value = '';
  els.leadFilter.value = 'all';
  if (els.leadSourceFilter) els.leadSourceFilter.value = 'all';
  renderLeads();
}

function initClearFilters() {
  var clearBtn = document.getElementById('clearFiltersBtn');
  var emptyClearBtn = document.getElementById('emptyClearFiltersBtn');
  if (clearBtn) clearBtn.addEventListener('click', clearAllFilters);
  if (emptyClearBtn) emptyClearBtn.addEventListener('click', clearAllFilters);
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '-';
  var d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ========== PIPELINE ==========
function renderPipeline() {
  var stages = [
    { key: 'cold', label: 'New Leads', color: '#3b82f6' },
    { key: 'warm', label: 'Contacted', color: '#f59e0b' },
    { key: 'hot', label: 'Qualified', color: '#ef4444' },
    { key: 'closed', label: 'Closed', color: '#10b981' }
  ];

  var html = '';
  for (var s = 0; s < stages.length; s++) {
    var stage = stages[s];
    var stageLeads = [];
    for (var i = 0; i < state.leads.length; i++) {
      if (state.leads[i].status === stage.key) stageLeads.push(state.leads[i]);
    }

    html += '<div class="pipeline-column">';
    html += '<div class="pipeline-col-header">';
    html += '<span class="pipeline-col-title" style="color:' + stage.color + '">' + stage.label + '</span>';
    html += '<span class="pipeline-count">' + stageLeads.length + '</span></div>';

    for (var j = 0; j < stageLeads.length; j++) {
      var lead = stageLeads[j];
      var leadNameEsc = escapeHtml(lead.name);
      var leadCompanyEsc = escapeHtml(lead.company || '');
      html += '<div class="pipeline-card" onclick="openDetailModal(' + lead.id + ')" role="button" tabindex="0" aria-label="View lead: ' + leadNameEsc + '" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();openDetailModal(' + lead.id + ');}">';
      html += '<div class="pipeline-card-title">' + leadNameEsc + '</div>';
      html += '<div class="pipeline-card-company">' + leadCompanyEsc + '</div>';
      html += '<div class="pipeline-card-value">Rs.' + lead.value.toLocaleString() + '</div></div>';
    }
    if (stageLeads.length === 0) {
      html += '<div class="pipeline-empty">No leads in this stage</div>';
    }
    html += '</div>';
  }
  els.pipelineBoard.innerHTML = html;
}

// ========== CALENDAR ==========
function renderCalendar() {
  var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var days = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  els.calMonth.textContent = months[state.currentMonth] + ' ' + state.currentYear;

  var firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay();
  var daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate();
  var today = new Date();

  var followupDates = {};
  for (var i = 0; i < state.leads.length; i++) {
    if (state.leads[i].followup) followupDates[state.leads[i].followup] = true;
  }

  var html = '';
  for (var d = 0; d < days.length; d++) {
    html += '<div class="cal-day-header">' + days[d] + '</div>';
  }

  for (var e = 0; e < firstDay; e++) {
    html += '<div class="cal-day empty"></div>';
  }

  for (var day = 1; day <= daysInMonth; day++) {
    var dateStr = state.currentYear + '-' + String(state.currentMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
    var isToday = today.getDate() === day && today.getMonth() === state.currentMonth && today.getFullYear() === state.currentYear;
    var hasEvent = !!followupDates[dateStr];
    var cls = 'cal-day';
    if (isToday) cls += ' today';
    if (hasEvent) cls += ' has-event';
    html += '<div class="' + cls + '">' + day + '</div>';
  }

  els.calGrid.innerHTML = html;

  // Upcoming follow-ups list
  var todayStr = formatDate(new Date());
  var upcoming = [];
  for (var j = 0; j < state.leads.length; j++) {
    if (state.leads[j].followup && state.leads[j].followup >= todayStr) {
      upcoming.push(state.leads[j]);
    }
  }
  upcoming.sort(function(a, b) { return a.followup.localeCompare(b.followup); });

  var listHtml = '';
  var count = Math.min(upcoming.length, 5);
  for (var k = 0; k < count; k++) {
    var lead = upcoming[k];
    var dt = new Date(lead.followup + 'T00:00:00');
    var leadNameEsc = escapeHtml(lead.name);
    var leadCompanyEsc = escapeHtml(lead.company || 'Follow-up');
    listHtml += '<div class="followup-item">';
    listHtml += '<div class="followup-date"><div class="followup-day">' + dt.getDate() + '</div>';
    listHtml += '<div class="followup-month">' + months[dt.getMonth()].substring(0, 3) + '</div></div>';
    listHtml += '<div class="followup-info"><div class="followup-lead">' + leadNameEsc + '</div>';
    listHtml += '<div class="followup-type">' + leadCompanyEsc + '</div></div></div>';
  }
  if (!listHtml) listHtml = '<p style="color:var(--text-muted);font-size:0.9rem">No upcoming follow-ups</p>';
  els.followupItems.innerHTML = listHtml;
}

function initCalendar() {
  // Null guard: calendar elements only exist on index.html
  if (!els.calPrev || !els.calNext) return;

  els.calPrev.addEventListener('click', function() {
    state.currentMonth--;
    if (state.currentMonth < 0) { state.currentMonth = 11; state.currentYear--; }
    renderCalendar();
  });
  els.calNext.addEventListener('click', function() {
    state.currentMonth++;
    if (state.currentMonth > 11) { state.currentMonth = 0; state.currentYear++; }
    renderCalendar();
  });
}

// ========== ANALYTICS ==========
function renderAnalytics() {
  // Funnel
  var totalLeads = state.leads.length;
  var contacted = 0, qualified = 0, closed = 0;
  for (var i = 0; i < state.leads.length; i++) {
    var s = state.leads[i].status;
    if (s !== 'cold') contacted++;
    if (s === 'hot' || s === 'closed') qualified++;
    if (s === 'closed') closed++;
  }
  var stages = [
    { label: 'Total Leads', count: totalLeads, color: '#6366f1' },
    { label: 'Contacted', count: contacted, color: '#8b5cf6' },
    { label: 'Qualified', count: qualified, color: '#a855f7' },
    { label: 'Closed', count: closed, color: '#10b981' }
  ];
  var maxCount = Math.max(totalLeads, contacted, qualified, closed, 1);

  var funnelHtml = '';
  for (var a = 0; a < stages.length; a++) {
    var st = stages[a];
    var pct = (st.count / maxCount) * 100;
    funnelHtml += '<div class="funnel-stage">';
    funnelHtml += '<span class="funnel-label">' + st.label + '</span>';
    funnelHtml += '<div class="funnel-bar-wrap"><div class="funnel-bar" style="width:' + pct + '%;background:' + st.color + '">' + st.count + '</div></div>';
    funnelHtml += '<span class="funnel-value">' + st.count + '</span></div>';
  }
  els.funnelChart.innerHTML = funnelHtml;

  // Revenue bar chart - compute from actual lead data (closed deals by month)
  // Aggregate revenue from leads, grouped by creation month (using id as proxy for time)
  // For sample data, we distribute across months for demo purposes
  var monthNames = ['Jan','Feb','Mar','Apr','May','Jun'];
  var closedLeads = [];
  for (var ri = 0; ri < state.leads.length; ri++) {
    if (state.leads[ri].status === 'closed') closedLeads.push(state.leads[ri]);
  }

  // Calculate revenue: if we have closed leads, distribute their value across 6 months
  // Use a deterministic distribution based on lead id to spread them
  var revenues = [0, 0, 0, 0, 0, 0];
  if (closedLeads.length > 0) {
    for (var ci = 0; ci < closedLeads.length; ci++) {
      var monthIdx = closedLeads[ci].id % 6; // Distribute across 6 months
      revenues[monthIdx] += closedLeads[ci].value || 0;
    }
  } else {
    // Fallback: show a subtle empty-state hint with small placeholder bars
    revenues = [0, 0, 0, 0, 0, 0];
  }

  var maxRev = Math.max.apply(null, revenues) || 100000; // Avoid division by zero

  var barHtml = '';
  for (var b = 0; b < monthNames.length; b++) {
    var height = maxRev > 0 ? (revenues[b] / maxRev) * 120 : 0;
    var barVal = revenues[b] > 0 ? 'Rs.' + Math.round(revenues[b] / 1000) + 'k' : '';
    barHtml += '<div class="bar-group">';
    barHtml += '<span class="bar-value">' + barVal + '</span>';
    barHtml += '<div class="bar" style="height:' + height + 'px"></div>';
    barHtml += '<span class="bar-label">' + monthNames[b] + '</span></div>';
  }
  els.revenueChart.innerHTML = barHtml;

  // Lead sources donut - now computed dynamically below (was previously hardcoded)

  // Build donut chart from actual lead source data
  var sourceColors = { 'website': '#6366f1', 'referral': '#10b981', 'social': '#f59e0b', 'email': '#3b82f6', 'cold-call': '#ef4444', 'event': '#8b5cf6', 'ads': '#ec4899', 'other': '#64748b' };
  var sourceLabels = { 'website': 'Website', 'referral': 'Referral', 'social': 'Social Media', 'email': 'Email Campaign', 'cold-call': 'Cold Call', 'event': 'Event / Trade Show', 'ads': 'Paid Ads', 'other': 'Other' };

  // Count leads by source from actual data
  var sourceCounts = {};
  var totalWithSource = 0;
  for (var i = 0; i < state.leads.length; i++) {
    var src = state.leads[i].source || 'other';
    if (!sourceCounts[src]) sourceCounts[src] = 0;
    sourceCounts[src]++;
    totalWithSource++;
  }

  // If no leads have sources, show placeholder
  if (totalWithSource === 0) {
    els.sourceChart.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:1rem;text-align:center">No lead source data yet</p>';
  } else {
    // Build dynamic sources array sorted by count descending
    var dynamicSources = [];
    for (var srcKey in sourceCounts) {
      dynamicSources.push({
        label: sourceLabels[srcKey] || srcKey,
        count: sourceCounts[srcKey],
        color: sourceColors[srcKey] || '#64748b'
      });
    }
    dynamicSources.sort(function(a, b) { return b.count - a.count; });

    var donutHtml = '<div class="donut-chart-wrap"><svg width="120" height="120" viewBox="0 0 120 120" role="img" aria-label="Lead sources distribution chart">';
    var cumulative = 0;
    var cx = 60, cy = 60, r = 45, holeR = 28;
    for (var d = 0; d < dynamicSources.length; d++) {
      var ds = dynamicSources[d];
      var startAngle = (cumulative / totalWithSource) * 360;
      var endAngle = ((cumulative + ds.count) / totalWithSource) * 360;
      var x1 = cx + r * Math.cos((startAngle - 90) * Math.PI / 180);
      var y1 = cy + r * Math.sin((startAngle - 90) * Math.PI / 180);
      var x2 = cx + r * Math.cos((endAngle - 90) * Math.PI / 180);
      var y2 = cy + r * Math.sin((endAngle - 90) * Math.PI / 180);
      var ix1 = cx + holeR * Math.cos((startAngle - 90) * Math.PI / 180);
      var iy1 = cy + holeR * Math.sin((startAngle - 90) * Math.PI / 180);
      var ix2 = cx + holeR * Math.cos((endAngle - 90) * Math.PI / 180);
      var iy2 = cy + holeR * Math.sin((endAngle - 90) * Math.PI / 180);
      var largeArc = (endAngle - startAngle) > 180 ? 1 : 0;
      // Draw donut segment as a path (outer arc + inner arc reversed)
      donutHtml += '<path d="M' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + largeArc + ',1 ' + x2 + ',' + y2 + ' L' + ix2 + ',' + iy2 + ' A' + holeR + ',' + holeR + ' 0 ' + largeArc + ',0 ' + ix1 + ',' + iy1 + ' Z" fill="' + ds.color + '" stroke="#fff" stroke-width="1"/>';
      cumulative += ds.count;
    }
    donutHtml += '</svg><div class="donut-legend">';
    for (var e = 0; e < dynamicSources.length; e++) {
      var pct = Math.round((dynamicSources[e].count / totalWithSource) * 100);
      donutHtml += '<div class="legend-item"><span class="legend-color" style="background:' + dynamicSources[e].color + '"></span>' + dynamicSources[e].label + ' (' + pct + '%)</div>';
    }
    donutHtml += '</div></div>';
    els.sourceChart.innerHTML = donutHtml;
  }

  // Team performance
  var team = [
    { name: 'Rahul K.', deals: 12, score: 'Rs.18L' },
    { name: 'Priya S.', deals: 9, score: 'Rs.14L' },
    { name: 'Amit J.', deals: 8, score: 'Rs.12L' },
    { name: 'Sneha P.', deals: 6, score: 'Rs.9L' }
  ];
  var teamHtml = '';
  for (var t = 0; t < team.length; t++) {
    var tm = team[t];
    var av = tm.name.split(' ').map(function(n) { return n[0]; }).join('');
    teamHtml += '<div class="team-member">';
    teamHtml += '<div class="team-avatar">' + av + '</div>';
    teamHtml += '<div class="team-info"><div class="team-name">' + tm.name + '</div><div class="team-deals">' + tm.deals + ' deals closed</div></div>';
    teamHtml += '<div class="team-score">' + tm.score + '</div></div>';
  }
  els.teamList.innerHTML = teamHtml;
}

// ========== PAYMENT MODAL ==========
function initPaymentModal() {
  // Open payment modal from pricing buttons
  var pricingBtns = document.querySelectorAll('[data-plan]');
  for (var i = 0; i < pricingBtns.length; i++) {
    pricingBtns[i].addEventListener('click', function() {
      var plan = this.getAttribute('data-plan');
      if (plan === 'free') {
        window.location.href = 'index.html#dashboard';
      } else {
        openPaymentModal(plan);
      }
    });
  }

  // Null guards: these elements only exist on pricing.html
  if (els.paymentClose) {
    els.paymentClose.addEventListener('click', closePaymentModal);
  }
  if (els.paymentModal) {
    els.paymentModal.addEventListener('click', function(e) {
      if (e.target === els.paymentModal) closePaymentModal();
    });
  }

  // Payment tabs
  var tabs = document.querySelectorAll('.payment-tab');
  for (var j = 0; j < tabs.length; j++) {
    tabs[j].addEventListener('click', function() {
      var tabName = this.getAttribute('data-tab');
      var allTabs = document.querySelectorAll('.payment-tab');
      for (var k = 0; k < allTabs.length; k++) {
        allTabs[k].classList.remove('active');
        allTabs[k].setAttribute('aria-selected', 'false');
      }
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');
      var contents = document.querySelectorAll('.payment-content');
      for (var l = 0; l < contents.length; l++) contents[l].classList.remove('active');
      var target = document.getElementById(tabName + 'Content');
      if (target) target.classList.add('active');
    });
  }

  // Pay button — validates form before showing success
  if (els.payNowBtn) {
    els.payNowBtn.addEventListener('click', function() {
      var activeTab = document.querySelector('.payment-tab.active');
      var tabName = activeTab ? activeTab.getAttribute('data-tab') : 'upi';
      var isValid = true;

      if (tabName === 'card') {
        var cardNum = document.getElementById('cardNumber');
        var cardExp = document.getElementById('cardExpiry');
        var cardCvv = document.getElementById('cardCvv');
        var cardName = document.getElementById('cardName');
        // Strip spaces for validation
        var cardNumVal = cardNum ? cardNum.value.replace(/\s/g, '') : '';
        if (!cardNumVal || cardNumVal.length < 13 || cardNumVal.length > 19 || !/^\d+$/.test(cardNumVal)) {
          isValid = false;
          if (cardNum) cardNum.style.borderColor = 'var(--danger)';
        } else if (cardNum) { cardNum.style.borderColor = 'var(--border-color)'; }
        if (!cardExp || !/^\d{2}\/\d{2}$/.test(cardExp.value)) {
          isValid = false;
          if (cardExp) cardExp.style.borderColor = 'var(--danger)';
        } else if (cardExp) { cardExp.style.borderColor = 'var(--border-color)'; }
        if (!cardCvv || cardCvv.value.length < 3 || !/^\d{3,4}$/.test(cardCvv.value)) {
          isValid = false;
          if (cardCvv) cardCvv.style.borderColor = 'var(--danger)';
        } else if (cardCvv) { cardCvv.style.borderColor = 'var(--border-color)'; }
        if (!cardName || cardName.value.trim().length < 2) {
          isValid = false;
          if (cardName) cardName.style.borderColor = 'var(--danger)';
        } else if (cardName) { cardName.style.borderColor = 'var(--border-color)'; }
      }

      if (!isValid) {
        showToast('Please fill in all card details correctly.', 'error');
        return;
      }

      showToast('Payment processed successfully! Welcome to FollowUp CRM ' + state.selectedPlan + ' plan.', 'success');
      closePaymentModal();
    });
  }

  // Card number auto-formatting: insert space every 4 digits
  var cardNumInput = document.getElementById('cardNumber');
  if (cardNumInput) {
    cardNumInput.addEventListener('input', function(e) {
      // Remove non-digits
      var val = this.value.replace(/\D/g, '');
      // Group into chunks of 4, max 19 digits
      val = val.substring(0, 19);
      var formatted = '';
      for (var ci = 0; ci < val.length; ci++) {
        if (ci > 0 && ci % 4 === 0) formatted += ' ';
        formatted += val[ci];
      }
      this.value = formatted;
      // Reset border color on input
      this.style.borderColor = 'var(--border-color)';
    });
  }

  // Card expiry auto-formatting: insert slash after 2 digits
  var cardExpInput = document.getElementById('cardExpiry');
  if (cardExpInput) {
    cardExpInput.addEventListener('input', function(e) {
      var val = this.value.replace(/\D/g, '');
      if (val.length >= 2) {
        val = val.substring(0, 2) + '/' + val.substring(2, 4);
      }
      this.value = val;
      this.style.borderColor = 'var(--border-color)';
    });
  }

  // CVV — digits only, reset border
  var cardCvvInput = document.getElementById('cardCvv');
  if (cardCvvInput) {
    cardCvvInput.addEventListener('input', function(e) {
      this.value = this.value.replace(/\D/g, '').substring(0, 4);
      this.style.borderColor = 'var(--border-color)';
    });
  }

  // Card name — reset border on input
  var cardNameInput = document.getElementById('cardName');
  if (cardNameInput) {
    cardNameInput.addEventListener('input', function(e) {
      this.style.borderColor = 'var(--border-color)';
    });
  }

  // Copy UPI ID button
  if (els.copyUpiBtn) {
    els.copyUpiBtn.addEventListener('click', function() {
      var upiId = document.getElementById('upiIdDisplay').textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(upiId).then(function() {
          showToast('UPI ID copied to clipboard!', 'success');
        }).catch(function() {
          prompt('Copy this UPI ID:', upiId);
        });
      } else {
        prompt('Copy this UPI ID:', upiId);
      }
    });
  }
}

function openPaymentModal(plan) {
  state.selectedPlan = plan;
  var planNames = { pro: 'Pro', enterprise: 'Enterprise' };
  // Support both monthly and annual pricing
  var planPricesMonthly = { pro: 'Rs.499', enterprise: 'Rs.1,999' };
  var planPricesAnnual = { pro: 'Rs.399', enterprise: 'Rs.1,599' };
  var isAnnual = document.getElementById('billingSwitch') && document.getElementById('billingSwitch').classList.contains('annual');
  var priceMap = isAnnual ? planPricesAnnual : planPricesMonthly;
  var price = priceMap[plan] || 'Rs.499';
  var periodLabel = isAnnual ? '/month (billed annually)' : '/month';

  document.getElementById('payPlanName').textContent = planNames[plan] || plan;
  document.getElementById('payAmount').textContent = price + ' ' + periodLabel;
  // Update pay button text with correct amount
  if (els.payNowBtn) {
    els.payNowBtn.innerHTML = '<i class="fas fa-lock" aria-hidden="true"></i> Pay ' + price + ' Securely';
  }
  if (els.paymentModal) {
    els.paymentModal.classList.add('active');
    els.paymentModal.style.display = 'flex';
  }
  document.body.style.overflow = 'hidden';

  // Generate real UPI QR code
  generateUpiQr(price, planNames[plan] || plan);
}

/**
 * Generate a UPI QR code image using the free QR Server API.
 * Falls back to the placeholder if the image fails to load.
 * @param {string} price - The price string (e.g. "Rs.499")
 * @param {string} planName - The plan name (e.g. "Pro")
 */
function generateUpiQr(price, planName) {
  var upiId = 'followupcrm@paytm';
  // Build UPI payment URI: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
  var amount = price.replace(/[^0-9]/g, ''); // Strip "Rs." and commas → "499"
  var upiUri = 'upi://pay?pa=' + encodeURIComponent(upiId)
    + '&pn=FollowUp+CRM'
    + '&am=' + encodeURIComponent(amount)
    + '&cu=INR'
    + '&tn=' + encodeURIComponent('FollowUp+CRM+' + planName + '+Plan');

  // Use QR Server API (free, no key needed) to generate QR from UPI URI
  var qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(upiUri);

  var container = document.getElementById('qrCodeContainer');
  if (!container) return;

  // Build QR image with loading state
  container.innerHTML = '<img src="' + qrUrl + '" alt="Scan this UPI QR code to pay ' + price + ' via any UPI app" style="width:180px;height:180px;border-radius:8px;" onerror="this.parentElement.innerHTML=\'<i class=\\\'fas fa-qrcode\\\'></i><span>Scan QR to Pay</span>\'"><span style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Scan with any UPI app</span>';
}

function closePaymentModal() {
  if (els.paymentModal) {
    els.paymentModal.classList.remove('active');
    els.paymentModal.style.display = 'none';
  }
  document.body.style.overflow = '';
}

// ========== CONTACT SALES MODAL ==========
function initContactSalesModal() {
  var contactModal = document.getElementById('contactSalesModal');
  if (!contactModal) return; // Not on pricing page

  // Open from Enterprise "Contact Sales" button
  var enterpriseBtn = document.querySelector('[data-plan="enterprise"]');
  if (enterpriseBtn) {
    enterpriseBtn.addEventListener('click', function() {
      openContactSalesModal();
    });
  }

  // Close button
  var closeBtn = document.getElementById('contactSalesClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeContactSalesModal);
  }

  // Click outside to close
  contactModal.addEventListener('click', function(e) {
    if (e.target === contactModal) closeContactSalesModal();
  });

  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && contactModal.classList.contains('active')) {
      closeContactSalesModal();
    }
  });

  // Form submission with validation
  var form = document.getElementById('contactSalesForm');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      if (validateContactSalesForm()) {
        // Simulate form submission
        var submitBtn = document.getElementById('contactSalesSubmit');
        var originalText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Sending...';
        }
        setTimeout(function() {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
          }
          showToast('Thank you! Our sales team will contact you within 24 hours.', 'success');
          closeContactSalesModal();
          form.reset();
          clearContactSalesErrors();
        }, 1500);
      }
    });
  }

  // Real-time validation on input
  var fieldsToValidate = ['salesName', 'salesEmail', 'salesCompany', 'salesMessage'];
  for (var fi = 0; fi < fieldsToValidate.length; fi++) {
    var el = document.getElementById(fieldsToValidate[fi]);
    if (el) {
      el.addEventListener('input', function() {
        this.style.borderColor = 'var(--border-color)';
        var errEl = document.getElementById(this.id + 'Error');
        if (errEl) errEl.style.display = 'none';
      });
    }
  }
}

function openContactSalesModal() {
  var modal = document.getElementById('contactSalesModal');
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Focus first input for accessibility
    var firstInput = document.getElementById('salesName');
    if (firstInput) setTimeout(function() { firstInput.focus(); }, 100);
  }
}

function closeContactSalesModal() {
  var modal = document.getElementById('contactSalesModal');
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
  document.body.style.overflow = '';
}

/**
 * Validate the contact sales form fields.
 * Shows inline error messages and highlights invalid fields.
 * @returns {boolean} true if all required fields are valid
 */
function validateContactSalesForm() {
  var isValid = true;
  clearContactSalesErrors();

  var name = document.getElementById('salesName');
  if (!name || name.value.trim().length < 2) {
    showFieldError('salesName', 'salesNameError');
    isValid = false;
  }

  var email = document.getElementById('salesEmail');
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.value.trim())) {
    showFieldError('salesEmail', 'salesEmailError');
    isValid = false;
  }

  var company = document.getElementById('salesCompany');
  if (!company || company.value.trim().length < 2) {
    showFieldError('salesCompany', 'salesCompanyError');
    isValid = false;
  }

  var message = document.getElementById('salesMessage');
  if (!message || message.value.trim().length < 10) {
    showFieldError('salesMessage', 'salesMessageError');
    isValid = false;
  }

  return isValid;
}

function showFieldError(inputId, errorId) {
  var input = document.getElementById(inputId);
  var error = document.getElementById(errorId);
  if (input) input.style.borderColor = 'var(--danger)';
  if (error) error.style.display = 'block';
}

function clearContactSalesErrors() {
  var errorIds = ['salesNameError', 'salesEmailError', 'salesCompanyError', 'salesMessageError'];
  for (var i = 0; i < errorIds.length; i++) {
    var errEl = document.getElementById(errorIds[i]);
    if (errEl) errEl.style.display = 'none';
  }
  var inputIds = ['salesName', 'salesEmail', 'salesCompany', 'salesMessage'];
  for (var j = 0; j < inputIds.length; j++) {
    var inputEl = document.getElementById(inputIds[j]);
    if (inputEl) inputEl.style.borderColor = 'var(--border-color)';
  }
}

// ========== FAQ ACCORDION ==========
// Only bind on index.html (pricing.html has its own scoped FAQ handler)
function initFAQ() {
  // Use a scoped selector to avoid conflicting with pricing page FAQ
  var questions = document.querySelectorAll('#faq .faq-question');
  if (questions.length === 0) return; // No FAQ on this page
  for (var i = 0; i < questions.length; i++) {
    questions[i].addEventListener('click', function() {
      var item = this.parentElement;
      var isActive = item.classList.contains('active');
      // Close all
      var allItems = document.querySelectorAll('#faq .faq-item');
      for (var j = 0; j < allItems.length; j++) {
        allItems[j].classList.remove('active');
        allItems[j].querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      }
      // Toggle current
      if (!isActive) {
        item.classList.add('active');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  }
}

// ========== HERO STATS ANIMATION ==========
function initHeroStats() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var numbers = entry.target.querySelectorAll('.stat-number');
        for (var i = 0; i < numbers.length; i++) {
          var target = parseInt(numbers[i].getAttribute('data-target'));
          animateNumber(numbers[i], target);
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  var heroStats = document.querySelector('.hero-stats');
  if (heroStats) observer.observe(heroStats);
}

// ========== CTA FORM ==========
function initCTA() {
  // Null guard: CTA elements only exist on certain pages
  if (!els.ctaSubmit || !els.ctaEmail) return;

  els.ctaSubmit.addEventListener('click', function() {
    var email = els.ctaEmail.value.trim();
    if (email && email.indexOf('@') !== -1) {
      showToast('Thanks! We will send your free trial link to ' + email, 'success');
      els.ctaEmail.value = '';
    } else {
      showToast('Please enter a valid email address.', 'error');
    }
  });
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type) {
  type = type || 'info';
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  var icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
  toast.innerHTML = '<i class="fas fa-' + icon + '"></i> ' + message;
  els.toastContainer.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

// ========== UTILITIES ==========
function fallbackCopy(text) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('UPI ID copied to clipboard!', 'success');
  } catch (e) {
    showToast('Press Ctrl+C to copy: ' + text, 'info');
  }
  document.body.removeChild(textarea);
}

// ========== CSV IMPORT ==========
// State for the CSV import workflow
var importState = {
  parsedData: [],
  headers: [],
  columnMapping: {},
  step: 1
};

function initCsvImport() {
  // DOM Elements
  var importModal = document.getElementById('importModal');
  var importCloseBtn = document.getElementById('importClose');
  var importCancelBtn = document.getElementById('importCancelBtn');
  var importBackBtn = document.getElementById('importBackBtn');
  var importProceedBtn = document.getElementById('importProceedBtn');
  var csvBrowseBtn = document.getElementById('csvBrowseBtn');
  var csvFileInput = document.getElementById('csvFileInput');
  var importDropZone = document.getElementById('importDropZone');
  var skipHeaderRow = document.getElementById('skipHeaderRow');
  var downloadSampleCsv = document.getElementById('downloadSampleCsv');
  var openImportLeadsBtn = document.getElementById('openImportLeads');

  if (!importModal) return;

  // Open modal
  function openImportModal() {
    resetImportModal();
    importModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // Close modal
  function closeImportModal() {
    importModal.classList.remove('active');
    document.body.style.overflow = '';
    resetImportModal();
  }

  // Reset modal to initial state
  function resetImportModal() {
    importState.parsedData = [];
    importState.headers = [];
    importState.columnMapping = {};
    importState.step = 1;
    csvFileInput.value = '';
    showImportStep(1);
    importBackBtn.style.display = 'none';
    importProceedBtn.style.display = 'none';
    importCancelBtn.textContent = 'Cancel';
    document.getElementById('importPreviewHead').innerHTML = '';
    document.getElementById('importPreviewBody').innerHTML = '';
    document.getElementById('mapGrid').innerHTML = '';
    document.getElementById('previewCount').textContent = '0';
  }

  // Show specific import step
  function showImportStep(step) {
    importState.step = step;
    var steps = document.querySelectorAll('.import-step');
    for (var s = 0; s < steps.length; s++) {
      steps[s].classList.remove('active');
    }
    var stepEl = document.getElementById('importStep' + step);
    if (stepEl) stepEl.classList.add('active');

    // Update button visibility
    if (step === 1) {
      importBackBtn.style.display = 'none';
      importProceedBtn.style.display = 'none';
      importCancelBtn.textContent = 'Cancel';
    } else if (step === 2) {
      importBackBtn.style.display = 'inline-flex';
      importProceedBtn.style.display = 'inline-flex';
      importCancelBtn.textContent = 'Cancel';
    } else if (step === 3) {
      importBackBtn.style.display = 'none';
      importProceedBtn.style.display = 'none';
      importCancelBtn.textContent = 'Done';
    }
  }

  // Parse CSV text into array of arrays
  function parseCsvText(text) {
    var lines = [];
    var current = [];
    var inQuotes = false;
    var currentField = '';

    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (i + 1 < text.length && text[i + 1] === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          currentField += c;
        }
      } else {
        if (c === '"') {
          inQuotes = true;
        } else if (c === ',') {
          current.push(currentField.trim());
          currentField = '';
        } else if (c === '\n' || c === '\r') {
          if (currentField || current.length > 0) {
            current.push(currentField.trim());
            lines.push(current);
            current = [];
            currentField = '';
          }
          if (c === '\r' && i + 1 < text.length && text[i + 1] === '\n') i++;
        } else {
          currentField += c;
        }
      }
    }
    // Push last field/line
    if (currentField || current.length > 0) {
      current.push(currentField.trim());
      lines.push(current);
    }
    // Remove empty trailing lines
    while (lines.length > 0 && lines[lines.length - 1].length === 1 && lines[lines.length - 1][0] === '') {
      lines.pop();
    }
    return lines;
  }

  // Handle file selection
  function handleFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      processCsvData(text);
    };
    reader.readAsText(file);
  }

  // Process parsed CSV data
  function processCsvData(text) {
    var rows = parseCsvText(text);
    if (rows.length === 0) {
      showToast('The CSV file is empty.', 'error');
      return;
    }

    var isHeaderSkipped = skipHeaderRow.checked;
    var headerRow = rows[0];
    var dataRows;

    if (isHeaderSkipped) {
      importState.headers = headerRow;
      dataRows = rows.slice(1);
    } else {
      // Generate generic column headers
      importState.headers = [];
      for (var h = 0; h < headerRow.length; h++) {
        importState.headers.push('Column ' + (h + 1));
      }
      dataRows = rows;
    }

    importState.parsedData = dataRows;
    autoMapColumns();
    renderPreview();
    renderColumnMapping();
    showImportStep(2);
  }

  // Auto-map CSV columns to lead fields based on header names
  function autoMapColumns() {
    var fieldMap = {
      'name': 'name', 'fullname': 'name', 'full name': 'name', 'lead name': 'name', 'contact': 'name',
      'email': 'email', 'email address': 'email', 'e-mail': 'email', 'emailid': 'email',
      'phone': 'phone', 'mobile': 'phone', 'phone number': 'phone', 'tel': 'phone', 'contact number': 'phone',
      'company': 'company', 'organization': 'company', 'org': 'company', 'firm': 'company', 'business': 'company',
      'status': 'status', 'lead status': 'status', 'stage': 'status',
      'value': 'value', 'deal value': 'value', 'amount': 'value', 'price': 'value', 'revenue': 'value',
      'source': 'source', 'lead source': 'source', 'source': 'source', 'channel': 'source', 'medium': 'source',
      'followup': 'followup', 'follow-up': 'followup', 'follow up': 'followup', 'followup date': 'followup', 'next follow up': 'followup', 'date': 'followup',
      'notes': 'notes', 'note': 'notes', 'comments': 'notes', 'comment': 'notes', 'remarks': 'notes', 'description': 'notes'
    };

    importState.columnMapping = {};
    for (var i = 0; i < importState.headers.length; i++) {
      var header = importState.headers[i].toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      if (fieldMap[header]) {
        importState.columnMapping[i] = fieldMap[header];
      }
    }
  }

  // Render preview table (first 10 rows)
  function renderPreview() {
    var previewHead = document.getElementById('importPreviewHead');
    var previewBody = document.getElementById('importPreviewBody');
    var htmlHead = '<tr>';
    for (var h = 0; h < importState.headers.length; h++) {
      var mapped = importState.columnMapping[h];
      var badge = mapped ? '<span class="col-mapped">' + mapped + '</span>' : '<span class="col-unmapped">unmapped</span>';
      htmlHead += '<th>' + escapeHtml(importState.headers[h]) + ' ' + badge + '</th>';
    }
    htmlHead += '</tr>';
    previewHead.innerHTML = htmlHead;

    var htmlBody = '';
    var maxRows = Math.min(importState.parsedData.length, 10);
    for (var r = 0; r < maxRows; r++) {
      htmlBody += '<tr>';
      for (var c = 0; c < importState.parsedData[r].length; c++) {
        htmlBody += '<td>' + escapeHtml(importState.parsedData[r][c] || '-') + '</td>';
      }
      htmlBody += '</tr>';
    }
    if (importState.parsedData.length > 10) {
      htmlBody += '<tr><td colspan="' + importState.headers.length + '" class="preview-more">... and ' + (importState.parsedData.length - 10) + ' more rows</td></tr>';
    }
    previewBody.innerHTML = htmlBody;
    document.getElementById('previewCount').textContent = importState.parsedData.length;
  }

  // Render column mapping dropdowns
  function renderColumnMapping() {
    var mapGrid = document.getElementById('mapGrid');
    var fields = [
      { key: 'name', label: 'Full Name', required: true },
      { key: 'email', label: 'Email', required: false },
      { key: 'phone', label: 'Phone', required: false },
      { key: 'company', label: 'Company', required: false },
      { key: 'source', label: 'Lead Source', required: false },
      { key: 'status', label: 'Status', required: false },
      { key: 'value', label: 'Deal Value', required: false },
      { key: 'followup', label: 'Follow-up Date', required: false },
      { key: 'notes', label: 'Notes', required: false }
    ];

    var html = '';
    for (var f = 0; f < fields.length; f++) {
      var field = fields[f];
      html += '<div class="map-field-group">';
      html += '<label>' + field.label + (field.required ? '<span style="color:var(--danger)"> *</span>' : '') + '</label>';
      html += '<select class="map-select" data-field="' + field.key + '">';
      html += '<option value="">-- Skip --</option>';
      for (var c = 0; c < importState.headers.length; c++) {
        var selected = importState.columnMapping[c] === field.key ? 'selected' : '';
        html += '<option value="' + c + '" ' + selected + '>' + escapeHtml(importState.headers[c]) + '</option>';
      }
      html += '</select></div>';
    }
    mapGrid.innerHTML = html;

    // Re-render preview on mapping change
    var selects = mapGrid.querySelectorAll('.map-select');
    for (var s = 0; s < selects.length; s++) {
      selects[s].addEventListener('change', function() {
        rebuildColumnMapping();
        renderPreview();
      });
    }
  }

  // Rebuild mapping from dropdown selections
  function rebuildColumnMapping() {
    importState.columnMapping = {};
    var selects = document.querySelectorAll('.map-select');
    for (var s = 0; s < selects.length; s++) {
      var fieldKey = selects[s].getAttribute('data-field');
      var colIndex = selects[s].value;
      if (colIndex !== '') {
        importState.columnMapping[parseInt(colIndex)] = fieldKey;
      }
    }
  }

  // Import leads into state
  function executeImport() {
    rebuildColumnMapping();

    // Validate: name column is required
    var hasNameCol = false;
    for (var key in importState.columnMapping) {
      if (importState.columnMapping[key] === 'name') {
        hasNameCol = true;
        break;
      }
    }
    if (!hasNameCol) {
      showToast('Please map the "Full Name" column to proceed.', 'error');
      return;
    }

    var imported = 0;
    var skipped = 0;
    var validStatuses = { 'cold': true, 'warm': true, 'hot': true, 'closed': true };

    for (var r = 0; r < importState.parsedData.length; r++) {
      var row = importState.parsedData[r];
      var lead = {
        id: Date.now() + r,
        name: '',
        email: '',
        phone: '',
        company: '',
        source: '',
        status: 'cold',
        value: 0,
        followup: '',
        notes: ''
      };

      var hasName = false;
      for (var c = 0; c < row.length; c++) {
        if (importState.columnMapping[c]) {
          var field = importState.columnMapping[c];
          var val = row[c] || '';
          if (field === 'name') {
            lead.name = val;
            hasName = val.trim() !== '';
          } else if (field === 'email') {
            lead.email = val;
          } else if (field === 'phone') {
            lead.phone = val;
          } else if (field === 'company') {
            lead.company = val;
          } else if (field === 'source') {
            lead.source = val;
          } else if (field === 'status') {
            var sVal = val.toLowerCase().trim();
            lead.status = validStatuses[sVal] ? sVal : 'cold';
          } else if (field === 'value') {
            var num = parseInt(val.replace(/[^0-9]/g, ''));
            lead.value = isNaN(num) ? 0 : num;
          } else if (field === 'followup') {
            lead.followup = val;
          } else if (field === 'notes') {
            lead.notes = val;
          }
        }
      }

      if (hasName) {
        state.leads.push(lead);
        imported++;
      } else {
        skipped++;
      }
    }

    // Show results
    showImportStep(3);
    var resultsEl = document.getElementById('importResults');
    if (skipped > 0) {
      resultsEl.innerHTML = '<div class="result-icon success"><i class="fas fa-check-circle"></i></div>' +
        '<h3>Import Complete!</h3>' +
        '<p>' + imported + ' leads imported successfully. ' + skipped + ' rows skipped (missing name).</p>';
    } else {
      resultsEl.innerHTML = '<div class="result-icon success"><i class="fas fa-check-circle"></i></div>' +
        '<h3>Import Successful!</h3>' +
        '<p>' + imported + ' leads imported successfully.</p>';
    }

    // Refresh all views
    renderAll();
    saveState();
    showToast(imported + ' leads imported successfully!', 'success');
  }

  // Generate and download sample CSV
  function handleSampleDownload(e) {
    e.preventDefault();
    var csvContent = 'name,email,phone,company,source,status,value,followup,notes\n' +
      'Rahul Kumar,rahul@techventures.in,+91 98765 43210,TechVentures,website,hot,150000,2026-07-15,Interested in enterprise plan\n' +
      'Priya Sharma,priya@growthhackers.com,+91 87654 32109,GrowthHackers,referral,warm,75000,2026-07-20,Send comparison sheet\n' +
      'Amit Joshi,amit@startuphub.io,+91 76543 21098,StartupHub,social,cold,50000,,Follow up next month';
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'followup_crm_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Sample CSV downloaded!', 'success');
  }

  // Event bindings
  if (openImportLeadsBtn) openImportLeadsBtn.addEventListener('click', openImportModal);
  importCloseBtn.addEventListener('click', closeImportModal);
  importCancelBtn.addEventListener('click', closeImportModal);
  importModal.addEventListener('click', function(e) {
    if (e.target === importModal) closeImportModal();
  });

  importBackBtn.addEventListener('click', function() {
    if (importState.step === 2) showImportStep(1);
  });
  importProceedBtn.addEventListener('click', executeImport);

  // File input
  csvBrowseBtn.addEventListener('click', function() { csvFileInput.click(); });
  csvFileInput.addEventListener('change', function(e) {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  // Drag & drop
  importDropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('drag-over');
  });
  importDropZone.addEventListener('dragleave', function() {
    this.classList.remove('drag-over');
  });
  importDropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });
  importDropZone.addEventListener('click', function(e) {
    if (e.target !== csvBrowseBtn && e.target !== csvFileInput) {
      csvFileInput.click();
    }
  });

  // Skip header toggle re-parses data
  skipHeaderRow.addEventListener('change', function() {
    if (csvFileInput.files && csvFileInput.files[0]) {
      handleFile(csvFileInput.files[0]);
    }
  });

  // Sample CSV download
  downloadSampleCsv.addEventListener('click', handleSampleDownload);
};

// ========== CSV EXPORT ==========
function initCsvExport() {
  if (!els.exportCsvBtn) return;

  els.exportCsvBtn.addEventListener('click', function() {
    exportLeadsCSV();
  });
}

/**
 * Export current leads (respecting search/filter/sort) to CSV file
 * Properly escapes commas, quotes, and newlines in field values
 */
function exportLeadsCSV() {
  var leads = getFilteredLeads();

  if (leads.length === 0) {
    showToast('No leads to export. Add some leads first.', 'info');
    return;
  }

  // CSV header row
  var headers = ['Name', 'Email', 'Phone', 'Company', 'Lead Source', 'Status', 'Value', 'Follow-up Date', 'Notes'];

  // Build CSV content with proper escaping
  var csvLines = [];
  csvLines.push(headers.join(','));

  for (var i = 0; i < leads.length; i++) {
    var lead = leads[i];
    var row = [
      csvEscape(lead.name),
      csvEscape(lead.email),
      csvEscape(lead.phone || ''),
      csvEscape(lead.company || ''),
      csvEscape(lead.source || ''),
      csvEscape(lead.status),
      lead.value || 0,
      csvEscape(lead.followup || ''),
      csvEscape(lead.notes || '')
    ];
    csvLines.push(row.join(','));
  }

  var csvContent = csvLines.join('\n');

  // Add UTF-8 BOM for Excel compatibility with special characters
  var blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);

  // Generate filename with current date
  var now = new Date();
  var dateStr = now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0');
  var filename = 'followup_crm_leads_' + dateStr + '.csv';

  // Trigger download
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Exported ' + leads.length + ' leads to ' + filename, 'success');
}

/**
 * Escape a field value for CSV format
 * Wraps in quotes if it contains commas, quotes, or newlines
 * Doubles existing quotes per RFC 4180
 */
function csvEscape(value) {
  if (value === null || value === undefined) return '';
  var str = String(value);
  if (str.indexOf(',') !== -1 || str.indexOf('"') !== -1 || str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Escape a string for safe HTML insertion
 * Prevents XSS when rendering user-supplied data into HTML strings
 */
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function initFAB() {
  if (els.fabAddLead) {
    els.fabAddLead.addEventListener('click', function() {
      openLeadModal();
    });
  }
}

// ========== PRICING PAGE SPECIFIC ==========
// Handles billing toggle and pricing-page FAQ accordion
function initPricingPage() {
  // Only run on pricing.html (check for pricing-specific element)
  var billingSwitch = document.getElementById('billingSwitch');
  if (!billingSwitch) return; // Not on pricing page

  var monthlyLabel = document.getElementById('monthlyLabel');
  var annualLabel = document.getElementById('annualLabel');
  var isAnnual = false;

  billingSwitch.addEventListener('click', function() {
    isAnnual = !isAnnual;
    this.classList.toggle('annual', isAnnual);
    this.setAttribute('aria-pressed', isAnnual ? 'true' : 'false');

    if (monthlyLabel) monthlyLabel.className = isAnnual ? 'billing-label inactive' : 'billing-label active';
    if (annualLabel) annualLabel.className = isAnnual ? 'billing-label active' : 'billing-label inactive';

    // Update all price amounts
    var amounts = document.querySelectorAll('.pricing-card .amount');
    for (var i = 0; i < amounts.length; i++) {
      var amt = amounts[i];
      var newVal = isAnnual ? amt.getAttribute('data-annual') : amt.getAttribute('data-monthly');
      if (newVal) amt.textContent = newVal;
    }

    // Update comparison table header prices
    var colPrices = document.querySelectorAll('.col-price');
    if (colPrices.length >= 3) {
      colPrices[1].textContent = isAnnual ? 'Rs.399/mo' : 'Rs.499/mo';
      colPrices[2].textContent = isAnnual ? 'Rs.1,599/mo' : 'Rs.1,999/mo';
    }
  });

  // Pricing page FAQ accordion (scoped to .pricing-faq-section)
  var pricingFaqQuestions = document.querySelectorAll('.pricing-faq-section .faq-question');
  for (var i = 0; i < pricingFaqQuestions.length; i++) {
    pricingFaqQuestions[i].addEventListener('click', function() {
      var item = this.parentElement;
      var isActive = item.classList.contains('active');
      // Close all
      var allItems = document.querySelectorAll('.pricing-faq-section .faq-item');
      for (var j = 0; j < allItems.length; j++) {
        allItems[j].classList.remove('active');
        allItems[j].querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      }
      // Toggle current
      if (!isActive) {
        item.classList.add('active');
        this.setAttribute('aria-expanded', 'true');
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', function() {
  loadState();
  initNavigation();
  initDarkMode();
  initLeadManagement();
  initCalendar();
  initPaymentModal();
  initContactSalesModal();
  initCsvImport();
  initCsvExport();
  initFAQ();
  initPricingPage();
  initHeroStats();
  initCTA();
  initFAB();
  initLeadDetailModal();
  initClearFilters();
  renderAll();
});
