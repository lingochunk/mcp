---
name: lingochunk-lesson
description: Build a coursebook-style lesson from the user's own LingoChunk listening history and save it as a structured lesson.v1 document. Pick an episode (optionally a time range like "the first 5 minutes") and a CEFR level, pull the transcript slice plus vocabulary with FSRS maturity, then compose a fixed six-part lesson (listen, text, vocabulary, one grammar point, graded exercises, review) that the app renders natively with real audio, live word state, crosslinks and a built-in AI tutor. Use when the user asks to make or build a lesson, worksheet, study sheet, or exercises from their LingoChunk content, or to "quiz me" on an episode or a word.
---

# LingoChunk lesson builder

Build a `lesson.v1` document grounded in the learner's real LingoChunk
content. The division of labour is the point: **LingoChunk supplies the
materials (sentences with positions and translations, vocabulary with FSRS
maturity) and renders the lesson natively in the app; you do the pedagogy on
the user's own tokens.** No server-side LLM spend. The app plays the audio
straight from the original episode (never send or embed audio), resolves
word knowledge live, links every word and sentence back to its Words/Listen
tabs, and mounts an Ask AI tutor on the grammar box and glossary.

This skill uses the `lingochunk` MCP tools. If they are not available, tell
the user to add the LingoChunk MCP server (see the plugin README) and stop.

## When to use

- "Make me a lesson / worksheet / quiz from yesterday's episode."
- "Build a lesson on the subjunctive using examples from my episodes."
- "Create a lesson from the first five minutes of episode X."
- "Quiz me on the words I'm learning in German."

## Options to settle first (ask only what the user left open)

1. **Source**: a named episode (`list_library`), or a topic/grammar point
   gathered across episodes (`search_examples`, `get_vocabulary`) - in v1 a
   lesson has ONE source episode, so for cross-episode topics pick the
   richest single episode.
2. **Time range**: "the first five minutes" maps to `get_transcript`
   `from_time`/`to_time`; a chapter or scene works too. Default: a coherent
   3 to 8 minute slice, not a whole 45-minute episode.
3. **Level**: the CEFR level to pitch at. If the user does not say, infer it
   from the CEFR mix of their `get_vocabulary(status=known)` words and say
   which level you picked. Level drives:
   - instruction language: A1/A2 instructions in the learner's language;
     B1+ in the target language (keep them one short sentence);
   - exercise mix: more recognition (MCQ, matching) at low levels, more
     cued recall and production at high levels;
   - which grammar point qualifies (see below) and glossary depth.

## Workflow

1. **Pull the slice.** `get_transcript` with the chosen range. Only
   `transcript_state: "ready"` is usable. Keep each sentence's `position`,
   `text`, `translation`, `speaker` - the document references sentences BY
   POSITION and must quote `text` VERBATIM (the server rejects misquotes).

2. **Gather and filter vocabulary.** Two sets: EXCLUDE and DRILL.
   - Exclusion set: `get_vocabulary(status=known)` (follow `next_cursor`
     with `limit=200` until null, or a known word slips into an exercise).
   - Due words: `get_vocabulary(status=due)` - do NOT exclude; they are
     exactly what is worth practising now (the app flags them live).
   - Drill words: `get_vocabulary(status=learning)` and `status=new`,
     prioritised.
   - Ground meanings/gender/CEFR with `lookup_word`; never invent them.

3. **Pick ONE grammar point** evidenced in the slice, at the lesson's
   level. One per lesson, always. Prefer a pattern that occurs 2+ times in
   the slice so the evidence table has real rows.

