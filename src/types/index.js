/**
 * Sprint 1 — types 层
 * 所有数据结构定义。无副作用，不引用任何上层模块。
 */

// ─── JD（职位描述） ──────────────────────────────────────────────────────────

/**
 * @typedef {Object} ParsedJD
 * @property {string}   rawText        - 原始 JD 文本
 * @property {string}   title          - 职位名称
 * @property {string}   company        - 公司名称
 * @property {string[]} requiredSkills - 硬性要求技能列表
 * @property {string[]} niceSkills     - 加分技能列表
 * @property {number}   minYears       - 最低工作年限要求（-1 = 未提及）
 * @property {string}   eduLevel       - 学历要求 'bachelor' | 'master' | 'phd' | 'any'
 * @property {string[]} keywords       - 所有关键词（用于权重计算）
 */

// ─── 简历 ────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} ResumeExperience
 * @property {string}   company    - 公司名
 * @property {string}   title      - 职位
 * @property {string}   from       - 开始时间 'YYYY.MM'
 * @property {string}   to         - 结束时间 'YYYY.MM' | 'present'
 * @property {string}   desc       - 描述
 * @property {string[]} techStack  - 技术栈标签
 */

/**
 * @typedef {Object} ResumeEducation
 * @property {string} school
 * @property {string} degree   - 'bachelor' | 'master' | 'phd'
 * @property {string} major
 * @property {string} from
 * @property {string} to
 * @property {string} gpa
 */

/**
 * @typedef {Object} Resume
 * @property {string}              name
 * @property {string}              location
 * @property {string}              summary
 * @property {string[]}            skills        - 扁平技能列表
 * @property {ResumeExperience[]}  experience
 * @property {ResumeEducation[]}   education
 * @property {string[]}            languages
 */

// ─── 匹配结果 ─────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} SkillMatch
 * @property {string}  skill
 * @property {boolean} matched
 * @property {string}  [source]  - 在简历中匹配到的原文（matched=true 时）
 */

/**
 * @typedef {Object} DimensionScore
 * @property {string} label
 * @property {number} score     - 0~100
 * @property {string} reason    - 简短说明
 */

/**
 * @typedef {Object} MatchResult
 * @property {number}           totalScore      - 总分 0~100
 * @property {DimensionScore[]} dimensions      - 多维得分 [技能, 经验, 教育]
 * @property {SkillMatch[]}     skillMatches    - 逐条技能匹配明细
 * @property {string[]}         missingSkills   - 缺失技能
 * @property {string[]}         strengths       - 优势亮点
 * @property {string[]}         suggestions     - 优化建议
 * @property {'local'|'ai'}     engine          - 使用的匹配引擎
 * @property {string}           [aiAnalysis]    - AI 的自然语言分析（可选）
 */

// ─── 应用状态 ─────────────────────────────────────────────────────────────────

/**
 * @typedef {'idle'|'loading'|'matching'|'done'|'error'} AppStatus
 */

/**
 * @typedef {Object} AppState
 * @property {AppStatus}       status
 * @property {string}          jdText
 * @property {ParsedJD|null}   parsedJD
 * @property {Resume|null}     resume
 * @property {MatchResult|null} result
 * @property {string|null}     error
 * @property {string|null}     apiKey
 * @property {'local'|'ai'}    engineMode
 */

export const EMPTY_STATE = {
  status:     'idle',
  jdText:     '',
  parsedJD:   null,
  resume:     null,
  result:     null,
  error:      null,
  apiKey:     null,
  engineMode: 'local',
};
