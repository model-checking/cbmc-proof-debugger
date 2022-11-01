/**
 * This is the "debugger" being added to visual studio code.  The debug adapter
 * sits between code that this debugger.
 *
 * This "debugger" is really a "simulator" of the traces produced by cbmc and
 * summarized by viewer.  Given a trace from viewer, the simulator first
 * simulates the trace to produce a "simulator trace" consisting of "simulator
 * states" describing the states between steps of the trace.  The simulator then
 * steps forwards and backwards along the precomputed trace in response to
 * requests from visual studio code.
 */

import * as vscode from 'vscode';

import { failureStepKind, stepFailureReason } from './constants';
import { Location, Step, Frame, Stack, SimulatorState } from './simulatorState';
import { SimulatorTrace } from './simulatorTrace';
import * as state from './simulatorState';
import { Value } from './value';

/**
 * The set of breakpoints currently set in the simulator. 
 *
 * The set is represented by a map that maps a file name to the list of lines in
 * the file on which breakpoints have been established.  The file name is a
 * local path relative to the root folder of the worksapce, the same local paths
 * that appear in source locations of a trace produced by viewer.  The file
 * names sent back and forth between code and the simulator are uris for the
 * full path in the filesystem.
 */
interface Breakpoints {
    [filename: string]: number[];
}

/** 
 * The status of the simulator when the simulator is at a stopping point. 
 */
export enum Status {
    entry,
    running,
    terminated,
    failure,
    breakpoint,
    step
}

/**
 * The simulator (the debugger) being managed by the debug adapter.
 */
export class Simulator {
    /** The root of the current workspace. */
    rootFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : vscode.Uri.file('.');
    /** The name of the folder containing the trace data for the traces being debugged. */
    traceFolder: vscode.Uri = vscode.Uri.parse('.');
    /** The name of the trace being debugged. */
    traceName: string = '';
    /** The trace being debugged. */
    trace: SimulatorTrace = new SimulatorTrace();
    /** The index of the current state in the trace being debugged. */
    index: number = 0;
    /** The set of breakpoints currently set in the trace being debugged. */
    breakpoints: Breakpoints = {};
    /** The output channel used to communicate debug information to the user. */
    output: vscode.OutputChannel | undefined;

    /** Construct the simulator (the debugger) being managed by the debug adapter. */
    constructor(output?: vscode.OutputChannel) {
        this.output = output;
    }

    /** The current state in the trace just before taking the current step in the trace. */
    private currentState(): SimulatorState {
        return this.trace.state[this.index];
    }
    /** The current step in the trace.  */
    private currentStep(): Step {
        return this.currentState().step;
    }
    /** The source location for the current step in the trace. */
    private currentLocation(): Location {
        return this.currentState().location;
    }
    /** The stack in the current state of the trace. */
    private currentStack(): Stack {
        return this.currentState().stack;
    }
    /** Is the current step in the trace is hidden? */
    private currentIsHidden(): boolean {
        return this.currentState().isHidden;
    }
    /** Has the trace terminated before the current state? */
    private currentHasTerminated(): boolean {
        return this.currentState().hasTerminated;
    }
    /** Has the trace failed before the current state? */
    private currentHasFailed(): boolean {
        return this.currentState().hasFailed;
    }
    /** The string to be printed to the output channel after the current step. */
    private currentOutput(): string {
        return this.currentState().output;
    }

    /** Is the current step a failure step? */
    private atFailure(step: Step): boolean {
        if (step.kind === failureStepKind) {
            vscode.window.showErrorMessage(`Failure: ${step.detail[stepFailureReason]}`);
            return true;
        }
        return false;
    }
    /** Is a breakpoint set at the source location of the current step? */
    private atBreakpoint(step: Step): boolean {
        let file = step.location.file;
        let line = step.location.line;
        return file in this.breakpoints && this.breakpoints[file].includes(line);
    }

    /** Do two source locations represent the same location in the source code?  */
    private isSameLocation(loc1: Location, loc2: Location): boolean {
        return loc1.file === loc2.file && loc1.line === loc2.line;
    }

    /**
     * Start the simulator on a trace.  Load the viewer trace identified by a
     * traceFolder and a traceName, and simulate the viewer trace to produce a
     * simulator trace to drive the simulator.
     */
    async launch(traceFolder: vscode.Uri, traceName: string) {
        this.traceFolder = traceFolder;
        this.traceName = traceName;

        await this.trace.load(traceFolder, traceName);
        this.trace.simulate();
        this.stepOverHiddenSteps();
        if (this.output) {
            this.output.show(true);
            this.output.clear();
        }
    }

