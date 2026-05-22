# JD Matcher — Harness Dev Protocol

## 项目目标

将 JD（职位描述）文本与求职者简历进行多维度匹配度计算，帮助用户从多个目标岗位中筛选出最适合投递的岗位，并输出可视化 HTML 报告。

---

## 三 Agent 开发架构

```
Planner ──sprint contract──► Generator ──► Evaluator
   ▲                                           │
   └─────────── feedback / next sprint ◄───────┘
```

| Agent         | 职责                                                          |
| ------------- | ------------------------------------------------------------- |
| **Planner**   | 拆解需求 → 制定 sprint contract → 生成验收标准                |
| **Generator** | 按 contract 实现功能，输出可运行代码                          |
| **Evaluator** | 底层用断言验收；UI 层用 Playwright/手动 验收                  |

---

## Sprint Contract 格式

```
## Sprint #{n}
goal:        # 本轮要实现的单一功能
impl:        # Generator 的实现方案
criteria:    # 可测试的成功标准
layer:       # 涉及的依赖层
blocked_by:  # 依赖的前序 sprint（无则 none）
```

---

## 依赖层级（不可逆向依赖）

```
types → config → repo → service → runtime → ui
```

```
src/
├── types/      # 纯数据结构定义（无副作用）
├── config/     # 常量与配置（依赖 types）
├── repo/       # 数据获取（URL fetch / 本地文件）
├── service/    # 业务逻辑（解析器、匹配算法、AI 调用）
├── runtime/    # 状态管理（store）
└── ui/         # HTML + CSS + JS 界面层
```

---

## Sprint 总计划

| Sprint | Goal              | Layer           | 状态 |
|--------|-------------------|-----------------|------|
| S1     | 数据结构定义       | types           | ✅   |
| S2     | 配置与权重         | config          | ✅   |
| S3     | 简历数据仓库       | repo            | ✅   |
| S4     | JD 解析器          | service/parser  | ✅   |
| S5     | 本地匹配算法       | service/matcher | ✅   |
| S6     | AI 增强匹配        | service/ai      | ✅   |
| S7     | 状态管理           | runtime         | ✅   |
| S8     | UI 主界面          | ui              | ✅   |

---

## 技术栈

- **运行时**：纯浏览器（无需 Node.js/npm），ES Modules via `<script type="module">`
- **UI**：Vanilla HTML5 / CSS3 / JavaScript（ES2022）
- **图表**：Chart.js 4.x（CDN）
- **AI 接入**：Claude API / OpenAI API（可选，用户填 API Key）
- **本地算法**：TF-IDF 关键词权重 + 多维加权评分
- **测试**：手动 + `tests/unit/` 纯 JS 断言

---

## 核心规则

1. 每次对话只执行一个 sprint，Evaluator 未通过禁止进入下一 sprint
2. 依赖层违规 → Planner 拒绝 contract
3. UI 层不直接操作 repo 或 service，必须经由 runtime/store
4. 所有异步操作通过 Promise/async-await，禁止回调嵌套
5. AI 调用失败必须 fallback 到本地算法，不能白屏

---

## 其他

当用户做出不太合理的选择时，果断提醒并提出更好方案。
