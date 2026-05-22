/**
 * Sprint 5 — service/matcher
 * 本地多维加权匹配算法。
 * 依赖 types / config，不引用 repo/runtime/ui。
 */

import { WEIGHTS, EDU_LEVEL_MAP } from '../config/index.js';

/**
 * 计算 JD 与简历的匹配度。
 * @param {import('../types/index.js').ParsedJD} jd
 * @param {import('../types/index.js').Resume}   resume
 * @returns {import('../types/index.js').MatchResult}
 */
export function computeMatch(jd, resume) {
  const skillDim   = scoreSkills(jd, resume);
  const expDim     = scoreExperience(jd, resume);
  const eduDim     = scoreEducation(jd, resume);

  const total = Math.round(
    skillDim.score   * WEIGHTS.skill +
    expDim.score     * WEIGHTS.experience +
    eduDim.score     * WEIGHTS.education
  );

  const skillMatches  = buildSkillMatches(jd, resume);
  const missingSkills = skillMatches
    .filter(m => !m.matched)
    .map(m => m.skill);

  return {
    totalScore:   Math.min(100, total),
    dimensions:   [skillDim, expDim, eduDim],
    skillMatches,
    missingSkills,
    strengths:    buildStrengths(jd, resume, skillDim, expDim, eduDim),
    suggestions:  buildSuggestions(missingSkills, expDim, eduDim, jd),
    engine:       'local',
  };
}

// ─── 维度：技能匹配 ────────────────────────────────────────────────────────────

function scoreSkills(jd, resume) {
  const required = jd.requiredSkills;
  const nice     = jd.niceSkills;
  const resumeLC = resume.skills.map(s => s.toLowerCase());

  if (required.length === 0 && nice.length === 0) {
    return { label: '技能匹配', score: 70, reason: '未检测到具体技能要求' };
  }

  // 必须技能：每个权重更高
  let requiredMatched = 0;
  for (const s of required) {
    if (resumeContains(resumeLC, s)) requiredMatched++;
  }

  // 加分技能
  let niceMatched = 0;
  for (const s of nice) {
    if (resumeContains(resumeLC, s)) niceMatched++;
  }

  const requiredScore = required.length
    ? (requiredMatched / required.length) * 100
    : 100;

  const niceBonus = nice.length
    ? (niceMatched / nice.length) * 15   // 最多加 15 分
    : 0;

  const score = Math.min(100, Math.round(requiredScore * 0.85 + niceBonus));

  const reason = required.length
    ? `必要技能 ${requiredMatched}/${required.length} 匹配` +
      (nice.length ? `，加分技能 ${niceMatched}/${nice.length}` : '')
    : '无明确必要技能要求';

  return { label: '技能匹配', score, reason };
}

// ─── 维度：经验年限 ────────────────────────────────────────────────────────────

function scoreExperience(jd, resume) {
  const required = jd.minYears;
  const actual   = calcTotalYears(resume.experience);

  if (required <= 0) {
    return {
      label:  '经验匹配',
      score:  actual >= 3 ? 90 : 70,
      reason: `未提及年限要求，实际经验约 ${actual} 年`,
    };
  }

  let score;
  const diff = actual - required;
  if (diff >= 2)       score = 100;
  else if (diff >= 0)  score = 90;
  else if (diff >= -1) score = 65;
  else if (diff >= -2) score = 40;
  else                 score = 20;

  return {
    label:  '经验匹配',
    score,
    reason: `要求 ${required} 年，实际约 ${actual} 年`,
  };
}

function calcTotalYears(experiences) {
  if (!experiences.length) return 0;
  let totalMonths = 0;
  for (const exp of experiences) {
    const from = parseDate(exp.from);
    const to   = exp.to === 'present' ? new Date() : parseDate(exp.to);
    if (from && to) {
      totalMonths += (to.getFullYear() - from.getFullYear()) * 12
                   + (to.getMonth()    - from.getMonth());
    }
  }
  return Math.round(totalMonths / 12);
}

function parseDate(str) {
  if (!str) return null;
  const [y, m = 1] = str.split('.').map(Number);
  if (!y) return null;
  return new Date(y, m - 1);
}

// ─── 维度：学历 ────────────────────────────────────────────────────────────────

function scoreEducation(jd, resume) {
  const required = EDU_LEVEL_MAP[jd.eduLevel] ?? 1;
  const highest  = getHighestDegree(resume.education);
  const actual   = EDU_LEVEL_MAP[highest] ?? 2;

  let score;
  if (actual >= required + 1) score = 100;
  else if (actual >= required) score = 90;
  else if (actual === required - 1) score = 60;
  else score = 30;

  const degreeLabel = { phd: '博士', master: '硕士', bachelor: '本科', any: '不限' };

  return {
    label:  '学历匹配',
    score,
    reason: `要求 ${degreeLabel[jd.eduLevel] ?? '不限'}，实际 ${degreeLabel[highest] ?? '未知'}`,
  };
}

function getHighestDegree(education) {
  if (!education.length) return 'bachelor';
  const order = ['phd', 'master', 'bachelor', 'any'];
  for (const deg of order) {
    if (education.some(e => e.degree === deg)) return deg;
  }
  return 'bachelor';
}

// ─── 逐条技能匹配明细 ──────────────────────────────────────────────────────────

function buildSkillMatches(jd, resume) {
  const allRequested = [...new Set([...jd.requiredSkills, ...jd.niceSkills])];
  const resumeLC     = resume.skills.map(s => s.toLowerCase());

  // 若 JD 没有识别到任何技能，取 JD 关键词来展示
  const skills = allRequested.length ? allRequested : jd.keywords.slice(0, 15);

  return skills.map(skill => {
    const matched = resumeContains(resumeLC, skill);
    const source  = matched
      ? resume.skills.find(s => s.toLowerCase().includes(skill)) || skill
      : undefined;
    return { skill, matched, source };
  });
}

// ─── 优势 & 建议 ──────────────────────────────────────────────────────────────

function buildStrengths(jd, resume, skillDim, expDim, eduDim) {
  const strengths = [];
  if (skillDim.score >= 75)
    strengths.push(`技能高度匹配（${skillDim.score}分）`);
  if (expDim.score >= 85)
    strengths.push('工作经验充足，超出要求');
  if (eduDim.score >= 90)
    strengths.push('学历达标或超出要求');
  if (resume.skills.includes('ai agent') || resume.skills.includes('langchain'))
    strengths.push('具备稀缺 AI Agent 工程经验');
  if (resume.skills.includes('solana') || resume.skills.includes('web3'))
    strengths.push('具备 Web3 / 区块链实战经验');
  if (!strengths.length)
    strengths.push('有一定技术基础，可作为潜力候选');
  return strengths;
}

function buildSuggestions(missingSkills, expDim, eduDim, jd) {
  const suggestions = [];
  if (missingSkills.length > 0) {
    const top = missingSkills.slice(0, 4).join('、');
    suggestions.push(`补充以下技能可提升竞争力：${top}`);
  }
  if (expDim.score < 65) {
    suggestions.push(`工作年限略显不足（要求 ${jd.minYears} 年），可强调项目深度与质量`);
  }
  if (eduDim.score < 60) {
    suggestions.push('学历与要求有差距，建议突出证书、在线课程和实战项目');
  }
  if (suggestions.length === 0) {
    suggestions.push('整体匹配良好，建议在简历中量化业务影响（如 GMV、性能提升 %）');
  }
  return suggestions;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function resumeContains(resumeLower, skill) {
  const s = skill.toLowerCase();
  return resumeLower.some(r => r.includes(s) || s.includes(r));
}
