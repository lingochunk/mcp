---
name: lingochunk-lesson
description: Build a self-contained HTML language lesson from the user's own LingoChunk listening history. Pick an episode or grammar topic, pull a transcript slice plus example sentences and short native-audio clips, filter out words the user already knows, then generate one shareable HTML file with gap-fill, multiple-choice, listening and blur-reveal exercises. Use when the user asks to make or build a lesson, worksheet, study sheet, or exercises from their LingoChunk content, or to "quiz me" on an episode or a word.
---

# LingoChunk lesson builder

Build a single, self-contained HTML lesson grounded in the learner's real
LingoChunk content. The division of labour is the point: **LingoChunk supplies
the materials (sentences with timestamps and translations, vocabulary with FSRS
maturity, native audio clips); you do the pedagogy and generation on the user's
own tokens.** No server-side LLM spend, and the lesson is a plain file the user
can keep, open offline, and share.

This skill uses the `lingochunk` MCP tools. If they are not available, tell the
user to add the LingoChunk MCP server (see the plugin README) and stop.

## When to use

- "Make me a lesson / worksheet / quiz from yesterday's episode."
- "Build a lesson on the subjunctive using examples from my episodes."
- "Quiz me on the words I'm learning in German."

## Workflow

1. **Choose the source.** If the user named an episode, resolve it with
   `list_library` (match on title). If they gave a topic (a grammar point or a
   word), use `search_examples(lemma=... or q=...)` and/or `get_vocabulary` to
   gather material across episodes. Confirm the language.

2. **Pull the transcript slice.** With a chosen episode, call `get_transcript`
   for the relevant sentence range or time window (`from_sentence`/`to_sentence`
   or `from_time`/`to_time`) - do NOT pull a whole 45-minute episode. Check
   `transcript_state`: only `ready` has usable sentences; `processing` means try
   again later, `unavailable` means pick another episode.

3. **Gather and filter vocabulary.** You need two sets: the words to EXCLUDE and
   the words to DRILL. This filtering is the differentiator.
   - **Exclusion set:** `get_vocabulary(status=known)` for the language. These are
     FSRS review-state words (scheduled out for now). This list is
     cursor-paginated: pass `limit=200` and keep following `next_cursor` until it
     returns null before treating the set as complete, or a known word on a later
     page will slip into an exercise.
   - **Due words:** `get_vocabulary(status=due)` as well. These are review-state
     words whose review has come up: do NOT exclude them. FLAG them in the
     glossary and allow them in exercises, since they are exactly what is worth
     practising now.
   - **Drill words:** `get_vocabulary(status=learning)` and
     `get_vocabulary(status=new)` for the words to prioritise.
   - Net rule: exclude known-and-not-due words; prioritise `learning` and `new`;
     include `due` words and mark them.
   - For any word you are unsure about, `lookup_word` to ground its meaning,
     gender and CEFR instead of inventing them.

4. **Fetch audio clips.** For each sentence you want the learner to hear, call
   `get_audio_clip(submission_id, start, end)` using that sentence's start/end
   from the transcript. Keep clips short, about 5 seconds each. The tool SAVES
   each clip to a local file and returns `{path, media_type, size_bytes}`. Read
   the file and inline it as a `data:` URI, using the RETURNED `media_type` (e.g.
   `data:audio/mpeg;base64,...` or `data:audio/mp4;base64,...`) rather than a
   hardcoded type, so the lesson is one self-contained file with no external
   dependencies. Base64 inflates the bytes by about 1.33x, so around a dozen
   5-second clips lands near 1 to 1.5 MB, comfortably shareable.
   If `get_audio_clip` fails (a 503 when clipping is unavailable, or a 429 rate
   limit), do NOT abort: build the lesson with fewer clips or none, and say in the
   lesson that audio was unavailable.

5. **Generate the lesson.** Copy `assets/lesson-template.html` (in this skill
   directory) and fill in its marked sections. Keep the template's CSS and JS -
   they make the exercises work with no backend. Produce exercises from the real
   material:
   - **Gap-fill** from real sentences (blank a `learning`, `new` or `due` target
     word).
   - **Multiple choice** with distractors drawn from the user's own vocabulary
     of the same part of speech, so the wrong answers are plausible.
   - **Listening comprehension**: play a clip, ask what was said or for the gist.
   - **Blur-reveal**: show a sentence with the translation blurred, in the spirit
     of the app's freeform cards; click to reveal.
   Include a small glossary of the target words (meaning, gender, CEFR), with the
   audio clip for each where you have one, and mark the `due` words so the learner
   knows to prioritise them.

6. **Deliver.** Write the finished HTML to a file the user can open in a browser
   (offer a sensible path/name). You can ALSO offer to `save_lesson` it to their
   LingoChunk library: that stores the lesson in the app (private by default) and
   returns a link that opens on any device, so it is not tied to this machine.
   Keeping the local file and saving to the library are both fine; offer both.
   If the lesson introduced words the learner should keep studying, offer to
   `add_card` them to their review queue (`kind=vocab` by lemma, or `kind=custom`
   for a freeform card). A 409 just means the word is already there, which is
   fine: skip it and carry on. Do not add words `get_vocabulary(status=known)`
   already covers. Then summarise what the lesson covers and which words it drills.

## Hard rules

- **One self-contained HTML file.** All audio inlined as data URIs, all CSS and
  JS inline. No relative asset paths, no CDN links (the app's lesson artefacts
  are meant to be downloadable, offline-capable and shareable).
- **LingoChunk is the system of record for word knowledge.** Do not quiz the user
  on a word `get_vocabulary(status=known)` returns UNLESS it is also `due`. FSRS
  review state means the word is scheduled for later, not that it is permanently
  mastered; `due` words are the ones to practise now. Exercise results stay in the
  lesson (in-session); do NOT try to write grades back - there is no such tool, by
  design.
- **Ground, do not invent.** Meanings, genders and CEFR come from `lookup_word` /
  `get_vocabulary`, not from guessing. Every example sentence and its timestamps
  come from `get_transcript` / `search_examples` - use the real ones.
- **Respect the source.** Only use content the tools return (the user's own
  submissions and followed collections). Keep the episode title/attribution
  visible in the lesson footer.

## Template

`assets/lesson-template.html` (in this skill directory) is the starting point.
It has clearly marked sections to replace and a lightweight, dependency-free
exercise runtime (gap-fill checking, multiple choice, blur-reveal toggles, audio
players). Do not rewrite the runtime; fill the content.