    /**
     * Step forward to the next source line, advancing over steps that come from
     * the current source line and over hidden steps, but stopping at
     * breakpoints, failures, and terminations.  Return a status that gives the
     * reason for stopping.
     */
    stepForward(): Status {
        let status = Status.step;
        let loc = this.currentLocation();

        while (true) {
            let output = this.currentOutput();
            if (this.output && output) {
                this.output.show(true);
                this.output.appendLine(output);
            }

            this.index = this.index + 1;

            if (this.index >= this.trace.state.length) {
                this.index = this.trace.state.length - 1;
                status = Status.terminated;
                break;
            }

            if (this.currentHasTerminated()) {
                status = Status.terminated;
                break;
            }

            if (this.currentHasFailed()) {
                status = Status.failure;
                break;
            }

            if (this.atBreakpoint(this.currentStep())) {
                status = Status.breakpoint;
                break;
            }

            if (!this.currentIsHidden() &&
                !this.isSameLocation(loc, this.currentLocation())) {
                break;
            }
        }

        this.atFailure(this.currentStep());
        return status;
    }
    /**
     * Step backwards to the previous source line, backing over steps that come
     * from the current source line and over hidden steps, but stopping at entry
     * (the start of the trace), breakpoints, failures, and terminations.
     * Return a status that gives the reason for stopping.
     */
    stepBackward(): Status {
        let status = Status.step;
        let loc = this.currentLocation();

        while (true) {
            this.index = this.index - 1;

            if (this.index < 0) {
                this.index = 0;
                status = Status.entry;
                break;
            }

            if (this.currentHasTerminated()) {
                status = Status.terminated;
                break;
            }

            if (this.currentHasFailed()) {
                status = Status.failure;
                break;
            }

            if (this.atBreakpoint(this.currentStep())) {
                status = Status.breakpoint;
                break;
            }

            if (!this.currentIsHidden() &&
                !this.isSameLocation(loc, this.currentLocation())) {
                break;
            }
        }

        if (this.currentIsHidden()) {
            this.stepOverHiddenSteps();
        }
        this.atFailure(this.currentStep());
        return status;
    }

    /**
     * Step forward over zero or more hidden steps. Return a status that gives
     * the reason for stopping.
     */
    stepOverHiddenSteps(): Status {
        if (this.currentIsHidden()) {
            return this.stepForward();
        }
        return Status.step;
    }

    /**
     * Step forward until reaching a breakpoint, failure, or termination step.
     */
    continueForward(): Status {
        while (true) {
            let status = this.stepForward();
            if ([Status.failure, Status.breakpoint, Status.terminated].includes(status)) { return status; }
        }
    }

    /**
     * Step backaward until reaching the start of the trace or reaching a
     * breakpoint, failure or termination step.
     */
    continueBackward(): Status {
        while (true) {
            let status = this.stepBackward();
            if ([Status.entry, Status.failure, Status.breakpoint, Status.terminated].includes(status)) { return status; }
        }
    }

    /**
     * Step over a function call
     */
    stepOver(): Status {
        let depth = this.currentStack().depth();
        while (true) {
            let status = this.stepForward();
            if ([Status.failure, Status.breakpoint, Status.terminated].includes(status)) { return status; }
            if (this.currentStack().depth() <= depth) { return status; }
        }

    }

    /**
     * Step out of a function call
     */
    stepOut(): Status {
        let depth = this.currentStack().depth();
        while (true) {
            let status = this.stepForward();
            if ([Status.failure, Status.breakpoint, Status.terminated].includes(status)) { return status; }
            if (this.currentStack().depth() < depth) { return status; }
        }

    }

    /**
     * Set breakpoints in a given source file at the given line numbers.  The path is a
     * string representing a full path to the source file in the file system.
     */
    setBreakpoints(path: string, lines: number[]): boolean[] {
        let localPath = vscode.workspace.asRelativePath(path, false);
        this.breakpoints[localPath] = this.breakpoints[localPath] || [];
        this.breakpoints[localPath] = lines;
        return lines.map(line => true);
    }

    /**
     * List the breakpoints in a given source file between the given line
     * numbers.  The path is a string representing a full path to the source
     * file in the file system.
     */
    listBreakpoints(path: string, lineStart: number, lineEnd: number): number[] {
        let localPath = vscode.workspace.asRelativePath(path, false);
        if (localPath in this.breakpoints) {
            return this.breakpoints[localPath].filter(
                line => lineStart <= line && line <= lineEnd
            );
        }
        return [];
    }

    /**
     * The list of stack frames in the current state.
     *
     * Stack frames are listed from the top of the stack down. The current stack
     * frame is the head of the list.
     */
    stackFrames(): Frame[] {
        return this.currentStack().frames;
    }

    /** Get the stack frame with the given frame id in the current state. */
    getStackFrameById(id: number): Frame | undefined {
        return this.currentStack().getFrameById(id);
    }
    /**  Get the variables in the stack frame with the given frame id in the current state. */
    getVariablesInFrame(id: number): state.Variable[] {
        return this.currentStack().getVariablesInFrame(id);
    }

    /** Insert a value tagged with the value's id into the current state's value cache. */
    setCache(id: number, mem: Value) {
        return this.currentState().setCache(id, mem);
    }
    /** Get the value tagged with the given value id from the current state's value cache. */
    getCache(id: number): Value | undefined {
        return this.currentState().getCache(id);
    }
    /** Get the list of named or indexed components of the value with the given id in the cache. */
    getVariables(id: number): state.Variable[] {
        return this.currentState().getVariables(id);
    }

}