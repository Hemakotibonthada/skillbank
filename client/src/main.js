// ==================== SkillBank Enhanced Frontend ====================
const API = '/api';
let token = localStorage.getItem('skillbank_token');
let currentPage = 'dashboard';
const $ = id => document.getElementById(id);

// ==================== UTILITIES ====================
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API}${path}`, { ...options, headers: { ...headers, ...options.headers } });
    if (res.status === 401) { token = null; localStorage.removeItem('skillbank_token'); renderApp(); return null; }
    const data = await res.json();
    if (!res.ok && data.error) { showToast(data.error, 'error'); return null; }
    return data;
  } catch (e) { showToast('Network error', 'error'); return null; }
}

function setToken(t) { token = t; localStorage.setItem('skillbank_token', t); }

function showToast(message, type = 'success') {
  const c = document.querySelector('.toast-container') || (() => { const d = document.createElement('div'); d.className = 'toast-container'; document.body.appendChild(d); return d; })();
  const t = document.createElement('div'); t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${message}`;
  c.appendChild(t); requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

function showModal(title, content, footer = '') {
  const overlay = document.createElement('div'); overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal"><div class="modal-header"><h3>${title}</h3><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div><div class="modal-body">${content}</div>${footer ? `<div class="modal-footer">${footer}</div>` : ''}</div>`;
  document.body.appendChild(overlay); requestAnimationFrame(() => overlay.classList.add('show'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  return overlay;
}

function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function timeAgo(d) { const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return 'now'; if (s < 3600) return Math.floor(s/60)+'m'; if (s < 86400) return Math.floor(s/3600)+'h'; return Math.floor(s/86400)+'d'; }

// ==================== APP RENDER ====================
function renderApp() {
  const app = document.getElementById('app');
  if (!token) { app.innerHTML = renderAuth(); bindAuth(); }
  else { app.innerHTML = renderShell(); bindNav(); navigateTo(currentPage); }
}

// ==================== AUTH ====================
function renderAuth() {
  return `<div class="auth-container">
    <div class="auth-shapes"><div class="shape s1"></div><div class="shape s2"></div><div class="shape s3"></div></div>
    <div class="auth-card">
      <div class="auth-logo"><div class="logo-icon">🎓</div><h1>SkillBank</h1><p>AI-Powered Skill Exchange Network</p></div>
      <div class="tabs"><button class="tab active" data-tab="login">Sign In</button><button class="tab" data-tab="register">Join</button></div>
      <form id="login-form">
        <div class="ig"><span class="ii">📧</span><input type="email" id="l-email" placeholder="Email" required /></div>
        <div class="ig"><span class="ii">🔒</span><input type="password" id="l-pass" placeholder="Password" required /></div>
        <button type="submit" class="btn-primary btn-glow">Sign In →</button>
      </form>
      <form id="register-form" style="display:none">
        <div class="ig"><span class="ii">👤</span><input type="text" id="r-name" placeholder="Full Name" required /></div>
        <div class="ig"><span class="ii">📧</span><input type="email" id="r-email" placeholder="Email" required /></div>
        <div class="ig"><span class="ii">🔒</span><input type="password" id="r-pass" placeholder="Password" required minlength="6" /></div>
        <div class="row2"><div class="ig"><span class="ii">🏙️</span><input type="text" id="r-city" placeholder="City" /></div><div class="ig"><span class="ii">🌍</span><input type="text" id="r-country" placeholder="Country" /></div></div>
        <textarea id="r-bio" placeholder="Tell us about yourself..." rows="2"></textarea>
        <button type="submit" class="btn-primary btn-glow">Create Account →</button>
      </form>
      <div id="auth-error" class="error"></div>
      <div class="auth-features"><div class="af"><span>🤝</span>Skill Swaps</div><div class="af"><span>🧠</span>AI Matching</div><div class="af"><span>🏆</span>Earn XP</div><div class="af"><span>🎓</span>Learn Free</div></div>
    </div></div>`;
}

function bindAuth() {
  document.querySelectorAll('.tab').forEach(t => { t.onclick = () => { document.querySelectorAll('.tab').forEach(x => x.classList.remove('active')); t.classList.add('active'); $('login-form').style.display = t.dataset.tab === 'login' ? 'flex' : 'none'; $('register-form').style.display = t.dataset.tab === 'register' ? 'flex' : 'none'; }; });
  $('login-form').onsubmit = async (e) => { e.preventDefault(); const d = await request('/auth/login', { method:'POST', body: JSON.stringify({ email: $('l-email').value, password: $('l-pass').value }) }); if (d?.token) { setToken(d.token); showToast('Welcome back!'); renderApp(); } };
  $('register-form').onsubmit = async (e) => { e.preventDefault(); const d = await request('/auth/register', { method:'POST', body: JSON.stringify({ name: $('r-name').value, email: $('r-email').value, password: $('r-pass').value, city: $('r-city').value, country: $('r-country').value, bio: $('r-bio').value }) }); if (d?.token) { setToken(d.token); showToast('Welcome to SkillBank!'); renderApp(); } };
}

// ==================== SHELL ====================
function renderShell() {
  return `<div class="app-shell">
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-header"><div class="logo"><span>🎓</span><h2>SkillBank</h2></div><button class="sb-toggle" id="sb-toggle">☰</button></div>
      <ul class="nav-list">
        <li class="nav-sec">Main</li>
        <li><a href="#" data-page="dashboard" class="nl active"><span class="ni">📊</span><span class="nt">Dashboard</span></a></li>
        <li><a href="#" data-page="my-skills" class="nl"><span class="ni">🎯</span><span class="nt">My Skills</span></a></li>
        <li><a href="#" data-page="browse" class="nl"><span class="ni">🔍</span><span class="nt">Browse Skills</span></a></li>
        <li class="nav-sec">Connect</li>
        <li><a href="#" data-page="matching" class="nl"><span class="ni">🧠</span><span class="nt">AI Matching</span></a></li>
        <li><a href="#" data-page="exchanges" class="nl"><span class="ni">🤝</span><span class="nt">Exchanges</span></a></li>
        <li><a href="#" data-page="messages" class="nl"><span class="ni">💬</span><span class="nt">Messages</span><span id="msg-badge" class="nav-badge" style="display:none">0</span></a></li>
        <li><a href="#" data-page="requests" class="nl"><span class="ni">📢</span><span class="nt">Skill Requests</span></a></li>
        <li class="nav-sec">Community</li>
        <li><a href="#" data-page="events" class="nl"><span class="ni">🎉</span><span class="nt">Events</span></a></li>
        <li><a href="#" data-page="leaderboard" class="nl"><span class="ni">🏆</span><span class="nt">Leaderboard</span></a></li>
        <li><a href="#" data-page="achievements" class="nl"><span class="ni">🏅</span><span class="nt">Achievements</span></a></li>
        <li class="nav-sec">Account</li>
        <li><a href="#" data-page="profile" class="nl"><span class="ni">👤</span><span class="nt">Profile</span></a></li>
        <li><a href="#" data-page="settings" class="nl"><span class="ni">⚙️</span><span class="nt">Settings</span></a></li>
      </ul>
      <div class="nav-footer"><button id="logout-btn" class="btn-logout">🚪 Sign Out</button></div>
    </nav>
    <main class="content" id="main-content"></main>
    <nav class="mobile-nav">
      <a href="#" data-page="dashboard" class="ml active"><span>📊</span><small>Home</small></a>
      <a href="#" data-page="my-skills" class="ml"><span>🎯</span><small>Skills</small></a>
      <a href="#" data-page="matching" class="ml"><span>🧠</span><small>Match</small></a>
      <a href="#" data-page="exchanges" class="ml"><span>🤝</span><small>Trade</small></a>
      <a href="#" data-page="messages" class="ml"><span>💬</span><small>Chat</small></a>
    </nav>
  </div>`;
}

function bindNav() {
  document.querySelectorAll('.nl, .ml').forEach(l => { l.onclick = (e) => { e.preventDefault(); navigateTo(l.dataset.page); }; });
  $('logout-btn').onclick = () => { token = null; localStorage.removeItem('skillbank_token'); showToast('Signed out'); renderApp(); };
  $('sb-toggle').onclick = () => $('sidebar').classList.toggle('collapsed');
  checkUnread();
}

async function checkUnread() {
  const d = await request('/messages/unread');
  if (d && d.count > 0) { const badge = $('msg-badge'); if (badge) { badge.textContent = d.count; badge.style.display = 'block'; } }
}

async function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nl, .ml').forEach(l => l.classList.toggle('active', l.dataset.page === page));
  const main = $('main-content');
  main.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  main.scrollTop = 0;

  switch (page) {
    case 'dashboard': await renderDashboard(main); break;
    case 'my-skills': await renderMySkills(main); break;
    case 'browse': await renderBrowse(main); break;
    case 'matching': await renderMatching(main); break;
    case 'exchanges': await renderExchanges(main); break;
    case 'messages': await renderMessages(main); break;
    case 'requests': await renderRequests(main); break;
    case 'events': await renderEvents(main); break;
    case 'leaderboard': await renderLeaderboard(main); break;
    case 'achievements': await renderAchievements(main); break;
    case 'profile': await renderProfile(main); break;
    case 'settings': await renderSettingsPage(main); break;
  }
  main.classList.add('page-enter');
  setTimeout(() => main.classList.remove('page-enter'), 300);
}

// ==================== DASHBOARD ====================
async function renderDashboard(c) {
  const d = await request('/dashboard');
  if (!d) return;
  const u = d.user;
  const xpForNext = ((u.level || 1)) * 100;
  const xpPct = Math.min(((u.xp || 0) % 100) / 100 * 100, 100);

  c.innerHTML = `<div class="page-header"><h1>Dashboard</h1><p class="page-sub">Welcome back, ${u.name}!</p></div>
    <div class="level-card glass"><div class="level-bar-header"><div class="level-info"><span class="level-badge">Lv.${u.level || 1}</span><span class="level-title">${getLevelTitle(u.level)}</span></div><span class="xp-text">${u.xp || 0} XP</span></div>
    <div class="progress-bar lg"><div class="progress-fill" style="width:${xpPct}%"></div></div></div>

    <div class="stats-grid">
      <div class="stat-card glass gradient-1"><div class="stat-icon">🎯</div><div class="stat-number">${d.stats.skills}</div><div class="stat-label">Skills</div></div>
      <div class="stat-card glass gradient-2"><div class="stat-icon">🤝</div><div class="stat-number">${d.stats.exchanges_completed}</div><div class="stat-label">Exchanges</div></div>
      <div class="stat-card glass gradient-3"><div class="stat-icon">⏰</div><div class="stat-number">${d.stats.teaching_hours}h</div><div class="stat-label">Teaching</div></div>
      <div class="stat-card glass gradient-4"><div class="stat-icon">⭐</div><div class="stat-number">${u.reputation || 0}</div><div class="stat-label">Reputation</div></div>
    </div>

    ${d.pending_exchanges.length > 0 ? `<div class="alert-banner"><span>📥</span><div><strong>${d.pending_exchanges.length} pending exchange request${d.pending_exchanges.length > 1 ? 's' : ''}</strong></div><button class="btn-sm" onclick="navigateTo('exchanges')">View</button></div>` : ''}
    ${d.unread_messages > 0 ? `<div class="alert-banner info"><span>💬</span><div><strong>${d.unread_messages} unread message${d.unread_messages > 1 ? 's' : ''}</strong></div><button class="btn-sm" onclick="navigateTo('messages')">Read</button></div>` : ''}

    <div class="dash-grid">
      <div class="dash-card glass"><div class="dch"><h3>🎯 My Skills</h3><a href="#" onclick="navigateTo('my-skills');return false" class="link-sm">Manage</a></div>
        <div class="skill-chips">${d.skills.length > 0 ? d.skills.map(s => `<div class="skill-chip"><span class="chip-level chip-${s.level}">${s.level[0].toUpperCase()}</span>${s.name}${s.endorsements ? `<span class="chip-endorse">+${s.endorsements}</span>` : ''}</div>`).join('') : '<p class="empty-sm">No skills added yet. <a href="#" onclick="navigateTo(\'my-skills\');return false">Add your first skill →</a></p>'}</div>
      </div>

      <div class="dash-card glass"><div class="dch"><h3>🤝 Recent Exchanges</h3></div>
        ${d.recent_exchanges.length > 0 ? d.recent_exchanges.map(e => `<div class="exchange-mini"><span class="status-dot ${e.status}"></span><div class="exchange-mini-info"><strong>${e.skill_name}</strong><span>${e.teacher_id === d.user.id ? `Teaching ${e.learner_name}` : `Learning from ${e.teacher_name}`}</span></div><span class="badge-${e.status}">${e.status}</span></div>`).join('') : '<p class="empty-sm">No exchanges yet.</p>'}
      </div>

      ${d.upcoming_events.length > 0 ? `<div class="dash-card glass"><div class="dch"><h3>🎉 Upcoming Events</h3></div>
        ${d.upcoming_events.map(e => `<div class="event-mini"><span class="event-date">${new Date(e.date).toLocaleDateString('en',{month:'short',day:'numeric'})}</span><div><strong>${e.title}</strong><span class="text-muted">${e.category} • ${(e.participants||[]).length}/${e.max_participants}</span></div></div>`).join('')}
      </div>` : ''}

      ${d.notifications.length > 0 ? `<div class="dash-card glass"><div class="dch"><h3>🔔 Notifications</h3></div>
        ${d.notifications.map(n => `<div class="notif-mini"><span>${n.type === 'exchange_request' ? '📥' : n.type === 'exchange_accepted' ? '✅' : '🔔'}</span><div><p>${n.message}</p><span class="text-muted">${timeAgo(n.created_at)}</span></div></div>`).join('')}
      </div>` : ''}
    </div>`;
}

function getLevelTitle(level) {
  const titles = { 1: 'Newcomer', 2: 'Learner', 3: 'Explorer', 4: 'Contributor', 5: 'Rising Star', 6: 'Specialist', 7: 'Expert', 8: 'Master', 9: 'Guru', 10: 'Legend' };
  return titles[Math.min(level || 1, 10)] || 'Legend';
}

// ==================== MY SKILLS ====================
async function renderMySkills(c) {
  const skills = await request('/skills');
  const categories = await request('/skills/categories');
  c.innerHTML = `<div class="page-header"><h1>🎯 My Skills</h1><p class="page-sub">Manage your skill portfolio</p></div>
    <div class="glass compact"><h3>Add New Skill</h3>
      <form id="skill-form">
        <div class="row2"><div class="fg"><label>Skill Name</label><input type="text" id="sk-name" placeholder="e.g., JavaScript" required /></div>
        <div class="fg"><label>Category</label><select id="sk-cat">${(categories || []).map(c => `<option>${c}</option>`).join('')}</select></div></div>
        <div class="row3"><div class="fg"><label>Level</label><select id="sk-level"><option value="beginner">Beginner</option><option value="intermediate" selected>Intermediate</option><option value="advanced">Advanced</option></select></div>
        <div class="fg"><label>Tags (comma-separated)</label><input type="text" id="sk-tags" placeholder="web, frontend" /></div>
        <div class="fg"><label>&nbsp;</label><button type="button" id="ai-desc-btn" class="btn-outline btn-sm">🧠 AI Description</button></div></div>
        <div class="fg"><label>Description</label><textarea id="sk-desc" placeholder="Describe your skills..." rows="2"></textarea></div>
        <div id="ai-desc-result"></div>
        <button type="submit" class="btn-primary">Add Skill</button>
      </form>
    </div>
    <div class="skills-grid mt-16">${skills?.map(s => renderSkillCard(s)).join('') || '<p class="empty-state">No skills yet. Add your first skill above!</p>'}</div>`;

  $('skill-form').onsubmit = async (e) => {
    e.preventDefault();
    const tags = $('sk-tags').value ? $('sk-tags').value.split(',').map(t => t.trim()) : [];
    const result = await request('/skills', { method: 'POST', body: JSON.stringify({ name: $('sk-name').value, description: $('sk-desc').value, category: $('sk-cat').value, level: $('sk-level').value, tags }) });
    if (result) { showToast('Skill added!'); renderMySkills(c); }
  };

  $('ai-desc-btn').onclick = async () => {
    $('ai-desc-result').innerHTML = '<div class="loading-sm"><div class="spinner-sm"></div> Generating description...</div>';
    const result = await request('/skills/ai-description', { method: 'POST', body: JSON.stringify({ name: $('sk-name').value || 'General', level: $('sk-level').value }) });
    if (result) {
      $('sk-desc').value = result.description;
      $('ai-desc-result').innerHTML = `<div class="ai-suggestion glass"><p>📖 Teaching approach: ${result.teaching_approach}</p><p>🎯 Ideal student: ${result.ideal_student}</p></div>`;
    }
  };
}

function renderSkillCard(s) {
  return `<div class="skill-card glass">
    <div class="skill-card-header"><h3>${s.name}</h3><div class="skill-actions"><button class="btn-icon" onclick="editSkill(${s.id})">✏️</button><button class="btn-icon" onclick="deleteSkill(${s.id})">🗑️</button></div></div>
    <div class="skill-meta"><span class="badge badge-${s.level}">${s.level}</span><span class="badge badge-cat">${s.category}</span></div>
    <p class="desc">${s.description || 'No description'}</p>
    ${s.tags?.length > 0 ? `<div class="tag-chips">${s.tags.map(t => `<span class="tag-chip">${t}</span>`).join('')}</div>` : ''}
    <div class="skill-stats"><span>👍 ${s.endorsements || 0} endorsements</span><span>⭐ ${s.rating_avg || 0}/5 (${s.rating_count || 0})</span><span>🤝 ${s.exchange_count || 0} exchanges</span></div>
    ${s.portfolio_items?.length > 0 ? `<div class="portfolio-mini"><h4>Portfolio</h4>${s.portfolio_items.map(p => `<a href="${p.url || '#'}" class="portfolio-link">${p.title}</a>`).join('')}</div>` : ''}
    <div class="skill-card-actions"><button class="btn-sm btn-outline" onclick="addPortfolio(${s.id})">📂 Add Portfolio</button><button class="btn-sm btn-outline" onclick="getLearningPath('${s.name}','${s.level}')">📚 Learning Path</button></div>
  </div>`;
}

async function deleteSkill(id) { await request(`/skills/${id}`, { method: 'DELETE' }); showToast('Skill removed'); navigateTo('my-skills'); }

async function editSkill(id) {
  const skills = await request('/skills');
  const s = skills?.find(sk => sk.id === id);
  if (!s) return;
  const modal = showModal('Edit Skill', `<form id="edit-skill-form">
    <div class="fg"><label>Name</label><input type="text" id="es-name" value="${s.name}" required /></div>
    <div class="fg"><label>Description</label><textarea id="es-desc" rows="2">${s.description || ''}</textarea></div>
    <div class="fg"><label>Level</label><select id="es-level"><option ${s.level==='beginner'?'selected':''}>beginner</option><option ${s.level==='intermediate'?'selected':''}>intermediate</option><option ${s.level==='advanced'?'selected':''}>advanced</option></select></div>
    <button type="submit" class="btn-primary">Save Changes</button></form>`);
  setTimeout(() => { $('edit-skill-form').onsubmit = async (e) => { e.preventDefault(); await request(`/skills/${id}`, { method: 'PUT', body: JSON.stringify({ name: $('es-name').value, description: $('es-desc').value, level: $('es-level').value, category: s.category, tags: s.tags }) }); showToast('Skill updated!'); modal.remove(); navigateTo('my-skills'); }; }, 50);
}

function addPortfolio(skillId) {
  const modal = showModal('Add Portfolio Item', `<form id="pf-form">
    <div class="fg"><label>Title</label><input type="text" id="pf-title" required /></div>
    <div class="fg"><label>Description</label><input type="text" id="pf-desc" /></div>
    <div class="fg"><label>URL</label><input type="url" id="pf-url" placeholder="https://" /></div>
    <button type="submit" class="btn-primary">Add</button></form>`);
  setTimeout(() => { $('pf-form').onsubmit = async (e) => { e.preventDefault(); await request(`/skills/${skillId}/portfolio`, { method: 'POST', body: JSON.stringify({ title: $('pf-title').value, description: $('pf-desc').value, url: $('pf-url').value }) }); showToast('Portfolio item added!'); modal.remove(); navigateTo('my-skills'); }; }, 50);
}

async function getLearningPath(skillName, level) {
  const modal = showModal('📚 Learning Path', '<div class="loading"><div class="spinner"></div><p>🧠 Generating learning path...</p></div>');
  const result = await request('/skills/learning-path', { method: 'POST', body: JSON.stringify({ skill_name: skillName, current_level: level }) });
  if (result) {
    modal.querySelector('.modal-body').innerHTML = `<div class="learning-path">
      <p class="text-muted">Estimated time: ${result.estimated_total_time} • Prerequisites: ${result.prerequisites}</p>
      <div class="path-steps">${(result.steps || []).map((s, i) => `<div class="path-step"><div class="step-number">${i + 1}</div><div class="step-content"><h4>${s.title}</h4><p>${s.description}</p><span class="text-muted">⏰ ${s.duration}</span><div class="step-resources">${(s.resources || []).map(r => `<span class="tag-chip">${r}</span>`).join('')}</div></div></div>`).join('')}</div>
    </div>`;
  }
}

// ==================== BROWSE SKILLS ====================
async function renderBrowse(c) {
  const categories = await request('/skills/categories');
  c.innerHTML = `<div class="page-header"><h1>🔍 Browse Skills</h1><p class="page-sub">Find skills to learn from the community</p></div>
    <div class="search-panel glass">
      <div class="search-main"><input type="text" id="browse-q" placeholder="Search skills..." class="search-input-lg" /><button id="browse-btn" class="btn-primary">Search</button></div>
      <div class="search-filters"><select id="browse-cat"><option value="">All Categories</option>${(categories || []).map(c => `<option>${c}</option>`).join('')}</select><select id="browse-level"><option value="">All Levels</option><option>beginner</option><option>intermediate</option><option>advanced</option></select></div>
    </div>
    <div id="browse-results"></div>
    <div class="section"><div class="sec-header"><h2>📢 Community Skill Requests</h2></div><div id="community-requests"></div></div>`;

  async function searchSkills() {
    const results = await request(`/skills/browse?q=${$('browse-q').value}&category=${$('browse-cat').value}&level=${$('browse-level').value}`);
    if (results?.length > 0) {
      $('browse-results').innerHTML = `<div class="results-grid">${results.map(s => `
        <div class="browse-card glass"><div class="browse-top"><div class="browse-avatar" style="background:${s.avatar_color || 'var(--primary)'}">${(s.user_name || '?')[0]}</div>
        <div><strong>${s.name}</strong><span class="text-muted">by ${s.user_name}</span></div><span class="badge badge-${s.level}">${s.level}</span></div>
        <p class="desc">${s.description || 'No description'}</p>
        <div class="browse-meta"><span class="badge badge-cat">${s.category}</span><span>👍 ${s.endorsements || 0}</span><span>⭐ ${s.rating_avg || 0}</span></div>
        ${s.tags?.length > 0 ? `<div class="tag-chips">${s.tags.slice(0,5).map(t => `<span class="tag-chip">${t}</span>`).join('')}</div>` : ''}
        <div class="browse-actions"><button class="btn-sm btn-primary" onclick="requestExchange(${s.id}, ${s.user_id}, '${s.name.replace(/'/g,"\\'")}')">🤝 Request Exchange</button><button class="btn-sm btn-outline" onclick="endorseSkill(${s.id})">👍 Endorse</button></div>
      </div>`).join('')}</div>`;
    } else { $('browse-results').innerHTML = '<p class="empty-state">No skills found. Try different keywords.</p>'; }
  }

  $('browse-btn').onclick = searchSkills;
  $('browse-q').onkeyup = (e) => { if (e.key === 'Enter') searchSkills(); };
  $('browse-cat').onchange = searchSkills;
  $('browse-level').onchange = searchSkills;

  // Load all by default
  searchSkills();

  const reqs = await request('/requests');
  if (reqs?.length > 0) {
    $('community-requests').innerHTML = reqs.slice(0, 5).map(r => `<div class="request-card glass"><div class="req-top"><strong>${r.skill_name}</strong><span class="badge badge-${r.urgency || 'normal'}">${r.urgency || 'normal'}</span></div><p class="text-muted">${r.description || ''}</p><div class="req-meta"><span>by ${r.user_name}</span><span>${r.responses || 0} responses</span></div></div>`).join('');
  }
}

