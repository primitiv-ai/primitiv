---
type: spec
id: SPEC-002
title: "Sample Minimal Spec"
status: draft
version: 1
branch: "spec/SPEC-002-sample-minimal"
author: "fixture"
createdAt: "2026-04-05T00:00:00.000Z"
updatedAt: "2026-04-05T00:00:00.000Z"
---

# SPEC-002: Sample Minimal Spec

## Description
Only a spec.md — no other artifacts. Exercises the "missing tabs" scenario.

## Acceptance Criteria

### Feature: Minimal
#### Scenario: Renders
  Given this fixture
  When the viewer opens it
  Then only the Spec tab is shown
