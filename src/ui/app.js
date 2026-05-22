/**
 * Sprint 8 — ui/app.js
 * 界面逻辑：监听 store、操作 DOM。
 * 唯一可以引用 runtime/store 的层，禁止直接调用 service/repo。
 */

import { initConfig, SITE_CONFIG } from '../config/index.js';
import {
  getState, subscribe,
  setJDText, setEngineConfig,
  loadResumeAction, runMatch, reset,
} from '../runtime/store.js';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const jdTextarea   = $('jd-input');
const matchBtn     = $('match-btn');
const resetBtn     = $('reset-btn');
const fileInput    = $('file-input');
const uploadZone   = $('upload-zone');
const apiKeyInput  = $('api-key');
const aiToggle     = $('ai-toggle');
const resultSection= $('result-section');
const engineBadge  = $('engine-badge');
const collapseHdr  = $('collapse-header');
const collapseBody = $('collapse-body');
const resumeBadge  = $('resume-badge');
const appName      = $('app-name');

// ── 初始化 ────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', async () => {
  await initConfig();
  applySiteConfig();
  subscribe(render);

  // 事件绑定
  jdTextarea.addEventListener('input', () => setJDText(jdTextarea.value));
  matchBtn.addEventListener('click', () => runMatch());
  resetBtn.addEventListener('click', handleReset);

  aiToggle.addEventListener('change', syncEngineConfig);
  apiKeyInput.addEventListener('input', syncEngineConfig);

  // 折叠
  collapseHdr.addEventListener('click', () => {
    const open = collapseBody.classList.toggle('open');
    collapseHdr.classList.toggle('open', open);
  });

  // 文件上传
  fileInput.addEventListener('change', handleFileSelect);
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  });
});

// ── 事件处理 ──────────────────────────────────────────────────────────────────

function syncEngineConfig() {
  const mode = aiToggle.checked ? 'ai' : 'local';
  setEngineConfig(apiKeyInput.value.trim() || null, mode);
}

async function handleFileSelect() {
  const f = fileInput.files[0];
  if (f) await handleFile(f);
}

async function handleFile(file) {
  await loadResumeAction({ file });
}

function handleReset() {
  reset();
  jdTextarea.value = '';
  apiKeyInput.value = '';
  aiToggle.checked = false;
  resultSection.innerHTML = emptyState();
}

function applySiteConfig() {
  document.title = SITE_CONFIG.appTitle;
  if (appName) appName.textContent = SITE_CONFIG.appName;
}

// ── 渲染 ──────────────────────────────────────────────────────────────────────

function render(state) {
  // 按钮状态
  const busy = state.status === 'loading' || state.status === 'matching';
  matchBtn.disabled = busy || !state.jdText.trim();
  matchBtn.innerHTML = busy
    ? '<span class="spinner"></span> 计算中…'
    : '⚡ 开始匹配';

  // Engine 徽章
  const isAI = state.engineMode === 'ai' && state.apiKey;
  engineBadge.textContent = isAI ? '🤖 AI 增强' : '⚙️ 本地算法';
  engineBadge.className   = 'engine-badge' + (isAI ? ' ai' : '');

  // 简历来源徽章
  if (state.resumeSource) {
    resumeBadge.innerHTML = `✅ ${state.resumeSource}`;
    resumeBadge.style.display = 'inline-flex';
  } else {
    resumeBadge.style.display = 'none';
  }

  // 错误
  if (state.status === 'error') {
    resultSection.innerHTML = `<div class="error-bar">❌ ${state.error}</div>`;
    return;
  }

  // 加载中
  if (state.status === 'matching') {
    resultSection.innerHTML = `
      <div class="status-bar">
        <span class="spinner"></span>
        正在分析 JD，计算匹配度…
      </div>`;
    return;
  }

  // 结果
  if (state.result) {
    resultSection.innerHTML = renderResult(state.result, state.parsedJD);
    animateBars(state.result);
    return;
  }

  // 空状态
  resultSection.innerHTML = emptyState();
}

// ── 结果渲染 ──────────────────────────────────────────────────────────────────

