# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`
**Created**: [DATE]
**Status**: Draft
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  User stories must be prioritized as independently testable user journeys.
  Each story should deliver value on its own and be verifiable without requiring
  later stories.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens when a sync is rerun for the same date range?
- What happens when a previous sync crashed while holding the lock file?
- What happens when Monobank returns exactly 500 statement items?
- What happens when one mapped account fails but others can still sync safely?
- What happens when required tokens are missing or invalid?
- What happens when generated notes or external ids approach API limits?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST [specific capability]
- **FR-002**: System MUST [specific capability]
- **FR-003**: Users MUST be able to [key interaction]
- **FR-004**: System MUST [data/config requirement]
- **FR-005**: System MUST [error/logging behavior]

### Constitution-Aligned Requirements

- **CAR-001**: The feature MUST NOT introduce a local transaction database or
  imported transaction cursor as source of truth.
- **CAR-002**: Any imported transaction MUST preserve deterministic idempotency
  through Lunch Money `external_id`.
- **CAR-003**: Non-setup commands in scope MUST run without prompts.
- **CAR-004**: Tokens MUST NOT be stored in plain config, passed as arguments,
  printed, or logged.
- **CAR-005**: Sensitive account identifiers MUST be masked in console output,
  config display, and logs.
- **CAR-006**: Monobank statement windows, rate limits, and 500-item paging MUST
  be represented when statement fetching is in scope.
- **CAR-007**: Lunch Money imports MUST use manual assets, max 500-item batches,
  `status: "uncleared"`, configured tags, compact notes, and duplicate-safe
  insert options when transaction import is in scope.
- **CAR-008**: Scheduler behavior in scope MUST use Windows Task Scheduler and
  MUST NOT include API tokens in the registered command.

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: [Measurable outcome for the primary user workflow]
- **SC-002**: [Measurable outcome for rerun/idempotency behavior]
- **SC-003**: [Measurable outcome for security or sanitization behavior]
- **SC-004**: [Measurable outcome for scheduled or non-interactive execution]

## Assumptions

- The tool remains a local Windows-friendly CLI without a hosted service.
- API tokens are available through environment variables or secure user storage.
- Lunch Money API v1 is the target unless a later spec explicitly changes it.
- Static/semi-static config may be stored; imported transaction state may not.
