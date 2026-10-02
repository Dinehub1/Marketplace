# 🚀 Antigravity Kit — Top Use Cases

> Installed via `npx @vudovn/ag-kit init`  
> Source: [github.com/vudovn/antigravity-kit](https://github.com/vudovn/antigravity-kit)

Antigravity Kit is an **AI Agent template system** that ships with specialist agents, slash-command workflows, and modular skills. Below are the most impactful ways to use it.

---

## 🧠 1. Automatic Intelligent Agent Routing

Just describe what you need — no need to mention agents.

```text
"Add JWT authentication"
→ 🤖 Applying @security-auditor + @backend-specialist...

"Fix the dark mode button"
→ 🤖 Using @frontend-specialist...

"Login returns 500 error"
→ 🤖 Using @debugger for systematic analysis...
```

**Why it matters:** You get specialist-level responses without needing to know which agent to call. The AI silently detects your domain (frontend, backend, security, etc.) and applies the right expert.

---

## 🏗️ 2. Full-Stack App Creation (`/create`)

```text
/create landing page with hero section, pricing, and contact form
/create REST API for a task management system
/create mobile app for food delivery with auth
```

Triggers the **App Builder skill**: determines project type, selects tech stack, scaffolds the full structure, and writes the code. Works for web (Next.js/React), mobile (React Native/Flutter), and backend (Node.js/Python).

---

## 🐛 3. Systematic Debugging (`/debug`)

```text
/debug why login fails after OTP verification
/debug memory leak in the React component
/debug 500 error on POST /api/orders
```

Activates the **@debugger** agent with a 4-phase methodology: Observe → Hypothesize → Test → Fix. Produces root cause analysis with evidence-backed verification steps.

---

## 📐 4. Project Planning Without Code (`/plan`)

```text
/plan a multi-tenant SaaS subscription system
/plan database schema for an e-commerce platform
/plan authentication flow with roles and permissions
```

Uses the **@project-planner** agent (4-phase: Analysis → Planning → Solutioning → Implementation). Outputs a structured `{task-slug}.md` plan with task breakdown and verification criteria — **no code written until Phase 4**.

---

## 🎨 5. Premium UI/UX Design (`/ui-ux-pro-max`)

```text
/ui-ux-pro-max dashboard for a SaaS analytics product
/ui-ux-pro-max onboarding flow for a fintech app
/ui-ux-pro-max mobile profile screen with dark mode
```

Applies the **frontend-specialist** + **mobile-developer** agents with deep design thinking: anti-cliché rules, Purple Ban enforcement, glassmorphism, micro-animations, and modern typography. Produces premium, non-generic UIs.

---

## 🔒 6. Security Auditing

```text
"Audit my authentication flow for vulnerabilities"
"Check my API routes for injection risks"
"Review my RLS policies in Supabase"
```

Activates the **@security-auditor** and **@penetration-tester** agents using OWASP 2025 and MITRE ATT&CK frameworks. Identifies OTP leaks, JWT bypasses, RLS gaps, supply chain risks, and more.

---

## 🔄 7. Feature Enhancement (`/enhance`)

```text
/enhance add dark mode to the existing settings screen
/enhance add pagination to the orders API endpoint
/enhance add push notifications to the mobile app
```

Iterative development workflow: reads the existing codebase first, identifies impact surface, then applies changes safely. Great for evolving live projects without breaking existing logic.

---

## 🧪 8. Automated Testing (`/test`)

```text
/test generate unit tests for the authService module
/test run all tests and show coverage
/test create E2E tests for the checkout flow
```

Implements the **testing pyramid** (Unit → Integration → E2E) with AAA pattern. Supports Jest, Vitest, Playwright, and React Testing Library out of the box.

---

## 🚀 9. Production Deployment (`/deploy`)

```text
/deploy to Vercel
/deploy run pre-flight checks
/deploy with rollback strategy for the payment service
```

Runs a **5-phase safe deployment**: Security scan → Lint → Schema check → Tests → Lighthouse audit. Enforces rollback strategies and verifies secrets security before any production push.

---

## 🤝 10. Multi-Agent Orchestration (`/orchestrate`)

```text
/orchestrate security + performance audit of my entire API
/orchestrate plan and implement a full auth system
/orchestrate review this PR from security, UX, and performance angles
```

Coordinates multiple specialist agents in parallel for complex, multi-domain tasks. Uses the **@orchestrator** agent as a gatekeeper — asks Socratic questions before dispatching subagents to ensure the plan is solid.

---

## ⚡ Available Agents (20 Specialists)

| Agent | Domain |
|---|---|
| `@frontend-specialist` | Web UI/UX, React, Next.js |
| `@mobile-developer` | iOS, Android, React Native, Flutter |
| `@backend-specialist` | APIs, Node.js, server logic |
| `@database-architect` | Schema design, indexing, migrations |
| `@security-auditor` | OWASP, auth, RLS policies |
| `@penetration-tester` | Red team, MITRE ATT&CK |
| `@debugger` | Systematic root cause analysis |
| `@orchestrator` | Multi-agent coordination |
| `@project-planner` | 4-phase planning methodology |
| `@devops-engineer` | CI/CD, infrastructure, Docker |
| `@performance-optimizer` | Core Web Vitals, profiling |
| `@qa-automation-engineer` | E2E, Playwright, test coverage |
| `@game-developer` | Game logic, engines |
| `@seo-specialist` | Rankings, GEO, E-E-A-T |
| `@documentation-writer` | READMEs, API docs |
| `@product-manager` | Feature specs, roadmaps |
| `@code-archaeologist` | Legacy code analysis |
| `@explorer-agent` | Codebase mapping |
| `@product-owner` | Backlog, requirements |
| `@test-engineer` | Unit/integration test design |

---

## 📁 Installed Structure

```
.agent/
├── agents/       # 20 specialist agent personas
├── workflows/    # 11 slash-command workflows
├── skills/       # 30+ modular skill packs (clean-code, api-patterns, etc.)
├── scripts/      # 12 audit & verification scripts
└── rules/        # Global AI behavioral rules
```

---

## 📖 Resources

- **Repo:** [github.com/vudovn/antigravity-kit](https://github.com/vudovn/antigravity-kit)
- **Install:** `npx @vudovn/ag-kit init`
- **Update:** `ag-kit update`
- **Status:** `ag-kit status`
