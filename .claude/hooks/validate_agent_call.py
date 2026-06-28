#!/usr/bin/env python3
"""
PreToolUse hook: validates Agent tool calls before execution.

Checks:
1. The agent being called has a formal definition in .claude/agents/
2. The correct model is being used (opus for thinking, sonnet for doing)
3. A schema is provided for output validation
4. Write tasks use worktree isolation

Input (stdin): JSON with { "tool_name": "Agent", "tool_input": { ... } }
Exit codes:
  0 = allow
  1 = block (hard fail)
  2 = warn (allow but notify)
"""

import json
import os
import sys
from pathlib import Path

# ── Configuration ──────────────────────────────────────────────────────────

REPO_ROOT = os.environ.get("CLAUDE_CODE_PROJECT_DIR", os.getcwd())
AGENTS_DIR = Path(REPO_ROOT) / ".claude" / "agents"

# Model assignments per agent role
# These are the expected models — the hook warns if wrong model is used.
AGENT_MODEL_MAP = {
    "explore": "opus",
    "plan": "opus",
    "implement": "sonnet",  # starts as sonnet, can self-escalate
    "review": "opus",
    "qa-scenarist": "opus",
    "summarize": "opus",
    "sync-verifier": "opus",
    "test-writer": "opus",
    "tdd-runner": "sonnet",  # starts as sonnet, can self-escalate
}

# Agents that perform WRITE operations (should use worktree isolation)
WRITE_AGENTS = {"implement", "test-writer", "tdd-runner"}

# Agents that are READ-ONLY (must NOT use worktree — overhead waste)
READ_ONLY_AGENTS = {"explore", "plan", "review", "qa-scenarist", "summarize", "sync-verifier"}

# ── Helpers ────────────────────────────────────────────────────────────────

def find_agent_definition(agent_type: str) -> Path | None:
    """Find the formal definition file for an agent type."""
    candidates = [
        AGENTS_DIR / f"{agent_type}.md",
        AGENTS_DIR / f"{agent_type}.mdx",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def parse_frontmatter(filepath: Path) -> dict:
    """Extract YAML frontmatter from a markdown agent definition."""
    try:
        content = filepath.read_text()
    except Exception:
        return {}

    if not content.startswith("---"):
        return {}

    parts = content.split("---", 2)
    if len(parts) < 3:
        return {}

    frontmatter_text = parts[1].strip()
    metadata = {}
    for line in frontmatter_text.split("\n"):
        line = line.strip()
        if ":" in line and not line.startswith("#"):
            key, _, value = line.partition(":")
            metadata[key.strip()] = value.strip()
    return metadata


# ── Main validation ────────────────────────────────────────────────────────

def validate(tool_input: dict) -> tuple[int, list[str]]:
    """Validate the Agent call. Returns (exit_code, messages)."""
    exit_code = 0
    messages: list[str] = []

    subagent_type = tool_input.get("subagent_type", "")
    model_used = tool_input.get("model", "")
    description = tool_input.get("description", "")
    isolation = tool_input.get("isolation", "")
    has_schema = "schema" in tool_input
    prompt = tool_input.get("prompt", "")

    # ── Check 1: Formal agent definition exists ──────────────────────────
    if subagent_type:
        definition_file = find_agent_definition(subagent_type)
        if definition_file is None:
            # New/unknown agent type — allow but warn
            messages.append(f"WARNING: No formal agent definition found for '{subagent_type}'. Consider creating .claude/agents/{subagent_type}.md")
            exit_code = max(exit_code, 2)
        else:
            # Validate against the formal definition
            metadata = parse_frontmatter(definition_file)
            expected_model = metadata.get("model", "")

            if expected_model and model_used and model_used != expected_model:
                # Allow but warn — implement and tdd-runner agents self-escalate
                if subagent_type in ("implement", "tdd-runner"):
                    messages.append(f"INFO: {subagent_type} agent using '{model_used}' instead of default '{expected_model}' (self-escalation allowed)")
                else:
                    messages.append(f"WARNING: '{subagent_type}' agent expects model '{expected_model}' but got '{model_used}'")
                    exit_code = max(exit_code, 2)

            # Check isolation for write agents
            if subagent_type in WRITE_AGENTS and isolation != "worktree":
                messages.append(f"WARNING: '{subagent_type}' performs writes but is not using isolation='worktree'")
                exit_code = max(exit_code, 2)

            if subagent_type in READ_ONLY_AGENTS and isolation == "worktree":
                messages.append(f"INFO: '{subagent_type}' is read-only — isolation='worktree' is unnecessary overhead")
    else:
        # No subagent_type specified — generic Agent call, allow
        pass

    # ── Check 2: Schema provided for structured output ────────────────────
    if not has_schema and subagent_type:
        messages.append(f"WARNING: No schema provided for '{subagent_type}' agent. Output will not be validated.")
        exit_code = max(exit_code, 2)

    # ── Check 3: Prompt seems reasonable ──────────────────────────────────
    if prompt and len(prompt) < 10:
        messages.append(f"WARNING: Agent prompt is suspiciously short ({len(prompt)} chars)")
        exit_code = max(exit_code, 2)

    return exit_code, messages


def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            # No input — probably not an Agent call, allow
            sys.exit(0)

        data = json.loads(raw)
    except json.JSONDecodeError:
        # Can't parse input — allow (don't break workflows)
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})

    # Only validate Agent tool calls
    if tool_name != "Agent":
        sys.exit(0)

    exit_code, messages = validate(tool_input)

    for msg in messages:
        print(msg, file=sys.stderr)

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