async function requestExchange(skillId, teacherId, skillName) {
  const modal = showModal('🤝 Request Skill Exchange', `<form id="req-exchange-form">
    <p>You want to learn: <strong>${skillName}</strong></p>
    <div class="fg"><label>What skill can you offer in return?</label><input type="text" id="re-offer" placeholder="e.g., I can teach Python" /></div>
    <div class="fg"><label>Preferred date</label><input type="date" id="re-date" /></div>
    <div class="fg"><label>Notes</label><textarea id="re-notes" placeholder="Any message..." rows="2"></textarea></div>
    <button type="submit" class="btn-primary">Send Request</button></form>`);
  setTimeout(() => { $('req-exchange-form').onsubmit = async (e) => { e.preventDefault(); await request('/exchanges', { method: 'POST', body: JSON.stringify({ skill_id: skillId, teacher_id: teacherId, skill_offered: $('re-offer').value, notes: $('re-notes').value, scheduled_date: $('re-date').value }) }); showToast('Exchange request sent!'); modal.remove(); }; }, 50);
}

async function endorseSkill(id) { const r = await request(`/skills/${id}/endorse`, { method: 'POST' }); if (r) showToast(`Endorsed! (${r.endorsements} total)`); }

// ==================== AI MATCHING ====================
async function renderMatching(c) {
  c.innerHTML = `<div class="page-header"><h1>🧠 AI Skill Matching</h1><p class="page-sub">Find your perfect skill exchange partners</p></div>
    <div class="glass"><button id="find-matches-btn" class="btn-primary btn-glow btn-lg">🧠 Find My Best Matches</button></div>
    <div id="match-results" class="mt-16"></div>`;

  $('find-matches-btn').onclick = async () => {
    $('match-results').innerHTML = '<div class="loading"><div class="spinner"></div><p>🧠 AI is finding your perfect matches...</p></div>';
    const result = await request('/match');
    if (result?.matches?.length > 0) {
      $('match-results').innerHTML = `<h2>🎯 ${result.matches.length} Matches Found</h2>
        <div class="matches-grid">${result.matches.map(m => `
          <div class="match-card glass">
            <div class="match-score-circle"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="var(--border)" stroke-width="6"/><circle cx="50" cy="50" r="45" fill="none" stroke="${m.match_score > 70 ? 'var(--success)' : m.match_score > 40 ? 'var(--primary)' : 'var(--warning)'}" stroke-width="6" stroke-dasharray="${m.match_score * 2.83} 283" stroke-linecap="round" transform="rotate(-90 50 50)"/><text x="50" y="55" text-anchor="middle" fill="var(--text)" font-size="18" font-weight="700">${m.match_score}%</text></svg></div>
            <div class="match-info"><strong>${m.user_name || 'User'}</strong><p class="text-muted">${m.reason}</p><span class="badge badge-cat">${m.category || m.their_skill}</span></div>
            <div class="match-actions"><button class="btn-sm btn-primary" onclick="requestExchange(0, ${m.user_id}, '${(m.their_skill||'').replace(/'/g,"\\'")}')">🤝 Connect</button></div>
          </div>
        `).join('')}</div>`;
    } else { $('match-results').innerHTML = '<p class="empty-state">No matches found. Add more skills to improve matching!</p>'; }
  };
}

