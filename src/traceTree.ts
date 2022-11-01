/**
 * This is the tree of failures that we use to implement the tree data provider
 * that code uses to create the hierarchical view of failures shown to the user.
 * We define a node for each failure, and organize the nodes into a tree.  
 *
 * The tree view lists files, lists functions within the file, lists lines
 * within the file, and lists errors occurring on that line.  Open a file by
 * clicking on the file name, open a file at a line number by clicking on the
 * line number, and set the trace to debug by clicking on the error trace
 * description.
 */

import * as vscode from 'vscode';

import { setTraceNameCommand } from './constants';
import * as failureMap from './traceData';

export class FailureNode extends vscode.TreeItem {
    file: string | undefined;
    func: string | undefined;
    line: string | undefined;
    name: string | undefined;
    description: string | undefined;
    children: FailureNode[];

    constructor(children: FailureNode[], label: string, file?: string, func?: string, line?: string, name?: string, description?: string) {
        let state = vscode.TreeItemCollapsibleState.Expanded;
        super(label, state);

        this.file = file;
        this.func = func;
        this.line = line;
        this.name = name;
        // this.description = description;
        this.children = children || [];

        this.tooltip = [file, func, line].filter(n => n).join('::') || 'Root';
    }
}

export function create(failures: failureMap.FileFuncLineFailuresMap): FailureNode {
    let children: FailureNode[] = [];
    for (let file in failures) { children.push(fileSubtree(failures[file], file)); }
    return new FailureNode(children, 'Root');
}

function fileSubtree(failures: failureMap.FuncLineFailuresMap, file: string): FailureNode {
    let children: FailureNode[] = [];
    for (let func in failures) { children.push(funcSubtree(failures[func], file, func)); }
    let node = new FailureNode(children, `File ${file}`, file);

    node.command = openFileCmd(file);
    return node;
}

function funcSubtree(failures: failureMap.LineFailuresMap, file: string, func: string): FailureNode {
    let children: FailureNode[] = [];
    for (let line in failures) { children.push(lineSubtree(failures[line], file, func, line)); }
    let node = new FailureNode(children, `Function ${func}`, file, func);

    node.command = openFileCmd(file);
    return node;
}

function lineSubtree(failures: failureMap.Failure[], file: string, func: string, line: string): FailureNode {
    let children: FailureNode[] = [];
    for (let failure of failures) { children.push(failureDesc(failure, file, func, line)); }
    let node = new FailureNode(children, `Line ${line}`, file, func, line);

    node.command = openFileCmd(file, line);
    return node;
}

function failureDesc(failure: failureMap.Failure, file: string, func: string, line: string): FailureNode {
    let node = new FailureNode(
        [],
        `${failure['description']} (${failure['name']})`,
        file,
        func,
        line,
        failure['name'],
        failure['description']
    );

    node.command = setTraceNameCmd(failure['name']);
    node.collapsibleState = vscode.TreeItemCollapsibleState.None;
    return node;
}

function openFileCmd(file: string, line?: string): vscode.Command {
    let args: any[] = [];

    let rootUri = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : vscode.Uri.file('.');
    let fileUri = vscode.Uri.joinPath(rootUri, file);
    args.push(fileUri);

    if (line) {
        let lineNum = parseInt(line) - 1; // vscode lines are 0 based
        let options: vscode.TextDocumentShowOptions = { 'selection': new vscode.Range(lineNum, 0, lineNum, 10000) };
        args.push(options);
    }

    return { title: 'Open in editor', command: 'vscode.open', arguments: args };
}

function setTraceNameCmd(name: string): vscode.Command {
    return { title: 'Set trace name', command: setTraceNameCommand, arguments: [name] };
}
