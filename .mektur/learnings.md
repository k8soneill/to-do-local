# Mektur Learnings

## Project Setup & Bootstrapping

### LLM-Driven Feature Generation

When setting up a new project, the LLM should act as an interactive product partner. Rather than the user needing to pre-define everything, the setup process should work like this:

1. **Interactive Questioning** - The LLM asks the user a series of focused questions to understand:
   - What problem the product solves
   - Who the target users are
   - What the core value proposition is
   - What constraints exist (tech stack, timeline, solo dev vs team, etc.)
   - What the MVP looks like vs the full vision

2. **Feature Breakdown** - From the answers, the LLM generates:
   - A set of initial **features** (FT-xxx) with clear descriptions and acceptance criteria
   - Logical groupings into **epics** where features relate to a common theme (e.g. "User Management", "Core Task Engine", "Gamification")

3. **Sprint Planning** - The LLM then organises the work into **sprints** (SPR-xxx) with:
   - Concrete **tasks** scoped to be achievable within the sprint
   - Dependencies identified between tasks/features
   - A sensible ordering that delivers incremental value (MVP-first)
   - Sprint goals that are meaningful milestones

### Why This Matters

- Reduces the cold-start problem - getting from "I have an idea" to "I have a plan" is the hardest part for solo developers
- The LLM can spot missing features the user hasn't thought of (auth, error handling, data persistence strategy, etc.)
- Produces a structured backlog from day one rather than an unorganised wish list
- Sprint structure keeps work focused and measurable

### How It Should Work in Practice

The setup flow should feel conversational, not like filling in a form. The LLM should:
- Ask one or two questions at a time, not dump a huge questionnaire
- Reflect back what it understands before generating artifacts
- Present the proposed features/epics/sprints for review and let the user adjust before committing them to yaml files
- Create all the corresponding `.mektur/features/`, `.mektur/sprints/`, and task files automatically once approved

### CLAUDE.md Bootstrap

The `mektur init` command (or its LLM MCP equivalent) should automatically generate or update the project's `CLAUDE.md` file to configure the mektur workflow. This is critical because:

- `CLAUDE.md` is how the LLM knows the project's conventions, tools, and workflows on every new session
- Without it, each conversation starts cold with no awareness of the mektur structure or how to interact with it
- The init step should write instructions into `CLAUDE.md` that tell the LLM:
  - Where the `.mektur/` directory is and what each file/folder represents
  - How to read and write mektur yaml files (features, sprints, tasks, counters, etc.)
  - The naming conventions (FT-xxx, SPR-xxx, PRD-xxx, etc.)
  - The available MCP tools for managing mektur artifacts (if using MCP)
  - The expected workflow: how to propose features, plan sprints, update task status, log frictions/successes
- This makes the mektur workflow self-documenting - any LLM session picks up where the last one left off with full context on how to operate within the project

## Workflow Improvements

### Agents Must Use the CLI to Create Records

**Problem:** During SPR-001 planning, the agent manually created task YAML files by writing them directly to the filesystem instead of using `mektur add task --stdin`. This resulted in:
- Tasks not being picked up by the CLI (`mektur list task` returned nothing)
- Incorrect field names (`name` instead of `summary`, `feature` instead of `epic`)
- Missing required fields (`epic`, `summary`)
- The agent not discovering the Feature → Epic → Task hierarchy until validation failed
- Counter desync (TSK counter incremented but no valid tasks existed)

**Root cause:** The CLAUDE.md workflow instructions describe how to *update* task status and *get* briefings via MCP tools, but do not mention that record *creation* must go through `mektur add <type> --stdin`. The agent assumed it could write YAML files directly because it saw existing files in that format.

**Fix:** CLAUDE.md should explicitly state:
- Always use `mektur add <type> --stdin` (via Bash) to create new records (tasks, epics, features, etc.)
- Never manually create YAML files in `.mektur/` — the CLI handles ID assignment, validation, counter updates, and directory placement
- Use `mektur validate` after any batch of changes to catch schema errors early

### Task Storage Design Needs Review

**Problem:** The current model embeds tasks as multi-document YAML (separated by `---`) inside the sprint file (e.g. `sprints/SPR-001.yaml`). This creates friction:
- Tasks that aren't yet assigned to a sprint have nowhere to live — there is no backlog
- Moving tasks between sprints means extracting YAML documents from one file and appending to another
- Unlike features and epics (which each get their own file in a directory), tasks are second-class citizens with no independent existence

**Current storage (discovered):**
```
.mektur/sprints/SPR-001.yaml
  --- (sprint header)
  --- (TSK-011)
  --- (TSK-012)
  ...
```

