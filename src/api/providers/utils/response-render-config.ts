import * as vscode from "vscode"
import { isJetbrainsPlatform } from "../../../utils/platform"

const isJetbrains = isJetbrainsPlatform()

export const renderModes = {
	noLimit: {
		limit: 0,
		interval: 5,
	},
	fast: {
		limit: 5,
		interval: isJetbrains ? 25 : 14,
	},
	medium: {
		limit: 10,
		interval: isJetbrains ? 50 : 25,
	},
	slow: {
		limit: 15,
		interval: isJetbrains ? 100 : 50,
	},
}

export function getApiResponseRenderMode() {
	if (isJetbrains) {
		return renderModes.fast
	}
	const apiResponseRenderMode = vscode.workspace
		.getConfiguration("zgsm")
		.get<string>("apiResponseRenderMode", "medium") as "fast" | "medium" | "slow" | "noLimit"

	return renderModes[apiResponseRenderMode] || renderModes["fast"]
}
