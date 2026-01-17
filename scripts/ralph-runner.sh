#!/bin/bash
# Ralph Runner - Executes inside Docker container
# Runs the ralph loop for a single job

set -e

# Configuration from environment
MAX_ITERATIONS=${MAX_ITERATIONS:-10}
PRD_FILE="/workspace/prd.json"
PROGRESS_FILE="/workspace/progress.txt"

# Validate required files
if [ ! -f "$PRD_FILE" ]; then
  echo "ERROR: prd.json not found at $PRD_FILE"
  exit 1
fi

# Initialize progress file if it doesn't exist
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "Repo: ${REPO_NAME:-unknown}" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo "Starting Ralph Runner"
echo "  Max iterations: $MAX_ITERATIONS"
echo "  Repo: ${REPO_NAME:-unknown}"
echo "  PRD: $PRD_FILE"

# Read the prompt template
PROMPT_FILE="/workspace/prompt.md"
if [ ! -f "$PROMPT_FILE" ]; then
  # Use default prompt if not provided
  cat > "$PROMPT_FILE" << 'PROMPT_EOF'
# Ralph Agent Instructions

You are an autonomous coding agent working on a software project.

## Your Task

1. Read the PRD at `prd.json`
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Check you're on the correct branch from PRD `branchName`. If not, check it out or create from main.
4. Pick the **highest priority** user story where `passes: false`
5. Implement that single user story
6. Run quality checks (e.g., typecheck, lint, test - use whatever your project requires)
7. Update CLAUDE.md files if you discover reusable patterns
8. If checks pass, commit ALL changes with message: `feat: [Story ID] - [Story Title]`
9. Update the PRD to set `passes: true` for the completed story
10. Append your progress to `progress.txt`

## Stop Condition

After completing a user story, check if ALL stories have `passes: true`.

If ALL stories are complete and passing, reply with:
<promise>COMPLETE</promise>

If there are still stories with `passes: false`, end your response normally.

## Important

- Work on ONE story per iteration
- Commit frequently
- Keep CI green
- Read the Codebase Patterns section in progress.txt before starting
PROMPT_EOF
fi

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "═══════════════════════════════════════════════════════"
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "═══════════════════════════════════════════════════════"

  # Run claude with the ralph prompt
  OUTPUT=$(cat "$PROMPT_FILE" | claude --dangerously-skip-permissions -p 2>&1 | tee /dev/stderr) || true

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "Ralph completed all tasks!"
    echo "Completed at iteration $i of $MAX_ITERATIONS"

    # Write completion marker
    echo "COMPLETE" > /workspace/.ralph-status
    exit 0
  fi

  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Check $PROGRESS_FILE for status."

# Write incomplete marker
echo "INCOMPLETE" > /workspace/.ralph-status
exit 1
