/** Compile a lesson.v1 validator from the committed public API spec.
 *
 * Shared by scripts/validate-lesson.ts (the contributor CLI) and
 * test/examples.test.ts (CI validation of every skill's example documents).
 *
 * This is schema validation only. The server is the validator of record and
 * additionally checks what a schema cannot: sentence positions exist in the
 * source submission (and fall inside the declared slice), dialogue text
 * matches the stored transcript verbatim, and audio windows fit the episode.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";

const SPEC_URL = new URL("../spec/openapi-public-v1.json", import.meta.url);
const DOCUMENT_POINTER = "#/components/schemas/LessonDocumentV1";

export interface LessonValidator {
  /** Block `type` tags the schema knows, e.g. "prose", "dialogue". */
  blockTypes: string[];
  /** Validate a parsed document; on failure `errors` holds readable lines. */
  validate(document: unknown): { valid: boolean; errors: string[] };
}

export function createLessonValidator(): LessonValidator {
  const spec = JSON.parse(readFileSync(fileURLToPath(SPEC_URL), "utf8"));
  // ajv rejects the OpenAPI discriminator's `mapping` key, so the block union
  // is validated as a plain oneOf. For error REPORTING each block is instead
  // re-validated against its own declared type's component schema: a oneOf
  // failure with allErrors mixes every branch's complaints (with unreliable
  // schemaPaths once ajv inlines a $ref), which is useless to a contributor.
  const ajv = new Ajv2020({ allErrors: true, strict: false, validateFormats: false });
  ajv.addSchema(spec, "openapi");
  const document = ajv.getSchema(`openapi${DOCUMENT_POINTER}`);
  if (!document) {
    throw new Error(`${DOCUMENT_POINTER} not found in spec/openapi-public-v1.json`);
  }
  const mapping: Record<string, string> =
    spec.components.schemas.LessonDocumentV1.properties.blocks.items.discriminator.mapping;
  const branchByTag = new Map<string, ValidateFunction>();
  for (const [tag, ref] of Object.entries(mapping)) {
    const branch = ajv.getSchema(`openapi#/components/schemas/${ref.split("/").pop()}`);
    if (!branch) throw new Error(`block schema for ${tag} not found in the spec`);
    branchByTag.set(tag, branch);
  }
  return {
    blockTypes: [...branchByTag.keys()].sort(),
    validate(doc: unknown) {
      const valid = document(doc) as boolean;
      const errors = valid ? [] : describeErrors(doc, document.errors ?? [], branchByTag);
      return { valid, errors };
    },
  };
}

function describeErrors(
  doc: unknown,
  topErrors: ErrorObject[],
  branchByTag: Map<string, ValidateFunction>,
): string[] {
  const lines = new Set<string>();
  // Document-level problems: anything not inside a specific block (missing
  // top-level fields, bad enum values, too many blocks, ...).
  for (const error of topErrors) {
    if (/^\/blocks\/\d+/.test(error.instancePath)) continue;
    lines.add(formatError(error, ""));
  }
  // Block-level problems: validate each block against the schema its own
  // `type` tag names, so the report only mentions the type the author used.
  const blocks =
    typeof doc === "object" && doc !== null ? (doc as { blocks?: unknown }).blocks : undefined;
  if (Array.isArray(blocks)) {
    blocks.forEach((block: unknown, index: number) => {
      const tag =
        typeof block === "object" && block !== null && typeof (block as { type?: unknown }).type === "string"
          ? ((block as { type: string }).type)
          : undefined;
      const branch = tag === undefined ? undefined : branchByTag.get(tag);
      if (branch === undefined) {
        const known = [...branchByTag.keys()].sort().join(", ");
        lines.add(`/blocks/${index}: unknown block type ${JSON.stringify(tag)} (known: ${known})`);
        return;
      }
      if (!branch(block)) {
        for (const error of branch.errors ?? []) {
          lines.add(formatError(error, `/blocks/${index}`));
        }
      }
    });
  }
  if (lines.size === 0) {
    // Safety net: the document failed but nothing above explained it.
    for (const error of topErrors) lines.add(formatError(error, ""));
  }
  return [...lines];
}

function formatError(error: ErrorObject, prefix: string): string {
  const where = `${prefix}${error.instancePath}` || "(document root)";
  const params = error.params as { additionalProperty?: string };
  const detail =
    error.keyword === "additionalProperties" && params.additionalProperty !== undefined
      ? ` (${JSON.stringify(params.additionalProperty)})`
      : "";
  return `${where}: ${error.message ?? error.keyword}${detail}`;
}
