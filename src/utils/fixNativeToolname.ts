import { ToolName } from "@roo-code/types"
import { parseJSON } from "partial-json"
import JSON5 from "json5"

export const fixNativeToolname = (toolname: string | ToolName) => {
	if (
		!toolname ||
		(!toolname.includes("<tool_call>") && !toolname.includes("<arg_value>") && !toolname.includes("</tool_call>"))
	)
		return toolname as ToolName
	let tags = [] as Array<ToolName | string>
	let fixedToolname = toolname as ToolName
	if (fixedToolname.includes("<tool_call>")) {
		tags = fixedToolname.split("<tool_call>").sort((a, b) => b.length - a.length)
		fixedToolname = tags[0] as ToolName
	}

	if (fixedToolname.includes("</tool_call>")) {
		tags = fixedToolname.split("</tool_call>").sort((a, b) => b.length - a.length)
		fixedToolname = tags[0] as ToolName
	}

	if (fixedToolname.includes("<arg_value>")) {
		tags = fixedToolname.split("<arg_value>").sort((a, b) => b.length - a.length)
		fixedToolname = tags[0] as ToolName
	}

	return fixedToolname
}

export const fixNativeToolArgKey = <TName extends ToolName>(
	toolCall: {
		id?: string
		name?: TName | string
		arguments?: string
	},
	isFinalToolUse?: boolean,
) => {
	let formatRecord = {} as Record<string, any>

	try {
		if (!toolCall?.arguments) {
			return "{}"
		} else if (!toolCall.arguments.includes("<arg_key>")) {
			formatRecord = isFinalToolUse ? finalToolUseResult(toolCall.arguments) : parseJSON(toolCall.arguments)
		} else {
			formatRecord = isFinalToolUse ? JSON5.parse(toolCall.arguments) : parseJSON(toolCall.arguments)

			Object.entries(formatRecord).forEach(([key, value]) => {
				console.log("fixNativeToolArgKey key", key)

				if (!key.includes("<arg_key>")) {
					formatRecord[key] = value
					return
				}
				const newKey = key.split("<arg_key>").pop() as string
				formatRecord[newKey] = value
				console.log(`${toolCall.name}|${toolCall.id}: ${key} -> ${newKey}`)
			})
		}

		return JSON.stringify(formatRecord)
	} catch (error) {
		console.log("fixNativeToolArgKey failed", error)
		return toolCall.arguments ?? "{}"
	}
}

function finalToolUseResult(data?: string) {
	if (!data) return {}

	try {
		// TODO: implement
		return JSON5.parse(data)
	} catch (error) {
		return parseJSON(data)
	}
}
