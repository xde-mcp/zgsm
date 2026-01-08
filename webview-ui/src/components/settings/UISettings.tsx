import { HTMLAttributes, useMemo } from "react"
import { useAppTranslation } from "@/i18n/TranslationContext"
import { VSCodeCheckbox } from "@vscode/webview-ui-toolkit/react"
import { Glasses } from "lucide-react"
import { telemetryClient } from "@/utils/TelemetryClient"
import type { Experiments } from "@roo-code/types"
import { EXPERIMENT_IDS } from "@roo/experiments"

import { SetCachedStateField, SetExperimentEnabled } from "./types"
import { SectionHeader } from "./SectionHeader"
import { Section } from "./Section"
import { ExtensionStateContextType } from "@/context/ExtensionStateContext"

interface UISettingsProps extends HTMLAttributes<HTMLDivElement> {
	reasoningBlockCollapsed: boolean
	showSpeedInfo: boolean
	automaticallyFocus: boolean
	enterBehavior: "send" | "newline"
	experiments: Experiments
	apiConfiguration?: any
	setCachedStateField: SetCachedStateField<keyof ExtensionStateContextType>
	setExperimentEnabled: SetExperimentEnabled
}

export const UISettings = ({
	reasoningBlockCollapsed,
	showSpeedInfo,
	automaticallyFocus,
	enterBehavior,
	experiments,
	apiConfiguration,
	setCachedStateField,
	setExperimentEnabled,
	...props
}: UISettingsProps) => {
	const { t } = useAppTranslation()

	// Detect platform for dynamic modifier key display
	const primaryMod = useMemo(() => {
		const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
		return isMac ? "⌘" : "Ctrl"
	}, [])

	const handleReasoningBlockCollapsedChange = (value: boolean) => {
		setCachedStateField("reasoningBlockCollapsed", value)

		// Track telemetry event
		telemetryClient.capture("ui_settings_collapse_thinking_changed", {
			enabled: value,
		})
	}

	// showSpeedInfo
	const handleShowSpeedInfoChange = (showSpeedInfo: boolean) => {
		setCachedStateField("showSpeedInfo", showSpeedInfo)

		// Track telemetry event
		telemetryClient.capture("ui_settings_show_speed_info_changed", {
			enabled: showSpeedInfo,
		})
	}
	// automaticallyFocus
	const handleAutomaticallyFocusChange = (automaticallyFocus: boolean) => {
		setCachedStateField("automaticallyFocus", automaticallyFocus)

		// Track telemetry event
		telemetryClient.capture("ui_settings_automatically_focus_changed", {
			enabled: automaticallyFocus,
		})
	}

	const handleEnterBehaviorChange = (requireCtrlEnter: boolean) => {
		const newBehavior = requireCtrlEnter ? "newline" : "send"
		setCachedStateField("enterBehavior", newBehavior)

		// Track telemetry event
		telemetryClient.capture("ui_settings_enter_behavior_changed", {
			behavior: newBehavior,
		})
	}

	const handleChatSearchChange = (enabled: boolean) => {
		setExperimentEnabled(EXPERIMENT_IDS.CHAT_SEARCH, enabled)

		// Track telemetry event
		telemetryClient.capture("ui_settings_chat_search_changed", {
			enabled,
		})
	}

	return (
		<div {...props}>
			<SectionHeader>
				<div className="flex items-center gap-2">
					<Glasses className="w-4" />
					<div>{t("settings:sections.ui")}</div>
				</div>
			</SectionHeader>

			<Section>
				<div className="space-y-6">
					{/* Collapse Thinking Messages Setting */}
					<div className="flex flex-col gap-1">
						<VSCodeCheckbox
							checked={reasoningBlockCollapsed}
							onChange={(e: any) => handleReasoningBlockCollapsedChange(e.target.checked)}
							data-testid="collapse-thinking-checkbox">
							<span className="font-medium">{t("settings:ui.collapseThinking.label")}</span>
						</VSCodeCheckbox>
						<div className="text-vscode-descriptionForeground text-sm ml-5 mt-1">
							{t("settings:ui.collapseThinking.description")}
						</div>
					</div>

					{/* Show Speed Info Setting */}
					{apiConfiguration?.apiProvider === "zgsm" && (
						<div className="flex flex-col gap-1">
							<VSCodeCheckbox
								checked={showSpeedInfo}
								onChange={(e: any) => handleShowSpeedInfoChange(e.target.checked)}
								data-testid="show-speed-info-checkbox">
								<span className="font-medium">{t("settings:ui.showSpeedInfo.label")}</span>
							</VSCodeCheckbox>
							<div className="text-vscode-descriptionForeground text-sm ml-5 mt-1">
								{t("settings:ui.showSpeedInfo.description")}
							</div>
						</div>
					)}
					{/* Show Speed Info Setting */}
					<div className="flex flex-col gap-1">
						<VSCodeCheckbox
							checked={automaticallyFocus}
							onChange={(e: any) => handleAutomaticallyFocusChange(e.target.checked)}
							data-testid="show-speed-info-checkbox">
							<span className="font-medium">{t("settings:ui.automaticallyFocus.label")}</span>
						</VSCodeCheckbox>
						<div className="text-vscode-descriptionForeground text-sm ml-5 mt-1">
							{t("settings:ui.automaticallyFocus.description")}
						</div>
					</div>
					{/* Enter Key Behavior Setting */}
					<div className="flex flex-col gap-1">
						<VSCodeCheckbox
							checked={enterBehavior === "newline"}
							onChange={(e: any) => handleEnterBehaviorChange(e.target.checked)}
							data-testid="enter-behavior-checkbox">
							<span className="font-medium">
								{t("settings:ui.requireCtrlEnterToSend.label", { primaryMod })}
							</span>
						</VSCodeCheckbox>
						<div className="text-vscode-descriptionForeground text-sm ml-5 mt-1">
							{t("settings:ui.requireCtrlEnterToSend.description", { primaryMod })}
						</div>
					</div>
					{/* Chat Search Setting */}
					<div className="flex flex-col gap-1">
						<VSCodeCheckbox
							checked={experiments[EXPERIMENT_IDS.CHAT_SEARCH] ?? false}
							onChange={(e: any) => handleChatSearchChange(e.target.checked)}
							data-testid="chat-search-checkbox">
							<span className="font-medium">{t("settings:experimental.CHAT_SEARCH.name")}</span>
						</VSCodeCheckbox>
						<div className="text-vscode-descriptionForeground text-sm ml-5 mt-1">
							{t("settings:experimental.CHAT_SEARCH.description")}
						</div>
					</div>
				</div>
			</Section>
		</div>
	)
}
