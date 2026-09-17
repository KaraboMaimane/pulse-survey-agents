# AI Session Logs

This project was built with [Claude Code](https://claude.com/claude-code) (Claude Sonnet 5), driven conversationally
in the Claude desktop app across a single continuous session that covered the full build: scaffolding, backend
implementation, live DB verification, e2e tests, and the React frontend.

## session-01-claude-code/
- `transcript.jsonl` — the exported session transcript (tool calls, tool results, and assistant/user turns), in the
  desktop app's own export format.
- `metadata.json` — trimmed session metadata (title, model, effort level, timestamps). The full export also includes
  the app's MCP tool-schema listings and other operational metadata not relevant to reviewing the work, so only the
  identifying fields are kept here.

**Redaction**: the raw export was scanned for personal information before being committed. The user's email address
and local machine username/home-directory path (which appeared in hundreds of file-path tool calls, since the
project lives under the user's home directory) were replaced with placeholders (`[REDACTED_EMAIL]`, `/Users/[user]/`).
The transcript was also checked for API keys, tokens, and other secret-shaped strings — none were found.

## How to read it
Each line in `transcript.jsonl` is one JSON event (a user message, an assistant message, a tool call, or a tool
result) in chronological order. It is the desktop app's native export format rather than a hand-formatted log,
because that's what most faithfully represents what actually happened, including tool calls and their results —
see SOLUTION.md's "AI Workflow" section for a narrative walkthrough of what was delegated, reviewed, and corrected
during this session, with pointers to specific moments worth looking at.
