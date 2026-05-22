/**
 * Sprint 4 — service/parser
 * 从 JD 原始文本中提取结构化字段。
 * 依赖 config，不引用 repo/runtime/ui。
 */

import {
  ALL_SKILLS,
  SKILL_DICTIONARY,
  EDU_KEYWORDS,
  EXPERIENCE_PATTERNS,
} from '../config/index.js';

/**
 * 解析 JD 文本，返回 ParsedJD。
 * @param {string} rawText
 * @returns {import('../types/index.js').ParsedJD}
 */
export function parseJD(rawText) {
  const lower = rawText.toLowerCase();

  return {
    rawText,
    title:          extractTitle(rawText),
    company:        extractCompany(rawText),
    requiredSkills: extractRequiredSkills(lower),
    niceSkills:     extractNiceToHaveSkills(lower),
    minYears:       extractMinYears(rawText),
    eduLevel:       extractEduLevel(lower),
    keywords:       extractAllKeywords(lower),
  };
}

// ─── 职位名称 ─────────────────────────────────────────────────────────────────

function extractTitle(text) {
  // 常见标题模式
  const patterns = [
    /(?:职位|岗位|position|role|title)[：:]\s*(.+)/i,
    /(?:招聘|招募|hiring)\s+(.+?)(?:\n|$)/i,
    /^(.+?engineer|.+?developer|.+?architect|.+?manager|.+?designer)/im,
    /^#\s*(.+)/m,                // Markdown 标题
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().slice(0, 80);
  }
  // 取第一行非空
  const firstLine = text.split('\n').map(l => l.trim()).find(Boolean);
  return firstLine?.slice(0, 80) || 'Unknown Position';
}

// ─── 公司名 ───────────────────────────────────────────────────────────────────

function extractCompany(text) {
  const patterns = [
    /(?:公司|company|employer)[：:]\s*(.+)/i,
    /(?:at|@)\s+([A-Z][A-Za-z0-9\s&]+)(?:\n|,|\.|$)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim().slice(0, 60);
  }
  return '';
}

// ─── 技能提取 ─────────────────────────────────────────────────────────────────

/**
 * 提取"必须具备"技能（required / 必须 / 要求 等段落）。
 */
function extractRequiredSkills(lower) {
  // 尝试定位"必须/required"段落
  const requiredSection = extractSection(lower, [
    'requirements', 'required skills', 'must have', 'must-have',
    '岗位要求', '任职要求', '必须', '必备',
  ]);
  const source = requiredSection || lower;
  return matchSkills(source);
}

/**
 * 提取"加分项"技能（nice to have / 加分 等）。
 */
function extractNiceToHaveSkills(lower) {
  const niceSection = extractSection(lower, [
    'nice to have', 'nice-to-have', 'preferred', 'bonus', 'plus',
    '加分项', '优先考虑', '优先',
  ]);
  if (!niceSection) return [];
  const required = extractRequiredSkills(lower);
  return matchSkills(niceSection).filter(s => !required.includes(s));
}

/**
 * 从文本中提取段落（section 关键词之后的内容）。
 */
function extractSection(lower, triggers) {
  for (const t of triggers) {
    const idx = lower.indexOf(t);
    if (idx === -1) continue;
    // 取之后 500 字符
    return lower.slice(idx, idx + 500);
  }
  return null;
}

/**
 * 在文本中匹配已知技能词。
 */
function matchSkills(text) {
  const found = new Set();
  for (const skill of ALL_SKILLS) {
    // 使用 word-boundary 风格匹配（技能名前后非字母数字）
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, 'i');
    if (re.test(text)) found.add(skill);
  }
  return [...found];
}

// ─── 经验年限 ─────────────────────────────────────────────────────────────────

function extractMinYears(text) {
  for (const p of EXPERIENCE_PATTERNS) {
    const m = text.match(p);
    if (m) {
      const years = parseInt(m[1], 10);
      if (!isNaN(years) && years > 0 && years < 30) return years;
    }
  }
  return -1;
}

// ─── 学历要求 ─────────────────────────────────────────────────────────────────

function extractEduLevel(lower) {
  if (EDU_KEYWORDS.phd.some(k => lower.includes(k)))      return 'phd';
  if (EDU_KEYWORDS.master.some(k => lower.includes(k)))   return 'master';
  if (EDU_KEYWORDS.bachelor.some(k => lower.includes(k))) return 'bachelor';
  return 'any';
}

// ─── 全关键词 ─────────────────────────────────────────────────────────────────

function extractAllKeywords(lower) {
  const all = new Set();
  // 所有分类技能
  for (const [, skills] of Object.entries(SKILL_DICTIONARY)) {
    for (const s of skills) {
      if (lower.includes(s)) all.add(s);
    }
  }
  return [...all];
}
