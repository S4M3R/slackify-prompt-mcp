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
			({ message, language = "English" }) =>
				{
					let channel = undefined;
			 return ({
				messages: [{
					role: "assistant",
					content: {
						type: "text",
						text: `You are a Slack formatting assistant. You will receive the raw response from another AI. Your job is to transform it into a Slack-ready message that's:

- Very concise and to the point.
- Written in ${language}.
- Formatted with Slack markdown (e.g. *bold*, _italic_, • bullet points, 'inline code') where appropriate.
- No unnecessary detail or fluff—focus only on the key points.${channel ? `\n- Tailored appropriately for the #${channel} channel.` : ''}

Output only the formatted Slack message as string`
					}
				}, {
					role: "user",
					content: {
						type: "text",
						text: `Please slackify this message:${channel ? ` (for #${channel} channel)` : ''}\n\n${message}`
					}
				}]
			})
		}
		)
	}

	}


export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		
		// Check for auth parameter in URL query string or Authorization header
		const authFromQuery = url.searchParams.get('auth');
		const authFromHeader = request.headers.get('authorization');
		
		if (authFromQuery+"" !== 'true' && authFromHeader+"" !== 'Bearer true') {
			return new Response(JSON.stringify({ 
				error: 'Authentication required',
				message: 'Please provide auth=true in query string or Authorization: Bearer true header'
			}), { 
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		let channel = url.searchParams.get('channel');

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}


		return new Response("Not found", { status: 404 });
	},
};
