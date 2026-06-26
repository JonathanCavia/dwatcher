---
description: Workflow to implement a new plan from scratch
---

# implement-plan

When called, you are the **orchestrator**. Your ONLY job is to delegate to formal agents and pass their validated outputs forward. **You never synthesize, summarize, write code, or make implementation decisions.**

This command follows **Specification-Driven Development (SDD)**: understand → plan → execute → verify → commit.

If this command is run without any content besides `/implement-plan`, ask the user for the plan instructions.

**This command handles 2 types of planning+implementation:**
 * `single-plan-implementation`: scope is just one repo
 * `multi-plan-implementation`: scope impacts both `nestled-backend` and `nestled-frontend`

---

## Phase 1: Understand (Agentic Exploration)

**Goal:** Understand what exists before proposing changes.

1. If unsure about `single` vs `multi` plan scope, use `AskHuman`.
2. Launch **Explore agents in parallel** using the formal agent definition:
   ```
   Agent(subagent_type="explore", description="Explore patterns and reusable code", model="opus", schema=EXPLORE_SCHEMA)
   Agent(subagent_type="explore", description="Explore tests, types, and hooks", model="opus", schema=EXPLORE_SCHEMA)
   Agent(subagent_type="explore", description="Explore routes and integration points", model="opus", schema=EXPLORE_SCHEMA)
   ```
   - For `multi-plan-implementation`, add agents for cross-repo exploration.

3. **DO NOT synthesize findings.** Pass the raw validated ExploreReport outputs directly to Phase 2.

---

## Phase 2: Plan (Human-Assisted)

**Goal:** Design the implementation plan and get user approval.

1. Use `EnterPlanMode` to enter plan mode.
2. Launch the **Plan agent** with all ExploreReport outputs from Phase 1:
   ```
   Agent(subagent_type="plan", description="Design implementation plan", model="opus", schema=PLAN_SCHEMA)
   ```
   The Plan agent:
   - Reads existing plans from `docs/plans/*.md` to match structure and numbering
   - Designs concrete stages with file paths and code patterns
   - Proposes commit messages following conventional commits
   - References existing functions and utilities from the exploration reports
   - Asks clarifying questions via its output if needed

3. Write the plan file/s from the Plan agent's validated PlanReport output.
   - 2 plan files (one per repo) if `multi-plan-implementation` — reference each other
   - Use `AskHuman` for the GitHub issue link (allow "None", keep `Closes #` placeholder)

4. Call `ExitPlanMode` for user approval. Wait for approval before proceeding.

**Output:** User-approved plan file/s.

---

## Phase 3: Execute (Autonomous)

**Goal:** Implement the approved plan.

1. Use `AskHuman` to let the user choose execution mode:
   - `Automatic`: auto-commit each stage with the plan's commit message
   - `Manual`: user reviews and commits each stage manually

2. Launch the **Implement agent/s**:
   ```
   Agent(subagent_type="implement", description="Execute plan stages", model="sonnet", schema=IMPLEMENT_SCHEMA, isolation="worktree")
   ```
   - For `multi-plan-implementation`, launch 2 implement agents in parallel (one per repo)
   - The implement agent self-adapts its model: starts as `sonnet`, escalates to `opus` if stages fail repeatedly or involve DB/auth/complexity
   - Each stage: implement → `make format-write` → `make test` → report

3. Use `TaskCreate` for each stage to track progress.

4. **DO NOT intervene in implementation.** The implement agent handles everything — you only pass its progress reports to the user.

**Output:** ImplementationReport from each implement agent.

---

## Phase 4: Verify (Parallel Review)

**Goal:** Independent quality verification.

Launch these **3 agents simultaneously** using formal definitions:

| Agent Type | Purpose |
|---|---|
| `subagent_type="review"` | Adversarial review: bugs, style, security, reuse. schema=REVIEW_SCHEMA |
| `subagent_type="qa-scenarist"` | Manual test scenarios. schema=QA_SCHEMA |
| `subagent_type="summarize"` | User-facing summary. schema=SUMMARY_SCHEMA |

For `multi-plan-implementation`, review agents cover both repos.

**Output:** ReviewReport, QAReport, and SummaryReport — pass all three to Phase 5.

---

## Phase 5: Finalize (Docs & Plan update)

**Goal:** Sync documentation with implementation.

1. Present review findings to user. If fixes requested, re-launch the implement agent:
   ```
   Agent(subagent_type="implement", description="Apply review fixes", ...)
   ```

2. Update plan document/s with:
   - Deviations from original plan (from ImplementationReport)
   - Final status of each stage (mark checkboxes in PR description)

3. If needed, update `ARCHITECTURE.md` or `README.md` (delegate to implement agent).

4. Show to user:
   - Final commit message for this phase
   - Summary of all commits per repo/plan
   - Ask for push confirmation

**Output:** Clean commit summary, ready to push.

---

## Key Principles

1. **You are a passthrough.** Delegate everything. Never synthesize, summarize, or modify agent outputs.
2. **Formal agents only.** Use `subagent_type` from `.claude/agents/`, always with a schema.
3. **Right model per role.** `opus` for explore/plan/review/qa/summarize. `sonnet` for implement (it self-escalates if needed).
4. **Human at decision points.** User approves plan, chooses execution mode, and confirms push.
5. **Parallel where safe.** Phase 1 and Phase 4 run concurrently.
6. **Validated outputs.** Every agent returns structured JSON validated by its schema — you trust it as-is.

## DIRECTIVES TO ALWAYS CONSIDER:

* Do **NOT** run `push` and/or `pull` from `git` without explicit user consent.
* Do **NOT** add `Co-Authored-By` to commit messages or mention "claude".
  - **NEVER** mention ANYWHERE the used agent/s.
* **ALWAYS** ask for confirmation before running commands that could **write data outside** the working repo.
* **ALWAYS** ask for confirmation before making HTTP requests to external sources.
