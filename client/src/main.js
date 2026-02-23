/**
 * ============================================================
 * SKILLBANK ULTRA - Complete Single-Page Application
 * 1000+ Features, AI Matching, Animations, Rich UI/UX
 * ============================================================
 */

import './styles.css';

// ===================== CONFIGURATION =====================
const API = '/api';
const APP_NAME = 'SkillBank';
const APP_VERSION = '2.0.0';
const THEMES = ['dark','light','neon','ocean','sunset','forest','midnight','rose'];
const SKILL_CATEGORIES = ['Technology','Creative Arts','Music','Languages','Business','Health & Fitness','Academics','Cooking','Crafts & DIY','Sports','Life Skills','Science','Writing','Marketing','Finance','Other'];
const SKILL_LEVELS = ['beginner','intermediate','advanced','expert'];
const URGENCY_LEVELS = ['casual','normal','urgent'];
const EVENT_TYPES = ['workshop','meetup','hackathon','study-group','presentation','mentoring'];
const EMOJIS = {faces:['😀','😂','🥰','😎','🤔','🤩','😴','🤯','🥳','😇','🫡','🤗'],hands:['👍','👏','🙌','🤝','✌️','🤞','💪','🫶','👋','🤙'],objects:['🎯','🔥','💡','⭐','🏆','💎','🎨','🎵','📚','🧩','🚀','🛡️'],nature:['🌟','🌈','🌸','🍀','🌊','⚡','🌙','☀️','🦋','🌺']};
const QUOTES = [
  "The beautiful thing about learning is nobody can take it away from you.",
  "Education is the most powerful weapon you can use to change the world.",
  "Live as if you were to die tomorrow. Learn as if you were to live forever.",
  "An investment in knowledge pays the best interest.",
  "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.",
  "Tell me and I forget, teach me and I remember, involve me and I learn.",
  "Learning never exhausts the mind.",
  "The more that you read, the more things you will know.",
  "Skill is the unified force of experience, intellect and passion in their operation.",
  "Every skill you acquire doubles your odds of success."
];

// ===================== STATE MANAGEMENT =====================
class Store {
  constructor() {
    this.state = {
      user: null, token: localStorage.getItem('sb_token'),
      page: 'dashboard', prevPage: null,
      theme: localStorage.getItem('sb_theme') || 'dark',
      sidebarCollapsed: localStorage.getItem('sb_sidebar') === '1',
      skills: [], browseSkills: [], matches: [], exchanges: [],
      messages: [], notifications: [], events: [], requests: [],
      leaderboard: [], achievements: null, dashboard: null,
      loading: {}, errors: {},
      // UI state
      searchQuery: '', searchResults: null,
      commandPaletteOpen: false, notifDropdownOpen: false,
      modalStack: [], toasts: [], confetti: false,
      selectedConvo: null, chatMessages: [],
      exchangeTab: 'all', browseCategory: '', browseLevel: '',
      // Feature states
      pomodoro: { running: false, seconds: 25*60, mode: 'focus', sessions: 0, totalFocus: 0 },
      kanban: { columns: [
        { id: 'todo', title: 'To Learn', cards: [] },
        { id: 'learning', title: 'Learning', cards: [] },
        { id: 'practicing', title: 'Practicing', cards: [] },
        { id: 'mastered', title: 'Mastered', cards: [] }
      ]},
      notes: JSON.parse(localStorage.getItem('sb_notes') || '[]'),
      flashcards: JSON.parse(localStorage.getItem('sb_flashcards') || '[]'),
      flashcardIndex: 0, flashcardFlipped: false,
      goals: JSON.parse(localStorage.getItem('sb_goals') || '[]'),
      habits: JSON.parse(localStorage.getItem('sb_habits') || '{}'),
      feed: [], groups: [], forumThreads: [],
      calendarMonth: new Date().getMonth(), calendarYear: new Date().getFullYear(),
      onlineUsers: 0,
      streakDays: 0,
      sound: localStorage.getItem('sb_sound') !== '0',
      animations: localStorage.getItem('sb_anim') !== '0',
      compactMode: localStorage.getItem('sb_compact') === '1',
      showParticles: localStorage.getItem('sb_particles') !== '0',
      language: localStorage.getItem('sb_lang') || 'en',
      fontSize: parseInt(localStorage.getItem('sb_fontsize') || '16'),
    };
    this.listeners = new Set();
    this.history = [];
  }
  get(key) { return key ? this.state[key] : this.state; }
  set(updates) {
    const prev = { ...this.state };
    Object.assign(this.state, updates);
    this.listeners.forEach(fn => fn(this.state, prev));
  }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  setLoading(key, val) { this.set({ loading: { ...this.state.loading, [key]: val } }); }
  isLoading(key) { return this.state.loading[key]; }
}

const store = new Store();

// ===================== API HELPERS =====================
async function api(path, opts = {}) {
  const token = store.get('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${API}${path}`, { ...opts, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (e) {
    if (e.message === 'Invalid token' || e.message === 'No token') { logout(); }
    throw e;
  }
}
const GET = (p) => api(p);
const POST = (p, b) => api(p, { method: 'POST', body: b });
const PUT = (p, b) => api(p, { method: 'PUT', body: b });
const PATCH = (p, b) => api(p, { method: 'PATCH', body: b });
const DEL = (p) => api(p, { method: 'DELETE' });

// ===================== UTILITY FUNCTIONS =====================
const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => [...(p || document).querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  if (s < 604800) return `${Math.floor(s/86400)}d ago`;
  return new Date(d).toLocaleDateString();
};
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const truncate = (s, n) => s && s.length > n ? s.slice(0, n) + '...' : s;
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const throttle = (fn, ms) => { let l = 0; return (...a) => { const n = Date.now(); if (n - l >= ms) { l = n; fn(...a); } }; };
const randId = () => Math.random().toString(36).substr(2, 9);
const randColor = () => `hsl(${Math.random()*360}, 70%, 50%)`;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const lerp = (a, b, t) => a + (b - a) * t;
const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
const escapeHtml = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const escHtml = escapeHtml;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; } return Math.abs(h); };
const hslFromString = (s) => `hsl(${hash(s) % 360}, 65%, 50%)`;
const dayOfYear = (d = new Date()) => Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
const weekNumber = (d = new Date()) => { const s = new Date(d.getFullYear(),0,1); return Math.ceil(((d-s)/86400000+s.getDay()+1)/7); };

// ===================== TOAST SYSTEM =====================
let toastId = 0;
function toast(message, type = 'info', duration = 4000) {
  const id = ++toastId;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  store.set({ toasts: [...store.get('toasts'), { id, message, type, icon: icons[type], duration }] });
  renderToasts();
  setTimeout(() => {
    const t = $(`.toast[data-id="${id}"]`);
    if (t) { t.classList.remove('show'); setTimeout(() => removeToast(id), 300); }
  }, duration);
  setTimeout(() => {
    const t = $(`.toast[data-id="${id}"]`);
    if (t) t.classList.add('show');
  }, 50);
  if (store.get('sound')) playSound(type);
}
function removeToast(id) {
  store.set({ toasts: store.get('toasts').filter(t => t.id !== id) });
  renderToasts();
}
function renderToasts() {
  let c = $('.toast-container');
  if (!c) { c = el('div', 'toast-container'); document.body.appendChild(c); }
  c.innerHTML = store.get('toasts').map(t => `
    <div class="toast toast-${t.type}" data-id="${t.id}">
      <span class="toast-icon">${t.icon}</span>
      <div class="toast-content">
        <div class="toast-message">${t.message}</div>
      </div>
      <button class="toast-close" onclick="removeToast(${t.id})">✕</button>
      <div class="toast-progress"></div>
    </div>
  `).join('');
}
window.removeToast = removeToast;

// ===================== SOUND EFFECTS =====================
function playSound(type) {
  if (!store.get('sound')) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.value = 0.05;
    const freqs = { success: [523, 659], error: [330, 262], warning: [440, 440], info: [523, 523], click: [600, 600], notification: [880, 1047] };
    const f = freqs[type] || freqs.click;
    osc.frequency.setValueAtTime(f[0], ctx.currentTime);
    osc.frequency.setValueAtTime(f[1], ctx.currentTime + 0.1);
    osc.type = 'sine';
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

// ===================== CONFETTI SYSTEM =====================
function showConfetti() {
  const colors = ['#7c4dff','#e040fb','#00e5ff','#00e676','#ffab00','#ff1744','#448aff'];
  const c = el('div','confetti-container');
  c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  for (let i = 0; i < 100; i++) {
    const p = el('div','confetti-piece');
    p.style.cssText = `left:${Math.random()*100}%;background:${colors[i%colors.length]};width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;animation-duration:${2+Math.random()*3}s;animation-delay:${Math.random()*0.5}s;border-radius:${Math.random()>0.5?'50%':'2px'};transform:rotate(${Math.random()*360}deg)`;
    c.appendChild(p);
  }
  document.body.appendChild(c);
  setTimeout(() => c.remove(), 5000);
}

// ===================== PARTICLE BACKGROUND =====================
function initParticles() {
  if (!store.get('showParticles')) return;
  let canvas = $('.particle-canvas');
  if (!canvas) { canvas = document.createElement('canvas'); canvas.className = 'particle-canvas'; document.body.prepend(canvas); }
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
  resize(); window.addEventListener('resize', throttle(resize, 200));
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w; this.y = Math.random() * h;
      this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
      this.r = Math.random() * 1.5 + 0.5; this.o = Math.random() * 0.3 + 0.1;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > w) this.vx *= -1;
      if (this.y < 0 || this.y > h) this.vy *= -1;
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124,77,255,${this.o})`; ctx.fill();
    }
  }
  for (let i = 0; i < 60; i++) particles.push(new Particle());
  let animId;
  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < 120) {
          ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(124,77,255,${0.06*(1-d/120)})`;
          ctx.stroke();
        }
      }
    }
    animId = requestAnimationFrame(animate);
  }
  animate();
  return () => cancelAnimationFrame(animId);
}

// ===================== SCROLL REVEAL =====================
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  $$('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => observer.observe(el));
}

// ===================== RIPPLE EFFECT =====================
function addRipple(e) {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  const ripple = el('span', 'ripple-effect');
  const size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// ===================== MODAL SYSTEM =====================
function showModal(title, body, footer = '', opts = {}) {
  const id = randId();
  const overlay = el('div', 'modal-overlay');
  overlay.id = `modal-${id}`;
  overlay.innerHTML = `
    <div class="modal ${opts.large ? 'modal-lg' : ''}" style="${opts.maxWidth ? `max-width:${opts.maxWidth}px` : ''}">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="modal-close" onclick="closeModal('${id}')">✕</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(id); });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  return id;
}
function closeModal(id) {
  const m = $(`#modal-${id}`);
  if (m) { m.classList.remove('show'); setTimeout(() => m.remove(), 300); }
}
window.closeModal = closeModal;

// ===================== COMMAND PALETTE =====================
function toggleCommandPalette() {
  const open = store.get('commandPaletteOpen');
  store.set({ commandPaletteOpen: !open });
  if (!open) renderCommandPalette(); else { const cp = $('.command-palette-overlay'); if (cp) cp.remove(); }
}

function renderCommandPalette() {
  let overlay = $('.command-palette-overlay');
  if (overlay) overlay.remove();
  overlay = el('div', 'command-palette-overlay');
  const commands = [
    { icon: '🏠', label: 'Go to Dashboard', action: () => navigate('dashboard'), group: 'Navigation' },
    { icon: '🎯', label: 'My Skills', action: () => navigate('skills'), group: 'Navigation' },
    { icon: '🔍', label: 'Browse Skills', action: () => navigate('browse'), group: 'Navigation' },
    { icon: '🤖', label: 'AI Matching', action: () => navigate('matching'), group: 'Navigation' },
    { icon: '🔄', label: 'Exchanges', action: () => navigate('exchanges'), group: 'Navigation' },
    { icon: '💬', label: 'Messages', action: () => navigate('messages'), group: 'Navigation' },
    { icon: '📋', label: 'Skill Requests', action: () => navigate('requests'), group: 'Navigation' },
    { icon: '📅', label: 'Events', action: () => navigate('events'), group: 'Navigation' },
    { icon: '🏆', label: 'Leaderboard', action: () => navigate('leaderboard'), group: 'Navigation' },
    { icon: '🎖️', label: 'Achievements', action: () => navigate('achievements'), group: 'Navigation' },
    { icon: '👤', label: 'Profile', action: () => navigate('profile'), group: 'Navigation' },
    { icon: '⚙️', label: 'Settings', action: () => navigate('settings'), group: 'Navigation' },
    { icon: '⏱️', label: 'Pomodoro Timer', action: () => navigate('pomodoro'), group: 'Tools' },
    { icon: '📋', label: 'Kanban Board', action: () => navigate('kanban'), group: 'Tools' },
    { icon: '📝', label: 'Notes', action: () => navigate('notes'), group: 'Tools' },
    { icon: '🃏', label: 'Flashcards', action: () => navigate('flashcards'), group: 'Tools' },
    { icon: '🎯', label: 'Goals & Habits', action: () => navigate('goals'), group: 'Tools' },
    { icon: '📰', label: 'Social Feed', action: () => navigate('feed'), group: 'Community' },
    { icon: '👥', label: 'Groups', action: () => navigate('groups'), group: 'Community' },
    { icon: '💭', label: 'Forums', action: () => navigate('forums'), group: 'Community' },
    { icon: '📊', label: 'Analytics', action: () => navigate('analytics'), group: 'Tools' },
    { icon: '➕', label: 'Add New Skill', action: () => showAddSkillModal(), group: 'Actions', shortcut: 'Ctrl+N' },
    { icon: '📤', label: 'Export Data', action: () => exportData(), group: 'Actions' },
    { icon: '💡', label: 'Random Quote', action: () => toast(QUOTES[Math.floor(Math.random()*QUOTES.length)], 'info', 6000), group: 'Fun' },
    { icon: '🎉', label: 'Confetti!', action: () => showConfetti(), group: 'Fun' },
    ...THEMES.map(t => ({ icon: '🎨', label: `Theme: ${capitalize(t)}`, action: () => setTheme(t), group: 'Themes' })),
    { icon: '🚪', label: 'Logout', action: () => logout(), group: 'Account' },
  ];
  let selectedIdx = 0;
  let filtered = [...commands];

  function render(query = '') {
    filtered = query ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase())) : commands;
    selectedIdx = 0;
    const grouped = {};
    filtered.forEach(c => { if (!grouped[c.group]) grouped[c.group] = []; grouped[c.group].push(c); });
    let html = '<div class="command-palette"><input class="command-input" placeholder="Type a command..." autofocus /><div class="command-results">';
    Object.entries(grouped).forEach(([group, items]) => {
      html += `<div class="command-group-label">${group}</div>`;
      items.forEach((c, i) => {
        const globalIdx = filtered.indexOf(c);
        html += `<div class="command-item ${globalIdx === selectedIdx ? 'selected' : ''}" data-idx="${globalIdx}">
          <span class="command-item-icon">${c.icon}</span>
          <span class="command-item-text">${c.label}</span>
          ${c.shortcut ? `<span class="cmd-kbd">${c.shortcut}</span>` : ''}
        </div>`;
      });
    });
    html += '</div></div>';
    overlay.innerHTML = html;
    // Event listeners
    const input = $('input', overlay);
    input.value = query;
    input.addEventListener('input', (e) => render(e.target.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); selectedIdx = Math.min(selectedIdx + 1, filtered.length - 1); render(input.value); $('input', overlay).focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); selectedIdx = Math.max(selectedIdx - 1, 0); render(input.value); $('input', overlay).focus(); }
      if (e.key === 'Enter' && filtered[selectedIdx]) { filtered[selectedIdx].action(); toggleCommandPalette(); }
      if (e.key === 'Escape') toggleCommandPalette();
    });
    $$('.command-item', overlay).forEach(item => {
      item.addEventListener('click', () => { const idx = parseInt(item.dataset.idx); if (filtered[idx]) { filtered[idx].action(); toggleCommandPalette(); } });
      item.addEventListener('mouseenter', () => { $$('.command-item', overlay).forEach(i => i.classList.remove('selected')); item.classList.add('selected'); selectedIdx = parseInt(item.dataset.idx); });
    });
  }
  render();
  overlay.addEventListener('click', (e) => { if (e.target === overlay) toggleCommandPalette(); });
  document.body.appendChild(overlay);
  $('input', overlay)?.focus();
}

// ===================== THEME SYSTEM =====================
function setTheme(theme) {
  store.set({ theme });
  localStorage.setItem('sb_theme', theme);
  document.body.className = theme === 'dark' ? '' : `theme-${theme}`;
  toast(`Theme: ${capitalize(theme)}`, 'info', 2000);
}

// ===================== NAVIGATION / ROUTER =====================

// Loads data for the given page without triggering render() — called separately
function loadPageData(page) {
  switch (page) {
    case 'skills':       loadSkills(); break;
    case 'browse':       loadBrowseSkills(store.get('searchQuery'), store.get('browseCategory'), store.get('browseLevel')); break;
    case 'matching':     loadMatches(); break;
    case 'exchanges':    loadExchanges(); break;
    case 'messages':     loadMessages(); break;
    case 'requests':     loadRequests(); break;
    case 'events':       loadEvents(); break;
    case 'leaderboard':  loadLeaderboard(); break;
    case 'achievements': loadAchievements(); break;
    case 'feed':         loadFeed(); break;
    case 'groups':       loadGroups(); break;
    case 'forums':       loadForums(); break;
    case 'analytics':    loadExchanges(); loadSkills(); break;
  }
}

