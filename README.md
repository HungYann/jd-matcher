# 🎯 Dream Offer Matcher

**Multi-dimensional job description × résumé matching analysis — runs entirely in the browser, no backend required.**

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Live App](https://img.shields.io/badge/app-live-brightgreen)](https://jd-matcher-app.vercel.app/src/ui/index.html)
[![Docs](https://img.shields.io/badge/docs-fumadocs-purple)](https://jd-matcher-76vw.vercel.app/docs)

---

## ✨ What It Does

Paste any job description, upload your résumé, and get an instant weighted match score with actionable insights — powered by local algorithms and optionally enhanced by Claude or OpenAI.

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Skills    | 50 %   | Keyword match against a curated 7-category skill dictionary |
| Experience | 30 % | Years of experience vs. JD requirement |
| Education  | 20 % | Degree level vs. minimum requirement |

AI blend (when enabled): `AI × 0.6 + local × 0.4`

---

## 🚀 Live Demo

| Link | Description |
|------|-------------|
| [**App →**](https://jd-matcher-app.vercel.app/src/ui/index.html) | The matching tool |
| [**Docs →**](https://jd-matcher-76vw.vercel.app/docs) | Design docs, architecture, Sprint history |

---

## 📦 Project Structure

```
jd-matcher/
├── src/
│   ├── types/        # JSDoc type definitions (ParsedJD, Resume, MatchResult)
│   ├── config/       # Weights, skill dictionary, .env loader
│   ├── repo/         # Resume file loader (JSON / TXT / PDF)
│   ├── service/
│   │   ├── parser.js     # JD text → structured fields
│   │   ├── matcher.js    # Local weighted scoring
│   │   └── aiMatcher.js  # Claude / OpenAI blend
│   ├── runtime/      # Pub/sub store (subscribe / setState)
│   └── ui/           # index.html · style.css · app.js
├── .claude/
│   └── skills/
│       ├── job-search/         # Skill: discover & shortlist JDs
│       └── target-job-matcher/ # Skill: rank multiple JDs vs résumé
├── docs-site/        # Fumadocs documentation site (Next.js 15)
├── tests/unit/       # Pure-JS assertion tests
├── .env.example      # Configuration template
├── CLAUDE.md         # Harness dev protocol (auto-loaded by Claude Code)
└── AGENTS.md         # Same protocol for other AI tools
```

**Dependency layers (strict, unidirectional):**
```
types → config → repo → service → runtime → ui
```

---

## 🛠 Local Development

### Prerequisites

| Tool | Version | Note |
|------|---------|-------|
| Python | 3.x | Serve static files |
| Node.js | 18+ | Only for `npm run lint` (optional) |
| Browser | Modern | ES Modules + FileReader API |

### Run the app

```bash
# Clone
git clone https://github.com/HungYann/jd-matcher.git
cd jd-matcher

# Start a local HTTP server (required — ES Modules need HTTP, not file://)
python3 -m http.server 4173

# Open
open http://localhost:4173
```

> ⚠️ **Must** use an HTTP server. Opening `index.html` directly with `file://` will block ES Module imports and `fetch()`.

### Configure (optional)

```bash
cp .env.example .env
# Edit .env to set your API keys, custom model, or remote résumé URL
```

| Variable | Default | Description |
|----------|---------|-------------|
| `JDM_APP_NAME` | `Dream Offer Matcher` | App display name |
| `JDM_RESUME_URL` | _(empty)_ | Remote résumé URL to auto-load |
| `JDM_CLAUDE_MODEL` | `claude-haiku-4-5` | Claude model to use |
| `JDM_OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model to use |

### Run tests

```bash
node tests/unit/run.js   # Unit assertions

npm run lint             # JS syntax check
# equivalent to: find src -name '*.js' -exec node --check {} \;
```

---

## 🤖 Using the Matcher

### Step 1 — Paste a JD

Copy any job description into the text area. Example:

```
Senior Backend Engineer
Requirements:
- 3+ years Go / Python experience
- Kubernetes, Docker
- LLM / AI Agent experience preferred
- Bachelor's degree in CS
```

### Step 2 — Upload your résumé

Drag & drop or click to upload. **JSON format gives the best accuracy:**

```json
{
  "name": "Your Name",
  "skills": ["Go", "Python", "Kubernetes", "Docker", "LLM"],
  "experience": [
    { "company": "Example Corp", "years": 4, "role": "Backend Engineer" }
  ],
  "education": { "level": "bachelor", "major": "Computer Science" }
}
```

TXT and PDF are also supported (keyword scan, lower accuracy).

### Step 3 — Run Analysis

Click **Run Analysis**. Results include:

- **Score ring** — overall match percentage (0–100)
- **Grade** — S / A / B / C
- **Dimension breakdown** — skill / experience / education bars
- **Skill detail** — matched ✓ and missing ✗ skills
- **Strengths & suggestions** — actionable insights
- **AI evaluation** _(optional)_ — natural-language assessment

### Optional — Enable AI

1. Toggle **AI Enhancement**
2. Paste your API key (`sk-ant-…` for Claude, `sk-…` for OpenAI)
3. Re-run analysis

> Your API key is used locally only and is never sent to this project's servers.

---

## 🧠 Claude Code Skills

Two [Claude Code Skills](https://jd-matcher-76vw.vercel.app/docs/skills) are included in `.claude/skills/`:

| Skill | Trigger | Purpose |
|-------|---------|---------|
| `job-search` | `/job-search` or "帮我找工作" | Search job boards, normalize JDs, rank fit |
| `target-job-matcher` | `/target-job-matcher` or "哪个岗位最合适" | Compare résumé vs multiple JDs, recommend priority |

**Recommended workflow:**
```
/job-search          →  discover & shortlist JDs
/target-job-matcher  →  rank which to apply to first
Paste top JD         →  deep analysis in this tool
```

To install globally (available in all your projects):
```bash
cp -r .claude/skills/job-search ~/.claude/skills/
cp -r .claude/skills/target-job-matcher ~/.claude/skills/
```

---

## 🚢 Deploy

The main app is a static site — no build step needed.

### Vercel (recommended)

```bash
# From the repo root
npx vercel
# Set Framework: Other
# Root Directory: (leave empty)
```

Or connect the GitHub repo in the Vercel dashboard:
- **Root Directory:** _(empty, i.e. repo root)_
- **Framework:** Other

> The documentation site (`docs-site/`) is deployed as a **separate** Vercel project with Root Directory set to `docs-site/`.

### GitHub Pages / Netlify / Cloudflare Pages

Deploy the repo root as a static site. No build command required.

> ⚠️ Do **not** commit `.env` — it contains your API keys. Configure secrets via your hosting provider's environment variable settings.

---

## 📚 Documentation

Full design docs live at **[jd-matcher-76vw.vercel.app/docs](https://jd-matcher-76vw.vercel.app/docs)**:

- [Architecture & dependency layers](https://jd-matcher-76vw.vercel.app/docs/architecture)
- [Sprint history (S1–S8)](https://jd-matcher-76vw.vercel.app/docs/sprints)
- [Module docs](https://jd-matcher-76vw.vercel.app/docs/modules)
- [Configuration reference](https://jd-matcher-76vw.vercel.app/docs/configuration)
- [Developer guide](https://jd-matcher-76vw.vercel.app/docs/dev-guide)
- [Harness compliance audit](https://jd-matcher-76vw.vercel.app/docs/harness-audit)

---

## 🤝 Contributing

1. Fork → create a feature branch
2. Follow the [Harness dev protocol](CLAUDE.md) — one Sprint per PR
3. Run `node tests/unit/run.js` before submitting
4. Open a pull request against `main`

---

## 📄 License

[MIT](LICENSE) © 2026 HungYann
