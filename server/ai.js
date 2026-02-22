const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

async function matchSkills(userSkills, allSkills) {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('No API key');
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You match skill exchange partners. Return JSON array of matches with fields: user_id, match_score (0-100), reason, their_skill, your_skill_wanted, collaboration_ideas.' },
        { role: 'user', content: `My skills: ${JSON.stringify(userSkills)}\nAvailable: ${JSON.stringify(allSkills.slice(0, 30))}` }],
      response_format: { type: 'json_object' }
    });
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return fallbackMatching(userSkills, allSkills);
  }
}

function fallbackMatching(userSkills, allSkills) {
  const userCats = new Set(userSkills.map(s => s.category));
  const userNames = userSkills.map(s => s.name.toLowerCase());
  const matches = [];
  const seen = new Set();
  for (const s of allSkills) {
    if (seen.has(s.user_id)) continue;
    if (userNames.some(n => s.name.toLowerCase().includes(n))) continue;
    let score = 30;
    if (userCats.has(s.category)) score += 15;
    const lvlBonus = { beginner: 10, intermediate: 20, advanced: 30 };
    score += lvlBonus[s.level] || 10;
    if (s.verified) score += 10;
    if (s.endorsements > 0) score += Math.min(s.endorsements * 3, 15);
    score = Math.min(score, 100);
    seen.add(s.user_id);
    matches.push({ user_id: s.user_id, user_name: s.user_name, match_score: score, reason: `Offers ${s.name} (${s.level})`, their_skill: s.name, category: s.category, collaboration_ideas: [`${s.name} workshop`, `Skill swap session`] });
  }
  return { matches: matches.sort((a, b) => b.match_score - a.match_score).slice(0, 15) };
}

async function generateSkillTags(skillName, description) {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('No API key');
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'Generate relevant tags for a skill. Return JSON: { tags: string[] }' },
        { role: 'user', content: `Skill: ${skillName}\nDescription: ${description}` }],
      response_format: { type: 'json_object' }
    });
    return JSON.parse(res.choices[0].message.content);
  } catch {
    const tagMap = {
      programming: ['coding', 'software', 'tech', 'development'],
      javascript: ['web', 'frontend', 'coding', 'react', 'node'],
      python: ['coding', 'data', 'ai', 'automation', 'scripting'],
      design: ['creative', 'visual', 'ui', 'ux', 'graphics'],
      photography: ['creative', 'visual', 'camera', 'editing'],
      cooking: ['food', 'cuisine', 'kitchen', 'recipes'],
      music: ['creative', 'performance', 'instrument', 'audio'],
      writing: ['content', 'creative', 'communication', 'copywriting'],
      marketing: ['business', 'digital', 'social-media', 'branding'],
      fitness: ['health', 'exercise', 'wellness', 'training'],
      language: ['communication', 'culture', 'translation', 'teaching']
    };
    const key = Object.keys(tagMap).find(k => skillName.toLowerCase().includes(k));
    return { tags: key ? tagMap[key] : ['skill', 'learning', 'exchange'] };
  }
}

async function suggestSkillDescription(name, level) {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('No API key');
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'Write a compelling skill description for a skill exchange platform. 2-3 sentences. Return JSON: { description, teaching_approach, ideal_student }' },
        { role: 'user', content: `Skill: ${name}, Level: ${level}` }]
    });
    return JSON.parse(res.choices[0].message.content);
  } catch {
    const approaches = { beginner: 'patient guided learning', intermediate: 'hands-on projects', advanced: 'deep-dive mentorship' };
    return { description: `I have ${level}-level expertise in ${name} and I'm passionate about sharing knowledge through practical, engaging sessions.`, teaching_approach: approaches[level] || 'interactive learning', ideal_student: `Anyone interested in learning ${name}` };
  }
}

async function generateLearningPath(skillName, currentLevel) {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('No API key');
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'Create a learning path. Return JSON: { steps: [{ title, description, duration, resources }], estimated_total_time, prerequisites }' },
        { role: 'user', content: `Skill: ${skillName}, Current level: ${currentLevel}` }],
      response_format: { type: 'json_object' }
    });
    return JSON.parse(res.choices[0].message.content);
  } catch {
    const steps = [
      { title: 'Fundamentals', description: `Master the core concepts of ${skillName}`, duration: '2 weeks', resources: ['Online tutorials', 'Practice exercises'] },
      { title: 'Intermediate Skills', description: `Build practical projects with ${skillName}`, duration: '4 weeks', resources: ['Project-based learning', 'Community challenges'] },
      { title: 'Advanced Techniques', description: `Explore advanced ${skillName} patterns`, duration: '6 weeks', resources: ['Expert workshops', 'Real-world applications'] },
      { title: 'Mastery', description: `Teach and mentor others in ${skillName}`, duration: 'Ongoing', resources: ['Mentoring', 'Community leadership'] }
    ];
    const startIdx = currentLevel === 'advanced' ? 2 : currentLevel === 'intermediate' ? 1 : 0;
    return { steps: steps.slice(startIdx), estimated_total_time: `${(4 - startIdx) * 3} weeks`, prerequisites: currentLevel === 'beginner' ? 'None' : `Basic ${skillName} knowledge` };
  }
}

async function suggestCollaboration(skill1, skill2) {
  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('No API key');
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'Suggest collaboration projects between two skills. Return JSON: { projects: [{ name, description, difficulty }], synergy_score: number }' },
        { role: 'user', content: `Skill 1: ${skill1}, Skill 2: ${skill2}` }],
      response_format: { type: 'json_object' }
    });
    return JSON.parse(res.choices[0].message.content);
  } catch {
    return {
      projects: [
        { name: `${skill1} × ${skill2} Workshop`, description: `Combine ${skill1} and ${skill2} in a creative project`, difficulty: 'intermediate' },
        { name: 'Cross-skill Portfolio', description: `Create a portfolio piece combining both disciplines`, difficulty: 'advanced' }
      ], synergy_score: 70
    };
  }
}

module.exports = { matchSkills, generateSkillTags, suggestSkillDescription, generateLearningPath, suggestCollaboration };