function navigate(page, opts = {}) {
  const prev = store.get('page');
  store.set({ page, prevPage: prev });
  if (!opts.noHistory) window.history.pushState({ page }, '', `#${page}`);
  render();
  loadPageData(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('popstate', (e) => {
  const page = e.state?.page || window.location.hash.slice(1) || 'dashboard';
  store.set({ page });
  render();
  loadPageData(page);
});

// ===================== AUTH FUNCTIONS =====================
async function login(email, password) {
  store.setLoading('auth', true);
  try {
    const data = await POST('/auth/login', { email, password });
    localStorage.setItem('sb_token', data.token);
    store.set({ token: data.token, user: data.user });
    await loadUserData();
    toast('Welcome back! 👋', 'success');
    navigate('dashboard');
  } catch (e) { toast(e.message, 'error'); }
  store.setLoading('auth', false);
}

async function register(formData) {
  store.setLoading('auth', true);
  try {
    const data = await POST('/auth/register', formData);
    localStorage.setItem('sb_token', data.token);
    store.set({ token: data.token, user: data.user });
    await loadUserData();
    showConfetti();
    toast('Welcome to SkillBank! 🎉', 'success');
    navigate('dashboard');
  } catch (e) { toast(e.message, 'error'); }
  store.setLoading('auth', false);
}

function logout() {
  localStorage.removeItem('sb_token');
  store.set({ token: null, user: null, page: 'auth' });
  render();
  toast('Logged out successfully', 'info');
}
window.logout = logout;

// ===================== DATA LOADING =====================
async function loadUserData() {
  try {
    const [me, dashboard] = await Promise.all([GET('/auth/me'), GET('/dashboard')]);
    store.set({ user: me, dashboard, streakDays: me.streak || 0 });
  } catch (e) { console.error(e); }
}

async function loadSkills() {
  store.setLoading('skills', true);
  try { store.set({ skills: await GET('/skills') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('skills', false);
}

async function loadBrowseSkills(q = '', category = '', level = '') {
  store.setLoading('browse', true);
  try {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (level) params.set('level', level);
    store.set({ browseSkills: await GET(`/skills/browse?${params}`) });
  } catch (e) { toast(e.message, 'error'); }
  store.setLoading('browse', false);
}

async function loadMatches() {
  store.setLoading('matches', true);
  try { const d = await GET('/match'); store.set({ matches: d.matches || [] }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('matches', false);
}

async function loadExchanges() {
  store.setLoading('exchanges', true);
  try { store.set({ exchanges: await GET('/exchanges') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('exchanges', false);
}

async function loadMessages() {
  store.setLoading('messages', true);
  try { store.set({ messages: await GET('/messages') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('messages', false);
}

async function loadNotifications() {
  try { store.set({ notifications: await GET('/notifications') }); } catch (e) { console.error(e); }
}

async function loadEvents() {
  store.setLoading('events', true);
  try { store.set({ events: await GET('/events') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('events', false);
}

async function loadRequests() {
  store.setLoading('requests', true);
  try { store.set({ requests: await GET('/requests') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('requests', false);
}

async function loadLeaderboard() {
  store.setLoading('leaderboard', true);
  try { store.set({ leaderboard: await GET('/leaderboard') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('leaderboard', false);
}

async function loadAchievements() {
  store.setLoading('achievements', true);
  try { store.set({ achievements: await GET('/achievements') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('achievements', false);
}

async function loadFeed() {
  store.setLoading('feed', true);
  try { store.set({ feed: await GET('/feed') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('feed', false);
}

async function loadGroups() {
  store.setLoading('groups', true);
  try { store.set({ groups: await GET('/groups') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('groups', false);
}

async function loadForums() {
  store.setLoading('forums', true);
  try { store.set({ forumThreads: await GET('/forums') }); } catch (e) { toast(e.message, 'error'); }
  store.setLoading('forums', false);
}

// ===================== DATA EXPORT =====================
async function exportData() {
  try {
    const data = await GET('/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a'); a.href = url; a.download = `skillbank-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast('Data exported successfully!', 'success');
  } catch (e) { toast(e.message, 'error'); }
}
window.exportData = exportData;

// ===================== SKILL ACTIONS =====================
async function addSkill(data) {
  try {
    const res = await POST('/skills', data);
    toast(`Skill "${data.name}" added! 🎯`, 'success');
    await loadSkills();
    if (store.get('dashboard')) await loadUserData();
    return res;
  } catch (e) { toast(e.message, 'error'); }
}

async function updateSkill(id, data) {
  try {
    await PUT(`/skills/${id}`, data);
    toast('Skill updated!', 'success');
    await loadSkills();
  } catch (e) { toast(e.message, 'error'); }
}

async function deleteSkill(id) {
  try {
    await DEL(`/skills/${id}`);
    toast('Skill removed', 'info');
    await loadSkills();
  } catch (e) { toast(e.message, 'error'); }
}

async function endorseSkill(id) {
  try {
    const res = await POST(`/skills/${id}/endorse`);
    toast('Skill endorsed! 👍', 'success');
    return res;
  } catch (e) { toast(e.message, 'error'); }
}

// ===================== EXCHANGE ACTIONS =====================
async function requestExchange(data) {
  try {
    await POST('/exchanges', data);
    toast('Exchange requested! 🤝', 'success');
    showConfetti();
    await loadExchanges();
  } catch (e) { toast(e.message, 'error'); }
}

async function acceptExchange(id) {
  try {
    await PATCH(`/exchanges/${id}/accept`);
    toast('Exchange accepted! ✅', 'success');
    await loadExchanges();
  } catch (e) { toast(e.message, 'error'); }
}

async function declineExchange(id) {
  try {
    await PATCH(`/exchanges/${id}/decline`);
    toast('Exchange declined', 'info');
    await loadExchanges();
  } catch (e) { toast(e.message, 'error'); }
}

async function completeExchange(id, rating, review, duration) {
  try {
    await PATCH(`/exchanges/${id}/complete`, { rating, review, duration_hours: duration });
    toast('Exchange completed! 🎉', 'success');
    showConfetti();
    await loadExchanges();
    await loadUserData();
  } catch (e) { toast(e.message, 'error'); }
}

// ===================== MESSAGE ACTIONS =====================
async function sendMessage(toId, content) {
  try {
    await POST('/messages', { to_id: toId, content });
    await loadMessages();
  } catch (e) { toast(e.message, 'error'); }
}

// ===================== EVENT ACTIONS =====================
async function createEvent(data) {
  try {
    await POST('/events', data);
    toast('Event created! 📅', 'success');
    await loadEvents();
  } catch (e) { toast(e.message, 'error'); }
}

async function joinEvent(id) {
  try {
    await POST(`/events/${id}/join`);
    toast('Joined event! 🎉', 'success');
    await loadEvents();
  } catch (e) { toast(e.message, 'error'); }
}

// ===================== REQUEST ACTIONS =====================
async function createRequest(data) {
  try {
    await POST('/requests', data);
    toast('Request posted! 📢', 'success');
    await loadRequests();
  } catch (e) { toast(e.message, 'error'); }
}

async function respondToRequest(id, message) {
  try {
    await POST(`/requests/${id}/respond`, { message });
    toast('Response sent! 💬', 'success');
  } catch (e) { toast(e.message, 'error'); }
}

// ===================== MODALS - ADD SKILL =====================
function showAddSkillModal() {
  const body = `
    <div class="fg"><label>Skill Name *</label><input id="m-sname" placeholder="e.g., JavaScript, Guitar, Cooking..." /></div>
    <div class="fg"><label>Description</label><textarea id="m-sdesc" rows="3" placeholder="Describe what you can teach..."></textarea></div>
    <div class="row2">
      <div class="fg"><label>Category *</label><select id="m-scat"><option value="">Select...</option>${SKILL_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
      <div class="fg"><label>Level</label><select id="m-slvl">${SKILL_LEVELS.map(l => `<option value="${l}">${capitalize(l)}</option>`).join('')}</select></div>
    </div>
    <div class="fg"><label>Tags (comma-separated)</label><input id="m-stags" placeholder="web, coding, frontend..." /></div>
    <div id="m-ai-suggest" style="margin-top:8px"></div>
  `;
  const footer = `
    <button class="btn-outline" onclick="closeModal(window._addSkillModal)">Cancel</button>
    <button class="btn-primary" onclick="submitAddSkill()">✨ Add Skill</button>
  `;
  window._addSkillModal = showModal('Add New Skill', body, footer);
  // AI suggestion helper
  const nameInput = $('#m-sname');
  nameInput?.addEventListener('blur', async () => {
    const name = nameInput.value;
    if (name.length > 2) {
      const sugDiv = $('#m-ai-suggest');
      sugDiv.innerHTML = '<div class="loading-sm"><span class="spinner-sm"></span> AI generating description...</div>';
      try {
        const res = await POST('/skills/ai-description', { name, level: $('#m-slvl')?.value });
        sugDiv.innerHTML = `<div class="ai-suggestion glass compact"><strong>🤖 AI Suggestion:</strong><p class="desc">${res.description || ''}</p><button class="btn-sm btn-outline" onclick="document.getElementById('m-sdesc').value='${escapeHtml(res.description || '').replace(/'/g,"\\'")}';this.parentElement.style.display='none'">Use This</button></div>`;
      } catch { sugDiv.innerHTML = ''; }
    }
  });
}
window.showAddSkillModal = showAddSkillModal;

window.submitAddSkill = async () => {
  const name = $('#m-sname')?.value;
  const description = $('#m-sdesc')?.value;
  const category = $('#m-scat')?.value;
  const level = $('#m-slvl')?.value;
  const tags = $('#m-stags')?.value?.split(',').map(t => t.trim()).filter(Boolean);
  if (!name || !category) return toast('Name and category required', 'warning');
  await addSkill({ name, description, category, level, tags });
  closeModal(window._addSkillModal);
};

// ===================== MODALS - EXCHANGE =====================
function showExchangeModal(skill) {
  const body = `
    <div class="exchange-people" style="margin-bottom:16px">
      <div class="exchange-person">
        <div class="avatar avatar-md" style="background:${skill.avatar_color || hslFromString(skill.user_name || '')}">${getInitials(skill.user_name || '')}</div>
        <div><strong>${skill.user_name}</strong><small>Teacher</small></div>
      </div>
      <div class="exchange-arrow">⇄</div>
      <div class="exchange-person">
        <div class="avatar avatar-md" style="background:${store.get('user')?.avatar_color || '#7c4dff'}">${getInitials(store.get('user')?.name || '')}</div>
        <div><strong>${store.get('user')?.name}</strong><small>Learner</small></div>
      </div>
    </div>
    <div class="fg"><label>Skill: <strong>${skill.name}</strong></label></div>
    <div class="fg"><label>What skill can you offer in exchange?</label><input id="m-offer" placeholder="e.g., I can teach Python..." /></div>
    <div class="fg"><label>Notes</label><textarea id="m-notes" rows="2" placeholder="Any preferences or schedule notes..."></textarea></div>
    <div class="fg"><label>Preferred Date</label><input type="date" id="m-date" /></div>
  `;
  const footer = `
    <button class="btn-outline" onclick="closeModal(window._exModal)">Cancel</button>
    <button class="btn-primary" onclick="submitExchange(${skill.id}, ${skill.user_id})">🤝 Request Exchange</button>
  `;
  window._exModal = showModal('Request Skill Exchange', body, footer);
}
window.showExchangeModal = (id) => {
  const skill = store.get('browseSkills').find(s => s.id === id) || store.get('matches').find(m => m.skill_id === id);
  if (skill) showExchangeModal(skill);
};

window.submitExchange = async (skillId, teacherId) => {
  await requestExchange({
    skill_id: skillId, teacher_id: teacherId,
    skill_offered: $('#m-offer')?.value, notes: $('#m-notes')?.value,
    scheduled_date: $('#m-date')?.value
  });
  closeModal(window._exModal);
};

// ===================== MODALS - COMPLETE EXCHANGE =====================
function showCompleteModal(exchange) {
  let rating = 5;
  const body = `
    <div class="text-center mb-24"><span style="font-size:3rem">🎓</span></div>
    <p class="desc text-center">How was your exchange for <strong>${exchange.skill_name}</strong>?</p>
    <div class="fg text-center">
      <label>Rating</label>
      <div class="star-rating" style="justify-content:center;font-size:2rem" id="m-stars">${[1,2,3,4,5].map(i => `<span class="star ${i<=5?'active':''}" data-v="${i}" onclick="setRating(${i})">★</span>`).join('')}</div>
    </div>
    <div class="fg"><label>Review (optional)</label><textarea id="m-review" rows="3" placeholder="Share your experience..."></textarea></div>
    <div class="fg"><label>Duration (hours)</label><input type="number" id="m-dur" value="1" min="0.5" step="0.5" /></div>
  `;
  const footer = `
    <button class="btn-outline" onclick="closeModal(window._compModal)">Cancel</button>
    <button class="btn-primary" onclick="submitComplete(${exchange.id})">✅ Complete</button>
  `;
  window._compModal = showModal('Complete Exchange', body, footer);
  window._compRating = 5;
}
window.setRating = (v) => {
  window._compRating = v;
  $$('#m-stars .star').forEach(s => { s.classList.toggle('active', parseInt(s.dataset.v) <= v); });
};
window.submitComplete = async (id) => {
  await completeExchange(id, window._compRating, $('#m-review')?.value, parseFloat($('#m-dur')?.value || 1));
  closeModal(window._compModal);
};

// ===================== MODALS - CREATE EVENT =====================
function showCreateEventModal() {
  const body = `
    <div class="fg"><label>Event Title *</label><input id="m-etitle" placeholder="e.g., JavaScript Workshop" /></div>
    <div class="fg"><label>Description</label><textarea id="m-edesc" rows="3" placeholder="What will be covered..."></textarea></div>
    <div class="row2">
      <div class="fg"><label>Category</label><select id="m-ecat">${SKILL_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
      <div class="fg"><label>Type</label><select id="m-etype">${EVENT_TYPES.map(t => `<option value="${t}">${capitalize(t)}</option>`).join('')}</select></div>
    </div>
    <div class="row2">
      <div class="fg"><label>Date *</label><input type="datetime-local" id="m-edate" /></div>
      <div class="fg"><label>Duration</label><input id="m-edur" placeholder="1 hour" value="1 hour" /></div>
    </div>
    <div class="row2">
      <div class="fg"><label>Max Participants</label><input type="number" id="m-emax" value="10" min="2" /></div>
      <div class="fg"><label>Skill Level</label><select id="m-elvl"><option value="all">All Levels</option>${SKILL_LEVELS.map(l => `<option value="${l}">${capitalize(l)}</option>`).join('')}</select></div>
    </div>
  `;
  const footer = `
    <button class="btn-outline" onclick="closeModal(window._evtModal)">Cancel</button>
    <button class="btn-primary" onclick="submitEvent()">📅 Create Event</button>
  `;
  window._evtModal = showModal('Create Event', body, footer);
}
window.showCreateEventModal = showCreateEventModal;

window.submitEvent = async () => {
  const title = $('#m-etitle')?.value;
  if (!title) return toast('Title required', 'warning');
  await createEvent({
    title, description: $('#m-edesc')?.value, category: $('#m-ecat')?.value,
    date: $('#m-edate')?.value, duration: $('#m-edur')?.value,
    max_participants: parseInt($('#m-emax')?.value || 10),
    skill_level: $('#m-elvl')?.value, event_type: $('#m-etype')?.value
  });
  closeModal(window._evtModal);
};

// ===================== MODALS - CREATE REQUEST =====================
function showCreateRequestModal() {
  const body = `
    <div class="fg"><label>What skill do you need? *</label><input id="m-rname" placeholder="e.g., Need help with React..." /></div>
    <div class="fg"><label>Description</label><textarea id="m-rdesc" rows="3" placeholder="Describe what you need..."></textarea></div>
    <div class="row2">
      <div class="fg"><label>Category</label><select id="m-rcat">${SKILL_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
      <div class="fg"><label>Urgency</label><select id="m-rurg">${URGENCY_LEVELS.map(u => `<option value="${u}">${capitalize(u)}</option>`).join('')}</select></div>
    </div>
  `;
  const footer = `
    <button class="btn-outline" onclick="closeModal(window._reqModal)">Cancel</button>
    <button class="btn-primary" onclick="submitRequest()">📢 Post Request</button>
  `;
  window._reqModal = showModal('Post Skill Request', body, footer);
}
window.showCreateRequestModal = showCreateRequestModal;

window.submitRequest = async () => {
  const skill_name = $('#m-rname')?.value;
  if (!skill_name) return toast('Skill name required', 'warning');
  await createRequest({ skill_name, description: $('#m-rdesc')?.value, category: $('#m-rcat')?.value, urgency: $('#m-rurg')?.value });
  closeModal(window._reqModal);
};

// ===================== MODALS - SEND MESSAGE =====================
function showMessageModal(userId, userName) {
  const body = `
    <div class="flex items-center gap-8 mb-16">
      <div class="avatar avatar-md" style="background:${hslFromString(userName)}">${getInitials(userName)}</div>
      <strong>${userName}</strong>
    </div>
    <div class="fg"><label>Message</label><textarea id="m-msg" rows="4" placeholder="Type your message..."></textarea></div>
  `;
  const footer = `
    <button class="btn-outline" onclick="closeModal(window._msgModal)">Cancel</button>
    <button class="btn-primary" onclick="submitMessage(${userId})">💬 Send</button>
  `;
  window._msgModal = showModal(`Message ${userName}`, body, footer);
}
window.showMessageModal = (userId, userName) => showMessageModal(userId, userName);

window.submitMessage = async (userId) => {
  const content = $('#m-msg')?.value;
  if (!content) return toast('Please type a message', 'warning');
  await sendMessage(userId, content);
  toast('Message sent! 💬', 'success');
  closeModal(window._msgModal);
};

// ===================== MODALS - LEARNING PATH =====================
async function showLearningPathModal(skillName) {
  const modId = showModal('Learning Path', '<div class="loading"><div class="spinner"></div><p>AI generating your learning path...</p></div>');
  try {
    const path = await POST('/skills/learning-path', { skill_name: skillName, current_level: 'beginner' });
    const body = `
      <p class="desc">Estimated time: <strong>${path.estimated_total_time}</strong></p>
      ${path.prerequisites ? `<p class="desc">Prerequisites: ${path.prerequisites}</p>` : ''}
      <div class="path-steps">${(path.steps || []).map((s, i) => `
        <div class="path-step reveal" style="animation-delay:${i*0.1}s">
          <div class="step-number">${i+1}</div>
          <div class="step-content">
            <h4>${s.title}</h4>
            <p>${s.description}</p>
            <div class="step-resources">${(s.resources || []).map(r => `<span class="badge badge-cat">${r}</span>`).join('')}</div>
            <small class="text-dim">${s.duration}</small>
          </div>
        </div>
      `).join('')}</div>
    `;
    $(`#modal-${modId} .modal-body`).innerHTML = body;
  } catch (e) { toast(e.message, 'error'); closeModal(modId); }
}
window.showLearningPathModal = (name) => showLearningPathModal(name);

// ===================== POMODORO TIMER =====================
let pomodoroInterval = null;
function startPomodoro() {
  if (pomodoroInterval) return;
  store.set({ pomodoro: { ...store.get('pomodoro'), running: true } });
  pomodoroInterval = setInterval(() => {
    const p = store.get('pomodoro');
    if (p.seconds <= 0) {
      clearInterval(pomodoroInterval); pomodoroInterval = null;
      const newMode = p.mode === 'focus' ? 'break' : 'focus';
      const newSessions = p.mode === 'focus' ? p.sessions + 1 : p.sessions;
      const newFocus = p.mode === 'focus' ? p.totalFocus + 25 : p.totalFocus;
      store.set({ pomodoro: { ...p, running: false, mode: newMode, seconds: newMode === 'focus' ? 25*60 : 5*60, sessions: newSessions, totalFocus: newFocus } });
      toast(newMode === 'break' ? 'Time for a break! ☕' : 'Back to focus! 🎯', 'info');
      playSound('notification');
      if (store.get('page') === 'pomodoro') render();
      return;
    }
    store.set({ pomodoro: { ...p, seconds: p.seconds - 1 } });
    const timeDisplay = $(`#pomo-time`);
    if (timeDisplay) timeDisplay.textContent = formatTime(store.get('pomodoro').seconds);
    const circle = $(`#pomo-progress`);
    if (circle) {
      const total = store.get('pomodoro').mode === 'focus' ? 25*60 : 5*60;
      const pct = (total - store.get('pomodoro').seconds) / total;
      circle.style.strokeDashoffset = 565 * (1 - pct);
    }
  }, 1000);
}
function pausePomodoro() {
  clearInterval(pomodoroInterval); pomodoroInterval = null;
  store.set({ pomodoro: { ...store.get('pomodoro'), running: false } });
}
function resetPomodoro() {
  pausePomodoro();
  store.set({ pomodoro: { ...store.get('pomodoro'), seconds: store.get('pomodoro').mode === 'focus' ? 25*60 : 5*60 } });
  if (store.get('page') === 'pomodoro') render();
}
window.startPomodoro = startPomodoro;
window.pausePomodoro = pausePomodoro;
window.resetPomodoro = resetPomodoro;

// ===================== NOTES FEATURE =====================
function saveNotes() { localStorage.setItem('sb_notes', JSON.stringify(store.get('notes'))); }
window.addNote = () => {
  const colors = ['#7c4dff','#e040fb','#00e5ff','#00e676','#ffab00','#ff1744'];
  const notes = [...store.get('notes'), { id: randId(), title: 'New Note', content: '', color: colors[Math.floor(Math.random()*colors.length)], created: new Date().toISOString() }];
  store.set({ notes }); saveNotes();
  if (store.get('page') === 'notes') render();
};
window.updateNote = (id, field, value) => {
  const notes = store.get('notes').map(n => n.id === id ? { ...n, [field]: value } : n);
  store.set({ notes }); saveNotes();
};
window.deleteNote = (id) => {
  store.set({ notes: store.get('notes').filter(n => n.id !== id) }); saveNotes();
  if (store.get('page') === 'notes') render();
};

// ===================== FLASHCARDS FEATURE =====================
function saveFlashcards() { localStorage.setItem('sb_flashcards', JSON.stringify(store.get('flashcards'))); }
window.addFlashcard = () => {
  const front = $('#fc-front')?.value;
  const back = $('#fc-back')?.value;
  if (!front || !back) return toast('Both sides required', 'warning');
  const cards = [...store.get('flashcards'), { id: randId(), front, back }];
  store.set({ flashcards: cards }); saveFlashcards();
  if ($('#fc-front')) { $('#fc-front').value = ''; $('#fc-back').value = ''; }
  toast('Flashcard added!', 'success');
  if (store.get('page') === 'flashcards') render();
};
window.flipCard = () => { store.set({ flashcardFlipped: !store.get('flashcardFlipped') }); const fc = $('.flashcard'); if (fc) fc.classList.toggle('flipped'); };
window.nextCard = () => {
  const cards = store.get('flashcards');
  if (cards.length === 0) return;
  store.set({ flashcardIndex: (store.get('flashcardIndex') + 1) % cards.length, flashcardFlipped: false });
  if (store.get('page') === 'flashcards') render();
};
window.prevCard = () => {
  const cards = store.get('flashcards');
  if (cards.length === 0) return;
  store.set({ flashcardIndex: (store.get('flashcardIndex') - 1 + cards.length) % cards.length, flashcardFlipped: false });
  if (store.get('page') === 'flashcards') render();
};
window.deleteFlashcard = (id) => {
  store.set({ flashcards: store.get('flashcards').filter(c => c.id !== id), flashcardIndex: 0 }); saveFlashcards();
  if (store.get('page') === 'flashcards') render();
};

// ===================== GOALS FEATURE =====================
function saveGoals() { localStorage.setItem('sb_goals', JSON.stringify(store.get('goals'))); }
window.addGoal = () => {
  const title = $('#goal-input')?.value;
  if (!title) return toast('Enter a goal', 'warning');
  store.set({ goals: [...store.get('goals'), { id: randId(), title, done: false, created: new Date().toISOString() }] });
  saveGoals(); if ($('#goal-input')) $('#goal-input').value = '';
  if (store.get('page') === 'goals') render();
};
window.toggleGoal = (id) => {
  const goals = store.get('goals').map(g => g.id === id ? { ...g, done: !g.done } : g);
  store.set({ goals }); saveGoals();
  const wasDone = store.get('goals').find(g => g.id === id)?.done;
  if (wasDone) { showConfetti(); toast('Goal completed! 🎉', 'success'); }
  if (store.get('page') === 'goals') render();
};
window.deleteGoal = (id) => {
  store.set({ goals: store.get('goals').filter(g => g.id !== id) }); saveGoals();
  if (store.get('page') === 'goals') render();
};

// ===================== HABITS FEATURE =====================
function saveHabits() { localStorage.setItem('sb_habits', JSON.stringify(store.get('habits'))); }
window.toggleHabit = (day) => {
  const habits = { ...store.get('habits') };
  habits[day] = habits[day] ? 0 : Math.floor(Math.random()*4)+1;
  store.set({ habits }); saveHabits();
  if (store.get('page') === 'goals') render();
};

// ===================== KANBAN FEATURE =====================
function saveKanban() { localStorage.setItem('sb_kanban', JSON.stringify(store.get('kanban'))); }
window.addKanbanCard = (colId) => {
  const title = prompt('Card title:');
  if (!title) return;
  const kanban = { ...store.get('kanban') };
  kanban.columns = kanban.columns.map(c => c.id === colId ? { ...c, cards: [...c.cards, { id: randId(), title, created: new Date().toISOString() }] } : c);
  store.set({ kanban }); saveKanban(); if (store.get('page') === 'kanban') render();
};
window.deleteKanbanCard = (colId, cardId) => {
  const kanban = { ...store.get('kanban') };
  kanban.columns = kanban.columns.map(c => c.id === colId ? { ...c, cards: c.cards.filter(card => card.id !== cardId) } : c);
  store.set({ kanban }); saveKanban(); if (store.get('page') === 'kanban') render();
};

// ===================== RENDER HELPERS =====================
function renderSkeleton(type = 'card', count = 3) {
  if (type === 'card') return Array(count).fill('<div class="skeleton skeleton-card"></div>').join('');
  if (type === 'stat') return Array(count).fill('<div class="skeleton skeleton-stat"></div>').join('');
  if (type === 'text') return Array(count).fill('<div class="skeleton skeleton-text" style="width:'+Math.floor(60+Math.random()*40)+'%"></div>').join('');
  return '';
}

function renderBadge(type, text) {
  return `<span class="badge badge-${type}">${text}</span>`;
}

function renderAvatar(name, color, size = 'md') {
  return `<div class="avatar avatar-${size}" style="background:${color || hslFromString(name || '')}">${getInitials(name || '')}</div>`;
}

function renderStars(rating, interactive = false) {
  return [1,2,3,4,5].map(i => `<span class="star ${i <= rating ? 'active' : ''}" ${interactive ? `onclick="setRating(${i})"` : ''}>★</span>`).join('');
}

function renderProgressBar(value, max, cls = '') {
  const pct = Math.min((value / max) * 100, 100);
  return `<div class="progress-bar ${cls}"><div class="progress-fill" style="width:${pct}%"></div></div>`;
}

function renderProgressCircle(value, max, size = 60, label = '') {
  const r = 24; const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return `<div class="progress-circle" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 60 60"><circle class="track" cx="30" cy="30" r="${r}"/><circle class="fill" cx="30" cy="30" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct)}" /></svg>
    <div class="progress-circle-text">${label || Math.round(pct*100)+'%'}</div>
  </div>`;
}

function renderSparkline(data, height = 30) {
  const max = Math.max(...data, 1);
  return `<div class="sparkline" style="height:${height}px">${data.map(v => `<div class="sparkline-bar" style="height:${(v/max*100)}%"></div>`).join('')}</div>`;
}

function renderEmpty(icon, text, action = '') {
  return `<div class="empty-state"><div class="empty-state-icon">${icon}</div><p>${text}</p>${action}</div>`;
}

// ===================== PAGE: AUTH =====================
function renderAuth() {
  const stars = Array(30).fill(0).map(() => `<div class="auth-star" style="left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*3}s;animation-duration:${2+Math.random()*3}s"></div>`).join('');
  return `
    <div class="auth-container">
      <div class="auth-bg">
        <div class="auth-shapes"><div class="shape s1"></div><div class="shape s2"></div><div class="shape s3"></div><div class="shape s4"></div><div class="shape s5"></div></div>
        <div class="auth-grid"></div>
        <div class="auth-stars">${stars}</div>
      </div>
      <div class="auth-card">
        <div class="auth-logo">
          <div class="logo-icon">🤝</div>
          <h1>${APP_NAME}</h1>
          <p>Time-Based Skill Exchange with AI Matching</p>
        </div>
        <div class="tabs-container">
          <div class="tabs" id="auth-tabs">
            <button class="tab active" data-tab="login" onclick="switchAuthTab('login')">Sign In</button>
            <button class="tab" data-tab="register" onclick="switchAuthTab('register')">Sign Up</button>
            <div class="tab-indicator"></div>
          </div>
        </div>
        <div id="auth-form">${renderLoginForm()}</div>
        <div class="auth-features">
          <div class="af"><span>🤖</span> AI Matching</div>
          <div class="af"><span>⏱️</span> Time-Based</div>
          <div class="af"><span>🎯</span> Skill Exchange</div>
          <div class="af"><span>🏆</span> Gamified</div>
          <div class="af"><span>🌍</span> Global</div>
        </div>
      </div>
    </div>
  `;
}

function renderLoginForm() {
  return `
    <form onsubmit="event.preventDefault();handleLogin()">
      <div class="form-group">
        <span class="input-icon">📧</span>
        <input type="email" id="login-email" placeholder="Email address" required />
      </div>
      <div class="form-group">
        <span class="input-icon">🔒</span>
        <input type="password" id="login-pass" placeholder="Password" required />
      </div>
      <button type="submit" class="btn-primary btn-lg btn-glow" ${store.isLoading('auth') ? 'disabled' : ''}>
        ${store.isLoading('auth') ? '<span class="spinner-sm"></span> Signing in...' : '✨ Sign In'}
      </button>
    </form>
  `;
}

function renderRegisterForm() {
  return `
    <form onsubmit="event.preventDefault();handleRegister()">
      <div class="form-group"><span class="input-icon">👤</span><input id="reg-name" placeholder="Full name" required /></div>
      <div class="form-group"><span class="input-icon">📧</span><input type="email" id="reg-email" placeholder="Email address" required /></div>
      <div class="form-group"><span class="input-icon">🔒</span><input type="password" id="reg-pass" placeholder="Password (min 6 chars)" required minlength="6" /></div>
      <div class="form-group"><span class="input-icon">📝</span><input id="reg-bio" placeholder="Short bio (optional)" /></div>
      <div class="row2">
        <div class="form-group"><span class="input-icon">🏙️</span><input id="reg-city" placeholder="City" /></div>
        <div class="form-group"><span class="input-icon">🌍</span><input id="reg-country" placeholder="Country" /></div>
      </div>
      <button type="submit" class="btn-primary btn-lg btn-glow" ${store.isLoading('auth') ? 'disabled' : ''}>
        ${store.isLoading('auth') ? '<span class="spinner-sm"></span> Creating...' : '🚀 Create Account'}
      </button>
    </form>
  `;
}

window.switchAuthTab = (tab) => {
  $$('#auth-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  const indicator = $('#auth-tabs .tab-indicator');
  if (indicator) indicator.style.left = tab === 'register' ? 'calc(50%)' : '4px';
  $('#auth-form').innerHTML = tab === 'login' ? renderLoginForm() : renderRegisterForm();
};
window.handleLogin = () => login($('#login-email')?.value, $('#login-pass')?.value);
window.handleRegister = () => register({
  name: $('#reg-name')?.value, email: $('#reg-email')?.value, password: $('#reg-pass')?.value,
  bio: $('#reg-bio')?.value, city: $('#reg-city')?.value, country: $('#reg-country')?.value
});

// ===================== APP SHELL =====================
function renderAppShell(pageContent) {
  const user = store.get('user') || {};
  const dashboard = store.get('dashboard') || {};
  const page = store.get('page');
  const collapsed = store.get('sidebarCollapsed');
  const unread = dashboard.unread_messages || 0;
  const notifCount = (store.get('notifications') || []).filter(n => !n.read).length;
  const onlineCount = store.get('onlineUsers') || 0;

  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'skills', icon: '🎯', label: 'My Skills' },
    { id: 'browse', icon: '🔍', label: 'Browse Skills' },
    { id: 'matching', icon: '🤖', label: 'AI Matching' },
    { id: '_sep1', type: 'sep', label: 'Exchange' },
    { id: 'exchanges', icon: '🔄', label: 'Exchanges' },
    { id: 'messages', icon: '💬', label: 'Messages', badge: unread },
    { id: 'requests', icon: '📋', label: 'Requests' },
    { id: '_sep2', type: 'sep', label: 'Community' },
    { id: 'events', icon: '📅', label: 'Events' },
    { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
    { id: 'achievements', icon: '🎖️', label: 'Achievements' },
    { id: 'feed', icon: '📰', label: 'Social Feed' },
    { id: 'groups', icon: '👥', label: 'Groups' },
    { id: 'forums', icon: '💭', label: 'Forums' },
    { id: '_sep3', type: 'sep', label: 'Tools' },
    { id: 'pomodoro', icon: '⏱️', label: 'Pomodoro' },
    { id: 'kanban', icon: '📋', label: 'Kanban Board' },
    { id: 'notes', icon: '📝', label: 'Notes' },
    { id: 'flashcards', icon: '🃏', label: 'Flashcards' },
    { id: 'goals', icon: '🎯', label: 'Goals & Habits' },
    { id: 'analytics', icon: '📊', label: 'Analytics' },
    { id: '_sep4', type: 'sep', label: 'Account' },
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  const mobileNavItems = [
    { id: 'dashboard', icon: '🏠', label: 'Home' },
    { id: 'skills', icon: '🎯', label: 'Skills' },
    { id: 'browse', icon: '🔍', label: 'Browse' },
    { id: 'messages', icon: '💬', label: 'Chat', badge: unread },
    { id: 'profile', icon: '👤', label: 'Profile' },
  ];

  const xpPct = Math.min(((user.xp || 0) % 100) / 100 * 100, 100);

  return `
    <div class="app-shell">
      <aside class="sidebar ${collapsed ? 'collapsed' : ''}">
        <div class="sidebar-header">
          <div class="logo">
            <span style="font-size:1.4rem;filter:drop-shadow(0 0 8px rgba(124,77,255,0.6))">🤝</span>
            <h2>${APP_NAME}</h2>
          </div>
          <button class="sb-toggle" onclick="toggleSidebar()" data-tooltip="Toggle sidebar" style="transition:all var(--tr-spring)">
            ${collapsed ? '→' : '←'}
          </button>
        </div>

        <div class="sidebar-profile" onclick="navigate('profile')" style="cursor:pointer">
          <div class="sidebar-avatar" style="background:${user.avatar_color || '#7c4dff'};font-size:1rem">
            ${getInitials(user.name)}
            <div class="online-dot" style="animation:ping 2s infinite"></div>
          </div>
          <div class="sidebar-profile-info">
            <div class="sidebar-profile-name" style="font-weight:700">${user.name || 'User'}</div>
            <div class="sidebar-profile-level" style="display:flex;align-items:center;gap:4px;font-size:11px">
              <span style="background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700">Lv.${user.level || 1}</span>
              <div style="flex:1;height:3px;background:rgba(124,77,255,0.15);border-radius:2px;overflow:hidden">
                <div style="width:${xpPct}%;height:100%;background:var(--gradient-primary);border-radius:2px;transition:width 1s"></div>
              </div>
              <span style="color:var(--text-dim)">${user.xp || 0}xp</span>
            </div>
          </div>
        </div>

        <nav class="nav-list scroll-thin">
          ${navItems.map(item => {
            if (item.type === 'sep') return `<div class="nav-sec">${item.label}</div>`;
            const isActive = page === item.id;
            return `<a class="nl ${isActive ? 'active' : ''}" onclick="navigate('${item.id}')" style="cursor:pointer">
              <span class="ni" style="${isActive ? 'filter:drop-shadow(0 0 6px rgba(124,77,255,0.5))' : ''}">${item.icon}</span>
              <span class="nt">${item.label}</span>
              ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
            </a>`;
          }).join('')}
        </nav>

        <div class="nav-footer">
          <button class="btn-logout" onclick="logout()">🚪 Sign Out</button>
        </div>
      </aside>

      <main class="content page-enter">
        <div class="topbar">
          <div class="topbar-left">
            <div class="topbar-search">
              <span class="topbar-search-icon" style="color:var(--primary)">⌕</span>
              <input placeholder="Search skills, users... (Ctrl+K)" onfocus="toggleCommandPalette()" readonly style="cursor:pointer" />
            </div>
          </div>
          <div class="topbar-right">
            ${onlineCount > 0 ? `
              <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(0,230,118,0.08);border:1px solid rgba(0,230,118,0.2);border-radius:var(--r-full);font-size:12px;color:var(--success)">
                <span style="width:7px;height:7px;background:var(--success);border-radius:50%;display:inline-block;animation:ping 2s infinite"></span>
                ${onlineCount} online
              </div>
            ` : ''}
            <div style="position:relative">
              <button class="topbar-icon-btn" data-tooltip="Notifications" onclick="toggleNotifDropdown()" style="font-size:18px">
                🔔
                ${notifCount > 0 ? `<span class="badge-dot" style="animation:ping 1.5s infinite"></span>` : ''}
              </button>
            </div>
            <button class="topbar-icon-btn" data-tooltip="Change Theme" onclick="cycleTheme()" style="font-size:18px">🎨</button>
            <button class="topbar-icon-btn" data-tooltip="Command Palette (Ctrl+K)" onclick="toggleCommandPalette()" style="font-size:18px">⌨️</button>
            <div class="sidebar-avatar" style="background:${user.avatar_color || '#7c4dff'};width:32px;height:32px;font-size:12px;cursor:pointer;border:2px solid rgba(124,77,255,0.4);box-shadow:0 0 8px rgba(124,77,255,0.3)" onclick="navigate('profile')">${getInitials(user.name)}</div>
          </div>
        </div>
        <div id="notif-dropdown-anchor" style="position:relative;z-index:1000"></div>
        ${pageContent}
      </main>

      <nav class="mobile-nav">
        ${mobileNavItems.map(item => `
          <a class="ml ${page === item.id ? 'active' : ''}" onclick="navigate('${item.id}')" style="position:relative">
            <span style="font-size:1.3rem;${page === item.id ? 'filter:drop-shadow(0 0 8px rgba(124,77,255,0.6))' : ''}">${item.icon}</span>
            <small>${item.label}</small>
            ${item.badge ? `<span class="nav-badge" style="position:absolute;top:-2px;right:0px;font-size:9px;padding:1px 5px">${item.badge}</span>` : ''}
          </a>
        `).join('')}
      </nav>
    </div>
  `;
}

window.toggleSidebar = () => {
  const collapsed = !store.get('sidebarCollapsed');
  store.set({ sidebarCollapsed: collapsed });
  localStorage.setItem('sb_sidebar', collapsed ? '1' : '0');
  const sidebar = $('.sidebar');
  if (sidebar) sidebar.classList.toggle('collapsed', collapsed);
};

window.navigate = navigate;

window.cycleTheme = () => {
  const cur = THEMES.indexOf(store.get('theme'));
  setTheme(THEMES[(cur + 1) % THEMES.length]);
};

window.toggleNotifDropdown = () => {
  const open = store.get('notifDropdownOpen');
  store.set({ notifDropdownOpen: !open });
  if (!open) {
    loadNotifications();
    const anchor = $('#notif-dropdown-anchor');
    if (anchor) {
      const notifs = store.get('notifications') || [];
      anchor.innerHTML = `<div class="notif-dropdown">
        <div class="notif-header"><strong>Notifications</strong><button class="btn-sm btn-ghost" onclick="markNotifsRead()">Mark all read</button></div>
        ${notifs.length === 0 ? '<div class="empty-sm" style="padding:24px">No notifications yet</div>' : notifs.slice(0,10).map(n => `
          <div class="notif-mini" style="${n.read ? '' : 'background:var(--primary-light)'}">
            <span>${n.type === 'exchange_request' ? '🔄' : n.type === 'exchange_accepted' ? '✅' : '🔔'}</span>
            <div><div class="text-sm">${n.message}</div><small class="text-xs text-dim">${timeAgo(n.created_at)}</small></div>
          </div>
        `).join('')}
      </div>`;
    }
  } else {
    const anchor = $('#notif-dropdown-anchor');
    if (anchor) anchor.innerHTML = '';
  }
};
window.markNotifsRead = async () => {
  try { await PATCH('/notifications/read'); store.set({ notifDropdownOpen: false }); loadNotifications(); } catch {}
};

// ===================== PAGE: DASHBOARD =====================
function renderDashboard() {
  const d = store.get('dashboard') || {};
  const u = d.user || store.get('user') || {};
  const stats = d.stats || {};
  const quote = QUOTES[dayOfYear() % QUOTES.length];
  const streakDays = store.get('streakDays');
  const dayNames = ['M','T','W','T','F','S','S'];

  // Build real weekly activity sparkline from recent exchanges
  const recentAll = d.recent_exchanges || [];
  const weekActivity = Array(12).fill(0);
  const now = Date.now();
  recentAll.forEach(e => {
    const daysAgo = Math.floor((now - new Date(e.created_at).getTime()) / 86400000);
    if (daysAgo < 12) weekActivity[11 - daysAgo]++;
  });

  const xp = u.xp || 0;
  const level = u.level || 1;
  const xpForNext = level * 100;
  const xpPct = Math.min((xp % 100) / 100 * 100, 100);

  return `
    <!-- Hero greeting banner -->
    <div class="page-header" style="margin-bottom:20px;position:relative;overflow:hidden;background:linear-gradient(135deg,rgba(124,77,255,0.1),rgba(224,64,251,0.05));border:1px solid rgba(124,77,255,0.15);border-radius:var(--r-xl);padding:28px 32px">
      <div style="position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:radial-gradient(circle,rgba(124,77,255,0.15),transparent 70%);pointer-events:none"></div>
      <div style="position:absolute;bottom:-60px;right:20%;width:150px;height:150px;background:radial-gradient(circle,rgba(224,64,251,0.1),transparent 70%);pointer-events:none"></div>
      <div class="flex items-center justify-between flex-wrap" style="gap:16px">
        <div>
          <h1 style="margin-bottom:6px;font-size:clamp(1.5rem,3vw,2.2rem)">Welcome back, <span style="background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${u.name?.split(' ')[0] || 'there'}</span>! 👋</h1>
          <p class="page-sub" style="font-style:italic;opacity:0.8">"${quote}"</p>
        </div>
        <div class="flex items-center gap-16">
          <div style="text-align:center">
            <div style="font-size:2rem;font-weight:900;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${streakDays}</div>
            <div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Day Streak 🔥</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:2rem;font-weight:900;background:var(--gradient-secondary);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${xp}</div>
            <div style="font-size:11px;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">Total XP ⭐</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-grid stagger-children" style="margin-bottom:20px">
      <div class="stat-card gradient-1 glass" style="padding:20px;border-radius:var(--r-lg)">
        <div class="stat-icon">🎯</div>
        <div class="stat-number">${stats.skills || 0}</div>
        <div class="stat-label">Skills</div>
        <div class="stat-change up">+${stats.new_this_week || 0} this week</div>
      </div>
      <div class="stat-card gradient-2 glass" style="padding:20px;border-radius:var(--r-lg)">
        <div class="stat-icon">🔄</div>
        <div class="stat-number">${stats.exchanges_completed || 0}</div>
        <div class="stat-label">Exchanges Done</div>
        <div class="stat-change up">🏆 ${stats.active_exchanges || 0} active</div>
      </div>
      <div class="stat-card gradient-3 glass" style="padding:20px;border-radius:var(--r-lg)">
        <div class="stat-icon">⏱️</div>
        <div class="stat-number">${stats.teaching_hours || 0}</div>
        <div class="stat-label">Teaching Hours</div>
        <div class="stat-change up">🎓 ${stats.learning_hours || 0}h learning</div>
      </div>
      <div class="stat-card gradient-4 glass" style="padding:20px;border-radius:var(--r-lg)">
        <div class="stat-icon">⭐</div>
        <div class="stat-number">${u.reputation || 0}</div>
        <div class="stat-label">Reputation</div>
        <div class="stat-change up">📊 ${u.rating_avg ? `${u.rating_avg}/5 avg rating` : 'No ratings yet'}</div>
      </div>
    </div>

    <!-- Level Progress -->
    <div class="glass level-card anim-fadeInUp" style="padding:20px;border-radius:var(--r-lg);margin-bottom:20px">
      <div class="level-bar-header" style="margin-bottom:10px">
        <div class="level-info" style="gap:12px">
          <span class="level-badge" style="font-size:0.85rem">⚡ Level ${level}</span>
          <span class="level-title" style="color:var(--text-muted)">${getLevelTitle(level)}</span>
        </div>
        <div class="flex items-center gap-12">
          <span style="font-size:0.8rem;color:var(--text-dim)">${xp % 100} / ${xpForNext % 100 || xpForNext} XP</span>
          <span class="xp-text" style="font-size:1rem">${xp} XP total</span>
        </div>
      </div>
      <div class="progress-bar xl" style="height:12px;border-radius:var(--r-full);box-shadow:inset 0 1px 3px rgba(0,0,0,0.3)">
        <div class="progress-fill" style="width:${xpPct}%;position:relative;overflow:hidden">
          <div style="position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent);animation:shimmerFast 2s infinite"></div>
        </div>
      </div>
      <div class="flex justify-between mt-4">
        <span style="font-size:11px;color:var(--text-dim)">${xpPct.toFixed(0)}% to Level ${level + 1}</span>
        <span style="font-size:11px;color:var(--text-dim)">${xpForNext - (xp % xpForNext || xpForNext)} XP needed</span>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions stagger-children" style="margin-bottom:20px">
      <div class="quick-action" onclick="showAddSkillModal()" style="border-radius:var(--r-md)">
        <div class="quick-action-icon">➕</div>
        <div class="quick-action-text" style="font-weight:600">Add Skill</div>
      </div>
      <div class="quick-action" onclick="navigate('browse')" style="border-radius:var(--r-md)">
        <div class="quick-action-icon">🔍</div>
        <div class="quick-action-text" style="font-weight:600">Browse</div>
      </div>
      <div class="quick-action" onclick="navigate('matching')" style="border-radius:var(--r-md)">
        <div class="quick-action-icon">🤖</div>
        <div class="quick-action-text" style="font-weight:600">AI Match</div>
      </div>
      <div class="quick-action" onclick="navigate('events')" style="border-radius:var(--r-md)">
        <div class="quick-action-icon">📅</div>
        <div class="quick-action-text" style="font-weight:600">Events</div>
      </div>
      <div class="quick-action" onclick="navigate('leaderboard')" style="border-radius:var(--r-md)">
        <div class="quick-action-icon">🏆</div>
        <div class="quick-action-text" style="font-weight:600">Leaderboard</div>
      </div>
      <div class="quick-action" onclick="navigate('pomodoro')" style="border-radius:var(--r-md)">
        <div class="quick-action-icon">⏱️</div>
        <div class="quick-action-text" style="font-weight:600">Pomodoro</div>
      </div>
    </div>

    <!-- Streak visualization -->
    <div class="streak-card anim-fadeInUp" style="border-radius:var(--r-lg);margin-bottom:20px">
      <div class="streak-flame" style="font-size:2.5rem">🔥</div>
      <div style="flex:1">
        <div class="flex items-center gap-16 justify-between flex-wrap">
          <div>
            <div class="streak-count">${streakDays} Day Streak</div>
            <div style="font-size:12px;color:var(--warning);opacity:0.8;margin-top:2px">Keep it up! Next milestone: ${Math.ceil(streakDays / 7) * 7} days</div>
          </div>
          <div class="streak-days">${dayNames.map((n, i) => `
            <div class="streak-dot ${i < (streakDays % 7 || (streakDays > 0 ? 7 : 0)) ? 'active' : ''}" title="${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}">${n}</div>
          `).join('')}</div>
        </div>
      </div>
    </div>

    <!-- Bento Grid Layout -->
    <div class="dash-grid">

      <!-- Pending Exchanges Card -->
      <div class="glass dash-card anim-fadeInUp" style="border-radius:var(--r-lg)">
        <div class="dch">
          <h3 style="display:flex;align-items:center;gap:8px">
            <span style="width:8px;height:8px;background:var(--warning);border-radius:50%;animation:pulseScale 1.5s infinite;display:inline-block"></span>
            Pending Exchanges
          </h3>
          <a class="link-sm" onclick="navigate('exchanges')">View all →</a>
        </div>
        ${(d.pending_exchanges || []).length === 0 ?
          `<div class="empty-sm" style="padding:24px 0;display:flex;flex-direction:column;align-items:center;gap:8px">
            <span style="font-size:2rem;opacity:0.4">🔄</span>
            <span>No pending exchanges</span>
          </div>` :
          (d.pending_exchanges || []).slice(0, 3).map(e => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(124,77,255,0.06);border:1px solid rgba(124,77,255,0.1);border-radius:var(--r-sm);margin-bottom:8px;transition:all var(--tr-fast)" onmouseover="this.style.borderColor='rgba(124,77,255,0.25)'" onmouseout="this.style.borderColor='rgba(124,77,255,0.1)'">
              <div>
                <div style="font-weight:600;font-size:0.9rem">${e.skill_name}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">👤 ${e.learner_name} wants to learn</div>
              </div>
              <div class="flex" style="gap:6px">
                <button class="btn-sm btn-success" style="padding:4px 10px;font-size:0.75rem" onclick="acceptExchange(${e.id}).then(()=>loadUserData().then(render))">✓ Accept</button>
                <button class="btn-sm btn-outline" style="padding:4px 10px;font-size:0.75rem" onclick="declineExchange(${e.id}).then(()=>loadUserData().then(render))">✗</button>
              </div>
            </div>
          `).join('')}
      </div>

      <!-- Upcoming Events Card -->
      <div class="glass dash-card anim-fadeInUp anim-delay-2" style="border-radius:var(--r-lg)">
        <div class="dch">
          <h3 style="display:flex;align-items:center;gap:8px">
            <span style="width:8px;height:8px;background:var(--success);border-radius:50%;display:inline-block"></span>
            Upcoming Events
          </h3>
          <a class="link-sm" onclick="navigate('events')">View all →</a>
        </div>
        ${(d.upcoming_events || []).length === 0 ?
          `<div class="empty-sm" style="padding:24px 0;display:flex;flex-direction:column;align-items:center;gap:8px">
            <span style="font-size:2rem;opacity:0.4">📅</span>
            <a onclick="navigate('events')" style="color:var(--primary);cursor:pointer;font-size:0.85rem">Browse community events</a>
          </div>` :
          (d.upcoming_events || []).map(e => `
            <div class="event-mini" style="border-radius:var(--r-sm);padding:8px;margin-bottom:4px;transition:all var(--tr-fast)" onmouseover="this.style.background='rgba(124,77,255,0.06)'" onmouseout="this.style.background='transparent'">
              <div style="min-width:48px;padding:4px 8px;background:var(--gradient-primary);border-radius:var(--r-xs);text-align:center;box-shadow:var(--shadow-glow)">
                <div style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.8);text-transform:uppercase">${new Date(e.date).toLocaleString('en',{month:'short'})}</div>
                <div style="font-size:1.1rem;font-weight:900;color:white;line-height:1">${new Date(e.date).getDate()}</div>
              </div>
              <div style="flex:1">
                <strong style="font-size:0.875rem">${e.title}</strong>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">🎤 ${e.host_name} · 👥 ${(e.participants||[]).length} joined</div>
              </div>
            </div>
          `).join('')}
      </div>

      <!-- My Skills Card -->
      <div class="glass dash-card anim-fadeInUp anim-delay-4" style="border-radius:var(--r-lg)">
        <div class="dch">
          <h3>🎯 My Skills</h3>
          <div class="flex" style="gap:8px">
            <button class="btn-sm btn-outline" style="padding:4px 10px;font-size:0.75rem" onclick="showAddSkillModal()">+ Add</button>
            <a class="link-sm" onclick="navigate('skills')">Manage →</a>
          </div>
        </div>
        ${(d.skills || []).length === 0 ?
          `<div class="empty-sm" style="padding:24px 0;text-align:center">
            <span style="font-size:2rem;opacity:0.4;display:block;margin-bottom:8px">🎯</span>
            <a onclick="showAddSkillModal()" style="color:var(--primary);cursor:pointer">Add your first skill!</a>
          </div>` :
          `<div class="skill-chips">${(d.skills || []).map(s => `
            <span class="skill-chip" style="gap:8px;padding:6px 12px;cursor:pointer;transition:all var(--tr-fast)" onclick="navigate('skills')" title="${s.description || s.name}">
              <span class="chip-level chip-${s.level?.[0]?.toUpperCase()}" style="font-size:10px">${s.level?.[0]?.toUpperCase()}</span>
              <span style="font-size:0.8rem">${s.name}</span>
            </span>
          `).join('')}</div>`}
      </div>

      <!-- Activity Chart Card -->
      <div class="glass dash-card anim-fadeInUp anim-delay-6" style="border-radius:var(--r-lg)">
        <div class="dch"><h3>📊 Activity (12 days)</h3></div>
        <div style="display:flex;align-items:flex-end;gap:3px;height:60px;margin:8px 0">
          ${weekActivity.map((v, i) => {
            const maxV = Math.max(...weekActivity, 1);
            const h = Math.max((v / maxV) * 100, 4);
            const isToday = i === 11;
            return `<div style="flex:1;height:${h}%;background:${isToday ? 'var(--gradient-primary)' : 'rgba(124,77,255,0.3)'};border-radius:3px 3px 0 0;transition:height 0.5s;min-height:3px;cursor:default" title="Day ${i+1}: ${v} exchanges" onmouseover="this.style.background='var(--gradient-primary)'" onmouseout="this.style.background='${isToday ? 'var(--gradient-primary)' : 'rgba(124,77,255,0.3)'}'"></div>`;
          }).join('')}
        </div>
        <div class="flex justify-between mt-4">
          <span class="text-xs text-muted">12 days ago</span>
          <span class="text-xs text-primary">Today</span>
        </div>
        <div style="display:flex;gap:16px;margin-top:12px;padding-top:10px;border-top:1px solid rgba(124,77,255,0.1)">
          <div style="text-align:center;flex:1">
            <div style="font-weight:700;font-size:1.1rem">${recentAll.length}</div>
            <div style="font-size:11px;color:var(--text-dim)">Total Exchanges</div>
          </div>
          <div style="width:1px;background:rgba(124,77,255,0.1)"></div>
          <div style="text-align:center;flex:1">
            <div style="font-weight:700;font-size:1.1rem">${weekActivity.reduce((a,b)=>a+b,0)}</div>
            <div style="font-size:11px;color:var(--text-dim)">Last 12 Days</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getLevelTitle(level) {
  const titles = ['Newcomer','Beginner','Learner','Explorer','Adept','Skilled','Proficient','Expert','Master','Grand Master','Legend'];
  return titles[Math.min(level - 1, titles.length - 1)] || 'Legend';
}

// ===================== PAGE: MY SKILLS =====================
function renderSkills() {
  const skills = store.get('skills') || [];
  const loading = store.isLoading('skills');
  const totalEndorsements = skills.reduce((a, s) => a + (s.endorsements || 0), 0);
  const totalExchanges = skills.reduce((a, s) => a + (s.exchange_count || 0), 0);

  return `
    <div class="page-header">
      <div class="flex justify-between items-center flex-wrap" style="gap:12px">
        <div>
          <h1>My Skills</h1>
          <p class="page-sub">${skills.length} skills · ${totalEndorsements} endorsements · ${totalExchanges} exchanges</p>
        </div>
        <button class="btn-primary btn-glow" onclick="showAddSkillModal()" style="display:flex;align-items:center;gap:8px">
          <span style="font-size:1.1rem">✨</span> Add New Skill
        </button>
      </div>
    </div>
    ${loading ? `<div class="skills-grid">${renderSkeleton('card', 4)}</div>` :
      skills.length === 0 ? renderEmpty('🎯', 'No skills yet. Add your first skill!', '<button class="btn-primary btn-glow mt-16" onclick="showAddSkillModal()">✨ Add Your First Skill</button>') :
      `<div class="skills-grid stagger-children">${skills.map(s => renderSkillCard(s, true)).join('')}</div>`
    }
  `;
}

function renderSkillCard(s, editable = false) {
  const levelColors = { beginner:'var(--success)', intermediate:'var(--primary)', advanced:'var(--accent)', expert:'var(--warning)' };
  const levelColor = levelColors[s.level] || 'var(--primary)';
  const ratingPct = s.rating_count > 0 ? (s.rating_avg / 5 * 100).toFixed(0) : 0;
  return `
    <div class="glass skill-card" style="padding:24px;border-radius:var(--r-lg)">
      <!-- Top accent line -->
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,${levelColor},transparent);border-radius:var(--r-lg) var(--r-lg) 0 0;opacity:0.7"></div>

      <div class="skill-card-header" style="margin-bottom:12px">
        <div style="flex:1">
          <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:6px">${s.name}</h3>
          <div class="skill-meta" style="gap:6px;flex-wrap:wrap">
            <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:${levelColor}22;border:1px solid ${levelColor}44;border-radius:var(--r-full);font-size:11px;font-weight:700;color:${levelColor}">${capitalize(s.level || 'Intermediate')}</span>
            <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;background:rgba(124,77,255,0.1);border:1px solid rgba(124,77,255,0.2);border-radius:var(--r-full);font-size:11px;color:var(--primary)">${s.category}</span>
            ${s.verified ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(0,230,118,0.1);border:1px solid rgba(0,230,118,0.2);border-radius:var(--r-full);font-size:11px;color:var(--success)">✓ Verified</span>` : ''}
          </div>
        </div>
        ${editable ? `<div class="skill-actions" style="display:flex;gap:4px">
          <button class="btn-icon" data-tooltip="Edit" onclick="showEditSkillModal(${s.id})" style="font-size:14px;width:34px;height:34px;border-radius:var(--r-sm);background:rgba(124,77,255,0.1);border:1px solid rgba(124,77,255,0.2);transition:all var(--tr-fast)" onmouseover="this.style.background='rgba(124,77,255,0.2)'" onmouseout="this.style.background='rgba(124,77,255,0.1)'">✏️</button>
          <button class="btn-icon" data-tooltip="Delete" onclick="if(confirm('Delete \'${s.name}\'?'))deleteSkill(${s.id})" style="font-size:14px;width:34px;height:34px;border-radius:var(--r-sm);background:rgba(255,23,68,0.08);border:1px solid rgba(255,23,68,0.15);transition:all var(--tr-fast)" onmouseover="this.style.background='rgba(255,23,68,0.18)'" onmouseout="this.style.background='rgba(255,23,68,0.08)'">🗑️</button>
        </div>` : ''}
      </div>

      ${s.description ? `<p class="desc" style="margin-bottom:12px;line-height:1.6;font-size:0.85rem">${truncate(s.description, 140)}</p>` : ''}

      <!-- Stats row -->
      <div style="display:flex;gap:12px;margin-bottom:12px;padding:10px 12px;background:rgba(124,77,255,0.05);border-radius:var(--r-sm);border:1px solid rgba(124,77,255,0.08)">
        <div style="text-align:center;flex:1">
          <div style="font-weight:800;font-size:1.1rem;color:var(--success)">${s.endorsements || 0}</div>
          <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px">Endorse</div>
        </div>
        <div style="width:1px;background:rgba(124,77,255,0.15)"></div>
        <div style="text-align:center;flex:1">
          <div style="font-weight:800;font-size:1.1rem;color:var(--primary)">${s.exchange_count || 0}</div>
          <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px">Exchanges</div>
        </div>
        ${s.rating_count > 0 ? `
        <div style="width:1px;background:rgba(124,77,255,0.15)"></div>
        <div style="text-align:center;flex:1">
          <div style="font-weight:800;font-size:1.1rem;color:var(--warning)">${s.rating_avg}</div>
          <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px">Rating</div>
        </div>` : ''}
      </div>

      ${s.rating_count > 0 ? `
        <div style="margin-bottom:10px">
          <div class="progress-bar" style="height:4px"><div class="progress-fill" style="width:${ratingPct}%"></div></div>
        </div>` : ''}

      ${(s.tags || []).length > 0 ? `<div class="tag-chips" style="margin-bottom:12px">${s.tags.slice(0,5).map(t => `<span class="tag-chip">${t}</span>`).join('')}</div>` : ''}

      ${s.portfolio_items?.length > 0 ? `
        <div class="portfolio-mini" style="padding-top:10px;border-top:1px solid rgba(124,77,255,0.08)">
          <div style="font-size:11px;font-weight:600;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">📁 Portfolio</div>
          ${s.portfolio_items.slice(0,2).map(p => `<a class="portfolio-link" href="${p.url || '#'}" target="_blank" style="font-size:0.8rem">${p.title}</a>`).join('')}
        </div>
      ` : ''}

      <div class="skill-card-actions" style="padding-top:12px;border-top:1px solid rgba(124,77,255,0.08);margin-top:4px">
        <button class="btn-sm btn-outline" onclick="showLearningPathModal('${s.name}')" style="font-size:0.8rem;padding:6px 14px;flex:1">📚 Learning Path</button>
      </div>
    </div>
  `;
}

window.showEditSkillModal = (id) => {
  const skill = store.get('skills').find(s => s.id === id);
  if (!skill) return;
  const body = `
    <div class="fg"><label>Name</label><input id="m-ename" value="${skill.name}" /></div>
    <div class="fg"><label>Description</label><textarea id="m-edesc" rows="3">${skill.description || ''}</textarea></div>
    <div class="row2">
      <div class="fg"><label>Category</label><select id="m-ecat">${SKILL_CATEGORIES.map(c => `<option value="${c}" ${c === skill.category ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="fg"><label>Level</label><select id="m-elvl">${SKILL_LEVELS.map(l => `<option value="${l}" ${l === skill.level ? 'selected' : ''}>${capitalize(l)}</option>`).join('')}</select></div>
    </div>
    <div class="fg"><label>Tags</label><input id="m-etags" value="${(skill.tags||[]).join(', ')}" /></div>
  `;
  const footer = `<button class="btn-outline" onclick="closeModal(window._editModal)">Cancel</button><button class="btn-primary" onclick="submitEditSkill(${id})">💾 Save</button>`;
  window._editModal = showModal('Edit Skill', body, footer);
};
window.submitEditSkill = async (id) => {
  await updateSkill(id, {
    name: $('#m-ename')?.value, description: $('#m-edesc')?.value,
    category: $('#m-ecat')?.value, level: $('#m-elvl')?.value,
    tags: $('#m-etags')?.value?.split(',').map(t=>t.trim()).filter(Boolean)
  });
  closeModal(window._editModal);
  if (store.get('page') === 'skills') render();
};

// ===================== PAGE: BROWSE SKILLS =====================
function renderBrowse() {
  const skills = store.get('browseSkills') || [];
  const loading = store.isLoading('browse');

  return `
    <div class="page-header">
      <h1>Browse Skills</h1>
      <p class="page-sub">Discover and connect with talented people in the community</p>
    </div>

    <!-- Hero search bar -->
    <div class="glass search-panel" style="padding:24px;border-radius:var(--r-lg);margin-bottom:24px">
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <div style="flex:1;position:relative">
          <span style="position:absolute;left:16px;top:50%;transform:translateY(-50%);font-size:1.1rem;pointer-events:none">🔍</span>
          <input class="search-input-lg" placeholder="Search skills, people, categories..." id="browse-search"
            value="${store.get('searchQuery')}" oninput="debouncedBrowse()"
            style="padding-left:48px;width:100%;height:48px;border-radius:var(--r-md);background:rgba(124,77,255,0.07);border:1px solid rgba(124,77,255,0.2);font-size:1rem;transition:all var(--tr-med)"
            onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px rgba(124,77,255,0.15)'"
            onblur="this.style.borderColor='rgba(124,77,255,0.2)';this.style.boxShadow='none'" />
        </div>
        <button class="btn-primary btn-glow" onclick="triggerBrowse()" style="padding:0 24px;height:48px;white-space:nowrap">Search</button>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <select id="browse-cat" onchange="triggerBrowse()"
          style="padding:8px 16px;border-radius:var(--r-full);background:rgba(124,77,255,0.08);border:1px solid rgba(124,77,255,0.2);color:var(--text);font-size:0.85rem;cursor:pointer">
          <option value="">🏷️ All Categories</option>
          ${SKILL_CATEGORIES.map(c => `<option value="${c}" ${c === store.get('browseCategory') ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <select id="browse-lvl" onchange="triggerBrowse()"
          style="padding:8px 16px;border-radius:var(--r-full);background:rgba(124,77,255,0.08);border:1px solid rgba(124,77,255,0.2);color:var(--text);font-size:0.85rem;cursor:pointer">
          <option value="">📊 All Levels</option>
          ${SKILL_LEVELS.map(l => `<option value="${l}" ${l === store.get('browseLevel') ? 'selected' : ''}>${capitalize(l)}</option>`).join('')}
        </select>
      </div>
    </div>

    ${loading ? `<div class="results-grid">${renderSkeleton('card', 6)}</div>` :
      skills.length === 0 ? renderEmpty('🔍', 'No skills found. Try a different search!') :
      `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <p class="text-sm" style="color:var(--text-dim)"><span style="font-weight:700;color:var(--primary)">${skills.length}</span> skills found</p>
      </div>
      <div class="results-grid stagger-children">${skills.map(s => `
        <div class="glass browse-card" style="padding:20px;border-radius:var(--r-lg);transition:all var(--tr-med);position:relative;overflow:hidden"
          onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 16px 40px rgba(124,77,255,0.2)'"
          onmouseout="this.style.transform='';this.style.boxShadow=''">
          <!-- Top gradient line -->
          <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--primary),var(--accent))"></div>

          <div class="browse-top" style="margin-bottom:12px;gap:12px">
            <div style="flex-shrink:0">${renderAvatar(s.user_name, null, 'md')}</div>
            <div style="min-width:0">
              <div style="font-weight:700;font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.name}</div>
              <div style="font-size:0.8rem;color:var(--text-dim);margin-top:2px">by ${s.user_name}</div>
              <div class="browse-meta" style="margin-top:6px;gap:5px;flex-wrap:wrap">
                <span style="padding:2px 8px;background:rgba(124,77,255,0.12);border:1px solid rgba(124,77,255,0.2);border-radius:var(--r-full);font-size:10px;font-weight:600;color:var(--primary)">${capitalize(s.level || 'Intermediate')}</span>
                <span style="padding:2px 8px;background:rgba(0,229,255,0.08);border:1px solid rgba(0,229,255,0.15);border-radius:var(--r-full);font-size:10px;color:var(--secondary)">${s.category}</span>
                ${s.verified ? `<span style="padding:2px 8px;background:rgba(0,230,118,0.1);border:1px solid rgba(0,230,118,0.2);border-radius:var(--r-full);font-size:10px;color:var(--success)">✓ Verified</span>` : ''}
              </div>
            </div>
          </div>

          ${s.description ? `<p class="desc" style="margin-bottom:10px;font-size:0.82rem">${truncate(s.description, 100)}</p>` : ''}

          <div style="display:flex;gap:12px;margin-bottom:10px;font-size:0.8rem;color:var(--text-dim)">
            <span>👍 ${s.endorsements || 0}</span>
            <span>🔄 ${s.exchange_count || 0}</span>
            ${s.rating_count > 0 ? `<span>⭐ ${s.rating_avg}</span>` : ''}
          </div>

          ${(s.tags||[]).length > 0 ? `<div class="tag-chips" style="margin-bottom:12px">${s.tags.slice(0,3).map(t=>`<span class="tag-chip">${t}</span>`).join('')}</div>` : ''}

          <div class="browse-actions" style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn-sm btn-primary" onclick="showExchangeModal(${s.id})" style="flex:1;min-width:80px">🤝 Exchange</button>
            <button class="btn-sm btn-outline" onclick="endorseSkill(${s.id}).then(()=>triggerBrowse())" style="padding:6px 12px">👍</button>
            <button class="btn-sm btn-ghost" onclick="showMessageModal(${s.user_id}, '${escapeHtml(s.user_name || '')}')" style="padding:6px 12px">💬</button>
          </div>
        </div>
      `).join('')}</div>`
    }
  `;
}

const debouncedBrowseSearch = debounce(() => {
  const q = $('#browse-search')?.value || '';
  const cat = $('#browse-cat')?.value || '';
  const lvl = $('#browse-lvl')?.value || '';
  store.set({ searchQuery: q, browseCategory: cat, browseLevel: lvl });
  loadBrowseSkills(q, cat, lvl);
}, 400);
window.debouncedBrowse = debouncedBrowseSearch;
window.triggerBrowse = () => {
  const q = $('#browse-search')?.value || '';
  const cat = $('#browse-cat')?.value || '';
  const lvl = $('#browse-lvl')?.value || '';
  store.set({ searchQuery: q, browseCategory: cat, browseLevel: lvl });
  loadBrowseSkills(q, cat, lvl);
};

// ===================== PAGE: AI MATCHING =====================
function renderMatching() {
  const matches = store.get('matches') || [];
  const loading = store.isLoading('matches');

  return `
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <h1>AI Matching</h1>
          <p class="page-sub">Smart skill matching powered by AI — ${matches.length} matches found</p>
        </div>
        <button class="btn-primary btn-glow" onclick="loadMatches().then(render)" style="display:flex;align-items:center;gap:8px">
          <span style="font-size:1.1rem">✨</span> Find Matches
        </button>
      </div>
    </div>

    ${loading ? `
      <div class="match-animation" style="text-align:center;padding:80px 24px">
        <div class="match-orb" style="font-size:4rem;animation:float 2s ease-in-out infinite">🤖</div>
        <p style="margin-top:24px;color:var(--text-dim);font-size:1rem;animation:pulse 1.5s infinite">AI is analyzing your skills and finding perfect matches...</p>
        <div style="display:flex;justify-content:center;gap:8px;margin-top:16px">
          ${[0,1,2].map(i => `<div style="width:8px;height:8px;border-radius:50%;background:var(--primary);animation:bounce 1.4s ${i*0.15}s infinite"></div>`).join('')}
        </div>
      </div>
    ` : matches.length === 0 ? `
      <div style="text-align:center;padding:80px 24px">
        <div style="font-size:4rem;margin-bottom:16px">🤖</div>
        <h3 style="margin-bottom:8px">No Matches Yet</h3>
        <p style="color:var(--text-dim);margin-bottom:24px">Add skills to your profile, then let AI find your perfect exchange partners!</p>
        <button class="btn-primary btn-glow" onclick="loadMatches().then(render)">✨ Find My Matches</button>
      </div>
    ` : `
      <div class="matches-grid stagger-children">${matches.map((m, i) => `
        <div class="glass match-card" style="padding:20px;border-radius:var(--r-lg);transition:all var(--tr-med);position:relative;overflow:hidden"
          onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 50px rgba(124,77,255,0.2)'"
          onmouseout="this.style.transform='';this.style.boxShadow=''">

          <!-- Match score badge -->
          <div style="position:absolute;top:12px;right:12px;width:48px;height:48px;border-radius:50%;background:conic-gradient(var(--primary) ${(m.match_score||0)*3.6}deg, rgba(124,77,255,0.15) 0deg);display:flex;align-items:center;justify-content:center">
            <div style="width:40px;height:40px;border-radius:50%;background:var(--card);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.75rem;color:var(--primary)">${m.match_score || 0}%</div>
          </div>

          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;padding-right:60px">
            <div style="flex-shrink:0">${renderAvatar(m.user_name, null, 'md')}</div>
            <div>
              <div style="font-weight:700;font-size:1rem">${m.user_name || 'User'}</div>
              <div style="font-size:0.8rem;color:var(--text-dim)">${m.city || 'Skill Exchanger'}</div>
            </div>
          </div>

          <div style="padding:10px 12px;background:rgba(124,77,255,0.05);border-radius:var(--r-sm);border-left:3px solid var(--primary);margin-bottom:12px;font-size:0.82rem;line-height:1.5;color:var(--text-secondary)">
            ${m.reason || `Expertise in ${m.their_skill || m.category}`}
          </div>

          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
            ${m.their_skill ? `<span style="padding:3px 10px;background:rgba(0,229,255,0.1);border:1px solid rgba(0,229,255,0.2);border-radius:var(--r-full);font-size:11px;color:var(--secondary)">🎯 ${m.their_skill}</span>` : ''}
            ${m.category ? `<span style="padding:3px 10px;background:rgba(124,77,255,0.1);border:1px solid rgba(124,77,255,0.2);border-radius:var(--r-full);font-size:11px;color:var(--primary)">${m.category}</span>` : ''}
          </div>

          <div style="display:flex;gap:8px">
            <button class="btn-sm btn-primary" onclick="showMessageModal(${m.user_id}, '${escapeHtml(m.user_name || '')}')" style="flex:1">💬 Message</button>
            <button class="btn-sm btn-outline" onclick="showLearningPathModal('${escapeHtml(m.their_skill || '')}')">📚 Path</button>
          </div>
        </div>
      `).join('')}</div>
    `}
  `;
}

// ===================== PAGE: EXCHANGES =====================
function renderExchanges() {
  const exchanges = store.get('exchanges') || [];
  const tab = store.get('exchangeTab');
  const loading = store.isLoading('exchanges');
  const userId = store.get('user')?.id;

  const filtered = tab === 'all' ? exchanges :
    tab === 'pending' ? exchanges.filter(e => e.status === 'pending') :
    tab === 'active' ? exchanges.filter(e => e.status === 'accepted') :
    exchanges.filter(e => e.status === 'completed');

  return `
    <div class="page-header"><h1>Exchanges 🔄</h1><p class="page-sub">Manage your skill exchanges</p></div>
    <div class="exchange-tabs">
      ${['all','pending','active','completed'].map(t => `<button class="etab ${tab === t ? 'active' : ''}" onclick="store.set({exchangeTab:'${t}'});render()">${capitalize(t)} ${t !== 'all' ? `(${exchanges.filter(e => t === 'pending' ? e.status === 'pending' : t === 'active' ? e.status === 'accepted' : e.status === 'completed').length})` : `(${exchanges.length})`}</button>`).join('')}
    </div>
    ${loading ? renderSkeleton('card', 3) :
      filtered.length === 0 ? renderEmpty('🔄', `No ${tab} exchanges yet.`) :
      `<div class="exchange-list stagger-children">${filtered.map(e => `
        <div class="glass exchange-card">
          <div class="exchange-header">
            <div class="exchange-skill">
              <strong>${e.skill_name}</strong>
              ${renderBadge(e.status, capitalize(e.status))}
            </div>
            <small class="text-muted">${timeAgo(e.created_at)}</small>
          </div>
          <div class="exchange-people">
            <div class="exchange-person">
              ${renderAvatar(e.teacher_name, null, 'sm')}
              <div><strong>${e.teacher_name}</strong><small>Teacher</small></div>
            </div>
            <div class="exchange-arrow">⇄</div>
            <div class="exchange-person">
              ${renderAvatar(e.learner_name, null, 'sm')}
              <div><strong>${e.learner_name}</strong><small>Learner</small></div>
            </div>
          </div>
          ${e.skill_offered ? `<p class="desc">Offering: ${e.skill_offered}</p>` : ''}
          ${e.notes ? `<p class="desc">Notes: ${e.notes}</p>` : ''}
          ${e.scheduled_date ? `<p class="text-sm text-muted">📅 ${formatDate(e.scheduled_date)}</p>` : ''}
          ${e.status === 'completed' && e.rating ? `<div class="rating-display mt-8">Rating: ${renderStars(e.rating)} ${e.review ? `<p class="desc">"${e.review}"</p>` : ''}</div>` : ''}
          <div class="exchange-actions">
            ${e.status === 'pending' && e.teacher_id === userId ? `
              <button class="btn-sm btn-success" onclick="acceptExchange(${e.id}).then(render)">✅ Accept</button>
              <button class="btn-sm btn-danger" onclick="declineExchange(${e.id}).then(render)">✗ Decline</button>
            ` : ''}
            ${e.status === 'accepted' ? `<button class="btn-sm btn-primary" onclick="openCompleteModal(${e.id})">✅ Complete</button>` : ''}
            <button class="btn-sm btn-ghost" onclick="showMessageModal(${e.teacher_id === userId ? e.learner_id : e.teacher_id}, '${escapeHtml(e.teacher_id === userId ? e.learner_name : e.teacher_name)}')">💬</button>
          </div>
        </div>
      `).join('')}</div>`
    }
  `;
}
window.showCompleteModal = (exchange) => {
  if (typeof exchange === 'string') exchange = JSON.parse(exchange);
  showCompleteModal(exchange);
};
window.openCompleteModal = (id) => {
  const exchange = (store.get('exchanges') || []).find(e => e.id === id);
  if (exchange) showCompleteModal(exchange);
  else toast('Exchange not found', 'error');
};

// ===================== PAGE: MESSAGES =====================
function renderMessages() {
  const convos = store.get('messages') || [];
  const selected = store.get('selectedConvo');
  const activeConvo = selected !== null ? convos.find(c => c.partner_id === selected) : null;
  const userId = store.get('user')?.id;

  return `
    <div class="page-header" style="margin-bottom:16px">
      <h1>Messages</h1>
      <p class="page-sub">${convos.length} conversation${convos.length !== 1 ? 's' : ''}</p>
    </div>
    <div class="messages-layout glass" style="border-radius:var(--r-xl);overflow:hidden;height:calc(100vh - 220px);min-height:400px">
      <!-- Conversation sidebar -->
      <div class="convo-list scroll-thin" style="border-right:1px solid rgba(124,77,255,0.12)">
        <div style="padding:14px;border-bottom:1px solid rgba(124,77,255,0.1);font-weight:700;font-size:0.85rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:1px">
          Conversations
        </div>
        ${convos.length === 0 ? '<div style="padding:24px;text-align:center;color:var(--text-dim);font-size:0.85rem">No conversations yet</div>' :
          convos.map(c => {
            const lastMsg = c.messages[c.messages.length-1];
            return `
              <div class="convo-item ${c.partner_id === selected ? 'selected' : ''} ${c.unread > 0 ? 'unread' : ''}" onclick="selectConvo(${c.partner_id})"
                style="display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;transition:all var(--tr-fast);background:${c.partner_id === selected ? 'rgba(124,77,255,0.15)' : 'transparent'};border-left:3px solid ${c.partner_id === selected ? 'var(--primary)' : 'transparent'}"
                onmouseover="if(${c.partner_id}!==${selected||0})this.style.background='rgba(124,77,255,0.08)'"
                onmouseout="if(${c.partner_id}!==${selected||0})this.style.background='transparent'">
                <div style="position:relative;flex-shrink:0">
                  ${renderAvatar(c.partner_name, null, 'md')}
                  <div style="position:absolute;bottom:1px;right:1px;width:8px;height:8px;border-radius:50%;background:var(--success);border:2px solid var(--card)"></div>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:0.88rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.partner_name}</div>
                  <div style="font-size:0.75rem;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px">${lastMsg?.content || 'Start a conversation'}</div>
                </div>
                ${c.unread > 0 ? `<span style="flex-shrink:0;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:var(--primary);color:white;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">${c.unread}</span>` : ''}
              </div>
            `;
          }).join('')
        }
      </div>

      <!-- Chat area -->
      <div class="chat-area" style="display:flex;flex-direction:column">
        ${!activeConvo ? `
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--text-dim)">
            <div style="font-size:3rem">💬</div>
            <p>Select a conversation to start messaging</p>
          </div>
        ` : `
          <!-- Chat header -->
          <div class="chat-header" style="padding:14px 20px;border-bottom:1px solid rgba(124,77,255,0.12);display:flex;align-items:center;gap:12px;background:rgba(124,77,255,0.04)">
            <div style="position:relative">
              ${renderAvatar(activeConvo.partner_name, null, 'sm')}
              <div style="position:absolute;bottom:0;right:0;width:8px;height:8px;border-radius:50%;background:var(--success);border:2px solid var(--card)"></div>
            </div>
            <div>
              <div style="font-weight:700">${activeConvo.partner_name}</div>
              <div style="font-size:11px;color:var(--success)">Online</div>
            </div>
          </div>

          <!-- Messages -->
          <div class="chat-messages scroll-thin" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px">
            ${activeConvo.messages.sort((a,b) => new Date(a.created_at) - new Date(b.created_at)).map(m => `
              <div class="chat-msg ${m.from_id === userId ? 'sent' : 'received'}" style="max-width:70%;align-self:${m.from_id === userId?'flex-end':'flex-start'};padding:10px 14px;border-radius:${m.from_id === userId?'16px 16px 4px 16px':'16px 16px 16px 4px'};background:${m.from_id === userId?'var(--gradient-primary)':'rgba(124,77,255,0.1);border:1px solid rgba(124,77,255,0.15)'}">
                <div style="font-size:0.88rem">${escapeHtml(m.content)}</div>
                <div style="font-size:10px;opacity:0.7;margin-top:4px;text-align:${m.from_id === userId?'right':'left'}">${timeAgo(m.created_at)}</div>
              </div>
            `).join('')}
          </div>

          <!-- Input -->
          <div class="chat-input" style="padding:14px 16px;border-top:1px solid rgba(124,77,255,0.12);display:flex;gap:8px">
            <input id="chat-msg-input" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendChatMessage(${activeConvo.partner_id})"
              style="flex:1;padding:10px 16px;border-radius:var(--r-full);background:rgba(124,77,255,0.07);border:1px solid rgba(124,77,255,0.2);color:var(--text);font-size:0.9rem"
              onfocus="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 2px rgba(124,77,255,0.15)'"
              onblur="this.style.borderColor='rgba(124,77,255,0.2)';this.style.boxShadow='none'" />
            <button class="btn-primary" onclick="sendChatMessage(${activeConvo.partner_id})" style="width:44px;height:44px;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;font-size:1.1rem">↑</button>
          </div>
        `}
      </div>
    </div>
  `;
}
window.selectConvo = async (partnerId) => {
  store.set({ selectedConvo: partnerId });
  try { await PATCH(`/messages/read/${partnerId}`); } catch {}
  render();
};
window.sendChatMessage = async (toId) => {
  const input = $('#chat-msg-input');
  const content = input?.value?.trim();
  if (!content) return;
  input.value = '';
  await sendMessage(toId, content);
  render();
};

// ===================== PAGE: REQUESTS =====================
function renderRequests() {
  const requests = store.get('requests') || [];
  const userId = store.get('user')?.id;
  const loading = store.isLoading('requests');

  return `
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <h1>Skill Requests</h1>
          <p class="page-sub">${requests.length} requests from the community</p>
        </div>
        <button class="btn-primary btn-glow" onclick="showCreateRequestModal()" style="display:flex;align-items:center;gap:8px">
          <span style="font-size:1rem">📢</span> Post Request
        </button>
      </div>
    </div>
    ${loading ? `<div class="requests-grid">${renderSkeleton('card', 4)}</div>` :
      requests.length === 0 ? renderEmpty('📋', 'No requests yet. Post one!', '<button class="btn-primary btn-glow mt-16" onclick="showCreateRequestModal()">📢 Post Request</button>') :
      `<div class="requests-grid stagger-children">${requests.map(r => {
        const urgColors = { high:'var(--danger)', medium:'var(--warning)', normal:'var(--primary)', low:'var(--text-dim)' };
        const urgColor = urgColors[r.urgency] || 'var(--primary)';
        return `
          <div class="glass request-card" style="padding:20px;border-radius:var(--r-lg);transition:all var(--tr-med);position:relative;overflow:hidden"
            onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 16px 40px rgba(0,0,0,0.25)'"
            onmouseout="this.style.transform='';this.style.boxShadow=''">

            <div style="position:absolute;top:0;left:0;right:0;height:2px;background:${urgColor}"></div>

            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
              <h3 style="font-size:1rem;font-weight:700;flex:1;margin-right:12px">${r.skill_name}</h3>
              <span style="padding:3px 10px;background:${urgColor}15;border:1px solid ${urgColor}30;border-radius:var(--r-full);font-size:10px;font-weight:700;color:${urgColor};white-space:nowrap;flex-shrink:0">${capitalize(r.urgency || 'normal')}</span>
            </div>

            ${r.description ? `<p class="desc" style="margin-bottom:10px;font-size:0.82rem">${truncate(r.description, 130)}</p>` : ''}

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;font-size:0.78rem;color:var(--text-dim)">
              <span style="padding:2px 8px;background:rgba(124,77,255,0.08);border-radius:var(--r-full);border:1px solid rgba(124,77,255,0.15);color:var(--primary)">${r.category || 'Other'}</span>
              <span>👤 ${r.user_name}</span>
              <span>💬 ${r.responses || 0} responses</span>
            </div>

            ${r.user_id !== userId ? `
              <button class="btn-sm btn-primary" onclick="respondToRequest(${r.id}, 'I can help!').then(()=>loadRequests().then(render))" style="width:100%;justify-content:center">🙋 I Can Help!</button>
            ` : `
              <button class="btn-sm" onclick="DEL('/requests/${r.id}').then(()=>{loadRequests();render()})" style="width:100%;justify-content:center;background:rgba(255,23,68,0.08);color:var(--danger);border:1px solid rgba(255,23,68,0.15);border-radius:var(--r-sm)">🗑️ Delete</button>
            `}
          </div>
        `;
      }).join('')}</div>`
    }
  `;
}

// ===================== PAGE: EVENTS =====================
function renderEvents() {
  const events = store.get('events') || [];
  const loading = store.isLoading('events');
  const userId = store.get('user')?.id;

  return `
    <div class="page-header">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <h1>Community Events</h1>
          <p class="page-sub">${events.length} upcoming events — join and learn together</p>
        </div>
        <button class="btn-primary btn-glow" onclick="showCreateEventModal()" style="display:flex;align-items:center;gap:8px">
          <span>+</span> Create Event
        </button>
      </div>
    </div>
    ${loading ? `<div class="events-grid">${renderSkeleton('card', 3)}</div>` :
      events.length === 0 ? renderEmpty('📅', 'No events yet. Create one!', '<button class="btn-primary btn-glow mt-16" onclick="showCreateEventModal()">📅 Create Event</button>') :
      `<div class="events-grid stagger-children">${events.map(e => {
        const d = new Date(e.date);
        const joined = (e.participants||[]).some(p => p.user_id === userId);
        const full = (e.participants||[]).length >= (e.max_participants||10);
        const typeColors = { workshop:'var(--primary)', webinar:'var(--secondary)', meetup:'var(--accent)', hackathon:'var(--warning)' };
        const typeColor = typeColors[e.event_type] || 'var(--primary)';
        return `
          <div class="glass event-card" style="padding:0;border-radius:var(--r-lg);overflow:hidden;transition:all var(--tr-med)"
            onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='0 20px 50px rgba(0,0,0,0.3)'"
            onmouseout="this.style.transform='';this.style.boxShadow=''">

            <!-- Header color bar -->
            <div style="height:4px;background:linear-gradient(90deg,${typeColor},${typeColor}44)"></div>

            <div style="padding:20px">
              <div class="event-top" style="gap:14px;margin-bottom:14px">
                <div style="flex-shrink:0;width:54px;height:60px;border-radius:var(--r-md);background:${typeColor}18;border:1px solid ${typeColor}33;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
                  <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${typeColor}">${d.toLocaleString('en',{month:'short'}).toUpperCase()}</span>
                  <span style="font-size:1.4rem;font-weight:800;line-height:1;color:var(--text)">${d.getDate()}</span>
                  <span style="font-size:9px;color:var(--text-dim)">${d.toLocaleString('en',{weekday:'short'})}</span>
                </div>
                <div style="flex:1;min-width:0">
                  <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${e.title}</h3>
                  <div style="display:flex;gap:5px;flex-wrap:wrap">
                    <span style="padding:2px 8px;background:${typeColor}15;border:1px solid ${typeColor}30;border-radius:var(--r-full);font-size:10px;font-weight:600;color:${typeColor}">${capitalize(e.event_type || 'workshop')}</span>
                    <span style="padding:2px 8px;background:rgba(124,77,255,0.08);border:1px solid rgba(124,77,255,0.15);border-radius:var(--r-full);font-size:10px;color:var(--primary)">${e.category || 'General'}</span>
                    <span style="padding:2px 8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:var(--r-full);font-size:10px;color:var(--text-dim)">${capitalize(e.skill_level || 'All Levels')}</span>
                  </div>
                </div>
              </div>

              ${e.description ? `<p class="desc" style="margin-bottom:12px;font-size:0.82rem">${truncate(e.description, 100)}</p>` : ''}

              <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;font-size:0.78rem;color:var(--text-dim)">
                <span title="Host">👤 ${e.host_name}</span>
                <span title="Participants">👥 ${(e.participants||[]).length}/${e.max_participants || 10}</span>
                <span title="Duration">⏱ ${e.duration || '1 hour'}</span>
              </div>

              <!-- Attendance progress -->
              <div style="height:3px;border-radius:var(--r-full);background:rgba(255,255,255,0.07);margin-bottom:14px;overflow:hidden">
                <div style="height:100%;width:${Math.min(100,((e.participants||[]).length/(e.max_participants||10))*100)}%;background:${typeColor};border-radius:var(--r-full)"></div>
              </div>

              <div style="display:flex;justify-content:flex-end">
                ${joined ? `<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:rgba(0,230,118,0.1);border:1px solid rgba(0,230,118,0.25);border-radius:var(--r-full);font-size:0.8rem;font-weight:600;color:var(--success)">✓ Joined!</span>` :
                  full ? `<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 16px;background:rgba(255,23,68,0.08);border:1px solid rgba(255,23,68,0.15);border-radius:var(--r-full);font-size:0.8rem;color:var(--danger)">Full</span>` :
                  `<button class="btn-sm btn-primary" onclick="joinEvent(${e.id}).then(()=>loadEvents().then(render))" style="padding:6px 20px;border-radius:var(--r-full)">Join Now</button>`
                }
              </div>
            </div>
          </div>
        `;
      }).join('')}</div>`
    }
  `;
}

// ===================== PAGE: LEADERBOARD =====================
function renderLeaderboard() {
  const leaders = store.get('leaderboard') || [];
  const loading = store.isLoading('leaderboard');
  const medals = ['🥇','🥈','🥉'];
  const topColors = ['linear-gradient(135deg,#FFD700,#FFA500)','linear-gradient(135deg,#C0C0C0,#a8a8a8)','linear-gradient(135deg,#CD7F32,#b87333)'];
  const me = store.get('user');

  return `
    <div class="page-header">
      <h1>Leaderboard</h1>
      <p class="page-sub">Top skill exchangers in the community — ${leaders.length} ranked</p>
    </div>

    ${loading ? renderSkeleton('card', 5) : `

    <!-- Podium top 3 -->
    ${leaders.length >= 3 ? `
      <div style="display:grid;grid-template-columns:1fr 1.2fr 1fr;gap:12px;margin-bottom:32px;align-items:flex-end">
        ${[1,0,2].map(idx => {
          const u = leaders[idx];
          if (!u) return '<div></div>';
          const heights = ['140px','180px','120px'];
          const podiumIdx = [1,0,2].indexOf(idx);
          return `
            <div style="text-align:center">
              <div class="glass" style="padding:20px 12px;border-radius:var(--r-lg);border-top:3px solid transparent;background:${topColors[idx]};background-clip:border-box;margin-bottom:0">
                <div style="font-size:1.6rem;margin-bottom:8px">${medals[idx]}</div>
                ${renderAvatar(u.name, u.avatar_color, idx === 0 ? 'lg' : 'md')}
                <div style="font-weight:700;margin-top:8px;font-size:0.9rem">${u.name}</div>
                <div style="font-size:0.75rem;color:rgba(255,255,255,0.7);margin-top:2px">Level ${u.level}</div>
                <div style="font-weight:800;font-size:1.1rem;margin-top:8px;color:white">${u.xp} XP</div>
              </div>
              <div style="height:${heights[podiumIdx]};background:${topColors[idx]};border-radius:0 0 var(--r-md) var(--r-md);margin-top:-2px;opacity:0.3"></div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    <!-- Full list -->
    <div class="leaderboard-list stagger-children">${leaders.map((u, i) => `
      <div class="glass leader-row ${i < 3 ? 'top-'+(i+1) : ''}" style="padding:14px 20px;border-radius:var(--r-md);display:flex;align-items:center;gap:14px;transition:all var(--tr-med);${u.id === me?.id ? 'border:1px solid rgba(124,77,255,0.4);background:rgba(124,77,255,0.08)!important' : ''}"
        onmouseover="this.style.transform='translateX(4px)'"
        onmouseout="this.style.transform=''">
        <div style="width:36px;text-align:center;font-size:${i < 3 ? '1.4' : '0.9'}rem;font-weight:700;color:${i < 3 ? 'auto' : 'var(--text-dim)'}">${i < 3 ? medals[i] : '#'+(i+1)}</div>
        ${renderAvatar(u.name, u.avatar_color, 'sm')}
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name}${u.id === me?.id ? ' <span style="font-size:10px;color:var(--primary);font-weight:600">(You)</span>' : ''}</div>
          <div style="font-size:0.75rem;color:var(--text-dim)">${u.city || 'Global'} · Level ${u.level}</div>
        </div>
        <div style="display:flex;gap:16px;font-size:0.8rem;color:var(--text-dim)">
          <span title="XP" style="display:flex;align-items:center;gap:4px"><span style="color:var(--warning)">⭐</span><span style="color:var(--text);font-weight:700">${u.xp}</span></span>
          <span title="Skills" style="display:flex;align-items:center;gap:4px"><span>🎯</span>${u.skill_count}</span>
          <span title="Exchanges" class="hide-sm" style="display:flex;align-items:center;gap:4px"><span>🔄</span>${u.total_exchanges}</span>
          <span title="Hours" class="hide-sm" style="display:flex;align-items:center;gap:4px"><span>⏱</span>${u.teaching_hours}h</span>
        </div>
      </div>
    `).join('')}</div>
    `}
  `;
}

// ===================== PAGE: ACHIEVEMENTS =====================
function renderAchievements() {
  const ach = store.get('achievements');
  const loading = store.isLoading('achievements');
  const earnedPct = ach ? Math.round(ach.total_earned / ach.total * 100) : 0;

  return `
    <div class="page-header">
      <h1>Achievements</h1>
      <p class="page-sub">${ach ? `${ach.total_earned} of ${ach.total} badges earned — ${earnedPct}% complete` : 'Loading...'}</p>
    </div>

    ${ach ? `
      <div class="glass" style="padding:24px;border-radius:var(--r-lg);margin-bottom:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div>
            <div style="font-weight:700;font-size:1.1rem;margin-bottom:4px">Badge Collection</div>
            <div style="font-size:0.85rem;color:var(--text-dim)">${ach.total_earned} earned · ${ach.total - ach.total_earned} remaining</div>
          </div>
          <div style="font-weight:800;font-size:2rem;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${earnedPct}%</div>
        </div>
        <div style="height:10px;border-radius:var(--r-full);background:rgba(124,77,255,0.15);overflow:hidden">
          <div style="height:100%;width:${earnedPct}%;background:var(--gradient-primary);border-radius:var(--r-full);transition:width 1s ease;box-shadow:0 0 10px rgba(124,77,255,0.5)"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--text-dim);margin-top:8px">
          <span>Beginner</span><span>Intermediate</span><span>Expert</span>
        </div>
      </div>
    ` : ''}

    ${loading ? `<div class="badges-grid">${renderSkeleton('card', 6)}</div>` :
      `<div class="badges-grid stagger-children">${(ach?.badges || []).map(b => `
        <div class="glass badge-card ${b.earned ? 'earned' : 'locked'}" style="padding:24px;border-radius:var(--r-lg);text-align:center;transition:all var(--tr-med);position:relative;overflow:hidden;${b.earned ? 'border:1px solid rgba(124,77,255,0.3)' : 'opacity:0.7'}"
          onmouseover="this.style.transform='scale(1.03)';this.style.boxShadow='0 16px 40px rgba(124,77,255,0.2)'"
          onmouseout="this.style.transform='';this.style.boxShadow=''">

          ${b.earned ? '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:var(--gradient-primary)"></div>' : ''}

          <div style="font-size:2.8rem;margin-bottom:12px;${b.earned ? 'filter:drop-shadow(0 0 12px rgba(124,77,255,0.6))' : 'filter:grayscale(80%)'}">${b.icon}</div>
          <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:6px">${b.name}</h3>
          <p class="desc" style="font-size:0.78rem;margin-bottom:12px">${b.desc}</p>

          ${b.earned ? `
            <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;background:rgba(0,230,118,0.1);border:1px solid rgba(0,230,118,0.25);border-radius:var(--r-full);font-size:11px;font-weight:600;color:var(--success)">✅ Earned!</span>
            ${b.earned_at ? `<div style="font-size:10px;color:var(--text-dim);margin-top:8px">${formatDate(b.earned_at)}</div>` : ''}
          ` : `
            <span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:var(--r-full);font-size:11px;color:var(--text-dim)">🔒 Locked</span>
          `}

          ${b.progress !== undefined ? `
            <div style="margin-top:10px;height:3px;border-radius:var(--r-full);background:rgba(124,77,255,0.15)">
              <div style="height:100%;width:${Math.min(100, b.progress)}%;background:var(--gradient-primary);border-radius:var(--r-full)"></div>
            </div>
          ` : ''}
        </div>
      `).join('')}</div>`
    }
  `;
}

// ===================== PAGE: PROFILE =====================
function renderProfile() {
  const user = store.get('user') || {};
  const stats = store.get('dashboard')?.stats || {};
  const xpForNext = 100;
  const xpPct = Math.round((user.xp % xpForNext) / xpForNext * 100);

  return `
    <div class="glass profile-card anim-fadeInUp" style="margin-bottom:24px;overflow:hidden;border-radius:var(--r-xl)">
      <!-- Banner with animated gradient -->
      <div class="profile-banner" style="height:140px;background:linear-gradient(135deg,var(--primary),var(--accent),var(--secondary));position:relative;overflow:hidden">
        <div class="profile-banner-pattern"></div>
        <div style="position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><circle cx=\'20\' cy=\'20\' r=\'40\' fill=\'rgba(255,255,255,0.05)\'/><circle cx=\'80\' cy=\'60\' r=\'50\' fill=\'rgba(255,255,255,0.03)\'/></svg>')no-repeat center/cover"></div>
      </div>

      <div style="padding:0 24px 24px">
        <!-- Avatar overlapping banner -->
        <div style="display:flex;align-items:flex-end;justify-content:space-between;margin-top:-40px;margin-bottom:16px;flex-wrap:wrap;gap:12px">
          <div style="width:80px;height:80px;border-radius:50%;background:${user.avatar_color || '#7c4dff'};display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:800;color:white;border:4px solid var(--bg);flex-shrink:0;box-shadow:0 0 30px ${user.avatar_color || '#7c4dff'}66">${getInitials(user.name)}</div>
          <button class="btn-outline btn-sm" onclick="store.set({page:'settings'});render()" style="margin-bottom:4px">⚙️ Settings</button>
        </div>

        <div style="margin-bottom:20px">
          <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:4px">${user.name || 'User'}</h2>
          <p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:8px">${user.bio || 'No bio yet — add one in settings!'}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${user.city ? `<span style="padding:3px 10px;background:rgba(124,77,255,0.08);border:1px solid rgba(124,77,255,0.15);border-radius:var(--r-full);font-size:11px;color:var(--primary)">📍 ${user.city}</span>` : ''}
            ${user.country ? `<span style="padding:3px 10px;background:rgba(124,77,255,0.08);border:1px solid rgba(124,77,255,0.15);border-radius:var(--r-full);font-size:11px;color:var(--primary)">🌍 ${user.country}</span>` : ''}
            <span style="padding:3px 10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:var(--r-full);font-size:11px;color:var(--text-dim)">📅 Joined ${user.joined_at ? formatDate(user.joined_at) : 'recently'}</span>
          </div>
        </div>

        <!-- XP Progress -->
        <div style="margin-bottom:20px;padding:16px;background:rgba(124,77,255,0.06);border-radius:var(--r-md);border:1px solid rgba(124,77,255,0.12)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-weight:700;font-size:0.9rem">Level ${user.level || 1} — ${user.xp || 0} XP</span>
            <span style="font-size:0.78rem;color:var(--text-dim)">${xpForNext - (user.xp % xpForNext)} XP to Level ${(user.level || 1)+1}</span>
          </div>
          <div style="height:8px;border-radius:var(--r-full);background:rgba(124,77,255,0.15);overflow:hidden">
            <div style="height:100%;width:${xpPct}%;background:var(--gradient-primary);border-radius:var(--r-full);box-shadow:0 0 8px rgba(124,77,255,0.5);transition:width 1s ease"></div>
          </div>
        </div>

        <!-- Stats grid -->
        <div class="profile-stats" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          ${[
            {val:user.level||1, label:'Level', color:'var(--primary)'},
            {val:user.xp||0, label:'Total XP', color:'var(--warning)'},
            {val:user.reputation||0, label:'Reputation', color:'var(--accent)'},
            {val:stats.skills||user.skill_count||0, label:'Skills', color:'var(--secondary)'},
            {val:user.total_exchanges||0, label:'Exchanges', color:'var(--success)'},
            {val:(user.teaching_hours||0)+'h', label:'Teaching', color:'var(--primary)'},
          ].map(s => `
            <div style="text-align:center;padding:12px 8px;background:${s.color}0d;border:1px solid ${s.color}20;border-radius:var(--r-md)">
              <div style="font-weight:800;font-size:1.2rem;color:${s.color}">${s.val}</div>
              <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px;margin-top:2px">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="glass" style="padding:24px;border-radius:var(--r-lg)">
      <h3 style="font-size:1rem;font-weight:700;margin-bottom:20px">✏️ Edit Profile</h3>
      <form onsubmit="event.preventDefault();saveProfile()">
        <div class="row2">
          <div class="fg"><label>Name</label><input id="p-name" value="${user.name || ''}" /></div>
          <div class="fg"><label>Email</label><input value="${user.email || ''}" disabled style="opacity:0.5" /></div>
        </div>
        <div class="fg"><label>Bio</label><textarea id="p-bio" rows="3">${user.bio || ''}</textarea></div>
        <div class="row2">
          <div class="fg"><label>City</label><input id="p-city" value="${user.city || ''}" /></div>
          <div class="fg"><label>Country</label><input id="p-country" value="${user.country || ''}" /></div>
        </div>
        <div class="fg">
          <label>Avatar Color</label>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">
            ${['#7c4dff','#e040fb','#00e5ff','#00e676','#ffab00','#ff1744','#448aff','#26a69a'].map(c => `
              <div class="avatar avatar-sm" style="background:${c};cursor:pointer;border:3px solid ${c === (user.avatar_color || '#7c4dff') ? 'white' : 'transparent'};transition:all 0.2s;border-radius:50%" onclick="document.getElementById('p-color').value='${c}';document.querySelectorAll('.avatar.avatar-sm').forEach(a=>a.style.borderColor='transparent');this.style.borderColor='white'">${getInitials(user.name)}</div>
            `).join('')}
            <input type="hidden" id="p-color" value="${user.avatar_color || '#7c4dff'}" />
          </div>
        </div>
        <button type="submit" class="btn-primary btn-glow" style="margin-top:20px">💾 Save Profile</button>
      </form>
    </div>
  `;
}
window.saveProfile = async () => {
  try {
    await PATCH('/auth/profile', {
      name: $('#p-name')?.value, bio: $('#p-bio')?.value,
      city: $('#p-city')?.value, country: $('#p-country')?.value,
      avatar_color: $('#p-color')?.value
    });
    toast('Profile updated! ✅', 'success');
    await loadUserData();
    render();
  } catch (e) { toast(e.message, 'error'); }
};

// ===================== PAGE: SETTINGS =====================
function renderSettings() {
  const s = store.get();
  const themeGradients = {
    dark:'135deg,#0a0a1a,#1a1a3e', light:'135deg,#f5f3ff,#e8e0ff',
    neon:'135deg,#000,#001a00', ocean:'135deg,#0a192f,#0d3b6e',
    sunset:'135deg,#1a0a2e,#2e1a0a', forest:'135deg,#0a1f0a,#1a3a1a',
    midnight:'135deg,#0d1117,#161b22', rose:'135deg,#1a0a14,#2e0a1a'
  };
  return `
    <div class="page-header">
      <h1>Settings</h1>
      <p class="page-sub">Customize your SkillBank experience</p>
    </div>

    <div style="display:flex;flex-direction:column;gap:16px">

      <!-- Appearance -->
      <div class="glass" style="padding:24px;border-radius:var(--r-lg)">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px">
          <span style="width:32px;height:32px;border-radius:var(--r-sm);background:rgba(124,77,255,0.15);display:inline-flex;align-items:center;justify-content:center">🎨</span>
          Appearance
        </h3>
        <div style="margin-bottom:12px;font-size:0.82rem;color:var(--text-dim)">Current theme: <span style="color:var(--primary);font-weight:700">${capitalize(s.theme)}</span></div>
        <div class="theme-picker" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:10px">
          ${THEMES.map(t => `
            <div class="theme-option ${s.theme === t ? 'active' : ''}" onclick="setTheme('${t}');render()" style="cursor:pointer;border-radius:var(--r-md);overflow:hidden;border:2px solid ${s.theme === t ? 'var(--primary)' : 'rgba(124,77,255,0.15)'};transition:all var(--tr-fast)" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='${s.theme===t?'var(--primary)':'rgba(124,77,255,0.15)'}' ">
              <div class="theme-color-preview" style="height:48px;background:linear-gradient(${themeGradients[t] || '135deg,#111,#222'})"></div>
              <div style="padding:6px 8px;font-size:11px;font-weight:600;text-align:center;background:rgba(0,0,0,0.3)">${capitalize(t)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Preferences -->
      <div class="glass" style="padding:24px;border-radius:var(--r-lg)">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px">
          <span style="width:32px;height:32px;border-radius:var(--r-sm);background:rgba(0,229,255,0.12);display:inline-flex;align-items:center;justify-content:center">🔧</span>
          Preferences
        </h3>
        ${[
          {icon:'🔊', title:'Sound Effects', sub:'Audio feedback on actions', key:'sound', storageKey:'sb_sound'},
          {icon:'✨', title:'Animations', sub:'UI micro-animations & transitions', key:'animations', storageKey:'sb_anim'},
          {icon:'🌌', title:'Particle Background', sub:'Animated ambient particles', key:'showParticles', special:'particles'},
          {icon:'📀', title:'Compact Mode', sub:'Reduced spacing for more content', key:'compactMode', storageKey:'sb_compact'},
        ].map(item => `
          <div class="settings-row" style="display:flex;align-items:center;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(124,77,255,0.07)">
            <div style="display:flex;align-items:center;gap:12px">
              <span style="width:36px;height:36px;border-radius:var(--r-sm);background:rgba(124,77,255,0.08);display:flex;align-items:center;justify-content:center;font-size:1rem">${item.icon}</span>
              <div>
                <div style="font-weight:600;font-size:0.9rem">${item.title}</div>
                <div style="font-size:0.75rem;color:var(--text-dim);margin-top:1px">${item.sub}</div>
              </div>
            </div>
            <label class="toggle">
              <input type="checkbox" ${s[item.key] ? 'checked' : ''}
                onchange="${item.special === 'particles' ? `toggleParticles(this.checked)` : `store.set({${item.key}:this.checked});localStorage.setItem('${item.storageKey}',this.checked?'1':'0')`}">
              <span class="toggle-slider"></span>
            </label>
          </div>
        `).join('')}
      </div>

      <!-- Data & About -->
      <div class="glass" style="padding:24px;border-radius:var(--r-lg)">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:20px;display:flex;align-items:center;gap:8px">
          <span style="width:32px;height:32px;border-radius:var(--r-sm);background:rgba(0,230,118,0.12);display:inline-flex;align-items:center;justify-content:center">📤</span>
          Data & About
        </h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
          <button class="btn-outline btn-sm" onclick="exportData()">📤 Export My Data</button>
          <button class="btn-outline btn-sm" onclick="showFeedbackModal()">💬 Send Feedback</button>
        </div>
        <div style="padding:14px;background:rgba(124,77,255,0.05);border-radius:var(--r-sm);border:1px solid rgba(124,77,255,0.1)">
          <div style="font-weight:700;font-size:0.85rem;margin-bottom:4px">${APP_NAME} v${APP_VERSION}</div>
          <div style="font-size:0.75rem;color:var(--text-dim);line-height:1.6">Time-Based Skill Exchange Platform with AI Matching<br>Built with ❤️ for lifelong learners</div>
        </div>
      </div>
    </div>
  `;
}
window.toggleParticles = (on) => {
  store.set({ showParticles: on });
  localStorage.setItem('sb_particles', on ? '1' : '0');
  const canvas = $('.particle-canvas');
  if (on) initParticles(); else if (canvas) canvas.remove();
};

window.showFeedbackModal = () => {
  const body = `
    <div class="fg"><label>Type</label><select id="m-fbtype"><option value="general">General</option><option value="bug">Bug Report</option><option value="feature">Feature Request</option><option value="praise">Praise</option></select></div>
    <div class="fg"><label>Message</label><textarea id="m-fbmsg" rows="4" placeholder="Your feedback..."></textarea></div>
  `;
  const footer = `<button class="btn-outline" onclick="closeModal(window._fbModal)">Cancel</button><button class="btn-primary" onclick="submitFeedback()">📤 Send</button>`;
  window._fbModal = showModal('Send Feedback', body, footer);
};
window.submitFeedback = async () => {
  try {
    await POST('/feedback', { type: $('#m-fbtype')?.value, message: $('#m-fbmsg')?.value });
    toast('Thank you for your feedback! 💚', 'success');
    closeModal(window._fbModal);
  } catch (e) { toast(e.message, 'error'); }
};

// ===================== PAGE: POMODORO =====================
function renderPomodoro() {
  const p = store.get('pomodoro');
  const total = p.mode === 'focus' ? 25*60 : 5*60;
  const pct = (total - p.seconds) / total;
  const r = 90; const c = 2 * Math.PI * r;
  const modeColor = p.mode === 'focus' ? 'var(--primary)' : 'var(--success)';

  return `
    <div class="page-header">
      <h1>Pomodoro Timer</h1>
      <p class="page-sub">Focus sessions — ${p.sessions} completed · ${p.totalFocus} minutes logged</p>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start" class="pomodoro-layout">
      <!-- Timer card -->
      <div class="glass pomodoro" style="padding:32px;border-radius:var(--r-xl);text-align:center">
        <!-- Mode switcher -->
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:28px">
          <button onclick="store.set({pomodoro:{...store.get('pomodoro'),mode:'focus',seconds:25*60,running:false}});render()" style="padding:6px 18px;border-radius:var(--r-full);background:${p.mode==='focus'?'var(--gradient-primary)':'rgba(124,77,255,0.08)'};border:1px solid ${p.mode==='focus'?'transparent':'rgba(124,77,255,0.2)'};color:${p.mode==='focus'?'white':'var(--text-dim)'};font-weight:${p.mode==='focus'?'700':'500'};font-size:0.82rem;cursor:pointer;transition:all var(--tr-fast)">🎯 Focus</button>
          <button onclick="store.set({pomodoro:{...store.get('pomodoro'),mode:'break',seconds:5*60,running:false}});render()" style="padding:6px 18px;border-radius:var(--r-full);background:${p.mode==='break'?'var(--gradient-primary)':'rgba(124,77,255,0.08)'};border:1px solid ${p.mode==='break'?'transparent':'rgba(124,77,255,0.2)'};color:${p.mode==='break'?'white':'var(--text-dim)'};font-weight:${p.mode==='break'?'700':'500'};font-size:0.82rem;cursor:pointer;transition:all var(--tr-fast)">☕ Break</button>
        </div>

        <div class="pomodoro-circle" style="position:relative;display:inline-block;margin-bottom:28px">
          <svg viewBox="0 0 200 200" width="200" height="200">
            <defs>
              <linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:var(--primary)"/>
                <stop offset="100%" style="stop-color:var(--accent)"/>
              </linearGradient>
            </defs>
            <circle class="track" cx="100" cy="100" r="${r}" style="fill:none;stroke:rgba(124,77,255,0.1);stroke-width:8" />
            <circle class="progress" id="pomo-progress" cx="100" cy="100" r="${r}"
              style="fill:none;stroke:url(#pomoGrad);stroke-width:8;stroke-linecap:round;transform:rotate(-90deg);transform-origin:50% 50%;transition:stroke-dashoffset 1s linear"
              stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct)}" />
          </svg>
          <div class="pomodoro-time" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
            <div class="time" id="pomo-time" style="font-size:2.4rem;font-weight:800;font-family:var(--font-mono);background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1">${formatTime(p.seconds)}</div>
            <div style="font-size:0.75rem;color:var(--text-dim);margin-top:4px">${p.mode === 'focus' ? '🎯 Focus Time' : '☕ Break Time'}</div>
          </div>
        </div>

        <div class="pomodoro-controls" style="display:flex;gap:12px;justify-content:center;margin-bottom:24px">
          ${p.running ?
            `<button class="btn-outline" style="padding:12px 28px;border-radius:var(--r-full);font-size:1rem" onclick="pausePomodoro()">⏸ Pause</button>` :
            `<button class="btn-primary btn-glow" style="padding:12px 28px;border-radius:var(--r-full);font-size:1rem" onclick="startPomodoro()">▶ Start</button>`
          }
          <button class="btn-outline" style="padding:12px 20px;border-radius:var(--r-full);font-size:1rem" onclick="resetPomodoro()">🔄</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
          ${[
            {val:p.sessions, label:'Sessions', icon:'📊'},
            {val:p.totalFocus, label:'Minutes', icon:'⏰'},
            {val:Math.round(p.totalFocus/60*10)/10, label:'Hours', icon:'🔥'},
          ].map(stat => `
            <div style="padding:12px 8px;background:rgba(124,77,255,0.06);border:1px solid rgba(124,77,255,0.1);border-radius:var(--r-md);text-align:center">
              <div style="font-size:1.2rem;margin-bottom:4px">${stat.icon}</div>
              <div style="font-weight:800;font-size:1.1rem;color:var(--primary)">${stat.val}</div>
              <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.5px">${stat.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Tips card -->
      <div class="glass" style="padding:24px;border-radius:var(--r-xl)">
        <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:16px">💡 Pomodoro Tips</h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[
            {icon:'🎯', tip:'Focus on one task per 25-minute session for maximum productivity'},
            {icon:'📵', tip:'Put your phone away — notifications kill deep work flow'},
            {icon:'☕', tip:'Use 5-minute breaks to stretch, hydrate, and rest your eyes'},
            {icon:'📊', tip:'Track sessions consistently to build a productive habit'},
            {icon:'🏆', tip:'Aim for 8-12 focused sessions per day for expert performance'},
          ].map((item, i) => `
            <div style="display:flex;align-items:flex-start;gap:12px;padding:12px;background:rgba(124,77,255,0.04);border-radius:var(--r-sm);border:1px solid rgba(124,77,255,0.08);transition:all var(--tr-fast);animation:slideInRight ${(i+1)*0.08}s ease-out"
              onmouseover="this.style.background='rgba(124,77,255,0.1)';this.style.transform='translateX(4px)'"
              onmouseout="this.style.background='rgba(124,77,255,0.04)';this.style.transform=''">
              <span style="font-size:1.1rem;flex-shrink:0">${item.icon}</span>
              <span style="font-size:0.82rem;line-height:1.5;color:var(--text-secondary)">${item.tip}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ===================== PAGE: KANBAN =====================
function renderKanban() {
  const kanban = store.get('kanban');
  return `
    <div class="page-header"><h1>Learning Kanban 📋</h1><p class="page-sub">Track your learning progress</p></div>
    <div class="kanban">
      ${kanban.columns.map(col => `
        <div class="kanban-column" data-col="${col.id}">
          <div class="kanban-column-header">
            <h4>${col.title}</h4>
            <div class="flex items-center gap-8">
              <span class="kanban-count">${col.cards.length}</span>
              <button class="btn-icon" onclick="addKanbanCard('${col.id}')">➕</button>
            </div>
          </div>
          <div class="kanban-cards">
            ${col.cards.map(card => `
              <div class="kanban-card" draggable="true" data-card="${card.id}">
                <div class="kanban-card-title">${card.title}</div>
                <div class="kanban-card-meta">
                  <span>${timeAgo(card.created)}</span>
                  <button class="btn-icon" style="margin-left:auto" onclick="deleteKanbanCard('${col.id}','${card.id}')">🗑️</button>
                </div>
              </div>
            `).join('')}
            ${col.cards.length === 0 ? '<div class="empty-sm">Drop items here</div>' : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ===================== PAGE: NOTES =====================
function renderNotes() {
  const notes = store.get('notes') || [];
  return `
    <div class="page-header">
      <div class="flex justify-between items-center">
        <div><h1>Notes 📝</h1><p class="page-sub">${notes.length} notes</p></div>
        <button class="btn-primary" onclick="addNote()">➕ New Note</button>
      </div>
    </div>
    ${notes.length === 0 ? renderEmpty('📝', 'No notes yet. Create one!', '<button class="btn-primary mt-16" onclick="addNote()">➕ New Note</button>') :
      `<div class="notes-grid stagger-children">${notes.map(n => `
        <div class="glass note-card">
          <div class="note-color-strip" style="background:${n.color}"></div>
          <div class="flex justify-between items-center mb-8">
            <input class="text-lg" value="${n.title}" style="background:none;border:none;color:var(--text);font-weight:700;padding:0;width:100%" onblur="updateNote('${n.id}','title',this.value)" />
            <button class="btn-icon" onclick="deleteNote('${n.id}')">🗑️</button>
          </div>
          <textarea style="width:100%;min-height:80px;background:none;border:none;color:var(--text-secondary);resize:none;font-size:var(--fs-sm);font-family:var(--font-sans)" onblur="updateNote('${n.id}','content',this.value)">${n.content || ''}</textarea>
          <small class="text-xs text-dim">${timeAgo(n.created)}</small>
        </div>
      `).join('')}</div>`
    }
  `;
}

// ===================== PAGE: FLASHCARDS =====================
function renderFlashcards() {
  const cards = store.get('flashcards') || [];
  const idx = store.get('flashcardIndex');
  const flipped = store.get('flashcardFlipped');
  const current = cards[idx];

  return `
    <div class="page-header"><h1>Flashcards 🃏</h1><p class="page-sub">${cards.length} cards</p></div>

    ${cards.length > 0 ? `
      <div class="flashcard-container" onclick="flipCard()">
        <div class="flashcard ${flipped ? 'flipped' : ''}">
          <div class="flashcard-front glass"><div><h3>${current?.front || ''}</h3><p class="text-sm text-muted mt-8">Click to flip</p></div></div>
          <div class="flashcard-back"><div><h3>${current?.back || ''}</h3></div></div>
        </div>
      </div>
      <div class="flex justify-center gap-16 mt-24">
        <button class="btn-outline" onclick="prevCard()">⬅ Previous</button>
        <span class="text-muted">${idx + 1} / ${cards.length}</span>
        <button class="btn-outline" onclick="nextCard()">Next ➡</button>
      </div>
      <div class="flex justify-center mt-8">
        <button class="btn-sm btn-danger" onclick="deleteFlashcard('${current?.id}')">🗑️ Delete Card</button>
      </div>
    ` : renderEmpty('🃏', 'No flashcards yet. Add some below!')}

    <div class="section">
      <h3>Add New Flashcard</h3>
      <div class="glass mt-8">
        <div class="row2">
          <div class="fg"><label>Front (Question)</label><input id="fc-front" placeholder="Question or term..." /></div>
          <div class="fg"><label>Back (Answer)</label><input id="fc-back" placeholder="Answer or definition..." /></div>
        </div>
        <button class="btn-primary mt-8" onclick="addFlashcard()">➕ Add Card</button>
      </div>
    </div>
  `;
}

// ===================== PAGE: GOALS & HABITS =====================
function renderGoals() {
  const goals = store.get('goals') || [];
  const habits = store.get('habits') || {};
  const doneCount = goals.filter(g => g.done).length;

  // Generate habit grid for last 12 weeks
  const today = new Date();
  const habitDays = [];
  for (let i = 83; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0,10);
    habitDays.push({ key, level: habits[key] || 0 });
  }

  return `
    <div class="page-header"><h1>Goals & Habits 🎯</h1><p class="page-sub">${doneCount}/${goals.length} goals completed</p></div>

    <div class="glass mb-24">
      <h3 class="mb-16">📋 Goals</h3>
      <div class="flex gap-8 mb-16">
        <input id="goal-input" placeholder="Add a new goal..." style="flex:1" onkeydown="if(event.key==='Enter')addGoal()" />
        <button class="btn-primary" onclick="addGoal()">➕ Add</button>
      </div>
      ${goals.length === 0 ? '<div class="empty-sm">No goals yet</div>' :
        goals.map(g => `
          <div class="goal-card glass compact" style="margin-bottom:8px">
            <div class="goal-check ${g.done ? 'done' : ''}" onclick="toggleGoal('${g.id}')">${g.done ? '✓' : ''}</div>
            <div class="goal-info"><span class="goal-title ${g.done ? 'done' : ''}">${g.title}</span></div>
            <button class="btn-icon" onclick="deleteGoal('${g.id}')">🗑️</button>
          </div>
        `).join('')}
      ${goals.length > 0 ? `<div class="mt-8">${renderProgressBar(doneCount, goals.length, 'lg')}<small class="text-xs text-muted mt-4">${Math.round(doneCount/goals.length*100)||0}% complete</small></div>` : ''}
    </div>

    <div class="glass">
      <h3 class="mb-16">🔥 Learning Habit Tracker</h3>
      <p class="desc mb-16">Track your daily learning streak (click cells to toggle)</p>
      <div class="habit-grid" style="grid-template-columns:repeat(12, 1fr)">
        ${habitDays.map(d => `<div class="habit-cell l${d.level}" data-tooltip="${d.key}" onclick="toggleHabit('${d.key}')"></div>`).join('')}
      </div>
      <div class="flex gap-16 mt-8">
        <div class="flex items-center gap-4"><div class="habit-cell l0" style="width:12px;height:12px"></div><span class="text-xs text-muted">None</span></div>
        <div class="flex items-center gap-4"><div class="habit-cell l1" style="width:12px;height:12px"></div><span class="text-xs text-muted">Low</span></div>
        <div class="flex items-center gap-4"><div class="habit-cell l2" style="width:12px;height:12px"></div><span class="text-xs text-muted">Medium</span></div>
        <div class="flex items-center gap-4"><div class="habit-cell l3" style="width:12px;height:12px"></div><span class="text-xs text-muted">High</span></div>
        <div class="flex items-center gap-4"><div class="habit-cell l4" style="width:12px;height:12px"></div><span class="text-xs text-muted">Max</span></div>
      </div>
    </div>
  `;
}

// ===================== PAGE: ANALYTICS =====================
function renderAnalytics() {
  const user = store.get('user') || {};
  const dashboard = store.get('dashboard') || {};
  const stats = dashboard.stats || {};
  const recentExchanges = dashboard.recent_exchanges || [];
  const skills = dashboard.skills || [];

  // Real weekly activity from exchange dates
  const weeklyData = Array(12).fill(0);
  const now = Date.now();
  recentExchanges.forEach(e => {
    const daysAgo = Math.floor((now - new Date(e.created_at).getTime()) / 86400000);
    if (daysAgo < 12) weeklyData[11 - daysAgo]++;
  });

  // Real category distribution from my skills
  const allSkills = store.get('skills') || skills;
  const catCounts = {};
  allSkills.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
  const categoryData = Object.entries(catCounts).sort((a,b) => b[1]-a[1]).slice(0,6).map(([name,value]) => ({ name, value }));
  if (categoryData.length === 0) SKILL_CATEGORIES.slice(0,4).forEach(c => categoryData.push({ name: c, value: 0 }));
  const maxCat = Math.max(...categoryData.map(c => c.value), 1);

  // Real hours: sum of exchange duration_hours where user is teacher
  const exchanges = store.get('exchanges') || [];
  const totalHours = exchanges.filter(e => e.status === 'completed').reduce((s, e) => s + (e.duration_hours || 1), 0);

  // Pomodoro sessions (local)
  const pomSessions = store.get('pomodoro').sessions;

  return `
    <div class="page-header"><h1>Analytics 📊</h1><p class="page-sub">Your real learning insights</p></div>

    <div class="stats-grid stagger-children">
      <div class="stat-card gradient-1 glass"><div class="stat-icon">📈</div><div class="stat-number">${totalHours}</div><div class="stat-label">Teaching Hours</div></div>
      <div class="stat-card gradient-2 glass"><div class="stat-icon">🎯</div><div class="stat-number">${stats.skills || 0}</div><div class="stat-label">Active Skills</div></div>
      <div class="stat-card gradient-3 glass"><div class="stat-icon">🤝</div><div class="stat-number">${stats.exchanges_completed || 0}</div><div class="stat-label">Exchanges Done</div></div>
      <div class="stat-card gradient-5 glass"><div class="stat-icon">🔥</div><div class="stat-number">${store.get('streakDays')}</div><div class="stat-label">Day Streak</div></div>
    </div>

    <div class="dash-grid">
      <div class="glass dash-card">
        <div class="dch"><h3>📈 Exchange Activity (12 days)</h3></div>
        <div class="bar-chart" style="height:180px">${weeklyData.map((v,i) => `<div class="bar-chart-bar" style="height:${Math.max(v/Math.max(...weeklyData,1)*100,4)}%;background:var(--primary)"><span class="bar-chart-label">${['-12','-11','-10','-9','-8','-7','-6','-5','-4','-3','-2','Now'][i]}</span></div>`).join('')}</div>
      </div>
      <div class="glass dash-card">
        <div class="dch"><h3>📊 Skills by Category</h3></div>
        <div style="display:flex;flex-direction:column;gap:12px;padding:8px 0">
          ${categoryData.length === 0
            ? '<div class="empty-sm">Add skills to see category breakdown</div>'
            : categoryData.map(c => `
            <div>
              <div class="flex justify-between mb-4"><span class="text-sm">${c.name}</span><span class="text-sm text-muted">${c.value}</span></div>
              ${renderProgressBar(c.value, maxCat)}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="glass dash-card">
        <div class="dch"><h3>🏆 Level Progress</h3></div>
        <div class="text-center p-24">
          ${renderProgressCircle(user.xp % 100 || 0, 100, 120, `Lv ${user.level || 1}`)}
          <p class="desc mt-16">${user.xp || 0} XP total • ${100 - (user.xp % 100 || 0)} XP to next level</p>
        </div>
      </div>
      <div class="glass dash-card">
        <div class="dch"><h3>📅 Stats Summary</h3></div>
        <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0">
          <div class="flex justify-between"><span class="text-sm text-muted">Total skills</span><strong>${stats.skills || 0}</strong></div>
          <div class="flex justify-between"><span class="text-sm text-muted">Exchanges completed</span><strong>${stats.exchanges_completed || 0}</strong></div>
          <div class="flex justify-between"><span class="text-sm text-muted">Teaching hours</span><strong>${totalHours}</strong></div>
          <div class="flex justify-between"><span class="text-sm text-muted">Reputation score</span><strong>${user.reputation || 0}</strong></div>
          <div class="flex justify-between"><span class="text-sm text-muted">Pomodoro sessions</span><strong>${pomSessions}</strong></div>
          <div class="flex justify-between"><span class="text-sm text-muted">Current level</span><strong>Level ${user.level || 1} – ${getLevelTitle(user.level || 1)}</strong></div>
        </div>
      </div>
    </div>
  `;
}

// ===================== PAGE: SOCIAL FEED =====================
function renderFeed() {
  const user = store.get('user') || {};
  const feed = store.get('feed') || [];
  const isLoading = store.isLoading('feed');

  return `
    <div class="page-header"><h1>Social Feed 📰</h1><p class="page-sub">Community activity and updates</p></div>

    <div class="glass mb-16">
      <div class="flex items-center gap-12 mb-12">
        ${renderAvatar(user.name, user.avatar_color, 'md')}
        <input id="feed-post" class="flex-1" placeholder="Share something with the community..." style="border-radius:var(--r-full)" />
      </div>
      <div class="flex justify-between">
        <div class="flex gap-8">
          <span class="text-xs text-muted" style="align-self:center">Activity feed shows real exchanges, skills, and posts</span>
        </div>
        <button class="btn-sm btn-primary" onclick="submitFeedPost()">📤 Post</button>
      </div>
    </div>

    ${isLoading ? '<div class="loading"><div class="spinner"></div><p>Loading feed...</p></div>' :
      feed.length === 0
        ? renderEmpty('📰', 'No activity yet. Complete an exchange or add a skill to have activity appear here!')
        : `<div class="stagger-children">
            ${feed.map(p => `
              <div class="glass feed-post">
                <div class="feed-post-header">
                  ${renderAvatar(p.user_name, p.avatar_color, 'md')}
                  <div>
                    <strong>${escHtml(p.user_name || 'Community')}</strong>
                    ${p.is_activity ? '<span class="badge badge-info" style="margin-left:6px;font-size:10px">Activity</span>' : ''}
                    <br/><small class="text-muted">${timeAgo(p.created_at)}</small>
                  </div>
                </div>
                <p style="line-height:1.6">${p.content || ''}</p>
                ${!p.is_activity ? `
                <div class="feed-post-actions">
                  <button class="feed-action" id="like-${p.id || p._id}" onclick="likeFeedPost('${p.id || p._id}', this)"><span>${(p.liked_by||[]).includes(user.id) ? '❤️' : '🤍'}</span> ${p.likes || 0}</button>
                  <button class="feed-action"><span>🔖</span> Save</button>
                </div>` : ''}
              </div>
            `).join('')}
          </div>`
    }
  `;
}

window.submitFeedPost = async () => {
  const content = $('#feed-post')?.value?.trim();
  if (!content) return toast('Please write something first', 'warning');
  try {
    await POST('/feed', { content });
    if ($('#feed-post')) $('#feed-post').value = '';
    toast('Post shared! 📰', 'success');
    await loadFeed();
    render();
  } catch (e) { toast(e.message, 'error'); }
};

window.likeFeedPost = async (id, btn) => {
  const numId = parseInt(id);
  if (isNaN(numId)) return toast('Cannot like activity items', 'info');
  try {
    const res = await POST(`/feed/${numId}/like`);
    const span = btn?.querySelector('span');
    if (span) span.textContent = res.liked ? '❤️' : '🤍';
    btn.innerHTML = `<span>${res.liked ? '❤️' : '🤍'}</span> ${res.likes}`;
  } catch (e) { toast(e.message, 'error'); }
};

// ===================== PAGE: GROUPS =====================
function renderGroups() {
  const groups = store.get('groups') || [];
  const isLoading = store.isLoading('groups');

  return `
    <div class="page-header">
      <div class="flex justify-between items-center">
        <div><h1>Groups 👥</h1><p class="page-sub">Join communities of shared interests</p></div>
        <button class="btn-primary" onclick="showCreateGroupModal()">➕ Create Group</button>
      </div>
    </div>
    ${isLoading ? '<div class="loading"><div class="spinner"></div><p>Loading groups...</p></div>' :
      groups.length === 0
        ? renderEmpty('👥', 'No groups yet. Create the first one!', '<button class="btn-primary mt-16" onclick="showCreateGroupModal()">➕ Create Group</button>')
        : `<div class="results-grid stagger-children">
            ${groups.map(g => `
              <div class="glass group-card">
                <div class="group-banner" style="background:linear-gradient(135deg, ${g.color || '#7c4dff'}, ${g.color || '#7c4dff'}88)"></div>
                <div style="padding:16px">
                  <h3>${escHtml(g.name)}</h3>
                  <p class="desc">${escHtml(g.description || '')}</p>
                  <div class="flex items-center justify-between mt-12">
                    <div class="flex items-center gap-8">
                      ${renderBadge('cat', g.category || 'Other')}
                      <span class="text-sm text-muted">👥 ${g.member_count || 0} members</span>
                    </div>
                    <button class="btn-sm ${g.is_member ? 'btn-outline' : 'btn-primary'}" onclick="joinGroup(${g.id}, this)">
                      ${g.is_member ? '✓ Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>`
    }
  `;
}

window.joinGroup = async (id, btn) => {
  try {
    const res = await POST(`/groups/${id}/join`);
    toast(res.is_member ? `Joined group! 🎉` : `Left group`, res.is_member ? 'success' : 'info');
    await loadGroups();
    render();
  } catch (e) { toast(e.message, 'error'); }
};

window.showCreateGroupModal = () => {
  const body = `
    <div class="fg"><label>Group Name *</label><input id="m-gname" placeholder="e.g., Python Learners" /></div>
    <div class="fg"><label>Description</label><textarea id="m-gdesc" rows="3" placeholder="What is this group about?"></textarea></div>
    <div class="row2">
      <div class="fg"><label>Category</label><select id="m-gcat">${SKILL_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
      <div class="fg"><label>Color</label><input type="color" id="m-gcol" value="#7c4dff" style="height:44px" /></div>
    </div>
  `;
  const footer = `<button class="btn-outline" onclick="closeModal(window._grpModal)">Cancel</button><button class="btn-primary" onclick="submitCreateGroup()">➕ Create</button>`;
  window._grpModal = showModal('Create Group', body, footer);
};

window.submitCreateGroup = async () => {
  const name = $('#m-gname')?.value?.trim();
  if (!name) return toast('Group name is required', 'warning');
  try {
    await POST('/groups', { name, description: $('#m-gdesc')?.value, category: $('#m-gcat')?.value, color: $('#m-gcol')?.value });
    closeModal(window._grpModal);
    toast('Group created! 🎉', 'success');
    await loadGroups();
    render();
  } catch (e) { toast(e.message, 'error'); }
};

// ===================== PAGE: FORUMS =====================
function renderForums() {
  const threads = store.get('forumThreads') || [];
  const isLoading = store.isLoading('forums');

  return `
    <div class="page-header">
      <div class="flex justify-between items-center">
        <div><h1>Forums 💭</h1><p class="page-sub">Discuss, share, and learn together</p></div>
        <button class="btn-primary" onclick="showCreateThreadModal()">📝 New Thread</button>
      </div>
    </div>
    ${isLoading ? '<div class="loading"><div class="spinner"></div><p>Loading forums...</p></div>' :
      threads.length === 0
        ? renderEmpty('💭', 'No threads yet. Start the conversation!', '<button class="btn-primary mt-16" onclick="showCreateThreadModal()">📝 New Thread</button>')
        : `<div class="glass stagger-children">
            ${threads.map(t => `
              <div class="forum-thread" onclick="viewThread(${t.id})" style="cursor:pointer">
                <div style="flex:1">
                  <div class="flex items-center gap-8">
                    ${t.pinned ? '<span class="badge badge-premium">📌 Pinned</span>' : ''}
                    <strong>${escHtml(t.title)}</strong>
                  </div>
                  <div class="flex items-center gap-8 mt-4">
                    <span class="text-xs text-muted">by ${escHtml(t.author_name || 'Community')}</span>
                    <span class="text-xs text-dim">${timeAgo(t.created_at)}</span>
                    ${(t.tags || []).map(tag => `<span class="forum-tag badge-cat" style="background:var(--primary-light);color:var(--primary)">${tag}</span>`).join('')}
                  </div>
                </div>
                <div class="forum-thread-stats">
                  <span>💬 ${t.reply_count || 0}</span>
                  <span>👁 ${t.views || 0}</span>
                </div>
              </div>
            `).join('')}
          </div>`
    }
  `;
}

window.showCreateThreadModal = () => {
  const body = `
    <div class="fg"><label>Title *</label><input id="m-ftitle" placeholder="What do you want to discuss?" /></div>
    <div class="fg"><label>Content</label><textarea id="m-fcontent" rows="4" placeholder="Share your thoughts..."></textarea></div>
    <div class="fg"><label>Tags (comma-separated)</label><input id="m-ftags" placeholder="e.g., tips, beginner, teaching" /></div>
  `;
  const footer = `<button class="btn-outline" onclick="closeModal(window._ftModal)">Cancel</button><button class="btn-primary" onclick="submitCreateThread()">📝 Post Thread</button>`;
  window._ftModal = showModal('New Forum Thread', body, footer);
};

window.submitCreateThread = async () => {
  const title = $('#m-ftitle')?.value?.trim();
  if (!title) return toast('Thread title is required', 'warning');
  try {
    const tags = ($('#m-ftags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
    const res = await POST('/forums', { title, content: $('#m-fcontent')?.value, tags });
    closeModal(window._ftModal);
    toast('Thread posted! 💭', 'success');
    await loadForums();
    render();
    // Open the newly created thread
    if (res.id) setTimeout(() => viewThread(res.id), 100);
  } catch (e) { toast(e.message, 'error'); }
};

window.viewThread = async (id) => {
  try {
    const thread = await GET(`/forums/${id}`);
    const repliesHtml = (thread.replies || []).length === 0
      ? '<div class="empty-sm" style="margin:16px 0">No replies yet. Be the first!</div>'
      : (thread.replies || []).map(r => `
          <div class="glass compact" style="margin-bottom:8px;padding:12px 16px">
            <div class="flex items-center gap-8 mb-4">
              ${renderAvatar(r.author_name, null, 'sm')}
              <strong class="text-sm">${escHtml(r.author_name)}</strong>
              <span class="text-xs text-dim">${timeAgo(r.created_at)}</span>
            </div>
            <p class="text-sm">${escHtml(r.content)}</p>
          </div>
        `).join('');

    const body = `
      <div class="mb-16">
        <p style="line-height:1.7">${escHtml(thread.content || '')}</p>
        <div class="flex gap-8 mt-8">
          ${(thread.tags || []).map(tag => `<span class="badge" style="background:var(--primary-light);color:var(--primary)">${tag}</span>`).join('')}
        </div>
      </div>
      <hr style="border-color:var(--border);margin:16px 0"/>
      <h4 class="mb-8">Replies (${thread.reply_count || 0})</h4>
      ${repliesHtml}
      <div class="fg mt-16"><label>Add a Reply</label><textarea id="m-freply" rows="3" placeholder="Share your thoughts..."></textarea></div>
    `;
    const footer = `
      <button class="btn-outline" onclick="closeModal(window._tvModal)">Close</button>
      <button class="btn-primary" onclick="submitThreadReply(${id})">💬 Reply</button>
    `;
    window._tvModal = showModal(escHtml(thread.title), body, footer);
  } catch (e) { toast(e.message || 'Failed to load thread', 'error'); }
};

window.submitThreadReply = async (threadId) => {
  const content = $('#m-freply')?.value?.trim();
  if (!content) return toast('Please write a reply', 'warning');
  try {
    await POST(`/forums/${threadId}/reply`, { content });
    toast('Reply posted! 💬', 'success');
    closeModal(window._tvModal);
    await loadForums();
    render();
    setTimeout(() => viewThread(threadId), 200);
  } catch (e) { toast(e.message, 'error'); }
};


// ===================== MAIN RENDER =====================
function render() {
  const app = $('#app');
  if (!app) return;

  const token = store.get('token');
  const page = store.get('page');

  if (!token) {
    store.set({ page: 'auth' });
    app.innerHTML = renderAuth();
    return;
  }

  let pageContent = '';
  switch (page) {
    case 'dashboard': pageContent = renderDashboard(); break;
    case 'skills': pageContent = renderSkills(); break;
    case 'browse': pageContent = renderBrowse(); break;
    case 'matching': pageContent = renderMatching(); break;
    case 'exchanges': pageContent = renderExchanges(); break;
    case 'messages': pageContent = renderMessages(); break;
    case 'requests': pageContent = renderRequests(); break;
    case 'events': pageContent = renderEvents(); break;
    case 'leaderboard': pageContent = renderLeaderboard(); break;
    case 'achievements': pageContent = renderAchievements(); break;
    case 'profile': pageContent = renderProfile(); break;
    case 'settings': pageContent = renderSettings(); break;
    case 'pomodoro': pageContent = renderPomodoro(); break;
    case 'kanban': pageContent = renderKanban(); break;
    case 'notes': pageContent = renderNotes(); break;
    case 'flashcards': pageContent = renderFlashcards(); break;
    case 'goals': pageContent = renderGoals(); break;
    case 'analytics': pageContent = renderAnalytics(); break;
    case 'feed': pageContent = renderFeed(); break;
    case 'groups': pageContent = renderGroups(); break;
    case 'forums': pageContent = renderForums(); break;
    default: pageContent = renderDashboard(); break;
  }

  app.innerHTML = renderAppShell(pageContent);

  // Post-render hooks
  requestAnimationFrame(() => {
    initScrollReveal();
    // Add ripple to buttons
    $$('.btn-primary, .btn-gradient').forEach(btn => {
      btn.classList.add('btn-ripple');
      btn.addEventListener('click', addRipple);
    });
  });
}

// Store re-render subscription for loading states
store.subscribe((state, prev) => {
  // Only re-render for loading changes on current page
  if (JSON.stringify(state.loading) !== JSON.stringify(prev.loading)) {
    const page = state.page;
    if (page === 'browse' && state.loading.browse !== prev.loading.browse) render();
    if (page === 'skills' && state.loading.skills !== prev.loading.skills) render();
    if (page === 'matching' && state.loading.matches !== prev.loading.matches) render();
    if (page === 'feed' && state.loading.feed !== prev.loading.feed) render();
    if (page === 'groups' && state.loading.groups !== prev.loading.groups) render();
    if (page === 'forums' && state.loading.forums !== prev.loading.forums) render();
  }
});

// ===================== KEYBOARD SHORTCUTS =====================
document.addEventListener('keydown', (e) => {
  // Ctrl+K: Command Palette
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); toggleCommandPalette(); }
  // Escape: Close overlays
  if (e.key === 'Escape') {
    if (store.get('commandPaletteOpen')) toggleCommandPalette();
    if (store.get('notifDropdownOpen')) { store.set({ notifDropdownOpen: false }); const a = $('#notif-dropdown-anchor'); if (a) a.innerHTML = ''; }
  }
  // Ctrl+N: New skill
  if ((e.ctrlKey || e.metaKey) && e.key === 'n' && store.get('token')) { e.preventDefault(); showAddSkillModal(); }
});

// ===================== SOCKET.IO REAL-TIME =====================
function initSocketIO() {
  try {
    if (typeof io === 'undefined') return;
    const user = store.get('user');
    if (!user) return;
    const socket = io({ transports: ['websocket', 'polling'] });
    socket.on('connect', () => {
      socket.emit('user:online', user.id);
    });
    socket.on('users:online', (data) => {
      store.set({ onlineUsers: data.count || 0 });
    });
    socket.on('notification:new', () => {
      loadNotifications();
    });
    socket.on('message:new', (msg) => {
      if (store.get('page') === 'messages') loadMessages();
    });
    socket.on('exchange:changed', () => {
      if (store.get('page') === 'exchanges') loadExchanges();
      loadUserData();
    });
    window._socket = socket;
  } catch (e) { console.warn('Socket.io unavailable:', e.message); }
}

// ===================== INITIALIZATION =====================
async function init() {
  // Apply theme
  const theme = store.get('theme');
  if (theme !== 'dark') document.body.className = `theme-${theme}`;

  // Check auth
  if (store.get('token')) {
    try {
      await loadUserData();
      const hash = window.location.hash.slice(1);
      if (hash) store.set({ page: hash });
      render();
      // Load data for the initial page
      loadPageData(store.get('page'));
      // Background data loading
      loadNotifications();
      initParticles();
      // Socket.io real-time connection
      initSocketIO();
      // Periodic refresh
      setInterval(() => {
        if (store.get('token')) {
          loadNotifications();
        }
      }, 60000);
    } catch {
      logout();
    }
  } else {
    store.set({ page: 'auth' });
    render();
  }

  // Random motivational quote on startup
  setTimeout(() => {
    if (store.get('token')) {
      toast(QUOTES[Math.floor(Math.random() * QUOTES.length)], 'info', 5000);
    }
  }, 3000);
}

// Boot
init();

// ===================== SERVICE WORKER REGISTRATION =====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // SW registration placeholder
  });
}

// ===================== PERFORMANCE MONITORING =====================
window.addEventListener('load', () => {
  if (window.performance) {
    const timing = performance.getEntriesByType('navigation')[0];
    if (timing) {
      console.log(`⚡ ${APP_NAME} loaded in ${Math.round(timing.loadEventEnd - timing.startTime)}ms`);
    }
  }
});

// ===================== VISIBILITY API =====================
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && store.get('token')) {
    loadNotifications();
  }
});

// ===================== NETWORK STATUS =====================
window.addEventListener('online', () => toast('Back online! ✅', 'success'));
window.addEventListener('offline', () => toast('You are offline 📶', 'warning'));

// ===================== GLOBAL EXPORTS =====================
window.store = store;
window.toggleCommandPalette = toggleCommandPalette;
window.setTheme = setTheme;
window.acceptExchange = acceptExchange;
window.declineExchange = declineExchange;
window.DEL = DEL;
window.loadRequests = loadRequests;
window.loadEvents = loadEvents;
window.loadFeed = loadFeed;
window.loadGroups = loadGroups;
window.loadForums = loadForums;
