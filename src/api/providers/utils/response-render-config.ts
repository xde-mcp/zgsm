import * as vscode from "vscode"
import { isJetbrainsPlatform } from "../../../utils/platform"

const isJetbrains = isJetbrainsPlatform()

export const renderModes = {
	noLimit: {
		limit: 0,
		interval: 5,
	},
	fast: {
		limit: isJetbrains ? 10 : 5,
		interval: isJetbrains ? 20 : 10,
	},
	medium: {
		limit: isJetbrains ? 20 : 10,
		interval: isJetbrains ? 40 : 20,
	},
	slow: {
		limit: isJetbrains ? 40 : 20,
		interval: isJetbrains ? 80 : 40,
	},
}

export function getApiResponseRenderMode() {
	if (isJetbrains) {
		return renderModes.medium
	}
	const apiResponseRenderMode = vscode.workspace
		.getConfiguration("zgsm")
		.get<string>("apiResponseRenderMode", "medium") as "fast" | "medium" | "slow" | "noLimit"

	return renderModes[apiResponseRenderMode] || renderModes["fast"]
}
