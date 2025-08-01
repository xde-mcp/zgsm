import delay from "delay"
import fs from "fs/promises"
import path from "path"
import * as vscode from "vscode"

import { getReadablePath } from "../../utils/path"
import { Task } from "../task/Task"
import { ToolUse, AskApproval, HandleError, PushToolResult, RemoveClosingTag } from "../../shared/tools"
import { formatResponse } from "../prompts/responses"
import { ClineSayTool } from "../../shared/ExtensionMessage"
import { RecordSource } from "../context-tracking/FileContextTrackerTypes"
import { fileExistsAtPath } from "../../utils/fs"
import { insertGroups } from "../diff/insert-groups"
import { TelemetryService } from "../../services/telemetry"
import { getLanguage } from "../../utils/file"
import { getDiffLines } from "../../utils/diffLines"
import { autoCommit } from "../../utils/git"

export async function insertContentTool(
	cline: Task,
	block: ToolUse,
	askApproval: AskApproval,
	handleError: HandleError,
	pushToolResult: PushToolResult,
	removeClosingTag: RemoveClosingTag,
) {
	const relPath: string | undefined = block.params.path
	const line: string | undefined = block.params.line
	const content: string | undefined = block.params.content

	const sharedMessageProps: ClineSayTool = {
		tool: "insertContent",
		path: getReadablePath(cline.cwd, removeClosingTag("path", relPath)),
		diff: content,
		lineNumber: line ? parseInt(line, 10) : undefined,
	}

	try {
		if (block.partial) {
			await cline.ask("tool", JSON.stringify(sharedMessageProps), block.partial).catch(() => {})
			return
		}

		// Validate required parameters
		if (!relPath) {
			cline.consecutiveMistakeCount++
			cline.recordToolError("insert_content")
			pushToolResult(await cline.sayAndCreateMissingParamError("insert_content", "path"))
			return
		}

		if (!line) {
			cline.consecutiveMistakeCount++
			cline.recordToolError("insert_content")
			pushToolResult(await cline.sayAndCreateMissingParamError("insert_content", "line"))
			return
		}

		if (!content) {
			cline.consecutiveMistakeCount++
			cline.recordToolError("insert_content")
			pushToolResult(await cline.sayAndCreateMissingParamError("insert_content", "content"))
			return
		}

		const absolutePath = path.resolve(cline.cwd, relPath)
		const fileExists = await fileExistsAtPath(absolutePath)

		if (!fileExists) {
			cline.consecutiveMistakeCount++
			cline.recordToolError("insert_content")
			const formattedError = `File does not exist at path: ${absolutePath}\n\n<error_details>\nThe specified file could not be found. Please verify the file path and try again.\n</error_details>`
			await cline.say("error", formattedError)
			pushToolResult(formattedError)
			return
		}

		const lineNumber = parseInt(line, 10)
		if (isNaN(lineNumber) || lineNumber < 0) {
			cline.consecutiveMistakeCount++
			cline.recordToolError("insert_content")
			pushToolResult(formatResponse.toolError("Invalid line number. Must be a non-negative integer."))
			return
		}

		cline.consecutiveMistakeCount = 0

		// Read the file
		const fileContent = await fs.readFile(absolutePath, "utf8")
		cline.diffViewProvider.editType = "modify"
		cline.diffViewProvider.originalContent = fileContent
		const lines = fileContent.split("\n")

		const updatedContent = insertGroups(lines, [
			{
				index: lineNumber - 1,
				elements: content.split("\n"),
			},
		]).join("\n")

		// Show changes in diff view
		if (!cline.diffViewProvider.isEditing) {
			await cline.ask("tool", JSON.stringify(sharedMessageProps), true).catch(() => {})
			// First open with original content
			await cline.diffViewProvider.open(relPath)
			await cline.diffViewProvider.update(fileContent, false)
			cline.diffViewProvider.scrollToFirstDiff()
			await delay(200)
		}

		const diff = formatResponse.createPrettyPatch(relPath, fileContent, updatedContent)

		if (!diff) {
			pushToolResult(`No changes needed for '${relPath}'`)
			return
		}

		await cline.diffViewProvider.update(updatedContent, true)

		const completeMessage = JSON.stringify({
			...sharedMessageProps,
			diff,
			lineNumber: lineNumber,
		} satisfies ClineSayTool)

		const didApprove = await cline
			.ask("tool", completeMessage, false)
			.then((response) => response.response === "yesButtonClicked")
		const language = await getLanguage(relPath)
		const diffLines = getDiffLines(fileContent, updatedContent)
		if (!didApprove) {
			await cline.diffViewProvider.revertChanges()
			pushToolResult("Changes were rejected by the user.")
			TelemetryService.instance.captureCodeReject(language, diffLines)
			return
		}

		const { newProblemsMessage, userEdits, finalContent } = await cline.diffViewProvider.saveChanges()

		// Track file edit operation
		if (relPath) {
			await cline.fileContextTracker.trackFileContext(relPath, "roo_edited" as RecordSource)
		}
		try {
			TelemetryService.instance.captureCodeAccept(language, diffLines)
			// Check if AutoCommit is enabled before committing
			const autoCommitEnabled = vscode.workspace.getConfiguration().get<boolean>("AutoCommit", false)
			if (autoCommitEnabled) {
				autoCommit(relPath, cline.cwd, {
					model: cline.api.getModel().id,
					editorName: vscode.env.appName,
					date: new Date().toLocaleString(),
				})
			}
		} catch (err) {
			console.log(err)
		}

		cline.didEditFile = true

		if (!userEdits) {
			pushToolResult(
				`The content was successfully inserted in ${relPath.toPosix()} at line ${lineNumber}.${newProblemsMessage}`,
			)
			await cline.diffViewProvider.reset()
			return
		}

		await cline.say(
			"user_feedback_diff",
			JSON.stringify({
				tool: "insertContent",
				path: getReadablePath(cline.cwd, relPath),
				diff: userEdits,
				lineNumber: lineNumber,
			} satisfies ClineSayTool),
		)

		pushToolResult(
			`The user made the following updates to your content:\n\n${userEdits}\n\n` +
				`The updated content has been successfully saved to ${relPath.toPosix()}. Here is the full, updated content of the file:\n\n` +
				`<final_file_content path="${relPath.toPosix()}">\n${finalContent}\n</final_file_content>\n\n` +
				`Please note:\n` +
				`1. You do not need to re-write the file with these changes, as they have already been applied.\n` +
				`2. Proceed with the task using this updated file content as the new baseline.\n` +
				`3. If the user's edits have addressed part of the task or changed the requirements, adjust your approach accordingly.` +
				`${newProblemsMessage}`,
		)

		await cline.diffViewProvider.reset()
	} catch (error) {
		handleError("insert content", error)
		await cline.diffViewProvider.reset()
	}
}
