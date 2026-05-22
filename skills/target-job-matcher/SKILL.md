---
name: target-job-matcher
description: Compare a resume against multiple JDs, rank the best-fit target roles, and recommend which jobs to apply to first.
---

# Target Job Matcher Skill

## Problem Solved

This skill solves a job application prioritization problem:
given one resume and multiple target JDs, identify which roles are the best fit and therefore the best jobs to apply to first.

## When To Use

Use this skill when the user already has a resume plus several candidate JDs and wants to know:

- which role is the strongest fit
- which roles are worth applying to now
- which roles have manageable gaps
- which roles should be deprioritized

## Outcomes

- Convert multiple JDs into a consistent comparison format
- Score role fit from resume evidence
- Separate strong-fit, stretch-fit, and low-fit jobs
- Recommend an application priority order
- Produce JD inputs ready for `JD Matcher`

## Recommended Workflow

1. Collect one resume and multiple target JDs.
2. Normalize each JD into title, company, required skills, preferred skills, experience, and education.
3. Compare each JD against resume evidence.
4. Rank the roles by overall fit and application readiness.
5. Explain the strongest match and the biggest gaps for each role.
6. Recommend which jobs to apply to first.

## Output Format

```markdown
# Target Job Ranking

## Rank 1
- Title: Senior Backend Engineer
- Company: Example Inc.
- Fit: High
- Apply Now: Yes
- Why: Core backend stack, infra experience, and seniority all align well

## Rank 2
- Title: AI Engineer
- Company: Sample Labs
- Fit: Medium
- Apply Now: Yes
- Why: Strong LLM overlap, but production evaluation depth is less explicit

## Rank 3
- Title: Staff Data Engineer
- Company: Data Co
- Fit: Low
- Apply Now: No
- Why: Significant gap in staff-level leadership and data platform ownership
```

## Guardrails

- Base judgments on actual resume evidence.
- Do not overstate fit when required skills are missing.
- Separate hard requirements from nice-to-have items.
- Prefer honest prioritization over optimistic ranking.

## Notes For This Repo

- This skill is documentation-only for now.
- It complements `job-search` by focusing on ranking and application decisions, not discovery alone.
- It maps directly to the product goal of using JD + 简历 to find the best target岗位投递.
