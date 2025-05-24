import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "Slackify Prompt",
		version: "1.0.0",
	});

	async init() {
		// Simple addition tool
		this.server.prompt(
			"slackify-message",
			{ message: z.string(), language: z.string().optional() },
			({ message, language = "English" }) => ({
				messages: [{
					role: "assistant",
					content: {
						type: "text",
						text: `You are a Slack formatting assistant. You will receive the raw response from another AI. Your job is to transform it into a Slack-ready message that’s:

- Very concise and to the point.
- Written in ${language}.
- Formatted with Slack markdown (e.g. *bold*, _italic_, • bullet points, 'inline code') where appropriate.
- No unnecessary detail or fluff—focus only on the key points.

Output only the formatted Slack message as string`
					}
				}, {
					role: "user",
					content: {
						type: "text",
						text: `Please slackify this message:\n\n${message}`
					}
				}]
			})
		)

	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