**Design question:** Should tasks live in their own top-level `tasks/` directory (like features and epics do) and reference sprints via a `sprint` field? This would allow:
- A flat task directory where all tasks live regardless of sprint assignment
- Tasks with `sprint: SPR-001` are in that sprint; tasks with no sprint are in the backlog
- Sprint views are just filtered queries over the task set
- Moving a task between sprints is a field update, not a file extraction/insertion
- Consistent with how every other record type is stored

This is a design decision that needs to be recorded and reviewed — see DEC-002.

### Architecture Decisions Should Trigger Coding Conventions

**Problem:** When DEC-001 (SvelteKit + SQLite) was recorded, no coding conventions or best-practice rules were created for the agent to follow during implementation. The scaffolding task (TSK-011) proceeded without any enforceable rules about how to write SvelteKit code, how to structure Drizzle schemas, or what patterns to use.

Normally `mektur init` would bootstrap conventions from the project's existing code, but in this case the project was empty at init time — the architecture decision came later during sprint planning. There was no mechanism to bridge the gap.

**Root cause:** The workflow treats architecture decisions and coding conventions as separate concerns. There's no step that says "when you make a stack/architecture decision, also create the corresponding coding rules."

**Fix:** When an architecture decision is made (especially stack choices), the agent should immediately:
1. Create or update coding conventions (`propose_convention`) for the chosen technologies — e.g. "Use SvelteKit server routes for API endpoints", "Use Drizzle ORM for all database access", "Use TypeScript strict mode"
2. Update CLAUDE.md with any project-specific coding rules the agent should follow
3. If the decision changes the stack, review and retire any conventions that no longer apply

This ensures the coding agent has enforceable rules from the moment implementation begins, not just a decision record it may or may not consult.

### MCP Needs Feature and Epic Status Transitions

**Problem:** After completing all SPR-001 tasks, features (FT-001 through FT-007) and epics (EP-001 through EP-007) are still stuck at `proposed` status. There is no MCP tool to transition them through their lifecycle (proposed → approved → in-progress → done). The `update_task_status` tool only works for tasks and bugs, not for features or epics.

This means the agent cannot:
- Mark a feature as in-progress when work begins on its tasks
- Mark an epic as done when all its tasks are complete
- Advance features to done/shipped after delivery

**Current workaround:** Use `update_record_field` to manually set status, or use the CLI `mektur resolve`. But neither is intuitive — the agent doesn't know these are options because the workflow in CLAUDE.md only describes task status transitions.

**Fix:** Either:
1. Extend `update_task_status` to also handle feature and epic status transitions (rename to `update_status` or similar), or
2. Add dedicated `update_feature_status` and `update_epic_status` MCP tools, or
3. Document `update_record_field` as the way to transition any record's status and add this to the CLAUDE.md workflow

### CLI Needs a Reject/Decline Command

**Problem:** During retros and reviews, some proposed conventions, decisions, or frictions may not be worth keeping. There is currently no way to reject or decline a record. The only option is to leave it in `proposed`/`low` status forever, or manually delete the YAML file.

**Design question:** Should rejection mean deletion or should there be a `rejected`/`declined` status?

Arguments for **deletion**:
- Keeps the record store clean — no clutter from rejected proposals
- Simple to implement — just `mektur delete <ID>`
- If it was wrong, there's no value in keeping it

Arguments for **keeping with a rejected status**:
- Preserves the decision history — "we considered this and said no"
- Prevents the same thing being re-proposed in a future sprint
- Useful for retros — shows what was evaluated and why it was rejected
- Could include a `rejection_reason` field for context

**Recommendation:** Add a `rejected` status to conventions, and a `declined` confidence level to decisions. A `mektur reject <ID> --reason "..."` command would set the status and record why. This preserves institutional memory without cluttering active views — `mektur review` should filter out rejected items by default.

### No Way to Remove a Decision from `mektur review` Output

**Problem:** `mektur review` shows all decisions with `confidence: low`. Once a decision has been reviewed and the human is satisfied with it, the only way to remove it from the review list is to upgrade confidence to `medium` or `high`. But there's no CLI command to do this — `mektur resolve` doesn't support setting confidence on decisions.

This means decisions accumulate in the review output indefinitely. DEC-002 has appeared in every retro and sprint planning session even after being reviewed multiple times.

**Related:** This overlaps with the reject/decline issue above. The core problem is that `mektur review` has no way to mark items as "reviewed and accepted" vs "reviewed and rejected" — it only filters on the initial low-confidence/proposed state.

**Fix:** Either:
1. Add `mektur resolve DEC-001 --confidence high` to upgrade confidence from CLI
2. Make the MCP `update_record_field` work for decision confidence and document it in CLAUDE.md
3. Add a `reviewed` or `acknowledged` state that removes items from review output without requiring a confidence judgement
