---
name: lingochunk-discuss
description: Talk through a LingoChunk episode with the learner. Fetch a slice of a real episode's transcript, discuss it in the target and native language, explain grammar and vocabulary as they come up, and look words up on demand grounded in the user's own data. Use when the user wants to discuss, talk about, go through, or be quizzed casually on one of their LingoChunk episodes, rather than generating a formal lesson artefact.
---

# Discuss an episode

A lightweight companion to `lingochunk-lesson`. Where that skill produces a
self-contained HTML file, this one is a conversation: sit with the learner and
work through a real episode from their LingoChunk library, using the tools to
stay grounded in their own content instead of inventing material.

Uses the `lingochunk` MCP tools. If they are not available, tell the user to add
the LingoChunk MCP server (see the plugin README) and stop.

## When to use

- "Let's discuss the second half of yesterday's episode."
- "Talk me through this German dialogue."
- "Go through episode X with me and explain the tricky bits."

## Workflow

1. **Find the episode.** If the user named it, resolve with `list_library`
   (match on title). Confirm which part they want (a sentence range or a time
   window), so you fetch a slice, not a 45-minute transcript.

2. **Fetch the slice.** `get_transcript(submission_id, from_sentence/to_sentence
   or from_time/to_time)`. Check `transcript_state`: only `ready` has content.

3. **Work through it.** Go sentence by sentence (or in small groups):
   - Show the target-language sentence and its translation.
   - Explain the grammar and any idioms in plain language.
   - When a word matters, call `lookup_word` for its meaning, gender and CEFR,
     and mention whether the user is already learning it (from `get_vocabulary`)
     rather than guessing. Prioritise `learning`/`new` words; do not dwell on
     words `get_vocabulary(status=known)` shows they have mastered.
   - Offer to play a bit: `get_audio_url` streams the passage (always
     available). On a local/plugin setup only, `get_audio_clip` can save a
     short snippet to disk - skip it if the tool is not offered (remote
     clients do not have it).

4. **Follow the learner.** Answer their questions, look up more words on demand,
   pull related examples with `search_examples(lemma=...)` when they ask "where
   else does this word come up". Keep it conversational.

## Rules

- **Ground, do not invent.** Sentences and timestamps come from `get_transcript`;
  word facts from `lookup_word` / `get_vocabulary`. Do not make up example
  sentences - use `search_examples` for real ones from the user's library.
- **Do not write anything back.** This is a read-only conversation; there is no
  tool to record progress, and grades are not written to the user's FSRS state.
- **Respect the scope.** Only discuss content the tools return (the user's own
  submissions and followed collections).

For a durable artefact (a worksheet or quiz file) instead of a conversation, use
the `lingochunk-lesson` skill.
