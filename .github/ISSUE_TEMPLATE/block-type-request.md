---
name: New block type request
about: Request a new lesson.v1 block or field (an app change, not a skill PR)
title: "block: <interaction name>"
labels: block-type
---

## The interaction

What should the learner see and do? A rough sketch or an example from a
paper coursebook helps.

## The pedagogy it unlocks

Which kinds of lessons or skills are blocked without it? Why can it not be
expressed with the existing blocks (MCQ, gap-fill, match, production,
dialogue, vocab, grammar box, audio slice)?

## Data shape (optional)

If you have one in mind: the JSON fields the block would carry, and what
the server should validate (positions? audio windows? caps?).

Note: block types live in the closed-source app (schema + native renderer +
HTML export), so these ship on the app's release cycle. Once a block
exists, every skill can use it.
