/**
 * This is a simulator trace produced by the simulator for the debug adapter.
 */

import * as vscode from 'vscode';

import {
    staticFrameName, heapFrameName, functionCallStepKind, functionReturnStepKind, parameterAssignmentStepKind, variableAssignmentStepKind, failureStepKind,
    viewerTraceFile, viewerTraceHeaderKey, viewerTracesKey, stepAssignLhsKey, stepAssignRhsKey, stepAssignLhsPathKey
} from './constants';
import { TracesMissingError } from './exceptions';
import { Location, Frame, SimulatorState, Step } from './simulatorState';

/**
 * A trace of the simulator.
 */
export class SimulatorTrace {
    state: SimulatorState[];
    hasTerminated: boolean;

    constructor() {
        this.state = [];
        this.hasTerminated = false;
    }

    /**
     * Load data for a single trace produced by viewer.  The traceFolder and traceName
     * are typically selected from within code by loading traces into the viewer
     * panel and selecting the desired trace.
     */
    async load(traceFolder: vscode.Uri, traceName: string) {
        try {
            let blob = await loadJsonFile(vscode.Uri.joinPath(traceFolder, viewerTraceFile));
            for (let step of blob[viewerTraceHeaderKey][viewerTracesKey][traceName]) {
                this.state.push(new SimulatorState(step));
            }
        } catch (e) {
            throw new TracesMissingError((e as Error).message);
        }
    }



    /**
     * Simulate a loaded trace and produce a trace for the simulator.
     */
    simulate() {
        let loc = firstVisibleLocation(this.state);
        if (this.state.length > 0) {
            this.state[0].stack.push(new Frame(heapFrameName, loc.file, loc.line));
            this.state[0].stack.push(new Frame(staticFrameName, loc.file, loc.line));
        }
        for (let idx in this.state) {
            this.simulateStep(parseInt(idx));
        }
        // Hide states with a current location that can't be displayed
        for (let index in this.state) {
            let idx = parseInt(index);
            if (this.state[idx].stack.frames.length === 0 ||
                !this.state[idx].stack.frames[0].file ||
                !this.state[idx].stack.frames[0].function) {
                this.state[idx].isHidden = true;
            }
        }
        // Hide states before the first visible function call
        for (let index in this.state) {
            let idx = parseInt(index);
            if (!this.state[idx].isHidden && this.state[idx].step.kind === functionCallStepKind) {
                this.state[idx].isHidden = true;
                break;
            }
            this.state[idx].isHidden = true;
        }
        // ensure that the trace terminates.
        // the final step of a trace is the final return popping the
        // final stack frame off the stack.  check with an assert?
        this.state[this.state.length - 1].hasTerminated = true;
    }

    /**
     * Simulate a single step in a loaded trace.
     */
    private simulateStep(idx: number) {
        this.state[idx].hasTerminated = this.hasTerminated;

        let step = this.state[idx].step;
        let stack = this.state[idx].stack;

        // Set the program counter in the current stack frame to the source
        // location in the trace.
        if (step.kind !== parameterAssignmentStepKind) {
            // The parameter assignments follows a function call in a trace. We
            // push a new frame onto the stack for the function call, but the
            // source locations associated with the following parameter
            // assignments refer to the calling site and not the function.
            stack.setLocation(step.location);
            this.state[idx].stack = stack;
        }
        let stackNext = stack.clone();

        switch (step.kind) {
            case functionCallStepKind: {
                let loc: Location = step.detail.location;
                let func: string = loc.function || step.detail.name;  // loc.function may be null
                stackNext.push(new Frame(func, loc.file, loc.line));
                break;
            }
            case functionReturnStepKind: {
                stackNext.pop();
                break;
            }
            case variableAssignmentStepKind:
            case parameterAssignmentStepKind: {
                let lhs = step.detail[stepAssignLhsKey];
                let rhs = step.detail[stepAssignRhsKey];
                let lhsPath = step.detail[stepAssignLhsPathKey];
                this.state[idx].output = `${lhs} = ${rhs}`;
                stackNext.addAssignment(lhsPath, lhs, rhs);
                break;
            }
            case failureStepKind: {
                this.state[idx].hasFailed = true;
            }
            default: {
                break;
            }
        }
        if (idx + 1 < this.state.length) {
            this.state[idx + 1].stack = stackNext;
        }
    }
}

/**
 * Load a json file containing a trace.
 */
async function loadJsonFile(jsonFile: vscode.Uri): Promise<any> {
    let json = await vscode.workspace.openTextDocument(jsonFile);
    return JSON.parse(json.getText());
}

/**
 * First step location that can be displayed in visual studio
 */
function firstVisibleLocation(states: SimulatorState[]): Location {
    function isVisibleStep(step: Step): boolean {
        return !!step.location.function && !!step.location.file && !!step.location.line;
    }
    function isVisibleState(state: SimulatorState): boolean {
        return !state.isHidden && isVisibleStep(state.step);
    }
    let visible = states.filter(isVisibleState);
    if (visible.length > 0) {
        return visible[0].step.location;
    }
    return { function: '', file: '', line: 0 };
}