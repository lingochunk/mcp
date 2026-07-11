import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadConfig, loadHttpConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("fails fast with a clear message when LINGOCHUNK_TOKEN is unset", () => {
    expect(() => loadConfig({})).toThrowError(/LINGOCHUNK_TOKEN is required/);
  });

  it("fails fast when the token is blank", () => {
    expect(() => loadConfig({ LINGOCHUNK_TOKEN: "   " })).toThrowError(
      /LINGOCHUNK_TOKEN/,
    );
  });

  it("uses production defaults", () => {
    const config = loadConfig({ LINGOCHUNK_TOKEN: "lcp_x" });
    expect(config.token).toBe("lcp_x");
    expect(config.baseUrl).toBe("https://lingochunk.com");
    expect(config.clipDir).toBe(path.join(os.homedir(), ".cache", "lingochunk-mcp"));
  });

  it("honours overrides and strips a trailing slash from the base URL", () => {
    const config = loadConfig({
      LINGOCHUNK_TOKEN: "lcp_x",
      LINGOCHUNK_BASE_URL: "http://localhost:8000/",
      LINGOCHUNK_CLIP_DIR: "/tmp/clips",
    });
    expect(config.baseUrl).toBe("http://localhost:8000");
    expect(config.clipDir).toBe("/tmp/clips");
  });

  it("fails fast when LINGOCHUNK_BASE_URL is not a valid URL", () => {
    expect(() =>
      loadConfig({ LINGOCHUNK_TOKEN: "lcp_x", LINGOCHUNK_BASE_URL: "not a url" }),
    ).toThrowError(/LINGOCHUNK_BASE_URL/);
  });

  it("rejects a base URL without an http(s) scheme", () => {
    expect(() =>
      loadConfig({ LINGOCHUNK_TOKEN: "lcp_x", LINGOCHUNK_BASE_URL: "localhost:8000" }),
    ).toThrowError(/http/);
  });
});

describe("loadHttpConfig", () => {
  it("needs no token and uses production defaults", () => {
    const config = loadHttpConfig({});
    expect(config.baseUrl).toBe("https://lingochunk.com");
    expect(config.port).toBe(8100);
  });

  it("prefers LINGOCHUNK_MCP_PORT over the PaaS PORT fallback", () => {
    expect(loadHttpConfig({ PORT: "3000" }).port).toBe(3000);
    expect(
      loadHttpConfig({ LINGOCHUNK_MCP_PORT: "8200", PORT: "3000" }).port,
    ).toBe(8200);
  });

  it("fails fast on a non-numeric or out-of-range port", () => {
    expect(() => loadHttpConfig({ LINGOCHUNK_MCP_PORT: "abc" })).toThrowError(
      /LINGOCHUNK_MCP_PORT/,
    );
    expect(() => loadHttpConfig({ LINGOCHUNK_MCP_PORT: "70000" })).toThrowError(
      /LINGOCHUNK_MCP_PORT/,
    );
  });

  it("validates the base URL like stdio mode does", () => {
    expect(() =>
      loadHttpConfig({ LINGOCHUNK_BASE_URL: "localhost:8000" }),
    ).toThrowError(/http/);
    expect(
      loadHttpConfig({ LINGOCHUNK_BASE_URL: "http://127.0.0.1:8000/" }).baseUrl,
    ).toBe("http://127.0.0.1:8000");
  });
});
