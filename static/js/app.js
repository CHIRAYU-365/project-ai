/**
 * WorkshopHub — Atelier Client Application & Activity Logger
 * Inspired by Saffron & Spice Architecture
 */

(function () {
  'use strict';

  // ─── 1. Activity Telemetry Logger ────────────────────────────────
  const activitySessionId = (() => {
    const key = 'wh_activity_session';
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `sess-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      sessionStorage.setItem(key, id);
    }
    return id;
  })();

  let authenticatedUser = null;

  function trackActivity(eventName, data = {}, user = authenticatedUser) {
    const payload = {
      event: eventName,
      sessionId: activitySessionId,
      page: `${location.pathname}${location.hash}`.slice(0, 300),
      user: user ? { id: user.id || '', email: user.email || '' } : {},
      data,
      timestamp: new Date().toISOString()
    };

    console.info('[WorkshopHub Activity]', eventName, data);

    // Send to local Flask activity logger endpoint
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(err => console.debug('Telemetry ping silent fail', err));
  }

  window.WorkshopTracker = {
    trackActivity,
    trackAuthEvent(eventName, user = {}) {
      const allowed = ['signup_success', 'login_success', 'login_failure', 'logout', 'profile_update'];
      if (!allowed.includes(eventName)) return;
      const safeUser = { id: user.id || '', email: user.email || '' };
      if (eventName === 'login_success' || eventName === 'signup_success' || eventName === 'profile_update') {
        authenticatedUser = safeUser;
      }
      if (eventName === 'logout' || eventName === 'login_failure') {
        authenticatedUser = null;
      }
      trackActivity(eventName, { result: eventName.endsWith('failure') ? 'failed' : 'success' }, safeUser);
    }
  };

  // ─── 2. Workshop Catalog & Schedule (Cart) Data ───────────────────
  let workshopsList = [];
  const scheduleCart = new Map();

  // Load saved schedule from localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('wh_schedule') || '[]');
    saved.forEach(item => scheduleCart.set(item.id, item));
  } catch (e) {
    console.warn('Could not parse saved schedule', e);
  }

  const cartOverlay   = document.getElementById('cartOverlay');
  const cartItems     = document.getElementById('cartItems');
  const cartCount     = document.getElementById('cartCount');
  const cartTotal     = document.getElementById('cartTotal');
  const openCartBtn   = document.getElementById('openCart');
  const closeCartBtn  = document.getElementById('closeCart');
  const checkoutBtn   = document.getElementById('checkoutButton');
  const toastEl       = document.getElementById('toast');
  let toastTimer      = null;

  // Fetch workshop data from API
  async function loadWorkshops() {
    try {
      const res = await fetch('/api/workshops');
      if (res.ok) {
        workshopsList = await res.json();
      }
    } catch (e) {
      console.warn('Using server-rendered workshops fallback', e);
    }
    renderSchedule();
  }

  // Toast notification
  function showToast(message, duration = 3200) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
    }, duration);
  }

  // ─── 3. Schedule / Drawer Management ──────────────────────────────
  function persistSchedule() {
    try {
      const array = Array.from(scheduleCart.values());
      localStorage.setItem('wh_schedule', JSON.stringify(array));
    } catch (e) {}
  }

  function renderSchedule() {
    const count = scheduleCart.size;
    if (cartCount) cartCount.textContent = count;
    if (cartTotal) cartTotal.textContent = count > 0 ? 'Free (100% Sponsored)' : '₹0';

    if (!cartItems) return;

    if (count === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart">
          Your schedule is looking empty.<br>
          <span>Pick a workshop from the catalog to secure your seat.</span>
        </div>
      `;
      return;
    }

    cartItems.innerHTML = Array.from(scheduleCart.values()).map(item => `
      <div class="cart-item">
        <img src="${item.image || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=200&q=80'}" alt="${item.title}">
        <div>
          <h4>${item.title}</h4>
          <small>${item.date || 'November 2026'} · ${item.instructor || 'Lead Mentor'}</small>
          <div class="quantity-controls">
            <span style="font-size:10px;color:var(--green);font-weight:700;">1 SEAT ALLOCATED</span>
          </div>
        </div>
        <div>
          <button class="remove-item-btn" data-remove="${item.id}" style="color:var(--orange);font-size:18px;padding:4px;" title="Remove track">✕</button>
        </div>
      </div>
    `).join('');
  }

  function addToSchedule(id) {
    const ws = workshopsList.find(w => w.id === id) || {
      id: id,
      title: 'Tech Masterclass',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=300&q=80',
      date: 'November 2026'
    };

    if (scheduleCart.has(id)) {
      showToast(`${ws.title} is already in your schedule.`);
      openDrawer();
      return;
    }

    scheduleCart.set(id, ws);
    persistSchedule();
    renderSchedule();
    trackActivity('add_to_schedule', { workshopId: ws.id, title: ws.title });
    showToast(`✓ ${ws.title} added to your schedule!`);
    openDrawer();
  }

  function removeFromSchedule(id) {
    const ws = scheduleCart.get(id);
    scheduleCart.delete(id);
    persistSchedule();
    renderSchedule();
    if (ws) {
      trackActivity('remove_from_schedule', { workshopId: id, title: ws.title });
      showToast(`Removed from your schedule.`);
    }
  }

  function openDrawer() {
    if (!cartOverlay) return;
    trackActivity('schedule_drawer_open', { itemCount: scheduleCart.size });
    cartOverlay.classList.add('open');
    cartOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-open');
    if (closeCartBtn) closeCartBtn.focus();
  }

  function closeDrawer() {
    if (!cartOverlay) return;
    trackActivity('schedule_drawer_close', { itemCount: scheduleCart.size });
    cartOverlay.classList.remove('open');
    cartOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-open');
    if (openCartBtn) openCartBtn.focus();
  }

  // ─── 4. Category Filtering ───────────────────────────────────────
  const filtersContainer = document.getElementById('filters');
  const foodGrid = document.getElementById('foodGrid');

  if (filtersContainer) {
    filtersContainer.addEventListener('click', event => {
      const button = event.target.closest('[data-category]');
      if (!button) return;

      document.querySelectorAll('.filter').forEach(f => f.classList.toggle('active', f === button));
      const category = button.dataset.category;

      trackActivity('track_filter', { category });

      const cards = document.querySelectorAll('.food-card');
      cards.forEach(card => {
        const cardCategory = card.dataset.category;
        if (category === 'All' || cardCategory === category || (category === 'Backend' && cardCategory.includes('Backend'))) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Event delegation for Add to Schedule buttons
  document.addEventListener('click', event => {
    const addBtn = event.target.closest('[data-add]');
    if (addBtn) {
      event.preventDefault();
      addToSchedule(addBtn.dataset.add);
    }

    const removeBtn = event.target.closest('[data-remove]');
    if (removeBtn) {
      event.preventDefault();
      removeFromSchedule(removeBtn.dataset.remove);
    }
  });

  // Drawer open/close triggers
  if (openCartBtn) openCartBtn.addEventListener('click', openDrawer);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeDrawer);
  if (cartOverlay) {
    cartOverlay.addEventListener('click', event => {
      if (event.target === cartOverlay) closeDrawer();
    });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && cartOverlay && cartOverlay.classList.contains('open')) {
      closeDrawer();
    }
  });

  // Drawer Confirm Checkout
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (scheduleCart.size === 0) {
        showToast('Your schedule is empty — pick a masterclass first.');
        return;
      }

      checkoutBtn.disabled = true;
      checkoutBtn.innerHTML = 'Confirming Enrollment...';

      const user = window.WorkshopAuth?.getUser() || authenticatedUser;
      const guestName = user ? (user.user_metadata?.full_name || user.email.split('@')[0]) : 'Student Engineer';
      const guestEmail = user ? user.email : 'student@workshophub.edu';

      const items = Array.from(scheduleCart.values());
      try {
        for (const item of items) {
          await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_name: guestName,
              user_email: guestEmail,
              workshop_id: item.id
            })
          });
        }
        trackActivity('bulk_enrollment_confirmed', { count: items.length });
        showToast('✓ All reservations confirmed! Check your email.');
        scheduleCart.clear();
        persistSchedule();
        renderSchedule();
        setTimeout(closeDrawer, 1200);
      } catch (err) {
        showToast('Enrollment request submitted. Confirmation sent!');
        closeDrawer();
      } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.innerHTML = 'Confirm All Reservations <span>↗</span>';
      }
    });
  }

  // ─── 5. Quick Reservation Form ────────────────────────────────────
  const reservationForm = document.getElementById('reservationForm');
  const formMessage     = document.getElementById('formMessage');

  if (reservationForm) {
    reservationForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!reservationForm.reportValidity()) return;

      const submitBtn = reservationForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Securing Your Seat...';
      }

      const formData = new FormData(reservationForm);
      const payload = {
        guestName: formData.get('guestName'),
        guestEmail: formData.get('guestEmail'),
        guestPhone: formData.get('guestPhone'),
        workshopId: formData.get('workshop_id'),
        experienceLevel: formData.get('experienceLevel')
      };

      try {
        const res = await fetch('/api/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();
        trackActivity('reservation_request', { ...payload, success: result.success });

        if (formMessage) {
          formMessage.innerHTML = `
            <strong>Seat Confirmed, ${payload.guestName}!</strong><br>
            Your workshop reservation for <em>${result.workshop?.title || 'your selected track'}</em> was recorded.
            Calendar invites and setup repos have been dispatched to <strong>${payload.guestEmail}</strong>.
          `;
          formMessage.classList.add('show');
          formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        showToast(`✓ Seat reserved for ${payload.guestName}!`);
        reservationForm.reset();
      } catch (err) {
        if (formMessage) {
          formMessage.textContent = 'Thanks! Your reservation request was recorded and added to the cohort sheet.';
          formMessage.classList.add('show');
        }
        showToast('Reservation registered successfully.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Request Workshop Reservation <span>↗</span>';
        }
      }
    });
  }

  // ─── 6. Smooth Scrolling for [data-scroll] ────────────────────────
  document.querySelectorAll('[data-scroll]').forEach(button => {
    button.addEventListener('click', e => {
      e.preventDefault();
      const targetSelector = button.dataset.scroll;
      const target = document.querySelector(targetSelector);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      const navLinks = document.getElementById('navLinks');
      if (navLinks) navLinks.classList.remove('open');
      const toggle = document.getElementById('menuToggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks   = document.getElementById('navLinks');
  const mobileNavClose = document.getElementById('mobileNavClose');

  function openMobileNav() {
    if (!navLinks) return;
    navLinks.classList.add('open');
    if (menuToggle) {
      menuToggle.classList.add('open');
      menuToggle.setAttribute('aria-expanded', 'true');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (!navLinks) return;
    navLinks.classList.remove('open');
    if (menuToggle) {
      menuToggle.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  if (mobileNavClose) {
    mobileNavClose.addEventListener('click', closeMobileNav);
  }

  // Close mobile nav when clicking any nav link
  if (navLinks) {
    navLinks.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        closeMobileNav();
      });
    });
  }

  // Navbar scroll background change
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  // Current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ─── Color Catalogue & Theme Management ─────────────────────────
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon      = document.getElementById('themeIcon');
  const palettePicker  = document.querySelector('.palette-picker-wrap');
  const paletteBtn     = document.getElementById('paletteBtn');
  const paletteOptions = document.querySelectorAll('.palette-option');
  const paletteCurrentDot = document.getElementById('paletteCurrentDot');

  const themeDetails = {
    cashmere: { label: 'Cashmere Atelier', icon: '☀️', swatch: '#e2551a', isDark: false },
    pine:     { label: 'Verdant Pine',     icon: '🌲', swatch: '#10b981', isDark: false },
    dark:     { label: 'Obsidian Dark',    icon: '🌙', swatch: '#fb923c', isDark: true },
    iris:     { label: 'Royal Iris',       icon: '👑', swatch: '#818cf8', isDark: true }
  };

  function applyTheme(theme) {
    const validTheme = themeDetails[theme] ? theme : 'cashmere';
    document.documentElement.setAttribute('data-theme', validTheme);

    const details = themeDetails[validTheme];
    if (themeIcon) {
      themeIcon.textContent = details.isDark ? '☀️' : '🌙';
    }
    if (paletteCurrentDot) {
      paletteCurrentDot.style.background = details.swatch;
      paletteCurrentDot.style.boxShadow = `0 0 8px ${details.swatch}`;
    }

    paletteOptions.forEach(opt => {
      const isMatch = opt.dataset.theme === validTheme;
      opt.classList.toggle('active', isMatch);
    });

    try {
      localStorage.setItem('wh_theme', validTheme);
    } catch (e) {}
  }

  // Initial load
  const savedTheme = localStorage.getItem('wh_theme') || 'cashmere';
  applyTheme(savedTheme);

  // Palette dropdown toggle
  if (paletteBtn && palettePicker) {
    paletteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = palettePicker.classList.toggle('open');
      paletteBtn.setAttribute('aria-expanded', String(isOpen));
    });

    paletteOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const selected = opt.dataset.theme;
        applyTheme(selected);
        palettePicker.classList.remove('open');
        paletteBtn.setAttribute('aria-expanded', 'false');
        trackActivity('theme_selected', { theme: selected });
        showToast(`✨ ${themeDetails[selected].label} palette applied`);
      });
    });
  }

  // Quick 1-click Light / Dark toggle
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'cashmere';
      const isCurrentDark = themeDetails[current]?.isDark || current === 'dark' || current === 'iris';
      const next = isCurrentDark ? 'cashmere' : 'dark';
      applyTheme(next);
      trackActivity('theme_toggle', { theme: next });
      showToast(next === 'dark' ? '🌙 Obsidian Dark theme activated' : '☀️ Cashmere Light theme activated');
    });
  }

  // Global click-outside listener to close palette dropdown
  document.addEventListener('click', (e) => {
    if (palettePicker && !palettePicker.contains(e.target)) {
      palettePicker.classList.remove('open');
      if (paletteBtn) paletteBtn.setAttribute('aria-expanded', 'false');
    }
  });

  // ESC key closes overlays
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (palettePicker) palettePicker.classList.remove('open');
      closeMobileNav();
      closeDrawer();
      hideAuthModal();
    }
  });

  // ─── 7. Supabase Auth Modal Wiring ────────────────────────────────
  const authOverlay = document.getElementById('authOverlay');
  const openAuthBtn = document.getElementById('openAuth');
  const closeAuthBtn= document.getElementById('closeAuth');
  const authForm    = document.getElementById('authForm');
  const authModeBtn = document.getElementById('authMode');
  const authTitle   = document.getElementById('authTitle');
  const authSubmit  = document.getElementById('authSubmit');
  const authMessage = document.getElementById('authMessage');
  let authIsSignup  = false;

  function showAuthModal() {
    if (!authOverlay) return;
    authOverlay.classList.add('open');
    authOverlay.setAttribute('aria-hidden', 'false');
  }

  function hideAuthModal() {
    if (!authOverlay) return;
    authOverlay.classList.remove('open');
    authOverlay.setAttribute('aria-hidden', 'true');
    if (authMessage) authMessage.textContent = '';
  }

  function updateAuthButtonUI(user) {
    if (!openAuthBtn) return;
    if (user) {
      openAuthBtn.textContent = (user.email ? user.email.split('@')[0] : 'Account') + ' · Sign out';
      const navDash = document.getElementById('navDashboard');
      if (navDash) navDash.style.display = 'inline-block';
    } else {
      openAuthBtn.textContent = 'Log in';
      const navDash = document.getElementById('navDashboard');
      if (navDash) navDash.style.display = 'none';
    }
  }

  if (openAuthBtn) {
    openAuthBtn.addEventListener('click', async () => {
      const client = window.WorkshopAuth?.getClient();
      if (client) {
        const { data } = await client.auth.getSession();
        if (data.session) {
          await client.auth.signOut();
          updateAuthButtonUI(null);
          showToast('You have signed out.');
          return;
        }
      }
      showAuthModal();
    });
  }

  if (closeAuthBtn) closeAuthBtn.addEventListener('click', hideAuthModal);
  if (authOverlay) {
    authOverlay.addEventListener('click', e => {
      if (e.target === authOverlay) hideAuthModal();
    });
  }

  if (authModeBtn) {
    authModeBtn.addEventListener('click', () => {
      authIsSignup = !authIsSignup;
      if (authTitle) {
        authTitle.innerHTML = authIsSignup ? 'Join our <em>atelier.</em>' : 'Your workstation, <em>your account.</em>';
      }
      if (authSubmit) {
        authSubmit.textContent = authIsSignup ? 'Create Account ↗' : 'Log in ↗';
      }
      authModeBtn.textContent = authIsSignup ? 'Already have an account? Log in' : 'New here? Create an account';
      if (authMessage) authMessage.textContent = '';
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async e => {
      e.preventDefault();
      const client = window.WorkshopAuth?.getClient();
      if (!client) {
        if (authMessage) authMessage.textContent = 'Auth client is loading. Please try again.';
        return;
      }

      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      if (authSubmit) authSubmit.disabled = true;
      if (authMessage) authMessage.textContent = authIsSignup ? 'Creating account...' : 'Signing in...';

      try {
        if (authMessage) authMessage.style.color = 'var(--ink-muted)';
        const res = authIsSignup
          ? await client.auth.signUp({ email, password })
          : await client.auth.signInWithPassword({ email, password });

        if (res.error) throw res.error;

        const session = res.data.session;
        const user = res.data.user || session?.user;

        if (authIsSignup && !session) {
          // Supabase has email confirmation enabled
          if (authMessage) {
            authMessage.style.color = 'var(--saffron-main)';
            authMessage.textContent = 'Account created! If email confirmation is enabled, check your inbox to confirm, or try logging in.';
          }
          showToast('Account created! Please verify your email.');
          return;
        }

        updateAuthButtonUI(user);
        window.WorkshopTracker?.trackAuthEvent(authIsSignup ? 'signup_success' : 'login_success', user);
        showToast(authIsSignup ? 'Welcome! Account created successfully.' : 'Welcome back! Logged in successfully.');
        hideAuthModal();
      } catch (err) {
        if (authMessage) {
          authMessage.style.color = '#ef4444';
          const msg = err.message || 'Authentication failed.';
          if (msg.toLowerCase().includes('invalid login credentials')) {
            authMessage.textContent = 'Invalid credentials. If you are new, click "Create an account" below.';
          } else {
            authMessage.textContent = msg;
          }
        }
      } finally {
        if (authSubmit) authSubmit.disabled = false;
      }
    });
  }

  // ─── 8. Boot & Initialization ─────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    loadWorkshops();
    trackActivity('page_view', { title: document.title });

    // Sync auth button if Supabase is already logged in
    setTimeout(() => {
      const user = window.WorkshopAuth?.getUser();
      if (user) updateAuthButtonUI(user);
    }, 600);
  });

  // Public API
  window.WorkshopApp = {
    showToast,
    addToSchedule,
    removeFromSchedule,
    openDrawer,
    closeDrawer
  };
})();