// ==================== EXCHANGES ====================
async function renderExchanges(c) {
  const exchanges = await request('/exchanges');
  const pending = (exchanges || []).filter(e => e.status === 'pending');
  const active = (exchanges || []).filter(e => e.status === 'accepted');
  const completed = (exchanges || []).filter(e => e.status === 'completed');

  c.innerHTML = `<div class="page-header"><h1>🤝 Exchanges</h1><p class="page-sub">Manage your skill exchange sessions</p></div>
    <div class="exchange-tabs"><button class="etab active" data-tab="pending">Pending (${pending.length})</button><button class="etab" data-tab="active">Active (${active.length})</button><button class="etab" data-tab="completed">Completed (${completed.length})</button></div>
    <div id="exchange-pending" class="exchange-list">${pending.length > 0 ? pending.map(e => renderExchangeCard(e, 'pending')).join('') : '<p class="empty-state">No pending exchanges.</p>'}</div>
    <div id="exchange-active" class="exchange-list" style="display:none">${active.length > 0 ? active.map(e => renderExchangeCard(e, 'active')).join('') : '<p class="empty-state">No active exchanges.</p>'}</div>
    <div id="exchange-completed" class="exchange-list" style="display:none">${completed.length > 0 ? completed.map(e => renderExchangeCard(e, 'completed')).join('') : '<p class="empty-state">No completed exchanges.</p>'}</div>`;

  document.querySelectorAll('.etab').forEach(tab => {
    tab.onclick = () => { document.querySelectorAll('.etab').forEach(t => t.classList.remove('active')); tab.classList.add('active');
      ['pending','active','completed'].forEach(t => { const el = $(`exchange-${t}`); el.style.display = t === tab.dataset.tab ? 'block' : 'none'; }); };
  });
}

