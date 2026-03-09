/**
 * Google Drive Read/Write Extension for Pi
 *
 * Adds tools that complement the built-in `gdrive_search`:
 *   - `gdrive_read`       — Read content of Google Docs, Sheets, text files
 *   - `gdrive_create_doc` — Create a new Google Doc with content
 *
 * Reuses the gworkspace extension's OAuth credentials at
 * ~/.gworkspace_mcp/. If a write operation requires a scope upgrade,
 * opens the browser for incremental OAuth consent.
 *
 * Prerequisite: gworkspace extension must be set up first (run any
 * gcal/gmail/gdrive tool to trigger initial OAuth).
 */

import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createServer, type Server } from "node:http";
import { randomBytes } from "node:crypto";

// ── Paths & constants ──────────────────────────────────────────────

const GW_DIR = join(homedir(), ".gworkspace_mcp");
const CLIENT_SECRETS_PATH = join(GW_DIR, "gworkspace_mcp_client_secrets.json");
const TOKEN_PATH = join(GW_DIR, "oauth_credentials.json");

const DRIVE_BASE = "https://www.googleapis.com/drive/v3";
const UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";
const DRIVE_READONLY = "https://www.googleapis.com/auth/drive.readonly";
const DRIVE_WRITE = "https://www.googleapis.com/auth/drive";

// ── Auth helpers ───────────────────────────────────────────────────

interface StoredTokens {
	access_token: string;
	refresh_token: string;
	expiry_date: number;
	token_type?: string;
	granted_scopes?: string[];
}

interface ClientCreds {
	clientId: string;
	clientSecret: string;
}

function loadClientCreds(): ClientCreds | null {
	if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
		return { clientId: process.env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET };
	}
	if (!existsSync(CLIENT_SECRETS_PATH)) return null;
	try {
		const secrets = JSON.parse(readFileSync(CLIENT_SECRETS_PATH, "utf-8"));
		const c = secrets.installed ?? secrets.web;
		if (c) return { clientId: c.client_id, clientSecret: c.client_secret };
	} catch {}
	return null;
}

function loadTokens(): StoredTokens | null {
	if (!existsSync(TOKEN_PATH)) return null;
	try {
		return JSON.parse(readFileSync(TOKEN_PATH, "utf-8")) as StoredTokens;
	} catch {
		return null;
	}
}

function saveTokens(tokens: StoredTokens): void {
	mkdirSync(GW_DIR, { recursive: true });
	writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

function hasScope(tokens: StoredTokens | null, scope: string): boolean {
	if (!tokens?.granted_scopes) return false;
	// drive scope covers drive.readonly
	return tokens.granted_scopes.some(
		(s) => s === scope || (scope === DRIVE_READONLY && s === DRIVE_WRITE),
	);
}

async function refreshToken(tokens: StoredTokens, creds: ClientCreds): Promise<StoredTokens> {
	const resp = await fetch("https://oauth2.googleapis.com/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			client_id: creds.clientId,
			client_secret: creds.clientSecret,
			refresh_token: tokens.refresh_token,
			grant_type: "refresh_token",
		}),
	});
	if (!resp.ok) throw new Error(`Token refresh failed: ${await resp.text()}`);
	const data = (await resp.json()) as any;
	const updated: StoredTokens = {
		...tokens,
		access_token: data.access_token,
		expiry_date: Date.now() + (data.expires_in ?? 3600) * 1000,
		granted_scopes: data.scope ? data.scope.split(" ") : tokens.granted_scopes,
	};
	saveTokens(updated);
	return updated;
}

