---
type: clarifications
specId: SPEC-004
version: 1
updatedAt: "2026-03-16T15:45:00Z"
---

# Clarifications — SPEC-004: Enforce AskUserQuestion Tool in Clarify Command

## Q: Should the clarify command ask ALL questions via AskUserQuestion, or allow plain text for follow-ups?
**A:** All questions must use AskUserQuestion — no exceptions. Every single question must go through the tool for consistent UX and forced waits.
**Impact:** The template must use absolute language ("MUST use AskUserQuestion for every question") with no escape hatch for plain text questions.

## Q: How should the agent handle inherently open-ended questions where predefined options don't make sense?
**A:** Always offer reasonable default options + rely on the automatic "Other" escape hatch. The agent must always propose options even for open-ended questions.
**Impact:** The template must instruct the agent to always formulate at least 2 reasonable options. The "Other" option (built into AskUserQuestion) serves as the open-ended fallback.

## Q: Should the template include example AskUserQuestion calls as reference for the agent?
**A:** Yes, include a concrete example showing the full JSON structure (header, options, descriptions, multiSelect).
**Impact:** The template must include at least one complete AskUserQuestion example to guide the agent on correct formatting.

## Q: Should the template specify a maximum number of AskUserQuestion rounds?
**A:** No limit — let the agent decide how many rounds are needed until all ambiguities are resolved.
**Impact:** No round cap in the template. The agent asks as many rounds as necessary.

## Q: When the user picks "Other" and types a custom answer, should the agent confirm its interpretation?
**A:** No — record the custom input directly to clarifications.md without a follow-up confirmation.
**Impact:** The template instructs the agent to trust custom "Other" input and record it as-is.
