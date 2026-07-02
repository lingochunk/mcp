// Live smoke test against a REAL LingoChunk API. It makes real authenticated
// requests, so it is NOT part of the automated test suite and must never run in
// CI. Use it by hand to confirm the request/response shapes against a running
// server.
//
// Usage:
//   npm run build
//   LINGOCHUNK_TOKEN=lcp_... [LINGOCHUNK_BASE_URL=http://localhost:8000] \
//     node --experimental-strip-types scripts/smoke.ts
//
// It imports the built client from dist/, so build first.
import { LingoChunkClient } from "../dist/client.js";
import { loadConfig } from "../dist/config.js";

async function step(label: string, fn: () => Promise<unknown>): Promise<void> {
  try {
    const value = await fn();
    const preview = JSON.stringify(value).slice(0, 200);
    console.log(`ok   ${label}: ${preview}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`FAIL ${label}: ${message}`);
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new LingoChunkClient(config);
  console.log(`base: ${config.baseUrl}`);

  await step("get_vocabulary", () => client.getVocabulary({ limit: 3 }));
  await step("list_library", () => client.listLibrary({ limit: 3 }));
  await step("search_examples", () => client.searchExamples({ q: "a", limit: 3 }));

  // Endpoints that need a submission id: use the first library item if any.
  const library = (await client.listLibrary({ limit: 1 })) as {
    items?: { id?: string }[];
  };
  const submissionId = library.items?.[0]?.id;
  if (!submissionId) {
    console.log("skip transcript/audio/clip: no submissions in the library");
    return;
  }
  console.log(`using submission ${submissionId}`);
  await step("get_transcript", () =>
    client.getTranscript(submissionId, { to_sentence: 3 }),
  );
  await step("get_audio_url", () => client.getAudioUrl(submissionId));
  await step("get_audio_clip", () => client.getAudioClip(submissionId, 0, 2));
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