/** Browser OAuth flow for incremental scope upgrade */
async function browserAuthForScope(
	creds: ClientCreds,
	scope: string,
	pi: ExtensionAPI,
): Promise<StoredTokens> {
	const REDIRECT_PORT = 8099;
	const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;
	const state = randomBytes(16).toString("hex");

	const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	authUrl.searchParams.set("client_id", creds.clientId);
	authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
	authUrl.searchParams.set("response_type", "code");
	authUrl.searchParams.set("scope", scope);
	authUrl.searchParams.set("access_type", "offline");
	authUrl.searchParams.set("state", state);

	const existing = loadTokens();
	if (existing?.refresh_token) {
		authUrl.searchParams.set("include_granted_scopes", "true");
	} else {
		authUrl.searchParams.set("prompt", "consent");
	}

	return new Promise((resolve, reject) => {
		let server: Server;
		let settled = false;

		const cleanup = () => {
			if (settled) return;
			settled = true;
			clearTimeout(timeout);
			try {
				server?.close();
			} catch {}
		};

		const timeout = setTimeout(() => {
			cleanup();
			reject(new Error("OAuth flow timed out after 120s."));
		}, 120_000);

		server = createServer(async (req, res) => {
			try {
				const url = new URL(req.url!, REDIRECT_URI);
				if (url.pathname !== "/") {
					res.writeHead(404);
					res.end();
					return;
				}

				const code = url.searchParams.get("code");
				const returnedState = url.searchParams.get("state");

				if (!code || returnedState !== state) {
					res.writeHead(400, { "Content-Type": "text/html" });
					res.end("<h1>Authentication failed</h1>");
					return;
				}

				const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
					method: "POST",
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
					body: new URLSearchParams({
						client_id: creds.clientId,
						client_secret: creds.clientSecret,
						code,
						redirect_uri: REDIRECT_URI,
						grant_type: "authorization_code",
					}),
				});

				if (!tokenResp.ok) {
					const body = await tokenResp.text();
					res.writeHead(500, { "Content-Type": "text/html" });
					res.end(`<h1>Token exchange failed</h1><pre>${body}</pre>`);
					cleanup();
					reject(new Error(`Token exchange failed: ${body}`));
					return;
				}

				const existingStored = loadTokens();
				const data = (await tokenResp.json()) as any;
				const tokens: StoredTokens = {
					access_token: data.access_token,
					refresh_token: data.refresh_token ?? existingStored?.refresh_token ?? "",
					expiry_date: Date.now() + (data.expires_in ?? 3600) * 1000,
					token_type: data.token_type ?? "Bearer",
					granted_scopes: data.scope ? data.scope.split(" ") : [scope],
				};

				saveTokens(tokens);

				res.writeHead(200, { "Content-Type": "text/html" });
				res.end("<h1>✅ Authorized!</h1><p>You can close this tab and return to Pi.</p>");
				cleanup();
				resolve(tokens);
			} catch (err) {
				cleanup();
				reject(err);
			}
		});

		server.listen(REDIRECT_PORT, async () => {
			await pi.exec("open", [authUrl.toString()]);
		});
	});
}

/**
 * Get a valid access token with the required scope.
 * Refreshes expired tokens. If write scope is needed but not granted,
 * triggers browser OAuth for incremental consent.
 */
async function getToken(
	requiredScope: string,
	pi: ExtensionAPI,
	ctx: ExtensionContext,
): Promise<string> {
	const creds = loadClientCreds();
	if (!creds) {
		throw new Error(
			"Google OAuth credentials not found. Run any gcal or gmail tool first to set up the gworkspace extension.",
		);
	}

	let tokens = loadTokens();

	// Need scope upgrade?
	if (tokens && !hasScope(tokens, requiredScope)) {
		ctx.ui.notify(
			`Google Drive write access needed. Opening browser for authorization...`,
			"info",
		);
		tokens = await browserAuthForScope(creds, requiredScope, pi);
	}

	if (!tokens) {
		throw new Error("No Google OAuth tokens. Run any gcal or gmail tool first.");
	}

	// Refresh if expired
	if (Date.now() >= tokens.expiry_date - 60_000) {
		tokens = await refreshToken(tokens, creds);
	}

	return tokens.access_token;
}

// ── Drive API helpers ──────────────────────────────────────────────

const EXPORT_MIME_TYPES: Record<string, { exportMime: string; label: string }> = {
	"application/vnd.google-apps.document": { exportMime: "text/plain", label: "Google Doc" },
	"application/vnd.google-apps.spreadsheet": { exportMime: "text/csv", label: "Google Sheet" },
	"application/vnd.google-apps.presentation": { exportMime: "text/plain", label: "Google Slides" },
};

