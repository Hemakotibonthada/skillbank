const express = require('express');
const router = express.Router();
const { authMiddleware, generateToken } = require('./auth');
const db = require('./database');
const bcrypt = require('bcryptjs');
const { matchSkills, generateSkillTags, suggestSkillDescription, generateLearningPath, suggestCollaboration } = require('./ai');

const skill_categories = ['Technology', 'Creative Arts', 'Music', 'Languages', 'Business', 'Health & Fitness', 'Academics', 'Cooking', 'Crafts & DIY', 'Sports', 'Life Skills', 'Science', 'Writing', 'Marketing', 'Finance', 'Other'];

// ==================== AUTH ====================
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, bio, city, country } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    const existing = db.findOne('users', u => u.email === email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = db.insert('users', { name, email, password: hashed, bio: bio || '', city: city || '', country: country || '', avatar_color: `hsl(${Math.random() * 360}, 70%, 50%)`, xp: 0, level: 1, reputation: 0, badges: [], verified_skills: 0, total_exchanges: 0, teaching_hours: 0, joined_at: new Date().toISOString() });
    res.json({ token: generateToken(user.lastInsertRowid), user: { id: user.lastInsertRowid, name, email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.findOne('users', u => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: generateToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/auth/me', authMiddleware, (req, res) => {
  const user = db.findOne('users', u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safe } = user;
  safe.skill_count = db.count('skills', s => s.user_id === req.userId);
  safe.exchange_count = db.count('exchanges', e => e.teacher_id === req.userId || e.learner_id === req.userId);
  res.json(safe);
});

router.patch('/auth/profile', authMiddleware, (req, res) => {
  const { name, bio, city, country, avatar_color } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  if (city !== undefined) updates.city = city;
  if (country !== undefined) updates.country = country;
  if (avatar_color) updates.avatar_color = avatar_color;
  db.update('users', u => u.id === req.userId, updates);
  res.json({ success: true });
});

// ==================== SKILLS ====================
router.get('/skills', authMiddleware, (req, res) => {
  const skills = db.findAll('skills', s => s.user_id === req.userId);
  res.json(skills);
});

router.post('/skills', authMiddleware, async (req, res) => {
  const { name, description, category, level, tags } = req.body;
  if (!name || !category) return res.status(400).json({ error: 'Name and category required' });
  const user = db.findOne('users', u => u.id === req.userId);
  const autoTags = tags || (await generateSkillTags(name, description || '')).tags || [];
  const skill = db.insert('skills', { user_id: req.userId, user_name: user?.name || 'User', name, description: description || '', category, level: level || 'intermediate', tags: autoTags, endorsements: 0, verified: false, portfolio_items: [], exchange_count: 0, rating_avg: 0, rating_count: 0, created_at: new Date().toISOString() });
  res.json({ id: skill.lastInsertRowid, tags: autoTags });
});

router.put('/skills/:id', authMiddleware, (req, res) => {
  const { name, description, category, level, tags } = req.body;
  db.update('skills', s => s.id === parseInt(req.params.id) && s.user_id === req.userId, { name, description, category, level, tags });
  res.json({ success: true });
});

router.delete('/skills/:id', authMiddleware, (req, res) => {
  db.delete('skills', s => s.id === parseInt(req.params.id) && s.user_id === req.userId);
  res.json({ success: true });
});

router.post('/skills/:id/endorse', authMiddleware, (req, res) => {
  const skill = db.findOne('skills', s => s.id === parseInt(req.params.id));
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  if (skill.user_id === req.userId) return res.status(400).json({ error: 'Cannot endorse own skill' });
  const existing = db.findOne('endorsements', e => e.skill_id === skill.id && e.user_id === req.userId);
  if (existing) return res.status(400).json({ error: 'Already endorsed' });
  db.insert('endorsements', { skill_id: skill.id, user_id: req.userId, created_at: new Date().toISOString() });
  db.update('skills', s => s.id === skill.id, { endorsements: (skill.endorsements || 0) + 1 });
  res.json({ endorsements: (skill.endorsements || 0) + 1 });
});

router.post('/skills/:id/portfolio', authMiddleware, (req, res) => {
  const { title, description, url, image_url } = req.body;
  const skill = db.findOne('skills', s => s.id === parseInt(req.params.id) && s.user_id === req.userId);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  const items = skill.portfolio_items || [];
  items.push({ id: Date.now(), title, description, url, image_url, created_at: new Date().toISOString() });
  db.update('skills', s => s.id === skill.id, { portfolio_items: items });
  res.json({ portfolio_items: items });
});

router.get('/skills/categories', (req, res) => { res.json(skill_categories); });

router.get('/skills/browse', authMiddleware, (req, res) => {
  const { q, category, level } = req.query;
  let skills = db.findAll('skills', s => s.user_id !== req.userId);
  if (q) { const ql = q.toLowerCase(); skills = skills.filter(s => s.name.toLowerCase().includes(ql) || (s.description || '').toLowerCase().includes(ql) || (s.tags || []).some(t => t.toLowerCase().includes(ql))); }
  if (category) skills = skills.filter(s => s.category === category);
  if (level) skills = skills.filter(s => s.level === level);
  res.json(skills);
});

router.post('/skills/ai-description', authMiddleware, async (req, res) => {
  const { name, level } = req.body;
  const result = await suggestSkillDescription(name, level || 'intermediate');
  res.json(result);
});

router.post('/skills/learning-path', authMiddleware, async (req, res) => {
  const { skill_name, current_level } = req.body;
  const result = await generateLearningPath(skill_name, current_level || 'beginner');
  res.json(result);
});

// ==================== SKILL REQUESTS ====================
router.get('/requests', authMiddleware, (req, res) => {
  const requests = db.findAll('skill_requests', () => true);
  res.json(requests);
});

router.post('/requests', authMiddleware, (req, res) => {
  const { skill_name, description, category, urgency } = req.body;
  const user = db.findOne('users', u => u.id === req.userId);
  const request = db.insert('skill_requests', { user_id: req.userId, user_name: user?.name, skill_name, description: description || '', category: category || 'Other', urgency: urgency || 'normal', responses: 0, status: 'open', created_at: new Date().toISOString() });
  res.json({ id: request.lastInsertRowid });
});

router.post('/requests/:id/respond', authMiddleware, (req, res) => {
  const request = db.findOne('skill_requests', r => r.id === parseInt(req.params.id));
  if (!request) return res.status(404).json({ error: 'Request not found' });
  db.update('skill_requests', r => r.id === request.id, { responses: (request.responses || 0) + 1 });
  const user = db.findOne('users', u => u.id === req.userId);
  db.insert('messages', { from_id: req.userId, to_id: request.user_id, from_name: user?.name, content: req.body.message || `I can help with ${request.skill_name}!`, type: 'request_response', ref_id: request.id, read: false, created_at: new Date().toISOString() });
  res.json({ success: true });
});

router.delete('/requests/:id', authMiddleware, (req, res) => {
  db.delete('skill_requests', r => r.id === parseInt(req.params.id) && r.user_id === req.userId);
  res.json({ success: true });
});

// ==================== AI MATCHING ====================
router.get('/match', authMiddleware, async (req, res) => {
  const mySkills = db.findAll('skills', s => s.user_id === req.userId);
  const allSkills = db.findAll('skills', s => s.user_id !== req.userId);
  const result = await matchSkills(mySkills, allSkills);
  res.json(result);
});

router.post('/match/collaborate', authMiddleware, async (req, res) => {
  const { skill1, skill2 } = req.body;
  const result = await suggestCollaboration(skill1, skill2);
  res.json(result);
});

// ==================== EXCHANGES ====================
router.get('/exchanges', authMiddleware, (req, res) => {
  const exchanges = db.findAll('exchanges', e => e.teacher_id === req.userId || e.learner_id === req.userId);
  res.json(exchanges);
});

router.post('/exchanges', authMiddleware, (req, res) => {
  const { skill_id, teacher_id, skill_offered, notes, scheduled_date } = req.body;
  const user = db.findOne('users', u => u.id === req.userId);
  const teacher = db.findOne('users', u => u.id === teacher_id);
  const skill = db.findOne('skills', s => s.id === skill_id);
  const exchange = db.insert('exchanges', {
    skill_id, skill_name: skill?.name || 'Unknown', teacher_id, teacher_name: teacher?.name || 'Unknown',
    learner_id: req.userId, learner_name: user?.name || 'Unknown', skill_offered: skill_offered || '',
    notes: notes || '', scheduled_date: scheduled_date || null, status: 'pending',
    rating: null, review: null, duration_hours: null, created_at: new Date().toISOString()
  });
  db.insert('notifications', { user_id: teacher_id, type: 'exchange_request', message: `${user?.name} wants to learn ${skill?.name} from you!`, ref_id: exchange.lastInsertRowid, read: false, created_at: new Date().toISOString() });
  res.json({ id: exchange.lastInsertRowid });
});

router.patch('/exchanges/:id/accept', authMiddleware, (req, res) => {
  db.update('exchanges', e => e.id === parseInt(req.params.id) && e.teacher_id === req.userId, { status: 'accepted' });
  const ex = db.findOne('exchanges', e => e.id === parseInt(req.params.id));
  if (ex) db.insert('notifications', { user_id: ex.learner_id, type: 'exchange_accepted', message: `${ex.teacher_name} accepted your exchange request for ${ex.skill_name}!`, ref_id: ex.id, read: false, created_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/exchanges/:id/complete', authMiddleware, (req, res) => {
  const { rating, review, duration_hours } = req.body;
  db.update('exchanges', e => e.id === parseInt(req.params.id), { status: 'completed', rating, review, duration_hours: duration_hours || 1, completed_at: new Date().toISOString() });
  const ex = db.findOne('exchanges', e => e.id === parseInt(req.params.id));
  if (ex) {
    // Award XP
    const xpGain = (rating || 5) * 10;
    const teacher = db.findOne('users', u => u.id === ex.teacher_id);
    if (teacher) {
      const newXp = (teacher.xp || 0) + xpGain;
      const newLevel = Math.floor(newXp / 100) + 1;
      db.update('users', u => u.id === ex.teacher_id, { xp: newXp, level: newLevel, teaching_hours: (teacher.teaching_hours || 0) + (duration_hours || 1), total_exchanges: (teacher.total_exchanges || 0) + 1, reputation: (teacher.reputation || 0) + (rating || 3) });
    }
    // Update skill rating
    const skill = db.findOne('skills', s => s.id === ex.skill_id);
    if (skill && rating) {
      const newCount = (skill.rating_count || 0) + 1;
      const newAvg = (((skill.rating_avg || 0) * (skill.rating_count || 0)) + rating) / newCount;
      db.update('skills', s => s.id === skill.id, { rating_avg: Math.round(newAvg * 10) / 10, rating_count: newCount, exchange_count: (skill.exchange_count || 0) + 1 });
    }
  }
  res.json({ success: true });
});

router.patch('/exchanges/:id/decline', authMiddleware, (req, res) => {
  db.update('exchanges', e => e.id === parseInt(req.params.id) && e.teacher_id === req.userId, { status: 'declined' });
  res.json({ success: true });
});

router.delete('/exchanges/:id', authMiddleware, (req, res) => {
  db.delete('exchanges', e => e.id === parseInt(req.params.id) && (e.teacher_id === req.userId || e.learner_id === req.userId));
  res.json({ success: true });
});

// ==================== MESSAGES ====================
router.get('/messages', authMiddleware, (req, res) => {
  const msgs = db.findAll('messages', m => m.from_id === req.userId || m.to_id === req.userId);
  // Group by conversation partner
  const convos = {};
  msgs.forEach(m => {
    const partnerId = m.from_id === req.userId ? m.to_id : m.from_id;
    const partnerName = m.from_id === req.userId ? (m.to_name || 'User') : (m.from_name || 'User');
    if (!convos[partnerId]) convos[partnerId] = { partner_id: partnerId, partner_name: partnerName, messages: [], unread: 0 };
    convos[partnerId].messages.push(m);
    if (m.to_id === req.userId && !m.read) convos[partnerId].unread++;
  });
  res.json(Object.values(convos));
});

router.post('/messages', authMiddleware, (req, res) => {
  const { to_id, content } = req.body;
  const user = db.findOne('users', u => u.id === req.userId);
  const toUser = db.findOne('users', u => u.id === to_id);
  db.insert('messages', { from_id: req.userId, from_name: user?.name, to_id, to_name: toUser?.name, content, type: 'direct', read: false, created_at: new Date().toISOString() });
  res.json({ success: true });
});

router.patch('/messages/read/:partnerId', authMiddleware, (req, res) => {
  const partnerId = parseInt(req.params.partnerId);
  db.findAll('messages', m => m.from_id === partnerId && m.to_id === req.userId && !m.read).forEach(m => {
    db.update('messages', msg => msg.id === m.id, { read: true });
  });
  res.json({ success: true });
});

router.get('/messages/unread', authMiddleware, (req, res) => {
  const count = db.count('messages', m => m.to_id === req.userId && !m.read);
  res.json({ count });
});

// ==================== NOTIFICATIONS ====================
router.get('/notifications', authMiddleware, (req, res) => {
  const notifs = db.findAll('notifications', n => n.user_id === req.userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);
  res.json(notifs);
});

router.patch('/notifications/read', authMiddleware, (req, res) => {
  db.findAll('notifications', n => n.user_id === req.userId && !n.read).forEach(n => {
    db.update('notifications', notif => notif.id === n.id, { read: true });
  });
  res.json({ success: true });
});

// ==================== COMMUNITY EVENTS ====================
router.get('/events', authMiddleware, (req, res) => {
  const events = db.findAll('events', () => true).sort((a, b) => new Date(a.date) - new Date(b.date));
  res.json(events);
});

router.post('/events', authMiddleware, (req, res) => {
  const { title, description, category, date, duration, max_participants, skill_level, event_type } = req.body;
  const user = db.findOne('users', u => u.id === req.userId);
  const event = db.insert('events', {
    host_id: req.userId, host_name: user?.name || 'User', title, description: description || '',
    category: category || 'Other', date, duration: duration || '1 hour', max_participants: max_participants || 10,
    skill_level: skill_level || 'all', event_type: event_type || 'workshop',
    participants: [{ user_id: req.userId, name: user?.name }], status: 'upcoming',
    created_at: new Date().toISOString()
  });
  res.json({ id: event.lastInsertRowid });
});

router.post('/events/:id/join', authMiddleware, (req, res) => {
  const event = db.findOne('events', e => e.id === parseInt(req.params.id));
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const participants = event.participants || [];
  if (participants.some(p => p.user_id === req.userId)) return res.status(400).json({ error: 'Already joined' });
  if (participants.length >= event.max_participants) return res.status(400).json({ error: 'Event is full' });
  const user = db.findOne('users', u => u.id === req.userId);
  participants.push({ user_id: req.userId, name: user?.name });
  db.update('events', e => e.id === event.id, { participants });
  res.json({ participants: participants.length });
});

router.delete('/events/:id', authMiddleware, (req, res) => {
  db.delete('events', e => e.id === parseInt(req.params.id) && e.host_id === req.userId);
  res.json({ success: true });
});

// ==================== ACHIEVEMENTS / BADGES ====================
router.get('/achievements', authMiddleware, (req, res) => {
  const user = db.findOne('users', u => u.id === req.userId);
  const skillCount = db.count('skills', s => s.user_id === req.userId);
  const exchangeCount = db.count('exchanges', e => (e.teacher_id === req.userId || e.learner_id === req.userId) && e.status === 'completed');
  const eventCount = db.count('events', e => (e.participants || []).some(p => p.user_id === req.userId));

  const allBadges = [
    { id: 'first_skill', name: 'Skill Sharer', icon: '🎯', desc: 'Add your first skill', earned: skillCount >= 1 },
    { id: 'five_skills', name: 'Skill Collector', icon: '📚', desc: 'Add 5 skills', earned: skillCount >= 5 },
    { id: 'ten_skills', name: 'Polymath', icon: '🧠', desc: 'Add 10 skills', earned: skillCount >= 10 },
    { id: 'first_exchange', name: 'First Exchange', icon: '🤝', desc: 'Complete your first exchange', earned: exchangeCount >= 1 },
    { id: 'five_exchanges', name: 'Active Trader', icon: '💫', desc: 'Complete 5 exchanges', earned: exchangeCount >= 5 },
    { id: 'ten_exchanges', name: 'Exchange Master', icon: '👑', desc: 'Complete 10 exchanges', earned: exchangeCount >= 10 },
    { id: 'first_event', name: 'Community Member', icon: '🎉', desc: 'Join your first event', earned: eventCount >= 1 },
    { id: 'host_event', name: 'Event Host', icon: '🎤', desc: 'Host an event', earned: db.count('events', e => e.host_id === req.userId) >= 1 },
    { id: 'level_5', name: 'Rising Star', icon: '⭐', desc: 'Reach level 5', earned: (user?.level || 1) >= 5 },
    { id: 'level_10', name: 'Expert', icon: '🏆', desc: 'Reach level 10', earned: (user?.level || 1) >= 10 },
    { id: 'reputation_50', name: 'Trusted Member', icon: '🛡️', desc: 'Earn 50 reputation', earned: (user?.reputation || 0) >= 50 },
    { id: 'teacher_10h', name: 'Dedicated Teacher', icon: '📖', desc: 'Teach for 10 hours', earned: (user?.teaching_hours || 0) >= 10 },
  ];

  res.json({ badges: allBadges, total_earned: allBadges.filter(b => b.earned).length, total: allBadges.length });
});

// ==================== LEADERBOARD ====================
router.get('/leaderboard', authMiddleware, (req, res) => {
  const users = db.findAll('users', () => true).map(u => ({
    id: u.id, name: u.name, city: u.city, avatar_color: u.avatar_color,
    xp: u.xp || 0, level: u.level || 1, reputation: u.reputation || 0,
    teaching_hours: u.teaching_hours || 0, total_exchanges: u.total_exchanges || 0,
    skill_count: db.count('skills', s => s.user_id === u.id)
  })).sort((a, b) => b.xp - a.xp).slice(0, 20);
  res.json(users);
});

// ==================== DASHBOARD ====================
router.get('/dashboard', authMiddleware, (req, res) => {
  const user = db.findOne('users', u => u.id === req.userId);
  const skills = db.findAll('skills', s => s.user_id === req.userId);
  const exchanges = db.findAll('exchanges', e => e.teacher_id === req.userId || e.learner_id === req.userId);
  const pending = exchanges.filter(e => e.status === 'pending' && e.teacher_id === req.userId);
  const completed = exchanges.filter(e => e.status === 'completed');
  const unreadMsgs = db.count('messages', m => m.to_id === req.userId && !m.read);
  const notifs = db.findAll('notifications', n => n.user_id === req.userId && !n.read);
  const upcoming = db.findAll('events', e => new Date(e.date) > new Date() && (e.participants || []).some(p => p.user_id === req.userId)).slice(0, 3);
  const recentExchanges = exchanges.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

  res.json({
    user: { name: user?.name, level: user?.level || 1, xp: user?.xp || 0, reputation: user?.reputation || 0, teaching_hours: user?.teaching_hours || 0, avatar_color: user?.avatar_color },
    stats: { skills: skills.length, exchanges_completed: completed.length, pending_requests: pending.length, teaching_hours: user?.teaching_hours || 0 },
    skills: skills.slice(0, 6),
    pending_exchanges: pending,
    recent_exchanges: recentExchanges,
    unread_messages: unreadMsgs,
    notifications: notifs.slice(0, 5),
    upcoming_events: upcoming
  });
});

// ==================== EXPORT ====================
router.get('/export', authMiddleware, (req, res) => {
  const skills = db.findAll('skills', s => s.user_id === req.userId);
  const exchanges = db.findAll('exchanges', e => e.teacher_id === req.userId || e.learner_id === req.userId);
  res.json({ skills, exchanges, exported_at: new Date().toISOString() });
});

// ==================== FEEDBACK ====================
router.post('/feedback', authMiddleware, (req, res) => {
  db.insert('feedback', { user_id: req.userId, type: req.body.type || 'general', message: req.body.message, created_at: new Date().toISOString() });
  res.json({ success: true });
});

module.exports = router;
