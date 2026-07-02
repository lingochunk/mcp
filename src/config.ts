import os from "node:os";
import path from "node:path";

/** Runtime configuration, read once from the environment at startup. */
export interface Config {
  /** Base origin of the LingoChunk API, e.g. https://lingochunk.com (no trailing slash). */
  apiBaseUrl: string;
  /** Personal access token (prefix "lcp_") sent as a Bearer credential. */
  token: string;
  /** Directory audio clips are written to (get_audio_clip returns the file path). */
  outputDir: string;
}

const DEFAULT_API_BASE_URL = "https://lingochunk.com";

/**
 * Build the config from environment variables.
 *
 * - LINGOCHUNK_TOKEN   (required) the personal access token, created in the
 *   LingoChunk account settings. Must start with "lcp_".
 * - LINGOCHUNK_API_URL (optional) override the API origin (default production).
 * - LINGOCHUNK_OUTPUT_DIR (optional) where audio clips are saved (default the
 *   OS temp dir under a lingochunk-mcp/ folder).
 *
 * Throws a clear error when the token is missing, so onboarding fails loudly
 * rather than sending unauthenticated requests.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const token = (env.LINGOCHUNK_TOKEN ?? "").trim();
  if (!token) {
    throw new Error(
      "LINGOCHUNK_TOKEN is required. Create a personal access token in your " +
        "LingoChunk account settings (Settings -> API tokens) and pass it as " +
        "LINGOCHUNK_TOKEN (it starts with 'lcp_').",
    );
  }

  const apiBaseUrl = (env.LINGOCHUNK_API_URL ?? DEFAULT_API_BASE_URL).replace(
    /\/+$/,
    "",
  );

  const outputDir =
    env.LINGOCHUNK_OUTPUT_DIR?.trim() ||
    path.join(os.tmpdir(), "lingochunk-mcp");

  return { apiBaseUrl, token, outputDir };
}
