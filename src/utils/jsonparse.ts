import JSON5 from "json5"
import { parseJSON } from "partial-json"

export function safeParse(input: string) {
	try {
		const normalized = parseJSON(input)
		return JSON5.parse(JSON.stringify(normalized))
	} catch {
		return input
	}
}
