import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createLessonValidator } from "../scripts/lesson-schema.ts";

const skillsDir = fileURLToPath(new URL("../skills", import.meta.url));

interface Example {
  skill: string;
  name: string;
  file: string;
}

/** Every skills/<skill>/examples/*.json is a lesson.v1 document by contract
 *  (see CONTRIBUTING.md); CI fails when one drifts from the committed spec. */
function collectExamples(): Example[] {
  const examples: Example[] = [];
  for (const entry of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(skillsDir, entry.name, "examples");
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".json")) {
        examples.push({ skill: entry.name, name, file: path.join(dir, name) });
      }
    }
  }
  return examples;
}

describe("skill example lesson documents", () => {
  const validator = createLessonValidator();
  const examples = collectExamples();

  it("at least one skill ships an example document", () => {
    expect(examples.length).toBeGreaterThan(0);
  });

  it.each(examples)("$skill/examples/$name validates against lesson.v1", ({ file }) => {
    const document = JSON.parse(readFileSync(file, "utf8")) as unknown;
    const { valid, errors } = validator.validate(document);
    expect(errors).toEqual([]);
    expect(valid).toBe(true);
  });
});
