<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - Template Principle 1 -> I. Stateless Idempotency Is Non-Negotiable
  - Template Principle 2 -> II. Local Windows CLI Boundary
  - Template Principle 3 -> III. Secrets and Financial Data Remain Protected
  - Template Principle 4 -> IV. External API Contracts Are Isolated and Respected
  - Template Principle 5 -> V. Reviewable Imports, Logging, and Tests Are Required
- Added sections:
  - Operating Constraints
  - Delivery and Quality Gates
- Removed sections: None
- Templates requiring updates:
  - updated: .specify/templates/plan-template.md
  - updated: .specify/templates/spec-template.md
  - updated: .specify/templates/tasks-template.md
  - reviewed: .specify/templates/checklist-template.md
  - not present: .specify/templates/commands/*.md
- Follow-up TODOs: None
-->
# Mono Lunch Bridge Constitution

## Core Principles

### I. Stateless Idempotency Is Non-Negotiable
The application MUST NOT maintain a local transaction database or store imported
transaction state such as last transaction id, last synced timestamp, or cursor
state as the source of truth. Lunch Money MUST be the idempotent storage target.
Every imported Monobank transaction MUST use a deterministic `external_id` based
on the Monobank account and transaction identifiers, shortened only with a
deterministic hash when needed to satisfy Lunch Money limits. Sync and backfill
MUST be safe to rerun after normal completion, manual reruns, and crashes.

Rationale: overlapping imports are expected; correctness depends on stable
external ids and Lunch Money duplicate handling, not on mutable local state.

### II. Local Windows CLI Boundary
The product MUST remain a local CLI application with no hosted server, permanent
daemon, webhook listener, GUI, or multi-user SaaS flow in the first version.
`setup` MAY be interactive, but `sync`, `scheduler uninstall`, `scheduler status`,
and `config show` MUST run without prompts. Scheduled execution MUST use Windows
Task Scheduler, invoke `sync --quiet`, avoid overlapping instances, and use a
config path rather than command-line secrets.

Rationale: the tool is intended for personal, Windows-friendly budgeting without
a continuously running service.

### III. Secrets and Financial Data Remain Protected
API tokens MUST NOT be stored in plain `config.json`, passed as command-line
arguments, or written to logs. Tokens MUST be resolved from user-level
environment variables or secure user-level storage. Console output, config
display, and logs MUST mask PANs, IBANs, full account numbers, and any other
high-risk financial identifiers. Config and log files MUST live under the user
profile by default, and `config show` MUST print only sanitized values.

Rationale: scheduled task arguments, logs, and config files are easy to expose;
the bridge must keep financial credentials and account identifiers private.

### IV. External API Contracts Are Isolated and Respected
Monobank access MUST be implemented behind a client that respects the documented
31-day plus one-hour statement window, one statement request per 60 seconds, and
500-transaction backward paging rule. Lunch Money access MUST be implemented
behind a `BudgetProvider` adapter targeting API v1 for the first version. Imports
MUST use Lunch Money manual assets, batches of at most 500 transactions,
`status: "uncleared"`, configured tags, compact notes, and `skip_balance_update`.
Lunch Money v2 MUST NOT be implemented unless explicitly requested, but adapter
boundaries MUST keep a later migration isolated.

Rationale: both external APIs impose behavioral limits; adapter boundaries keep
rate limits, payload limits, and future version differences contained.

### V. Reviewable Imports, Logging, and Tests Are Required
Imported transactions MUST be review-pending in Lunch Money, tagged with the
configured sync tag, and include compact Monobank metadata that fits the notes
limit. Sync MUST acquire a lock file, log readable success and failure events,
continue across account-level failures when safe, and exit non-zero when any
account fails. Implementation changes touching sync behavior MUST include tests
for deterministic external ids, money conversion, date formatting, notes length,
mapping status/tag/asset assignment, config validation, Monobank paging, Lunch
Money chunking, duplicate reruns, and scheduler command token safety.

Rationale: the tool moves financial data; reviewability, diagnostics, and tests
are required to make repeated automated imports trustworthy.

## Operating Constraints

The implementation MUST prefer TypeScript and Node.js, keep the architecture
small, and follow the adapter structure described in `AGENTS.md`. Static and
semi-static configuration MAY be stored, including selected accounts, mapping
data, tag names, scheduler settings, and file paths. Imported transaction state
MUST NOT be stored.

The default config and runtime file locations MUST be:

```text
%APPDATA%\mono-lunchmoney\config.json
%APPDATA%\mono-lunchmoney\sync.log
%APPDATA%\mono-lunchmoney\error.log
%APPDATA%\mono-lunchmoney\sync.lock
```

The default sync settings MUST remain `lookbackDays: 31`, tag
`monobank-sync`, transaction status `uncleared`, `apply_rules: false`,
`skip_duplicates: true`, `debit_as_negative: true`, and
`skip_balance_update: true` unless the saved config explicitly overrides a
supported option. The tool MUST NOT delete or mutate existing Lunch Money
transactions during sync or backfill.

## Delivery and Quality Gates

Plans MUST pass a constitution check before implementation work begins. That
check MUST explicitly address stateless idempotency, non-interactive sync,
Windows scheduler behavior, token handling, API adapter boundaries, rate limits,
logging, locking, and tests for the affected behavior.

Specifications MUST include user-facing setup, sync, scheduler, config display,
and backfill behavior when those flows are in scope. Acceptance criteria MUST
cover duplicate reruns, review-pending imports, configured tags, compact notes,
Monobank window and paging limits, Lunch Money batch size, and absence of tokens
from scheduled commands.

Task lists MUST include implementation and verification work for config schema,
token resolution, Monobank and Lunch Money adapters, mapping/idempotency, lock
handling, logging, scheduler command generation, and README or quickstart
instructions when those areas are touched.

## Governance

This constitution governs all specs, plans, tasks, and implementation decisions
for Mono Lunch Bridge. `AGENTS.md` remains the detailed product specification;
if it conflicts with this constitution, work MUST stop until the conflict is
resolved by amending the constitution, `AGENTS.md`, or both.

Amendments MUST update this file, include a Sync Impact Report, and review the
Spec Kit templates for consistency. Version changes MUST follow semantic
versioning: MAJOR for incompatible governance or principle changes, MINOR for
new principles or materially expanded requirements, and PATCH for clarifications
that do not change obligations.

Compliance review is required at plan, task, and implementation review time.
Any deliberate violation MUST be documented in the plan's Complexity Tracking
section with the reason, risk, and simpler alternative rejected.

**Version**: 1.0.0 | **Ratified**: 2026-05-15 | **Last Amended**: 2026-05-15