function renderExchangeCard(e, type) {
  return `<div class="exchange-card glass">
    <div class="exchange-header"><div class="exchange-skill"><h3>${e.skill_name}</h3><span class="badge badge-${e.status}">${e.status}</span></div>
    <span class="text-muted">${formatDate(e.created_at)}</span></div>
    <div class="exchange-people"><div class="exchange-person"><span>🎓</span><div><small>Teacher</small><strong>${e.teacher_name}</strong></div></div><span class="exchange-arrow">⇄</span><div class="exchange-person"><span>📖</span><div><small>Learner</small><strong>${e.learner_name}</strong></div></div></div>
    ${e.skill_offered ? `<p class="text-muted">Offered: ${e.skill_offered}</p>` : ''}
    ${e.notes ? `<p class="text-muted">${e.notes}</p>` : ''}
    ${e.scheduled_date ? `<p>📅 Scheduled: ${formatDate(e.scheduled_date)}</p>` : ''}
    <div class="exchange-actions">
      ${type === 'pending' ? `<button class="btn-sm btn-primary" onclick="acceptExchange(${e.id})">✓ Accept</button><button class="btn-sm btn-outline" onclick="declineExchange(${e.id})">✕ Decline</button>` : ''}
      ${type === 'active' ? `<button class="btn-sm btn-primary" onclick="completeExchange(${e.id})">✓ Complete</button><button class="btn-sm btn-outline" onclick="sendMessage(${e.teacher_id === req?.userId ? e.learner_id : e.teacher_id})">💬 Message</button>` : ''}
      ${type === 'completed' && e.rating ? `<div class="rating-display">${'⭐'.repeat(e.rating)} ${e.review || ''}</div>` : ''}
    </div>
  </div>`;
}

async function acceptExchange(id) { await request(`/exchanges/${id}/accept`, { method: 'PATCH' }); showToast('Exchange accepted!'); navigateTo('exchanges'); }
async function declineExchange(id) { await request(`/exchanges/${id}/decline`, { method: 'PATCH' }); showToast('Exchange declined'); navigateTo('exchanges'); }

async function completeExchange(id) {
  const modal = showModal('Complete Exchange', `<form id="complete-form">
    <div class="fg"><label>Rating (1-5)</label><div class="star-rating" id="star-rate">${[1,2,3,4,5].map(i => `<span class="star" data-val="${i}" onclick="document.getElementById('cp-rating').value=${i};document.querySelectorAll('.star').forEach((s,j)=>s.classList.toggle('active',j<${i}))">⭐</span>`).join('')}</div><input type="hidden" id="cp-rating" value="5" /></div>
    <div class="fg"><label>Review</label><textarea id="cp-review" placeholder="How was the session?" rows="2"></textarea></div>
    <div class="fg"><label>Duration (hours)</label><input type="number" id="cp-hours" value="1" step="0.5" min="0.5" /></div>
    <button type="submit" class="btn-primary">Complete & Rate</button></form>`);
  setTimeout(() => { $('complete-form').onsubmit = async (e) => { e.preventDefault(); await request(`/exchanges/${id}/complete`, { method:'PATCH', body: JSON.stringify({ rating: parseInt($('cp-rating').value), review: $('cp-review').value, duration_hours: parseFloat($('cp-hours').value) }) }); showToast('Exchange completed! XP earned!'); modal.remove(); navigateTo('exchanges'); }; }, 50);
}

// ==================== MESSAGES ====================
async function renderMessages(c) {
  const convos = await request('/messages');
  c.innerHTML = `<div class="page-header"><h1>💬 Messages</h1></div>
    <div class="messages-layout">
      <div class="convo-list glass">${convos?.length > 0 ? convos.map(cv => `
        <div class="convo-item ${cv.unread > 0 ? 'unread' : ''}" onclick="openConvo(${cv.partner_id}, '${(cv.partner_name||'').replace(/'/g,"\\'")}', this)">
          <div class="convo-avatar" style="background:hsl(${cv.partner_id * 50}, 70%, 50%)">${(cv.partner_name||'?')[0]}</div>
          <div class="convo-info"><strong>${cv.partner_name}</strong><p class="last-msg">${cv.messages[cv.messages.length-1]?.content?.substring(0,40) || ''}...</p></div>
          ${cv.unread > 0 ? `<span class="unread-badge">${cv.unread}</span>` : ''}
        </div>`).join('') : '<p class="empty-sm">No conversations yet.</p>'}
      </div>
      <div class="chat-area glass" id="chat-area"><p class="empty-state">Select a conversation</p></div>
    </div>`;
}

