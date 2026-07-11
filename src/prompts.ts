import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GUIDES, GUIDE_TOPICS } from "./generated/guides.js";

/**
 * Register one MCP prompt per authoring skill (name `lingochunk-<skill>`),
 * each returning that skill's full markdown as a user-role message. This is
 * how remote clients (claude.ai, ChatGPT, ...) can pull the craft guidance a
 * slash-command / prompt picker exposes - the same content get_authoring_guide
 * serves as a tool, but surfaced through the prompts capability.
 *
 * Calling registerPrompt makes the high-level McpServer advertise the prompts
 * capability in the initialize handshake, so this must run before
 * server.connect() in BOTH transports (stdio in index.ts, HTTP in http.ts).
 */
export function registerPrompts(server: McpServer): void {
  for (const topic of GUIDE_TOPICS) {
    const guide = GUIDES[topic];
    server.registerPrompt(
      guide.promptName,
      { title: guide.promptName, description: guide.description },
      () => ({
        messages: [
          {
            role: "user",
            content: { type: "text", text: guide.body },
          },
        ],
      }),
    );
  }
}
