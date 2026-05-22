/**
 * Sprint 7 — runtime/store
 * 轻量级响应式状态管理。UI 层通过 subscribe 监听变化。
 * 依赖 types/config/repo/service，不引用 ui。
 */

import { EMPTY_STATE } from '../types/index.js';
import { loadResume }  from '../repo/resumeRepo.js';
import { parseJD }     from '../service/parser.js';
import { computeMatch } from '../service/matcher.js';
import { computeMatchWithAI } from '../service/aiMatcher.js';

// ─── Store 内部状态 ────────────────────────────────────────────────────────────

let state = { ...EMPTY_STATE };
const listeners = new Set();

// ─── 状态读取 ─────────────────────────────────────────────────────────────────

export function getState() {
  return { ...state };
}

// ─── 订阅 ─────────────────────────────────────────────────────────────────────

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);   // 返回取消订阅函数
}

function notify() {
  listeners.forEach(fn => fn({ ...state }));
}

// ─── 状态更新 ─────────────────────────────────────────────────────────────────

function setState(patch) {
  state = { ...state, ...patch };
  notify();
}

// ─── Actions ──────────────────────────────────────────────────────────────────

/** 更新 JD 文本 */
export function setJDText(text) {
  setState({ jdText: text, result: null, parsedJD: null, error: null });
}

/** 更新 API Key 和引擎模式 */
export function setEngineConfig(apiKey, engineMode) {
  setState({ apiKey, engineMode });
}

/**
 * 加载简历（本地文件 / 可选远程 URL）。
 * @param {{ file?: File }} opts
 */
export async function loadResumeAction(opts = {}) {
  setState({ status: 'loading', error: null });
  try {
    const { resume, source } = await loadResume(opts);
    setState({ resume, status: 'idle', resumeSource: source });
  } catch (err) {
    setState({ status: 'error', error: '简历加载失败：' + err.message });
  }
}

/**
 * 执行 JD 解析 + 匹配计算。
 */
export async function runMatch() {
  const { jdText, resume, apiKey, engineMode } = state;

  if (!jdText.trim()) {
    setState({ error: '请先粘贴 JD 文本' }); return;
  }

  setState({ status: 'matching', error: null, result: null });

  try {
    // 1. 解析 JD
    const parsedJD = parseJD(jdText);
    setState({ parsedJD });

    // 2. 确保简历已加载
    const finalResume = resume;
    if (!finalResume) {
      throw new Error('请先上传你的简历（支持 JSON / TXT / PDF）');
    }

    // 3. 计算匹配
    let result;
    if (engineMode === 'ai' && apiKey) {
      const provider = apiKey.startsWith('sk-ant') ? 'claude' : 'openai';
      result = await computeMatchWithAI(parsedJD, finalResume, { apiKey, provider });
    } else {
      result = computeMatch(parsedJD, finalResume);
    }

    setState({ result, status: 'done' });
  } catch (err) {
    setState({ status: 'error', error: '匹配计算失败：' + err.message });
  }
}

/** 重置 */
export function reset() {
  setState({ ...EMPTY_STATE });
}