async function openConvo(partnerId, partnerName, el) {
  document.querySelectorAll('.convo-item').forEach(c => c.classList.remove('selected'));
  if (el) el.classList.add('selected');
  await request(`/messages/read/${partnerId}`, { method: 'PATCH' });
  const convos = await request('/messages');
  const convo = convos?.find(c => c.partner_id === partnerId);
  const msgs = convo?.messages || [];

  $('chat-area').innerHTML = `<div class="chat-header"><strong>${partnerName}</strong></div>
    <div class="chat-messages" id="chat-msgs">${msgs.map(m => `
      <div class="chat-msg ${m.from_id === partnerId ? 'received' : 'sent'}"><p>${m.content}</p><small>${timeAgo(m.created_at)}</small></div>
    `).join('')}</div>
    <form class="chat-input" id="chat-form"><input type="text" id="chat-text" placeholder="Type a message..." required /><button type="submit" class="btn-primary btn-sm">Send</button></form>`;

  const msgArea = $('chat-msgs');
  msgArea.scrollTop = msgArea.scrollHeight;

  $('chat-form').onsubmit = async (e) => {
    e.preventDefault();
    await request('/messages', { method: 'POST', body: JSON.stringify({ to_id: partnerId, content: $('chat-text').value }) });
    $('chat-text').value = '';
    openConvo(partnerId, partnerName, el);
  };
}

// ==================== SKILL REQUESTS ====================
async function renderRequests(c) {
  const requests = await request('/requests');
  c.innerHTML = `<div class="page-header"><h1>📢 Skill Requests</h1><p class="page-sub">Find what the community needs or ask for help</p></div>
    <div class="glass compact"><h3>Post a Request</h3>
      <form id="req-form" class="inline-form"><input type="text" id="rq-name" placeholder="Skill needed" required /><input type="text" id="rq-desc" placeholder="Description" /><select id="rq-urgency"><option value="normal">Normal</option><option value="urgent">Urgent</option><option value="casual">Casual</option></select><button type="submit" class="btn-primary">Post</button></form>
    </div>
    <div class="requests-grid mt-16">${requests?.map(r => `
      <div class="request-card glass"><div class="req-header"><h3>${r.skill_name}</h3><span class="badge badge-${r.urgency}">${r.urgency}</span></div>
      <p>${r.description || ''}</p><div class="req-footer"><span>by ${r.user_name}</span><span>${r.responses || 0} responses</span><span class="text-muted">${r.status}</span></div>
      <button class="btn-sm btn-primary mt-8" onclick="respondToRequest(${r.id}, '${(r.skill_name||'').replace(/'/g,"\\'")}')">💬 I Can Help</button></div>
    `).join('') || '<p class="empty-state">No requests yet.</p>'}</div>`;

  $('req-form').onsubmit = async (e) => { e.preventDefault(); await request('/requests', { method:'POST', body: JSON.stringify({ skill_name: $('rq-name').value, description: $('rq-desc').value, urgency: $('rq-urgency').value }) }); showToast('Request posted!'); renderRequests(c); };
}

async function respondToRequest(id, skillName) {
  const modal = showModal('Respond', `<form id="respond-form"><div class="fg"><label>Message</label><textarea id="resp-msg" rows="2">I can help with ${skillName}!</textarea></div><button type="submit" class="btn-primary">Send</button></form>`);
  setTimeout(() => { $('respond-form').onsubmit = async (e) => { e.preventDefault(); await request(`/requests/${id}/respond`, { method:'POST', body: JSON.stringify({ message: $('resp-msg').value }) }); showToast('Response sent!'); modal.remove(); }; }, 50);
}

// ==================== EVENTS ====================
async function renderEvents(c) {
  const events = await request('/events');
  const upcoming = (events || []).filter(e => new Date(e.date) > new Date());
  const past = (events || []).filter(e => new Date(e.date) <= new Date());

  c.innerHTML = `<div class="page-header"><h1>🎉 Community Events</h1><p class="page-sub">Workshops, sessions, and group learning</p></div>
    <div class="glass compact"><h3>Host an Event</h3>
      <form id="event-form">
        <div class="row2"><div class="fg"><label>Title</label><input type="text" id="ev-title" placeholder="Event title" required /></div><div class="fg"><label>Category</label><select id="ev-cat"><option>Technology</option><option>Creative Arts</option><option>Languages</option><option>Business</option><option>Health & Fitness</option><option>Other</option></select></div></div>
        <div class="row3"><div class="fg"><label>Date & Time</label><input type="datetime-local" id="ev-date" required /></div><div class="fg"><label>Duration</label><input type="text" id="ev-dur" placeholder="1 hour" value="1 hour" /></div><div class="fg"><label>Max People</label><input type="number" id="ev-max" value="10" min="2" /></div></div>
        <div class="fg"><label>Description</label><textarea id="ev-desc" rows="2" placeholder="What will be covered?"></textarea></div>
        <div class="row2"><div class="fg"><label>Type</label><select id="ev-type"><option value="workshop">Workshop</option><option value="study_group">Study Group</option><option value="mentoring">Mentoring</option><option value="hackathon">Hackathon</option></select></div><div class="fg"><label>Level</label><select id="ev-level"><option value="all">All Levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div></div>
        <button type="submit" class="btn-primary">Create Event</button>
      </form>
    </div>
    <h2 class="mt-24">📅 Upcoming Events</h2>
    <div class="events-grid mt-16">${upcoming.length > 0 ? upcoming.map(e => renderEventCard(e)).join('') : '<p class="empty-state">No upcoming events.</p>'}</div>
    ${past.length > 0 ? `<h2 class="mt-24">📜 Past Events</h2><div class="events-grid mt-16">${past.map(e => renderEventCard(e)).join('')}</div>` : ''}`;

  $('event-form').onsubmit = async (e) => { e.preventDefault(); await request('/events', { method:'POST', body: JSON.stringify({ title: $('ev-title').value, description: $('ev-desc').value, category: $('ev-cat').value, date: $('ev-date').value, duration: $('ev-dur').value, max_participants: parseInt($('ev-max').value), event_type: $('ev-type').value, skill_level: $('ev-level').value }) }); showToast('Event created!'); renderEvents(c); };
}

function renderEventCard(e) {
  const isFull = (e.participants || []).length >= e.max_participants;
  return `<div class="event-card glass"><div class="event-top"><div class="event-date-box"><span class="event-month">${new Date(e.date).toLocaleDateString('en',{month:'short'})}</span><span class="event-day">${new Date(e.date).getDate()}</span></div>
    <div class="event-info"><h3>${e.title}</h3><div class="event-meta"><span class="badge badge-cat">${e.category}</span><span class="badge">${e.event_type}</span><span>${e.skill_level}</span></div><p class="text-muted">${e.description || ''}</p></div></div>
    <div class="event-bottom"><span>👥 ${(e.participants||[]).length}/${e.max_participants}</span><span>⏰ ${e.duration}</span><span>by ${e.host_name}</span>
    ${!isFull ? `<button class="btn-sm btn-primary" onclick="joinEvent(${e.id})">Join</button>` : '<span class="badge">Full</span>'}</div></div>`;
}

async function joinEvent(id) { const r = await request(`/events/${id}/join`, { method:'POST' }); if (r) { showToast('Joined event!'); navigateTo('events'); } }

// ==================== LEADERBOARD ====================
async function renderLeaderboard(c) {
  const leaders = await request('/leaderboard');
  c.innerHTML = `<div class="page-header"><h1>🏆 Leaderboard</h1><p class="page-sub">Top skill exchangers in the community</p></div>
    <div class="leaderboard-list">${leaders?.map((l, i) => `
      <div class="leader-row glass ${i < 3 ? 'top-' + (i+1) : ''}">
        <span class="rank">${i < 3 ? ['🥇','🥈','🥉'][i] : '#'+(i+1)}</span>
        <div class="leader-avatar" style="background:${l.avatar_color || 'var(--primary)'}">${(l.name||'?')[0]}</div>
        <div class="leader-info"><strong>${l.name}</strong><span class="text-muted">Lv.${l.level} • ${l.city || 'Remote'}</span></div>
        <div class="leader-stats"><span>${l.xp} XP</span><span>${l.skill_count} skills</span><span>⭐ ${l.reputation}</span></div>
      </div>
    `).join('') || '<p class="empty-state">No users yet.</p>'}</div>`;
}

// ==================== ACHIEVEMENTS ====================
async function renderAchievements(c) {
  const data = await request('/achievements');
  if (!data) return;
  c.innerHTML = `<div class="page-header"><h1>🏅 Achievements</h1><p class="page-sub">${data.total_earned}/${data.total} badges earned</p></div>
    <div class="progress-bar lg mb-16"><div class="progress-fill" style="width:${(data.total_earned/data.total*100)}%"></div></div>
    <div class="badges-grid">${data.badges.map(b => `
      <div class="badge-card glass ${b.earned ? 'earned' : 'locked'}">
        <div class="badge-icon">${b.icon}</div><h3>${b.name}</h3><p class="text-muted">${b.desc}</p>
        ${b.earned ? '<span class="badge-earned">✓ Earned</span>' : '<span class="badge-locked">🔒 Locked</span>'}
      </div>
    `).join('')}</div>`;
}

