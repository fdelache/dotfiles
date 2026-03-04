import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { truncateToWidth } from "@mariozechner/pi-tui";
import { execFile } from "node:child_process";

export default function (pi: ExtensionAPI) {
	const fallbackRefreshMs = 30_000;
	const minRetryMs = 2_000;

	let fallbackBranch: string | null = null;
	let lastFallbackAttempt = 0;
	let fallbackInFlight = false;

	const isRenderableBranch = (branch: string | null | undefined) => {
		return !!branch && branch !== ".invalid" && branch !== "detached";
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
			"git",
			["symbolic-ref", "--short", "HEAD"],
			{ encoding: "utf8", timeout: 2000, maxBuffer: 4 * 1024 },
			(error, stdout) => {
				fallbackInFlight = false;
				if (error) {
					return;
				}

				const branch = stdout.trim();
				if (isRenderableBranch(branch)) {
					fallbackBranch = branch;
				}
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
					const sep = theme.fg("borderAccent", " ❯ ");
					const parts: string[] = [];

					const statuses = Array.from(footerData.getExtensionStatuses());
					const isWorldMode = statuses.some(
						([key, text]) => key === "world" || /world mode/i.test(text || ""),
					);
					parts.push(theme.fg("accent", isWorldMode ? "🌎" : "π"));
					const model = ctx.model;
					if (model) {
						parts.push(theme.fg("thinkingHigh", `🖥 ${model.name || model.id}`));
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
						parts.push(theme.fg(token, `🧠:${level}`));
					}

					const dir = process.cwd().split("/").pop() || process.cwd();
					parts.push(theme.fg("thinkingLow", `📁 ${dir}`));

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
						parts.push(theme.fg("mdHeading", ` ${branch}`));
					}

					for (const [key, text] of statuses) {
						if (key === "slack") continue;
						if (key === "world" || /world mode/i.test(text || "")) continue;
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
