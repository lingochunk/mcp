import os from "node:os";
import path from "node:path";

/** Runtime configuration, read once from the environment at startup. */
export interface Config {
  /** Base origin of the LingoChunk API, e.g. https://lingochunk.com (no trailing slash). */
  baseUrl: string;
  /** Personal access token (prefix "lcp_") sent as a Bearer credential. */
  token: string;
  /** Directory audio clips are written to (get_audio_clip returns the file path). */
  clipDir: string;
}

const DEFAULT_BASE_URL = "https://lingochunk.com";

/** Configuration for the hosted (Streamable HTTP) mode: no token here - each
 *  request carries its own caller's Bearer credential. */
export interface HttpConfig {
  /** Base origin of the LingoChunk API the server proxies to. */
  baseUrl: string;
  /** TCP port to listen on. */
  port: number;
  /** PUBLIC origin of the deployment, for URLs handed to clients (OAuth
   *  discovery). Distinct from baseUrl, which is the in-network upstream. */
  publicOrigin: string;
}

const DEFAULT_HTTP_PORT = 8100;

/**
 * Build the hosted-mode config from environment variables.
 *
 * - LINGOCHUNK_BASE_URL     (optional) API origin; when co-located with the
 *   API prefer the loopback origin (e.g. http://127.0.0.1:8000) to skip the
 *   reverse proxy.
 * - LINGOCHUNK_MCP_PORT     (optional) listen port, default 8100. PORT is
 *   honoured as a fallback for PaaS conventions.
 * - LINGOCHUNK_PUBLIC_ORIGIN (optional) the origin clients see (default the
 *   production site); used to build OAuth discovery URLs in 401 responses.
 */
export function loadHttpConfig(env: NodeJS.ProcessEnv = process.env): HttpConfig {
  const baseUrl = validateBaseUrl(env.LINGOCHUNK_BASE_URL ?? DEFAULT_BASE_URL);
  const publicOrigin = validateBaseUrl(
    env.LINGOCHUNK_PUBLIC_ORIGIN ?? DEFAULT_BASE_URL,
  );
  const rawPort = (env.LINGOCHUNK_MCP_PORT ?? env.PORT ?? "").trim();
  const port = rawPort ? Number(rawPort) : DEFAULT_HTTP_PORT;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `LINGOCHUNK_MCP_PORT must be an integer in 1-65535, got: ${rawPort}`,
    );
  }
  return { baseUrl, port, publicOrigin };
}

/** Normalise and validate an API origin, throwing a clear onboarding error. */
function validateBaseUrl(raw: string): string {
  const baseUrl = raw.replace(/\/+$/, "");
  // Fail fast on a malformed origin rather than throwing an opaque error on the
  // first request. A bare host like "localhost:8000" parses with a bogus scheme,
  // so also require http(s).
  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(`LINGOCHUNK_BASE_URL is not a valid URL: ${baseUrl}`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `LINGOCHUNK_BASE_URL must be an http(s) URL (e.g. https://lingochunk.com), got: ${baseUrl}`,
    );
  }
  return baseUrl;
}

/**
 * Build the config from environment variables.
 *
 * - LINGOCHUNK_TOKEN    (required) the personal access token, created in the
 *   LingoChunk account settings. Must start with "lcp_".
 * - LINGOCHUNK_BASE_URL (optional) override the API origin (default production).
 * - LINGOCHUNK_CLIP_DIR (optional) where audio clips are saved (default a
 *   private per-user cache dir, ~/.cache/lingochunk-mcp).
 *
 * Throws a clear error when the token is missing, so onboarding fails loudly
 * rather than sending unauthenticated requests.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const token = (env.LINGOCHUNK_TOKEN ?? "").trim();
  if (!token) {
    throw new Error(
      "LINGOCHUNK_TOKEN is required. Create a personal access token in your " +
        "LingoChunk account settings and pass it as LINGOCHUNK_TOKEN (it starts " +
        "with 'lcp_').",
    );
  }

  const baseUrl = validateBaseUrl(env.LINGOCHUNK_BASE_URL ?? DEFAULT_BASE_URL);

  // Default to a private per-user cache dir rather than the world-readable
  // shared temp dir: clips are the user's own study audio, so they should not
  // land somewhere every account on the machine can read.
  const clipDir =
    env.LINGOCHUNK_CLIP_DIR?.trim() ||
    path.join(os.homedir(), ".cache", "lingochunk-mcp");

  return { baseUrl, token, clipDir };
}
