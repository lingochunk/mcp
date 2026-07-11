---
name: lingochunk-course
description: Plan a multi-lesson course from one of the user's own LingoChunk episodes or a collection - a named, ordered series where each lesson covers a different grammar point and ramps in difficulty, built with the lingochunk-lesson flow and filed under a course. Use when the user asks for a course, a series, a multi-part study plan, "a whole set of lessons", or "break this episode into a course".
---

# LingoChunk course planner

Turn one rich episode (or a collection) into a coherent SERIES of lessons: a
named `course` with N ordered lessons, each a self-contained `lingochunk-lesson`
document with a DIFFERENT grammar point and a difficulty that ramps across the
series. LingoChunk supplies the materials (transcripts with positions and
translations, FSRS-graded vocabulary) and renders every lesson natively; your
job is the arc - how to slice the source, what each lesson teaches, and in what
order - and then to drive the existing lesson flow once per slice.

This skill uses the `lingochunk` MCP tools. If they are not available, tell the
user to add the LingoChunk MCP server (see the plugin README) and stop. This
skill ORCHESTRATES `lingochunk-lesson`: read that guide (`get_authoring_guide`
with `topic='lesson'`) before composing any single lesson - this one only adds
the multi-lesson planning on top.

## When to use

- "Make a course out of this episode."
- "Build me a series of lessons on the B1 podcast, one per scene."
- "Break this 20-minute episode into a study plan I can work through."
- "Turn this collection into a beginner course."

## Options to settle first (ask only what the user left open)

1. **Source**: one episode (`list_library`), or a collection you slice
   episode by episode. A single lesson has ONE source episode in v1, so each
   lesson in the course draws from one episode (or one slice of it).
2. **Length**: how many lessons. Default to what the material honestly
   supports - a 3-8 minute slice per lesson, so a 20-minute episode is ~3-5
   lessons, not fifteen thin ones. Say the number you chose and why.
3. **Level and ramp**: the starting CEFR level and whether it climbs. Infer
   the floor from the CEFR mix of `get_vocabulary(status=known)` if the user
   does not say. State the ramp (e.g. "A2 for lessons 1-2, B1 for 3-4").

## Workflow

1. **Inventory the source.** `list_library` to find the episode(s). For each,
   pull the shape: `get_transcript` (sentence positions, timings, speakers) and
   `get_vocabulary` (what is known vs learning/new/due). You are looking for
   natural seams - scene changes, topic shifts, a run of sentences that share a
   grammar pattern - and for which grammar points the material can actually
   evidence.
2. **Split into coherent slices.** Carve the source into N slices, each a
   3-8 minute span that stands on its own AND carries enough evidence for one
   grammar point. Prefer seams the audio already has (a new scene, a new
   speaker turn) over arbitrary time cuts. Write down, per slice: its
   `from_time`/`to_time`, its ONE grammar point, its level, and 2-3 archetypes
   from the lesson skill's menu - deliberately varying the archetype mix across
   slices so consecutive lessons do not feel identical.
3. **Ramp the difficulty.** Order the slices so difficulty climbs: earlier
   lessons lean on recognition (MCQ, matching, sentence reorder) and lower-level
   grammar; later lessons lean on recall and production (dictation, shadowing,
   gap-fill, production) and harder points. No grammar point repeats across the
   course - depth over coverage, one point per lesson, a different point each
   lesson.
4. **Create the course.** `create_course` with a `title` and a short
   `description` naming the arc. Keep its `id`.
5. **Build the lessons in order.** For each slice, run the full
   `lingochunk-lesson` flow (pull the slice, filter vocabulary, pick the ONE
   grammar point you assigned it, compose on the scaffold with its archetypes).
   Before each save, call `validate_lesson` with `{document}` and fix EVERY
   problem it reports; only once it returns `valid: true` do you `save_lesson`
   with `{document, course_id, sequence}` - `sequence` = the lesson's 1-based
   position in the course (ties break by created_at, but pass explicit
   sequences so the order is deliberate). Stamp
   `generator: {skill: "lingochunk-lesson"}` on each document.
6. **Deliver.** List the course and its lessons in order (title, level, grammar
   point, `app_url`), so the user can work through them as a series. Offer
   `add_card` for the drill words the course introduced. Confirm the course
   groups them: `list_lessons` echoes each lesson's `course_id`, `sequence` and
   `course_title`.

## Hard rules

- **Delegate the pedagogy.** Every single lesson obeys the `lingochunk-lesson`
  rules (anchoring, verbatim quoting, one grammar point, archetype variety).
  This skill only decides the arc; it does not relax any lesson-level rule.
- **A different grammar point per lesson.** The point of a course is breadth
  across lessons and depth within each; never repeat a grammar point.
- **Ramp, do not flatten.** Order lessons by increasing difficulty; do not
  emit N interchangeable lessons at one level.
- **Validate before every save.** Call `validate_lesson` and reach
  `valid: true` before `save_lesson`, for each lesson in the course.
- **Ground, do not invent.** Quoted lines come from the transcript by
  `position`; meanings, genders and CEFR come from the tools. Only use content
  the tools return; the user's data never goes to any other service.
- **No audio handling.** Reference `[start, end)` windows of the original
  episode audio; never generate, cut or embed audio. Deleting a course only
  un-groups its lessons - it never deletes them.