// ==================== PROFILE ====================
async function renderProfile(c) {
  const user = await request('/auth/me');
  if (!user) return;
  c.innerHTML = `<div class="page-header"><h1>👤 Profile</h1></div>
    <div class="profile-card glass">
      <div class="profile-header"><div class="profile-avatar" style="background:${user.avatar_color || 'var(--primary)'}">${(user.name||'?')[0]}</div>
        <div><h2>${user.name}</h2><span class="text-muted">${user.email}</span><p>${user.bio || ''}</p><p class="text-muted">📍 ${user.city || ''}${user.country ? ', '+user.country : ''}</p></div></div>
      <div class="profile-stats">
        <div class="pstat"><span class="pstat-value">Lv.${user.level || 1}</span><span class="pstat-label">Level</span></div>
        <div class="pstat"><span class="pstat-value">${user.xp || 0}</span><span class="pstat-label">XP</span></div>
        <div class="pstat"><span class="pstat-value">⭐ ${user.reputation || 0}</span><span class="pstat-label">Reputation</span></div>
        <div class="pstat"><span class="pstat-value">${user.skill_count || 0}</span><span class="pstat-label">Skills</span></div>
        <div class="pstat"><span class="pstat-value">${user.exchange_count || 0}</span><span class="pstat-label">Exchanges</span></div>
        <div class="pstat"><span class="pstat-value">${user.teaching_hours || 0}h</span><span class="pstat-label">Teaching</span></div>
      </div>
    </div>
    <div class="glass mt-16"><h3>Edit Profile</h3>
      <form id="profile-form">
        <div class="row2"><div class="fg"><label>Name</label><input type="text" id="pf-name" value="${user.name||''}" /></div><div class="fg"><label>City</label><input type="text" id="pf-city" value="${user.city||''}" /></div></div>
        <div class="row2"><div class="fg"><label>Country</label><input type="text" id="pf-country" value="${user.country||''}" /></div><div class="fg"><label>Bio</label><input type="text" id="pf-bio" value="${user.bio||''}" /></div></div>
        <button type="submit" class="btn-primary">Save</button>
      </form>
    </div>`;
  $('profile-form').onsubmit = async (e) => { e.preventDefault(); await request('/auth/profile', { method:'PATCH', body: JSON.stringify({ name: $('pf-name').value, city: $('pf-city').value, country: $('pf-country').value, bio: $('pf-bio').value }) }); showToast('Profile updated!'); };
}

// ==================== SETTINGS ====================
async function renderSettingsPage(c) {
  c.innerHTML = `<div class="page-header"><h1>⚙️ Settings</h1></div>
    <div class="settings-list">
      <div class="glass"><h3>🎨 Theme</h3><select id="theme-sel" onchange="toggleTheme(this.value)"><option value="dark">Dark</option><option value="light">Light</option></select></div>
      <div class="glass"><h3>📤 Export Data</h3><p class="text-muted">Download your skills and exchange history.</p><button class="btn-outline mt-8" onclick="exportData()">📤 Export JSON</button></div>
      <div class="glass"><h3>💬 Feedback</h3><form id="fb-form"><select id="fb-type"><option value="bug">🐛 Bug</option><option value="feature">💡 Feature</option><option value="general">💬 General</option></select><textarea id="fb-msg" rows="2" placeholder="Your feedback..." required></textarea><button type="submit" class="btn-primary mt-8">Send</button></form></div>
      <div class="glass"><h3>ℹ️ About</h3><p><strong>SkillBank</strong> v2.0 — AI-Powered Skill Exchange Network</p></div>
    </div>`;
  $('fb-form').onsubmit = async (e) => { e.preventDefault(); await request('/feedback', { method:'POST', body: JSON.stringify({ type: $('fb-type').value, message: $('fb-msg').value }) }); showToast('Thanks!'); e.target.reset(); };
}

async function exportData() { const d = await request('/export'); if (d) { const b = new Blob([JSON.stringify(d,null,2)], {type:'application/json'}); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'skillbank_export.json'; a.click(); showToast('Data exported!'); } }
function toggleTheme(t) { document.body.classList.toggle('light-theme', t === 'light'); localStorage.setItem('skillbank_theme', t); }

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', e => {
  if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) || !token) return;
  const map = { d: 'dashboard', s: 'my-skills', b: 'browse', m: 'matching', e: 'exchanges', c: 'messages' };
  if (map[e.key]) { e.preventDefault(); navigateTo(map[e.key]); }
});

