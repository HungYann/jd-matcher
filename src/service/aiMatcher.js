/**
 * Sprint 6 — service/aiMatcher
 * AI 增强匹配：调用 Claude / OpenAI，失败自动 fallback 到本地算法。
 * 依赖 config，不引用 repo/runtime/ui。
 */

import { AI_CONFIG } from '../config/index.js';
import { computeMatch } from './matcher.js';

/**
 * @param {import('../types/index.js').ParsedJD} jd
 * @param {import('../types/index.js').Resume}   resume
 * @param {{ apiKey: string, provider: 'claude'|'openai' }} opts
 * @returns {Promise<import('../types/index.js').MatchResult>}
 */
export async function computeMatchWithAI(jd, resume, { apiKey, provider = 'claude' }) {
  // 先跑本地算法作为基础分
  const localResult = computeMatch(jd, resume);

  try {
    const prompt = buildPrompt(jd, resume, localResult);
    const raw = provider === 'claude'
      ? await callClaude(prompt, apiKey)
      : await callOpenAI(prompt, apiKey);

    const aiParsed = parseAIResponse(raw);

    // 融合：AI 总分 60% + 本地算法 40%
    const blendedScore = Math.round(aiParsed.score * 0.6 + localResult.totalScore * 0.4);

    return {
      ...localResult,
      totalScore:  Math.min(100, blendedScore),
      strengths:   aiParsed.strengths   || localResult.strengths,
      suggestions: aiParsed.suggestions || localResult.suggestions,
      aiAnalysis:  aiParsed.analysis,
      engine:      'ai',
    };
  } catch (err) {
    console.warn('[aiMatcher] AI call failed, using local result:', err.message);
    return {
      ...localResult,
      aiAnalysis: `AI 分析不可用（${err.message}），已使用本地算法结果。`,
      engine:     'local',
    };
  }
}

// ─── Prompt 构建 ───────────────────────────────────────────────────────────────

function buildPrompt(jd, resume, localResult) {
  const resumeSummary = `
姓名：${resume.name}
技能：${resume.skills.slice(0, 25).join(', ')}
经验：${resume.experience.map(e => `${e.company}（${e.from}~${e.to}）${e.title}`).join(' | ')}
学历：${resume.education.map(e => `${e.school} ${e.degree} ${e.major}`).join(' | ')}
`.trim();

  return `你是一名专业的 HR 顾问。请对以下 JD 和简历进行匹配度分析，返回 JSON。

## JD
职位：${jd.title}
公司：${jd.company || '未知'}
必要技能：${jd.requiredSkills.join(', ') || '未提及'}
加分技能：${jd.niceSkills.join(', ') || '无'}
经验要求：${jd.minYears > 0 ? `${jd.minYears}年+` : '未提及'}
学历要求：${jd.eduLevel}

## 候选人简历
${resumeSummary}

## 本地算法初步得分
总分：${localResult.totalScore}/100
技能：${localResult.dimensions[0].score}  经验：${localResult.dimensions[1].score}  学历：${localResult.dimensions[2].score}

## 要求的 JSON 格式
{
  "score": <0-100的整数>,
  "analysis": "<3-5句自然语言综合评价>",
  "strengths": ["<亮点1>", "<亮点2>", "<亮点3>"],
  "suggestions": ["<建议1>", "<建议2>", "<建议3>"]
}

只返回 JSON，不要任何额外文字。`;
}

// ─── Claude API ────────────────────────────────────────────────────────────────

async function callClaude(prompt, apiKey) {
  const cfg = AI_CONFIG.claude;
  const resp = await fetch(cfg.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      cfg.model,
      max_tokens: cfg.maxTokens,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Claude API ${resp.status}: ${err.error?.message || resp.statusText}`);
  }

  const data = await resp.json();
  return data.content?.[0]?.text || '';
}

// ─── OpenAI API ────────────────────────────────────────────────────────────────

async function callOpenAI(prompt, apiKey) {
  const cfg = AI_CONFIG.openai;
  const resp = await fetch(cfg.endpoint, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:      cfg.model,
      max_tokens: cfg.maxTokens,
      messages:   [{ role: 'user', content: prompt }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`OpenAI API ${resp.status}: ${err.error?.message || resp.statusText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || '';
}

// ─── 解析 AI 返回的 JSON ───────────────────────────────────────────────────────

function parseAIResponse(raw) {
  // 尝试直接 parse
  try {
    return JSON.parse(raw.trim());
  } catch {/* ignore */}

  // 尝试提取 ```json ... ``` 块
  const m = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (m) {
    try { return JSON.parse(m[1]); } catch {/* ignore */}
  }

  // 尝试提取第一个 { ... }
  const objM = raw.match(/\{[\s\S]+\}/);
  if (objM) {
    try { return JSON.parse(objM[0]); } catch {/* ignore */}
  }

  throw new Error('AI 返回格式无法解析');
}
