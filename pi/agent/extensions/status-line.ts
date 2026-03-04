import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { execFile } from "node:child_process";

export default function (pi: ExtensionAPI) {
	const fallbackRefreshMs = 30_000;
	const minRetryMs = 5_000;
	const ansiRegex = /\x1B\[[0-9;]*m/g;

	let fallbackBranch: string | null = null;
	let lastFallbackAttempt = 0;
	let fallbackInFlight = false;

	const isRenderableBranch = (branch: string | null | undefined) => {
		return !!branch && branch !== ".invalid" && branch !== "detached";
	};

	const parseBranchFromGtInfo = (output: string) => {
		const firstLine = output
			.replace(ansiRegex, "")
			.split(/\r?\n/)
			.map((line) => line.trim())
			.find((line) => line.length > 0);

		if (!firstLine || !isRenderableBranch(firstLine)) {
			return null;
		}

		return firstLine;
	};

	const getWorktreeName = () => {
		const match = process.cwd().match(/\/world\/trees\/([^/]+)\//);
		return match?.[1] || null;
	};

	const refreshFallbackBranch = () => {
		if (fallbackInFlight) {
			return;
		}

		const now = Date.now();
		if (now - lastFallbackAttempt < minRetryMs) {
			return;
		}

		lastFallbackAttempt = now;
		fallbackInFlight = true;

		execFile(
			"gt",
			["branch", "info"],
			{ encoding: "utf8", timeout: 1200, maxBuffer: 16 * 1024 },
			(error, stdout) => {
				fallbackInFlight = false;
				if (error) {
					return;
				}

				fallbackBranch = parseBranchFromGtInfo(stdout);
			},
		);
	};

	const installFooter = (ctx: any) => {
		ctx.ui.setFooter((_tui: any, theme: any, footerData: any) => {
			const onBranchChanged = () => {
				fallbackBranch = null;
				lastFallbackAttempt = 0;
				refreshFallbackBranch();
			};
			const unsubscribe = footerData.onBranchChange(onBranchChanged);
			const timer = setInterval(refreshFallbackBranch, fallbackRefreshMs);

			refreshFallbackBranch();

			return {
				dispose: () => {
					unsubscribe();
					clearInterval(timer);
				},
				invalidate() {},
				render(width: number): string[] {
					const sep = theme.fg("dim", " ❯ ");
					const parts: string[] = [];

					parts.push(theme.fg("accent", "π"));

					const model = ctx.model;
					if (model) {
						parts.push(theme.fg("syntaxNumber", `🖥 ${model.name || model.id}`));
					}

					const level = pi.getThinkingLevel();
					if (level && level !== "off") {
						const token =
							level === "minimal"
								? "thinkingMinimal"
								: level === "low"
									? "thinkingLow"
									: level === "medium"
										? "thinkingMedium"
										: level === "high"
											? "thinkingHigh"
											: "thinkingXhigh";
						parts.push(theme.fg(token, `think:${level}`));
					}

					const dir = process.cwd().split("/").pop() || process.cwd();
					parts.push(theme.fg("mdCode", `📁 ${dir}`));

					const worktree = getWorktreeName();
					if (worktree) {
						parts.push(theme.fg("muted", `🌳 ${worktree}`));
					}

					const providerBranch = footerData.getGitBranch();
					const branch = isRenderableBranch(providerBranch) ? providerBranch : fallbackBranch;
					if (!branch && !fallbackInFlight) {
						refreshFallbackBranch();
					}
					if (branch) {
						parts.push(theme.fg("warning", ` ${branch}`));
					}

					const statuses = footerData.getExtensionStatuses();
					for (const [, text] of statuses) {
						if (text) parts.push(text);
					}

					return [truncateToWidth(parts.join(sep), width)];
				},
			};
		});
	};

	pi.on("session_start", async (_event, ctx) => {
		installFooter(ctx);
		ctx.ui.notify("Custom footer active", "info");
	});

	pi.on("session_switch", async (_event, ctx) => {
		installFooter(ctx);
	});

	pi.on("model_select", async (_event, ctx) => {
		installFooter(ctx);
	});
}
