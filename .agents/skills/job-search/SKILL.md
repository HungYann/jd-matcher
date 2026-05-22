---
name: job-search
description: Find relevant roles, compare postings, and identify the best jobs to apply to by matching JD requirements against a resume.
---

# Job Search Skill

## Purpose

Use this skill when the user wants help with job discovery, shortlist creation, JD comparison, or deciding which roles are the best fit to apply to based on a resume and multiple JDs.

## Outcomes

- Search for roles by title, location, seniority, and domain
- Filter weak-fit postings before deeper analysis
- Normalize multiple JDs into a comparable structure
- Rank target jobs by application fit
- Highlight required skills, preferred skills, experience, and education constraints
- Produce clean text or Markdown ready for `JD Matcher`

## Recommended Workflow

1. Confirm target role, market, location, and must-have constraints.
2. Collect candidate postings from job boards, company career pages, or recruiter messages.
3. Remove duplicated or low-signal listings.
4. Normalize each JD into a compact structure.
5. Compare roles and rank them by expected application fit.
6. Keep the highest-fit opportunities for application.
7. Export the final JD block for use in this repo.

## Output Format

```markdown
# Application Target Shortlist

## Role 1
- Title: Senior Backend Engineer
- Company: Example Inc.
- Location: Remote
- Seniority: Senior
- Experience: 5+ years
- Education: Bachelor or above

### Required Skills
- Go
- Distributed systems
- PostgreSQL

### Preferred Skills
- LLM
- RAG
- Kubernetes

### Clean JD
<normalized JD text>

## Role 2
- Title: AI Engineer
- Company: Sample Labs
- Location: Singapore / Remote
- Seniority: Mid-Senior
- Experience: 3+ years
- Education: Flexible

### Required Skills
- Python
- Prompt engineering
- API integration

### Preferred Skills
- LangChain
- Vector database
- Evaluation

### Clean JD
<normalized JD text>

## Recommendation
- Best target to apply: Role 1
- Why: Stronger overlap on must-have backend skills, lower experience gap, and better alignment with current project history
```

## Guardrails

- Preserve the original hiring intent.
- Do not add qualifications that are not present in the source.
- Mark uncertainty when a posting is vague or incomplete.
- Prefer concise, comparable summaries over long raw copy.

## Notes For This Repo

- This skill is documentation-only for now.
- Output should stay compatible with the parser heuristics in `src/service/parser.js`.
- Use this skill before matching when the user starts from job discovery instead of a ready JD.
- The main problem this skill solves is deciding which target岗位最值得优先投递。
