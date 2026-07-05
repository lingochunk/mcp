---
name: lingochunk-cards
description: Create native-grade flashcards in the user's LingoChunk deck from real episode content via the card.v1 add_card kinds (word, phrase, collocation, idiom, chunk, grammar, cloze, contrast, qa, production). Anchors every card to a verbatim transcript sentence so the server can paint the highlight/blur and cut native speaker audio. Use when the user asks to make flashcards or Anki cards from an episode, add vocabulary or grammar drills to their deck, or turn a transcript passage into study cards.
---

# LingoChunk card builder

Create cards that look exactly like the app's own: real sentence, target
highlighted or blurred, native speaker audio, forward+reverse pairs. The
division of labour: **you choose what to teach and write the glosses;
LingoChunk verifies the anchors and derives everything visual/audible.**

This skill uses the `lingochunk` MCP tools. If they are not available, tell
the user to add the LingoChunk MCP server (see the plugin README) and stop.

## The one rule that matters

**Every span you send must be copied VERBATIM from the transcript.** Fetch
the sentence with `get_transcript` first; `focus_span` must be the exact
surface form as spoken ("habe", not "haben"; "einem", not "ein"). The server
rejects non-verbatim spans on answer-hiding kinds
(`code=focus_span_not_verbatim`) because a paraphrased example breaks both
the blur painting and the audio alignment. Never invent or "improve" an
example sentence; if the episode has no good sentence for an item, skip the
item and say so.

## Workflow

1. `get_transcript` for the episode (slice by time range if the user named
   one). Note each sentence's `position` - that is your anchor.
2. Pick targets. One card = one thing to learn. Prefer items the sentence
   demonstrates naturally.
3. `add_card` per item with a card.v1 kind (below). Include `note` (one-line
   why), `hint` (only when the answer has competing valid fills), `cefr`
   when you are confident.
4. **Read the response.** `problems[]` lists degradations
   (`focus_span_no_timings`, `context_position_unknown`, ...). Fix what you
   can and resend - the same headword updates in place (`created: false`),
   so a correction never duplicates a card.
5. Report to the user what was added, kind by kind, and anything skipped.

## Choosing a kind

| Kind | Use for | Front shows |
|---|---|---|
| `word` | one new word (include the article: "die Landschaft") | headword hero + example with the word highlighted |
| `phrase` / `idiom` / `collocation` | multi-word units, fixed combinations | same, multi-word headword |
| `chunk` | a whole useful sentence/utterance | the chunk as headword |
| `grammar` | a form choice the sentence demonstrates (case ending, article, verb form, word order) | example with the morpheme blurred + "why" slot |
| `cloze` | recall one content word in context | example with the word blurred |
| `contrast` | 2-3 confusables (wissen/kennen) | option chips + gap in the example |
| `qa` | an explanation with no single gap | the question as prose |
| `production` | meaning → produce the target phrase | the gloss as prompt, target blurred |

Lexical kinds (word/phrase/collocation/idiom/chunk) create a
forward+reverse pair and get a native-audio clip of the focus span; pass
`direction: "forward"` if the user only wants recognition. Study kinds are
forward-only by design.

## Grammar cards done right (the reason this skill exists)

Blur the **morpheme, not the clause**: for "Wir wohnen in einem Haus", the
focus span is `einem`, the translation slot carries the why ("dative after
'in' for location"), and the note adds the one-line rule. Give a `hint` when
several fills are grammatical ("dative", "past participle"). Do NOT make
rule-memorisation cards ("What are the dative prepositions?") - route the
rule through a real sentence, or use `qa` sparingly for a genuine
explanation the user asked about.

## Quality rubric (check every card before sending)

Distilled from the failure modes that make AI-generated cards unusable:

- **Unambiguous**: exactly one thing is being asked; the front cannot be
  answered two valid ways without a hint.
- **One target**: a card never teaches two words or two rules at once.
- **Grounded**: example is verbatim from THIS episode; never a made-up
  sentence.
- **Short slots**: translation ≤ a phrase, note ≤ one line. No wall-of-text
  backs; if you need a paragraph, it is a `qa` card or not a card at all.
- **Self-contained**: the card makes sense months later without the chat
  context.
- **Not context-cheatable**: for cloze/grammar, the sentence should not spell
  out the answer elsewhere.

## Don'ts

- Don't paraphrase transcript sentences (see the one rule).
- Don't batch dozens of cards uninvited - propose, let the user choose, or
  follow their stated scope.
- Don't use legacy `kind=custom` when a card.v1 kind fits; flat front/back
  cards render without highlight, audio window, or per-kind chrome.
- Don't retry a `409 duplicate_card` (legacy kinds) or resend unchanged
  bodies to clear `problems` that need different input.
- Don't add reverse pairs for study kinds - the server ignores it and tells
  you (`direction_ignored`).
