/**
 * Sprint 3 — repo 层
 * 简历数据获取：本地文件优先，可选远程 URL。
 * 依赖 config，不引用 service/runtime/ui。
 */

import { RESUME_URL } from '../config/index.js';

// ─── 从本地文件读取 ────────────────────────────────────────────────────────────

/**
 * 读取用户上传的本地 JSON / TXT / PDF 简历文件。
 * @param {File} file
 * @returns {Promise<import('../types/index.js').Resume>}
 */
export async function loadFromFile(file) {
  try {
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.json')) {
      return JSON.parse(await readFileAsText(file));
    }

    if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
      const pdfText = await extractTextFromPdf(file);
      return parseTextResume(pdfText);
    }

    return parseTextResume(await readFileAsText(file));
  } catch (err) {
    throw new Error('文件解析失败：' + err.message);
  }
}

/**
 * 从纯文本简历中提取基础字段（粗解析）。
 * @param {string} text
 * @returns {import('../types/index.js').Resume}
 */
function parseTextResume(text) {
  const lower = text.toLowerCase();
  // 同步技能扫描（避免动态 import，保持函数同步）
  const knownSkills = [
    'python','golang','go','rust','java','javascript','typescript',
    'langchain','rag','llm','ai agent','docker','kubernetes','k8s',
    'postgresql','mysql','redis','kafka','elasticsearch',
    'prometheus','grafana','react','vue','solana','web3',
  ];
  const foundSkills = knownSkills.filter(s => lower.includes(s));

  return {
    name:       extractName(text) || '（未识别）',
    location:   '',
    summary:    text.slice(0, 200),
    skills:     foundSkills,
    experience: [],
    education:  [],
    languages:  [],
  };
}

function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // 取第一行非空行作为姓名猜测
  return lines[0] || null;
}

async function readFileAsText(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(String(e.target.result || ''));
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

async function readFileAsArrayBuffer(file) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

async function extractTextFromPdf(file) {
  const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';

  const data = await readFileAsArrayBuffer(file);
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];

  for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();
    const text = content.items.map(item => item.str || '').join(' ');
    pages.push(text);
  }

  return pages.join('\n').trim();
}

// ─── 主入口 ────────────────────────────────────────────────────────────────────

/**
 * 获取简历数据。优先顺序：本地文件 → 可选远程 URL。
 * @param {{ file?: File }} [opts]
 * @returns {Promise<{ resume: import('../types/index.js').Resume, source: string }>}
 */
export async function loadResume(opts = {}) {
  if (opts.file) {
    const resume = await loadFromFile(opts.file);
    return { resume, source: `本地文件：${opts.file.name}` };
  }

  if (RESUME_URL) {
    const resp = await fetch(RESUME_URL, { mode: 'cors' });
    if (!resp.ok) throw new Error(`简历地址不可用：HTTP ${resp.status}`);

    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('json')) {
      return { resume: await resp.json(), source: '远程简历配置' };
    }

    return { resume: parseTextResume(await resp.text()), source: '远程简历配置' };
  }

  throw new Error('请先上传你的简历文件');
}
