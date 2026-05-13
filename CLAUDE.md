@AGENTS.md

# MOP v4.5 — Master Orchestration Protocol

This project uses MOP v4.5 for all non-trivial tasks. Skill is vendored at
`.claude/skills/mop-master/SKILL.md` and is the first reference for any
build/create/develop/research/plan/workflow/report request.

Triggers (load skill FIRST on these):
- Any build / create / develop / research / plan / workflow / report task
- Multi-step tasks (3+ subtasks)
- Anything requiring orchestration, parallel fan-out, or supervisor loops

Skip MOP for: trivial Q&A, single-file edits, single shell commands. Use
`--mop-off` flag to bypass.

## Project context for MOP runs
- Stack: Next.js 16 (Turbopack) + Prisma + PostgreSQL + multi-LLM (Anthropic, OpenAI, Google GenAI Veo 3)
- Source: github.com/CitizenZM/hackersquad branch `claude/brand-intelligence-platform-dT5Kh`
- Vercel: prj_q3o6bBfw6lAoJvweykzF8Saar6ji → creativeintel.vercel.app
- Internal package name remains `hackersquad`; deployed as `creativeintel`
