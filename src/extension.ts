/**
 * This together with the extension manifest package.json is the entry point for
 * the extension to visual studio code that contribute a debugger for errror
 * traces from viewer. This file consists of two methods used by code to
 * activate and deactivate the extension.  The events that cause the extension
 * to be activated are defined (among other things) in the manifest
 * package.json.
 *
 * There is a good overview of how extensions work at
 * https://code.visualstudio.com/api/get-started/extension-anatomy
 *
 * There is a good description of the extension manifest package.json at
 * https://code.visualstudio.com/api/references/extension-manifest
 */

import * as vscode from 'vscode';
import * as proofDebuggerAdapter from './adapter';
import * as traceView from './traceView';

import {
    debuggerType, debuggerName, traceViewProviderName, refreshTraceListCommand,
    setTraceFolderCommand, getTraceFolderCommand, getTraceFolderDialogCommand, showTraceFolderCommand,
    setTraceNameCommand, getTraceNameCommand, showTraceNameCommand
} from './constants';

/**
 * Method used by code to activate the debug extension.
 */
export function activate(context: vscode.ExtensionContext) {

    // register that the debug adapter should be run within code and not as an external process
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory(
        debuggerType,
        new ProofDebuggerAdapterFactory()
    ));

    // register the class that provides configuration data for launching the debugger
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(
        debuggerType,
        new ProofDebuggerConfigurationProvider()
    ));

    // register the data provider to list the traces in the trace view panel
    // store the provider in a class member to use the provider to reload traces below
    const traceProvider: traceView.TraceProvider = new traceView.TraceProvider();
    context.subscriptions.push(vscode.window.registerTreeDataProvider(
        traceViewProviderName,
        traceProvider
    ));

    // register the command to load (reload) the list of traces in the trace view panel
    context.subscriptions.push(vscode.commands.registerCommand(
        refreshTraceListCommand,
        () => traceProvider.refresh()
    ));

    // register commands to set and get the trace folder
    context.subscriptions.push(vscode.commands.registerCommand(
        setTraceFolderCommand,
        async function(value: string | undefined) {
            traceView.setTraceFolder(context, value ? vscode.Uri.parse(value) : undefined);
        }
    ));
    context.subscriptions.push(vscode.commands.registerCommand(
        getTraceFolderCommand,
        function(): vscode.Uri | undefined { return traceView.getTraceFolder(context); }
    ));
    context.subscriptions.push(vscode.commands.registerCommand(
        getTraceFolderDialogCommand,
        async function() { traceView.setTraceFolderDialog(context); }
    ));
    context.subscriptions.push(vscode.commands.registerCommand(
        showTraceFolderCommand,
        async function() { traceView.showTraceFolder(context); }
    ));

    // register commands to set and get the trace name
    context.subscriptions.push(vscode.commands.registerCommand(
        setTraceNameCommand,
        async function(value: string | undefined) { traceView.setTraceName(context, value); }
    ));
    context.subscriptions.push(vscode.commands.registerCommand(
        getTraceNameCommand,
        function(): string | undefined { return traceView.getTraceName(context); }
    ));
    context.subscriptions.push(vscode.commands.registerCommand(
        showTraceNameCommand,
        async function() { traceView.showTraceName(context); }
    ));

}

/**
 * Method used by code to deactivate the debug extension.
 */
export function deactivate() { }

/** Provide configuration data for launching the debugger. */
class ProofDebuggerConfigurationProvider implements vscode.DebugConfigurationProvider {
    /** Prepare debug configuration data just before launching the debugger. */
    resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
        config.type = debuggerType;
        config.name = debuggerName;
        config.request = 'launch';
        return config;
    }
}

/** Choose the method of running the debug adapter. */
class ProofDebuggerAdapterFactory implements vscode.DebugAdapterDescriptorFactory {
    /**
     * Run the debug adapter within code itself instead.
     *
     * Other options include running the debug adapter in a separate process.
     * Running the debug adapter within code many slow down code, but it makes
     * the debug adapter easy to debug within code.
     */
    createDebugAdapterDescriptor(_session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        return new vscode.DebugAdapterInlineImplementation(new proofDebuggerAdapter.ProofDebuggerSession());
    }
}
