/** Validate lesson.v1 documents against the committed public API spec.
 *
 * Usage:  npm run validate:lesson -- skills/<skill>/examples/<name>.lesson.json
 *
 * Needs Node 22.6+ (uses --experimental-strip-types, like scripts/smoke.ts).
 * `npm test` validates every skills/<*>/examples/*.json the same way and runs
 * on any Node vitest supports, so CI does not depend on this entry point.
 */
import { readFileSync } from "node:fs";
import process from "node:process";
import { createLessonValidator } from "./lesson-schema.ts";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: npm run validate:lesson -- <document.json> [more.json ...]");
  process.exit(2);
}

const validator = createLessonValidator();
let failures = 0;
for (const file of files) {
  let document: unknown;
  try {
    document = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`${file}: not readable JSON: ${(error as Error).message}`);
    failures += 1;
    continue;
  }
  const { valid, errors } = validator.validate(document);
  if (valid) {
    console.log(`${file}: valid lesson.v1 document`);
  } else {
    console.error(`${file}: INVALID`);
    for (const line of errors) console.error(`  ${line}`);
    failures += 1;
  }
}

if (failures === 0) {
  console.log(
    "Schema-valid only: the server additionally verifies sentence positions, " +
      "verbatim dialogue text and audio windows against the real submission.",
  );
}
process.exit(failures > 0 ? 1 : 0);
