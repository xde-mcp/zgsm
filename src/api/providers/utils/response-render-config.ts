import * as vscode from "vscode"
import { isJetbrainsPlatform } from "../../../utils/platform"

export const renderModes = {
	noLimit: {
		interval: 5,
	},
	fast: {
		interval: 10,
	},
	medium: {
		interval: 20,
	},
	slow: {
		interval: 40,
	},
}

export function getApiResponseRenderMode() {
	if (isJetbrainsPlatform()) {
		return renderModes.slow
	}
	const apiResponseRenderMode = vscode.workspace
		.getConfiguration("zgsm")
		.get<string>("apiResponseRenderMode", "medium") as "fast" | "medium" | "slow" | "noLimit"

	return renderModes[apiResponseRenderMode] || renderModes["fast"]
}