async function getFileMetadata(
	fileId: string,
	token: string,
): Promise<{ name: string; mimeType: string; size?: string }> {
	const params = new URLSearchParams({
		fields: "name,mimeType,size",
		supportsAllDrives: "true",
	});
	const resp = await fetch(`${DRIVE_BASE}/files/${fileId}?${params}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!resp.ok) throw new Error(`Drive API error (${resp.status}): ${await resp.text()}`);
	return resp.json() as Promise<{ name: string; mimeType: string; size?: string }>;
}

async function readFileContent(fileId: string, mimeType: string, token: string): Promise<string> {
	const exportType = EXPORT_MIME_TYPES[mimeType];

	if (exportType) {
		const params = new URLSearchParams({ mimeType: exportType.exportMime });
		const resp = await fetch(`${DRIVE_BASE}/files/${fileId}/export?${params}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!resp.ok) throw new Error(`Drive export error (${resp.status}): ${await resp.text()}`);
		return resp.text();
	}

	const params = new URLSearchParams({ alt: "media", supportsAllDrives: "true" });
	const resp = await fetch(`${DRIVE_BASE}/files/${fileId}?${params}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	if (!resp.ok) throw new Error(`Drive download error (${resp.status}): ${await resp.text()}`);
	return resp.text();
}

async function createGoogleDoc(
	title: string,
	content: string,
	folderId: string | undefined,
	token: string,
): Promise<{ id: string; name: string; webViewLink: string }> {
	// Use multipart upload to create a Google Doc with content in one request
	const metadata: Record<string, unknown> = {
		name: title,
		mimeType: "application/vnd.google-apps.document",
	};
	if (folderId) metadata.parents = [folderId];

	const boundary = "----PiDriveBoundary" + randomBytes(8).toString("hex");
	const body =
		`--${boundary}\r\n` +
		`Content-Type: application/json; charset=UTF-8\r\n\r\n` +
		`${JSON.stringify(metadata)}\r\n` +
		`--${boundary}\r\n` +
		`Content-Type: text/html; charset=UTF-8\r\n\r\n` +
		`${content}\r\n` +
		`--${boundary}--`;

	const params = new URLSearchParams({
		uploadType: "multipart",
		fields: "id,name,webViewLink",
		supportsAllDrives: "true",
	});

	const resp = await fetch(`${UPLOAD_BASE}/files?${params}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": `multipart/related; boundary=${boundary}`,
		},
		body,
	});

	if (!resp.ok) throw new Error(`Drive create error (${resp.status}): ${await resp.text()}`);
	return resp.json() as Promise<{ id: string; name: string; webViewLink: string }>;
}

// ── Extension ──────────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	// --- Tool: gdrive_read ---
	pi.registerTool({
		name: "gdrive_read",
		label: "Google Drive: Read File",
		description:
			"Read the content of a Google Drive file by its ID. Works with Google Docs (exported as text), Google Sheets (exported as CSV), and plain text files. Use gdrive_search first to find file IDs. Particularly useful for reading Google Meet 'Notes by Gemini' transcript documents.",
		promptSnippet:
			"Read content of a Google Drive file by ID. Use gdrive_search to find IDs first. Reads Google Docs as text, Sheets as CSV.",
		parameters: Type.Object({
			file_id: Type.String({ description: "Google Drive file ID (from gdrive_search results)" }),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const token = await getToken(DRIVE_READONLY, pi, ctx);

			const meta = await getFileMetadata(params.file_id, token);
			const exportType = EXPORT_MIME_TYPES[meta.mimeType];
			const typeLabel = exportType?.label ?? meta.mimeType;

			let content = await readFileContent(params.file_id, meta.mimeType, token);

			let text = `## ${meta.name}\n_Type: ${typeLabel}_\n\n${content}`;

			if (text.length > 50000) {
				text = text.slice(0, 50000) + "\n\n[... content truncated at 50KB]";
			}

			return {
				content: [{ type: "text", text }],
				details: { fileName: meta.name, mimeType: meta.mimeType, fileId: params.file_id },
			};
		},
	});

	// --- Tool: gdrive_create_doc ---
	pi.registerTool({
		name: "gdrive_create_doc",
		label: "Google Drive: Create Document",
		description:
			"Create a new Google Doc in Drive with the given title and content. Content can be plain text or HTML (for formatting like headings, lists, bold). Returns the document URL. If write access hasn't been granted yet, opens the browser for authorization.",
		promptSnippet:
			"Create a new Google Doc with title and content. Supports plain text or HTML content.",
		parameters: Type.Object({
			title: Type.String({ description: "Document title" }),
			content: Type.String({
				description:
					"Document content. Plain text or HTML (e.g. <h1>, <ul>, <b> tags for formatting)",
			}),
			folder_id: Type.Optional(
				Type.String({ description: "Optional Drive folder ID to create the doc in" }),
			),
		}),

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const token = await getToken(DRIVE_WRITE, pi, ctx);

			const doc = await createGoogleDoc(params.title, params.content, params.folder_id, token);

			const text = `✅ Created Google Doc: **${doc.name}**\n\n📄 ${doc.webViewLink}\n\nFile ID: ${doc.id}`;

			return {
				content: [{ type: "text", text }],
				details: { fileId: doc.id, name: doc.name, url: doc.webViewLink },
			};
		},
	});
}
