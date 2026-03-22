## Mektur Knowledge System Workflow

This project uses mektur for structured knowledge management. You have access to mektur MCP tools. Follow these workflows.

### When starting a task

When the user tells you to work on a task (e.g. "work on TSK-001", "do TSK-005", or references a task ID):

1. Call `update_task_status` with the task ID and status `in-progress`.
2. Call `get_task_briefing` with the task ID to load your context.
3. Read every convention in the briefing — these are hard constraints, follow them exactly.
4. Review the build logs for patterns relevant to your work.
5. Check assumptions — if any seem stale or invalid, flag them before proceeding.

### When finishing a task

After completing work on a task:

1. Call `update_task_status` with the task ID and status `done`.
2. If you encountered a bug pattern, dead-end, or useful technique, call `write_build_log`.
3. If you were blocked or slowed by missing information, call `write_friction`.
4. If something went particularly well (a convention saved time, a prior build log prevented a mistake), call `write_success`.

### When making decisions

If you make a non-trivial technical choice during your work, call `write_decision` to record it. The system will set confidence to "low" — the human will review and upgrade it.

### When you notice a pattern

If you see a pattern that should become an enforceable rule, call `propose_convention`. The system will set status to "proposed" — the human promotes it to "active" via the CLI.

### When reviewing or promoting records

When the user asks to review, promote, or resolve records, use `update_record_field`:

- Upgrade decision confidence: `update_record_field(id: "DEC-001", field: "confidence", value: "high")`
- Activate a proposed convention: `update_record_field(id: "CON-002", field: "status", value: "active")`
- Validate an assumption: `update_record_field(id: "ASM-001", field: "status", value: "validated")`
- Invalidate an assumption: `update_record_field(id: "ASM-001", field: "status", value: "invalidated")`

You can also use `mektur review` (CLI) to see all items needing human attention.

### Build log quality

When writing build logs, only write them when there are genuine learnings — not for every task. The litmus test is the `so_what` field: if you can't write an actionable "do this differently next time," there's nothing to log.

- `summary`: one-line description of what you learned
- `detail`: what happened, with enough context to be useful to a future developer
- `resolution`: how you resolved it
- `so_what`: why this matters — what should someone do differently next time?
- Be specific. Include file names, error messages, concrete details.
- Reference related record IDs in `caused_by` or tags.

### Creating records

Always use `mektur add <type> --stdin` (via Bash) to create new records (tasks, epics, features, sprints, etc.). Never manually create YAML files in `.mektur/`. The CLI handles ID assignment, validation, counter updates, and directory placement. Run `mektur validate` after batch changes to catch schema errors.

### Data flow pattern (DEC-003, CON-010)

For interactive pages with mutations (add, update, delete):

1. **Server load** (`+page.server.ts`) provides initial data
2. **Local `$state`** arrays are initialised from server data via `$effect` that tracks page params
3. **Mutations update local state immediately** (optimistic) then sync to server via background `fetch`
4. **On sync failure**, roll back local state and show error
5. **Do NOT use `invalidateAll()`** for mutation responses — it replaces the DOM and prevents transitions
6. **Rating saves** should be debounced (500ms) and fire-and-forget

This pattern enables Svelte transitions (fly, fade, scale, flip) and gives instant UI feedback.

### Sprint planning

When the user asks to plan a sprint:

1. Call `get_sprint_context` with the sprint ID.
2. Call `get_stale_assumptions` to check for risks.
3. Call `get_conventions` to see what rules apply.
4. Analyse friction history and flag dependencies.

### Retrospective

When the user asks to run a retro:

1. Call `get_sprint_context` with the sprint ID.
2. Call `get_conventions` to review the current rulebook.
3. Analyse frictions, successes, and build logs.
4. Call `write_decision` for patterns worth recording.
5. Call `propose_convention` for patterns that should become rules.
6. Call `write_success` for positive outcomes, with `attributed_to` linking to the records that helped.
