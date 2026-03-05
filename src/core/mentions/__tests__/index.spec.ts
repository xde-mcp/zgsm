// npx vitest core/mentions/__tests__/index.spec.ts

import * as vscode from "vscode"

import { parseMentions } from "../index"

// Mock vscode
vi.mock("vscode", async (importOriginal) => ({
	...(await importOriginal()),
	window: {
		showErrorMessage: vi.fn(),
		createTextEditorDecorationType: vi.fn(),
		createOutputChannel: () => ({
			appendLine: vi.fn(),
			show: vi.fn(),
		}),
	},
	extensions: {
		getExtension: vi.fn().mockReturnValue({
			extensionUri: { fsPath: "/test/extension/path" },
		}),
		all: [],
	},
}))

// Mock i18n
vi.mock("../../../i18n", () => ({
	t: vi.fn((key: string) => key),
}))

describe("parseMentions - URL mention handling", () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should replace URL mentions with quoted URL reference", async () => {
		const result = await parseMentions("Check @https://example.com", "/test")

		// URL mentions are now replaced with a quoted reference (no fetching)
		expect(result.text).toContain("'https://example.com'")
	})
})
