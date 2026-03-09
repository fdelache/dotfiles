/**
 * Fellow.ai Extension for Pi
 *
 * Provides tools to access Fellow meeting data: search meetings,
 * get transcripts, summaries, action items, and participants.
 *
 * On first use, prompts for credentials interactively and persists
 * them to ~/.fellow-pi/config.json. No env vars needed.
 *
 * You can also pre-configure via environment variables:
 *   FELLOW_API_KEY     — Your Fellow personal API key
 *   FELLOW_SUBDOMAIN   — Your workspace subdomain
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import * as fs from "fs";
import * as path from "path";

// --- Credential Management ---

const CONFIG_DIR = path.join(process.env.HOME ?? "~", ".fellow-pi");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");
const FELLOW_URL = "https://shopify.fellow.app/";

interface FellowConfig {
	apiKey: string;
	subdomain: string;
}

function loadConfig(): FellowConfig | null {
	// Env vars take priority
	if (process.env.FELLOW_API_KEY && process.env.FELLOW_SUBDOMAIN) {
		return { apiKey: process.env.FELLOW_API_KEY, subdomain: process.env.FELLOW_SUBDOMAIN };
	}
	// Then try persisted config
	try {
		if (fs.existsSync(CONFIG_FILE)) {
			const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
			const config = JSON.parse(raw) as FellowConfig;
			if (config.apiKey && config.subdomain) return config;
		}
	} catch {
		// Corrupted config, ignore
	}
	return null;
}

function saveConfig(config: FellowConfig): void {
	fs.mkdirSync(CONFIG_DIR, { recursive: true });
	fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

// --- Fellow API Client ---

interface FellowSpeechSegment {
	start: number;
	end: number;
	speaker: string;
	text: string;
}

interface FellowAiNoteSection {
	title: string;
	type: string;
	content: string | Array<{ timestamp?: number; text: string }>;
}

interface FellowAiNote {
	id: string;
	title: string;
	sections: FellowAiNoteSection[];
}
interface FellowRecording {
	id: string;
	title: string;
	created_at: string;
	updated_at?: string;
	started_at?: string;
	ended_at?: string;
	note_id?: string;
	transcript?: { speech_segments: FellowSpeechSegment[]; language_code?: string } | null;
	ai_notes?: FellowAiNote[] | null;
}
interface FellowNote {
	id: string;
	title: string;
	created_at: string;
	updated_at?: string;
	event_start?: string;
	event_end?: string;
	content_markdown?: string;
	event_attendees?: Array<{ email: string; name?: string }>;
}
interface FellowPaginatedResponse<T> {
	page_info?: { cursor?: string | null; page_size?: number };
	data: T[];
}

class FellowClient {
	private apiKey: string;
	private baseUrl: string;

	constructor(config: FellowConfig) {
		this.apiKey = config.apiKey;
		this.baseUrl = `https://${config.subdomain}.fellow.app/api/v1`;
	}

	private async request(method: string, endpoint: string, body?: Record<string, unknown>): Promise<unknown> {
		const url = `${this.baseUrl}${endpoint}`;
		const options: RequestInit = {
			method,
			headers: {
				"X-API-KEY": this.apiKey,
				"Content-Type": "application/json",
			},
		};
		if (body) {
			options.body = JSON.stringify(body);
		}

		const response = await fetch(url, options);
		if (!response.ok) {
			const errorText = await response.text();
			if (response.status === 401 || response.status === 403) {
				throw new Error(
					`Fellow API authentication failed (${response.status}). Your API key may be invalid or expired. Use /fellow-setup to reconfigure.`,
				);
			}
			throw new Error(`Fellow API error (${response.status}): ${errorText}`);
		}
		return response.json();
	}

	async searchMeetings(opts: {
		title?: string;
		created_at_start?: string;
		created_at_end?: string;
		limit?: number;
	}): Promise<FellowPaginatedResponse<FellowRecording>> {
		const body: Record<string, unknown> = {};
		const filters: Record<string, string> = {};
		if (opts.title) filters.title = opts.title;
		if (opts.created_at_start) filters.created_at_start = opts.created_at_start;
		if (opts.created_at_end) {
			if (opts.created_at_end === opts.created_at_start) {
				const d = new Date(opts.created_at_end);
				d.setDate(d.getDate() + 1);
				filters.created_at_end = d.toISOString().split("T")[0];
			} else {
				filters.created_at_end = opts.created_at_end;
			}
		}
		if (Object.keys(filters).length > 0) body.filters = filters;
		body.pagination = { cursor: null, page_size: opts.limit ?? 20 };

		const resp = (await this.request("POST", "/recordings", body)) as { recordings: FellowPaginatedResponse<FellowRecording> };
		return resp.recordings;
	}

	async getTranscript(recordingId: string): Promise<FellowRecording> {
		const recording = (await this.request("GET", `/recording/${recordingId}`)) as { recording: FellowRecording };
		return recording.recording;
	}

	async searchNotes(opts: {
		title?: string;
		created_at_start?: string;
		created_at_end?: string;
		include_content?: boolean;
		include_attendees?: boolean;
		limit?: number;
	}): Promise<FellowPaginatedResponse<FellowNote>> {
		const body: Record<string, unknown> = {};
		const filters: Record<string, string> = {};
		if (opts.title) filters.title = opts.title;
		if (opts.created_at_start) filters.created_at_start = opts.created_at_start;
		if (opts.created_at_end) filters.created_at_end = opts.created_at_end;
		if (Object.keys(filters).length > 0) body.filters = filters;

		const include: Record<string, boolean> = {};
		if (opts.include_content) include.content_markdown = true;
		if (opts.include_attendees) include.event_attendees = true;
		if (Object.keys(include).length > 0) body.include = include;

		body.pagination = { cursor: null, page_size: opts.limit ?? 20 };

		const resp = (await this.request("POST", "/notes", body)) as { notes: FellowPaginatedResponse<FellowNote> };
		return resp.notes;
	}

	async getNote(noteId: string): Promise<FellowNote> {
		const resp = (await this.request("GET", `/note/${noteId}`)) as { note: FellowNote };
		return resp.note;
	}
}

// --- Extension ---

export default function (pi: ExtensionAPI) {
	let client: FellowClient | null = null;

	// Try to load existing config at startup
	const initialConfig = loadConfig();
	if (initialConfig) {
		client = new FellowClient(initialConfig);
	}

	// --- Interactive setup flow ---

	async function runSetup(ctx: ExtensionContext): Promise<FellowClient | null> {
		if (!ctx.hasUI) {
			ctx.ui.notify("Fellow setup requires interactive mode.", "error");
			return null;
		}

		// Open Fellow in the browser
		ctx.ui.notify("Opening Fellow in your browser...", "info");
		await pi.exec("open", [FELLOW_URL]);

		ctx.ui.notify(
			"In Fellow: click your avatar (bottom-left) → User Settings → API, MCP & Integrations → create a new API key.\nCopy the key (it's only shown once).",
			"info",
		);

		// Ask for subdomain
		const subdomain = await ctx.ui.input(
			"Fellow workspace subdomain (the part before .fellow.app in your URL):",
			"shopify",
		);
		if (!subdomain) {
			ctx.ui.notify("Fellow setup cancelled — no subdomain provided.", "warn");
			return null;
		}

		// Ask for API key
		const apiKey = await ctx.ui.input("Paste your Fellow API key:", "");
		if (!apiKey) {
			ctx.ui.notify("Fellow setup cancelled — no API key provided.", "warn");
			return null;
		}

		const config: FellowConfig = { apiKey: apiKey.trim(), subdomain: subdomain.trim() };

		// Validate the credentials with a quick API call
		ctx.ui.notify("Validating credentials...", "info");
		const testClient = new FellowClient(config);
		try {
			await testClient.searchMeetings({ limit: 1 });
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			ctx.ui.notify(`Fellow API validation failed: ${msg}`, "error");
			return null;
		}

		// Persist
		saveConfig(config);
		ctx.ui.notify(`Fellow credentials saved to ${CONFIG_FILE}`, "success");

		client = testClient;
		return client;
	}

	// Helper: ensure we have a client, running setup if needed
	async function ensureClient(ctx: ExtensionContext): Promise<FellowClient> {
		if (client) return client;
		const newClient = await runSetup(ctx);
		if (!newClient) {
			throw new Error(
				"Fellow is not configured. Use /fellow-setup to set up your API key, or set FELLOW_API_KEY and FELLOW_SUBDOMAIN environment variables.",
			);
		}
		return newClient;
	}

	// --- Command: /fellow-setup ---

	pi.registerCommand("fellow-setup", {
		description: "Configure Fellow API credentials (opens browser, prompts for key)",
		handler: async (_args, ctx) => {
			await runSetup(ctx);
		},
	});

	// --- Command: /fellow-reset ---

	pi.registerCommand("fellow-reset", {
		description: "Remove stored Fellow credentials",
		handler: async (_args, ctx) => {
			try {
				if (fs.existsSync(CONFIG_FILE)) {
					fs.unlinkSync(CONFIG_FILE);
				}
				client = null;
				ctx.ui.notify("Fellow credentials removed.", "info");
			} catch (err) {
				ctx.ui.notify(`Failed to remove credentials: ${err}`, "error");
			}
		},
	});

	// --- Tool: fellow_search_meetings ---

	pi.registerTool({
		name: "fellow_search_meetings",
		label: "Fellow: Search Meetings",
		description:
			"Search for meetings/recordings in Fellow. Filter by title and/or date range. Returns meeting titles, dates, IDs, and durations. If Fellow is not configured, triggers interactive setup.",
		parameters: Type.Object({
			title: Type.Optional(Type.String({ description: "Filter by meeting title (partial match)" })),
			start_date: Type.Optional(
				Type.String({ description: "Start date (YYYY-MM-DD). Meetings created on or after this date." }),
			),
			end_date: Type.Optional(
				Type.String({ description: "End date (YYYY-MM-DD). Meetings created before this date." }),
			),
			limit: Type.Optional(Type.Number({ description: "Max results (1-50, default 20)" })),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const c = await ensureClient(ctx);
			const result = await c.searchMeetings({
				title: params.title,
				created_at_start: params.start_date,
				created_at_end: params.end_date,
				limit: params.limit,
			});

			const meetings = result.data ?? [];
			if (meetings.length === 0) {
				return { content: [{ type: "text", text: "No meetings found matching the criteria." }], details: {} };
			}

			const lines = meetings.map((m: FellowRecording) => {
				const date = m.started_at ?? m.created_at;
				let duration = "";
				if (m.started_at && m.ended_at) {
					const mins = Math.round((new Date(m.ended_at).getTime() - new Date(m.started_at).getTime()) / 60000);
					if (mins > 0) duration = ` (${mins}min)`;
				}
				const noteRef = m.note_id ? ` [note_id: ${m.note_id}]` : "";
				return `- **${m.title}** — ${date}${duration} [recording_id: ${m.id}]${noteRef}`;
			});

			const text = `Found ${meetings.length} meeting(s):\n\n${lines.join("\n")}`;
			return { content: [{ type: "text", text }], details: { meetings } };
		},
	});

	// --- Tool: fellow_get_summary ---

	pi.registerTool({
		name: "fellow_get_summary",
		label: "Fellow: Get Meeting Summary",
		description:
			"Get the meeting summary/notes from Fellow. Provide a note_id (from search results) or search by title. Returns structured notes with agenda items, discussion topics, and decisions.",
		parameters: Type.Object({
			note_id: Type.Optional(Type.String({ description: "The note ID to retrieve" })),
			title: Type.Optional(Type.String({ description: "Search by meeting title to find the summary" })),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const c = await ensureClient(ctx);

			if (params.note_id) {
				const note = await c.getNote(params.note_id);
				const text = `## ${note.title}\n_${note.event_start ?? note.created_at}_\n\n${note.content_markdown ?? "(no content)"}`;
				return { content: [{ type: "text", text }], details: { note } };
			}

			if (params.title) {
				const result = await c.searchNotes({
					title: params.title,
					include_content: true,
					limit: 1,
				});
				const notes = result.data ?? [];
				if (notes.length === 0) {
					return {
						content: [{ type: "text", text: `No notes found for title: "${params.title}"` }],
						details: {},
					};
				}
				const note = notes[0];
				const text = `## ${note.title}\n_${note.event_start ?? note.created_at}_\n\n${note.content_markdown ?? "(no content)"}`;
				return { content: [{ type: "text", text }], details: { note } };
			}

			throw new Error("Provide either note_id or title to get a meeting summary.");
		},
	});

	// --- Tool: fellow_get_transcript ---

	pi.registerTool({
		name: "fellow_get_transcript",
		label: "Fellow: Get Meeting Transcript",
		description:
			"Get the full transcript of a meeting recording from Fellow. Provide a recording_id (from search results). Returns speaker-labeled, timestamped transcript.",
		parameters: Type.Object({
			recording_id: Type.String({ description: "The recording ID to get the transcript for" }),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const c = await ensureClient(ctx);
			const recording = await c.getTranscript(params.recording_id);

			const segments = recording.transcript?.speech_segments;
			if (!segments?.length) {
				return {
					content: [{ type: "text", text: `No transcript available for recording ${params.recording_id}.` }],
					details: {},
				};
			}

			const lines = segments.map((seg) => {
				const mins = Math.floor(seg.start / 60);
				const secs = Math.floor(seg.start % 60);
				const ts = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
				return `[${ts}] **${seg.speaker}**: ${seg.text}`;
			});

			let text = `## Transcript: ${recording.title}\n\n${lines.join("\n")}`;

			// Append AI summary if available
			const aiNotes = recording.ai_notes;
			if (aiNotes?.length) {
				for (const note of aiNotes) {
					for (const section of note.sections) {
						if (typeof section.content === "string" && section.content.length > 0) {
							text += `\n\n### ${section.title}\n${section.content}`;
						} else if (Array.isArray(section.content) && section.content.length > 0) {
							text += `\n\n### ${section.title}\n`;
							text += section.content.map((item) => `- ${item.text}`).join("\n");
						}
					}
				}
			}
			// Truncate if very long
			if (text.length > 50000) {
				return {
					content: [
						{
							type: "text",
							text: text.slice(0, 50000) + "\n\n[... transcript truncated at 50KB]",
						},
					],
					details: {},
				};
			}
			return { content: [{ type: "text", text }], details: {} };
		},
	});

	// --- Tool: fellow_get_action_items ---

	pi.registerTool({
		name: "fellow_get_action_items",
		label: "Fellow: Get Action Items",
		description:
			"Get action items from Fellow meeting notes. Search by date range and/or meeting title. Action items are extracted from note content.",
		parameters: Type.Object({
			start_date: Type.Optional(
				Type.String({ description: "Start date (YYYY-MM-DD). Notes created on or after this date." }),
			),
			end_date: Type.Optional(Type.String({ description: "End date (YYYY-MM-DD)." })),
			title: Type.Optional(Type.String({ description: "Filter by meeting title" })),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const c = await ensureClient(ctx);
			const result = await c.searchNotes({
				title: params.title,
				created_at_start: params.start_date,
				created_at_end: params.end_date,
				include_content: true,
				limit: 50,
			});

			const notes = result.data ?? [];
			if (notes.length === 0) {
				return { content: [{ type: "text", text: "No meeting notes found for the given criteria." }], details: {} };
			}

			// Extract action items from note content (Fellow uses checkbox syntax)
			const actionItems: Array<{ meeting: string; date: string; item: string; done: boolean }> = [];
			for (const note of notes) {
				if (!note.content_markdown) continue;
				const lines = note.content_markdown.split("\n");
				for (const line of lines) {
					const match = line.match(/^[\s]*[-*]\s*\[([ xX])\]\s*(.+)/);
					if (match) {
						actionItems.push({
							meeting: note.title,
							date: note.created_at,
							item: match[2].trim(),
							done: match[1].toLowerCase() === "x",
						});
					}
				}
			}

			if (actionItems.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: `Searched ${notes.length} note(s) but found no action items (checkbox-style items).`,
						},
					],
					details: {},
				};
			}

			const open = actionItems.filter((ai) => !ai.done);
			const done = actionItems.filter((ai) => ai.done);

			let text = `Found ${actionItems.length} action item(s) across ${notes.length} meeting(s).\n\n`;
			if (open.length > 0) {
				text += `### Open (${open.length})\n`;
				text += open.map((ai) => `- [ ] ${ai.item} _(${ai.meeting}, ${ai.date})_`).join("\n");
				text += "\n\n";
			}
			if (done.length > 0) {
				text += `### Completed (${done.length})\n`;
				text += done.map((ai) => `- [x] ${ai.item} _(${ai.meeting}, ${ai.date})_`).join("\n");
			}

			return { content: [{ type: "text", text }], details: { actionItems } };
		},
	});

	// --- Tool: fellow_get_participants ---

	pi.registerTool({
		name: "fellow_get_participants",
		label: "Fellow: Get Meeting Participants",
		description: "Get the list of participants/attendees for a meeting from Fellow. Search by meeting title.",
		parameters: Type.Object({
			title: Type.String({ description: "Meeting title to search for" }),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const c = await ensureClient(ctx);
			const result = await c.searchNotes({
				title: params.title,
				include_attendees: true,
				limit: 1,
			});

			const notes = result.data ?? [];
			if (notes.length === 0) {
				return {
					content: [{ type: "text", text: `No meeting found for title: "${params.title}"` }],
					details: {},
				};
			}

			const note = notes[0];
			const attendees = note.event_attendees ?? [];
			if (attendees.length === 0) {
				return {
					content: [{ type: "text", text: `No attendee data for meeting: "${note.title}"` }],
					details: {},
				};
			}

			const lines = attendees.map((a) => `- ${a.name ?? a.email} (${a.email})`);
			const text = `## Participants: ${note.title}\n\n${lines.join("\n")}`;
			return { content: [{ type: "text", text }], details: { attendees } };
		},
	});
}
