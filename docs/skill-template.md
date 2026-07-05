# Skill template

Copy the block below to `skills/lingochunk-<yourname>/SKILL.md` and replace
every ALL-CAPS placeholder. Delete any section that genuinely does not apply,
but keep the order: options first, then workflow, then hard rules. Read
[skill-authoring.md](skill-authoring.md) before filling it in.

````markdown
---
name: lingochunk-YOURNAME
description: BUILD-WHAT one-liner grounded in the user's own LingoChunk listening history. HOW it differs from the standard lesson skill. Use when the user asks to TRIGGER-PHRASES (e.g. "drill me with dictation", "rehearse the B2 speaking exam with my episodes").
---

# LingoChunk YOURNAME builder

ONE PARAGRAPH: what this skill produces and the pedagogy behind it.
LingoChunk supplies the materials (transcripts with positions and
translations, FSRS-graded vocabulary) and renders the lesson natively; you
do the pedagogy on the user's own tokens.

This skill uses the `lingochunk` MCP tools. If they are not available, tell
the user to add the LingoChunk MCP server (see the plugin README) and stop.

## When to use

- "EXAMPLE USER REQUEST 1"
- "EXAMPLE USER REQUEST 2"

## Options to settle first (ask only what the user left open)

1. **Source**: a named episode (`list_library`) or YOUR SELECTION POLICY.
   A lesson has ONE source episode in v1.
2. **Time range**: default to a coherent slice, not a whole episode
   (`get_transcript` `from_time`/`to_time`).
3. **Level**: infer from the CEFR mix of `get_vocabulary(status=known)` when
   the user does not say; state which level you picked and how it changes
   YOUR EXERCISE MIX / INSTRUCTION LANGUAGE.
4. YOUR SKILL-SPECIFIC OPTIONS.

## Workflow

1. **Pull the slice.** `get_transcript` with the chosen range; keep each
   sentence's `position`, `text`, `translation`, `speaker`. Reference
   sentences BY POSITION and quote `text` VERBATIM (the server rejects
   misquotes).
2. **Gather and filter vocabulary.** Exclude `status=known` (unless `due`);
   drill `learning`/`new`/`due`. Ground meanings/gender/CEFR with
   `lookup_word`; never invent them.
3. YOUR COMPOSITION STEPS: which blocks, in which order, and why. Spell out
   the spine so the agent never improvises structure.
4. **Save.** `save_lesson` with `{document}`. On 400 read the code:
   `unknown_positions` / `position_outside_slice` mean a sentence reference
   is wrong; `dialogue_mismatch` means quote the transcript verbatim. Fix
   and retry. Check the response's `unknown_lemmas`.
5. **Deliver.** Give the user the `app_url`. OFFER FOLLOW-UPS (e.g.
   `add_card` for drilled words; a 409 means it is already there - skip).

## Hard rules

- Ground, do not invent: every quoted line comes from the transcript by
  `position`; meanings come from the tools.
- LingoChunk is the system of record for word knowledge: never drill a
  `known` word unless it is `due`; never write review grades back.
- Only use content the tools return; the user's data never goes to any
  other service.
- No audio handling: reference `[start, end)` windows of the original
  episode; never generate, cut or embed audio.
- YOUR SKILL-SPECIFIC RULES.
````

Then add `skills/lingochunk-YOURNAME/examples/<name>.lesson.json` (a
representative output with a fictional `submission_id`) and check it:

```bash
npm run validate:lesson -- skills/lingochunk-YOURNAME/examples/<name>.lesson.json
npm test
```
