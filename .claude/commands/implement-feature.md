When called, you must orchestrate the following **agentic workflow** using the Task, Agent, and Skill tools. You are the **orchestrator**, not a worker. Do not implement anything directly; delegate to sub-agents and skills.

This command follows **Specification-Driven Development (SDD)**: understand → plan → execute → verify → commit. Every phase produces a concrete artifact visible to the user.

---

## Phase 0: Scope Assessment

Before launching the full workflow, decide the complexity level:

| Complexity | Criteria | Approach |
|---|---|---|
| **Trivial** | Typo fix, single-line change, obvious bug fix | Skip phases 1-2. Go directly to **Phase 3 (Execute)** with a single agent. |
| **Simple** | Single file, well-understood change | Skip phase 1. Use a **Plan agent** directly for a quick plan, then execute. |
| **Standard** | Multi-file, new feature, architectural decisions | Full workflow: all phases. |

If unsure, default to **Standard**. Err on the side of more planning for safety.

---

## Phase 1: Understand (Agentic Exploration)

**Goal:** Understand what exists before proposing changes.

**Model:** Use `deepseek-pro` sub-agents for deep, thorough exploration.

1. Launch **2-3 Explore agents in parallel** (single message, multiple Agent tool calls):
   - One agent for existing patterns and reusable code
   - One agent for related tests and copy/types/hooks
   - One agent for navigation/routes and integration points

2. Each agent returns a structured report. You, the orchestrator, synthesize the findings.

**Output:** A clear understanding of what exists, what can be reused, and what gaps exist.

---

## Phase 2: Plan (Human-Assisted)

**Goal:** Design the implementation approach and get user sign-off.

1. Use the **EnterPlanMode** tool to enter plan mode.
2. Launch a **Plan agent** (`deepseek-pro`) with all context from Phase 1. The agent must:
   - Read the plan file at `/Users/jon4/.claude/plans/synchronous-bouncing-zephyr.md`
   - Design concrete stages with file paths and code patterns
   - Propose commit messages following the project's conventional commits format
   - Reference existing functions and utilities to reuse
3. Write the final plan to the plan file.
4. Call **ExitPlanMode** to present it to the user for approval.

**Plan conventions** (from project CLAUDE.md):
- Each stage: `### Stage X | Short title` with explanation
- `* Scope:` (mobile|backend|shared|docs|repo)
- `* Commit:` with conventional commit message
- PR description at the end with Summary, Tasks (checkboxes), Notes/Out of Scope

**Output:** User-approved plan file.

---

## Phase 3: Execute (Autonomous)

**Goal:** Implement the approved plan.

1. For **Standard** complexity, use the **Skill** tool to invoke `implement-feature`:
   ```
   Skill({ skill: "implement-feature", args: "..." })
   ```
   For **Simple**/**Trivial**, spawn a `deepseek-flash` **Agent** directly with the plan and all necessary context.

2. The executing agent must:
   - Read the plan file
   - Implement each stage sequentially
   - Run tests after each stage when possible
   - Report progress back

**Workflow for execution:**
- TaskCreate for each stage
- Execute stages in dependency order
- Run `pnpm format:write` after all changes
- Run `pnpm -r test` (or scoped tests) to verify

**Output:** All code changes applied and tested.

---

## Phase 4: Verify (Parallel Review)

**Goal:** Ensure quality through parallel, independent verification.

Launch these **3 agents simultaneously** (single message, multiple Agent tool calls), all using `deepseek-pro`:

| Agent | Purpose | Prompt guidance |
|---|---|---|
| **Review** | Correctness, style, security, reuse | "Review all changes. Check for bugs, style violations, security issues, and missed reuse opportunities. List findings with severity." |
| **QA** | Manual test scenarios | "Generate manual QA tasks. Focus on user-visible behavior, edge cases, and regressions. Include setup steps." |
| **Summary** | User-facing documentation | "Write a non-technical summary of what was implemented and how it works." |

**Output:** Review findings, QA checklist, and user-facing summary.

---

## Phase 5: Finalize (Commit)

**Goal:** Commit and prepare for push.

1. Present the review findings to the user. If they request fixes, spawn an Agent to apply them.
2. **Commit atomically** — one commit per logical change group, following conventional commits:
   ```
   <type>(<scope>): <description>
   ```
3. Show the final commit log and ask for confirmation before pushing.

**Commit guidelines:**
- Each commit should be self-contained and buildable
- Group related files (e.g., types + API client together, screens + routes together)
- Follow the scope naming: `feat(mobile):`, `chore(repo):`, `test(api):`, `docs(repo):`, etc.

**Output:** Clean commit history, ready to push.

---

## Model Strategy

| Phase | Model | Why |
|---|---|---|
| Phase 1 (Understand) | `deepseek-pro` | Deep exploration needs thoroughness |
| Phase 2 (Plan) | `deepseek-pro` | Architectural thinking, trade-off analysis |
| Phase 3 (Execute) | `deepseek-flash` | Fast, autonomous, high-throughput implementation |
| Phase 4 (Verify) | `deepseek-pro` ×3 | Review, QA, and summary need careful reasoning |
| Phase 5 (Finalize) | Orchestrator (current model) | Human interaction, judgement calls |

---

## Key Principles

1. **Orchestrate, don't work.** You delegate. You never write code or run commands directly — use Agent/Task/Skill tools.
2. **SDD flow.** Understand → Plan → Execute → Verify → Commit. Each phase gates the next.
3. **Right model for the job.** `deepseek-pro` for thinking (plan, review, explore), `deepseek-flash` for doing (execute).
4. **Human at decision points.** User approves the plan (Phase 2) and commit/push (Phase 5). Execution is autonomous.
5. **Parallel where safe.** Phase 1 (multiple explore agents) and Phase 4 (review + QA + summary) run concurrently.
6. **Atomic commits.** Each commit is one logical change. Don't batch unrelated changes.
7. **Test early.** Run tests after every stage, not just at the end. Catch regressions immediately.
8. **Use existing tools.** Skills (`verify`, `code-review`, `simplify`), Plan mode (`EnterPlanMode`/`ExitPlanMode`), and Task tracking (`TaskCreate`/`TaskUpdate`) are first-class workflow tools.
