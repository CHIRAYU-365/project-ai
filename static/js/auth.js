/**
 * WorkshopHub — Supabase Authentication Module
 * 
 * Handles sign-up, sign-in, sign-out, Google OAuth,
 * and session persistence via Supabase JS SDK v2.
 * 
 * ⚠️  Replace SUPABASE_URL and SUPABASE_ANON_KEY with your real values.
 */

(function () {
    'use strict';

    // ─── Configuration ───────────────────────────────────────────────
    const SUPABASE_URL = window.ENV?.SUPABASE_URL || 'https://ohoksetlifocyfrwysax.supabase.co';
    const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || 'sb_publishable_sjNPR8uXBWpE9K9xQSaPyA_wTWUNyFu';

    let supabaseClient = null;
    let currentUser = null;

    // ─── Init ────────────────────────────────────────────────────────
    function init() {
        if (typeof supabase === 'undefined' || !supabase.createClient) {
            console.warn('[Auth] Supabase SDK not loaded. Auth will be unavailable.');
            hideLoader();
            return;
        }

        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                currentUser = session.user;
                updateUILoggedIn(session.user);
            } else {
                currentUser = null;
                updateUILoggedOut();
            }
            hideLoader();
        });

        // Check existing session
        supabaseClient.auth.getSession().then(({ data }) => {
            if (data.session?.user) {
                currentUser = data.session.user;
                updateUILoggedIn(data.session.user);
            }
            hideLoader();
        });

        bindForms();
    }

    // ─── UI Updates ──────────────────────────────────────────────────
    function updateUILoggedIn(user) {
        const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'U';
        const initial = name.charAt(0).toUpperCase();

        const loggedOut = document.getElementById('authLoggedOut');
        const loggedIn  = document.getElementById('authLoggedIn');
        const avatar    = document.getElementById('userAvatar');
        const display   = document.getElementById('userDisplayName');
        const dashLink  = document.getElementById('navDashboard');
        const heroBtn   = document.getElementById('heroSignUp');

        if (loggedOut) loggedOut.style.display = 'none';
        if (loggedIn)  loggedIn.style.display  = 'flex';
        if (avatar)    avatar.textContent       = initial;
        if (display)   display.textContent      = name;
        if (dashLink)  dashLink.style.display   = 'inline-block';
        if (heroBtn) {
            heroBtn.textContent = 'My Dashboard';
            heroBtn.href = '/dashboard';
        }
    }

    function updateUILoggedOut() {
        const loggedOut = document.getElementById('authLoggedOut');
        const loggedIn  = document.getElementById('authLoggedIn');
        const dashLink  = document.getElementById('navDashboard');

        if (loggedOut) loggedOut.style.display = 'block';
        if (loggedIn)  loggedIn.style.display  = 'none';
        if (dashLink)  dashLink.style.display  = 'none';
    }

    // ─── Form Bindings ───────────────────────────────────────────────
    function bindForms() {
        // Login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email    = document.getElementById('loginEmail').value.trim();
                const password = document.getElementById('loginPassword').value;

                setLoading('login', true);
                hideError();

                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

                setLoading('login', false);

                if (error) {
                    showError(error.message);
                } else {
                    window.WorkshopApp?.showToast('Welcome back!', 'success');
                    setTimeout(() => { window.location.href = '/workshops'; }, 800);
                }
            });
        }

        // Register
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name     = document.getElementById('registerName').value.trim();
                const email    = document.getElementById('registerEmail').value.trim();
                const password = document.getElementById('registerPassword').value;

                setLoading('register', true);
                hideError();

                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: name }
                    }
                });

                setLoading('register', false);

                if (error) {
                    showError(error.message);
                } else {
                    window.WorkshopApp?.showToast('Account created! You can now book workshops.', 'success');
                    setTimeout(() => { window.location.href = '/workshops'; }, 1000);
                }
            });
        }

        // Google OAuth
        const googleBtn = document.getElementById('googleSignIn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin + '/workshops'
                    }
                });
                if (error) showError(error.message);
            });
        }

        // Logout
        const logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await supabaseClient.auth.signOut();
                window.WorkshopApp?.showToast('Signed out', 'info');
                setTimeout(() => { window.location.href = '/'; }, 600);
            });
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────
    function showError(msg) {
        const el = document.getElementById('authError');
        if (el) {
            el.textContent = msg;
            el.classList.add('visible');
        }
    }

    function hideError() {
        const el = document.getElementById('authError');
        if (el) el.classList.remove('visible');
    }

    function setLoading(type, loading) {
        const btn     = document.getElementById(type + 'Btn');
        const text    = document.getElementById(type + 'BtnText');
        const spinner = document.getElementById(type + 'Spinner');
        if (btn)     btn.disabled = loading;
        if (text)    text.style.display    = loading ? 'none' : 'inline';
        if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
    }

    function hideLoader() {
        const loader = document.getElementById('pageLoader');
        if (loader) {
            setTimeout(() => loader.classList.add('hidden'), 300);
        }
    }

    // ─── Public API ──────────────────────────────────────────────────
    window.WorkshopAuth = {
        getUser: () => currentUser,
        getClient: () => supabaseClient,
    };

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