function renderResult(r, jd) {
  const grade  = scoreGrade(r.totalScore);
  const color  = scoreColor(r.totalScore);
  const circum = 2 * Math.PI * 54;   // r=54 的圆周长
  const offset = circum * (1 - r.totalScore / 100);

  return `
<div class="score-header">
  <div class="score-ring-wrap">
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle class="score-ring-track" cx="70" cy="70" r="54"/>
      <circle class="score-ring-fill" cx="70" cy="70" r="54"
        id="ring-fill"
        stroke="${color}"
        stroke-dasharray="${circum}"
        stroke-dashoffset="${offset}"/>
    </svg>
    <div class="score-ring-text">
      <span class="num" style="color:${color}">${r.totalScore}</span>
      <span class="label">匹配度</span>
    </div>
  </div>

  <div class="score-summary">
    <h2>${jd?.title || '职位匹配分析'}</h2>
    <div class="jd-meta">
      ${jd?.company ? `🏢 ${jd.company} · ` : ''}
      ${jd?.minYears > 0 ? `📅 ${jd.minYears}年+ · ` : ''}
      ${jd?.eduLevel !== 'any' ? `🎓 ${eduLabel(jd.eduLevel)}` : ''}
    </div>
    <div style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      <span class="grade-badge grade-${grade.grade}">${grade.label}</span>
      <span class="engine-tag ${r.engine === 'ai' ? 'ai' : ''}">${r.engine === 'ai' ? '🤖 AI 分析' : '⚙️ 本地算法'}</span>
    </div>
  </div>
</div>

<hr/>

<!-- 维度分 -->
<div class="card-title">维度分析</div>
<div class="dim-bars">
  ${r.dimensions.map((d, i) => `
    <div>
      <div class="dim-row">
        <span class="dim-label">${d.label}</span>
        <div class="dim-bar-bg">
          <div class="dim-bar-fill" id="dim-${i}"
               style="width:0%; background:${scoreColor(d.score)}"></div>
        </div>
        <span class="dim-score" style="color:${scoreColor(d.score)}">${d.score}</span>
      </div>
      <div style="padding-left:82px"><span class="dim-reason">${d.reason}</span></div>
    </div>
  `).join('')}
</div>

<hr/>

<!-- 技能标签 -->
<div class="card-title">技能匹配明细</div>
<div class="skill-tags">
  ${r.skillMatches.length
    ? r.skillMatches.map(m => `
        <span class="skill-tag ${m.matched ? 'match' : 'miss'}">
          ${m.matched ? '✓' : '✗'} ${m.skill}
        </span>`).join('')
    : '<span style="color:var(--text-muted); font-size:.85rem">JD 未检测到具体技能词</span>'
  }
</div>

<hr/>

<div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; flex-wrap:wrap;">
  <!-- 优势 -->
  <div>
    <div class="card-title">💪 候选人亮点</div>
    <ul class="insight-list strength">
      ${r.strengths.map(s => `<li><span class="insight-icon">✦</span>${s}</li>`).join('')}
    </ul>
  </div>
  <!-- 建议 -->
  <div>
    <div class="card-title">📈 提升建议</div>
    <ul class="insight-list suggest">
      ${r.suggestions.map(s => `<li><span class="insight-icon">→</span>${s}</li>`).join('')}
    </ul>
  </div>
</div>

${r.aiAnalysis ? `
<div class="ai-block">
  <div class="ai-label">🤖 AI 深度评价</div>
  <p>${r.aiAnalysis}</p>
</div>` : ''}
`;
}

// ── 动画 ──────────────────────────────────────────────────────────────────────

function animateBars(r) {
  // 维度进度条
  r.dimensions.forEach((d, i) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`dim-${i}`);
      if (el) el.style.width = d.score + '%';
    });
  });
}

// ── 工具 ──────────────────────────────────────────────────────────────────────

function scoreColor(score) {
  if (score >= 80) return 'var(--success)';
  if (score >= 60) return 'var(--accent)';
  if (score >= 40) return 'var(--warn)';
  return 'var(--danger)';
}

function scoreGrade(score) {
  if (score >= 85) return { grade: 'S', label: 'S 强烈推荐' };
  if (score >= 70) return { grade: 'A', label: 'A 推荐' };
  if (score >= 55) return { grade: 'B', label: 'B 一般匹配' };
  return             { grade: 'C', label: 'C 差距较大' };
}

function eduLabel(level) {
  return { phd:'博士', master:'硕士', bachelor:'本科', any:'不限' }[level] || level;
}

function emptyState() {
  return `
<div class="empty-state">
  <div class="icon">🎯</div>
  <p>粘贴 JD 文本后点击「开始匹配」<br/>即可看到多维度匹配分析报告</p>
</div>`;
}
