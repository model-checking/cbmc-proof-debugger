import * as vscode from 'vscode';

/** Get a key-value pair from the extension's persistent storage. */
export function getKey(context: vscode.ExtensionContext, key: string): string | undefined {
    return context.workspaceState.get(key);
}

/** Set a key-value pair in the extension's persistent storage. */
export async function setKey(context: vscode.ExtensionContext, key: string, value: string | undefined) {
    await context.workspaceState.update(key, value);
}

/** Clear a key in the extension's persistent storage (set it to undefined). */
export async function clearKey(context: vscode.ExtensionContext, key: string) {
    await setKey(context, key, undefined);
}

/** Display in a pop-up window a key-value pair from the extension's persistent storage. */
export async function showKey(context: vscode.ExtensionContext, key: string) {
    await vscode.window.showInformationMessage(`${key} = ${getKey(context, key)}`);
}