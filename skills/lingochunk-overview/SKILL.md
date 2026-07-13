---
name: lingochunk-overview
description: Give a short guided tour of what the user can do with their LingoChunk connection, then go deeper on the area they pick. Use when the user asks what they can do with LingoChunk, what is possible, how to get started, says "help" about the connection, or is exploring it for the first time.
---

# What you can do with LingoChunk

You are connected to the user's LingoChunk account: their episodes with
timestamped transcripts and native audio, their FSRS-graded vocabulary, their
decks and lessons, and (for creators) the collections they publish. This
guide is the menu of what to offer.

## How to answer "what can I do?"

- **Answer short first**: one line per area below, each with its example
  prompt. Do NOT dump this whole guide on the user.
- **Then ask which area to go deeper on** - or just do the thing they pick.
- Before actually composing anything, call `get_authoring_guide` with the
  area's topic (in parentheses below) and follow it; that is where the craft
  rules live. Areas marked "no guide" need no preparation.
- If a tool answers 403 naming a scope, the connection was granted narrow
  permissions: tell the user to reconnect (or mint a token with that scope)
  via LingoChunk -> Settings -> API tokens.

## The menu

For every learner:

1. **Talk through an episode** (topic `discuss`) - work through a real
   episode conversationally, explaining grammar and vocabulary as they come
   up, grounded in the user's own data.
   Example: *"Talk me through yesterday's episode and explain the tricky
   bits."*
2. **Check words and quiz** (no guide) - the user's vocabulary with live
   maturity states: known, learning, new, due.
   Example: *"Which of my German words are due today? Quiz me on them."*
3. **Build a lesson** (topic `lesson`) - a coursebook-style lesson the app
   renders natively: real-audio exercises, gap-fills, dictation, shadowing,
   one grammar point, an AI tutor, an offline worksheet download.
   Example: *"Build a B1 lesson from the first five minutes of episode 12."*
4. **Revise a lesson** (topic `lesson`) - edit a saved lesson IN PLACE
   (same id and links): the app's Co-edit mode labels each block §1, §2, ...
   and refreshes live, so the user points at a block and watches your edit
   land within seconds.
   Example: *"In my lesson, change §5 to a two-person dialogue."*
5. **Build a course** (topic `course`) - a named, ordered series of lessons
   with a different grammar point per lesson and ramping difficulty.
   Example: *"Turn this 20-minute episode into a four-lesson course, A2 to
   B1."*
6. **Make flashcards and export to Anki** (topic `cards`) - native-grade
   cards anchored to verbatim sentences (highlight/blur painting, native
   audio clip), plus `.apkg` deck export.
   Example: *"Make cards for the idioms in episode 12, then export the deck
   to Anki."*
7. **Add languages** (topic `add-language`) - fan an episode out into up to
   ten more languages server-side, or hand-craft the translation sentence by
   sentence - including simplified same-language versions (e.g. German audio
   glossed in easier A2 German).
   Example: *"Add Polish and Turkish to episode 12."* or *"Make a simplified
   German (A2) version of it."*

For creators (per-account features):

8. **Creator notes** (topic `annotations`) - short notes pinned to the exact
   idioms, fixed phrases and cultural references in the transcript; followers
   see them as highlights with a note sheet, and as note cards.
   Example: *"Annotate the useful expressions in episode 12 for my
   students."*
9. **Publish to an audience** (topic `lesson`) - lessons save private by
   default; saving with visibility `public` surfaces one to everyone who can
   view the episode, e.g. followers of the creator's channel.
   Example: *"Build a lesson from episode 12 and publish it to my channel."*

## Worth knowing (relay when relevant)

- Everything is grounded in the user's own content: quotes, sentence
  positions and audio windows are validated server-side, so an invented or
  misquoted line is rejected rather than stored.
- The app renders lessons natively with the real episode audio and live word
  knowledge; nothing here generates synthetic speech.
- Composition runs on this agent; it never spends LingoChunk's AI budget.
- The connection is revocable at any time in Settings -> API tokens.
- Creators get the full picture (setup, workflows, best practices, example
  prompts) in the creator guide:
  https://github.com/lingochunk/mcp/blob/main/docs/creator-guide.md
