---
description: Workflow to implement a new plan from scratch
---

# implement-plan

When called, you are the **orchestrator**. Your ONLY job is to delegate to formal agents and pass their validated outputs forward. **You never synthesize, summarize, write code, or make implementation decisions.**

This command follows **Specification-Driven Development (SDD)**: understand → plan → execute → verify → commit.

If this command is run without any content besides `/implement-plan`, ask the user for the plan instructions.

**This command handles 2 types of planning+implementation:**
 * `single-plan-implementation`: scope is just one repo
 * `multi-plan-implementation`: scope impacts both `dwatcher-backend` and `dwatcher-frontend`

---

## Phase 1: Understand (Agentic Exploration)

**Goal:** Understand what exists before proposing changes.

1. If unsure about `single` vs `multi` plan scope, use `AskHuman`.
2. Launch **Explore agents in parallel** using the formal agent definition:
   ```
   Agent(subagent_type="explore", description="Explore patterns and code", prompt="Search the codebase for existing patterns, reusable utilities, conventions, and architectural patterns. Map related files, routes, models, schemas, and tests. Return findings as structured JSON following your output format.", model="opus")
   Agent(subagent_type="explore", description="Explore tests and types", prompt="Search the codebase for test patterns, type definitions, shared hooks, and integration points. Identify gaps in test coverage, missing types, and hook usage patterns. Return findings as structured JSON following your output format.", model="opus")
   Agent(subagent_type="explore", description="Explore routes and integrations", prompt="Search the codebase for route definitions, API endpoints, integration points between packages/apps, and cross-cutting concerns. Identify all entry points and data flow paths. Return findings as structured JSON following your output format.", model="opus")
   ```
   - For `multi-plan-implementation`, add agents for cross-repo exploration.
   - Each explore agent returns structured JSON per its agent definition output format. Parse and validate before passing forward.

3. **DO NOT synthesize findings.** Pass the raw validated ExploreReport outputs directly to Phase 2.

---

## Phase 2: Plan (Human-Assisted)

**Goal:** Design the implementation plan and get user approval.

