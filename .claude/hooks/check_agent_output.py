#!/usr/bin/env python3
"""
PostToolUse hook: validates Agent tool responses after execution.

Checks:
1. Response is valid JSON (when a schema was expected)
2. Response contains suspicious patterns (secrets, dangerous code)
3. Response roughly matches expected structure

Input (stdin): JSON with { "tool_name": "Agent", "tool_input": {...}, "tool_response": "..." }
Exit codes:
  0 = ok
  1 = block (response is dangerous — contains secrets, etc.)
  2 = warn (response has issues but not dangerous)
"""

import json
import os
import re
import sys


# ── Patterns to BLOCK ─────────────────────────────────────────────────────
# These patterns in agent output are dangerous and block the response
BLOCK_PATTERNS = [
    # Secrets and tokens
    (r'(?i)(api[_-]?key|secret|token|password|credential)s?\s*[:=]\s*["\'][A-Za-z0-9_\-]{20,}["\']', "Possible secret/token in output"),
    (r'(?i)sk-[A-Za-z0-9]{20,}', "Possible OpenAI API key pattern"),
    (r'(?i)ghp_[A-Za-z0-9]{20,}', "Possible GitHub personal access token"),
    (r'(?i)glpat-[A-Za-z0-9\-]{20,}', "Possible GitLab personal access token"),
    (r'(?i)eyJ[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{20,}\.[A-Za-z0-9\-_]{10,}', "Possible JWT token"),
    # Dangerous code patterns
    (r'\beval\s*\(', "eval() call in output — possible code injection"),
    (r'\bexec\s*\(', "exec() call in output — possible code injection"),
    (r'\bos\.system\s*\(', "os.system() call in output — possible command injection"),
    (r'\bsubprocess\.(call|run|Popen)\s*\(', "subprocess call in output — possible command injection"),
    (r'\b__import__\s*\(', "__import__() call — possible import injection"),
]

# Patterns to WARN about
WARN_PATTERNS = [
    (r'(?i)(TODO|FIXME|HACK|XXX)\s*:', "Unresolved TODO/FIXME/HACK marker"),
    (r'\.\.\./', "Path traversal pattern (.../) detected"),
    (r'/etc/(passwd|shadow)', "Reference to system password files"),
]


def check_patterns(response_text: str) -> tuple[int, list[str]]:
    """Check response for suspicious patterns."""
    exit_code = 0
    messages = []

    for pattern, description in BLOCK_PATTERNS:
        if re.search(pattern, response_text):
            messages.append(f"BLOCK: {description}")
            exit_code = max(exit_code, 1)

    for pattern, description in WARN_PATTERNS:
        matches = re.findall(pattern, response_text)
        if matches:
            messages.append(f"WARNING: {description} (found: {matches})")
            exit_code = max(exit_code, 2)

    return exit_code, messages


def check_json_validity(response_text: str, tool_input: dict) -> tuple[int, list[str]]:
    """Check if response is valid JSON when a schema was expected."""
    exit_code = 0
    messages = []

    has_schema = "schema" in tool_input
    if not has_schema:
        return exit_code, messages

    # Try to find JSON in the response
    response_text = response_text.strip()

    # Try direct parse
    try:
        json.loads(response_text)
        return exit_code, messages  # Valid JSON
    except (json.JSONDecodeError, ValueError):
        pass

    # Try to extract JSON from markdown code blocks
    json_block_pattern = r'```(?:json)?\s*\n(.*?)\n```'
    matches = re.findall(json_block_pattern, response_text, re.DOTALL)
    for match in matches:
        try:
            json.loads(match.strip())
            return exit_code, messages  # Found valid JSON in code block
        except (json.JSONDecodeError, ValueError):
            continue

    # If we get here, no valid JSON found but schema was expected
    messages.append("WARNING: Schema was expected but no valid JSON found in response")
    return max(exit_code, 2), messages


def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            sys.exit(0)

        data = json.loads(raw)
    except json.JSONDecodeError:
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    if tool_name != "Agent":
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    tool_response = data.get("tool_response", "")

    if not tool_response:
        sys.exit(0)

    # Convert response to string if it's a dict/list
    if isinstance(tool_response, (dict, list)):
        tool_response = json.dumps(tool_response)

    exit_code = 0
    all_messages = []

    # Check 1: Suspicious patterns
    code1, msgs1 = check_patterns(tool_response)
    exit_code = max(exit_code, code1)
    all_messages.extend(msgs1)

    # Check 2: JSON validity (when schema expected)
    code2, msgs2 = check_json_validity(tool_response, tool_input)
    exit_code = max(exit_code, code2)
    all_messages.extend(msgs2)

    for msg in all_messages:
        print(msg, file=sys.stderr)

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
