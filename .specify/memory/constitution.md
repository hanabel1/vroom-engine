<!--
Sync Impact Report
===================
Version change: 0.0.0 → 1.0.0 (MAJOR — initial ratification)
Modified principles: N/A (first version)
Added sections:
  - Core Principles (5 principles)
  - Technical Constraints
  - Development Workflow
  - Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ no update needed
    (Constitution Check section is generic; gates derived at plan time)
  - .specify/templates/spec-template.md — ✅ no update needed
    (user-story structure already compatible)
  - .specify/templates/tasks-template.md — ✅ no update needed
    (phase structure accommodates prototype-fast workflow)
Follow-up TODOs: None
-->

# Vroom Engine Constitution

## Core Principles

### I. Plugin-Architecture-Driven

All features MUST operate within Figma's plugin sandbox.
Code MUST separate the plugin UI layer (iframe) from the main
thread (Figma API access). Communication between the two MUST
use `postMessage`. No feature may depend on capabilities
unavailable inside the Figma plugin runtime.

**Rationale**: Figma enforces strict sandboxing. Violating these
boundaries causes runtime errors and plugin rejection.

### II. Prototype-Fast Delivery

New features MUST start as the simplest working prototype that
validates the idea with real users. Optimisation, abstraction,
and comprehensive error handling MUST be deferred until the
prototype is validated. Premature generalisation is treated as
a defect.

**Rationale**: The product is exploratory — designer workflows
around cross-system component search are unproven. Speed of
learning outweighs code polish at this stage.

### III. Designer-Centric UX

Every interaction MUST be evaluated from the perspective of a
designer who has no front-end development experience. Search,
placement, and transformation flows MUST require zero knowledge
of HTML, React, or Storybook internals. Jargon MUST NOT surface
in the plugin UI.

**Rationale**: The primary personas are designers without
front-end support. Exposing implementation details breaks the
value proposition.

### IV. Minimal Dependencies

Third-party runtime dependencies MUST be justified. The plugin
bundle MUST stay small enough for fast load times inside Figma.
Prefer platform APIs (Figma API, browser built-ins) over
external libraries. Each added dependency MUST be recorded with
its justification in the implementation plan.

**Rationale**: Figma plugins load inside an iframe with limited
resources. Large bundles degrade UX and complicate maintenance.

### V. Incremental Testability

Each user story MUST be independently demonstrable — a working
slice that can be shown to a user. Automated tests are added
when a prototype is validated and the feature is promoted to
stable. Tests MUST cover the critical path (search, place,
transform) before edge cases.

**Rationale**: Aligns with Prototype-Fast by not blocking
velocity with upfront test suites, while ensuring validated
features gain regression safety.

## Technical Constraints

- **Runtime**: Figma Plugin API (latest stable).
- **UI Framework**: React with TypeScript for the plugin UI
  iframe.
- **Language**: TypeScript (strict mode) for all source code.
- **Bundle Size**: Plugin bundle MUST remain under 5 MB
  uncompressed. Violations require explicit justification.
- **Browser Sandbox**: No Node.js APIs, no filesystem access,
  no native modules. All network requests MUST go through
  `fetch` or Figma's `networkAccess` manifest permission.
- **Supported Figma Versions**: Target the latest Figma desktop
  and web clients. Do not rely on beta or undocumented APIs.

## Development Workflow

- **Branching**: Feature branches off `main`. Branch names
  follow the pattern `<issue-number>-<short-description>`
  (e.g., `12-search-storybook`).
- **Pull Requests**: Every merge into `main` MUST go through a
  pull request. PR descriptions MUST reference the related
  spec or issue.
- **Quality Gates**: PRs MUST pass linting (`eslint`) and type
  checking (`tsc --noEmit`) before merge. Automated tests, when
  present, MUST pass.
- **Commits**: Use conventional commit messages
  (`feat:`, `fix:`, `chore:`, `docs:`). Keep commits atomic —
  one logical change per commit.
- **Code Review**: At least one approval required before merge.
  Reviewer MUST verify the change aligns with this constitution.

## Governance

This constitution is the highest-authority document for
development decisions in vroom-engine. When a PR, design
decision, or implementation choice conflicts with these
principles, the constitution takes precedence.

**Amendment Procedure**:
1. Propose changes via a PR that modifies this file.
2. The PR description MUST state the rationale for the change.
3. Amendment PRs require the same review process as code PRs.
4. After merge, update `LAST_AMENDED_DATE` and increment the
   version according to semver:
   - MAJOR: Principle removal or incompatible redefinition.
   - MINOR: New principle or materially expanded guidance.
   - PATCH: Clarifications, wording, or typo fixes.

**Compliance Review**: Any PR reviewer MAY flag a constitution
violation. Flagged violations MUST be resolved before merge.

**Version**: 1.0.0 | **Ratified**: 2026-02-07 | **Last Amended**: 2026-02-07