1. Use `EnterPlanMode` to enter plan mode.
2. Launch the **Plan agent** with all ExploreReport outputs from Phase 1:
   ```
   Agent(subagent_type="plan", description="Design implementation plan", prompt="Design an implementation plan from the following exploration reports: [INSERT_EXPLORE_REPORTS]. Follow existing plan conventions from docs/plans/. Design concrete stages with exact file paths, function signatures, and code patterns. Propose conventional-commit messages. Return the plan as structured JSON following your output format.", model="opus")
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

4. Launch the **Test-Writer agent** in **test ideas mode** to add client-perspective test specifications to the plan:
   ```
   Agent(subagent_type="test-writer", description="Write test ideas into plan", prompt="Read the plan at [PLAN_FILE_PATH]. Write client-perspective test ideas for each stage from the user's point of view. For each stage, specify: what the user sees and experiences, edge cases from the user's perspective, and error states the user might encounter. Return test ideas as structured JSON following your output format (mode=test_ideas).", model="opus")
   ```
   - Embed the test ideas into the plan file/s before user approval
   - Test ideas describe user-visible behavior, not implementation details

5. Call `ExitPlanMode` for user approval. Wait for approval before proceeding.

**Output:** User-approved plan file/s with embedded test specifications.

---

## Phase 3: Execute (Autonomous)

**Goal:** Implement the approved plan.

1. Use `AskHuman` to let the user choose execution mode:
   - `Automatic`: auto-commit each stage with the plan's commit message
   - `Manual`: user reviews and commits each stage manually

2. Launch the **Implement agent** and **Test-Writer agent** in parallel:
   ```
   Agent(subagent_type="implement", description="Execute plan stages", prompt="Execute the plan stages from [PLAN_FILE_PATH]. Implement each stage sequentially: read the stage, implement changes, run format-write, run tests. Start with model=sonnet and self-escalate to opus if stages fail repeatedly or involve complex changes. Return progress as structured JSON following your output format.", model="sonnet", isolation="worktree")
   Agent(subagent_type="test-writer", description="Write tests from plan", prompt="Read the plan at [PLAN_FILE_PATH]. Write the actual test code for each test idea specified in the plan. Follow the project's test conventions for file placement, naming, and test runner config. Focus on client-visible behavior — what the user sees, does, and expects. Mock ONLY native modules and external APIs — never mock @dwatcher/* internal packages. Return written files as structured JSON following your output format (mode=test_code).", model="opus", isolation="worktree")
   ```
   - For `multi-plan-implementation`, launch 2 implement agents and 2 test-writer agents (one pair per repo)
   - The implement agent self-adapts its model: starts as `sonnet`, escalates to `opus` if stages fail repeatedly or involve DB/auth/complexity
   - The test-writer agent writes tests in parallel with implementation — both use worktree isolation
   - Implement agent workflow per stage: implement → `make format-write` → `make test` → report

3. Use `TaskCreate` for each stage to track progress.

4. **DO NOT intervene in implementation or test writing.** The agents handle everything — you only pass their progress reports to the user.

**Output:** ImplementationReport and TestWriterReport.

---

## Phase 4: Verify (Parallel Review)

**Goal:** Independent quality verification.

Launch these **3 agents simultaneously** using formal definitions:

```
Agent(subagent_type="review", description="Review implementation changes", prompt="Review all changed files from the implementation. Check correctness, security, style, and reuse. Be adversarial — assume there ARE bugs. Categorize every finding by severity. Return findings as structured JSON following your output format.", model="opus")
Agent(subagent_type="qa-scenarist", description="Generate QA test scenarios", prompt="Create manual test scenarios for the implemented changes. Focus on user-visible behavior, edge cases, error states, and regressions. Every scenario must be step-by-step and testable by a human. Return scenarios as structured JSON following your output format.", model="opus")
Agent(subagent_type="summarize", description="Write user-facing summary", prompt="Write a clear, non-technical summary of what was implemented. Translate technical changes into plain language for product managers and stakeholders. Return the summary as structured JSON following your output format.", model="opus")
```

For `multi-plan-implementation`, review agents cover both repos.

4. After the review/QA/summarize agents complete, launch the **TDD Runner** agent to run all tests and fix any failures in source code:
   ```
   Agent(subagent_type="tdd-runner", description="Run tests and fix code", prompt="Run all project tests with 'pnpm -r test'. For each failing test: diagnose the root cause in the SOURCE CODE (never the test), apply the minimal fix to the source, and re-run. Tests are the specification — you NEVER modify test files. If a test is genuinely unsatisfiable, report it — do not skip or modify it. Loop until all tests pass or unfixable failures remain. Return results as structured JSON following your output format.", model="sonnet")
   ```
   - The TDD Runner runs sequentially (not in parallel) — it depends on both implementation AND test writing being complete
   - It NEVER modifies test files — only source code. If `tests_modified` is non-empty in its output, something went wrong
   - It self-escalates to `opus` if the same failure persists after 2 source fixes

**Output:** ReviewReport, QAReport, SummaryReport, and TDDRunnerReport — pass all four to Phase 5.

---

## Phase 5: Finalize (Docs & Plan update)

**Goal:** Sync documentation with implementation.

1. Present review findings and TDD runner results to user. If fixes requested, re-launch the implement agent:
   ```
   Agent(subagent_type="implement", description="Apply review fixes", prompt="Apply the following review fixes to the codebase: [INSERT_REVIEW_FINDINGS]. Fix each finding, run format-write, and run tests. Return progress as structured JSON following your output format.", model="sonnet")
   ```
   - If TDD runner reports unfixable failures, present them to the user for human decision — these may indicate a test specification issue that needs the test-writer's attention

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
2. **Formal agents only.** Use `subagent_type` from `.claude/agents/`, always with `description` (3-5 words) and `prompt` (full task description). Agents return structured JSON per their output format — parse and validate before passing forward.
3. **Right model per role.** `opus` for explore/plan/review/qa/summarize/test-writer. `sonnet` for implement and tdd-runner (both self-escalate if needed).
4. **Human at decision points.** User approves plan (with test ideas), chooses execution mode, and confirms push.
5. **Parallel where safe.** Phase 1 explore agents, Phase 3 implement+test-writer, and Phase 4 review/qa/summarize all run concurrently. TDD runner runs sequentially after Phase 4 parallel block.
6. **Validated outputs.** Every agent returns structured JSON per its agent definition output format — parse, validate, and pass forward as-is.
7. **Tests are specification.** The test-writer writes tests from the client perspective. The tdd-runner fixes source code, never tests.

## DIRECTIVES TO ALWAYS CONSIDER:

* Do **NOT** run `push` and/or `pull` from `git` without explicit user consent.
* Do **NOT** add `Co-Authored-By` to commit messages or mention "claude".
  - **NEVER** mention ANYWHERE the used agent/s.
* **ALWAYS** ask for confirmation before running commands that could **write data outside** the working repo.
* **ALWAYS** ask for confirmation before making HTTP requests to external sources.
