/**
 * This is an implementation of the Tree View API that implements the
 * hierarchical view of failures.  This view is presented to the user in the
 * tree view panel named "Proof debugger" in the user interface of visual studio code.
 *
 * This file implements a tree data provider that implements the Tree View API.
 * We implement a class that extends TreeDataProvider.  Code invokes methods of
 * the class to respond to requests from the user to expand or collapse nodes of
 * the tree, to select a failure for debugging, etc.
 *
 * There is a good overview of the Tree View API at
 * https://code.visualstudio.com/api/extension-guides/tree-view
 *
 * This file implements a View Container named "Proof debugger" added to the user
 * interface of visual studio code.  It contains the tree view of error traces.
 * The Proof debugger panel includes a button labeled "Load Traces" that asks the user
 * to select the folder with the json data produced by viewer, and loads that
 * data into the Proof debugger panel.
 */

import * as vscode from 'vscode';

import { viewerResultFile, viewerPropertyFile, viewerLoopFile, traceFolderStorageKey, traceNameStorageKey, setTraceFolderCommand } from './constants';
import * as failureMap from './traceData';
import * as failureTree from './traceTree';
import * as persistentStorage from './storage';

export class TraceProvider implements vscode.TreeDataProvider<failureTree.FailureNode> {
    treeRoot: failureTree.FailureNode | undefined;
    folderUri: vscode.Uri | undefined;

    constructor() {
        this.treeRoot = undefined;
        this.folderUri = undefined;
    }

    getTreeItem(node: failureTree.FailureNode): vscode.TreeItem {
        return node;
    }

    async getChildren(node?: failureTree.FailureNode): Promise<failureTree.FailureNode[]> {
        if (!this.treeRoot) {

            // The folderUri is set with the "Load Traces" button
            if (!this.folderUri) { return Promise.resolve([]); }

            let resultPath = vscode.Uri.joinPath(this.folderUri, viewerResultFile);
            let propertyPath = vscode.Uri.joinPath(this.folderUri, viewerPropertyFile);
            let loopPath = vscode.Uri.joinPath(this.folderUri, viewerLoopFile);
            let failures = await failureMap.create(resultPath, propertyPath, loopPath);
            this.treeRoot = failureTree.create(failures);
        }

        if (node) {
            return Promise.resolve(node.children);
        } else {
            return Promise.resolve(this.treeRoot.children);
        }
    }

    tracesChangedEmitter: vscode.EventEmitter<failureTree.FailureNode | undefined | null | void>
        = new vscode.EventEmitter<failureTree.FailureNode | undefined | null | void>();
    onDidChangeTreeData: vscode.Event<failureTree.FailureNode | undefined | null | void>
        = this.tracesChangedEmitter.event;

    async refresh(): Promise<void> {
        this.treeRoot = undefined;

        let traceFolderOptions: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Open',
            canSelectFiles: false,
            canSelectFolders: true,
            defaultUri: this.folderUri || (vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : undefined)
        };
        this.folderUri = await vscode.window.showOpenDialog(traceFolderOptions).then(
            fileUri => { return fileUri && fileUri[0] ? fileUri[0] : undefined; }
        );
        vscode.commands.executeCommand(setTraceFolderCommand, this.folderUri);
        this.tracesChangedEmitter.fire();
    }
}

export function getTraceFolder(context: vscode.ExtensionContext): vscode.Uri | undefined {
    let value = persistentStorage.getKey(context, traceFolderStorageKey);
    return value ? vscode.Uri.parse(value) : undefined;
}
export async function setTraceFolder(context: vscode.ExtensionContext, traceFolder?: vscode.Uri) {
    await persistentStorage.setKey(context, traceFolderStorageKey, traceFolder ? traceFolder.toString() : undefined);
}
export async function setTraceFolderDialog(context: vscode.ExtensionContext, traceFolder?: vscode.Uri) {
    if (!traceFolder) {
        let traceFolderOptions: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: 'Open',
            canSelectFiles: false,
            canSelectFolders: true,
            defaultUri: vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : undefined
        };
        traceFolder = await vscode.window.showOpenDialog(traceFolderOptions).then(
            fileUri => fileUri && fileUri[0] ? fileUri[0] : undefined
        );
    }
    await setTraceFolder(context, traceFolder);
}
export async function showTraceFolder(context: vscode.ExtensionContext) {
    await persistentStorage.showKey(context, traceFolderStorageKey);
}

export function getTraceName(context: vscode.ExtensionContext): string | undefined {
    return persistentStorage.getKey(context, traceNameStorageKey);
}
export async function setTraceName(context: vscode.ExtensionContext, value: string | undefined) {
    await persistentStorage.setKey(context, traceNameStorageKey, value);
}
export async function showTraceName(context: vscode.ExtensionContext) {
    await persistentStorage.showKey(context, traceNameStorageKey);
}
