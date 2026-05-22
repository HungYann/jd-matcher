/**
 * Sprint 2 — config 层
 * 常量、权重、关键词词库。依赖 types，不引用 repo/service/ui。
 */

const DEFAULT_ENV = {
  JDM_APP_TITLE: 'Dream Offer Matcher — 目标岗位匹配分析',
  JDM_APP_NAME: 'Dream Offer Matcher',
  JDM_RESUME_URL: '',
  JDM_CLAUDE_ENDPOINT: 'https://api.anthropic.com/v1/messages',
  JDM_CLAUDE_MODEL: 'claude-haiku-4-5',
  JDM_CLAUDE_MAX_TOKENS: '1024',
  JDM_OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
  JDM_OPENAI_MODEL: 'gpt-4o-mini',
  JDM_OPENAI_MAX_TOKENS: '1024',
};

let configInitPromise = null;

export let SITE_CONFIG = buildSiteConfig(DEFAULT_ENV);
export let RESUME_URL = SITE_CONFIG.resumeUrl;
export let AI_CONFIG = buildAIConfig(DEFAULT_ENV);

export async function initConfig() {
  if (!configInitPromise) {
    configInitPromise = loadEnvFile()
      .then((envMap) => {
        const merged = { ...DEFAULT_ENV, ...envMap };
        SITE_CONFIG = buildSiteConfig(merged);
        RESUME_URL = SITE_CONFIG.resumeUrl;
        AI_CONFIG = buildAIConfig(merged);
        return merged;
      })
      .catch(() => DEFAULT_ENV);
  }

  return configInitPromise;
}

// ─── 匹配权重 ─────────────────────────────────────────────────────────────────

export const WEIGHTS = {
  skill:      0.50,   // 技能匹配占 50%
  experience: 0.30,   // 经验年限占 30%
  education:  0.20,   // 学历占 20%
};

// ─── 简历数据源 ────────────────────────────────────────────────────────────────

// ─── 学历映射 ─────────────────────────────────────────────────────────────────

export const EDU_LEVEL_MAP = {
  phd:      4,
  master:   3,
  bachelor: 2,
  any:      1,
};

// ─── 学历识别关键词 ────────────────────────────────────────────────────────────

export const EDU_KEYWORDS = {
  phd:      ['phd', 'doctorate', '博士', 'ph.d'],
  master:   ['master', 'msc', 'm.s', '硕士', 'graduate'],
  bachelor: ['bachelor', 'bsc', 'b.s', '本科', '学士', 'undergraduate', 'degree'],
};

// ─── 技能词库（用于 JD 关键词提取） ───────────────────────────────────────────

export const SKILL_DICTIONARY = {
  // ── 编程语言
  languages: [
    'python', 'golang', 'go', 'rust', 'java', 'javascript', 'typescript',
    'c++', 'c#', 'ruby', 'scala', 'kotlin', 'swift', 'php', 'r',
  ],
  // ── AI / ML
  ai: [
    'langchain', 'langgraph', 'rag', 'llm', 'gpt', 'claude', 'openai',
    'embedding', 'vector database', 'pinecone', 'weaviate', 'chroma',
    'prompt engineering', 'fine-tuning', 'hugging face', 'transformers',
    'tensorflow', 'pytorch', 'scikit-learn', 'agent', 'multi-agent',
    'llama', 'mistral', 'anthropic', 'ai agent',
  ],
  // ── 后端 & 框架
  backend: [
    'gin', 'echo', 'fastapi', 'flask', 'django', 'express', 'nest.js',
    'grpc', 'graphql', 'rest api', 'microservices', 'websocket',
    'oauth', 'jwt', 'api gateway',
  ],
  // ── 数据库
  database: [
    'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'elasticsearch',
    'kafka', 'rabbitmq', 'clickhouse', 'sqlite', 'dynamodb', 's3',
    'cassandra', 'neo4j', 'influxdb',
  ],
  // ── 区块链 / Web3
  web3: [
    'solana', 'ethereum', 'web3', 'smart contract', 'defi', 'nft',
    'sui', 'solidity', 'rust on-chain', 'anchor', 'rpc node',
  ],
  // ── DevOps & 基础设施
  devops: [
    'docker', 'kubernetes', 'k8s', 'helm', 'terraform', 'ansible',
    'ci/cd', 'github actions', 'jenkins', 'prometheus', 'grafana',
    'datadog', 'elk', 'aws', 'gcp', 'azure', 'cloudflare',
  ],
  // ── 数据工程
  data: [
    'spark', 'hadoop', 'flink', 'airflow', 'dbt', 'etl', 'data pipeline',
    'pandas', 'numpy', 'big data', 'data warehouse', 'tableau',
  ],
};

// 合并为平铺数组，方便匹配
export const ALL_SKILLS = Object.values(SKILL_DICTIONARY).flat();

// ─── 经验年限识别模式 ──────────────────────────────────────────────────────────

export const EXPERIENCE_PATTERNS = [
  /(\d+)\+?\s*年.*?经[验历]/,
  /(\d+)\+?\s*years?\s+of\s+experience/i,
  /(\d+)\+?\s*years?\s+experience/i,
  /experience.*?(\d+)\+?\s*years?/i,
  /至少\s*(\d+)\s*年/,
  /minimum\s+(\d+)\s+years?/i,
];

// ─── 浏览器侧 .env 解析 ───────────────────────────────────────────────────────

async function loadEnvFile() {
  const response = await fetch('/.env', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load .env: HTTP ${response.status}`);
  const text = await response.text();
  return parseEnv(text);
}

function parseEnv(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .reduce((env, line) => {
      const idx = line.indexOf('=');
      if (idx <= 0) return env;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      env[key] = value;
      return env;
    }, {});
}

function buildSiteConfig(env) {
  return {
    appTitle: env.JDM_APP_TITLE,
    appName: env.JDM_APP_NAME,
    resumeUrl: env.JDM_RESUME_URL,
  };
}

function buildAIConfig(env) {
  return {
    claude: {
      endpoint: env.JDM_CLAUDE_ENDPOINT,
      model: env.JDM_CLAUDE_MODEL,
      maxTokens: toPositiveInt(env.JDM_CLAUDE_MAX_TOKENS, 1024),
    },
    openai: {
      endpoint: env.JDM_OPENAI_ENDPOINT,
      model: env.JDM_OPENAI_MODEL,
      maxTokens: toPositiveInt(env.JDM_OPENAI_MAX_TOKENS, 1024),
    },
  };
}

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
