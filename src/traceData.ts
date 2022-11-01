/**
 * This loads the data used to build the tree of failures used to build the tree
 * view of the failures.
 *
 * We load json blobs produced by viewer that summarize the property failures
 * found by cbmc. We produce a hierarchical tree-like summary of these failures
 * organizing these failures by file, and by functions within the file, and by
 * lines within the function.  This will become the tree view rendered by code.
 *
 * We load only the definitions of the failing properties.  Do not yet load the
 * corresponding failure traces used by this debugger.
 */

import * as vscode from 'vscode';

import {
    viewerPropertyHeaderKey, viewerPropertyKey, viewerPropertyDescriptionKey, viewerPropertyLocationKey, viewerLoopHeaderKey,
    viewerLoopKey, viewerResultHeaderKey, viewerResultKey
} from './constants';
import { TracesMissingError } from './exceptions';

/** A failure reported by viewer. */
export interface Failure {
    name: string,
    description: string
}
/** Map lines within a function to failures reported by viewer. */
export interface LineFailuresMap {
    [line: number]: Failure[]
}
/** Map functions within a file to failures reported by viewer. */
export interface FuncLineFailuresMap {
    [func: string]: LineFailuresMap
}
/** Map files to failures reported by fiewer. */
export interface FileFuncLineFailuresMap {
    [file: string]: FuncLineFailuresMap
}

/** The source location of a property checked by viewer. */
export interface Location {
    file: string,
    line: number,
    function: string,
}
/** A property definition checked by viewer. */
export interface Property {
    description: string,
    location: Location
}
/** Map property names to property definitions. */
export interface PropertyMap {
    [name: string]: Property
}

/** Load a json file containing a summary prroduced by viewer */
async function loadJsonFile(jsonFile: vscode.Uri): Promise<any> {
    let json = await vscode.workspace.openTextDocument(jsonFile);
    return JSON.parse(json.getText());
}
/**
 * Load the property summary produced by viewer.
 *
 * CBMC can list the properties it is configured to check.  This list includes
 * all such properties except for the loop unwinding assertions.  Proof debugger
 * summarizes these properties.  This function loads those summaries.
 */
async function loadPropertyFile(jsonFile: vscode.Uri): Promise<PropertyMap> {
    try {
        let blob = await loadJsonFile(jsonFile);
        let list = blob[viewerPropertyHeaderKey][viewerPropertyKey];
        let properties: PropertyMap = {};
        for (let name in list) {
            properties[name] = {
                description: list[name][viewerPropertyDescriptionKey],
                location: list[name][viewerPropertyLocationKey]
            };
        }
        return properties;
    } catch (e) {
        throw new TracesMissingError((e as Error).message);
    }
}
/**
 * Load the loop summary produced by viewer.
 *
 * CBMC can list the loops it finds in a program.  Each loop is given a name of
 * the form FUNCTION.ID.  Proof debugger summarizes this list of loops.  This function
 * loads those summaries.
 *
 * CBMC reports on a loop unwinding assertion for each loop.  The unwinding
 * assertion states that the loop has been unwound enough times to guarantee
 * that the loop has terminated.  CBMC checks these properties but does not
 * explicitly include them when it lists the properties it is configured to
 * check.  We load the list of loops and create properties for the corresponding
 * loop unwinding assertions.
 */
async function loadLoopFile(jsonFile: vscode.Uri): Promise<PropertyMap> {
    try {
        let blob = await loadJsonFile(jsonFile);
        let list = blob[viewerLoopHeaderKey][viewerLoopKey];
        let loops: PropertyMap = {};
        for (let name in list) {
            loops[name] = {
                description: 'Loop unwinding assertion',
                location: list[name]
            };
        }
        return loops;
    } catch (e) {
        throw new TracesMissingError((e as Error).message);
    }
}
/**
 * Load the property failure summary produced by viewer.
 *
 * CBMC reports the success or failure of each property and loop unwinding
 * assertion it is configured to check.  For each failure, there is a trace
 * describing how the failure can occur.  Proof debugger summarizes there results.  This
 * function loads those summaries.
 */
async function loadResultFile(jsonFile: vscode.Uri): Promise<[string]> {
    try {
        let blob = await loadJsonFile(jsonFile);
        return blob[viewerResultHeaderKey][viewerResultKey]['false'];
    } catch (e) {
        throw new TracesMissingError((e as Error).message);
    }
}

/**
 * Map a loop unwinding assertion name to a loop name.
 *
 * A loop unwinding assertion has a name of the form FUNCTION.unwind.ID, and the
 * loop itself has a name of the form FUNCTION.ID.
 */
function loopName(loopAssertionName: string): string {
    let parts = loopAssertionName.split('.');
    let idx = parts.length - 2;
    if (idx in parts && parts[idx] === 'unwind') {
        delete parts[idx];
    }
    return parts.filter(s => s).join('.');
}

/** Join the lists of failing properties and failing loop unwinding assertions into a single list. */
function failingProperties(results: [string], properties: PropertyMap, loops: PropertyMap): PropertyMap {
    let failures: PropertyMap = {};
    for (let result of results) {
        if (result in properties) {
            failures[result] = properties[result];
            continue;
        }
        if (loopName(result) in loops) {
            failures[result] = loops[loopName(result)];
            continue;
        }
        console.warn("Can't find definition for failing property ", result);
    }
    return failures;
}

/** Organize the property failures by file, by function, and by line. */
function fileFuncLineFailureMap(failures: PropertyMap): FileFuncLineFailuresMap {
    let result: FileFuncLineFailuresMap = {};

    for (let name in failures) {
        let failure = failures[name];
        let description = failure['description'];
        let file = failure['location']['file'];
        let func = failure['location']['function'];
        let line = failure['location']['line'];

        result[file] = result[file] || {};
        result[file][func] = result[file][func] || {};
        result[file][func][line] = result[file][func][line] || [];
        result[file][func][line].push({ name: name, description: description });
    }

    return result;
}

/** Create a hierarchical summary of the property failures for the tree view panel. */
export async function create(resultJson: vscode.Uri, propertyJson: vscode.Uri, loopJson: vscode.Uri): Promise<FileFuncLineFailuresMap> {
    let results = await loadResultFile(resultJson);
    let properties = await loadPropertyFile(propertyJson);
    let loops = await loadLoopFile(loopJson);

    let failures = failingProperties(results, properties, loops);

    return fileFuncLineFailureMap(failures);
}