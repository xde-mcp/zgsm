import * as vscode from "vscode"
import { Package } from "../shared/package"
import { isJetbrainsPlatform } from "./platform"

export const isDebug = () =>
	vscode.workspace.getConfiguration(Package.name).get<boolean>("debug", isJetbrainsPlatform())
