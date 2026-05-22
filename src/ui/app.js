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
const collapseHdr  = $('collapse-header');
const collapseBody = $('collapse-body');
const resumeBadge  = $('resume-badge');
const appName      = $('app-name');
const providerTabs = $('provider-tabs');

// ── 初始化 ────────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', async () => {
  await initConfig();
  applySiteConfig();
  // Trigger hero word-by-word animation
  document.body.classList.add('loaded');
  subscribe(render);

  // 事件绑定
  jdTextarea.addEventListener('input', () => setJDText(jdTextarea.value));
  matchBtn.addEventListener('click', () => runMatch());
  resetBtn.addEventListener('click', handleReset);

  aiToggle.addEventListener('change', syncEngineConfig);
  apiKeyInput.addEventListener('input', syncEngineConfig);

  // Provider tabs
  providerTabs.addEventListener('click', e => {
    const btn = e.target.closest('.provider-tab');
    if (!btn) return;
    providerTabs.querySelectorAll('.provider-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    syncEngineConfig();
  });

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
  const activeTab = providerTabs?.querySelector('.provider-tab.active');
  const provider = activeTab?.dataset.provider || 'claude';
  setEngineConfig(apiKeyInput.value.trim() || null, mode, provider);
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
  const circum = 2 * Math.PI * 50;
  const offset = circum * (1 - r.totalScore / 100);

  return `
<div class="score-header">
  <div class="score-ring-wrap">
    <svg width="130" height="130" viewBox="0 0 130 130">
      <circle class="score-ring-track" cx="65" cy="65" r="50"/>
      <circle class="score-ring-fill" cx="65" cy="65" r="50"
        id="ring-fill"
        stroke="${color}"
        stroke-dasharray="${circum}"
        stroke-dashoffset="${circum}"/>
    </svg>
    <div class="score-ring-text">
      <span class="num" style="color:${color}">${r.totalScore}</span>
      <span class="label">匹配度</span>
    </div>
  </div>

  <div class="score-summary">
    <h2>${jd?.title || '职位匹配分析'}</h2>
    <div class="jd-meta">
      ${jd?.company ? `🏢 ${jd.company}` : ''}
      ${jd?.minYears > 0 ? ` &nbsp;·&nbsp; 📅 ${jd.minYears}年+` : ''}
      ${jd?.eduLevel && jd.eduLevel !== 'any' ? ` &nbsp;·&nbsp; 🎓 ${eduLabel(jd.eduLevel)}` : ''}
    </div>
    <div class="score-badges">
      <span class="grade-badge grade-${grade.grade}">${grade.label}</span>
      <span class="engine-tag ${r.engine === 'ai' ? 'ai' : ''}">${r.engine === 'ai' ? '🤖 AI 分析' : '⚙ 本地算法'}</span>
    </div>
  </div>
</div>

<div class="section-title">维度分析</div>
<div class="dim-bars">
  ${r.dimensions.map((d, i) => `
    <div>
      <div class="dim-row">
        <span class="dim-label">${d.label}</span>
        <div class="dim-bar-bg">
          <div class="dim-bar-fill" id="dim-${i}"
               style="width:0%; background:${scoreColor(d.score)}; box-shadow:0 0 8px ${scoreColor(d.score)}60"></div>
        </div>
        <span class="dim-score" style="color:${scoreColor(d.score)}">${d.score}</span>
      </div>
      <div class="dim-reason">${d.reason}</div>
    </div>
  `).join('')}
</div>

<hr/>

<div class="section-title">技能匹配明细</div>
<div class="skill-tags">
  ${r.skillMatches.length
    ? r.skillMatches.map(m => `
        <span class="skill-tag ${m.matched ? 'match' : 'miss'}">
          ${m.matched ? '✓' : '✗'} ${m.skill}
        </span>`).join('')
    : '<span style="color:var(--text-muted);font-size:.85rem">JD 未检测到具体技能词</span>'
  }
</div>

<hr/>

<div class="insights-grid">
  <div>
    <div class="section-title">💪 候选人亮点</div>
    <ul class="insight-list strength">
      ${r.strengths.map(s => `<li><span class="insight-icon">✦</span><span>${s}</span></li>`).join('')}
    </ul>
  </div>
  <div>
    <div class="section-title">📈 提升建议</div>
    <ul class="insight-list suggest">
      ${r.suggestions.map(s => `<li><span class="insight-icon">→</span><span>${s}</span></li>`).join('')}
    </ul>
  </div>
</div>

${r.aiAnalysis ? `
<hr/>
<div class="ai-block">
  <div class="ai-label">✦ AI 深度评价</div>
  <p>${r.aiAnalysis}</p>
</div>` : ''}
`;
}

// ── 动画 ──────────────────────────────────────────────────────────────────────

function animateBars(r) {
  // 用双 rAF 确保浏览器先完成初始渲染（width:0），再触发过渡动画
  requestAnimationFrame(() => requestAnimationFrame(() => {
    // 得分圆环
    const ring = document.getElementById('ring-fill');
    if (ring) {
      const circum = 2 * Math.PI * 50;
      ring.style.strokeDashoffset = circum * (1 - r.totalScore / 100);
    }
    // 维度进度条
    r.dimensions.forEach((d, i) => {
      const el = document.getElementById(`dim-${i}`);
      if (el) el.style.width = d.score + '%';
    });
  }));
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