4. **Compose the document** (schema below) on the fixed six-part spine.
   Fill the spine; never invent new section types:
   1. **Listen** - `section`, an instruction `prose`, an `audio_slice` of
      the whole passage, and one gist `exercise_mcq` (recognition before
      reading).
   2. **Text** - a `dialogue` block: the slice's sentences with `position`,
      verbatim `text`, `translation`, `speaker`, and `highlights` (char
      ranges) marking the grammar pattern.
   3. **Vocabulary** - a `vocab` block: 6 to 12 entries, drill words first,
      due words included, known-and-not-due words excluded. Give `display`
      ("der Feierabend"), `forms`, `meaning`, `cefr`, and the anchor
      `position` where the word occurs (it powers audio + Ask AI).
   4. **Grammar** - one `grammar_box`: short `explanation`, `evidence`
      rows quoting the passage (with `position` where exact), a `merke`
      takeaway and an `achtung` watch-out.
   5. **Exercises** - graded, in this order: `exercise_mcq` (recognition),
      `exercise_gap_fill` (the grammar point; then vocabulary with a
      `wordbank`), an `exercise_mcq` with `audio` + `position` (listening),
      `exercise_match` (words to meanings), `exercise_production` (free
      writing with a `model_answer`). Distractors come from the user's own
      vocabulary, same part of speech, so wrong answers are plausible.
   6. **Review** - a `review` block: up to 5 "I can ..." statements
      (`can_do`) and `new_lemmas` (the words worth adding to the deck; the
      app offers them, excluding ones the user already holds).

5. **Save.** `save_lesson` with `{document}`. On 400, read the code:
   `unknown_positions` / `position_outside_slice` mean a sentence reference
   is wrong; `dialogue_mismatch` means quote the transcript verbatim
   (including punctuation). Fix and retry. The response's `unknown_lemmas`
   lists glossary lemmas the episode does not know - prefer the lemma form
   the episode's vocabulary uses and re-save if any look wrong.

6. **Deliver.** Give the user the `app_url` (the lesson opens in a Lessons
   tab on the episode). Offer `add_card` for drill words the lesson
   introduced (a 409 means it is already there - skip and carry on; never
   add `status=known` words). Mention the in-app Download button if they
   want the offline HTML worksheet (it has no audio by design). Summarise
   what the lesson covers and which words it drills.

## The lesson.v1 document (quick reference)

Top level: `{format:"lesson.v1", title, subtitle?, language,
translation_language, level?, source:{submission_id, from_time?, to_time?,
episode_title?}, objectives?[<=5], estimated_minutes?, blocks[<=40]}`.

Blocks (`type` field): `section {title, subtitle?}` · `prose {text,
style:"instruction"|"body"}` · `audio_slice {audio:{start,end}, label?}` ·
`dialogue {lines:[{position, speaker?, text, translation?,
highlights?:[[start,end],...]}]}` · `vocab {entries:[{lemma, pos?, display?,
forms?, meaning, cefr?, position?}]}` · `grammar_box {title, explanation,
evidence:[{position?, text, note}], merke?, achtung?}` · `exercise_mcq
{title?, instruction?, prompt?, audio?, position?, options[2..5],
correct:index}` · `exercise_gap_fill {title?, instruction?, wordbank?,
items:[{position?, text, answers:[[alternatives],...], translation?}]}`
(gaps are `{{1}}`, `{{2}}`, ... in `text`; `answers[n-1]` lists accepted
alternatives for gap n) · `exercise_match {pairs:[{left,right}][2..8]}` ·
`exercise_production {prompt, model_answer}` · `review {can_do?[<=5],
new_lemmas?[<=12]}`.

The server is the validator of record (strict: unknown fields and block
types are rejected). Audio is `[start,end)` seconds into the ORIGINAL
episode audio - never generate, clip or embed audio files.

## Hard rules

- **Ground, do not invent.** Every dialogue line quotes the transcript
  verbatim by `position`; meanings, genders and CEFR come from
  `lookup_word`/`get_vocabulary`. The server enforces the quoting.
- **LingoChunk is the system of record for word knowledge.** Do not drill a
  `known` word unless it is also `due`. Never write review grades back.
- **One grammar point per lesson.** Depth beats coverage; a second point is
  a second lesson.
- **Respect the source.** Only use content the tools return; put the
  episode title in `source.episode_title`.
- **No audio handling.** The app plays ranges of the original audio;
  `get_audio_clip` is NOT part of this workflow.
