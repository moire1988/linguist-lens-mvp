#!/bin/bash
# protect-env.sh — PreToolUse hook
# Blocks writes to sensitive files and directories.

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Patterns that should never be written to
PROTECTED_PATTERNS=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
  "node_modules/"
  ".git/"
)

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  # Match exact filename or path containing the pattern
  BASENAME=$(basename "$FILE_PATH")
  if [[ "$BASENAME" == "$pattern" ]] || [[ "$FILE_PATH" == *"/$pattern"* ]] || [[ "$FILE_PATH" == *"$pattern"* && "$pattern" == *"/" ]]; then
    echo "BLOCKED: Writing to '$FILE_PATH' is not allowed (matches protected pattern: $pattern)" >&2
    echo "If you need to update environment variables, edit the file manually outside of Claude Code." >&2
    exit 2
  fi
done

exit 0