// ==================== STYLES ====================
const style = document.createElement('style');
style.textContent = `
:root { --bg: #0c0a1a; --card: #1a1730; --card-hover: #231f40; --input-bg: #0c0a1a; --text: #e2e8f0; --text-muted: #94a3b8; --text-dim: #64748b; --border: #2d2850; --primary: #8b5cf6; --primary-hover: #7c3aed; --primary-light: #8b5cf620; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; --r: 12px; --r-sm: 8px; }
body.light-theme { --bg: #f5f3ff; --card: #fff; --card-hover: #faf5ff; --input-bg: #f5f3ff; --text: #1e1b4b; --text-muted: #6b7280; --text-dim: #9ca3af; --border: #e5e7eb; --primary-light: #8b5cf615; }
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: 'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background: var(--bg); color: var(--text); line-height:1.5; }
::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius:3px; }

.auth-container { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:20px; position:relative; overflow:hidden; }
.auth-shapes { position:absolute; inset:0; } .shape { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.15; animation:float 20s infinite; }
.s1 { width:400px; height:400px; background:var(--primary); top:-100px; right:-100px; }
.s2 { width:300px; height:300px; background:#ec4899; bottom:-50px; left:-50px; animation-delay:7s; }
.s3 { width:200px; height:200px; background:var(--success); top:50%; left:50%; animation-delay:14s; }
@keyframes float { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-30px) scale(1.1)} 66%{transform:translate(-20px,20px) scale(0.9)} }
.auth-card { background:rgba(26,23,48,0.9); backdrop-filter:blur(20px); border:1px solid var(--border); border-radius:20px; padding:40px; width:100%; max-width:440px; z-index:1; }
.auth-logo { text-align:center; margin-bottom:24px; }
.logo-icon { font-size:3rem; }
.auth-logo h1 { font-size:2rem; background:linear-gradient(135deg,var(--primary),#ec4899); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.auth-logo p { color:var(--text-muted); font-size:14px; }
.tabs { display:flex; gap:4px; background:var(--input-bg); border-radius:var(--r-sm); padding:4px; margin-bottom:20px; }
.tab { flex:1; padding:10px; background:transparent; border:none; color:var(--text-muted); border-radius:6px; cursor:pointer; font-size:14px; font-weight:500; transition:.2s; }
.tab.active { background:var(--primary); color:white; }
form { display:flex; flex-direction:column; gap:12px; }
.ig { position:relative; display:flex; align-items:center; }
.ii { position:absolute; left:12px; z-index:1; }
.ig input { padding-left:40px; }
input, select, textarea { width:100%; padding:12px 16px; background:var(--input-bg); border:1px solid var(--border); border-radius:var(--r-sm); color:var(--text); font-size:14px; outline:none; transition:.2s; }
input:focus, select:focus, textarea:focus { border-color:var(--primary); box-shadow:0 0 0 3px var(--primary-light); }
.row2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.row3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
.btn-primary { padding:12px 24px; background:var(--primary); color:white; border:none; border-radius:var(--r-sm); cursor:pointer; font-size:14px; font-weight:600; transition:.2s; }
.btn-primary:hover { background:var(--primary-hover); transform:translateY(-1px); }
.btn-primary:disabled { opacity:.6; }
.btn-glow { box-shadow:0 4px 15px var(--primary-light); }
.btn-outline { padding:10px 20px; background:transparent; border:1px solid var(--border); color:var(--text); border-radius:var(--r-sm); cursor:pointer; transition:.2s; }
.btn-outline:hover { border-color:var(--primary); color:var(--primary); }
.btn-sm { padding:6px 14px; font-size:12px; border-radius:6px; }
.btn-lg { padding:16px; font-size:16px; width:100%; }
.btn-icon { background:none; border:none; cursor:pointer; font-size:14px; opacity:.5; transition:.2s; }
.btn-icon:hover { opacity:1; }
.btn-logout { width:100%; padding:10px; background:transparent; border:1px solid var(--border); color:var(--text-muted); border-radius:var(--r-sm); cursor:pointer; }
.error { color:var(--danger); text-align:center; margin-top:12px; }
.auth-features { display:flex; justify-content:center; gap:12px; margin-top:24px; flex-wrap:wrap; }
.af { display:flex; align-items:center; gap:6px; padding:6px 12px; background:var(--primary-light); border-radius:20px; font-size:12px; color:var(--text-muted); }

.app-shell { display:flex; min-height:100vh; }
.sidebar { width:260px; background:var(--card); position:fixed; height:100vh; border-right:1px solid var(--border); display:flex; flex-direction:column; z-index:50; overflow-y:auto; transition:.3s; }
.sidebar.collapsed { width:70px; }
.sidebar.collapsed .nt, .sidebar.collapsed .nav-sec, .sidebar.collapsed h2, .sidebar.collapsed .btn-logout { display:none; }
.sidebar-header { display:flex; align-items:center; justify-content:space-between; padding:20px 16px; border-bottom:1px solid var(--border); }
.logo { display:flex; align-items:center; gap:10px; }
.logo span { font-size:1.5rem; }
.logo h2 { font-size:1.1rem; }
.sb-toggle { background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; }
.nav-list { list-style:none; flex:1; padding:8px; }
.nav-sec { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--text-dim); padding:16px 16px 6px; font-weight:600; }
.nl { display:flex; align-items:center; gap:12px; padding:10px 16px; color:var(--text-muted); text-decoration:none; border-radius:var(--r-sm); transition:.15s; font-size:14px; position:relative; }
.nl:hover { background:var(--card-hover); color:var(--text); }
.nl.active { background:var(--primary-light); color:var(--primary); font-weight:500; }
.ni { font-size:18px; width:24px; text-align:center; }
.nav-badge { position:absolute; right:12px; background:var(--danger); color:white; font-size:10px; padding:2px 6px; border-radius:10px; }
.nav-footer { padding:16px; border-top:1px solid var(--border); }
.content { flex:1; margin-left:260px; padding:32px; max-width:1100px; transition:.3s; }
.sidebar.collapsed ~ .content { margin-left:70px; }
.mobile-nav { display:none; position:fixed; bottom:0; left:0; right:0; background:var(--card); padding:8px 0; justify-content:space-around; border-top:1px solid var(--border); z-index:100; }
.ml { display:flex; flex-direction:column; align-items:center; gap:2px; text-decoration:none; color:var(--text-muted); font-size:20px; }
.ml small { font-size:10px; }
.ml.active { color:var(--primary); }

.page-header { margin-bottom:24px; }
.page-header h1 { font-size:1.8rem; font-weight:700; }
.page-sub { color:var(--text-muted); font-size:14px; margin-top:4px; }
.loading { display:flex; flex-direction:column; align-items:center; padding:60px; gap:12px; color:var(--text-muted); }
.spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin .8s linear infinite; }
.spinner-sm { display:inline-block; width:14px; height:14px; border:2px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin .8s linear infinite; }
.loading-sm { display:flex; align-items:center; gap:8px; color:var(--text-muted); font-size:13px; }
@keyframes spin { to { transform:rotate(360deg); } }
.page-enter { animation:fadeIn .3s; }
@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } }

.glass { background:rgba(26,23,48,0.8); backdrop-filter:blur(10px); border:1px solid var(--border); border-radius:var(--r); padding:24px; }
.glass.compact { padding:16px; }
.glass h3 { font-size:1rem; margin-bottom:16px; }
.text-muted { color:var(--text-muted); } .desc { font-size:13px; color:var(--text-muted); margin:8px 0; }
.mt-8 { margin-top:8px; } .mt-16 { margin-top:16px; } .mt-24 { margin-top:24px; } .mb-16 { margin-bottom:16px; }
.empty-state { text-align:center; padding:40px; color:var(--text-dim); }
.empty-sm { text-align:center; padding:16px; color:var(--text-dim); font-size:13px; }
.empty-sm a { color:var(--primary); text-decoration:none; }
.fg { margin-bottom:12px; }
.fg label { display:block; margin-bottom:6px; color:var(--text-muted); font-size:13px; font-weight:500; }
.inline-form { flex-direction:row; flex-wrap:wrap; align-items:flex-end; gap:8px; }
.inline-form input, .inline-form select { min-width:120px; flex:1; }
.section { margin-top:24px; } .sec-header { margin-bottom:16px; }
.link-sm { font-size:12px; color:var(--primary); text-decoration:none; }

.stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
.stat-card { border-radius:var(--r); padding:20px; text-align:center; }
.gradient-1 { background:linear-gradient(135deg,#312e81,var(--card)); border:1px solid #8b5cf630; }
.gradient-2 { background:linear-gradient(135deg,#14532d40,var(--card)); border:1px solid #22c55e30; }
.gradient-3 { background:linear-gradient(135deg,#78350f40,var(--card)); border:1px solid #f59e0b30; }
.gradient-4 { background:linear-gradient(135deg,#7f1d1d40,var(--card)); border:1px solid #ef444430; }
.stat-icon { font-size:1.3rem; margin-bottom:8px; }
.stat-number { font-size:1.6rem; font-weight:700; color:var(--primary); }
.stat-label { color:var(--text-muted); font-size:12px; }

.level-card { margin-bottom:20px; }
.level-bar-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.level-info { display:flex; align-items:center; gap:12px; }
.level-badge { background:var(--primary); color:white; padding:4px 12px; border-radius:20px; font-weight:700; font-size:14px; }
.level-title { color:var(--text-muted); }
.xp-text { color:var(--primary); font-weight:600; }
.progress-bar { height:6px; background:var(--border); border-radius:3px; overflow:hidden; }
.progress-bar.lg { height:10px; border-radius:5px; }
.progress-fill { height:100%; background:linear-gradient(90deg,var(--primary),#ec4899); border-radius:3px; transition:width .5s; }

.alert-banner { display:flex; align-items:center; gap:12px; padding:14px 20px; border-radius:var(--r); margin-bottom:16px; background:var(--primary-light); border:1px solid var(--primary); }
.alert-banner.info { background:#3b82f620; border-color:#3b82f6; }

.dash-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.dash-card { padding:20px; }
.dch { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.dch h3 { font-size:.95rem; }

.skill-chips { display:flex; flex-wrap:wrap; gap:8px; }
.skill-chip { display:flex; align-items:center; gap:6px; padding:6px 12px; background:var(--input-bg); border:1px solid var(--border); border-radius:20px; font-size:13px; }
.chip-level { width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:white; }
.chip-B { background:var(--success); } .chip-I { background:var(--primary); } .chip-A { background:#ec4899; }
.chip-endorse { font-size:10px; color:var(--success); font-weight:600; }

.exchange-mini { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); }
.status-dot { width:8px; height:8px; border-radius:50%; }
.status-dot.pending { background:var(--warning); }
.status-dot.accepted { background:var(--success); }
.status-dot.completed { background:var(--primary); }
.exchange-mini-info { flex:1; }
.exchange-mini-info strong { display:block; font-size:13px; }
.exchange-mini-info span { font-size:11px; color:var(--text-muted); }

.event-mini { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); }
.event-date { background:var(--primary); color:white; padding:4px 10px; border-radius:6px; font-weight:700; font-size:12px; }
.notif-mini { display:flex; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); font-size:13px; }

.badge { display:inline-block; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; background:var(--primary-light); color:var(--primary); }
.badge-beginner { background:#22c55e20; color:var(--success); }
.badge-intermediate { background:var(--primary-light); color:var(--primary); }
.badge-advanced { background:#ec489920; color:#ec4899; }
.badge-cat { background:var(--primary-light); color:var(--primary); }
.badge-pending { background:#f59e0b20; color:var(--warning); }
.badge-accepted { background:#22c55e20; color:var(--success); }
.badge-completed { background:var(--primary-light); color:var(--primary); }
.badge-declined { background:#ef444420; color:var(--danger); }
.badge-normal { background:var(--primary-light); color:var(--primary); }
.badge-urgent { background:#ef444420; color:var(--danger); }
.badge-casual { background:#22c55e20; color:var(--success); }

.tag-chips { display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; }
.tag-chip { padding:2px 8px; background:var(--input-bg); border:1px solid var(--border); border-radius:12px; font-size:11px; color:var(--text-muted); }

.skills-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(350px,1fr)); gap:16px; }
.skill-card { transition:.2s; }
.skill-card:hover { border-color:var(--primary); }
.skill-card-header { display:flex; justify-content:space-between; align-items:center; }
.skill-actions { display:flex; gap:4px; }
.skill-meta { display:flex; gap:8px; margin-top:8px; }
.skill-stats { display:flex; gap:16px; font-size:12px; color:var(--text-muted); margin-top:12px; flex-wrap:wrap; }
.skill-card-actions { display:flex; gap:8px; margin-top:12px; }
.portfolio-mini { margin-top:8px; }
.portfolio-mini h4 { font-size:12px; margin-bottom:4px; }
.portfolio-link { font-size:12px; color:var(--primary); text-decoration:none; margin-right:8px; }
.ai-suggestion { padding:12px; margin-top:8px; font-size:13px; }
.ai-suggestion p { margin-bottom:4px; }

.search-panel { margin-bottom:24px; }
.search-main { display:flex; gap:12px; margin-bottom:12px; }
.search-input-lg { font-size:16px; padding:14px 20px; flex:1; }
.search-filters { display:flex; gap:8px; }
.results-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:16px; margin-bottom:24px; }
.browse-card { transition:.2s; }
.browse-card:hover { border-color:var(--primary); transform:translateY(-2px); }
.browse-top { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
.browse-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; flex-shrink:0; }
.browse-meta { display:flex; gap:8px; align-items:center; margin-top:8px; font-size:12px; }
.browse-actions { display:flex; gap:8px; margin-top:12px; }

.match-score-circle svg { width:80px; }
.matches-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; margin-top:16px; }
.match-card { display:flex; align-items:center; gap:16px; transition:.2s; }
.match-card:hover { border-color:var(--primary); }
.match-info { flex:1; }
.match-actions { display:flex; gap:8px; }

.exchange-tabs { display:flex; gap:4px; background:var(--card); border-radius:var(--r-sm); padding:4px; margin-bottom:20px; width:fit-content; }
.etab { padding:8px 20px; background:transparent; border:none; color:var(--text-muted); border-radius:6px; cursor:pointer; font-size:13px; transition:.2s; }
.etab.active { background:var(--primary); color:white; }
.exchange-list { display:flex; flex-direction:column; gap:12px; }
.exchange-card { transition:.2s; }
.exchange-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.exchange-skill { display:flex; align-items:center; gap:12px; }
.exchange-people { display:flex; align-items:center; gap:16px; margin:12px 0; }
.exchange-person { display:flex; align-items:center; gap:8px; }
.exchange-person small { font-size:11px; color:var(--text-muted); display:block; }
.exchange-arrow { font-size:1.3rem; color:var(--primary); }
.exchange-actions { display:flex; gap:8px; margin-top:12px; }
.rating-display { font-size:13px; }
.star-rating { display:flex; gap:4px; cursor:pointer; }
.star { opacity:.3; transition:.2s; } .star.active { opacity:1; }

.messages-layout { display:grid; grid-template-columns:280px 1fr; gap:16px; height:calc(100vh - 200px); }
.convo-list { overflow-y:auto; }
.convo-item { display:flex; align-items:center; gap:12px; padding:12px; cursor:pointer; border-radius:var(--r-sm); transition:.15s; border-bottom:1px solid var(--border); }
.convo-item:hover { background:var(--card-hover); }
.convo-item.selected { background:var(--primary-light); }
.convo-item.unread { font-weight:600; }
.convo-avatar { width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; flex-shrink:0; }
.convo-info { flex:1; }
.last-msg { font-size:12px; color:var(--text-muted); }
.unread-badge { background:var(--primary); color:white; font-size:10px; padding:2px 6px; border-radius:10px; }
.chat-area { display:flex; flex-direction:column; }
.chat-header { padding:12px; border-bottom:1px solid var(--border); }
.chat-messages { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:8px; }
.chat-msg { max-width:70%; padding:10px 14px; border-radius:12px; font-size:14px; }
.chat-msg.sent { align-self:flex-end; background:var(--primary); color:white; border-bottom-right-radius:4px; }
.chat-msg.received { align-self:flex-start; background:var(--card-hover); border-bottom-left-radius:4px; }
.chat-msg small { display:block; font-size:10px; opacity:.7; margin-top:4px; }
.chat-input { flex-direction:row; padding:12px; border-top:1px solid var(--border); gap:8px; }
.chat-input input { flex:1; }

.requests-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; }
.request-card { transition:.2s; }
.request-card:hover { border-color:var(--primary); }
.req-header { display:flex; justify-content:space-between; margin-bottom:8px; }
.req-footer { display:flex; gap:16px; font-size:12px; color:var(--text-muted); margin-top:8px; }
.req-top { display:flex; justify-content:space-between; align-items:center; }
.req-meta { display:flex; gap:16px; font-size:12px; color:var(--text-muted); }

.events-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(350px,1fr)); gap:16px; }
.event-card { transition:.2s; }
.event-card:hover { border-color:var(--primary); }
.event-top { display:flex; gap:16px; margin-bottom:12px; }
.event-date-box { width:60px; height:60px; background:var(--primary); border-radius:var(--r-sm); display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; flex-shrink:0; }
.event-month { font-size:10px; text-transform:uppercase; }
.event-day { font-size:1.5rem; font-weight:700; }
.event-info { flex:1; }
.event-meta { display:flex; gap:8px; flex-wrap:wrap; margin:4px 0; }
.event-bottom { display:flex; align-items:center; gap:16px; font-size:13px; color:var(--text-muted); flex-wrap:wrap; }

.leaderboard-list { display:flex; flex-direction:column; gap:8px; }
.leader-row { display:flex; align-items:center; gap:16px; padding:12px 16px; }
.leader-row.top-1 { border-color:#fbbf24; }
.rank { font-size:1.3rem; width:36px; text-align:center; }
.leader-avatar { width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:700; }
.leader-info { flex:1; }
.leader-info strong { display:block; }
.leader-stats { display:flex; gap:16px; font-size:13px; }

.badges-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
.badge-card { text-align:center; transition:.2s; }
.badge-card.locked { opacity:.4; }
.badge-card.earned { border-color:var(--primary); }
.badge-icon { font-size:2.5rem; margin-bottom:8px; }
.badge-card h3 { font-size:.95rem; margin-bottom:4px; }
.badge-earned { color:var(--success); font-size:12px; font-weight:600; }
.badge-locked { color:var(--text-dim); font-size:12px; }

.profile-card { }
.profile-header { display:flex; align-items:center; gap:20px; margin-bottom:24px; }
.profile-avatar { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-size:1.8rem; font-weight:700; flex-shrink:0; }
.profile-stats { display:grid; grid-template-columns:repeat(6,1fr); gap:16px; }
.pstat { text-align:center; padding:12px; background:var(--input-bg); border-radius:var(--r-sm); }
.pstat-value { display:block; font-weight:700; font-size:1.1rem; margin-bottom:4px; }
.pstat-label { font-size:11px; color:var(--text-muted); }

.settings-list { display:flex; flex-direction:column; gap:16px; }

.learning-path { }
.path-steps { display:flex; flex-direction:column; gap:16px; margin-top:16px; }
.path-step { display:flex; gap:16px; }
.step-number { width:32px; height:32px; background:var(--primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; }
.step-content h4 { font-size:14px; } .step-content p { font-size:13px; color:var(--text-muted); }
.step-resources { display:flex; gap:4px; flex-wrap:wrap; margin-top:4px; }

.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; opacity:0; transition:.2s; padding:20px; }
.modal-overlay.show { opacity:1; }
.modal { background:var(--card); border:1px solid var(--border); border-radius:16px; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid var(--border); }
.modal-close { background:none; border:none; color:var(--text-muted); font-size:18px; cursor:pointer; }
.modal-body { padding:24px; }
.modal-footer { padding:16px 24px; border-top:1px solid var(--border); display:flex; gap:8px; justify-content:flex-end; }

.toast-container { position:fixed; top:20px; right:20px; z-index:10000; display:flex; flex-direction:column; gap:8px; }
.toast { display:flex; align-items:center; gap:10px; padding:12px 20px; background:var(--card); border:1px solid var(--border); border-radius:var(--r-sm); color:var(--text); font-size:14px; box-shadow:0 4px 24px rgba(0,0,0,.3); transform:translateX(100%); opacity:0; transition:.3s; }
.toast.show { transform:translateX(0); opacity:1; }
.toast-success { border-left:3px solid var(--success); }
.toast-error { border-left:3px solid var(--danger); }

@media (max-width:1024px) { .stats-grid { grid-template-columns:repeat(2,1fr); } .dash-grid { grid-template-columns:1fr; } .profile-stats { grid-template-columns:repeat(3,1fr); } .messages-layout { grid-template-columns:1fr; } }
@media (max-width:768px) { .sidebar { display:none; } .content { margin-left:0 !important; padding:20px; padding-bottom:80px; } .mobile-nav { display:flex; } .row2,.row3 { grid-template-columns:1fr; } .stats-grid { grid-template-columns:1fr 1fr; } .results-grid,.skills-grid,.matches-grid,.events-grid,.requests-grid,.badges-grid { grid-template-columns:1fr; } .inline-form { flex-direction:column; } .search-main { flex-direction:column; } .messages-layout { height:auto; } }
`;
document.head.appendChild(style);
if (localStorage.getItem('skillbank_theme') === 'light') document.body.classList.add('light-theme');
renderApp();
