@~/Documents/Claude/config/global-claude.md

## Project context
- Stack: Next.js 16 (Turbopack) + Prisma + PostgreSQL + multi-LLM (Anthropic, OpenAI, Google GenAI Veo 3)
- Source: github.com/CitizenZM/hackersquad branch `claude/brand-intelligence-platform-dT5Kh`
- Vercel: prj_q3o6bBfw6lAoJvweykzF8Saar6ji → creativeintel.vercel.app
- Internal package name remains `hackersquad`; deployed as `creativeintel`

## CodeGraph
Index at `.codegraph/` — semantic code search, call graph, impact analysis.
- Query: `codegraph context "your task"` or use the MCP tools in Claude Code
- After adding many files: `codegraph sync <project-path>`
- Binary: `~/.local/bin/codegraph`
